// Bounded model-selection pilot. Synthetic development samples only; no operational DB.
const fs = require('node:fs');
const path = require('node:path');
const {hash, validateDataset, parseRaw, strictValid, MAPPING} = require('./lib.cjs');
const root = __dirname, backend = path.resolve(root, '../../backend');
const models = ['qwen3.8-flash-free', 'minimax-m3.1-flash-free', 'glm-5.3-flash-free'];
const out = path.join(root, 'free_pro_comparison_v1');
const datasetBytes = fs.readFileSync(path.join(root, 'dataset.provisional.json'));
const rows = validateDataset(JSON.parse(datasetBytes)).filter(r => r.split === 'dev');
if (rows.length !== 9 || models.length * rows.length !== 27) throw Error('Sample/request cap mismatch');
require(path.join(backend, 'node_modules/dotenv')).config({path:path.join(backend, '.env'), quiet:true});
const {KIOSAPI_CONFIG:c} = require(path.join(backend, 'config/kiosApi'));
if (c.baseUrl !== 'https://kiosapi.com/v1' || !c.apiKey || !c.freeOnly || c.classificationMaxTokens !== 500 || c.requestTimeoutMs !== 15000)
  throw Error('Provider/config guard failed');
const originalFetch = global.fetch;
const save = (file, value) => {const fd = fs.openSync(file, 'wx'); try {fs.writeFileSync(fd, JSON.stringify(value, null, 2)+'\n'); fs.fsyncSync(fd);} finally {fs.closeSync(fd);}};
const interrupted = {value:false};
process.on('SIGINT', () => {interrupted.value = true;});
process.on('SIGTERM', () => {interrupted.value = true;});
async function preflight() {
  const r = await originalFetch('https://kiosapi.com/api/pricing', {signal:AbortSignal.timeout(15000)});
  if (!r.ok) throw Error('Pricing unavailable');
  const p = await r.json();
  if (p.group_ratio?.['Free-Pro'] !== 0 || !Array.isArray(p.data)) throw Error('Free-Pro multiplier not zero');
  for (const id of models) {
    const m = p.data.find(x => x.model_name === id);
    if (!m || !m.enable_groups?.includes('Free-Pro') || !m.supported_endpoint_types?.includes('openai')) throw Error('Model no longer Free-Pro eligible');
  }
  return {pricing_version:p.pricing_version ?? null, free_pro_ratio:0, model_ids:models};
}
async function main() {
  if (fs.existsSync(out)) throw Error('Output already exists; do not replay without reconciliation');
  const pricing = await preflight();
  fs.mkdirSync(out); save(path.join(out,'.lock'), {pid:process.pid,at:new Date().toISOString()});
  const config = {protocol:'free_pro_selection_v1', max_requests:27, max_money_idr:0, retries:0, concurrency:1,
    request_spacing_ms:10000, dataset_sha256:hash(datasetBytes), harness_sha256:hash(fs.readFileSync(__filename)),
    service_sha256:hash(fs.readFileSync(path.join(backend,'services/classificationService.js'))),
    adapter_sha256:hash(fs.readFileSync(path.join(backend,'config/kiosApi.js'))),
    pricing, source:'synthetic development only; labels provisional; no DB writes',
    group_basis:'User confirmed app key belongs to Free-Pro; group identity and remaining account quota not readable from catalog',
    temperature:0.1, max_tokens:500, production_timeout_ms:15000, external_deadline_ms:22000};
  save(path.join(out,'manifest.json'), {...config,at:new Date().toISOString()});
  let count=0, stopped=null, last=0;
  try {
    const {classifyComplaint} = require(path.join(backend,'services/classificationService'));
    for (const row of rows) for (const model of models) {
      if (interrupted.value || stopped) break;
      const delay = Math.max(0, 10000-(Date.now()-last));
      if (delay) await new Promise(r=>setTimeout(r,delay));
      if (interrupted.value) break;
      if (count>=27) throw Error('Request cap reached');
      const pending=path.join(out,`${row.sample_id}.${model}.pending`);
      save(pending,{sample_id:row.sample_id,model,at:new Date().toISOString()});
      process.env.KIOSAPI_CLASSIFICATION_MODEL=model;
      let calls=0;
      const capture={http_status:null,raw_content:null,model_id:null,usage:null,request:null,error_type:null};
      global.fetch=async (url, opts) => {
        if (++calls!==1 || url!=='https://kiosapi.com/v1/chat/completions') throw Error('Unapproved provider call');
        const payload=JSON.parse(opts.body);
        if(payload.model!==model || payload.temperature!==0.1 || payload.max_tokens!==500 || payload.response_format?.type!=='json_object') throw Error('Request mismatch');
        capture.request={model:payload.model,messages:payload.messages,temperature:payload.temperature,max_tokens:payload.max_tokens,response_format:payload.response_format};
        count++; last=Date.now();
        try {
          const response=await originalFetch(url,{...opts,signal:AbortSignal.any([opts.signal,AbortSignal.timeout(22000)])});
          capture.http_status=response.status;
          const text=await response.text();
          let body; try {body=JSON.parse(text);} catch {capture.error_type='INVALID_PROVIDER_BODY';}
          if(response.ok && body){
            capture.raw_content=typeof body.choices?.[0]?.message?.content==='string'?body.choices[0].message.content.split(c.apiKey).join('[REDACTED]'):null;
            capture.model_id=typeof body.model==='string'?body.model:null;
            capture.usage=body.usage?Object.fromEntries(['prompt_tokens','completion_tokens','total_tokens','cost'].filter(k=>typeof body.usage[k]==='number').map(k=>[k,body.usage[k]])):null;
          }
          // Never return a provider-supplied error body to the production logger.
          return new Response(response.ok?text:JSON.stringify({error:{message:`HTTP ${response.status}`}}),{status:response.status,headers:{'Content-Type':'application/json'}});
        } catch (e) {capture.error_type=['AbortError','TimeoutError'].includes(e.name)?'TIMEOUT':'NETWORK_ERROR';throw e;}
      };
      const start=performance.now(), oldError=console.error;
      let result;
      try {console.error=()=>{};result=await classifyComplaint(row.title,row.description,null);}
      finally {console.error=oldError;global.fetch=originalFetch;}
      const raw=parseRaw(capture.raw_content).value;
      const record={sample_id:row.sample_id,model,ground_truth_category:row.ground_truth_category,
        ground_truth_department:row.ground_truth_department,label_validation_status:row.label_validation_status,
        timestamp:new Date().toISOString(),latency_ms:performance.now()-start,request_status:result.status,
        http_status:capture.http_status,error_type:capture.error_type||(capture.http_status>=400?`HTTP_${capture.http_status}`:result.status!=='success'?'INVALID_OUTPUT':null),
        raw_predicted_category:raw?.category??null,final_predicted_category:result.category,
        raw_suggested_department:raw?.suggestedDepartment??null,final_suggested_department:result.suggestedDepartment,
        routed_department_simulated:MAPPING[result.category]??null,output_valid:strictValid(raw),
        fallback_applied:result.classificationSource==='manual_fallback'||raw?.category!==result.category||raw?.suggestedDepartment!==result.suggestedDepartment,
        confidence:result.confidence,raw_confidence:raw?.confidence??null,needs_human_review:result.needsHumanReview,
        model_id_source:capture.model_id?'provider_returned':'unavailable',prompt_version:hash(JSON.stringify(capture.request?.messages.filter(m=>m.role==='system'))),
        account_charge_idr:null,account_charge_verified:false,...capture};
      record.error_type=capture.error_type||(capture.http_status>=400?`HTTP_${capture.http_status}`:result.status!=='success'?'INVALID_OUTPUT':null);
      save(path.join(out,`${row.sample_id}.${model}.json`),record);fs.unlinkSync(pending);
      console.log(JSON.stringify({sample_id:row.sample_id,model,http_status:capture.http_status,status:result.status,valid:record.output_valid,latency_ms:Math.round(record.latency_ms)}));
      if (capture.http_status===null || capture.http_status>=400 || result.status!=='success' || !record.output_valid)
        stopped='PROVIDER_OR_OUTPUT_FAILURE';
    }
    console.log(JSON.stringify({status:stopped|| (interrupted.value?'INTERRUPTED':'COMPLETED'),requests:count}));
  } finally {global.fetch=originalFetch;delete process.env.KIOSAPI_CLASSIFICATION_MODEL;fs.unlinkSync(path.join(out,'.lock'));}
}
main().catch(e=>{console.error(JSON.stringify({status:'STOPPED',error_type:e.name,reason:'See checkpoint; never replay uncertain request automatically'}));process.exitCode=1;});
