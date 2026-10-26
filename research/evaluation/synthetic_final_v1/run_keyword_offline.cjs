// Execute inspected historical baseline AFTER dataset freeze only. No network/DB.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),vm=require('node:vm');
const root=__dirname,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const m=JSON.parse(fs.readFileSync(path.join(root,'dataset_manifest.json'))),db=fs.readFileSync(path.join(root,'synthetic_dataset.json')),rb=fs.readFileSync(path.join(root,'synthetic_scenario_registry.json'));
if(m.status!=='FROZEN_SYNTHETIC_RULE_TARGETS'||hash(db)!==m.dataset_sha256||hash(rb)!==m.registry_sha256)throw Error('Not frozen or hash mismatch');
const out=path.join(root,'keyword_baseline');if(fs.existsSync(out))throw Error('Refuse overwrite');
const commit='8d669965ac6048cf1af9abed470b49e7cad0def8',blob='4cbbb9f8b0aebd27915ff1b700730017c61d4d2f';
const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'});
if(git(['rev-parse',commit+':backend/services/classificationService.js']).trim()!==blob)throw Error('Baseline identity mismatch');
const source=git(['show',commit+':backend/services/classificationService.js']);
const sandbox=vm.createContext({module:{exports:{}},Date,console:{error:()=>{}}});new vm.Script(source).runInContext(sandbox,{timeout:1000});
async function main(){const targets=new Map(JSON.parse(rb).rows.map(r=>[r.sample_id,r])),result=[];
 for(const r of JSON.parse(db)){const t=targets.get(r.sample_id),start=performance.now(),p=await sandbox.module.exports.classifyComplaint(r.complaint_text);
 result.push({sample_id:r.sample_id,target_category:t.target_category,target_origin:t.target_origin,family_id:t.family_id,case_type:t.case_type,predicted_category:p.category,confidence:p.confidence,latency_ms:performance.now()-start,model_id:p.modelVersion});}
 fs.mkdirSync(out);fs.writeFileSync(path.join(out,'predictions.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 const matches=result.filter(r=>r.target_category===r.predicted_category).length;
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({executed_at:new Date().toISOString(),dataset_frozen_at:m.frozen_at,source_commit:commit,source_blob:blob,source_sha256:hash(source),dataset_sha256:hash(db),registry_sha256:hash(rb),samples:result.length,target_matches:matches,api_requests:0,db_access:0,label_status:'SCENARIO_RULE_TARGET_NOT_HUMAN'},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({samples:result.length,target_matches:matches,api_requests:0,db_access:0}));}
main().catch(e=>{console.error(e.name);process.exitCode=1;});
