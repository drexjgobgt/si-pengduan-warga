const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git' || file === 'manuscript' || file === 'manuscript_local_backup') continue;
      walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const targetDir = path.resolve(__dirname);
const allFiles = walk(targetDir);

console.log(`Auditing directory: ${targetDir}`);
console.log(`Total files to audit: ${allFiles.length}`);

// Patterns that identify actual sensitive information or secrets
const secretPatterns = [
  { name: 'Live OpenAI/Generic API Key', regex: /sk-[a-zA-Z0-9_-]{24,}/i },
  { name: 'Live Kios API Key', regex: /kios-[a-zA-Z0-9_-]{24,}/i },
  { name: 'Bearer Token in Auth Header', regex: /["']?authorization["']?\s*:\s*["']bearer\s+(?!mock|fake|placeholder|offline)[a-zA-Z0-9_.-]{20,}["']/i },
  { name: 'GitHub Personal Access Token', regex: /gh[pousr]_[a-zA-Z0-9]{20,}/i },
  { name: 'Private Key PEM header', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  // Standalone 16-digit integer (e.g. Indonesian NIK), not part of a hex string, uuid, or alphanumeric token
  { name: 'Indonesian NIK (16-digit standalone integer)', regex: /(?<![a-zA-Z0-9_\.\-])(?:1[1-9]|[2-9]\d)\d{14}(?![a-zA-Z0-9_\.\-])/ }
];

let leaks = [];

for (const filePath of allFiles) {
  const ext = path.extname(filePath).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.docx', '.zip'].includes(ext)) {
    continue; // binary files
  }

  const content = fs.readFileSync(filePath, 'utf8');

  for (const pattern of secretPatterns) {
    if (pattern.regex.test(content)) {
      if (filePath === __filename) continue;

      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (pattern.regex.test(line)) {
          leaks.push({
            file: path.relative(path.resolve(__dirname, '../..'), filePath),
            line: idx + 1,
            issue: pattern.name,
            snippet: line.trim().slice(0, 80)
          });
        }
      });
    }
  }
}

console.log('=== AUDIT RESULT ===');
if (leaks.length === 0) {
  console.log('STATUS: PASS (0 secrets, credentials, or PII detected).');
} else {
  console.log(`STATUS: FAIL (${leaks.length} potential issues found):`);
  leaks.forEach(l => console.log(`  - [${l.issue}] in ${l.file}:${l.line} -> ${l.snippet}`));
}
