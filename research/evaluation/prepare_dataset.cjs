const fs = require('node:fs');
const path = require('node:path');
const candidates = require('./dataset_candidates.cjs');
const { MAPPING,hash,validateDataset,writeNew } = require('./lib.cjs');
const file = path.join(__dirname,'dataset.provisional.json');
const manifest = path.join(__dirname,'dataset_manifest.json');
if ([file,manifest].some(f => fs.existsSync(f))) throw new Error('Refusing overwrite: dataset already prepared');
const data = candidates.map(([category,type,title,description],i) => ({ sample_id:`SIPW-CAND-${String(i+1).padStart(4,'0')}`,
  title,description,complaint_text:`${title}\n${description}`,ground_truth_category:category,
  ground_truth_department:MAPPING[category],department_label_eligible:true,department_label_origin:'sipw_mapping_not_independent_domain_judgment',
  sample_type:type,data_source:'synthetic_ai_authored',label_validation_status:'provisional',
  split:i<9?'dev':'pilot_candidate',provenance_id:'synthetic_candidates_v1' }));
validateDataset(data);
const text = JSON.stringify(data,null,2)+'\n';
writeNew(file,text);
const counts = key => Object.fromEntries([...new Set(data.map(r=>r[key]))].map(v=>[v,data.filter(r=>r[key]===v).length]));
writeNew(manifest,JSON.stringify({created_at:new Date().toISOString(),sha256:hash(text),total:data.length,
  categories:counts('ground_truth_category'),types:counts('sample_type'),splits:counts('split'),
  independently_validated:false,final_dataset:false,predictions_used_for_labeling:false,
  limitation:'AI-authored candidate text and labels; no human independent validation; not population-representative. Department gold derived from SIPW mapping.'},null,2)+'\n');
console.log(JSON.stringify({dataset:file,total:data.length,sha256:hash(text),api_requests:0}));
