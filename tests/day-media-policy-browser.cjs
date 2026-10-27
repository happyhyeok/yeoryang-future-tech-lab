const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.IMAGE_PREVIEW_URL || '';
const expected = process.env.IMAGE_EXPECTED_REVIEW_STATUS || 'PENDING_REVIEW';
const dayNumber = process.env.IMAGE_TEST_DAY === 'day07' ? 7 : 6;
if (!/^https:\/\/[a-z0-9-]+\.yeoryang-image-e2e-test-20261025\.pages\.dev$/.test(base))
  throw Error('Isolated TEST Preview required');
async function enter(page, student) {
  await page.goto(base + '/?day=' + dayNumber);
  await page.getByRole('button', { name: new RegExp(student) }).click();
  await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
  await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
  await page.locator('[data-day-image-slot]').waitFor();
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await enter(page, '테스트 A');
    const slot = page.locator('[data-day-image-slot]');
    const status = expected === 'APPROVED' ? '' :
      ({ PENDING_REVIEW: '승인 대기', REJECTED: '게시 거부', REVOKED: '승인 철회' })[expected];
    if (status) {
      await slot.locator('[data-day-image-status]').getByText(status).waitFor({ timeout: 30000 });
      assert.equal(await slot.locator('[data-day-image-preview]').isVisible(), false);
    } else {
      await slot.locator('[data-day-image-preview]').waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForFunction(() => document.querySelector('[data-day-image-preview]')?.naturalWidth > 0);
    }
    assert.equal(await slot.locator('[data-day-image-button]').innerText(), '변경하기');
    await page.screenshot({ path: path.join(__dirname,
      `../verification/final-screenshots/390x844-media-day0${dayNumber}-${expected.toLowerCase()}.png`), fullPage: true });
    await page.reload();
    await slot.waitFor();
    if (status) await slot.locator('[data-day-image-status]').getByText(status).waitFor({ timeout: 30000 });
    else await slot.locator('[data-day-image-preview]').waitFor({ state: 'visible', timeout: 30000 });
    console.log(`A05/A12 PASS TEST A Day0${dayNumber} ${expected}, refresh`);
    await page.getByRole('button', { name: '연구원 바꾸기' }).click();
    await page.getByRole('button', { name: /테스트 B/ }).click();
    await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
    await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
    const b = page.locator('[data-day-image-slot]');
    await b.waitFor();
    assert.equal(await b.locator('[data-day-image-preview]').isVisible(), false);
    console.log('A11 PASS TEST B cannot see TEST A image');
  } finally { await browser.close(); }
})().catch(error => { console.error('FAIL ' + (error.stack || error.message)); process.exitCode = 1; });
