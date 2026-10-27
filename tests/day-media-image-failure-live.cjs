const assert = require('node:assert/strict');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))
  throw Error('Isolated TEST endpoint required');
async function read() {
  const url = new URL(endpoint);
  for (const [key, value] of Object.entries({ action: 'getDayRecord', studentId: 'test_student_a', dayId: 'day06' }))
    url.searchParams.set(key, value);
  const result = await (await fetch(url, { signal: AbortSignal.timeout(40000) })).json();
  assert.equal(result.ok, true); return result.data;
}
(async () => {
  const before = await read();
  const payload = { mediaKind: 'image', studentId: 'test_student_a', workId: 'test_work_a',
    dayId: 'day06', assetId: 'asset_test_student_a_day06_image',
    mimeType: 'image/gif', base64Data: 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' };
  const result = await (await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'uploadVideo', payload }), signal: AbortSignal.timeout(60000) })).json();
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_IMAGE_MIME_TYPE');
  const after = await read();
  assert.deepEqual(after, before);
  console.log('F06 PASS: invalid TEST image replacement rejected; representative and DayRecord unchanged');
})().catch(error => { console.error('FAIL ' + error.message); process.exitCode = 1; });
