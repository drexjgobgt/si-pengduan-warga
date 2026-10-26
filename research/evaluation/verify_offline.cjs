// Verify dry-run/checkpoint/failure handling. Never reports classification accuracy.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {hash,validateDataset}=require('./lib.cjs');
const {run}=require('./evaluate.cjs');
async function main(){
  const datasetPath=path.join(__dirname,'dataset.provisional.json');
  const data=validateDataset(JSON.parse(fs.readFileSync(datasetPath)));
  const reportFile=path.join(__dirname,'evidence/offline_verification.json');
  if(fs.existsSync(reportFile))throw new Error('Refusing report overwrite');
  const runRoot=path.join(__dirname,'runs');fs.mkdirSync(runRoot,{recursive:true});
  const root=fs.mkdtempSync(path.join(runRoot,'offline-verification-'));
  const dry=path.join(root,'dry-run'),fixtures=path.join(root,'fixtures');
  const args=out=>['--dataset',datasetPath,'--out',out];
  const checks=[];
  const first=await run(args(dry));assert.equal(first.processed_this_invocation,data.length);checks.push('dry_run_all_samples');
  const jsonFiles=fs.readdirSync(dry).filter(n=>n!== 'manifest.json' && n.endsWith('.json'));
  assert.equal(jsonFiles.length,data.length);
  const before=Object.fromEntries(jsonFiles.map(n=>[n,hash(fs.readFileSync(path.join(dry,n)))]));
  const resumed=await run([...args(dry),'--resume']);assert.equal(resumed.processed_this_invocation,0);assert.equal(resumed.checkpoint_skipped,data.length);
  for(const n of jsonFiles)assert.equal(hash(fs.readFileSync(path.join(dry,n))),before[n]);
  checks.push('resume_skips_completed_without_modification');
  await assert.rejects(()=>run(args(dry)),/Output exists/);checks.push('accidental_overwrite_rejected');
  const changed=JSON.parse(JSON.stringify(data));changed[0].description+=' Tambahan.';changed[0].complaint_text=`${changed[0].title}\n${changed[0].description}`;
  const changedPath=path.join(root,'changed-dataset.json');fs.writeFileSync(changedPath,JSON.stringify(changed),{flag:'wx'});
  await assert.rejects(()=>run(['--dataset',changedPath,'--out',dry,'--resume']),/mismatch/);checks.push('resume_changed_dataset_rejected');
  await run([...args(fixtures),'--mode','offline-fixtures']);
  const records=fs.readdirSync(fixtures).filter(n=>n!=='manifest.json'&&n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(fixtures,n))));
  assert.equal(records.length,data.length);
  assert.equal(records.filter(r=>r.error_type==='HTTP_429').length,5);
  assert.equal(records.filter(r=>r.error_type==='TIMEOUT').length,5);
  assert.equal(records.filter(r=>r.output_valid).length,6);
  assert.equal(records.filter(r=>r.fallback_applied).length,21);
  assert.equal(records.filter(r=>r.error_type==='INVALID_OUTPUT').length,6);
  assert.ok(records.every(r=>r.real_api_requests===0 && r.evidence_kind==='OFFLINE_ONLY_NOT_LLM_RESULTS'));
  checks.push('production_path_mock_success_invalid_json_unknown_category_429_timeout');
  // A pending attempt with no completed result must stop instead of replaying.
  const pendingOut=path.join(root,'uncertain-checkpoint');fs.mkdirSync(pendingOut);
  fs.copyFileSync(path.join(dry,'manifest.json'),path.join(pendingOut,'manifest.json'));
  fs.writeFileSync(path.join(pendingOut,`${hash(data[0].sample_id)}.pending`),'{}',{flag:'wx'});
  await assert.rejects(()=>run([...args(pendingOut),'--resume']),/Uncertain previous attempt/);checks.push('uncertain_attempt_not_replayed');
  const lockOut=path.join(root,'locked');fs.mkdirSync(lockOut);fs.writeFileSync(path.join(lockOut,'.lock'),'existing',{flag:'wx'});
  await assert.rejects(()=>run([...args(lockOut),'--resume']));assert.equal(fs.readFileSync(path.join(lockOut,'.lock'),'utf8'),'existing');checks.push('concurrent_lock_preserved');
  // Unit runner is a separate process; stdout is test evidence, not synthetic model evidence.
  const result=spawnSync(process.execPath,['--test',path.join(__dirname,'harness.test.cjs')],{encoding:'utf8',env:{...process.env,KIOSAPI_API_KEY:'',NODE_OPTIONS:''}});
  fs.writeFileSync(path.join(root,'unit-tests.txt'),result.stdout+result.stderr,{flag:'wx'});
  assert.equal(result.status,0);checks.push('unit_suite_passed');
  const report={timestamp:new Date().toISOString(),evidence_kind:'OFFLINE_HARNESS_VERIFICATION_ONLY',dataset_count:data.length,
    dataset_sha256:hash(fs.readFileSync(datasetPath)),checks,run_directory:path.relative(__dirname,root),
    fixtures:{success_canned:6,invalid_json:6,http429:5,unknown_category:5,timeout:5},
    real_api_requests:0,real_database_connections:0,llm_metrics_computed:false};
  fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(result.stdout);console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
