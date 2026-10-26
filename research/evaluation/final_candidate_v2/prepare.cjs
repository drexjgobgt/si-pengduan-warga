// Prepare NEW synthetic candidate and blind human packets. Fails closed on existing targets.
const fs=require('node:fs'),path=require('node:path');
const {hash,validateDataset,MAPPING}=require('../lib.cjs');
const source=require('./candidates.cjs');
const root=__dirname,prior=validateDataset(JSON.parse(fs.readFileSync(path.join(root,'../dataset.provisional.json'))));
const data=source.map(([category,type,title,description],i)=>({
 sample_id:`SIPW-EVAL-CAND-${String(i+1).padStart(4,'0')}`,title,description,complaint_text:`${title}\n${description}`,
 ground_truth_category:category,ground_truth_department:MAPPING[category],department_label_eligible:true,
 department_label_origin:'sipw_mapping_provisional_not_independent_domain_judgment',sample_type:type,
 data_source:'synthetic_ai_authored',label_validation_status:'provisional',split:'final',provenance_id:'synthetic_final_candidate_v2',
}));
if(data.length!==27||new Set(data.map(r=>r.ground_truth_category)).size!==9||new Set(data.map(r=>r.sample_type)).size!==7)throw Error('Coverage insufficient');
validateDataset(data);
const normalize=t=>t.toLowerCase().replace(/\s+/g,' ').trim();
const old=new Set(prior.map(r=>normalize(r.complaint_text)));
if(data.some(r=>old.has(normalize(r.complaint_text))))throw Error('Exact text overlap with development/pilot');
const names=['dataset.candidate.json','manifest.json','rater_A.blank.json','rater_B.blank.json'];
if(names.some(n=>fs.existsSync(path.join(root,n))))throw Error('Refuse overwrite');
const text=JSON.stringify(data,null,2)+'\n',bytes=fs.readFileSync(path.join(root,'../dataset.provisional.json'));
const counts=k=>Object.fromEntries([...new Set(data.map(r=>r[k]))].map(x=>[x,data.filter(r=>r[k]===x).length]));
const manifest={created_at:new Date().toISOString(),candidate_sha256:hash(text),source_sha256:hash(fs.readFileSync(path.join(root,'candidates.cjs'))),
 prior_dataset_sha256:hash(bytes),n:data.length,categories:counts('ground_truth_category'),types:counts('sample_type'),
 exact_text_overlap_with_prior:0,independent_labels:0,final_dataset_frozen:false,
 limitations:'AI-authored synthetic candidates and provisional labels; not real complaints; not representative; exact duplicate check only, semantic leakage still possible'};
const blind=data.map(r=>({sample_id:r.sample_id,title:r.title,description:r.description,category_label:null,
 department_label:null,department_label_origin:null,secondary_categories:null,uncertain:null,rationale:null}));
const writes=[text,JSON.stringify(manifest,null,2)+'\n',...['A','B'].map(role=>JSON.stringify({dataset_sha256:hash(text),
 role:`rater_${role}`,completed:false,rater_identity_pseudonym:null,purpose:'Human independent rating; no model or AI provisional labels included',rows:blind},null,2)+'\n')];
for(let i=0;i<names.length;i++)fs.writeFileSync(path.join(root,names[i]),writes[i],{flag:'wx'});
console.log(JSON.stringify({candidate_sha256:hash(text),n:data.length,categories:manifest.categories,types:manifest.types,independent_labels:0,api_requests:0,db_writes:0}));
