// Run only while the TEST Day06 record's workId is deliberately mismatched.
const fs = require('node:fs');
const path = require('node:path');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) {
  throw Error('TEST endpoint missing');
}
const base64Data = fs.readFileSync(path.resolve(__dirname, '../assets/day07/light_sensor.png')).toString('base64');
const payload = { mediaKind: 'image', studentId: 'test_student_a', workId: 'test_work_a',
  dayId: 'day06', assetId: 'asset_test_student_a_day06_image',
  mimeType: 'image/png', base64Data, capturedAt: new Date().toISOString() };
async function main() {
  const response = await fetch(endpoint, { method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'uploadVideo', payload }),
    signal: AbortSignal.timeout(60000) });
  const data = await response.json();
  if (response.status !== 200 || data.ok || data.error?.code !== 'WORK_STUDENT_MISMATCH') {
    throw Error(`Unexpected fault injection result: HTTP ${response.status}, code ${data.error?.code || 'none'}`);
  }
  process.stdout.write('S06 injected DayRecord ownership mismatch: rejected as expected\n');
}
main().catch(error => { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; });
