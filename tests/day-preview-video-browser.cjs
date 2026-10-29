const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.IMAGE_PREVIEW_URL || '';
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/[a-z0-9-]+\.yeoryang-image-e2e-test-20261025\.pages\.dev$/.test(base) ||
    !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
    !process.env.IMAGE_TEST_SHEET_ID || !process.env.IMAGE_PRODUCTION_SHEET_ID ||
    process.env.IMAGE_TEST_SHEET_ID === process.env.IMAGE_PRODUCTION_SHEET_ID) {
  throw Error('TEST Preview/API/Sheet preflight failed');
}
async function getRecord(studentId) {
  const url = new URL(endpoint);
  for (const [k, v] of Object.entries({ action: 'getDayRecord', studentId, dayId: 'day01' })) url.searchParams.set(k, v);
  const result = await (await fetch(url, { signal: AbortSignal.timeout(30000) })).json();
  assert.equal(result.ok, true);
  return result.data.dayRecord;
}
async function enter(page, student) {
  await page.goto(`${base}/?day=1`);
  const choose = page.getByRole('button', { name: new RegExp(student) });
  if (await choose.isVisible()) {
    await choose.click();
    await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
  }
  await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
  await page.locator('[data-day01-activity="webcam-evidence"]').waitFor();
}
async function main() {
  const browser = await chromium.launch({ headless: true, args: [
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream' ] });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
    const page = await context.newPage();
    page.on('console', message => { if (message.type() === 'error' && message.text().includes('video upload failed')) process.stdout.write(`BROWSER upload error: ${message.text().slice(0, 220)}\n`); });
    page.on('response', async response => {
      if (!response.url().startsWith('https://script.google.com/macros/s/') || response.request().method() !== 'POST') return;
      try {
        const action = JSON.parse(response.request().postData() || '{}').action;
        const result = await response.json();
        process.stdout.write(`API ${action}: ${result.ok ? 'ok' : result.error?.code || 'error'}\n`);
      } catch (_) {}
    });
    await enter(page, '테스트 A');
    await page.locator('[data-camera-start]').click();
    await page.locator('[data-record-start]').waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('[data-record-start]').disabled, null, { timeout: 15000 });
    await page.locator('[data-record-start]').click();
    await page.waitForTimeout(1600);
    await page.locator('[data-record-stop]').click();
    await page.waitForFunction(() => !document.querySelector('[data-use-recording]').disabled, null, { timeout: 15000 });
    await page.locator('[data-use-recording]').click();
    await page.waitForFunction(() => document.querySelector('[data-webcam-status]')?.textContent?.includes('저장된 연구 영상'), null, { timeout: 120000 });
    let saved;
    for (let attempt = 0; attempt < 12; attempt++) {
      saved = await getRecord('test_student_a');
      if (saved.personalEvidenceRefs?.includes('asset_test_student_a_day01_video')) break;
      await page.waitForTimeout(1000);
    }
    assert.ok(saved.personalEvidenceRefs?.includes('asset_test_student_a_day01_video'),
      `Day01 server refs: ${JSON.stringify(saved.personalEvidenceRefs || [])}, status=${await page.locator('[data-webcam-status]').innerText()}`);
    await page.screenshot({ path: path.join(__dirname, '../verification/final-screenshots/390x844-day01-video-upload.png'), fullPage: true });
    await page.reload();
    await page.locator('[data-drive-video-preview]').waitFor({ state: 'visible', timeout: 60000 });
    await page.screenshot({ path: path.join(__dirname, '../verification/final-screenshots/390x844-day01-video-refresh.png'), fullPage: true });
    const iframeSrc = await page.locator('[data-drive-video-preview]').getAttribute('src');
    assert.match(iframeSrc, /drive\.google\.com/);
    await page.getByRole('button', { name: '연구원 바꾸기' }).click();
    await page.getByRole('button', { name: /테스트 B/ }).click();
    await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
    await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
    const b = await getRecord('test_student_b');
    assert.notEqual(b?.personalEvidenceRefs?.[0], saved.personalEvidenceRefs?.[0]);
    process.stdout.write('P13/V05/V06: PASS student UI fake-camera WebM upload, TEST server ref, reload iframe, A/B split\n');
  } finally { await browser.close(); }
}
main().catch(error => { process.stderr.write(`FAIL: ${error.stack || error.message}\n`); process.exitCode = 1; });
