// OFFLINE deterministic realization, QA and freeze. No network or DB imports.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const rb=fs.readFileSync(path.join(root,'synthetic_scenario_registry.json')),registry=JSON.parse(rb),receipt=JSON.parse(fs.readFileSync(path.join(root,'registry_freeze_receipt.json')));
if(hash(rb)!==receipt.registry_sha256||fs.existsSync(path.join(root,'synthetic_dataset.json')))throw Error('Registry mismatch or dataset exists');
const save=(n,x)=>fs.writeFileSync(path.join(root,n),typeof x==='string'?x:JSON.stringify(x,null,2)+'\n',{flag:'wx'});
const priorFiles=['../dataset.provisional.json','../final_candidate_v2/dataset.candidate.json'];
const prior=priorFiles.flatMap(p=>JSON.parse(fs.readFileSync(path.join(root,p))).map(r=>({id:r.sample_id,text:r.complaint_text})));
const normalize=t=>t.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=t=>normalize(t).split(' '),shingles=t=>{const a=tokens(t);return new Set(a.slice(0,-2).map((_,i)=>a.slice(i,i+3).join(' ')));};
const similarity=(a,b)=>{const x=shingles(a),y=shingles(b);const n=[...x].filter(v=>y.has(v)).length;return x.size+y.size-n?n/(x.size+y.size-n):0;};
const rows=registry.rows.map((s,i)=>{
 let description;
 switch(s.case_type){
 case 'formal':description=`Pada ${s.object}, ${s.event}. Permintaan penanganan adalah ${s.required_action}. Kondisi ini perlu ditindaklanjuti oleh petugas yang sesuai.`;break;
 case 'informal':description=`Pak bu, di ${s.object} itu ${s.event}. Bisa tolong ${s.required_action} ya? Kami bingung harus nunggu sampai kapan, makasih.`;break;
 case 'typo':description=`Di ${s.object}, ${s.event}. Mhon ${s.required_action}, soalnya blum ada tindak lanjut. Tolong dibntu ya.`;break;
 case 'ambiguous':description=s.target_category==='lainnya'?`Saya ada keluhan di ${s.object}: ${s.event}. Belum bisa menyebut apa yang terjadi. Saya ingin ${s.required_action}.`:`Di ${s.object} ada kondisi yang saya belum tahu penyebabnya: ${s.event}. Saya tidak bisa menilai bagian lain, tetapi yang diminta adalah ${s.required_action}.`;break;
 case 'incomplete':description=`Di ${s.object}, ${s.event}. Rincian waktu dan titik pastinya belum tersedia. Mohon ${s.required_action}.`;break;
 case 'multicategory':description=`Di ${s.object}, ${s.event}. Selain itu ${s.distractor}. Keluhan utama saya tetap yang pertama; mohon utamakan ${s.required_action} sebelum masalah tambahan itu.`;break;
 case 'out_of_scope':description=`Ini urusan ${s.object}, bukan pelayanan pemerintah: ${s.event}. Saya ingin ${s.required_action}.`;break;
 }
 return {sample_id:s.sample_id,title:['Permohonan tindak lanjut','Keluhan belum tertangani','Mohon pemeriksaan kondisi','Perlu penanganan petugas','Laporan situasi setempat'][i%5],description,complaint_text:`${['Permohonan tindak lanjut','Keluhan belum tertangani','Mohon pemeriksaan kondisi','Perlu penanganan petugas','Laporan situasi setempat'][i%5]}\n${description}`};
});
const checks=[],seen=new Set();
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=registry.rows[i],issues=[];const canonical=normalize(r.complaint_text);
 if(seen.has(canonical))issues.push('duplicate_internal');seen.add(canonical);
 if(prior.some(p=>normalize(p.text)===canonical))issues.push('duplicate_prior');
 if(!r.description.includes(s.event)||!r.description.includes(s.required_action)||!r.description.includes(s.object))issues.push('missing_core_fact');
 if(s.distractor&&!r.description.includes(s.distractor))issues.push('missing_secondary');
 if(r.title.length>200||!r.description.trim())issues.push('invalid_input');
 if(/kategori\s*(?:saya|target|utama|adalah|:)|target_category|\b(?:DLH|PUPR|DISHUB|SATPOLPP|DINKES|DISDIK|KELURAHAN)\b/.test(r.complaint_text))issues.push('explicit_label_instruction');
 if(/\b\d{10,16}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}/.test(r.complaint_text))issues.push('potential_pii');
 const nearest=prior.map(p=>({id:p.id,jaccard:similarity(p.text,r.complaint_text)})).sort((a,b)=>b.jaccard-a.jaccard)[0];
 if(nearest.jaccard>=0.70)issues.push('prior_similarity_review');
 checks.push({sample_id:r.sample_id,status:issues.length?'needs_review':'eligible',issues,core_fact_check:'object/event/action exact-preserved',nearest_prior:nearest,
  literal_category_word_present:new RegExp('\\b'+s.target_category+'\\b','i').test(r.complaint_text),semantic_review:'construction-based only; no independent human validation'});
}
save('synthetic_dataset.json',rows);save('qa_checks.json',checks);
const bad=checks.filter(c=>c.status!=='eligible');
if(bad.length){save('dataset_qa_report.md',`# QA BLOCKED\n\n${bad.length} sampel memerlukan review; dataset belum dibekukan. Lihat qa_checks.json.\n`);throw Error('QA issues: no freeze/baseline');}
const text=fs.readFileSync(path.join(root,'synthetic_dataset.json')),counts=k=>Object.fromEntries([...new Set(registry.rows.map(r=>r[k]))].map(v=>[v,registry.rows.filter(r=>r[k]===v).length]));
save('dataset_manifest.json',{status:'FROZEN_SYNTHETIC_RULE_TARGETS',frozen_at:new Date().toISOString(),registry_frozen_at:receipt.created_at,
 registry_sha256:hash(rb),dataset_sha256:hash(text),qa_checks_sha256:hash(fs.readFileSync(path.join(root,'qa_checks.json'))),
 registry_rows:270,eligible:270,excluded:0,categories:counts('target_category'),case_types:counts('case_type'),families:new Set(registry.rows.map(s=>s.family_id)).size,
 target_provenance:'scenario_rule_target_not_human_ground_truth',api_requests:0,db_access:0,live_allowed:false,
 limitations:['Five core domain events reused across language types; variants are dependent','Deterministic phrasing/template fingerprints; not 270 independent events','No independent human or semantic AI validation','Exact fact preservation is not proof of full semantic correctness','No representativeness for real complaints']});
save('dataset_qa_report.md',`# QA offline dataset sintetis\n\nRegistry di-hash sebelum narasi: ${receipt.created_at}. Hash ${receipt.registry_sha256}.\n\n270/270 eligible menurut pemeriksaan konstruksi otomatis; 0 duplikat exact internal/prior; 0 explicit label instruction; 0 PII-pattern; 0 object/event/action hilang; 0 kemiripan prior trigram Jaccard >=0,70. Maksimum kemiripan prior ${Math.max(...checks.map(c=>c.nearest_prior.jaccard)).toFixed(6)}. ${checks.filter(c=>c.literal_category_word_present).length} teks menyebut kata domain secara alami; ini bukan instruksi label. Judul netral berulang, teks lengkap unik. Tidak ada revisi atau eksklusi pascaprediksi; belum ada prediksi.\n\nDistribusi kategori: ${JSON.stringify(counts('target_category'))}. Variasi: ${JSON.stringify(counts('case_type'))}.\n\n## Keterbatasan QA\n\nQA memverifikasi fakta persis dari registry dan pemisahan field, bukan pembacaan semantik independen. Lima kejadian dasar per domain diulang dalam enam gaya; jumlah keluarga ${new Set(registry.rows.map(s=>s.family_id)).size}, bukan 270 kejadian independen. Ambiguitas terkontrol masih menyatakan kejadian/aksi, sehingga bukan uji disambiguasi bebas. Typo ringan pada kata penghubung, bukan korupsi berat istilah domain. Tidak ada jaminan bebas bias/template. Dedup exact dan trigram terhadap 54 teks lama tidak meniadakan semantic overlap. Tantangan baru dapat ditambahkan hanya sebagai versi baru sebelum live, bukan overwrite versi beku.\n\n## Perubahan dan eksklusi\n\n0 narasi direvisi, 0 dikeluarkan pada run ini. Kriteria telah tersimpan di registry sebelum teks: duplikasi, PII, instruksi label, hilang fakta/aksi dan kontradiksi tak terselesaikan. Target tidak diubah. Nilai baseline hanya boleh dihitung sesudah manifest beku; bukan alat QA atau alasan mengganti sampel.\n`);
console.log(JSON.stringify({eligible:270,excluded:0,registry_sha256:hash(rb),dataset_sha256:hash(text),families:new Set(registry.rows.map(s=>s.family_id)).size,max_prior_similarity:Math.max(...checks.map(c=>c.nearest_prior.jaccard))}));
