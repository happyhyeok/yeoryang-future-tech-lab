// Run after reviewing the student-facing diff: node scripts/review-image-dist-lock.cjs
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const lockPath = path.join(__dirname, 'student-dist-lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const changed = ['app.js', 'index.html', 'styles.css'];
const added = 'day-image-evidence.js';
if (![53, 54].includes(lock.fileCount) || lock.files.length !== lock.fileCount ||
    (lock.fileCount === 53 && lock.files.some(f => f.path === added))) {
  throw new Error('Expected the reviewed 53-file baseline or 54-file image candidate');
}
for (const name of changed) {
  const entry = lock.files.find(f => f.path === name);
  if (!entry) throw new Error('Missing reviewed file: ' + name);
  const bytes = fs.readFileSync(path.join(root, name));
  entry.bytes = bytes.length;
  entry.sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
}
const bytes = fs.readFileSync(path.join(root, added));
const newEntry = { path: added, bytes: bytes.length,
  sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
const existing = lock.files.find(f => f.path === added);
if (existing) Object.assign(existing, newEntry);
else lock.files.push(newEntry);
lock.files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
lock.candidateId = 'day06-day07-image-evidence-review-2026-10-25';
lock.fileCount = lock.files.length;
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
process.stdout.write('Reviewed public allowlist: ' + lock.fileCount + ' files\n');
