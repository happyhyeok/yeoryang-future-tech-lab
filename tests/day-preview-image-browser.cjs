// Run against an isolated Preview whose runtime-config.js contains only TEST students/API.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.IMAGE_PREVIEW_URL || '';
if (!/^https:\/\/[a-z0-9-]+\.yeoryang-image-e2e-test-20261025\.pages\.dev$/.test(base)) throw Error('Use isolated Cloudflare TEST Preview URL');
const output = path.resolve(__dirname, '../verification/final-screenshots');
fs.mkdirSync(output, { recursive: true });

async function enter(page, student, day) {
  await page.goto(`${base}/?day=${day}`);
  if (await page.getByRole('button', { name: new RegExp(student) }).isVisible()) {
    await page.getByRole('button', { name: new RegExp(student) }).click();
    await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
  }
  await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
  await page.locator('[data-day-image-button]').waitFor();
}
async function readyImage(page) {
  await page.locator('[data-day-image-button]').getByText('변경하기').waitFor({ timeout: 30000 });
  await page.waitForFunction(() => {
    const image = document.querySelector('[data-day-image-preview]');
    return image && image.complete && image.naturalWidth > 0 && !image.hidden;
  }, null, { timeout: 30000 });
  return page.locator('[data-day-image-preview]').getAttribute('src');
}
async function saveShot(page, size, day, student, scenario) {
  const file = path.join(output, `${size}-${day}-${student}-${scenario}.png`);
  await page.screenshot({ path: file, fullPage: true });
}
async function syntheticPng(page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 28; canvas.height = 28;
    const context = canvas.getContext('2d');
    context.fillStyle = '#2e718f'; context.fillRect(0, 0, 28, 28);
    context.fillStyle = '#fafafa'; context.fillRect(8, 8, 12, 12);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(data, 'base64');
}
async function upload(page, previous) {
  const data = await syntheticPng(page);
  await page.locator('[data-day-image-file]').setInputFiles({ name: 'synthetic-e2e.png',
    mimeType: 'image/png', buffer: data });
  try { await page.waitForFunction(old => {
    const image = document.querySelector('[data-day-image-preview]');
    const button = document.querySelector('[data-day-image-button]');
    return image && image.src !== old && image.complete && image.naturalWidth > 0 &&
      button && button.textContent === '변경하기' && !button.disabled;
  }, previous, { timeout: 90000 }); }
  catch (error) {
    const state = await page.locator('[data-day-image-slot]').evaluate(slot => {
      const image = slot.querySelector('[data-day-image-preview]');
      const button = slot.querySelector('[data-day-image-button]');
      return { status: slot.querySelector('[data-day-image-status]').textContent,
        width: image.naturalWidth, complete: image.complete, hidden: image.hidden,
        hasSource: Boolean(image.src), button: button.textContent, disabled: button.disabled };
    });
    throw Error(`${error.message}; UI state: ${JSON.stringify(state)}`);
  }
  return page.locator('[data-day-image-preview]').getAttribute('src');
}
async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 650, height: 900 },
      { width: 1440, height: 900 }]) {
      const size = `${viewport.width}x${viewport.height}`;
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await enter(page, '테스트 A', 6);
      const old = await readyImage(page);
      const replacement = await upload(page, old);
      assert.notEqual(replacement, old);
      await saveShot(page, size, 'day06', 'studentA', 'after-upload');
      await page.reload();
      const restored = await readyImage(page);
      assert.equal(restored, replacement);
      await saveShot(page, size, 'day06', 'studentA', 'after-refresh');

      await page.getByRole('button', { name: '연구원 바꾸기' }).click();
      await page.getByRole('button', { name: /테스트 B/ }).click();
      await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
      await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
      const bImage = await readyImage(page);
      assert.notEqual(bImage, restored);
      await saveShot(page, size, 'day06', 'studentB', 'separate');

      await enter(page, '테스트 B', 7);
      const button = page.locator('[data-day-image-button]');
      await button.getByText('변경하기').waitFor({ timeout: 30000 });
      const bDay07Before = await readyImage(page);
      const bDay07After = await upload(page, bDay07Before);
      assert.notEqual(bDay07After, bDay07Before);
      await saveShot(page, size, 'day07', 'studentB', 'after-upload');
      await page.reload();
      await readyImage(page);
      await saveShot(page, size, 'day07', 'studentB', 'after-refresh');

      await page.getByRole('button', { name: '연구원 바꾸기' }).click();
      await page.getByRole('button', { name: /테스트 A/ }).click();
      await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
      await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
      const aDay07 = await readyImage(page);
      assert.notEqual(aDay07, restored);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `${size} horizontal overflow`);
      await saveShot(page, size, 'day07', 'studentA', 'separate');
      process.stdout.write(`${size}: PASS upload, refresh, A/B and Day separation, image load, overflow\n`);
      await context.close();
    }
  } finally { await browser.close(); }
}
main().catch(error => { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; });
