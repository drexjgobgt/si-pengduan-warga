// Isolated evaluation harness. Live mode is deliberately gated pending quota/budget approval.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { CATEGORIES,MAPPING,hash,validateDataset,parseRaw,strictValid,writeNew } = require('./lib.cjs');
const ROOT = __dirname;
const BACKEND = path.resolve(ROOT,'../../backend');
const SERVICE = path.join(BACKEND,'services/classificationService.js');
const PROVIDER = path.join(BACKEND,'config/kiosApi.js');
function options(args) {
  const allowed = new Set(['--dataset','--out','--mode','--resume']);
  const o = {mode:'dry-run',resume:false};
  for (let i=0;i<args.length;i++) {
    const k=args[i]; if (!allowed.has(k)) throw new Error('Unknown option');
    if (k==='--resume') o.resume=true;
    else { if (!args[i+1] || args[i+1].startsWith('--')) throw new Error('Missing option value'); o[k.slice(2)]=args[++i]; }
  }
  if (!['dry-run','offline-fixtures'].includes(o.mode)) throw new Error('LIVE_BLOCKED: provider quota, money budget, dataset approval and independent labels not verified');
  if (!o.dataset || !o.out) throw new Error('--dataset and --out required');
  return o;
}
const fixture = (row,index) => {
  // Fixed canned output independent of gold; deliberately NOT model evidence.
  if (index%5===1) return {status:200,content:'not json'};
  if (index%5===2) return {status:429,content:null};
  if (index%5===3) return {status:200,content:JSON.stringify({category:'unknown',suggestedDepartment:'UNKNOWN',confidence:92})};
  if (index%5===4) return {timeout:true};
  return {status:200,content:JSON.stringify({category:'sampah',secondaryCategories:[],suggestedDepartment:'DLH',suggestedPriority:'normal',reason:'OFFLINE FIXTURE: not a model prediction',confidence:85,needsHumanReview:false})};
};
async function run(args) {
  const o=options(args), datasetPath=path.resolve(o.dataset), out=path.resolve(o.out);
  const relative=path.relative(ROOT,out);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Output must be a new child directory within research/evaluation');
  const bytes=fs.readFileSync(datasetPath), data=validateDataset(JSON.parse(bytes));
  const git=spawnSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'});
  if (git.status!==0) throw new Error('Cannot identify source commit');
  const config={mode:o.mode,dataset_sha256:hash(bytes),source_commit:git.stdout.trim(),
    service_sha256:hash(fs.readFileSync(SERVICE)),provider_sha256:hash(fs.readFileSync(PROVIDER)),
    harness_sha256:hash(fs.readFileSync(__filename)),validation_sha256:hash(fs.readFileSync(path.join(ROOT,'lib.cjs'))),
    model:'offline-fixture-not-a-provider',temperature:0.1,max_tokens:500,timeout_ms:15000,
    catalog_source:'production default catalog (pool=null)',request_limit:0,retries:0,
    real_api_requests:0,real_database_connections:0,samples:data.length};
  const configHash=hash(JSON.stringify(config));
  if (fs.existsSync(out) && !o.resume) throw new Error('Output exists; explicit --resume required');
  if (!fs.existsSync(out) && o.resume) throw new Error('Cannot resume nonexistent run');
  fs.mkdirSync(out,{recursive:true});
  const lock=path.join(out,'.lock');
  writeNew(lock,JSON.stringify({pid:process.pid,at:new Date().toISOString()}));
  let interrupted=false, done=0, skipped=0;
  const onInterrupt=()=>{interrupted=true;};
  process.on('SIGINT',onInterrupt); process.on('SIGTERM',onInterrupt);
  const previousFetch=global.fetch, savedError=console.error;
  const envKeys=['KIOSAPI_API_KEY','KIOSAPI_FREE_ONLY','KIOSAPI_CLASSIFICATION_MODEL','KIOSAPI_CLASSIFICATION_MAX_TOKENS','KIOSAPI_REQUEST_TIMEOUT_MS','KIOSAPI_DAILY_REQUEST_LIMIT'];
  const savedEnv=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]));
  try {
    const manifestPath=path.join(out,'manifest.json');
    if (o.resume) {
      const m=JSON.parse(fs.readFileSync(manifestPath));
      if (m.config_hash!==configHash) throw new Error('Resume config/dataset/source mismatch');
    } else writeNew(manifestPath,JSON.stringify({...config,config_hash:configHash,created_at:new Date().toISOString(),evidence_kind:'OFFLINE_ONLY_NOT_LLM_RESULTS'},null,2));
    // No dotenv loading. Fake key allows actual production adapter to reach mock fetch.
    Object.assign(process.env,{KIOSAPI_API_KEY:'offline-placeholder-not-a-credential',KIOSAPI_FREE_ONLY:'true',
      KIOSAPI_CLASSIFICATION_MODEL:config.model,KIOSAPI_CLASSIFICATION_MAX_TOKENS:'500',KIOSAPI_REQUEST_TIMEOUT_MS:'15000',KIOSAPI_DAILY_REQUEST_LIMIT:String(data.length+1)});
    // Each invocation is an isolated logical run. Production quota tracker is module-local;
    // reload it so an in-process verification run cannot inherit another run's counter.
    delete require.cache[require.resolve(SERVICE)];
    delete require.cache[require.resolve(PROVIDER)];
    const {classifyComplaint}=require(SERVICE);
    console.error=()=>{}; // Production service can log arbitrary provider errors.
    for (let i=0;i<data.length && !interrupted;i++) {
      const row=data[i];
      // Never use untrusted sample_id as a path component.
      const name=hash(row.sample_id), resultPath=path.join(out,`${name}.json`), pendingPath=path.join(out,`${name}.pending`);
      if (fs.existsSync(resultPath)) {
        const r=JSON.parse(fs.readFileSync(resultPath));
        if (r.sample_id!==row.sample_id || r.config_hash!==configHash) throw new Error('Checkpoint identity mismatch');
        skipped++;continue;
      }
      if (fs.existsSync(pendingPath)) throw new Error('Uncertain previous attempt: manual reconciliation required; will not replay');
      writeNew(pendingPath,JSON.stringify({sample_id:row.sample_id,config_hash:configHash,at:new Date().toISOString()}));
      let capture=null, f=fixture(row,i), fetchCalls=0;
      global.fetch=async (_url,request)=>{
        if (++fetchCalls>1) throw new Error('Unexpected duplicate attempt');
        const payload=JSON.parse(request.body);
        capture={messages:payload.messages,temperature:payload.temperature,max_tokens:payload.max_tokens,response_format:payload.response_format};
        if (o.mode==='offline-fixtures' && f.timeout) throw Object.assign(new Error('OFFLINE simulated timeout'),{name:'AbortError'});
        const status=o.mode==='dry-run'?200:f.status;
        const content=o.mode==='dry-run'?fixture(row,0).content:f.content;
        return new Response(JSON.stringify(status===200?{model:'OFFLINE_FIXTURE',choices:[{message:{content}}]}:{error:{message:'OFFLINE simulated quota failure'}}),{status,headers:{'Content-Type':'application/json'}});
      };
      const start=performance.now(), normalized=await classifyComplaint(row.title,row.description,null), latency=performance.now()-start;
      if (!capture || fetchCalls!==1) throw new Error('Production path did not reach offline interceptor');
      const promptVersion=hash(JSON.stringify(capture.messages.filter(m=>m.role==='system')));
      const common={sample_id:row.sample_id,config_hash:configHash,timestamp:new Date().toISOString(),
        evidence_kind:'OFFLINE_ONLY_NOT_LLM_RESULTS',prompt_version:promptVersion,request:capture};
      let record;
      if (o.mode==='dry-run') record={...common,execution:'DRY_RUN',input_valid:true,api_requests:0,
        planned_model:'deepseek-v4-flash-free',ground_truth_category:row.ground_truth_category};
      else {
        const parsed=parseRaw(f.content), raw=parsed.value;
        const fullFallback=normalized.classificationSource==='manual_fallback';
        const reasons=[];
        if (fullFallback) reasons.push('service_manual_fallback');
        if (!fullFallback && String(raw?.category||'').toLowerCase().trim()!==normalized.category) reasons.push('category_replacement');
        if (!fullFallback && !Object.values(MAPPING).includes(String(raw?.suggestedDepartment||'').toUpperCase().trim())) reasons.push('department_replacement');
        if (!fullFallback && !['rendah','normal','tinggi','darurat'].includes(String(raw?.suggestedPriority||'normal').toLowerCase().trim())) reasons.push('priority_replacement');
        if (!fullFallback && !Number.isFinite(Number.parseInt(raw?.confidence,10))) reasons.push('confidence_imputed');
        record={...common,execution:'OFFLINE_FIXTURE',ground_truth_category:row.ground_truth_category,
          ground_truth_department:row.ground_truth_department,label_validation_status:row.label_validation_status,
          raw_content:f.content??null,raw_predicted_category:raw?.category??null,final_predicted_category:normalized.category,
          raw_suggested_department:raw?.suggestedDepartment??null,final_suggested_department:normalized.suggestedDepartment,
          routing_department_simulated:MAPPING[normalized.category]??null,routing_persisted:false,
          secondary_categories:normalized.secondaryCategories,suggested_priority:normalized.suggestedPriority,
          confidence:normalized.confidence,raw_confidence:raw?.confidence??null,needs_human_review:normalized.needsHumanReview,
          fallback_applied:reasons.length>0,fallback_reasons:reasons,parse_mode:parsed.parse_mode,
          output_valid:strictValid(raw),latency_ms:latency,http_status:f.status??null,
          request_status:normalized.status,error_type:f.timeout?'TIMEOUT':f.status===429?'HTTP_429':fullFallback?'INVALID_OUTPUT':null,
          model_id:'OFFLINE_FIXTURE',model_id_source:'fixture',real_api_requests:0};
      }
      // Exclusive create followed by fsync. Pending marker makes uncertain crashes fail closed.
      const fd=fs.openSync(resultPath,'wx');
      try { fs.writeFileSync(fd,JSON.stringify(record,null,2));fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      fs.unlinkSync(pendingPath);done++;
    }
    const summary={mode:o.mode,config_hash:configHash,samples:data.length,processed_this_invocation:done,
      checkpoint_skipped:skipped,interrupted,real_api_requests:0,real_database_connections:0};
    console.log(JSON.stringify(summary));return summary;
  } finally {
    global.fetch=previousFetch;console.error=savedError;
    for (const key of envKeys) { if (savedEnv[key]===undefined) delete process.env[key];else process.env[key]=savedEnv[key]; }
    process.removeListener('SIGINT',onInterrupt);process.removeListener('SIGTERM',onInterrupt);
    fs.unlinkSync(lock);
  }
}
if (require.main===module) run(process.argv.slice(2)).catch(()=>{console.error('Evaluation stopped safely; inspect checkpoint/config. No automatic replay.');process.exitCode=1;});
module.exports={run,options};
