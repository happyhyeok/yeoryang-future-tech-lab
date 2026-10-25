const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.IMAGE_PREVIEW_URL || '';
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw Error('Use isolated local TEST Preview URL');
const output = path.resolve(__dirname, '../verification/screenshots');
const png = fs.readFileSync(path.resolve(__dirname, '../assets/day07/light_sensor.png'));
async function enter(page) {
  await page.goto(base + '/?day=6');
  await page.getByRole('button', { name: /테스트 A/ }).click();
  await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
  await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
  await page.locator('[data-day-image-button]').getByText('변경하기').waitFor({ timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('[data-day-image-preview]')?.naturalWidth > 0);
}
async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    // S16: send the request to TEST, then lose only the browser response.
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await enter(page);
    const previous = await page.locator('[data-day-image-preview]').getAttribute('src');
    let intercepted = false;
    await page.route('https://script.google.com/macros/s/**/exec', async route => {
      const request = route.request();
      let body = {};
      try { body = JSON.parse(request.postData() || '{}'); } catch (_) {}
      if (request.method() !== 'POST' || body.action !== 'uploadVideo' ||
          body.payload?.mediaKind !== 'image' || intercepted) return route.continue();
      intercepted = true;
      const serverResponse = await route.fetch();
      assert.equal(serverResponse.status(), 200);
      await route.abort('failed');
    });
    await page.locator('[data-day-image-file]').setInputFiles({ name: 'response-loss.png',
      mimeType: 'image/png', buffer: png });
    await page.waitForFunction(old => {
      const image = document.querySelector('[data-day-image-preview]');
      return image && image.src !== old && image.complete && image.naturalWidth > 0;
    }, previous, { timeout: 90000 });
    assert.equal(intercepted, true);
    await page.screenshot({ path: path.join(output, '390x844-day06-studentA-response-lost-recovered.png'), fullPage: true });
    process.stdout.write('S16: PASS TEST server write after browser response loss reconciled\n');
    await page.close();

    // S18: abort only the thumbnail request; retain the Sheet/Drive record.
    const broken = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await broken.route('https://drive.google.com/thumbnail?**', route => route.abort('failed'));
    await broken.goto(base + '/?day=6');
    await broken.getByRole('button', { name: /테스트 A/ }).click();
    await broken.getByRole('button', { name: /내 연구소 들어가기/ }).click();
    await broken.getByRole('button', { name: /오늘 연구 시작/ }).click();
    await broken.getByText('이미지를 표시하지 못했어요.').waitFor({ timeout: 30000 });
    assert.equal(await broken.locator('[data-day-image-preview]').isVisible(), false);
    await broken.screenshot({ path: path.join(output, '390x844-day06-studentA-image-load-failed.png'), fullPage: true });
    process.stdout.write('S18: PASS broken TEST thumbnail hidden with error state\n');

    // S15: let the TEST upload finish after changing from student A to B.
    const switched = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await enter(switched);
    let requestStarted;
    const started = new Promise(resolve => { requestStarted = resolve; });
    let requestFinished;
    const finished = new Promise(resolve => { requestFinished = resolve; });
    let interceptedSwitch = false;
    await switched.route('https://script.google.com/macros/s/**/exec', async route => {
      let body = {};
      try { body = JSON.parse(route.request().postData() || '{}'); } catch (_) {}
      if (route.request().method() !== 'POST' || body.action !== 'uploadVideo' ||
          body.payload?.mediaKind !== 'image' || interceptedSwitch) return route.continue();
      interceptedSwitch = true;
      requestStarted();
      await new Promise(resolve => setTimeout(resolve, 1500));
      const response = await route.fetch();
      requestFinished();
      await route.fulfill({ response });
    });
    await switched.locator('[data-day-image-file]').setInputFiles({ name: 'switch.png',
      mimeType: 'image/png', buffer: png });
    await Promise.race([started, new Promise((_, reject) => setTimeout(() => reject(Error('upload not started')), 10000))]);
    await switched.getByRole('button', { name: '연구원 바꾸기' }).click();
    await switched.getByRole('button', { name: /테스트 B/ }).click();
    await switched.getByRole('button', { name: /내 연구소 들어가기/ }).click();
    await switched.getByRole('button', { name: /오늘 연구 시작/ }).click();
    await finished;
    await switched.locator('[data-day-image-button]').getByText('변경하기').waitFor({ timeout: 30000 });
    const bSrc = await switched.locator('[data-day-image-preview]').getAttribute('src');
    assert.ok(bSrc && bSrc !== previous);
    await switched.screenshot({ path: path.join(output, '390x844-day06-studentB-after-A-upload-finished.png'), fullPage: true });
    process.stdout.write('S15: PASS late A upload did not replace B image\n');
  } finally { await browser.close(); }
}
main().catch(error => { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; });
