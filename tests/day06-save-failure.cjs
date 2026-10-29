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
async function api(action, payload, params) {
  const url = new URL(endpoint);
  let response;
  if (params) {
    url.searchParams.set('action', action);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } else {
    response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }), signal: AbortSignal.timeout(60000) });
  }
  const result = await response.json();
  assert.equal(result.ok, true, `${action}: ${result.error?.code || ''}`);
  return result.data;
}
async function open(page, n) {
  const details = page.locator(`#day06-step-${n} > details`);
  if (!(await details.evaluate(node => node.open))) await details.locator(':scope > summary').click();
}
async function main() {
  const before = (await api('getDayRecord', null, { studentId: 'test_student_b', dayId: 'day06' })).dayRecord;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    let blocked = 0;
    await page.route('https://script.google.com/macros/s/**/exec', async route => {
      let body = {};
      try { body = JSON.parse(route.request().postData() || '{}'); } catch (_) {}
      if (route.request().method() === 'POST' && body.action === 'saveDayRecord') {
        blocked++;
        return route.abort('failed');
      }
      return route.continue();
    });
    await page.goto(`${base}/?day=6`);
    await page.getByRole('button', { name: /테스트 B/ }).click();
    await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
    await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
    await page.waitForFunction(() => document.querySelector('[data-day06-previous-record]')?.textContent?.includes('테스트 B:'), null, { timeout: 30000 });
    await open(page, 2);
    await page.locator('[data-day06-problem-decision="replace"]').click();
    assert.equal(await page.locator('[data-day06-problem-edit]').isVisible(), true);
    assert.equal(await page.locator('#day06-idea-1').isEnabled(), false);
    await page.locator('[data-day06-cancel-problem-edit]').click();
    await page.locator('[data-day06-problem-decision="keep"]').click();
    await open(page, 3);
    await page.locator('#day06-idea-1').fill('흙이 마르면 LED로 알려 주기');
    await page.locator('#day06-idea-2').fill('버튼으로 흙 상태 확인하기');
    await open(page, 4);
    for (const i of [0, 1]) for (const criterion of ['help', 'possible']) {
      await page.locator(`[data-day06-comparison="${i}:${criterion}"]`).first().check();
    }
    await open(page, 5);
    await page.locator('[data-day06-final-choices] input[value="idea1"]').check();
    await page.locator('[data-day06-reason]').fill('화분을 돌보는 사람이 바로 확인하고 LED부터 만들 수 있어요.');
    await page.locator('[data-day06-save]').click();
    await page.locator('[data-day06-save-status]').getByText('연구소 기록에 저장하지 못했어요. 지금 쓴 내용은 이 화면에 남아 있습니다. 다시 저장해 보세요.').waitFor({ timeout: 45000 });
    assert.ok(blocked > 0);
    const unchanged = (await api('getDayRecord', null, { studentId: 'test_student_b', dayId: 'day06' })).dayRecord;
    assert.equal(unchanged.updatedAt, before.updatedAt);
    assert.ok(unchanged.personalEvidenceRefs.includes('asset_test_student_b_day06_image'));
    await page.screenshot({ path: path.join(__dirname, '../verification/final-screenshots/390x844-day06-save-failed.png'), fullPage: true });
    await page.unroute('https://script.google.com/macros/s/**/exec');
    const retry = page.locator('[data-day06-save-retry]');
    if (await retry.isVisible()) await retry.click();
    else await page.locator('[data-day06-save]').click();
    await page.waitForFunction(() => document.querySelector('[data-day06-save-status]')?.textContent?.includes('저장되었습니다'), null, { timeout: 90000 });
    const saved = (await api('getDayRecord', null, { studentId: 'test_student_b', dayId: 'day06' })).dayRecord;
    assert.equal(saved.dayStateJson.day06Ideas[0], '흙이 마르면 LED로 알려 주기');
    assert.ok(saved.personalEvidenceRefs.includes('asset_test_student_b_day06_image'));
    await page.screenshot({ path: path.join(__dirname, '../verification/final-screenshots/390x844-day06-save-retried.png'), fullPage: true });
    process.stdout.write('D06-03/04/14 P15: PASS replace/cancel, server write failure, prior record intact, retry and image ref retained\n');
  } finally { await browser.close(); }
}
main().catch(error => { process.stderr.write(`FAIL: ${error.stack || error.message}\n`); process.exitCode = 1; });
