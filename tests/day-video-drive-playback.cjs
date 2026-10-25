// Decode the actual public-link TEST Drive WebM bytes in Chromium.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
    !process.env.IMAGE_TEST_SHEET_ID || !process.env.IMAGE_PRODUCTION_SHEET_ID ||
    process.env.IMAGE_TEST_SHEET_ID === process.env.IMAGE_PRODUCTION_SHEET_ID) {
  throw Error('TEST API/Sheet preflight failed');
}
async function main() {
  const url = new URL(endpoint);
  url.searchParams.set('action', 'getDayRecord');
  url.searchParams.set('studentId', 'test_student_a');
  url.searchParams.set('dayId', 'day01');
  const record = await (await fetch(url)).json();
  assert.equal(record.ok, true);
  const asset = record.data.assets.find(a => a.assetType === 'video');
  assert.equal(asset.mimeType, 'video/webm');
  const fileId = asset.storageFileId;
  assert.match(fileId, /^[A-Za-z0-9_-]{10,200}$/);
  const response = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`,
    { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3');
  assert.ok(bytes.length > 1000);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('about:blank');
    const playback = await page.evaluate(async data => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      document.body.appendChild(video);
      video.src = `data:video/webm;base64,${data}`;
      await Promise.race([video.play(), new Promise((_, reject) => setTimeout(() => reject(Error('play timeout')), 10000))]);
      await new Promise((resolve, reject) => {
        const start = Date.now();
        const timer = setInterval(() => {
          if (video.currentTime > 0.2) { clearInterval(timer); resolve(); }
          else if (Date.now() - start > 10000) { clearInterval(timer); reject(Error('time did not advance')); }
        }, 100);
      });
      return { width: video.videoWidth, duration: video.duration, time: video.currentTime };
    }, bytes.toString('base64'));
    assert.ok(playback.width > 0 && playback.duration > 0 && playback.time > 0.2);
    process.stdout.write(`V05: PASS actual TEST Drive WebM downloaded, Chromium decoded and playback advanced (${bytes.length} bytes)\n`);
  } finally { await browser.close(); }
}
main().catch(error => { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; });
