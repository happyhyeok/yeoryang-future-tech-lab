const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

test('failed initial lookup shows retry and cannot open upload picker', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.setContent('<main id="day"></main>');
    await page.addScriptTag({ path: path.resolve(__dirname, '../day-image-evidence.js') });
    await page.evaluate(() => {
      let calls = 0;
      window.DayImageEvidence.install({
        root: document.querySelector('#day'),
        getContext: () => ({ studentId: 'test_student_a', workId: 'test_work_a', dayId: 'day06' }),
        request: async () => {
          if (++calls === 1) throw Error('lookup failed');
          return { assets: [] };
        },
      });
    });
    const button = page.locator('[data-day-image-button]');
    await button.getByText('다시 시도').waitFor();
    assert.match(await page.locator('[data-day-image-status]').innerText(), /불러오지/);
    await button.click();
    await button.getByText('등록').waitFor();
    assert.equal(await button.isEnabled(), true);
    assert.equal(await page.locator('[data-day-image-preview]').isVisible(), false);
  } finally {
    await browser.close();
  }
});

test('failed thumbnail hides broken image and reports display error', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route('https://drive.google.com/thumbnail?**', route => route.abort());
    await page.setContent('<main id="day"></main>');
    await page.addScriptTag({ path: path.resolve(__dirname, '../day-image-evidence.js') });
    await page.evaluate(() => window.DayImageEvidence.install({
      root: document.querySelector('#day'),
      getContext: () => ({ studentId: 'test_student_a', workId: 'test_work_a', dayId: 'day06' }),
      request: async () => ({ assets: [{ assetId: 'asset_test_student_a_day06_image',
        assetType: 'screenshot', ownerId: 'test_student_a', dayId: 'day06',
        storageFileId: 'test_file_123456789' }] }),
    }));
    await page.getByText('이미지를 표시하지 못했어요.').waitFor();
    assert.equal(await page.locator('[data-day-image-preview]').isVisible(), false);
    assert.equal(await page.locator('[data-day-image-button]').innerText(), '변경하기');
  } finally {
    await browser.close();
  }
});

test('post-upload record verification uses a fresh GET URL', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const png = fs.readFileSync(path.resolve(__dirname, '../assets/day07/light_sensor.png'));
    await page.route('https://drive.google.com/thumbnail?**', route =>
      route.fulfill({ status: 200, contentType: 'image/png', body: png }));
    await page.setContent('<main id="day"></main>');
    await page.addScriptTag({ path: path.resolve(__dirname, '../day-image-evidence.js') });
    await page.evaluate(() => {
      window.gets = [];
      window.DayImageEvidence.install({
        root: document.querySelector('#day'),
        getContext: () => ({ studentId: 'test_student_a', workId: 'test_work_a', dayId: 'day06' }),
        request: async (action, options) => {
          if (action === 'uploadVideo') return { assetId: 'asset_test_student_a_day06_image',
            storageFileId: 'test_file_123456789' };
          window.gets.push(options.params.imageFetchNonce);
          return { assets: window.gets.length === 1 ? [] : [{
            assetId: 'asset_test_student_a_day06_image', assetType: 'screenshot',
            storageFileId: 'test_file_123456789', ownerId: 'test_student_a', dayId: 'day06',
          }] };
        },
      });
    });
    await page.locator('[data-day-image-button]').getByText('등록').waitFor();
    await page.locator('[data-day-image-file]').setInputFiles({ name: 'test.png',
      mimeType: 'image/png', buffer: png });
    await page.locator('[data-day-image-button]').getByText('변경하기').waitFor();
    const gets = await page.evaluate(() => window.gets);
    assert.equal(gets.length, 2);
    assert.notEqual(gets[0], gets[1]);
  } finally { await browser.close(); }
});

test('lost upload response re-reads server state and shows saved image', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const png = fs.readFileSync(path.resolve(__dirname, '../assets/day07/light_sensor.png'));
    await page.route('https://drive.google.com/thumbnail?**', route =>
      route.fulfill({ status: 200, contentType: 'image/png', body: png }));
    await page.setContent('<main id="day"></main>');
    await page.addScriptTag({ path: path.resolve(__dirname, '../day-image-evidence.js') });
    await page.evaluate(() => {
      let uploaded = false;
      window.DayImageEvidence.install({
        root: document.querySelector('#day'),
        getContext: () => ({ studentId: 'test_student_a', workId: 'test_work_a', dayId: 'day06' }),
        request: async action => {
          if (action === 'uploadVideo') { uploaded = true; throw Error('response lost'); }
          return { assets: uploaded ? [{ assetId: 'asset_test_student_a_day06_image',
            assetType: 'screenshot', storageFileId: 'test_file_123456789',
            ownerId: 'test_student_a', dayId: 'day06' }] : [] };
        },
      });
    });
    await page.locator('[data-day-image-button]').getByText('등록').waitFor();
    await page.locator('[data-day-image-file]').setInputFiles({ name: 'test.png',
      mimeType: 'image/png', buffer: png });
    await page.locator('[data-day-image-button]').getByText('변경하기').waitFor();
    await page.waitForFunction(() => document.querySelector('[data-day-image-preview]')?.naturalWidth > 0);
    assert.equal(await page.locator('[data-day-image-preview]').isVisible(), true);
  } finally { await browser.close(); }
});
