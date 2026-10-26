// EVALUATION FIXTURE CORE ONLY. No HTTP, dotenv, production service or DB imports.
// Implements durable reservations and injected transport for OFFLINE conformance tests.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const writeNew=(file,value)=>{const fd=fs.openSync(file,'wx');try{fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const sanitize=(value,secret)=>{if(Array.isArray(value))return value.map(x=>sanitize(x,secret));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!/authorization|cookie|api.?key|password|secret|stack/i.test(k)).map(([k,v])=>[k,sanitize(v,secret)]));return typeof value==='string'&&secret?value.split(secret).join('[REDACTED]'):value;};
async function runFixture(config,transport){
 if(config.mode!=='OFFLINE_FIXTURE'||typeof transport!=='function')throw Error('OFFLINE_FIXTURE_ONLY');
 const {directory,rows}=config,requestMs=config.requestDeadlineMs??22000,totalMs=config.totalDeadlineMs??7200000,spacing=config.spacingMs??10000;
 if(!Array.isArray(rows)||rows.length!==270||new Set(rows.map(x=>x.sample_id)).size!==270||rows.some(x=>typeof x.sample_id!=='string'||!x.sample_id.trim()))throw Error('INPUT_IDENTITIES');
 if(![requestMs,totalMs].every(x=>Number.isFinite(x)&&x>0)||!Number.isFinite(spacing)||spacing<0)throw Error('DEADLINE_CONFIGURATION');
 const wall=config.clock?.wall??Date.now,mono=config.clock?.mono??(()=>performance.now()),sleep=config.clock?.sleep??(ms=>new Promise(r=>setTimeout(r,ms)));
 fs.mkdirSync(directory,{recursive:true});const lock=path.join(directory,'.lock');writeNew(lock,{mode:'OFFLINE_FIXTURE',pid:process.pid});
 const identity=digest(JSON.stringify({rows,requestMs,totalMs,spacing,run_id:config.runId??'fixture'}));
 let sentThisInvocation=0,skipped=0,status='COMPLETED';
 try{
  const manifestFile=path.join(directory,'fixture_manifest.json');
  if(fs.existsSync(manifestFile)){if(read(manifestFile).identity!==identity)throw Error('RESUME_IDENTITY_CHANGED');}
  else writeNew(manifestFile,{identity,mode:'OFFLINE_FIXTURE_NOT_LLM_EVIDENCE',cap:270,requestMs,totalMs,spacing});
  const reservationFiles=()=>fs.readdirSync(directory).filter(x=>x.endsWith('.reservation.json'));
  const consumed=()=>reservationFiles().reduce((sum,n)=>{const r=read(path.join(directory,n)),f=path.join(directory,r.key+'.result.json');
   return sum+(fs.existsSync(f)?read(f).active_ms:r.active_budget_reserved_ms);},0);
  for(const n of reservationFiles()){
   const r=read(path.join(directory,n)),f=path.join(directory,r.key+'.result.json');
   if(r.identity!==identity)throw Error('LEDGER_IDENTITY_CHANGED');
   if(!fs.existsSync(f))throw Error('UNCERTAIN_RESERVATION_NO_REPLAY');
   const result=read(f);if(result.identity!==identity||result.sample_id!==r.sample_id)throw Error('RESULT_IDENTITY_CHANGED');
   if(!result.service_success){status='PRIOR_TERMINAL_FAILURE';return {status,sentThisInvocation,skipped};}
  }
  for(const row of rows){
   const key=digest(row.sample_id),reservation=path.join(directory,key+'.reservation.json'),resultFile=path.join(directory,key+'.result.json');
   if(fs.existsSync(resultFile)){skipped++;continue;}
   if(reservationFiles().length>=270)throw Error('DURABLE_CAP_REACHED');
   if(config.shouldStop?.()){status='INTERRUPTED';break;}
   const prior=reservationFiles().map(n=>read(path.join(directory,n))),last=prior.reduce((v,r)=>Math.max(v,r.dispatch_wall_ms??0),0);
   if(prior.length&&wall()<last)throw Error('WALL_CLOCK_ROLLBACK');
   const wait=Math.max(0,spacing-(wall()-last));
   // Conservative pre-reserve of request+wait time survives crashes. No reserve when budget insufficient.
   if(consumed()+wait+requestMs>totalMs){status='TOTAL_ACTIVE_DEADLINE';break;}
   const started=mono();if(wait)await sleep(wait);
   if(config.shouldStop?.()){status='INTERRUPTED';break;}
   if(consumed()+(mono()-started)+requestMs>totalMs){status='TOTAL_ACTIVE_DEADLINE';break;}
   writeNew(reservation,{identity,sample_id:row.sample_id,key,dispatch_wall_ms:wall(),active_budget_reserved_ms:(mono()-started)+requestMs,mode:'OFFLINE_FIXTURE_NOT_LLM_EVIDENCE'});
   const controller=new AbortController();let timer,response,errorType=null;
   const remaining=totalMs-consumed()+(mono()-started)+requestMs;
   try{
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Object.assign(Error('fixture deadline'),{code:'TIMEOUT'}));},Math.min(requestMs,remaining));});
    sentThisInvocation++;
    response=await Promise.race([Promise.resolve().then(()=>transport({sample_id:row.sample_id,title:row.title,description:row.description,signal:controller.signal})),timeout]);
   }catch(e){errorType=e.code==='TIMEOUT'?'TIMEOUT':'TRANSPORT_FAILURE';}
   finally{clearTimeout(timer);}
   const http=Number.isInteger(response?.http_status)?response.http_status:null;
   const success=!errorType&&http>=200&&http<300&&response?.service_success===true;
   const result=sanitize({identity,sample_id:row.sample_id,mode:'OFFLINE_FIXTURE_NOT_LLM_EVIDENCE',http_status:http,error_type:errorType??(http==null?'MISSING_HTTP_STATUS':http>=400?'HTTP_'+http:!success?'INVALID_OUTPUT':null),service_success:success,
    raw_content:typeof response?.raw_content==='string'?response.raw_content.slice(0,65536):null,response_truncated:typeof response?.raw_content==='string'&&response.raw_content.length>65536,
    model_id:typeof response?.model_id==='string'?response.model_id:null,active_ms:Math.max(0,mono()-started),account_charge_verified:false},config.fakeSecret);
   writeNew(resultFile,result);
   if(!success){status='TERMINAL_FAILURE';break;}
  }
  return {status,sentThisInvocation,skipped,reserved_total:reservationFiles().length,active_consumed_ms:consumed(),actual_provider_requests:0};
 }finally{fs.unlinkSync(lock);}
}
module.exports={runFixture,sanitize};
