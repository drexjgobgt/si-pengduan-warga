const test=require('node:test');
const assert=require('node:assert/strict');
const {metrics}=require('./baseline_pilot.cjs');
test('Perfect nine-class fixture gives accuracy and macro F1 one',()=>{
 const {CATEGORIES}=require('./lib.cjs');const r=metrics(CATEGORIES.map(c=>({ground_truth_category:c,predicted_category:c})));
 assert.equal(r.accuracy,1);assert.equal(r.macro_f1,1);assert.equal(r.denominator,9);
});
test('Macro includes zero-support labels and errors stay in denominator',()=>{
 const r=metrics([{ground_truth_category:'sampah',predicted_category:'sampah'},{ground_truth_category:'banjir',predicted_category:'sampah'}]);
 assert.equal(r.denominator,2);assert.equal(r.accuracy,0.5);
 assert.equal(r.per_category.find(c=>c.category==='sampah').precision,0.5);
 assert.equal(r.per_category.find(c=>c.category==='banjir').recall,0);
 assert.ok(Math.abs(r.macro_f1-(2/3)/9)<1e-12);
});
test('Invalid predicted label cannot silently disappear',()=>assert.throws(()=>metrics([{ground_truth_category:'sampah',predicted_category:'invented'}]),/Invalid metric labels/));
