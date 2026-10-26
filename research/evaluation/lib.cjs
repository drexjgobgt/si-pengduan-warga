const fs = require('node:fs');
const crypto = require('node:crypto');
const CATEGORIES = ['sampah','jalan_rusak','banjir','listrik','air_bersih','keamanan','kesehatan','pendidikan','lainnya'];
const MAPPING = { sampah:'DLH',jalan_rusak:'PUPR',banjir:'PUPR',listrik:'DISHUB',air_bersih:'PUPR',keamanan:'SATPOLPP',kesehatan:'DINKES',pendidikan:'DISDIK',lainnya:'KELURAHAN' };
const TYPES = ['normal','informal','typo','ambiguous','incomplete','multicategory','out_of_scope'];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function validateDataset(data) {
  if (!Array.isArray(data) || !data.length) throw new Error('Dataset must be nonempty array');
  const ids = new Set(), texts = new Set();
  for (const row of data) {
    for (const key of ['sample_id','title','description','complaint_text','data_source','label_validation_status','split']) {
      if (typeof row[key] !== 'string' || !row[key].trim()) throw new Error(`Invalid ${key}`);
    }
    if (ids.has(row.sample_id)) throw new Error('Duplicate sample_id');
    ids.add(row.sample_id);
    if (row.title.length > 200 || !CATEGORIES.includes(row.ground_truth_category) || !TYPES.includes(row.sample_type)) throw new Error('Invalid text length/category/type');
    if (row.complaint_text !== `${row.title}\n${row.description}`) throw new Error('Text composition mismatch');
    if (!['dev','pilot_candidate','final'].includes(row.split)) throw new Error('Invalid split');
    if (!['provisional','independent_double_labeled','adjudicated'].includes(row.label_validation_status)) throw new Error('Invalid labeling status');
    if (typeof row.department_label_eligible !== 'boolean') throw new Error('Missing department eligibility');
    if (row.department_label_eligible && !Object.values(MAPPING).includes(row.ground_truth_department)) throw new Error('Invalid department');
    const text = row.complaint_text.toLowerCase().replace(/\s+/g,' ').trim();
    if (texts.has(text)) throw new Error('Duplicate complaint text across splits');
    texts.add(text);
    if (row.data_source !== 'synthetic_ai_authored') throw new Error('Only synthetic source authorized for this harness');
    if (/\b\d{10,16}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(row.complaint_text)) throw new Error('Potential PII requires review');
  }
  return data;
}
function parseRaw(content) {
  if (typeof content !== 'string') return { value:null, parse_mode:'unavailable' };
  try { return { value:JSON.parse(content), parse_mode:'direct' }; } catch {}
  const block = content.match(/\{[\s\S]*\}/);
  try { return { value:JSON.parse(block?.[0]), parse_mode:'extracted' }; } catch { return { value:null, parse_mode:'failed' }; }
}
function strictValid(raw) {
  return Boolean(raw && !Array.isArray(raw) && typeof raw === 'object' && CATEGORIES.includes(raw.category)
    && Object.values(MAPPING).includes(raw.suggestedDepartment) && ['rendah','normal','tinggi','darurat'].includes(raw.suggestedPriority)
    && Array.isArray(raw.secondaryCategories) && raw.secondaryCategories.every(c => CATEGORIES.includes(c))
    && typeof raw.reason === 'string' && raw.reason.trim() && Number.isInteger(raw.confidence)
    && raw.confidence >= 0 && raw.confidence <= 100 && typeof raw.needsHumanReview === 'boolean');
}
function writeNew(file, text) { fs.writeFileSync(file, text, {flag:'wx'}); }
module.exports = { CATEGORIES, MAPPING, TYPES, hash, validateDataset, parseRaw, strictValid, writeNew };
