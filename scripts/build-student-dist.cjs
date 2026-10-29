// Cloudflare Pages build command: node scripts/build-student-dist.cjs
// The lock records the reviewed Day08 candidate bytes. This build
// intentionally fails if any lesson file changes without a new review.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const lock = JSON.parse(fs.readFileSync(path.join(__dirname, 'student-dist-lock.json'), 'utf8'));
const files = lock.files;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const reviewedBytes = new Map();
function sourceBytes(file, source) {
  const original = fs.readFileSync(source);
  if (original.length === file.bytes && hash(original) === file.sha256) return original;
  // Git may normalize text blobs to LF; Windows may check them out as CRLF.
  // Convert line endings only when the exact result matches the locked asset.
  if (/\.(?:js|html|css|svg)$/.test(file.path)) {
    const input = original.toString('utf8');
    for (const endings of ['\n', '\r\n']) {
      const normalized = Buffer.from(input.replace(/\r?\n/g, endings));
      if (normalized.length === file.bytes && hash(normalized) === file.sha256) return normalized;
    }
  }
  throw new Error(`Source differs from reviewed file: ${file.path}`);
}
const safe = name => typeof name === 'string' && !name.startsWith('.') &&
  !name.startsWith('/') && !name.includes('\\') &&
  name.split('/').every(part => part && part !== '.' && part !== '..');

if (lock.fileCount !== 60 || files.length !== 60 ||
    new Set(files.map(file => file.path)).size !== 60 || !files.every(file => safe(file.path))) {
  throw new Error('Unexpected public file allowlist');
}
if (fs.existsSync(output)) throw new Error('dist already exists; preserve it and build from a clean checkout');

// Verify all inputs before creating the output, so a stale source cannot
// produce a partial release directory.
for (const file of files) {
  const source = path.resolve(root, file.path);
  if (!source.startsWith(root + path.sep) || !fs.existsSync(source) ||
      fs.lstatSync(source).isSymbolicLink() || !fs.statSync(source).isFile()) {
    throw new Error(`Missing or unsafe public source: ${file.path}`);
  }
  reviewedBytes.set(file.path, sourceBytes(file, source));
}

fs.mkdirSync(output);
for (const file of files) {
  const target = path.resolve(output, file.path);
  if (!target.startsWith(output + path.sep)) throw new Error('Target path escaped dist');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, reviewedBytes.get(file.path));
  if (hash(fs.readFileSync(target)) !== file.sha256) throw new Error(`Copy mismatch: ${file.path}`);
}
const actual = [];
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(absolute);
    else if (entry.isFile()) actual.push(path.relative(output, absolute).replaceAll('\\', '/'));
    else throw new Error('Unexpected dist entry');
  }
}
visit(output);
if (actual.length !== files.length || actual.some(name => !files.some(file => file.path === name))) {
  throw new Error('Unexpected file in dist');
}
process.stdout.write(JSON.stringify({ outcome: 'PASS', files: actual.length,
  reviewedManifestSha256: hash(fs.readFileSync(path.join(__dirname, 'student-dist-lock.json'))) }) + '\n');
