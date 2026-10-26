// Read-only inventory. Never prints credentials or complaint/user records.
const path = require('node:path');
const backend = path.resolve(__dirname, '../../backend');
require(path.join(backend, 'node_modules/dotenv')).config({ path: path.join(backend, '.env'), quiet: true });
const { Pool } = require(path.join(backend, 'node_modules/pg'));
const { KIOSAPI_CONFIG: c } = require(path.join(backend, 'config/kiosApi'));
async function main() {
  const loopback = ['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST || 'localhost');
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), dbTargetIsLoopback: loopback,
    requiredPresence: Object.fromEntries(['JWT_SECRET', 'DB_PASSWORD', 'KIOSAPI_API_KEY', 'CLOUDINARY_API_SECRET'].map(k => [k, Boolean(process.env[k])])),
    providerHost: new URL(c.baseUrl).hostname, model: c.classificationModel, freeOnly: c.freeOnly,
    timeoutMs: c.requestTimeoutMs, maxTokens: c.classificationMaxTokens, localDailyLimit: c.dailyRequestLimit }));
  if (!loopback) throw Object.assign(new Error('Non-local database requires separate verification'), { code: 'NON_LOCAL_TARGET' });
  const p = new Pool({ host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'pengaduan_warga', options: '-c default_transaction_read_only=on', connectionTimeoutMillis: 3000 });
  let client;
  try {
    client = await p.connect();
    await client.query('BEGIN READ ONLY');
    const state = await client.query("SELECT current_setting('transaction_read_only') AS read_only, current_setting('server_version') AS version");
    const cats = await client.query('SELECT c.name,c.is_active,d.code AS department FROM categories c LEFT JOIN departments d ON d.id=c.department_id ORDER BY c.name');
    const depts = await client.query('SELECT code,name FROM departments ORDER BY code');
    const cols = await client.query("SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('complaints','classification_logs') ORDER BY table_name,ordinal_position");
    console.log(JSON.stringify({ databaseState: state.rows, categories: cats.rows, departments: depts.rows, columns: cols.rows }));
  } finally {
    if (client) { await client.query('ROLLBACK'); client.release(); }
    await p.end();
  }
}
main().catch(e => { console.error(JSON.stringify({ databaseCheck: 'FAILED', errorCode: e.code || 'UNKNOWN' })); process.exitCode = 1; });
