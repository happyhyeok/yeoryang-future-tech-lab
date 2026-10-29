const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const base = process.env.IMAGE_PREVIEW_URL || '';
if (!/^https:\/\/[a-z0-9-]+\.yeoryang-image-e2e-test-20261025\.pages\.dev$/.test(base)) {
  throw Error('Use only the isolated Cloudflare TEST Pages Preview');
}
const root = path.resolve(__dirname, '../image-test-preview');
function walk(dir, relative = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(path.join(dir, entry.name), name) : [name];
  });
}
async function main() {
  const files = walk(root);
  assert.equal(files.length, 54);
  let total = 0;
  for (const file of files) {
    const response = await fetch(`${base}/${file}`, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, `${file} HTTP`);
    const remote = Buffer.from(await response.arrayBuffer());
    const local = fs.readFileSync(path.join(root, file));
    assert.equal(crypto.createHash('sha256').update(remote).digest('hex'),
      crypto.createHash('sha256').update(local).digest('hex'), `${file} hash`);
    total += remote.length;
  }
  const config = fs.readFileSync(path.join(root, 'runtime-config.js'), 'utf8');
  assert.match(config, /test_student_a/);
  assert.match(config, /test_student_b/);
  assert.doesNotMatch(config, /stu0[1-9]|work_stu0[1-9]/);
  process.stdout.write(`P01/P02: PASS HTTPS, ${files.length} files exact SHA-256 match, ${total} bytes\n`);
  process.stdout.write('P03 preflight: PASS TEST runtime config and synthetic students only\n');
}
main().catch(error => { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; });
