// Synthetic TEST A Day02 only; writes private file IDs outside Git for Drive readback.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
const privateOutput = process.env.MEDIA_PRIVATE_AUDIT_JSON || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) || !privateOutput)
  throw Error('Isolated TEST endpoint and private audit output required');
async function api(action, payload, params) {
  const url = new URL(endpoint);
  let response;
  if (params) {
    url.searchParams.set('action', action);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    response = await fetch(url, { signal: AbortSignal.timeout(40000) });
  } else response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload }), signal: AbortSignal.timeout(90000) });
  return response.json();
}
async function sampleWebm() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const result = await page.evaluate(async () => {
      const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 120;
      const stream = canvas.captureStream(12), chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      const stopped = new Promise(resolve => { recorder.onstop = resolve; });
      recorder.start();
      for (let i = 0; i < 15; i++) {
        const context = canvas.getContext('2d'); context.fillStyle = i % 2 ? '#086' : '#fb4';
        context.fillRect(0, 0, 160, 120);
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      recorder.stop(); await stopped; stream.getTracks().forEach(track => track.stop());
      const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
      let text = ''; for (let i = 0; i < bytes.length; i += 8192)
        text += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return { base64: btoa(text), size: bytes.length };
    });
    assert.ok(result.size > 1000);
    return result.base64;
  } finally { await browser.close(); }
}
(async () => {
  const students = await api('getStudents', null, {});
  assert.deepEqual(students.data.students.map(x => x.studentId).sort(), ['test_student_a', 'test_student_b']);
  const read = async studentId => {
    const result = await api('getDayRecord', null, { studentId, dayId: 'day02' });
    assert.equal(result.ok, true); return result.data;
  };
  const before = await read('test_student_a'), beforeB = await read('test_student_b');
  const assetId = 'asset_test_student_a_day02_video';
  let oldFile = before.assets.find(x => x.assetId === assetId)?.storageFileId;
  const base64 = await sampleWebm();
  const payload = { studentId: 'test_student_a', workId: 'test_work_a', dayId: 'day02',
    assetId, mimeType: 'video/webm', base64Data: base64, capturedAt: new Date().toISOString() };
  if (!oldFile) {
    const initial = await api('uploadVideo', payload);
    assert.equal(initial.ok, true, initial.error?.code);
    oldFile = initial.data.storageFileId;
    assert.ok(oldFile);
    console.log('F01 PASS: TEST A Day02 first verified upload');
  }
  const uploaded = await api('uploadVideo', payload);
  assert.equal(uploaded.ok, true, uploaded.error?.code);
  assert.equal(uploaded.data.previousFileTrashed, false);
  assert.notEqual(uploaded.data.storageFileId, oldFile);
  const after = await read('test_student_a');
  assert.equal(after.assets.find(x => x.assetId === assetId)?.storageFileId, uploaded.data.storageFileId);
  assert.ok(after.dayRecord.personalEvidenceRefs.includes(assetId));
  assert.equal((await read('test_student_b')).dayRecord?.dayRecordId, beforeB.dayRecord?.dayRecordId);
  console.log('F02/F03/F14 PASS: TEST A Day02 video replaced, old file retained in API contract, TEST B unchanged');
  const refused = await api('uploadVideo', { ...payload, mimeType: 'video/avi' });
  assert.equal(refused.ok, false);
  assert.equal(refused.error.code, 'INVALID_VIDEO_MIME_TYPE');
  assert.equal((await read('test_student_a')).assets.find(x => x.assetId === assetId)?.storageFileId,
    uploaded.data.storageFileId);
  console.log('F04 PASS: invalid replacement preserves representative video');
  if (process.env.EXPECT_VIDEO_GUARD === '1') {
    const forged = await api('upsertAsset', { assetType: 'video', assetId,
      storageFileId: oldFile, ownerId: 'test_student_a', dayId: 'day02' });
    assert.equal(forged.ok, false);
    assert.equal(forged.error.code, 'VIDEO_ASSET_IMMUTABLE');
    assert.equal((await read('test_student_a')).assets.find(x => x.assetId === assetId)?.storageFileId,
      uploaded.data.storageFileId);
    console.log('F04 PASS: public Asset API cannot roll representative back to old video');
  }
  fs.writeFileSync(privateOutput, JSON.stringify({ oldFile, newFile: uploaded.data.storageFileId,
    assetId, studentId: 'test_student_a', dayId: 'day02' }));
})().catch(error => { console.error('FAIL ' + error.message); process.exitCode = 1; });
