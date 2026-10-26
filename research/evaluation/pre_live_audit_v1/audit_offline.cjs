// Audit only: read frozen inputs, write exclusively to THIS new audit directory.
// Never import production modules, dotenv, HTTP clients, or database adapters.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const out=__dirname,root=path.resolve(out,'../../..'),dir=path.join(root,'research/evaluation/synthetic_final_v1');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=n=>fs.readFileSync(path.join(dir,n)),json=n=>JSON.parse(read(n));
const save=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const expected={'synthetic_scenario_registry.json':'e663226792e23eef1c5e277a066aeb5dae35e554c2c379befd5ae1df0babfa03','synthetic_dataset.json':'98a2d730f8272969d2576e6385a0b36b9453d8ba2e85e87dc7ca86611bb63e3e','dataset_manifest.json':'6e5c0fcd1a9bcfa3eeb239f8d4f73648a0291c121c420cecc63d8d858b4dd343'};
const frozenNames=['synthetic_scenario_registry.json','synthetic_dataset.json','dataset_manifest.json','frozen_experiment_protocol.md','registry_freeze_receipt.json','qa_checks.json','keyword_baseline/predictions.json','keyword_baseline/manifest.json'];
const before=Object.fromEntries(frozenNames.map(n=>[n,hash(read(n))]));
const registry=json('synthetic_scenario_registry.json'),data=json('synthetic_dataset.json'),m=json('dataset_manifest.json'),p=json('keyword_baseline/predictions.json'),bm=json('keyword_baseline/manifest.json');
const C=['sampah','jalan_rusak','banjir','listrik','air_bersih','keamanan','kesehatan','pendidikan','lainnya'];
const duplicates=a=>[...new Set(a.filter((x,i)=>a.indexOf(x)!==i))];
const ids=data.map(x=>x.sample_id),rid=registry.rows.map(x=>x.sample_id),pid=p.map(x=>x.sample_id);
const target=new Map(registry.rows.map(r=>[r.sample_id,r.target_category]));
const distribution=Object.fromEntries(C.map(c=>[c,registry.rows.filter(r=>r.target_category===c).length]));
const checks={dataset_count:data.length,registry_count:registry.rows.length,baseline_count:p.length,
 dataset_duplicate_ids:duplicates(ids),registry_duplicate_ids:duplicates(rid),baseline_duplicate_ids:duplicates(pid),
 missing_targets:ids.filter(id=>!rid.includes(id)),extra_targets:rid.filter(id=>!ids.includes(id)),
 missing_baseline:ids.filter(id=>!pid.includes(id)),extra_baseline:pid.filter(id=>!ids.includes(id)),
 invalid_targets:registry.rows.filter(r=>!C.includes(r.target_category)).map(r=>r.sample_id),
 target_distribution:distribution,narrative_field_keys:[...new Set(data.flatMap(r=>Object.keys(r)))],
 baseline_target_mismatches:p.filter(r=>r.target_category!==target.get(r.sample_id)).map(r=>r.sample_id)};
const structureOK=data.length===270&&registry.rows.length===270&&p.length===270&&Object.values(distribution).every(n=>n===30)&&['dataset_duplicate_ids','registry_duplicate_ids','baseline_duplicate_ids','missing_targets','extra_targets','missing_baseline','extra_baseline','invalid_targets','baseline_target_mismatches'].every(k=>checks[k].length===0);
const matrix=Object.fromEntries(C.map(c=>[c,Object.fromEntries([...C,'__invalid__','__missing__'].map(k=>[k,0]))]));
const mismatches=[];let correct=0;
for(const row of p){const t=target.get(row.sample_id);if(!C.includes(t))throw Error('Invalid authoritative target');const guess=row.predicted_category;
 matrix[t][guess==null?'__missing__':C.includes(guess)?guess:'__invalid__']++;
 if(guess===t)correct++;else mismatches.push({sample_id:row.sample_id,target:t,predicted:guess??null});}
const per=C.map(c=>{const tp=matrix[c][c],support=Object.values(matrix[c]).reduce((a,b)=>a+b,0),predicted=C.reduce((a,t)=>a+matrix[t][c],0);
 const precision=predicted?tp/predicted:0,recall=support?tp/support:0;return {category:c,tp,support,predicted,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0};});
save('baseline_reproduction.json',{status:structureOK&&correct===178&&bm.target_matches===correct?'PASS':'FAIL',method:'Recount persisted predictions against registry by sample_id, exact string equality; no classifier executed',
 denominator:data.length,prediction_rows:p.length,matches:correct,mismatches:mismatches.length,reported_matches:178,difference_from_reported:correct-178,
 accuracy:correct/data.length,macro_precision:per.reduce((a,b)=>a+b.precision,0)/9,macro_recall:per.reduce((a,b)=>a+b.recall,0)/9,macro_f1:per.reduce((a,b)=>a+b.f1,0)/9,
 per_category:per,confusion_matrix:matrix,mismatch_samples:mismatches,zero_division:0,
 predictions_sha256:before['keyword_baseline/predictions.json'],registry_sha256:before['synthetic_scenario_registry.json'],
 limitation:'Reproduces metrics from stored predictions only, not a new execution of historical keyword classifier; not LLM performance or population accuracy.'});
const artifacts=Object.entries(expected).map(([n,e])=>({path:'research/evaluation/synthetic_final_v1/'+n,expected_sha256:e,actual_sha256:before[n],status:before[n]===e?'PASS':'FAIL'}));
save('hash_verification.json',{audited_at:new Date().toISOString(),algorithm:'SHA-256 raw file bytes, no newline normalization',artifacts,
 internal_references:{registry_in_manifest:m.registry_sha256===before['synthetic_scenario_registry.json'],dataset_in_manifest:m.dataset_sha256===before['synthetic_dataset.json'],qa_in_manifest:m.qa_checks_sha256===before['qa_checks.json'],registry_in_receipt:json('registry_freeze_receipt.json').registry_sha256===before['synthetic_scenario_registry.json'],baseline_dataset:bm.dataset_sha256===before['synthetic_dataset.json'],baseline_registry:bm.registry_sha256===before['synthetic_scenario_registry.json']},
 source_fingerprints:Object.fromEntries(['backend/services/classificationService.js','backend/config/kiosApi.js'].map(n=>[n,hash(fs.readFileSync(path.join(root,n)))]))});
save('dataset_integrity.json',{status:structureOK?'PASS':'FAIL',...checks,families:new Set(registry.rows.map(r=>r.family_id)).size,
 case_type_distribution:Object.fromEntries([...new Set(registry.rows.map(r=>r.case_type))].map(k=>[k,registry.rows.filter(r=>r.case_type===k).length])),
 limitation:'ID consistency and distribution do not independently validate semantic targets or representativeness.'});
const blockers=[
 {id:'B01',status:'NOT VERIFIED',scope:'external',finding:'Actual model identity/version, alias stability and provider behavior for next run unavailable offline',required:'Document provider identity/version or alias limitations, verify returned ID and drift stop rule before approved live'},
 {id:'B02',status:'NOT VERIFIED',scope:'external',finding:'Effective Free-Pro key-group pricing, extra fees, account quota/RPM and hard Rp0 billing protection have no current account evidence',required:'Obtain sanitized current pricing/account quota and provider-side no-spend control; if no enforceable Rp0 control, keep live blocked'},
 {id:'B03',status:'FAIL',scope:'implementation',finding:'Free-only branch in kiosApi.js:112–122 does not reject paid models and does not cap monetary charges',required:'Do not rely on FREE_ONLY flag; approve independent fail-closed evaluation guards and proven provider no-spend restriction; no production edits authorized'},
 {id:'B04',status:'NOT VERIFIED',scope:'harness',finding:'No audited synthetic_final_v1 live runner implementing 270 cap, raw capture, spacing, hard deadline, stop, checkpoint/resume and no replay was found',required:'Create separate runner only after authorization and validate offline with fixture/failure/counter/resume tests; inspect effective config without revealing secrets'},
 {id:'B05',status:'NOT VERIFIED',scope:'protocol',finding:'Frozen short protocol does not fully specify strict JSON validity vs parser recovery, raw label canonicalization, failure/validity denominators or per-field fallback classification',required:'Approve separate versioned metrics annex before live, preserving frozen protocol; unit-test formulas and edge cases'},
 {id:'B06',status:'NOT VERIFIED',scope:'quota_schedule',finding:'Default local counter 200/day shared with chat; 270 POST scheduling and provider quota are unverified',required:'Approve rate/day schedule consistent with real quota; never restart to evade limit; distinguish local rejected attempts from sent POST'},
 {id:'B07',status:'NOT VERIFIED',scope:'design',finding:'55 families, deterministic text templates and construction-only semantic QA; ambiguity label may conflict with production prompt ambiguous=>lainnya',required:'Explicitly accept synthetic-design limitations or prepare new dataset/protocol version before model predictions; never mutate frozen v1'},
 {id:'B08',status:'NOT VERIFIED',scope:'authorization',finding:'User permits this audit only; final live execution approval is absent',required:'Explicit approval for exact run manifest, max 270 POST/no retry/Rp0 after substantive blockers closed'}];
save('live_blockers.json',{decision:'NOT READY',live_allowed:false,decision_is_api_authorization:false,blockers,api_calls_this_audit:0,database_access_this_audit:0,production_changes:0,push_performed:false});
const after=Object.fromEntries(frozenNames.map(n=>[n,hash(read(n))]));
save('preservation_verification.json',{status:frozenNames.every(n=>before[n]===after[n])?'PASS':'FAIL',files:frozenNames.map(n=>({path:n,before_sha256:before[n],after_sha256:after[n],unchanged:before[n]===after[n]}))});
console.log(JSON.stringify({dataset_structure:structureOK?'PASS':'FAIL',hashes:artifacts.map(x=>x.status),baseline:{matches:correct,mismatches:mismatches.length,denominator:data.length,macro_f1:per.reduce((a,b)=>a+b.f1,0)/9},decision:'NOT READY',api_calls:0,db_access:0}));
