// Recompute ACTUAL pilot only. Never loads offline fixtures into scientific metrics.
const fs=require('node:fs'),path=require('node:path');
const {CATEGORIES,MAPPING,hash,validateDataset}=require('./lib.cjs');
const root=__dirname;
function classification(pairs,labels){
 const columns=[...labels,'__invalid__','__missing__'];
 const matrix=Object.fromEntries(labels.map(c=>[c,Object.fromEntries(columns.map(p=>[p,0]))]));
 for(const [truth,pred] of pairs){if(!labels.includes(truth))throw new Error('Invalid gold');const p=pred==null?'__missing__':labels.includes(pred)?pred:'__invalid__';matrix[truth][p]++;}
 const per=labels.map(c=>{const tp=matrix[c][c],support=Object.values(matrix[c]).reduce((a,b)=>a+b,0),predicted=labels.reduce((a,t)=>a+matrix[t][c],0);
  const precision=predicted?tp/predicted:0,recall=support?tp/support:0;
  return {category:c,support,predicted,tp,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0};});
 return {denominator:pairs.length,correct:pairs.filter(([t,p])=>t===p).length,accuracy:pairs.length?pairs.filter(([t,p])=>t===p).length/pairs.length:null,
  macro_precision:per.reduce((a,c)=>a+c.precision,0)/labels.length,macro_recall:per.reduce((a,c)=>a+c.recall,0)/labels.length,
  macro_f1:per.reduce((a,c)=>a+c.f1,0)/labels.length,per_category:per,confusion_matrix:matrix,columns,zero_division:0};
}
function percentile(values,p){if(!values.length)return null;const a=[...values].sort((x,y)=>x-y),v=(a.length-1)*p,i=Math.floor(v);return a[i]+(a[Math.ceil(v)]-a[i])*(v-i);}
function csv(rows,keys){return keys.join(',')+'\n'+rows.map(row=>keys.map(k=>'"'+String(row[k]==null?'':typeof row[k]==='object'?JSON.stringify(row[k]):row[k]).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';}
function main(){
 const datasetBytes=fs.readFileSync(path.join(root,'dataset.provisional.json')),data=validateDataset(JSON.parse(datasetBytes)).filter(r=>r.split==='pilot_candidate');
 const sources=['live_pilot','live_pilot_continuation_one','live_pilot_retry_v2'];
 const records=[],provenance=[];
 for(const dir of sources){const folder=path.join(root,dir);if(!fs.existsSync(folder))continue;
  if(fs.existsSync(path.join(folder,'.lock'))||fs.readdirSync(folder).some(n=>n.endsWith('.pending')))throw new Error('Run in progress or uncertain attempt; do not summarize');
  const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json')));
  if(manifest.dataset_sha256!==hash(datasetBytes))throw new Error('Dataset drift');
  for(const file of fs.readdirSync(folder).filter(n=>/^SIPW-CAND-\d+(\.attempt-\d)?\.json$/.test(n))){
   const raw=fs.readFileSync(path.join(folder,file)),r=JSON.parse(raw);
   if(r.evidence_kind!=='ACTUAL_LLM_SYNTHETIC_PROVISIONAL_PILOT'||r.config_hash!==manifest.config_hash)throw new Error('Source/config mismatch');
   if(!data.some(d=>d.sample_id===r.sample_id)||r.ground_truth_category!==data.find(d=>d.sample_id===r.sample_id).ground_truth_category)throw new Error('Sample/gold mismatch');
   records.push({...r,attempt:r.attempt??1,source_file:`${dir}/${file}`});provenance.push({path:`${dir}/${file}`,sha256:hash(raw)});
  }
 }
 const selected=[];
 for(const d of data){const attempts=records.filter(r=>r.sample_id===d.sample_id).sort((a,b)=>a.attempt-b.attempt);
  const unique=new Set(attempts.map(a=>a.attempt));if(unique.size!==attempts.length)throw new Error('Duplicate attempt ID');
  // Predeclared policy: first service success; if exhausted, last persisted failure. Never select by correctness.
  const r=attempts.find(r=>r.request_status==='success')||attempts.at(-1);
  selected.push(r?{...r,attempt_count:attempts.length}:{sample_id:d.sample_id,ground_truth_category:d.ground_truth_category,ground_truth_department:d.ground_truth_department,
   final_predicted_category:null,final_suggested_department:null,raw_predicted_category:null,raw_suggested_department:null,request_status:'unattempted',attempt_count:0});
 }
 const attempted=selected.filter(r=>r.attempt_count),first=selected.map(r=>records.filter(a=>a.sample_id===r.sample_id).sort((a,b)=>a.attempt-b.attempt)[0]).filter(Boolean),successful=selected.filter(r=>r.request_status==='success');
 const rate=(count,denominator)=>({count,denominator,value:denominator?count/denominator:null});
 const metrics=classification(selected.map(r=>[r.ground_truth_category,r.final_predicted_category]),CATEGORIES);
 const rawMetrics=classification(selected.map(r=>[r.ground_truth_category,r.raw_predicted_category]),CATEGORIES);
 const departments=classification(selected.map(r=>[r.ground_truth_department,r.final_suggested_department]),[...new Set(Object.values(MAPPING))]);
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'baseline_pilot/predictions.json')));
 const review=flag=>{const rs=attempted.filter(r=>r.needs_human_review===flag);return {n:rs.length,errors:rs.filter(r=>r.final_predicted_category!==r.ground_truth_category).length,error_rate:rate(rs.filter(r=>r.final_predicted_category!==r.ground_truth_category).length,rs.length)};};
 const validConfidence=successful.filter(r=>Number.isInteger(r.raw_confidence)&&r.raw_confidence>=0&&r.raw_confidence<=100);
 const calibrationBins=Array.from({length:10},(_,i)=>{const rs=validConfidence.filter(r=>Math.min(9,Math.floor(r.raw_confidence/10))===i);
  return {lower:i*10,upper:(i+1)*10,n:rs.length,mean_confidence:rs.length?rs.reduce((a,r)=>a+r.raw_confidence/100,0)/rs.length:null,accuracy:rs.length?rs.filter(r=>r.raw_predicted_category===r.ground_truth_category).length/rs.length:null};});
 const summary={generated_at:new Date().toISOString(),status:successful.length===data.length?'PILOT_COMPLETE':attempted.length===data.length?'PILOT_ATTEMPTS_COMPLETE_WITH_FAILURES':'PILOT_INCOMPLETE',
  evidence_kind:'ACTUAL_LLM_SYNTHETIC_PROVISIONAL_PILOT',dataset_sha256:hash(datasetBytes),planned_samples:data.length,attempted_samples:attempted.length,
  successful_samples:successful.length,unattempted_samples:selected.filter(r=>!r.attempt_count).map(r=>r.sample_id),request_attempts:records.length,
  retry_attempts:records.filter(r=>r.attempt>1).length,coverage:rate(attempted.length,data.length),
  final_system_all_planned:metrics,raw_model_all_planned:rawMetrics,
  first_attempt_system:classification(first.map(r=>[r.ground_truth_category,r.final_predicted_category]),CATEGORIES),
  conditional_success:classification(successful.map(r=>[r.ground_truth_category,r.final_predicted_category]),CATEGORIES),
  departments_normalized:{...departments,limitation:'Reference department derived from category mapping; not independent domain validation. No controller persistence.'},
  technical:{valid_output_rate_per_attempt:rate(records.filter(r=>r.output_valid).length,records.length),
   failure_rate_per_attempt:rate(records.filter(r=>r.request_status!=='success').length,records.length),
   timeout_rate_per_attempt:rate(records.filter(r=>r.error_type==='TIMEOUT').length,records.length),http429:records.filter(r=>r.http_status===429).length,
   fallback_attempts:records.filter(r=>r.fallback_applied).length,fallback_selected_samples:attempted.filter(r=>r.fallback_applied).length,
   latency_all_attempts:{n:records.length,median:percentile(records.map(r=>r.latency_ms),.5),p95:percentile(records.map(r=>r.latency_ms),.95)},
   latency_success_attempts:{n:records.filter(r=>r.request_status==='success').length,median:percentile(records.filter(r=>r.request_status==='success').map(r=>r.latency_ms),.5),p95:percentile(records.filter(r=>r.request_status==='success').map(r=>r.latency_ms),.95)}},
  human_review:{selected_reviewed:review(true),selected_not_reviewed:review(false),
   high_confidence_wrong:attempted.filter(r=>r.confidence>=80&&r.final_predicted_category!==r.ground_truth_category).map(r=>r.sample_id),
   low_confidence_correct:attempted.filter(r=>r.confidence<60&&r.final_predicted_category===r.ground_truth_category).map(r=>r.sample_id)},
  calibration_exploratory:{n:validConfidence.length,bins:calibrationBins,ece:validConfidence.length?calibrationBins.reduce((a,b)=>a+(b.n?b.n/validConfidence.length*Math.abs(b.mean_confidence-b.accuracy):0),0):null,limitation:'AI provisional labels and tiny sample; not evidence of calibrated probabilities.'},
  baseline_same_dataset:classification(baseline.map(r=>[r.ground_truth_category,r.predicted_category]),CATEGORIES),
  limitations:['AI-authored synthetic texts and provisional labels; no human adjudication','Mixed protocol versions: first 2 samples no retry; remaining 16 bounded retry','Alias availability/latency/pricing can change; actual account debit unavailable via API','No operational DB writes or persistence verification','No secondary/priority accuracy without gold labels','No population or LLM superiority claim'],
  selection_policy:'first service success; last failure if no success; no correctness-based selection',source_records:provenance};
 const output=path.join(root,'pilot_analysis');if(fs.existsSync(output))throw new Error('Refusing overwrite: archive/new analysis version required');fs.mkdirSync(output);
 const write=(name,text)=>fs.writeFileSync(path.join(output,name),text,{flag:'wx'});
 write('results_summary.json',JSON.stringify(summary,null,2)+'\n');
 const keys=['sample_id','ground_truth_category','raw_predicted_category','final_predicted_category','ground_truth_department','raw_suggested_department','final_suggested_department','secondary_categories','suggested_priority','confidence','needs_human_review','fallback_applied','output_valid','latency_ms','request_status','error_type','model_id','prompt_version','timestamp','attempt_count','source_file'];
 write('predictions.csv',csv(selected,keys));write('attempts.json',JSON.stringify(records,null,2)+'\n');
 write('metrics_by_category.csv',csv(metrics.per_category,['category','support','predicted','tp','precision','recall','f1']));
 write('confusion_matrix.csv',csv(CATEGORIES.map(c=>({ground_truth:c,...metrics.confusion_matrix[c]})),['ground_truth',...metrics.columns]));
 write('department_results.csv',csv(departments.per_category,['category','support','predicted','tp','precision','recall','f1']));
 const errors=selected.filter(r=>r.final_predicted_category!==r.ground_truth_category);
 write('error_analysis.md','# Analisis pilot — label AI provisional\n\nBukan dataset warga nyata atau validasi manusia. Semua mismatch, termasuk fallback/unattempted, dipertahankan.\n\n'+errors.map(r=>{
  const d=data.find(d=>d.sample_id===r.sample_id);return `## ${r.sample_id}\n- Jenis: ${d.sample_type}\n- Teks sintetis: ${d.complaint_text}\n- Label provisional: ${r.ground_truth_category}; raw: ${r.raw_predicted_category??'unavailable'}; final: ${r.final_predicted_category??'unavailable'}\n- Status: ${r.request_status}; error: ${r.error_type??'none'}; fallback: ${r.fallback_applied??'unavailable'}\n- Confidence: ${r.confidence??'unavailable'}; review: ${r.needs_human_review??'unavailable'}\n`;
 }).join('\n')+(errors.length?'':'Tidak ada mismatch final sistem terhadap label provisional; ini tidak memvalidasi label atau populasi.\n'));
 console.log(JSON.stringify({output,planned:data.length,attempted:attempted.length,successful:successful.length,requests:records.length,retries:summary.retry_attempts,accuracy:metrics.accuracy,macro_f1:metrics.macro_f1}));
 return summary;
}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={classification,percentile};
