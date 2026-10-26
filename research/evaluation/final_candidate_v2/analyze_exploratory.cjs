// Only compute exploratory metrics from persisted attempts; never trigger provider requests.
const fs=require('node:fs'),path=require('node:path');
const {CATEGORIES,MAPPING,hash,validateDataset}=require('../lib.cjs');
const {classification,percentile}=require('../analyze_pilot.cjs');
const root=__dirname,run=path.join(root,'exploratory_run_v1'),output=path.join(root,'exploratory_analysis_v1');
if(!fs.existsSync(run)||fs.existsSync(output))throw Error('Run absent or output already exists');
if(fs.existsSync(path.join(run,'.lock'))||fs.readdirSync(run).some(n=>n.endsWith('.pending')))throw Error('Run active or uncertain; do not summarize');
const bytes=fs.readFileSync(path.join(root,'dataset.candidate.json')),dataset=validateDataset(JSON.parse(bytes)),manifest=JSON.parse(fs.readFileSync(path.join(run,'manifest.json')));
const aBytes=fs.readFileSync(path.join(root,'rater_A_completed.json')),bBytes=fs.readFileSync(path.join(root,'rater_B_completed.json'));
const a=JSON.parse(aBytes),b=JSON.parse(bBytes);
if(manifest.protocol!=='exploratory_v1'||manifest.mode!=='LIVE'||manifest.model!=='minimax-m3.1-flash-free'||manifest.dataset_sha256!==hash(bytes)||manifest.rater_A_sha256!==hash(aBytes)||manifest.rater_B_sha256!==hash(bBytes))throw Error('Run/dataset/labels mismatch');
const reference=new Map(a.rows.map(r=>[r.sample_id,r]));
const records=[],selected=[];
for(const row of dataset){const file=path.join(run,`${row.sample_id}.json`);const label=reference.get(row.sample_id),other=b.rows.find(r=>r.sample_id===row.sample_id);
 if(!label||!other||label.category_label!==other.category_label)throw Error('Label disputed or missing');
 if(!fs.existsSync(file)){selected.push({sample_id:row.sample_id,ground_truth_category:label.category_label,ground_truth_department:label.department_label,
  final_predicted_category:null,raw_predicted_category:null,final_suggested_department:null,raw_suggested_department:null,
  routing_department_simulated:null,request_status:'unattempted',sample_type:row.sample_type});continue;}
 const record=JSON.parse(fs.readFileSync(file));
 if(record.sample_id!==row.sample_id||record.ground_truth_category!==label.category_label||record.model_id&&record.model_id!=='minimaxai/minimax-m3.1-flash')throw Error('Record identity/model mismatch');
 records.push(record);selected.push(record);
}
const stats=pairs=>classification(pairs,CATEGORIES);
const final=stats(selected.map(r=>[r.ground_truth_category,r.final_predicted_category]));
const raw=stats(selected.map(r=>[r.ground_truth_category,r.raw_predicted_category]));
const departments=classification(selected.map(r=>[r.ground_truth_department,r.final_suggested_department]),[...new Set(Object.values(MAPPING))]);
const routed=classification(selected.map(r=>[r.ground_truth_department,r.routing_department_simulated]),[...new Set(Object.values(MAPPING))]);
const attempted=records.length,successful=records.filter(r=>r.request_status==='success'),rate=(n,d)=>({count:n,denominator:d,value:d?n/d:null});
const baseDir=path.join(root,'exploratory_keyword_baseline_v1'),baseManifest=JSON.parse(fs.readFileSync(path.join(baseDir,'manifest.json')));
if(baseManifest.dataset_sha256!==hash(bytes)||baseManifest.rater_A_sha256!==hash(aBytes))throw Error('Baseline mismatch');
const baseline=JSON.parse(fs.readFileSync(path.join(baseDir,'predictions.json')));
const baseStats=stats(baseline.map(r=>[r.ground_truth_category,r.predicted_category]));
const summary={generated_at:new Date().toISOString(),status:attempted===dataset.length?'EXPLORATORY_ALL_ATTEMPTED':'EXPLORATORY_PARTIAL',
 label_status:'TWO_AI_PROVISIONAL_NOT_HUMAN_GROUND_TRUTH',dataset_sha256:hash(bytes),planned:dataset.length,attempted,unattempted:dataset.length-attempted,
 success:successful.length,request_attempts:attempted,strict_valid_rate:rate(records.filter(r=>r.output_valid).length,attempted),
 failure_rate:rate(records.filter(r=>r.request_status!=='success').length,attempted),
 timeout_rate:rate(records.filter(r=>r.error_type==='TIMEOUT').length,attempted),
 fallback_count:records.filter(r=>r.fallback_applied).length,http_429:records.filter(r=>r.http_status===429).length,
 latency_all_attempts_ms:{median:percentile(records.map(r=>r.latency_ms),.5),p95:percentile(records.map(r=>r.latency_ms),.95)},
 latency_success_ms:{median:percentile(successful.map(r=>r.latency_ms),.5),p95:percentile(successful.map(r=>r.latency_ms),.95)},
 final_system_all_planned:final,raw_model_all_planned:raw,
 conditional_success:stats(successful.map(r=>[r.ground_truth_category,r.final_predicted_category])),
 department_normalized_against_mapping:departments,department_simulated_routing_against_mapping:routed,
 keyword_baseline_same_synthetic_samples:baseStats,
 review:{reviewed:records.filter(r=>r.needs_human_review===true).length,not_reviewed:records.filter(r=>r.needs_human_review===false).length,
  high_confidence_wrong:records.filter(r=>r.confidence>=80&&r.final_predicted_category!==r.ground_truth_category).map(r=>r.sample_id)},
 limitations:['AI-authored synthetic texts and AI-only provisional reference labels; no independent human validation','Model was selected on a previous development split; semantic leakage remains possible','Mapping department is not independent institutional judgment','Service pool=null default catalog; no operational DB persistence verified','No actual account charge observable from API; no claims about human-review effectiveness or model superiority']};
const csv=(rows,keys)=>keys.join(',')+'\n'+rows.map(r=>keys.map(k=>'"'+String(r[k]==null?'':typeof r[k]==='object'?JSON.stringify(r[k]):r[k]).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
fs.mkdirSync(output);const write=(name,txt)=>fs.writeFileSync(path.join(output,name),txt,{flag:'wx'});
write('results_summary.json',JSON.stringify(summary,null,2)+'\n');
const keys=['sample_id','ground_truth_category','raw_predicted_category','final_predicted_category','ground_truth_department','raw_suggested_department','final_suggested_department','routing_department_simulated','secondary_categories','suggested_priority','confidence','needs_human_review','fallback_applied','output_valid','latency_ms','request_status','error_type','model_id','prompt_version','timestamp'];
write('predictions.csv',csv(selected,keys));write('metrics_by_category.csv',csv(final.per_category,['category','support','predicted','tp','precision','recall','f1']));
write('confusion_matrix.csv',csv(CATEGORIES.map(c=>({ground_truth:c,...final.confusion_matrix[c]})),['ground_truth',...final.columns]));
write('department_results.csv',csv(departments.per_category,['category','support','predicted','tp','precision','recall','f1']));
const mismatches=selected.filter(r=>r.ground_truth_category!==r.final_predicted_category);
write('error_analysis.md','# Analisis ketidakcocokan eksploratori\n\nLabel hanya provisional AI; sampel sintetis; jangan tafsirkan sebagai kesalahan terhadap ground truth manusia.\n\n'+mismatches.map(r=>{
 const row=dataset.find(d=>d.sample_id===r.sample_id);return `## ${r.sample_id}\n- Jenis: ${row.sample_type}\n- Teks sintetis: ${row.complaint_text}\n- Label AI provisional: ${r.ground_truth_category}; raw: ${r.raw_predicted_category??'unavailable'}; final: ${r.final_predicted_category??'unavailable'}\n- Status: ${r.request_status}; error: ${r.error_type??'none'}; fallback: ${r.fallback_applied??'unavailable'}\n- Confidence: ${r.confidence??'unavailable'}; review: ${r.needs_human_review??'unavailable'}\n`;}).join('\n')+(mismatches.length?'':'Tidak ada ketidakcocokan dengan label AI provisional pada sampel ini; itu tidak membuktikan validitas label.\n'));
console.log(JSON.stringify({status:summary.status,planned:dataset.length,attempted,success:successful.length,match:final.correct,denominator:final.denominator,macro_f1:final.macro_f1,baseline_match:baseStats.correct,output}));
