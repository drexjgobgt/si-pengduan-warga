// Historical baseline only: local computation, no provider or operational database.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const {CATEGORIES,MAPPING,hash,validateDataset,writeNew}=require('./lib.cjs');
const COMMIT='8d669965ac6048cf1af9abed470b49e7cad0def8';
const BLOB='4cbbb9f8b0aebd27915ff1b700730017c61d4d2f';
function metrics(rows){
  const matrix=Object.fromEntries(CATEGORIES.map(c=>[c,Object.fromEntries(CATEGORIES.map(p=>[p,0]))]));
  for(const r of rows){if(!matrix[r.ground_truth_category] || !(r.predicted_category in matrix[r.ground_truth_category]))throw new Error('Invalid metric labels');matrix[r.ground_truth_category][r.predicted_category]++;}
  const per=CATEGORIES.map(c=>{
    const tp=matrix[c][c],support=Object.values(matrix[c]).reduce((a,b)=>a+b,0);
    const predicted=CATEGORIES.reduce((a,t)=>a+matrix[t][c],0);
    const precision=predicted?tp/predicted:0,recall=support?tp/support:0;
    return {category:c,support,predicted,true_positive:tp,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0};
  });
  const correct=rows.filter(r=>r.ground_truth_category===r.predicted_category).length;
  return {denominator:rows.length,correct,accuracy:rows.length?correct/rows.length:null,
    macro_precision:per.reduce((a,r)=>a+r.precision,0)/CATEGORIES.length,
    macro_recall:per.reduce((a,r)=>a+r.recall,0)/CATEGORIES.length,
    macro_f1:per.reduce((a,r)=>a+r.f1,0)/CATEGORIES.length,zero_division:0,per_category:per,confusion_matrix:matrix};
}
async function main(){
  const dataset=path.join(__dirname,'dataset.provisional.json'),raw=fs.readFileSync(dataset);
  const rows=validateDataset(JSON.parse(raw)).filter(r=>r.split==='pilot_candidate');
  if(rows.length!==18)throw new Error('Pilot budget requires exactly 18 candidates');
  const out=path.join(__dirname,'baseline_pilot');
  if(fs.existsSync(out))throw new Error('Refusing overwrite');
  const git=(args)=>{const r=spawnSync('git',args,{cwd:__dirname,encoding:'utf8'});if(r.status!==0)throw new Error('Historical source unavailable');return r.stdout;};
  if(git(['rev-parse',`${COMMIT}:backend/services/classificationService.js`]).trim()!==BLOB)throw new Error('Historical blob mismatch');
  const source=git(['show',`${COMMIT}:backend/services/classificationService.js`]);
  // Execute only the inspected historical module; no require/process/network in context.
  const context=vm.createContext({module:{exports:{}},Date,console:{error:()=>{}}});
  new vm.Script(source,{filename:'historical_keyword_baseline.js'}).runInContext(context,{timeout:1000});
  const results=[];
  for(const row of rows){
    const start=performance.now();
    const result=await context.module.exports.classifyComplaint(row.complaint_text);
    results.push({sample_id:row.sample_id,ground_truth_category:row.ground_truth_category,
      predicted_category:result.category,ground_truth_department:row.ground_truth_department,
      department_from_mapping:MAPPING[result.category],department_label_origin:row.department_label_origin,
      confidence:result.confidence,confidence_origin:'historical_keyword_heuristic',
      latency_ms:performance.now()-start,model_id:result.modelVersion,label_validation_status:row.label_validation_status,
      evidence_kind:'ACTUAL_LOCAL_KEYWORD_BASELINE_PROVISIONAL_LABELS',timestamp:new Date().toISOString()});
  }
  fs.mkdirSync(out);
  writeNew(path.join(out,'historical_keyword_baseline.cjs'),source);
  writeNew(path.join(out,'predictions.json'),JSON.stringify(results,null,2)+'\n');
  const summary={evidence_kind:'ACTUAL_LOCAL_KEYWORD_BASELINE_PROVISIONAL_LABELS',source_commit:COMMIT,source_blob:BLOB,
    source_sha256:hash(source),dataset_sha256:hash(raw),split:'pilot_candidate',samples:rows.length,
    gold_status:'provisional_ai_authored_not_independent',real_api_requests:0,database_writes:0,
    classification:metrics(results),department_mapping_agreement:{denominator:results.length,
      correct:results.filter(r=>r.department_from_mapping===r.ground_truth_department).length,
      limitation:'Both reference and predicted department derived from same SIPW mapping; NOT independent department evaluation.'},
    limitation:'Small synthetic candidate pilot, known prompt context, no human validation; no LLM superiority comparison available.'};
  writeNew(path.join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({directory:out,samples:rows.length,correct:summary.classification.correct,
    accuracy:summary.classification.accuracy,macro_f1:summary.classification.macro_f1,real_api_requests:0}));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={metrics};
