// Re-run unchanged historical keyword classifier against new synthetic candidates. No API/DB.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const {hash,validateDataset,MAPPING}=require('../lib.cjs');
const root=__dirname,out=path.join(root,'exploratory_keyword_baseline_v1');
if(fs.existsSync(out))throw Error('Output already exists');
const bytes=fs.readFileSync(path.join(root,'dataset.candidate.json')),rows=validateDataset(JSON.parse(bytes));
const a=JSON.parse(fs.readFileSync(path.join(root,'rater_A_completed.json'))),b=JSON.parse(fs.readFileSync(path.join(root,'rater_B_completed.json')));
if(rows.length!==27||a.dataset_sha256!==hash(bytes)||b.dataset_sha256!==hash(bytes))throw Error('Label/data mismatch');
const commit='8d669965ac6048cf1af9abed470b49e7cad0def8',blob='4cbbb9f8b0aebd27915ff1b700730017c61d4d2f';
const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'});
if(git(['rev-parse',`${commit}:backend/services/classificationService.js`]).trim()!==blob)throw Error('Historical source mismatch');
const source=git(['show',`${commit}:backend/services/classificationService.js`]);
const sandbox=vm.createContext({module:{exports:{}},Date,console:{error:()=>{}}});
new vm.Script(source,{filename:'historical_keyword_baseline.js'}).runInContext(sandbox,{timeout:1000});
async function main(){
 const result=[];
 for(const row of rows){const gold=a.rows.find(x=>x.sample_id===row.sample_id),other=b.rows.find(x=>x.sample_id===row.sample_id);
  if(!gold||!other||gold.category_label!==other.category_label||gold.title!==row.title||gold.description!==row.description)throw Error('Missing or disputed main category');
  const start=performance.now(),r=await sandbox.module.exports.classifyComplaint(row.complaint_text);
  result.push({sample_id:row.sample_id,ground_truth_category:gold.category_label,predicted_category:r.category,
   ground_truth_department:gold.department_label,department_from_mapping:MAPPING[r.category],latency_ms:performance.now()-start,
   label_status:'AI_PROVISIONAL_NOT_HUMAN',model_id:r.modelVersion});
 }
 fs.mkdirSync(out);fs.writeFileSync(path.join(out,'predictions.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({source_commit:commit,source_blob:blob,source_sha256:hash(source),dataset_sha256:hash(bytes),
   rater_A_sha256:hash(fs.readFileSync(path.join(root,'rater_A_completed.json'))),rater_B_sha256:hash(fs.readFileSync(path.join(root,'rater_B_completed.json'))),
   label_status:'AI_PROVISIONAL_NOT_HUMAN',api_requests:0,db_writes:0,samples:result.length},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({samples:result.length,provisional_matches:result.filter(r=>r.ground_truth_category===r.predicted_category).length,api_requests:0,output:out}));
}
main().catch(e=>{console.error(JSON.stringify({status:'FAILED',error_type:e.name}));process.exitCode=1;});
