// Run only against the isolated TEST Web App after ID separation preflight.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
    !process.env.IMAGE_TEST_SHEET_ID || !process.env.IMAGE_TEST_FOLDER_ID ||
    process.env.IMAGE_TEST_SHEET_ID === process.env.IMAGE_PRODUCTION_SHEET_ID ||
    process.env.IMAGE_TEST_FOLDER_ID === process.env.IMAGE_PRODUCTION_FOLDER_ID) {
  throw Error('TEST isolation preflight failed');
}
const base64Data = fs.readFileSync(path.resolve(__dirname, '../assets/day07/light_sensor.png')).toString('base64');
async function api(action, payload, params) {
  const url = new URL(endpoint);
  if (params) {
    url.searchParams.set('action', action);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  }
  const response = await fetch(url, params ? { signal: AbortSignal.timeout(30000) } : {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload }), signal: AbortSignal.timeout(60000) });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true, `${action}: ${body.error?.code || 'unknown error'}`);
  return body.data;
}
const image = { mediaKind: 'image', studentId: 'test_student_a', workId: 'test_work_a',
  dayId: 'day06', assetId: 'asset_test_student_a_day06_image', mimeType: 'image/png',
  base64Data, capturedAt: new Date().toISOString() };
const record = { studentId: 'test_student_a', workId: 'test_work_a', dayId: 'day06',
  blockProgress: {}, activities: [], personalEvidenceRefs: [], commonEvidenceRefs: [],
  minimumCompleted: false, completionLevel: '', status: 'in_progress',
  todayDecision: 'synthetic concurrent save retained', dayState: { syntheticConcurrent: true } };
async function main() {
  const students = await api('getStudents', null, {});
  assert.deepEqual(students.students.map(s => s.studentId).sort(), ['test_student_a', 'test_student_b']);
  const [uploaded] = await Promise.all([
    api('uploadVideo', image), api('saveDayRecord', record),
  ]);
  let read = await api('getDayRecord', null, { studentId: image.studentId, dayId: image.dayId,
    nonce: String(Date.now()) });
  assert.equal(read.assets[0].storageFileId, uploaded.storageFileId);
  assert.ok(read.dayRecord.personalEvidenceRefs.includes(image.assetId));
  assert.equal(read.dayRecord.todayDecision, record.todayDecision);
  process.stdout.write('S13: PASS concurrent image upload and DayRecord save retained both fields\n');
  const first = await api('uploadVideo', image);
  const second = await api('uploadVideo', image);
  assert.notEqual(first.storageFileId, second.storageFileId);
  read = await api('getDayRecord', null, { studentId: image.studentId, dayId: image.dayId,
    nonce: String(Date.now() + 1) });
  assert.equal(read.assets[0].storageFileId, second.storageFileId);
  assert.equal(read.dayRecord.personalEvidenceRefs.filter(ref => ref === image.assetId).length, 1);
  assert.equal(read.dayRecord.todayDecision, record.todayDecision);
  process.stdout.write('Repeated same-image upload: PASS one representative Asset/reference, record field retained\n');
  const parallel = await Promise.all([api('uploadVideo', image), api('uploadVideo', image)]);
  read = await api('getDayRecord', null, { studentId: image.studentId, dayId: image.dayId,
    nonce: String(Date.now() + 2) });
  assert.ok(parallel.some(result => result.storageFileId === read.assets[0].storageFileId));
  assert.equal(read.dayRecord.personalEvidenceRefs.filter(ref => ref === image.assetId).length, 1);
  assert.equal(read.dayRecord.todayDecision, record.todayDecision);
  process.stdout.write('Two simultaneous image clients: PASS one representative, record field retained\n');
}
main().catch(error => { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; });
