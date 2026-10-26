const test=require('node:test'),assert=require('node:assert/strict');
const {classification,percentile}=require('./analyze_pilot.cjs');
test('Missing and invalid predictions stay in denominator/matrix',()=>{
 const r=classification([['a','a'],['b',null],['b','alien']],['a','b']);assert.equal(r.denominator,3);assert.equal(r.accuracy,1/3);assert.equal(r.confusion_matrix.b.__missing__,1);assert.equal(r.confusion_matrix.b.__invalid__,1);assert.equal(r.macro_f1,.5);
});
test('Fixed label set yields zero metrics for unsupported classes',()=>{const r=classification([['a','a']],['a','b']);assert.equal(r.macro_recall,.5);assert.equal(r.per_category[1].support,0);});
test('Percentiles use linear interpolation including failed attempt latencies',()=>{assert.equal(percentile([0,100],.95),95);assert.equal(percentile([42],.95),42);assert.equal(percentile([], .5),null);});
