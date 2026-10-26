// Explicitly approved ONE next-sample attempt. Never replays earlier samples.
const fs=require('node:fs'),path=require('node:path');
const {hash,validateDataset,parseRaw,strictValid,MAPPING}=require('./lib.cjs');
const root=__dirname,backend=path.resolve(root,'../../backend');
const out=path.join(root,'live_pilot_continuation_one');
if(fs.existsSync(out))throw new Error('One-attempt continuation already exists; no automatic replay');
const datasetBytes=fs.readFileSync(path.join(root,'dataset.provisional.json'));
const dataset=validateDataset(JSON.parse(datasetBytes));
const prior=JSON.parse(fs.readFileSync(path.join(root,'live_pilot/SIPW-CAND-0010.json')));
if(prior.http_status!==429)throw new Error('Unexpected earlier checkpoint');
const row=dataset.find(r=>r.sample_id==='SIPW-CAND-0011');
if(!row||row.split!=='pilot_candidate')throw new Error('Sample unavailable');
require(path.join(backend,'node_modules/dotenv')).config({path:path.join(backend,'.env'),quiet:true});
const {KIOSAPI_CONFIG:c}=require(path.join(backend,'config/kiosApi'));
if(c.baseUrl!=='https://kiosapi.com/v1'||c.classificationModel!=='deepseek-v4-flash-free'||!c.freeOnly||!c.apiKey||c.classificationMaxTokens!==500||c.requestTimeoutMs!==15000)throw new Error('Config mismatch');
const originalFetch=global.fetch;let calls=0;
function save(file,data){const fd=fs.openSync(file,'wx');try{fs.writeFileSync(fd,JSON.stringify(data,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
async function main(){
 fs.mkdirSync(out);
 const manifest={created_at:new Date().toISOString(),evidence_kind:'ACTUAL_LLM_SYNTHETIC_PROVISIONAL_PILOT',
  dataset_sha256:hash(datasetBytes),harness_sha256:hash(fs.readFileSync(__filename)),
  service_sha256:hash(fs.readFileSync(path.join(backend,'services/classificationService.js'))),
  provider_sha256:hash(fs.readFileSync(path.join(backend,'config/kiosApi.js'))),
  prior_checkpoint_sha256:hash(fs.readFileSync(path.join(root,'live_pilot/SIPW-CAND-0010.json'))),
  sample_id:row.sample_id,max_requests:1,retries:0,money_budget_idr:0,configured_model:c.classificationModel,
  timeout_ms:15000,hard_deadline_ms:20000,max_tokens:500,temperature:0.1,
  catalog:'production defaults pool=null',authorization:'User continue after explicit proposal for one next-sample attempt; catalog screenshot input/output/cache Rp0',
  quota_remaining:null,account_debit_observable:false};
 const configHash=hash(JSON.stringify(manifest));save(path.join(out,'manifest.json'),{...manifest,config_hash:configHash});
 const pending=path.join(out,'attempt.pending');save(pending,{sample_id:row.sample_id,at:new Date().toISOString()});
 const captured={http_status:null,raw_content:null,provider_model:null,usage:null,request:null,error_type:null,retry_after_seconds:null};
 global.fetch=async(url,options)=>{
  if(++calls!==1||url!=='https://kiosapi.com/v1/chat/completions')throw new Error('Single-request endpoint guard');
  const payload=JSON.parse(options.body);
  if(payload.model!==manifest.configured_model)throw new Error('Model switch forbidden');
  captured.request={model:payload.model,messages:payload.messages,temperature:payload.temperature,max_tokens:payload.max_tokens,response_format:payload.response_format};
  try{
   const response=await originalFetch(url,{...options,signal:AbortSignal.any([options.signal,AbortSignal.timeout(20000)])});
   captured.http_status=response.status;
   const retry=response.headers.get('retry-after');
   if(retry&&/^\d+$/.test(retry))captured.retry_after_seconds=Number(retry);
   const text=await response.text();let body;
   try{body=JSON.parse(text);}catch{captured.error_type='PROVIDER_INVALID_JSON';}
   if(response.ok&&body){
    captured.raw_content=typeof body.choices?.[0]?.message?.content==='string'?body.choices[0].message.content.split(c.apiKey).join('[REDACTED]'):null;
    captured.provider_model=typeof body.model==='string'?body.model:null;
    captured.finish_reason=body.choices?.[0]?.finish_reason??null;
    if(body.usage)captured.usage=Object.fromEntries(['prompt_tokens','completion_tokens','total_tokens','cost'].filter(k=>typeof body.usage[k]==='number').map(k=>[k,body.usage[k]]));
   }
   return new Response(text,{status:response.status,headers:{'Content-Type':'application/json'}});
  }catch(e){captured.error_type=['AbortError','TimeoutError'].includes(e.name)?'TIMEOUT':'NETWORK_ERROR';throw e;}
 };
 const {classifyComplaint}=require(path.join(backend,'services/classificationService'));
 const start=performance.now(),savedError=console.error;let result;
 try{console.error=()=>{};result=await classifyComplaint(row.title,row.description,null);}
 finally{console.error=savedError;global.fetch=originalFetch;}
 const parsed=parseRaw(captured.raw_content),raw=parsed.value;
 const reasons=[];
 if(result.classificationSource==='manual_fallback')reasons.push('service_manual_fallback');
 else{
  if(!Object.hasOwn(MAPPING,String(raw?.category||'').trim().toLowerCase()))reasons.push('category_replacement');
  if(!Object.values(MAPPING).includes(String(raw?.suggestedDepartment||'').trim().toUpperCase()))reasons.push('department_replacement_or_name_resolution');
  if(!['rendah','normal','tinggi','darurat'].includes(String(raw?.suggestedPriority||'normal').trim().toLowerCase()))reasons.push('priority_replacement');
  if(Number.isNaN(parseInt(raw?.confidence,10)))reasons.push('confidence_imputation');
 }
 const record={sample_id:row.sample_id,config_hash:configHash,evidence_kind:manifest.evidence_kind,
  ground_truth_category:row.ground_truth_category,ground_truth_department:row.ground_truth_department,
  label_validation_status:row.label_validation_status,department_label_origin:row.department_label_origin,
  raw_predicted_category:raw?.category??null,final_predicted_category:result.category,
  raw_suggested_department:raw?.suggestedDepartment??null,final_suggested_department:result.suggestedDepartment,
  secondary_categories:result.secondaryCategories,suggested_priority:result.suggestedPriority,reason:result.reason,
  confidence:result.confidence,raw_confidence:raw?.confidence??null,needs_human_review:result.needsHumanReview,
  fallback_applied:reasons.length>0,fallback_reasons:reasons,output_valid:strictValid(raw),parse_mode:parsed.parse_mode,
  latency_ms:performance.now()-start,request_status:result.status,http_status:captured.http_status,
  error_type:captured.error_type||(captured.http_status>=400?`HTTP_${captured.http_status}`:result.status!=='success'?'INVALID_OUTPUT':null),
  model_id:captured.provider_model,model_id_source:captured.provider_model?'provider_returned':'unavailable',
  configured_model:c.classificationModel,prompt_version:hash(JSON.stringify(captured.request?.messages.filter(m=>m.role==='system'))),
  timestamp:new Date().toISOString(),request:captured.request,raw_content:captured.raw_content,usage:captured.usage,
  finish_reason:captured.finish_reason??null,retry_after_seconds:captured.retry_after_seconds,
  routing_department_simulated:MAPPING[result.category]??null,routing_persisted:false,
  account_charge_idr:null,account_charge_verification:'requires dashboard reconciliation',requests_this_process:calls};
 save(path.join(out,`${row.sample_id}.json`),record);fs.unlinkSync(pending);
 console.log(JSON.stringify({sample_id:row.sample_id,status:record.request_status,http_status:record.http_status,
  category:record.final_predicted_category,output_valid:record.output_valid,model_id:record.model_id,
  latency_ms:record.latency_ms,retry_after_seconds:record.retry_after_seconds,requests:calls,stopped:true}));
}
main().catch(()=>{global.fetch=originalFetch;console.error('Continuation stopped; inspect checkpoint, never replay automatically.');process.exitCode=1;});
