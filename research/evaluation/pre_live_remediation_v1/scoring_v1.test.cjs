const test=require('node:test'),assert=require('node:assert/strict');
const {LABELS,rawLabel,parsedJson,schemaValid,score}=require('./scoring_v1.cjs');
const valid=category=>({category,secondaryCategories:[],suggestedDepartment:'DLH',suggestedPriority:'normal',reason:'alasan',confidence:80,needsHumanReview:false});
function rows(){return Array.from({length:270},(_,i)=>({sample_id:`ID-${i}`,target:LABELS[i%9],attempted:true,post_dispatched:true,http_status:200,service_success:true,raw_category:LABELS[i%9],final_category:LABELS[i%9],json_pure:true,schema_valid:true,response_truncated:false,latency_ms:i,full_fallback:false}));}
test('exact and canonical raw labels are separate; missing and unknown are sentinels',()=>{
 assert.deepEqual(rawLabel('jalan_rusak'),{label:'jalan_rusak',canonical:'jalan_rusak'});
 assert.deepEqual(rawLabel(' Jalan_Rusak '),{label:'__invalid__',canonical:'jalan_rusak'});
 assert.equal(rawLabel('jalan rusak').label,'__invalid__');assert.equal(rawLabel('').label,'__missing__');assert.equal(rawLabel(null).label,'__missing__');assert.equal(rawLabel(3).label,'__invalid__');
});
test('pure JSON vs recovered JSON and strict schema are distinct',()=>{
 const x=JSON.stringify(valid('sampah'));assert.equal(parsedJson(x).json_pure,true);assert.equal(schemaValid(JSON.parse(x)),true);
 assert.equal(parsedJson('```json\n'+x+'\n```').parse_mode,'recovered');assert.equal(parsedJson('```json\n'+x+'\n```').json_pure,false);
 assert.equal(schemaValid({...valid('sampah'),confidence:'80'}),false);assert.equal(schemaValid({...valid('lainnya'),secondaryCategories:['lainnya']}),false);
});
test('all planned denominator retains timeout, invalid, fallback and no-prediction',()=>{
 const r=rows();r[0].raw_category='UNKNOWN';r[0].schema_valid=false;r[1].post_dispatched=true;r[1].http_status=null;r[1].service_success=false;r[1].error_type='TIMEOUT';r[1].attempted=true;r[1].raw_category=null;r[1].final_category='lainnya';r[1].full_fallback=true;r[2].attempted=false;r[2].post_dispatched=false;r[2].http_status=null;r[2].service_success=null;r[2].final_category=null;r[2].raw_category=null;
 const x=score(r);assert.equal(x.planned,270);assert.equal(x.accuracy,268/270);assert.equal(x.coverage.value,269/270);assert.equal(x.confusion_matrix.banjir.__no_prediction__,1);assert.equal(x.confusion_matrix.jalan_rusak.lainnya,1);assert.equal(x.failure_rate.denominator,269);assert.equal(x.timeout_rate.count,1);assert.equal(x.strict_valid_rate.count,267);assert.equal(x.fallback.full,1);
});
test('duplicate/missing ID or wrong planned size fails closed',()=>{
 const r=rows();r[1].sample_id=r[0].sample_id;assert.throws(()=>score(r),/duplicate/);assert.throws(()=>score(r.slice(1)),/270/);
});
test('latency quantiles use linear interpolation and null for empty sets',()=>{
 const r=rows();const x=score(r);assert.equal(x.latency_all.n,270);assert.equal(x.latency_all.median,134.5);assert.ok(x.latency_all.p95>255);const y=score(r.map(v=>({...v,attempted:false,post_dispatched:false,http_status:null,service_success:null,latency_ms:null})));assert.equal(y.latency_all.median,null);assert.equal(y.strict_valid_rate.value,null);
});
test('target label set is closed; no unknown target is silently mapped',()=>{const r=rows();r[3].target='alien';assert.throws(()=>score(r),/target/);});
