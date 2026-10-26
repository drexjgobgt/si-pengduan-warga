// Bounded exploratory study; synthetic text and AI-provisional labels only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {validateDataset,parseRaw,strictValid,MAPPING}=require('../lib.cjs');
const root=__dirname,backend=path.resolve(root,'../../../backend'),out=path.join(root,'exploratory_run_v1');
const model='minimax-m3.1-flash-free',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const bytes=fs.readFileSync(path.join(root,'dataset.candidate.json'));
const rows=validateDataset(JSON.parse(bytes)),ref=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
const labels=['A','B'].map(k=>{const buf=fs.readFileSync(path.join(root,`rater_${k}_completed.json`));return {data:JSON.parse(buf),digest:hash(buf)};});
if(rows.length!==27||hash(bytes)!==ref.candidate_sha256||labels.some(({data})=>!data.completed||data.dataset_sha256!==hash(bytes)||data.rows.length!==27))throw Error('Dataset/labels mismatch');
for(const row of rows){if(labels.some(({data})=>{const r=data.rows.find(v=>v.sample_id===row.sample_id);return !r||r.title!==row.title||r.description!==row.description||r.category_label!==labels[0].data.rows.find(v=>v.sample_id===row.sample_id).category_label;}))throw Error('Unresolved main label');}
const args=process.argv.slice(2);
if(args.some(a=>!['--dry-run','--live'].includes(a))||args.length!==1)throw Error('Choose --dry-run or --live');
const live=args[0]==='--live';
const runOut=live?out:path.join(root,'exploratory_dry_run_v1');
if(fs.existsSync(runOut))throw Error('Output exists or uncertain run: refuse automatic replay');
require(path.join(backend,'node_modules/dotenv')).config({path:path.join(backend,'.env'),quiet:true});
const {KIOSAPI_CONFIG:c}=require(path.join(backend,'config/kiosApi'));
if(c.baseUrl!=='https://kiosapi.com/v1'||c.classificationModel!==model||!c.freeOnly||c.requestTimeoutMs!==15000||c.classificationMaxTokens!==500)throw Error('Unexpected production configuration');
if(live&&!c.apiKey)throw Error('No provider key available');
const original=global.fetch;
let interrupted=false;
process.on('SIGINT',()=>{interrupted=true;});process.on('SIGTERM',()=>{interrupted=true;});
const save=(p,v)=>{const f=fs.openSync(p,'wx');try{fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');fs.fsyncSync(f);}finally{fs.closeSync(f);}};
const wait=async ms=>{const until=Date.now()+ms;while(Date.now()<until&&!interrupted)await new Promise(r=>setTimeout(r,Math.min(1000,until-Date.now())));};
async function main(){
 let price;
 if(live){const r=await original('https://kiosapi.com/api/pricing',{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Price unavailable');const d=await r.json();
  const m=d.data?.find(x=>x.model_name===model);
  if(d.group_ratio?.['Free-Pro']!==0||!m?.enable_groups?.includes('Free-Pro')||!m.supported_endpoint_types?.includes('openai'))throw Error('Not eligible for Free-Pro at price zero');
  const catalog=await original(`${c.baseUrl}/models`,{headers:{Authorization:`Bearer ${c.apiKey}`},signal:AbortSignal.timeout(15000)});
  if(!catalog.ok||!(await catalog.json()).data?.some(x=>x.id===model))throw Error('Model unavailable in authenticated catalog');
  price={pricing_version:d.pricing_version??null,free_pro_multiplier:0,eligible:true,authenticated_model_listed:true,account_group:'user_confirmed_not_api_verified',quota_remaining:null};
 }else price={mode:'OFFLINE',requests:0};
 fs.mkdirSync(runOut);
 const lock=path.join(runOut,'.lock');save(lock,{created_at:new Date().toISOString(),pid:process.pid});
 const manifest={created_at:new Date().toISOString(),protocol:'exploratory_v1',mode:live?'LIVE':'DRY_RUN',max_requests:live?27:0,
  model,price,dataset_sha256:hash(bytes),rater_A_sha256:labels[0].digest,rater_B_sha256:labels[1].digest,
  source_commit:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  service_sha256:hash(fs.readFileSync(path.join(backend,'services/classificationService.js'))),adapter_sha256:hash(fs.readFileSync(path.join(backend,'config/kiosApi.js'))),
  harness_sha256:hash(fs.readFileSync(__filename)),provisional_ai_labels:true,db_writes:0,retries:0,spacing_ms:10000,temperature:0.1,max_tokens:500,timeout_ms:15000,hard_deadline_ms:22000};
 save(path.join(runOut,'manifest.json'),manifest);
 let count=0,stop=null,lastStart=0;
 try{
  const {classifyComplaint}=require(path.join(backend,'services/classificationService'));
  for(const row of rows){if(interrupted||stop)break;
   if(!live){save(path.join(runOut,`${row.sample_id}.json`),{sample_id:row.sample_id,mode:'DRY_RUN',api_requests:0,planned_model:model,ground_truth_category:labels[0].data.rows.find(x=>x.sample_id===row.sample_id).category_label});continue;}
   await wait(Math.max(0,10000-(Date.now()-lastStart)));if(interrupted)break;
   if(count>=27)throw Error('Request cap reached');
   const pending=path.join(runOut,`${row.sample_id}.pending`),output=path.join(runOut,`${row.sample_id}.json`);
   save(pending,{at:new Date().toISOString(),sample_id:row.sample_id,model});
   let calls=0;
   const captured={http_status:null,raw_content:null,returned_model:null,usage:null,error_type:null,prompt_version:null,request_model:null,request_params:null};
   global.fetch=async(url,opts)=>{
    if(++calls!==1||url!==`${c.baseUrl}/chat/completions`)throw Error('Unexpected endpoint or repeated request');
    const payload=JSON.parse(opts.body);
    if(payload.model!==model||payload.temperature!==0.1||payload.max_tokens!==500||payload.response_format?.type!=='json_object')throw Error('Unexpected request configuration');
    captured.request_model=payload.model;captured.request_params={temperature:payload.temperature,max_tokens:payload.max_tokens,response_format:payload.response_format};
    captured.prompt_version=hash(JSON.stringify(payload.messages));lastStart=Date.now();count++;
    try{const response=await original(url,{...opts,signal:AbortSignal.any([opts.signal,AbortSignal.timeout(22000)])});captured.http_status=response.status;
     const text=await response.text();let data;try{data=JSON.parse(text);}catch{captured.error_type='INVALID_PROVIDER_BODY';}
     if(response.ok&&data){captured.raw_content=typeof data.choices?.[0]?.message?.content==='string'?data.choices[0].message.content.split(c.apiKey).join('[REDACTED]'):null;
      captured.returned_model=typeof data.model==='string'?data.model:null;
      if(data.usage)captured.usage=Object.fromEntries(['prompt_tokens','completion_tokens','total_tokens','cost'].filter(k=>typeof data.usage[k]==='number').map(k=>[k,data.usage[k]]));}
     return new Response(response.ok?text:JSON.stringify({error:{message:`HTTP ${response.status}`}}),{status:response.status,headers:{'Content-Type':'application/json'}});
    }catch(e){captured.error_type=['AbortError','TimeoutError'].includes(e.name)?'TIMEOUT':'NETWORK_ERROR';throw e;}
   };
   const oldErr=console.error,start=performance.now();let result;
   try{console.error=()=>{};result=await classifyComplaint(row.title,row.description,null);}finally{console.error=oldErr;global.fetch=original;}
   const raw=parseRaw(captured.raw_content).value,gold=labels[0].data.rows.find(x=>x.sample_id===row.sample_id);
   const reasons=[];if(result.classificationSource==='manual_fallback')reasons.push('service_manual_fallback');
   else {if(String(raw?.category||'').toLowerCase().trim()!==result.category)reasons.push('category_normalization');
    if(String(raw?.suggestedDepartment||'').toUpperCase().trim()!==result.suggestedDepartment)reasons.push('department_normalization');}
   const record={sample_id:row.sample_id,ground_truth_category:gold.category_label,ground_truth_department:gold.department_label,
    label_validation_status:'AI_PROVISIONAL',sample_type:row.sample_type,raw_predicted_category:raw?.category??null,final_predicted_category:result.category,
    raw_suggested_department:raw?.suggestedDepartment??null,final_suggested_department:result.suggestedDepartment,
    routing_department_simulated:MAPPING[result.category]??null,routing_persisted:false,
    secondary_categories:result.secondaryCategories,suggested_priority:result.suggestedPriority,
    raw_confidence:raw?.confidence??null,confidence:result.confidence,needs_human_review:result.needsHumanReview,
    fallback_applied:reasons.length>0,fallback_reasons:reasons,output_valid:strictValid(raw),
    latency_ms:performance.now()-start,request_status:result.status,
    error_type:captured.error_type||(captured.http_status>=400?`HTTP_${captured.http_status}`:result.status!=='success'?'INVALID_OUTPUT':null),
    model_id:captured.returned_model,model_id_source:captured.returned_model?'provider_returned':'unavailable',
    prompt_version:captured.prompt_version,timestamp:new Date().toISOString(),account_charge_idr:null,account_charge_verified:false,...captured};
   record.error_type=captured.error_type||(captured.http_status>=400?`HTTP_${captured.http_status}`:result.status!=='success'?'INVALID_OUTPUT':null);
   save(output,record);fs.unlinkSync(pending);
   console.log(JSON.stringify({sample_id:row.sample_id,http_status:captured.http_status,status:result.status,valid:record.output_valid,latency_ms:Math.round(record.latency_ms),requests:count}));
   if(captured.http_status===null||captured.http_status>=400||result.status!=='success'||captured.returned_model&&captured.returned_model!=='minimaxai/minimax-m3.1-flash')stop='PROVIDER_FAILURE_OR_MODEL_DRIFT';
  }
  console.log(JSON.stringify({status:stop|| (interrupted?'INTERRUPTED':'COMPLETED'),requests:count,processed:fs.readdirSync(runOut).filter(n=>/^SIPW-EVAL-CAND-\d+\.json$/.test(n)).length}));
 }finally{global.fetch=original;fs.unlinkSync(lock);}
}
main().catch(e=>{global.fetch=original;console.error(JSON.stringify({status:'STOPPED',error_type:e.name,reason:'Inspect checkpoint; never replay uncertain POST automatically'}));process.exitCode=1;});
