// Synthetic TEST accounts only. Set IMAGE_TEST_API_URL to the isolated TEST /exec URL.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) throw Error('TEST endpoint required');
const student = process.env.IMAGE_TEST_STUDENT === 'B' ? 'test_student_b' : 'test_student_a';
const other = student === 'test_student_a' ? 'test_student_b' : 'test_student_a';
const workId = student === 'test_student_a' ? 'test_work_a' : 'test_work_b';
const day = process.env.IMAGE_TEST_DAY === 'day07' ? 'day07' : 'day06';
const assetId = `asset_${student}_${day}_image`;
async function request(action, payload, params) {
  const url = new URL(endpoint);
  let response;
  if (params) {
    url.searchParams.set('action', action);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    response = await fetch(url, { signal: AbortSignal.timeout(40000) });
  } else response = await fetch(url, { method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload }), signal: AbortSignal.timeout(80000) });
  return response.json();
}
(async () => {
  const roster = await request('getStudents', null, {});
  assert.equal(roster.ok, true);
  assert.deepEqual(roster.data.students.map(x => x.studentId).sort(), ['test_student_a', 'test_student_b']);
  const beforeB = await request('getDayRecord', null, { studentId: other, dayId: day });
  assert.equal(beforeB.ok, true);
  const png = fs.readFileSync(path.join(__dirname, '../assets/day07/light_sensor.png'));
  assert.ok(png.length > 0 && png.length <= 3 * 1024 * 1024);
  const uploaded = await request('uploadVideo', { mediaKind: 'image', studentId: student,
    workId, dayId: day, assetId, mimeType: 'image/png',
    base64Data: png.toString('base64'), capturedAt: new Date().toISOString() });
  assert.equal(uploaded.ok, true, uploaded.error?.code);
  assert.equal(uploaded.data.reviewStatus, 'PENDING_REVIEW');
  assert.equal(uploaded.data.storageFileId, undefined);
  assert.equal(uploaded.data.asset, undefined);
  console.log('A01/A03 PASS: private upload returned pending state without file ID');
  const pending = await request('getDayRecord', null, { studentId: student, dayId: day });
  assert.equal(pending.ok, true);
  assert.equal(pending.data.imageReviewStatus, 'PENDING_REVIEW');
  assert.ok(pending.data.dayRecord.personalEvidenceRefs.includes(assetId));
  assert.ok(!pending.data.assets.some(x => x.assetId === assetId));
  assert.ok(!JSON.stringify(pending.data).includes('thumbnail?id='));
  console.log('A03 PASS: public lookup hides unapproved image URLs and IDs');
  const unauthorized = await request('approveDayImage', { assetId, decision: 'APPROVED' });
  assert.equal(unauthorized.ok, false);
  assert.equal(unauthorized.error.code, 'INVALID_ACTION');
  const forged = await request('upsertAsset', { assetType: 'screenshot', assetId });
  assert.equal(forged.ok, false);
  assert.equal(forged.error.code, 'REVIEW_FORBIDDEN');
  console.log('A10 PASS: student API cannot approve or forge image Asset');
  const afterB = await request('getDayRecord', null, { studentId: other, dayId: day });
  assert.equal(afterB.ok, true);
  assert.deepEqual(afterB.data, beforeB.data);
  console.log(`A11 PASS: other TEST student ${day} unchanged`);
})().catch(error => { console.error('FAIL ' + error.message); process.exitCode = 1; });
