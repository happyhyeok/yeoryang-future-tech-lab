// Run only against the isolated TEST deployment after checking Script Properties.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
const testSheet = process.env.IMAGE_TEST_SHEET_ID || '';
const productionSheet = process.env.IMAGE_PRODUCTION_SHEET_ID || '';
const testVideoFolder = process.env.VIDEO_TEST_FOLDER_ID || '';
const productionVideoFolder = process.env.VIDEO_PRODUCTION_FOLDER_ID || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
    !testSheet || !productionSheet || testSheet === productionSheet ||
    !testVideoFolder || !productionVideoFolder || testVideoFolder === productionVideoFolder) {
  throw Error('Isolated TEST server/Sheet/video folder preflight failed');
}
async function api(action, payload, params) {
  const url = new URL(endpoint);
  let response;
  if (params) {
    url.searchParams.set('action', action);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    response = await fetch(url, { signal: AbortSignal.timeout(40000) });
  } else {
    response = await fetch(url, { method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }), signal: AbortSignal.timeout(90000) });
  }
  assert.equal(response.status, 200, `${action} HTTP`);
  return response.json();
}
function good(value, label) {
  assert.equal(value.ok, true, `${label}: ${value.error?.code || 'unknown error'}`);
  return value.data;
}
async function sampleWebm() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const encoded = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160; canvas.height = 120;
      const context = canvas.getContext('2d');
      const stream = canvas.captureStream(12);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      const stopped = new Promise(resolve => { recorder.onstop = resolve; });
      recorder.start();
      for (let i = 0; i < 18; i++) {
        context.fillStyle = i % 2 ? '#007f8b' : '#eaac3f';
        context.fillRect(0, 0, 160, 120);
        context.fillStyle = '#fff';
        context.fillRect(10 + i * 5, 40, 24, 24);
        await new Promise(resolve => setTimeout(resolve, 85));
      }
      recorder.stop();
      await stopped;
      stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(chunks, { type: 'video/webm' });
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      }
      return { base64: btoa(binary), bytes: bytes.length };
    });
    assert.ok(encoded.bytes > 1000, 'synthetic WebM has media bytes');
    return encoded.base64;
  } finally { await browser.close(); }
}
function upload(student, work, day, base64, mime = 'video/webm') {
  return { studentId: student, workId: work, dayId: day,
    assetId: `asset_${student}_${day}_video`, mimeType: mime,
    base64Data: base64, capturedAt: new Date().toISOString() };
}
async function main() {
  const students = good(await api('getStudents', null, {}), 'preflight').students;
  assert.deepEqual(students.map(s => s.studentId).sort(), ['test_student_a', 'test_student_b']);
  const webm = await sampleWebm();
  const read = async (studentId, dayId) => good(await api('getDayRecord', null, { studentId, dayId }), 'getDayRecord');
  const a = ['test_student_a', 'test_work_a'];
  const b = ['test_student_b', 'test_work_b'];
  const saved = {};
  for (const day of ['day01', 'day02', 'day03']) {
    saved[day] = good(await api('uploadVideo', upload(...a, day, webm)), `V-${day}`);
    assert.ok(saved[day].storageFileId);
    process.stdout.write(`${day}: PASS actual WebM saved to TEST server\n`);
  }
  const prior = saved.day01.storageFileId;
  saved.day01 = good(await api('uploadVideo', upload(...a, 'day01', webm)), 'V04 replacement');
  assert.notEqual(saved.day01.storageFileId, prior);
  const bSaved = good(await api('uploadVideo', upload(...b, 'day01', webm)), 'V06 B');
  assert.notEqual(bSaved.storageFileId, saved.day01.storageFileId);
  const aRecord = { studentId: a[0], workId: a[1], dayId: 'day01',
    blockProgress: {}, activities: [], personalEvidenceRefs: [saved.day01.assetId],
    commonEvidenceRefs: [], minimumCompleted: false, completionLevel: '',
    status: 'in_progress', todayDecision: 'synthetic video regression', dayState: { syntheticVideo: true } };
  good(await api('saveDayRecord', aRecord), 'V09 saveDayRecord');
  const readback = await read(a[0], 'day01');
  assert.equal(readback.assets.find(asset => asset.assetId === saved.day01.assetId)?.storageFileId,
    saved.day01.storageFileId);
  assert.equal(readback.dayRecord.todayDecision, aRecord.todayDecision);
  assert.equal((await read(b[0], 'day01')).assets.length, 0);
  let refused = await api('uploadVideo', upload(...a, 'day02', webm, 'video/avi'));
  assert.equal(refused.ok, false);
  assert.equal(refused.error?.code, 'INVALID_VIDEO_MIME_TYPE');
  refused = await api('uploadVideo', upload(...a, 'day02', Buffer.alloc(6 * 1024 * 1024 + 1).toString('base64')));
  assert.equal(refused.ok, false);
  assert.equal(refused.error?.code, 'VIDEO_TOO_LARGE');
  const aImage = await read(a[0], 'day06');
  assert.ok(aImage.assets.some(asset => asset.assetType === 'screenshot'));
  assert.equal((await read(a[0], 'day01')).assets[0].storageFileId, saved.day01.storageFileId);
  process.stdout.write('V01-V04,V06-V10: PASS TEST API, video record reference, rejects, image branch unchanged\n');
  process.stdout.write('Four current TEST video file IDs retained in server response for Drive readback.\n');
}
main().catch(error => { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; });
