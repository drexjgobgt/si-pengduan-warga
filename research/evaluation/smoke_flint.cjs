// One authorized synthetic request via the real classification path; never writes DB.
const fs=require('node:fs'),path=require('node:path');
const root=__dirname, backend=path.resolve(root,'../../backend'), model=process.argv[2], sampleId=process.argv[3]||'SIPW-CAND-0001';
if(!['beam-free','minimax-m3.1-flash-free','glm-5.3-flash-free'].includes(model)||!/^SIPW-CAND-000[1-9]$/.test(sampleId))throw Error('Model/sample not allowed for one-shot smoke');
const file=path.join(root,`free_pro_${sampleId}_${model}_smoke.json`),pending=file+'.pending';
if(fs.existsSync(file)||fs.existsSync(pending))throw Error('Existing result or uncertain attempt; refuse replay');
const row=JSON.parse(fs.readFileSync(path.join(root,'dataset.provisional.json'))).find(x=>x.sample_id===sampleId&&x.split==='dev');
require(path.join(backend,'node_modules/dotenv')).config({path:path.join(backend,'.env'),quiet:true});
const {KIOSAPI_CONFIG:c}=require(path.join(backend,'config/kiosApi'));
const {parseRaw,strictValid}=require('./lib.cjs');
const original=global.fetch;
async function run(){
 if(!c.apiKey||c.baseUrl!=='https://kiosapi.com/v1'||!c.freeOnly||c.requestTimeoutMs!==15000)throw Error('Config guard');
 const pricing=await (await original('https://kiosapi.com/api/pricing',{signal:AbortSignal.timeout(15000)})).json();
 if(pricing.group_ratio?.['Free-Pro']!==0||!pricing.data?.find(m=>m.model_name===model)?.enable_groups?.includes('Free-Pro'))throw Error('Free-Pro price guard');
 const {KIOSAPI_CONFIG}=require(path.join(backend,'config/kiosApi'));
 process.env.KIOSAPI_CLASSIFICATION_MODEL=model;
 fs.writeFileSync(pending,JSON.stringify({at:new Date().toISOString(),model,sample_id:row.sample_id}),{flag:'wx'});
 let calls=0,status=null,raw=null,returned=null,usage=null,error=null;
 global.fetch=async(url,opts)=>{
  if(++calls!==1||url!=='https://kiosapi.com/v1/chat/completions'||JSON.parse(opts.body).model!==model)throw Error('Request guard');
  try{const r=await original(url,{...opts,signal:AbortSignal.any([opts.signal,AbortSignal.timeout(22000)])});status=r.status;const text=await r.text();
   let body;try{body=JSON.parse(text);}catch{error='INVALID_BODY';}
   if(r.ok&&body){raw=body.choices?.[0]?.message?.content??null;returned=body.model??null;usage=body.usage?Object.fromEntries(['prompt_tokens','completion_tokens','total_tokens','cost'].filter(k=>typeof body.usage[k]==='number').map(k=>[k,body.usage[k]])):null;}
   return new Response(r.ok?text:JSON.stringify({error:{message:`HTTP ${r.status}`}}),{status:r.status,headers:{'Content-Type':'application/json'}});
  }catch(e){error=e.name;throw e;}
 };
 const oldError=console.error,start=performance.now();let result;
 try{console.error=()=>{};result=await require(path.join(backend,'services/classificationService')).classifyComplaint(row.title,row.description,null);}
 finally{console.error=oldError;global.fetch=original;delete process.env.KIOSAPI_CLASSIFICATION_MODEL;}
 const record={timestamp:new Date().toISOString(),sample_id:row.sample_id,model,returned_model:returned,http_status:status,
  request_status:result.status,latency_ms:performance.now()-start,raw_content:typeof raw==='string'?raw.split(c.apiKey).join('[REDACTED]'):null,
  raw_category:parseRaw(raw).value?.category??null,final_category:result.category,ground_truth_category:row.ground_truth_category,
  label_validation_status:row.label_validation_status,output_valid:strictValid(parseRaw(raw).value),usage,error_type:error,
  account_charge_idr:null,account_charge_verified:false,source:'synthetic dev smoke; no DB; one request only'};
 const fd=fs.openSync(file,'wx');try{fs.writeFileSync(fd,JSON.stringify(record,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 fs.unlinkSync(pending);console.log(JSON.stringify({...record,raw_content:'[withheld from console]',usage:usage?{tokens:usage.total_tokens}:null}));
}
run().catch(e=>{global.fetch=original;console.error(JSON.stringify({status:'STOPPED',error_type:e.name,uncertain_pending:fs.existsSync(pending)}));process.exitCode=1;});
