const test=require('node:test');
const assert=require('node:assert/strict');
const {validateDataset,parseRaw,strictValid}=require('./lib.cjs');
const {options}=require('./evaluate.cjs');
const valid={category:'sampah',secondaryCategories:[],suggestedDepartment:'DLH',suggestedPriority:'normal',reason:'Test fixture',confidence:85,needsHumanReview:false};
test('Strict schema accepts complete valid fixture',()=>assert.equal(strictValid(valid),true));
test('Empty object and array rejected by strict schema',()=>{assert.equal(strictValid({}),false);assert.equal(strictValid([]),false);});
test('Coerced booleans and out-of-range confidence rejected',()=>{assert.equal(strictValid({...valid,needsHumanReview:'false'}),false);assert.equal(strictValid({...valid,confidence:999}),false);});
test('Malformed JSON records failure instead of inventing raw prediction',()=>assert.deepEqual(parseRaw('not json'),{value:null,parse_mode:'failed'}));
test('Markdown extraction explicitly distinguished',()=>assert.equal(parseRaw('```json\n'+JSON.stringify(valid)+'\n```').parse_mode,'extracted'));
test('Live execution blocked before credentials/network',()=>assert.throws(()=>options(['--mode','live','--dataset','x','--out','y']),/LIVE_BLOCKED/));
test('Unknown option rejected',()=>assert.throws(()=>options(['--anything']),/Unknown option/));
test('Empty dataset rejected',()=>assert.throws(()=>validateDataset([]),/nonempty/));
test('Actual production classifier works with mock, not external fetch',async()=>{
  const saved=global.fetch,old=process.env.KIOSAPI_API_KEY;
  process.env.KIOSAPI_API_KEY='offline-not-a-credential';let calls=0;
  global.fetch=async()=>{calls++;return new Response(JSON.stringify({model:'OFFLINE',choices:[{message:{content:JSON.stringify(valid)}}]}));};
  try {const {classifyComplaint}=require('../../backend/services/classificationService');const r=await classifyComplaint('Teks sintetis','Pengujian offline');assert.equal(r.category,'sampah');assert.equal(r.modelVersion,'kiosapi/OFFLINE');assert.equal(calls,1);}
  finally{global.fetch=saved;if(old===undefined)delete process.env.KIOSAPI_API_KEY;else process.env.KIOSAPI_API_KEY=old;}
});
