// Isolated local UI + real TEST Apps Script. Never point this at Production.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.IMAGE_PREVIEW_URL || '';
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw Error('Local TEST preview required');
const shots = path.resolve(__dirname, '../verification/indexeddb-screenshots');
fs.mkdirSync(shots, { recursive: true });

async function enter(page, student, day) {
  await page.goto(`${base}/?day=${day}`);
  const switcher = page.getByRole('button', { name: '연구원 바꾸기' });
  if (await switcher.isVisible()) await switcher.click();
  await page.getByRole('button', { name: new RegExp(student) }).click();
  await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
  await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
  await page.locator('[data-day-image-button]:not([disabled])').waitFor({ timeout: 30000 });
}
async function syntheticPng(page, color) {
  const data = await page.evaluate(color => {
    const canvas = document.createElement('canvas');
    canvas.width = 30; canvas.height = 30;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color; ctx.fillRect(0, 0, 30, 30);
    return canvas.toDataURL('image/png').split(',')[1];
  }, color);
  return Buffer.from(data, 'base64');
}
async function upload(page, color) {
  const png = await syntheticPng(page, color);
  const old = await page.locator('[data-day-image-preview]').getAttribute('src');
  await page.locator('[data-day-image-file]').setInputFiles({
    name: 'synthetic-private-test.png', mimeType: 'image/png', buffer: png,
  });
  try { await page.waitForFunction(previous => {
    const slot = document.querySelector('[data-day-image-slot]');
    const src = slot?.querySelector('[data-day-image-preview]')?.getAttribute('src');
    return src && src !== previous &&
      slot.querySelector('[data-day-image-status]').textContent === '승인 대기 · 이 기기에 저장된 이미지' &&
      !slot.querySelector('[data-day-image-button]').disabled;
  }, old, { timeout: 90000 }); }
  catch (error) {
    const state = await page.locator('[data-day-image-slot]').evaluate(slot => ({
      status: slot.querySelector('[data-day-image-status]').textContent,
      imageVisible: !slot.querySelector('[data-day-image-preview]').hidden,
      hasImage: Boolean(slot.querySelector('[data-day-image-preview]').getAttribute('src')),
      button: slot.querySelector('[data-day-image-button]').textContent,
    }));
    throw Error(`${error.message}; UI: ${JSON.stringify(state)}`);
  }
  await page.locator('[data-day-image-button]:not([disabled])').waitFor();
  const src = await page.locator('[data-day-image-preview]').getAttribute('src');
  if (src === old) console.log('DIAGNOSTIC unchanged image', JSON.stringify({
    color, inputMatchesOld: old?.split(',')[1] === png.toString('base64'),
    status: await page.locator('[data-day-image-status]').innerText(),
  }));
  assert.match(src, /^data:image\/png;base64,/);
  assert.notEqual(src, old);
  assert.equal(await page.locator('[data-day-image-preview]').isVisible(), true);
  assert.equal(await page.locator('[data-day-image-button]').innerText(), '변경하기');
  assert.equal(await page.locator('[data-day-image-clear]').isVisible(), true);
  return src;
}
async function assertRestored(page, expected) {
  await page.reload();
  await page.getByText('승인 대기 · 이 기기에 저장된 이미지', { exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await page.locator('[data-day-image-preview]').getAttribute('src'), expected);
  assert.equal(await page.locator('[data-day-image-preview]').isVisible(), true);
}
async function noOverflow(page, width, height) {
  await page.setViewportSize({ width, height });
  const dimensions = await page.evaluate(() => ({ width: innerWidth,
    content: document.documentElement.scrollWidth }));
  assert.ok(dimensions.content <= dimensions.width, `${width} viewport overflows: ${dimensions.content}`);
}
async function storedKeys(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const opening = indexedDB.open('futurelab-day-images', 1);
    opening.onerror = () => reject(opening.error);
    opening.onsuccess = () => {
      const db = opening.result;
      const request = db.transaction('representatives').objectStore('representatives').getAllKeys();
      request.onsuccess = () => { resolve(request.result); db.close(); };
      request.onerror = () => { reject(request.error); db.close(); };
    };
  }));
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await enter(page, '테스트 A', 6);
    const first = await upload(page, '#28748b');
    await page.screenshot({ path: path.join(shots, 'day06-a-local-preview.png'), fullPage: true });
    await assertRestored(page, first);
    await page.screenshot({ path: path.join(shots, 'day06-a-after-refresh.png'), fullPage: true });
    const replacement = await upload(page, '#a34c72');
    assert.notEqual(first, replacement);
    await assertRestored(page, replacement);
    await page.screenshot({ path: path.join(shots, 'day06-a-replaced-after-refresh.png'), fullPage: true });
    await noOverflow(page, 390, 844);
    await noOverflow(page, 650, 900);
    await noOverflow(page, 1440, 900);

    const failed = await syntheticPng(page, '#e2aa26');
    await page.route('https://script.google.com/macros/**', route => route.abort());
    await page.locator('[data-day-image-file]').setInputFiles({
      name: 'synthetic-failed.png', mimeType: 'image/png', buffer: failed,
    });
    await page.getByText('저장 상태를 확인하지 못했어요. 다시 시도해 주세요.').waitFor({ timeout: 90000 });
    assert.equal(await page.locator('[data-day-image-preview]').getAttribute('src'), replacement);
    await page.unroute('https://script.google.com/macros/**');
    await assertRestored(page, replacement);

    await enter(page, '테스트 B', 6);
    assert.notEqual(await page.locator('[data-day-image-preview]').getAttribute('src'), replacement);
    await page.screenshot({ path: path.join(shots, 'day06-b-separated.png'), fullPage: true });
    await enter(page, '테스트 A', 7);
    const day07 = await upload(page, '#42649a');
    await assertRestored(page, day07);
    await page.screenshot({ path: path.join(shots, 'day07-a-after-refresh.png'), fullPage: true });
    assert.notEqual(day07, replacement);
    assert.deepEqual((await storedKeys(page)).sort(),
      ['test_student_a:day06', 'test_student_a:day07']);

    const revisit = await context.newPage();
    await enter(revisit, '테스트 A', 6);
    assert.equal(await revisit.locator('[data-day-image-preview]').getAttribute('src'), replacement);
    await revisit.locator('[data-day-image-clear]').click();
    await revisit.getByText('이 기기에 저장된 이미지가 없어요.').waitFor();
    assert.equal(await revisit.locator('[data-day-image-preview]').isVisible(), false);
    await revisit.reload();
    await revisit.getByText('이 기기에 저장된 이미지가 없어요.').waitFor();
    assert.equal(await revisit.locator('[data-day-image-preview]').isVisible(), false);
    assert.deepEqual(await storedKeys(revisit), ['test_student_a:day07']);
    await revisit.screenshot({ path: path.join(shots, 'day06-a-after-local-delete.png'), fullPage: true });
    console.log('PASS TEST Day06 initial/replace/reload/revisit, Day07/reload, A/B, failed save, local delete');
    console.log('PASS no horizontal overflow at 390x844, 650x900, 1440x900');
  } finally { await browser.close(); }
})().catch(error => { console.error('FAIL ' + (error.stack || error.message)); process.exitCode = 1; });
