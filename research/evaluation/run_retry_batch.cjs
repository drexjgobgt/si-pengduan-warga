// Protocol v2: remaining 16 candidates, bounded retry, sequential, no DB writes.
const fs=require('node:fs'),path=require('node:path');
const {hash,validateDataset,parseRaw,strictValid,MAPPING}=require('./lib.cjs');
const {retryAfterMs,classifyFailure,backoffMs}=require('./retry_policy.cjs');
const root=__dirname,backend=path.resolve(root,'../../backend'),out=path.join(root,'live_pilot_retry_v2');
const args=process.argv.slice(2);if(args.some(a=>a!=='--resume'))throw new Error('Unknown option');const resume=args.includes('--resume');
const datasetBytes=fs.readFileSync(path.join(root,'dataset.provisional.json'));
const rows=validateDataset(JSON.parse(datasetBytes)).filter(r=>r.split==='pilot_candidate'&&r.sample_id>='SIPW-CAND-0012');
if(rows.length!==16)throw new Error('Unexpected remaining sample count');
require(path.join(backend,'node_modules/dotenv')).config({path:path.join(backend,'.env'),quiet:true});
const {KIOSAPI_CONFIG:c}=require(path.join(backend,'config/kiosApi'));
if(c.baseUrl!=='https://kiosapi.com/v1'||c.classificationModel!=='deepseek-v4-flash-free'||!c.freeOnly||!c.apiKey||c.classificationMaxTokens!==500||c.requestTimeoutMs!==15000)throw new Error('Config mismatch');
const config={protocol:'pilot_retry_v2',sample_ids:rows.map(r=>r.sample_id),dataset_sha256:hash(datasetBytes),
 harness_sha256:hash(fs.readFileSync(__filename)),policy_sha256:hash(fs.readFileSync(path.join(root,'retry_policy.cjs'))),
 service_sha256:hash(fs.readFileSync(path.join(backend,'services/classificationService.js'))),provider_sha256:hash(fs.readFileSync(path.join(backend,'config/kiosApi.js'))),
 validator_sha256:hash(fs.readFileSync(path.join(root,'lib.cjs'))),max_attempts_per_sample:3,max_total_requests:48,
 minimum_request_spacing_ms:10000,backoff_ms:[30000,60000],maximum_provider_wait_ms:300000,maximum_session_ms:2700000,
 model:c.classificationModel,temperature:.1,max_tokens:500,production_timeout_ms:15000,hard_deadline_ms:20000,
 money_budget_idr:0,price_evidence:'user catalog screenshot input/output/cache Rp0 and matching prior dashboard Rp0',
 billing_debit_observable:false,remaining_provider_quota:null,catalog:'production default pool=null',
 labeling:'AI provisional; no independent human validation',authorization:'user requested continue, retries and continue past transient failures; safety caps applied'};
const configHash=hash(JSON.stringify(config)),fetchOriginal=global.fetch;
let stop=false,interrupt=false,lastStart=0;process.on('SIGINT',()=>{interrupt=true;});process.on('SIGTERM',()=>{interrupt=true;});
function save(file,value){const fd=fs.openSync(file,'wx');try{fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
async function wait(ms){const until=Date.now()+ms;while(Date.now()<until&&!interrupt)await new Promise(r=>setTimeout(r,Math.min(1000,until-Date.now())));}
async function main(){
 if(fs.existsSync(out)!==resume)throw new Error('Output exists or resume target absent');fs.mkdirSync(out,{recursive:true});
 const lock=path.join(out,'.lock');save(lock,{pid:process.pid});const began=Date.now();
 try{
  const manifest=path.join(out,'manifest.json');
  if(resume){if(JSON.parse(fs.readFileSync(manifest)).config_hash!==configHash)throw new Error('Config mismatch');}
  else save(manifest,{...config,config_hash:configHash,created_at:new Date().toISOString()});
  const {classifyComplaint}=require(path.join(backend,'services/classificationService'));
  for(const row of rows){
   if(stop||interrupt)break;
   const existing=fs.readdirSync(out).filter(n=>n.startsWith(row.sample_id+'.attempt-')&&n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(out,n)))).sort((a,b)=>a.attempt-b.attempt);
   if(existing.some(r=>r.config_hash!==configHash))throw new Error('Checkpoint mismatch');
   if(existing.length && (existing.at(-1).request_status==='success'||existing.length===3||existing.at(-1).failure_class!=='retryable'))continue;
   if(existing.length)await wait(Math.max(0,Date.parse(existing.at(-1).timestamp)+existing.at(-1).next_wait_ms-Date.now()));
   for(let attempt=existing.length+1;attempt<=3&&!stop&&!interrupt;attempt++){
    const all=fs.readdirSync(out);
    if(all.some(n=>n.endsWith('.pending')))throw new Error('Uncertain attempt: reconciliation required, no replay');
    if(all.filter(n=>/\.attempt-\d\.json$/.test(n)).length>=48||Date.now()-began>2700000){stop=true;break;}
    await wait(Math.max(0,10000-(Date.now()-lastStart)));if(interrupt)break;
    const file=path.join(out,`${row.sample_id}.attempt-${attempt}.json`),pending=file+'.pending';
    save(pending,{sample_id:row.sample_id,attempt,at:new Date().toISOString()});
    const captured={http_status:null,raw_content:null,model_id:null,usage:null,request:null,error_type:null,retry_after_ms:null};let fetches=0;
    global.fetch=async(url,options)=>{
     if(++fetches!==1||url!=='https://kiosapi.com/v1/chat/completions')throw new Error('Request guard');
     const p=JSON.parse(options.body);if(p.model!==config.model)throw new Error('Model switch forbidden');
     captured.request={model:p.model,messages:p.messages,temperature:p.temperature,max_tokens:p.max_tokens,response_format:p.response_format};lastStart=Date.now();
     try{
      const response=await fetchOriginal(url,{...options,signal:AbortSignal.any([options.signal,AbortSignal.timeout(20000)])});captured.http_status=response.status;
      captured.retry_after_ms=retryAfterMs(response.headers.get('retry-after'));
      const text=await response.text();let body;try{body=JSON.parse(text);}catch{captured.error_type='PROVIDER_INVALID_JSON';}
      if(response.ok&&body){captured.raw_content=typeof body.choices?.[0]?.message?.content==='string'?body.choices[0].message.content.split(c.apiKey).join('[REDACTED]'):null;
       captured.model_id=typeof body.model==='string'?body.model:null;captured.finish_reason=body.choices?.[0]?.finish_reason??null;
       if(body.usage)captured.usage=Object.fromEntries(['prompt_tokens','completion_tokens','total_tokens','cost'].filter(k=>typeof body.usage[k]==='number').map(k=>[k,body.usage[k]]));}
      return new Response(text,{status:response.status,headers:{'Content-Type':'application/json'}});
     }catch(e){captured.error_type=['AbortError','TimeoutError'].includes(e.name)?'TIMEOUT':'NETWORK_ERROR';throw e;}
    };
    const start=performance.now(),oldError=console.error;let result;
    try{console.error=()=>{};result=await classifyComplaint(row.title,row.description,null);}finally{console.error=oldError;global.fetch=fetchOriginal;}
    const parsed=parseRaw(captured.raw_content),raw=parsed.value;
    const error=captured.error_type||(captured.http_status>=400?`HTTP_${captured.http_status}`:result.status!=='success'?'INVALID_OUTPUT':null);
    const failureClass=classifyFailure(captured.http_status,error),nextWait=backoffMs(attempt,captured.retry_after_ms);
    const reasons=[];
    if(result.classificationSource==='manual_fallback')reasons.push('service_manual_fallback');
    else{if(!Object.hasOwn(MAPPING,String(raw?.category||'').trim().toLowerCase()))reasons.push('category_replacement');
     if(!Object.values(MAPPING).includes(String(raw?.suggestedDepartment||'').trim().toUpperCase()))reasons.push('department_replacement_or_name_resolution');
     if(!['rendah','normal','tinggi','darurat'].includes(String(raw?.suggestedPriority||'normal').trim().toLowerCase()))reasons.push('priority_replacement');
     if(Number.isNaN(parseInt(raw?.confidence,10)))reasons.push('confidence_imputation');}
    const record={sample_id:row.sample_id,attempt,config_hash:configHash,protocol:config.protocol,evidence_kind:'ACTUAL_LLM_SYNTHETIC_PROVISIONAL_PILOT',
     ground_truth_category:row.ground_truth_category,ground_truth_department:row.ground_truth_department,label_validation_status:row.label_validation_status,
     raw_predicted_category:raw?.category??null,final_predicted_category:result.category,raw_suggested_department:raw?.suggestedDepartment??null,final_suggested_department:result.suggestedDepartment,
     secondary_categories:result.secondaryCategories,suggested_priority:result.suggestedPriority,reason:result.reason,confidence:result.confidence,raw_confidence:raw?.confidence??null,
     needs_human_review:result.needsHumanReview,fallback_applied:reasons.length>0,fallback_reasons:reasons,output_valid:strictValid(raw),parse_mode:parsed.parse_mode,
     latency_ms:performance.now()-start,request_status:result.status,error_type:error,failure_class:failureClass,next_wait_ms:nextWait,
     prompt_version:hash(JSON.stringify(captured.request?.messages.filter(m=>m.role==='system'))),timestamp:new Date().toISOString(),...captured,
     model_id_source:captured.model_id?'provider_returned':'unavailable',configured_model:config.model,routing_department_simulated:MAPPING[result.category]??null,routing_persisted:false,
     account_charge_idr:null,account_charge_verification:'requires dashboard reconciliation'};
    // Keep derived error_type; captured.error_type can be null for HTTP failures.
    record.error_type=error;save(file,record);fs.unlinkSync(pending);
    console.log(JSON.stringify({sample_id:row.sample_id,attempt,status:result.status,http_status:captured.http_status,category:result.category,error_type:error}));
    if(failureClass==='fatal'||(captured.model_id&&captured.model_id!=='self-dploy/DeepSeek-V4-Flash')||captured.retry_after_ms>300000){stop=true;break;}
    if(result.status==='success'||failureClass!=='retryable'||attempt===3)break;
    await wait(nextWait);
   }
  }
  console.log(JSON.stringify({status:stop?'SAFETY_STOP':interrupt?'INTERRUPTED':'BATCH_FINISHED',attempt_records:fs.readdirSync(out).filter(n=>/\.attempt-\d\.json$/.test(n)).length}));
 }finally{global.fetch=fetchOriginal;fs.unlinkSync(lock);}
}
main().catch(()=>{global.fetch=fetchOriginal;console.error('Retry batch stopped safely; inspect checkpoint before resume.');process.exitCode=1;});
