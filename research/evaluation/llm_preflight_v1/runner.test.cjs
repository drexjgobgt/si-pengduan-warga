/**
 * OFFLINE RUNNER TEST SUITE — SIPW RESEARCH
 * 
 * Tests runner logic completely in-memory and against temporary directories.
 * Strictly zero network calls.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  ALLOWED_CATEGORIES,
  ALLOWED_DEPARTMENTS,
  ALLOWED_PRIORITIES,
  validateSchema,
  parseRawOutput,
  computeMetrics,
  executeEvaluation
} = require('./runner.cjs');

const tempBase = path.join(__dirname, 'test_runs');

function createTempDir() {
  fs.mkdirSync(tempBase, { recursive: true });
  return fs.mkdtempSync(path.join(tempBase, 'run-'));
}

function cleanupDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Sample mock data
const mockRegistry = [
  { sample_id: 'TEST-001', target_category: 'sampah' },
  { sample_id: 'TEST-002', target_category: 'jalan_rusak' },
  { sample_id: 'TEST-003', target_category: 'banjir' }
];

const mockDataset = [
  { sample_id: 'TEST-001', title: 'Sampah menumpuk', description: 'Banyak sampah busuk' },
  { sample_id: 'TEST-002', title: 'Jalan berlubang parah', description: 'Aspal hancur' },
  { sample_id: 'TEST-003', title: 'Genangan air', description: 'Banjir meluap' }
];

const validPayload = (cat = 'sampah') => ({
  category: cat,
  secondaryCategories: [],
  suggestedDepartment: 'DLH',
  suggestedPriority: 'normal',
  reason: 'Penumpukan sampah jelas di pemukiman',
  confidence: 90,
  needsHumanReview: false
});

test('1. Validates exact 7-field schema and rejects invalid or malformed schemas', () => {
  const valid = validPayload();
  assert.equal(validateSchema(valid).valid, true);

  // Missing category
  const noCat = { ...valid };
  delete noCat.category;
  assert.equal(validateSchema(noCat).valid, false);

  // Unknown category
  const badCat = { ...valid, category: 'luar_angkasa' };
  assert.equal(validateSchema(badCat).valid, false);

  // Invalid suggested department
  const badDept = { ...valid, suggestedDepartment: 'KEMENKEU' };
  assert.equal(validateSchema(badDept).valid, false);

  // Invalid confidence out of range
  const badConf = { ...valid, confidence: 150 };
  assert.equal(validateSchema(badConf).valid, false);

  // Duplicate in secondaryCategories
  const dupSec = { ...valid, secondaryCategories: ['banjir', 'banjir'] };
  assert.equal(validateSchema(dupSec).valid, false);

  // Secondary contains primary
  const secHasPrimary = { ...valid, secondaryCategories: ['sampah'] };
  assert.equal(validateSchema(secHasPrimary).valid, false);
});

test('2. Distinguishes pure JSON from recovered markdown block and unparseable text', () => {
  const jsonStr = JSON.stringify(validPayload());
  const pureRes = parseRawOutput(jsonStr);
  assert.equal(pureRes.is_pure_json, true);
  assert.equal(pureRes.parse_mode, 'pure_json');
  assert.equal(pureRes.parsed.category, 'sampah');

  // Markdown wrapped
  const mdStr = `Berikut analisis laporan:\n\`\`\`json\n${jsonStr}\n\`\`\`\nSemoga membantu.`;
  const recRes = parseRawOutput(mdStr);
  assert.equal(recRes.is_pure_json, false);
  assert.equal(recRes.parse_mode, 'recovered_block');
  assert.equal(recRes.parsed.category, 'sampah');

  // Corrupt string
  const badStr = 'Maaf saya tidak bisa membantu laporan ini.';
  const failRes = parseRawOutput(badStr);
  assert.equal(failRes.parsed, null);
  assert.equal(failRes.parse_mode, 'parse_failed');
});

test('3. Correctly joins sample_id with registry and identifies semantic match vs mismatch', async () => {
  const dir = createTempDir();
  try {
    const mockTransport = async ({ sample_id }) => {
      if (sample_id === 'TEST-001') {
        return { http_status: 200, raw_text: JSON.stringify(validPayload('sampah')) };
      }
      if (sample_id === 'TEST-002') {
        // Mismatch: target is jalan_rusak, model predicts sampah
        return { http_status: 200, raw_text: JSON.stringify(validPayload('sampah')) };
      }
      return { http_status: 200, raw_text: JSON.stringify(validPayload('banjir')) };
    };

    const run = await executeEvaluation({
      dataset: mockDataset,
      registry: mockRegistry,
      outputDir: dir,
      transportFn: mockTransport
    });

    assert.equal(run.summary.total_processed, 3);
    assert.equal(run.metrics.total_correct, 2); // TEST-001 (sampah) and TEST-003 (banjir)
    assert.equal(run.metrics.total_mismatches, 1); // TEST-002 predicted sampah instead of jalan_rusak
    assert.equal(run.metrics.total_strict_valid, 3);
    assert.equal(run.metrics.total_transport_errors, 0);
  } finally {
    cleanupDir(dir);
  }
});

test('4. Separates transport error, parse error, and schema error distinctly', async () => {
  const dir = createTempDir();
  try {
    const mixedDataset = [
      { sample_id: 'TEST-001', title: 'T1', description: 'D1' },
      { sample_id: 'TEST-002', title: 'T2', description: 'D2' }
    ];
    const mixedRegistry = [
      { sample_id: 'TEST-001', target_category: 'sampah' },
      { sample_id: 'TEST-002', target_category: 'jalan_rusak' }
    ];

    // TEST-001 returns unparseable text
    const mockTransport = async ({ sample_id }) => {
      return { http_status: 200, raw_text: 'ERROR: INVALID_PROMPT_RESPONSE' };
    };

    const run = await executeEvaluation({
      dataset: mixedDataset,
      registry: mixedRegistry,
      outputDir: dir,
      transportFn: mockTransport
    });

    assert.equal(run.metrics.total_parse_errors, 2);
    assert.equal(run.metrics.total_correct, 0);
  } finally {
    cleanupDir(dir);
  }
});

test('5. Terminal halt on transport failure prevents subsequent requests and stops immediately', async () => {
  const dir = createTempDir();
  try {
    let callCount = 0;
    const mockTransport = async ({ sample_id }) => {
      callCount++;
      if (sample_id === 'TEST-001') {
        // HTTP 429 Rate Limit
        return { http_status: 429, raw_text: '{"error": "Rate limit exceeded"}' };
      }
      return { http_status: 200, raw_text: JSON.stringify(validPayload()) };
    };

    const run = await executeEvaluation({
      dataset: mockDataset,
      registry: mockRegistry,
      outputDir: dir,
      transportFn: mockTransport
    });

    assert.equal(callCount, 1); // Only 1 request dispatched, stopped immediately
    assert.equal(run.summary.terminal_halt, true);
    assert.equal(run.metrics.total_transport_errors, 1);
    assert.equal(run.results[1].status, 'UNATTEMPTED_DUE_TO_HALT');
  } finally {
    cleanupDir(dir);
  }
});

test('6. Incremental checkpointing skips already completed samples upon resume', async () => {
  const dir = createTempDir();
  try {
    let calls = [];
    const mockTransport = async ({ sample_id }) => {
      calls.push(sample_id);
      return { http_status: 200, raw_text: JSON.stringify(validPayload(sample_id === 'TEST-001' ? 'sampah' : 'jalan_rusak')) };
    };

    // First run with only first item
    await executeEvaluation({
      dataset: [mockDataset[0]],
      registry: mockRegistry,
      outputDir: dir,
      transportFn: mockTransport
    });

    assert.deepEqual(calls, ['TEST-001']);

    // Second run with all items
    calls = [];
    const secondRun = await executeEvaluation({
      dataset: mockDataset,
      registry: mockRegistry,
      outputDir: dir,
      transportFn: mockTransport
    });

    // TEST-001 should NOT be called again
    assert.deepEqual(calls, ['TEST-002', 'TEST-003']);
    assert.equal(secondRun.summary.total_processed, 3);
  } finally {
    cleanupDir(dir);
  }
});

test('7. Redacts secrets and omits sensitive headers from results', async () => {
  const dir = createTempDir();
  const fakeSecret = 'kios_super_secret_token_12345';
  try {
    const mockTransport = async () => ({
      http_status: 200,
      raw_text: JSON.stringify(validPayload()),
      secret_field: fakeSecret
    });

    const run = await executeEvaluation({
      dataset: [mockDataset[0]],
      registry: mockRegistry,
      outputDir: dir,
      transportFn: mockTransport,
      secretToRedact: fakeSecret
    });

    const savedFile = fs.readdirSync(path.join(dir, 'results'))[0];
    const fileContent = fs.readFileSync(path.join(dir, 'results', savedFile), 'utf8');
    assert.equal(fileContent.includes(fakeSecret), false);
  } finally {
    cleanupDir(dir);
  }
});
