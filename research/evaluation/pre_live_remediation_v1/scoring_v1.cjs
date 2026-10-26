// Pure scoring functions for the separately versioned pre-live contract.
// No filesystem, network, database, or production modules are loaded here.
const LABELS=Object.freeze(['sampah','jalan_rusak','banjir','listrik','air_bersih','keamanan','kesehatan','pendidikan','lainnya']);
const DEPARTMENTS=Object.freeze(['DLH','PUPR','DISHUB','SATPOLPP','DINKES','DISDIK','KELURAHAN']);
const PRIORITIES=Object.freeze(['rendah','normal','tinggi','darurat']);
function rawLabel(value){
 if(value==null)return {label:'__missing__',canonical:null};
 if(typeof value!=='string')return {label:'__invalid__',canonical:null};
 if(value===''||value.trim()==='')return {label:'__missing__',canonical:null};
 const canonical=value.trim().toLowerCase();
 return {label:LABELS.includes(value)?value:'__invalid__',canonical:LABELS.includes(canonical)?canonical:null};
}
function parsedJson(raw){
 if(typeof raw!=='string')return {value:null,json_pure:false,parse_mode:'unavailable'};
 try{const x=JSON.parse(raw);return {value:x,json_pure:Boolean(x&&typeof x==='object'&&!Array.isArray(x)),parse_mode:'direct'};}catch{}
 const block=raw.match(/\{[\s\S]*\}/);
 if(block){try{const x=JSON.parse(block[0]);return {value:x,json_pure:false,parse_mode:x&&typeof x==='object'&&!Array.isArray(x)?'recovered':'invalid'};}catch{}}
 return {value:null,json_pure:false,parse_mode:'failed'};
}
function schemaValid(x){
 if(!x||typeof x!=='object'||Array.isArray(x))return false;
 const own=k=>Object.prototype.hasOwnProperty.call(x,k);
 return own('category')&&typeof x.category==='string'&&LABELS.includes(x.category)
  && own('secondaryCategories')&&Array.isArray(x.secondaryCategories)&&x.secondaryCategories.every(c=>typeof c==='string'&&LABELS.includes(c))
  && new Set(x.secondaryCategories).size===x.secondaryCategories.length&&!x.secondaryCategories.includes(x.category)
  && own('suggestedDepartment')&&typeof x.suggestedDepartment==='string'&&DEPARTMENTS.includes(x.suggestedDepartment)
  && own('suggestedPriority')&&typeof x.suggestedPriority==='string'&&PRIORITIES.includes(x.suggestedPriority)
  && own('reason')&&typeof x.reason==='string'&&x.reason.trim().length>0&&x.reason.length<=500
  && own('confidence')&&Number.isInteger(x.confidence)&&x.confidence>=0&&x.confidence<=100
  && own('needsHumanReview')&&typeof x.needsHumanReview==='boolean';
}
function view(record,field){
 if(!record.attempted)return '__no_prediction__';
 if(field==='raw_exact')return rawLabel(record.raw_category).label;
 if(field==='raw_canonical')return rawLabel(record.raw_category).canonical|| (record.raw_category==null||typeof record.raw_category==='string'&&record.raw_category.trim()===''?'__missing__':'__invalid__');
 if(field==='final')return LABELS.includes(record.final_category)?record.final_category:record.final_category==null||record.final_category===''?'__missing__':'__invalid__';
 throw Error('Unknown prediction view');
}
function score(rows,{viewName='final'}={}){
 if(!Array.isArray(rows)||rows.length!==270)throw Error('Expected exactly 270 planned rows');
 if(new Set(rows.map(r=>r.sample_id)).size!==270||rows.some(r=>typeof r.sample_id!=='string'))throw Error('sample_id missing or duplicate');
 if(rows.some(r=>r.post_dispatched&&!r.attempted||r.http_status!=null&&!r.post_dispatched||r.service_success===true&&!r.attempted||r.error_type==='TIMEOUT'&&!r.post_dispatched))throw Error('Inconsistent attempt/dispatch/status record');
 const columns=[...LABELS,'__invalid__','__missing__','__no_prediction__'];
 const matrix=Object.fromEntries(LABELS.map(c=>[c,Object.fromEntries(columns.map(x=>[x,0]))]));
 for(const r of rows){if(!LABELS.includes(r.target))throw Error('Invalid frozen target');const pred=view(r,viewName);matrix[r.target][pred]++;}
 const per=LABELS.map(category=>{const tp=matrix[category][category],support=Object.values(matrix[category]).reduce((a,b)=>a+b,0),predicted=LABELS.reduce((a,t)=>a+matrix[t][category],0),fp=predicted-tp,fn=support-tp;
  const precision=tp+fp?tp/(tp+fp):0,recall=tp+fn?tp/(tp+fn):0;return {category,tp,fp,fn,support,predicted,precision,recall,f1:2*tp+fp+fn?2*tp/(2*tp+fp+fn):0};});
 const attempted=rows.filter(r=>r.attempted),dispatched=rows.filter(r=>r.post_dispatched),observed=rows.filter(r=>r.http_status!=null),success=rows.filter(r=>r.service_success===true);
 const strict=rows.filter(r=>r.attempted&&r.http_status!=null&&r.http_status>=200&&r.http_status<300&&r.json_pure===true&&r.schema_valid===true&&!r.response_truncated);
 const durations=xs=>{const a=xs.filter(x=>Number.isFinite(x)).sort((x,y)=>x-y);const q=p=>{if(!a.length)return null;const h=(a.length-1)*p,l=Math.floor(h),u=Math.ceil(h);return a[l]+(a[u]-a[l])*(h-l);};return {n:a.length,median:q(.5),p95:q(.95)};};
 const fail=attempted.filter(r=>r.service_success!==true).length;
 const invalid2xx=observed.filter(r=>r.http_status>=200&&r.http_status<300&&!strict.includes(r)).length;
 const correct=LABELS.reduce((n,c)=>n+matrix[c][c],0);
 const rate=(n,d)=>({count:n,denominator:d,value:d?n/d:null});
 return {view:viewName,planned:rows.length,attempted:attempted.length,post_dispatched:dispatched.length,http_observed:observed.length,service_success:success.length,strict_valid:strict.length,
  matches:correct,accuracy:correct/rows.length,macro_precision:per.reduce((a,x)=>a+x.precision,0)/LABELS.length,macro_recall:per.reduce((a,x)=>a+x.recall,0)/LABELS.length,macro_f1:per.reduce((a,x)=>a+x.f1,0)/LABELS.length,
  strict_valid_rate:rate(strict.length,attempted.length),failure_rate:rate(fail,attempted.length),invalid_http_2xx_rate:rate(invalid2xx,observed.filter(r=>r.http_status>=200&&r.http_status<300).length),
  http_error_rate:rate(observed.filter(r=>r.http_status<200||r.http_status>=300).length,dispatched.length),timeout_rate:rate(attempted.filter(r=>r.error_type==='TIMEOUT').length,dispatched.length),
  coverage:rate(attempted.length,rows.length),latency_all:durations(attempted.map(r=>r.latency_ms)),latency_success:durations(success.map(r=>r.latency_ms)),per_category:per,confusion_matrix:matrix,
  fallback:{full:attempted.filter(r=>r.full_fallback).length,category:attempted.filter(r=>r.category_fallback).length,department:attempted.filter(r=>r.department_fallback).length,priority:attempted.filter(r=>r.priority_fallback).length,confidence:attempted.filter(r=>r.confidence_imputed||r.confidence_clamped).length}};
}
module.exports={LABELS,DEPARTMENTS,PRIORITIES,rawLabel,parsedJson,schemaValid,score};
