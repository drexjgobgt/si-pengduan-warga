// Read-only GET of documented OpenAI-compatible models catalog.
// No completion, guessed billing endpoints, credential output or model switching.
const fs=require('node:fs');
const path=require('node:path');
const backend=path.resolve(__dirname,'../../backend');
const output=path.join(__dirname,'evidence/free_only_preflight.json');
if(fs.existsSync(output))throw new Error('Refusing overwrite');
require(path.join(backend,'node_modules/dotenv')).config({path:path.join(backend,'.env'),quiet:true});
const {KIOSAPI_CONFIG:c}=require(path.join(backend,'config/kiosApi'));
async function main(){
 const url=new URL(c.baseUrl);
 if(url.protocol!=='https:'||url.hostname!=='kiosapi.com'||c.classificationModel!=='deepseek-v4-flash-free')throw new Error('Unexpected provider/model');
 const report={timestamp:new Date().toISOString(),money_budget_idr:0,approved_pilot_request_cap:18,
  generation_requests_this_check:0,metadata_requests:1,configured_model:c.classificationModel,
  provider_host:url.hostname,account_quota_verified:false,account_billing_verified:false,
  previous_smoke_usage:{cost:0.00015862,upstream_inference_cost:0.00015862,currency:'unavailable',
   interpretation:'Provider-reported usage; actual account debit unknown. Nonzero usage cost prevents asserting free-only.'},
  decision:'BLOCKED_FREE_ONLY_UNVERIFIED'};
 try{
  const response=await fetch(`${c.baseUrl}/models`,{headers:{Authorization:`Bearer ${c.apiKey}`},signal:AbortSignal.timeout(15000)});
  report.http_status=response.status;
  if(response.ok){
   const data=await response.json();const model=Array.isArray(data.data)?data.data.find(m=>m.id===c.classificationModel):null;
   report.model_listed=Boolean(model);
   // Only known public catalog fields; don't persist arbitrary server response.
   if(model){
    const scalar=v=>typeof v==='number'||typeof v==='boolean'?v:typeof v==='string'?v.slice(0,160):null;
    report.catalog={id:model.id,owned_by:scalar(model.owned_by)};
    for(const field of ['input_price','output_price','is_free','free','price','quota','rate_limit']){
     if(Object.hasOwn(model,field))report.catalog[field]=scalar(model[field]);
    }
    if(model.pricing&&typeof model.pricing==='object')report.catalog.pricing=Object.fromEntries(
     ['prompt','completion','request','input','output','currency','unit'].filter(k=>Object.hasOwn(model.pricing,k)).map(k=>[k,scalar(model.pricing[k])]));
    report.catalog_field_names=Object.keys(model).filter(k=>!/key|secret|token|auth|password/i.test(k));
   }
  }
 }catch(e){report.error_type=e.name;}
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(report));
}
main().catch(()=>{console.error('Free-only preflight failed safely; no generation permitted');process.exitCode=1;});
