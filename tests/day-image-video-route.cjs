// Read-only route smoke on TEST Web App; deliberately invalid MIME prevents Drive writes.
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) {
  throw Error('TEST endpoint missing');
}
async function main() {
  const response = await fetch(endpoint, { method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'uploadVideo', payload: {
      studentId: 'test_student_a', workId: 'test_work_a', dayId: 'day06',
      assetId: 'asset_test_student_a_day06_video', mimeType: 'video/not-supported',
      base64Data: 'AAAA',
    } }), signal: AbortSignal.timeout(30000) });
  const data = await response.json();
  if (response.status !== 200 || data.ok || !data.error?.code ||
      data.error.code === 'INVALID_IMAGE_MIME_TYPE') throw Error('Video route was not isolated');
  process.stdout.write('S14 route smoke: PASS video validation branch; actual video upload NOT_RUN\n');
}
main().catch(error => { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; });
