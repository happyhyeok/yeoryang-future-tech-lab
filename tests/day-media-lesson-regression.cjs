const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.IMAGE_PREVIEW_URL || '';
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/[a-z0-9-]+\.yeoryang-image-e2e-test-20261025\.pages\.dev$/.test(base) ||
    !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))
  throw Error('TEST Preview/API required');
async function read(dayId) {
  const url = new URL(endpoint);
  for (const [k, v] of Object.entries({ action: 'getDayRecord', studentId: 'test_student_a', dayId }))
    url.searchParams.set(k, v);
  const result = await (await fetch(url, { signal: AbortSignal.timeout(40000) })).json();
  assert.equal(result.ok, true); return result.data.dayRecord;
}
(async () => {
  const before6 = await read('day06'), before7 = await read('day07');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    for (const [number, selector] of [[6, '#day06-step-2'], [7, '#day07-step-1']]) {
      await page.goto(`${base}/?day=${number}`);
      if (await page.getByRole('button', { name: /테스트 A/ }).isVisible()) {
        await page.getByRole('button', { name: /테스트 A/ }).click();
        await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
      }
      await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
      await page.locator(selector).waitFor({ timeout: 30000 });
      await page.locator('[data-day-image-slot]').waitFor({ timeout: 30000 });
      assert.ok(await page.locator(selector).count());
      await page.screenshot({ path: path.join(__dirname,
        `../verification/final-screenshots/390x844-media-policy-day0${number}-lesson.png`), fullPage: true });
      console.log(`Day0${number} lesson and image slot PASS`);
    }
    await page.goto(base + '/?day=2');
    if (await page.getByRole('button', { name: /테스트 A/ }).isVisible()) {
      await page.getByRole('button', { name: /테스트 A/ }).click();
      await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
    }
    await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
    await page.locator('[data-drive-video-preview]').waitFor({ state: 'visible', timeout: 30000 });
    console.log('Day02 saved video iframe visible');
  } finally { await browser.close(); }
  assert.deepEqual(await read('day06'), before6);
  assert.deepEqual(await read('day07'), before7);
  console.log('Day06/Day07 server research records unchanged by browser navigation');
})().catch(error => { console.error('FAIL ' + (error.stack || error.message)); process.exitCode = 1; });
