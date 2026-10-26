// Blind-to-predictions packet: no AI labels, baselines or model output included.
const fs=require('node:fs'),path=require('node:path');
const {validateDataset,hash}=require('./lib.cjs');
const root=__dirname,out=path.join(root,'labeling_packets');
if(fs.existsSync(out))throw new Error('Refusing overwrite');
const bytes=fs.readFileSync(path.join(root,'dataset.provisional.json')),rows=validateDataset(JSON.parse(bytes));
const packet=rows.map(r=>({sample_id:r.sample_id,title:r.title,description:r.description,
 category_label:null,department_label:null,secondary_categories:null,uncertain:null,rationale:null}));
fs.mkdirSync(out);
for(const role of ['rater_A','rater_B'])fs.writeFileSync(path.join(out,`${role}.json`),JSON.stringify({
 dataset_sha256:hash(bytes),role,purpose:'Independent human labeling without AI provisional labels/predictions',
 completed:false,rater_identity_pseudonym:null,rows:packet},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(path.join(out,'README.md'),'# Paket pelabelan manusia\n\nDua template JSON untuk dua penilai yang benar-benar berbeda. Status belum diisi, bukan bukti penilaian. Jangan saling melihat label atau membuka file prediksi/label AI sebelum menyerahkan keputusan. Gunakan labeling_guide.md. Department gold substantive harus berdasarkan teks/kewenangan SIPW; jangan otomatis menyalin mapping tanpa mencatat asal. Catat alasan, uncertainty dan label sekunder bila layak. Simpan jawaban sebagai file baru; jangan overwrite template atau dataset asal. Penilai dapat memakai pseudonim, jangan masukkan PII di artefak publik. Setelah selesai perlu agreement dan adjudication; belum ada perhitungan kappa.\n',{flag:'wx'});
console.log(JSON.stringify({directory:out,samples:rows.length,completed_human_labels:0,api_requests:0}));
