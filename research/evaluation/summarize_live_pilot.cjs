const fs=require('node:fs'),path=require('node:path');
const {hash,validateDataset}=require('./lib.cjs');
const root=path.join(__dirname,'live_pilot');
const data=validateDataset(JSON.parse(fs.readFileSync(path.join(__dirname,'dataset.provisional.json')))).filter(r=>r.split==='pilot_candidate');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
const records=fs.readdirSync(root).filter(n=>/^SIPW-CAND-.*\.json$/.test(n)).map(n=>JSON.parse(fs.readFileSync(path.join(root,n))));
const seen=new Set();
for(const r of records){if(seen.has(r.sample_id)||!data.some(d=>d.sample_id===r.sample_id)||r.config_hash!==manifest.config_hash)throw new Error('Identity mismatch');seen.add(r.sample_id);}
const n=records.length,rate=(count,denominator)=>({count,denominator,value:denominator?count/denominator:null});
const success=records.filter(r=>r.request_status==='success').length;
const sorted=records.map(r=>r.latency_ms).sort((a,b)=>a-b);
const quantile=p=>{if(!sorted.length)return null;const x=(sorted.length-1)*p,i=Math.floor(x);return sorted[i]+(sorted[Math.ceil(x)]-sorted[i])*(x-i);};
const summary={generated_at:new Date().toISOString(),status:'INCOMPLETE_STOPPED_ON_HTTP_429',evidence_kind:'ACTUAL_LLM_SYNTHETIC_PROVISIONAL_PILOT',
 planned_samples:data.length,attempted_samples:n,service_success:success,unattempted_samples:data.filter(d=>!seen.has(d.sample_id)).map(r=>r.sample_id),
 coverage:rate(n,data.length),valid_output_rate:rate(records.filter(r=>r.output_valid).length,n),failure_rate:rate(n-success,n),
 timeout_rate:rate(records.filter(r=>r.error_type==='TIMEOUT').length,n),fallback:rate(records.filter(r=>r.fallback_applied).length,n),
 needs_human_review:rate(records.filter(r=>r.needs_human_review).length,n),latency_ms:{all_attempts_median:quantile(.5),all_attempts_p95:quantile(.95),n},
 final_system_label_matches_attempted:rate(records.filter(r=>r.final_predicted_category===r.ground_truth_category).length,n),
 llm_classification_metrics:null,llm_metrics_unavailable_reason:'No successful provider prediction; incomplete 1/18 pilot and labels provisional. Fallback mismatch is system outcome, not a semantic LLM prediction.',
 account_billing:{user_supplied_evidence:'Prior matching smoke screenshot: requested model deepseek-v4-flash-free; response self-dploy/DeepSeek-V4-Flash; 949/92 tokens; Free-Pro 0x; Rp0',
  evidence_file:'unavailable: attachment not accessible as a verified workspace file',
  pilot_dashboard_evidence:'User screenshot 2026-10-26 12:32:07 WIB: same model, Free-Pro, Error status_code=429 openai_error, cost Rp0; matches attempted sample timestamp.',
  pilot_debit_idr:0,pilot_debit_evidence_source:'user_supplied_dashboard_screenshot_not_billing_API',remaining_quota:null,post_run_reconciliation_required:false},
 baseline_comparison:'Not comparable: baseline has 18 predictions; LLM has 0 successful predictions.',
 source_records:records.map(r=>({sample_id:r.sample_id,sha256:hash(fs.readFileSync(path.join(root,`${r.sample_id}.json`)))}))};
const output=path.join(root,'partial_summary.json');
fs.writeFileSync(output,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(summary));
