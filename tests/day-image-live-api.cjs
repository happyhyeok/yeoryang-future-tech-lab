// Isolated TEST only. Never run without all four distinct storage IDs.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
const testSheet = process.env.IMAGE_TEST_SHEET_ID || '';
const testFolder = process.env.IMAGE_TEST_FOLDER_ID || '';
const productionSheet = process.env.IMAGE_PRODUCTION_SHEET_ID || '';
const productionFolder = process.env.IMAGE_PRODUCTION_FOLDER_ID || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
    !testSheet || !testFolder || !productionSheet || !productionFolder ||
    testSheet === productionSheet || testFolder === productionFolder) {
  throw Error('TEST preflight failed: missing endpoint or storage IDs are not isolated');
}

async function api(action, payload, params) {
  const url = new URL(endpoint);
  let response;
  if (params) {
    url.searchParams.set('action', action);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } else {
    response = await fetch(url, { method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }), signal: AbortSignal.timeout(60000) });
  }
  assert.equal(response.status, 200, `${action} HTTP status`);
  return response.json();
}
function good(result, action) {
  assert.equal(result.ok, true, `${action}: ${result.error?.code || 'unknown error'}`);
  return result.data;
}
function evidence(studentId, workId, dayId, mimeType, base64Data) {
  return { mediaKind: 'image', studentId, workId, dayId,
    assetId: `asset_${studentId}_${dayId}_image`, mimeType, base64Data,
    capturedAt: new Date().toISOString() };
}
async function drawImages() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    return await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 24; canvas.height = 24;
      const context = canvas.getContext('2d');
      context.fillStyle = '#138e77'; context.fillRect(0, 0, 24, 24);
      context.fillStyle = '#ffffff'; context.fillRect(5, 5, 14, 14);
      return Object.fromEntries(['image/png', 'image/jpeg', 'image/webp'].map(type =>
        [type, canvas.toDataURL(type, 0.9).split(',')[1]]));
    });
  } finally { await browser.close(); }
}
async function main() {
  const labels = [];
  const students = good(await api('getStudents', null, {}), 'getStudents').students;
  assert.deepEqual(students.map(s => s.studentId).sort(), ['test_student_a', 'test_student_b']);
  labels.push('preflight: PASS synthetic students only');
  const images = await drawImages();
  const a = ['test_student_a', 'test_work_a'];
  const b = ['test_student_b', 'test_work_b'];
  const read = async (studentId, dayId) => good(await api('getDayRecord', null, { studentId, dayId }), 'getDayRecord');
  let before = await read(a[0], 'day06');
  assert.equal(before.assets.length, 0);
  let saved = good(await api('uploadVideo', evidence(...a, 'day06', 'image/png', images['image/png'])), 'S01');
  let current = await read(a[0], 'day06');
  assert.equal(current.assets[0].storageFileId, saved.storageFileId);
  assert.ok(current.dayRecord.personalEvidenceRefs.includes(saved.assetId));
  labels.push('S01/S04/S05/S07: PASS server readback');

  const oldFile = saved.storageFileId;
  saved = good(await api('uploadVideo', evidence(...a, 'day06', 'image/jpeg', images['image/jpeg'])), 'S02');
  current = await read(a[0], 'day06');
  assert.notEqual(saved.storageFileId, oldFile);
  assert.equal(current.assets[0].storageFileId, saved.storageFileId);
  labels.push('S02/S08: PASS replacement and readback');

  const day07 = good(await api('uploadVideo', evidence(...a, 'day07', 'image/webp', images['image/webp'])), 'S03');
  const seven = await read(a[0], 'day07');
  assert.equal(seven.assets[0].storageFileId, day07.storageFileId);
  assert.notEqual(seven.assets[0].storageFileId, current.assets[0].storageFileId);
  labels.push('S03/S09: PASS Day07 separate and readback');

  const tooLarge = Buffer.alloc(3 * 1024 * 1024 + 1);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(tooLarge);
  let refused = await api('uploadVideo', evidence(...a, 'day06', 'image/png', tooLarge.toString('base64')));
  assert.equal(refused.ok, false);
  assert.equal((await read(a[0], 'day06')).assets[0].storageFileId, saved.storageFileId);
  labels.push('S10: PASS rejected over 3 MB');
  refused = await api('uploadVideo', evidence(...a, 'day06', 'image/png', images['image/jpeg']));
  assert.equal(refused.ok, false);
  assert.equal((await read(a[0], 'day06')).assets[0].storageFileId, saved.storageFileId);
  labels.push('S11: PASS disguised format rejected');

  assert.equal((await read(b[0], 'day06')).assets.length, 0);
  const bSaved = good(await api('uploadVideo', evidence(...b, 'day06', 'image/png', images['image/png'])), 'S12');
  assert.equal((await read(b[0], 'day06')).assets[0].storageFileId, bSaved.storageFileId);
  assert.equal((await read(a[0], 'day06')).assets[0].storageFileId, saved.storageFileId);
  labels.push('S12: PASS synthetic A/B records separate');

  const autosave = { studentId: a[0], workId: a[1], dayId: 'day06',
    blockProgress: {}, activities: [], personalEvidenceRefs: [], commonEvidenceRefs: [],
    minimumCompleted: false, completionLevel: '', status: 'in_progress',
    todayDecision: 'synthetic E2E decision', dayState: { syntheticE2E: true } };
  good(await api('saveDayRecord', autosave), 'S13');
  current = await read(a[0], 'day06');
  assert.ok(current.dayRecord.personalEvidenceRefs.includes(saved.assetId));
  assert.equal(current.dayRecord.todayDecision, autosave.todayDecision);
  labels.push('S13: PASS image reference retained by autosave');
  for (const line of labels) process.stdout.write(line + '\n');
  process.stdout.write('Live API portion complete; verify physical Sheet rows and Drive files separately.\n');
}
main().catch(error => { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; });
