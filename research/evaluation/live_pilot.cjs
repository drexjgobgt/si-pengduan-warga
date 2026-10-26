// Bounded pilot authorized using user dashboard evidence of Free-Pro 0x / Rp0.
const fs=require('node:fs'),path=require('node:path');
const {hash,validateDataset,parseRaw,strictValid,MAPPING}=require('./lib.cjs');
const backend=path.resolve(__dirname,'../../backend');
const out=path.join(__dirname,'live_pilot');
const args=process.argv.slice(2);
if(args.some(a=>a!=='--resume'))throw new Error('Unknown option');
const resume=args.includes('--resume');
const datasetFile=path.join(__dirname,'dataset.provisional.json');
const bytes=fs.readFileSync(datasetFile),rows=validateDataset(JSON.parse(bytes)).filter(r=>r.split==='pilot_candidate');
if(rows.length!==18)throw new Error('Expected frozen 18 candidate pilot');
require(path.join(backend,'node_modules/dotenv')).config({path:path.join(backend,'.env'),quiet:true});
const {KIOSAPI_CONFIG:c}=require(path.join(backend,'config/kiosApi'));
if(c.classificationModel!=='deepseek-v4-flash-free'||c.baseUrl!=='https://kiosapi.com/v1'||!c.freeOnly||!c.apiKey)throw new Error('Unexpected config; blocked');
const config={dataset_sha256:hash(bytes),service_sha256:hash(fs.readFileSync(path.join(backend,'services/classificationService.js'))),
 provider_sha256:hash(fs.readFileSync(path.join(backend,'config/kiosApi.js'))),harness_sha256:hash(fs.readFileSync(__filename)),
 validator_sha256:hash(fs.readFileSync(path.join(__dirname,'lib.cjs'))),model:c.classificationModel,max_tokens:c.classificationMaxTokens,
 timeout_ms:c.requestTimeoutMs,temperature:0.1,max_requests:18,retries:0,interval_ms:3000,hard_deadline_ms:20000,
 catalog:'production defaults; pool=null',money_budget_idr:0,billing_basis:'user screenshot Free-Pro 0x Rp0 matching previous smoke; future debit not observable via API',
 quota_remaining:'unavailable; stop on 429',label_status:'AI provisional; not independently validated'};
const configHash=hash(JSON.stringify(config));
const originalFetch=global.fetch;let stopped=false,attempts=0,lastStart=0;
process.on('SIGINT',()=>{stopped=true;});process.on('SIGTERM',()=>{stopped=true;});
function save(file,value){const fd=fs.openSync(file,'wx');try{fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
async function main(){
 if(fs.existsSync(out)!==resume)throw new Error('Use fresh run or explicit resume only');
 fs.mkdirSync(out,{recursive:true});const lock=path.join(out,'.lock');save(lock,{pid:process.pid});
 try{
  const manifest=path.join(out,'manifest.json');
  if(resume){if(JSON.parse(fs.readFileSync(manifest)).config_hash!==configHash)throw new Error('Resume mismatch');}
  else save(manifest,{...config,config_hash:configHash,created_at:new Date().toISOString(),evidence_kind:'ACTUAL_LLM_SYNTHETIC_PROVISIONAL_PILOT'});
  const {classifyComplaint}=require(path.join(backend,'services/classificationService'));
  for(const row of rows){
   if(stopped)break;
   const file=path.join(out,`${row.sample_id}.json`),pending=file+'.pending';
   if(fs.existsSync(file)){const r=JSON.parse(fs.readFileSync(file));if(r.config_hash!==configHash)throw new Error('Checkpoint mismatch');continue;}
   if(fs.existsSync(pending))throw new Error('Uncertain attempt; no replay allowed');
   const existing=fs.readdirSync(out).filter(n=>/^SIPW-CAND-.*\.json$/.test(n)).length;
   if(existing>=18)throw new Error('Request cap reached');
   await new Promise(resolve=>setTimeout(resolve,Math.max(0,3000-(Date.now()-lastStart))));
   if(stopped)break;
   save(pending,{sample_id:row.sample_id,timestamp:new Date().toISOString(),config_hash:configHash});
   const captured={http_status:null,raw_content:null,provider_model:null,usage:null,request:null,error_type:null};
   global.fetch=async(url,options)=>{
    if(captured.request)throw new Error('Duplicate request forbidden');
    if(url!=='https://kiosapi.com/v1/chat/completions')throw new Error('Unexpected endpoint');
    const payload=JSON.parse(options.body);
    if(payload.model!==config.model)throw new Error('Model switch forbidden');
    captured.request={model:payload.model,messages:payload.messages,temperature:payload.temperature,max_tokens:payload.max_tokens,response_format:payload.response_format};
    attempts++;lastStart=Date.now();
    try{
     const response=await originalFetch(url,{...options,signal:AbortSignal.any([options.signal,AbortSignal.timeout(20000)])});
     captured.http_status=response.status;
     // Read body within the fetch deadline, then replay to production adapter.
     const text=await response.text();
     let body;try{body=JSON.parse(text);}catch{captured.error_type='PROVIDER_INVALID_JSON';}
     if(response.ok&&body){
      captured.raw_content=typeof body.choices?.[0]?.message?.content==='string'?body.choices[0].message.content.split(c.apiKey).join('[REDACTED]'):null;
      captured.provider_model=typeof body.model==='string'?body.model:null;
      captured.finish_reason=body.choices?.[0]?.finish_reason??null;
      // Persist numeric usage only; no arbitrary provider headers or error bodies.
      if(body.usage)captured.usage=Object.fromEntries(['prompt_tokens','completion_tokens','total_tokens','cost'].filter(k=>typeof body.usage[k]==='number').map(k=>[k,body.usage[k]]));
     }
     if([401,402,403,404,429].includes(response.status))stopped=true;
     return new Response(text,{status:response.status,headers:{'Content-Type':'application/json'}});
    }catch(e){captured.error_type=['AbortError','TimeoutError'].includes(e.name)?'TIMEOUT':'NETWORK_ERROR';throw e;}
   };
   const start=performance.now();const savedError=console.error;let result;
   try{console.error=()=>{};result=await classifyComplaint(row.title,row.description,null);}finally{console.error=savedError;global.fetch=originalFetch;}
   const raw=parseRaw(captured.raw_content),value=raw.value;
   const fallback=[];
   if(result.classificationSource==='manual_fallback')fallback.push('service_manual_fallback');
   else{
    if(!Object.hasOwn(MAPPING,String(value?.category||'').trim().toLowerCase()))fallback.push('category_replacement');
    if(!Object.values(MAPPING).includes(String(value?.suggestedDepartment||'').trim().toUpperCase()))fallback.push('department_replacement_or_name_resolution');
    if(!['rendah','normal','tinggi','darurat'].includes(String(value?.suggestedPriority||'normal').trim().toLowerCase()))fallback.push('priority_replacement');
    if(Number.isNaN(parseInt(value?.confidence,10)))fallback.push('confidence_imputation');
   }
   save(file,{sample_id:row.sample_id,config_hash:configHash,evidence_kind:'ACTUAL_LLM_SYNTHETIC_PROVISIONAL_PILOT',
    ground_truth_category:row.ground_truth_category,ground_truth_department:row.ground_truth_department,
    label_validation_status:row.label_validation_status,department_label_origin:row.department_label_origin,
    raw_predicted_category:value?.category??null,final_predicted_category:result.category,
    raw_suggested_department:value?.suggestedDepartment??null,final_suggested_department:result.suggestedDepartment,
    secondary_categories:result.secondaryCategories,suggested_priority:result.suggestedPriority,reason:result.reason,
    confidence:result.confidence,raw_confidence:value?.confidence??null,needs_human_review:result.needsHumanReview,
    fallback_applied:fallback.length>0,fallback_reasons:fallback,output_valid:strictValid(value),parse_mode:raw.parse_mode,
    latency_ms:performance.now()-start,request_status:result.status,
    error_type:captured.error_type||(captured.http_status>=400?`HTTP_${captured.http_status}`:result.status!=='success'?'INVALID_OUTPUT':null),
    model_id:captured.provider_model,model_id_source:captured.provider_model?'provider_returned':'unavailable',
    configured_model:config.model,prompt_version:hash(JSON.stringify(captured.request?.messages.filter(m=>m.role==='system'))),
    timestamp:new Date().toISOString(),routing_department_simulated:MAPPING[result.category]??null,routing_persisted:false,
    http_status:captured.http_status,request:captured.request,raw_content:captured.raw_content,usage:captured.usage,
    finish_reason:captured.finish_reason??null,account_charge_idr:null,account_charge_verification:'requires post-run dashboard reconciliation'});
   fs.unlinkSync(pending);
   console.log(JSON.stringify({sample_id:row.sample_id,status:result.status,http_status:captured.http_status,category:result.category,attempts_this_process:attempts}));
   if(captured.provider_model&&captured.provider_model!=='self-dploy/DeepSeek-V4-Flash')stopped=true;
  }
  console.log(JSON.stringify({completed_files:fs.readdirSync(out).filter(n=>/^SIPW-CAND-.*\.json$/.test(n)).length,requests_this_process:attempts,stopped}));
 }finally{global.fetch=originalFetch;fs.unlinkSync(lock);}
}
main().catch(()=>{console.error('Pilot stopped safely; inspect checkpoints before resuming.');process.exitCode=1;});
