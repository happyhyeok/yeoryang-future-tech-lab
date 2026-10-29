// Build a synthetic-student Preview from an already verified dist/.
// IMAGE_TEST_API_URL is supplied locally; it is never stored in Git.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'dist');
const target = path.join(root, 'image-test-preview');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) {
  throw new Error('Set IMAGE_TEST_API_URL to the isolated TEST Web App /exec URL');
}
if (!fs.existsSync(path.join(source, 'day-image-evidence.js')) || fs.existsSync(target)) {
  throw new Error('Verified dist missing or Preview already exists');
}
const original = fs.readFileSync(path.join(source, 'runtime-config.js'), 'utf8');
if (original.includes(endpoint)) throw new Error('TEST endpoint equals the source endpoint');
const originalEndpoint = original.match(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/)?.[0];
if (!originalEndpoint) throw new Error('Cannot identify source endpoint');
const originalNames = [...original.matchAll(/studentName:\s*"([^"]+)"/g)].map(match => match[1]);
fs.cpSync(source, target, { recursive: true });
const config = { appsScriptApiUrl: endpoint, teacherMode: false, devMode: false,
  students: [
    { studentId: 'test_student_a', studentName: '테스트 A', workId: 'test_work_a', active: true },
    { studentId: 'test_student_b', studentName: '테스트 B', workId: 'test_work_b', active: true },
  ] };
fs.writeFileSync(path.join(target, 'runtime-config.js'),
  'window.FUTURE_LAB_CONFIG = ' + JSON.stringify(config, null, 2) + ';\n');
const preview = fs.readFileSync(path.join(target, 'runtime-config.js'), 'utf8');
if (!preview.includes(endpoint) || preview.includes(originalEndpoint) ||
    originalNames.some(name => preview.includes(name))) {
  throw new Error('Preview config validation failed');
}
process.stdout.write('TEST Preview built with two synthetic students; public files: ' +
  fs.readdirSync(target).length + ' top-level entries\n');
