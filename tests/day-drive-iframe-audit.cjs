// Read-only: test the actual Google Drive embedded player, separate from raw WebM playback.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.IMAGE_PREVIEW_URL || '';
if (!/^https:\/\/[a-z0-9-]+\.yeoryang-image-e2e-test-20261025\.pages\.dev$/.test(base)) {
  throw Error('Isolated TEST Preview required');
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${base}/?day=1`);
    await page.getByRole('button', { name: /테스트 A/ }).click();
    await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
    await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
    const iframe = page.locator('[data-drive-video-preview]');
    await iframe.waitFor({ state: 'visible', timeout: 30000 });
    const url = await iframe.getAttribute('src');
    if (!/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/preview$/.test(url || '')) throw Error('Unexpected iframe URL');
    await page.screenshot({ path: path.join(__dirname, '../verification/final-screenshots/1280x800-drive-iframe-before-click.png'), fullPage: true });
    const frame = page.frameLocator('[data-drive-video-preview]');
    const player = frame.locator('video');
    const playerFound = await player.waitFor({ state: 'attached', timeout: 30000 }).then(() => true, () => false);
    if (!playerFound) {
      const text = await frame.locator('body').innerText({ timeout: 10000 }).catch(() => 'FRAME_BODY_UNAVAILABLE');
      const playButton = frame.getByRole('button', { name: /재생|play/i });
      const count = await playButton.count();
      let clickResult = 'NO_BUTTON';
      if (count) {
        try { await playButton.first().click({ timeout: 10000 }); clickResult = 'CLICKED'; }
        catch (e) { clickResult = `CLICK_FAILED:${e.name}`; }
      }
      await page.waitForTimeout(4000);
      const afterText = await frame.locator('body').innerText({ timeout: 10000 }).catch(() => 'FRAME_BODY_UNAVAILABLE');
      const pauseButton = frame.getByRole('button', { name: /일시정지|pause/i });
      const pauseVisible = (await pauseButton.count()) > 0;
      if (pauseVisible) await pauseButton.first().click({ timeout: 10000 }).catch(() => {});
      await page.screenshot({ path: path.join(__dirname, '../verification/final-screenshots/1280x800-drive-iframe-after-click.png'), fullPage: true });
      const result = { iframeLoaded: true, playerFound: false, beforeText: text.slice(0, 500),
        clickResult, afterText: afterText.slice(0, 500), pauseVisible };
      fs.writeFileSync(path.join(__dirname, '../verification/day-drive-iframe-audit.json'), JSON.stringify(result, null, 2));
      process.stdout.write(`Drive iframe: ${pauseVisible ? 'PARTIAL' : 'MANUAL_REQUIRED'}; no accessible video element; ${clickResult}; pauseVisible=${pauseVisible}; message=${JSON.stringify(result.afterText)}\n`);
      return;
    }
    const before = await player.evaluate(v => ({ readyState: v.readyState, currentTime: v.currentTime,
      duration: v.duration, paused: v.paused, hasSource: Boolean(v.currentSrc || v.src), error: v.error?.code || null }));
    const buttons = await frame.locator('button').evaluateAll(items => items.map(b => ({
      label: b.getAttribute('aria-label') || b.title || b.textContent?.trim() || '', visible: b.getClientRects().length > 0,
    })).filter(x => x.visible).slice(0, 20));
    const play = frame.getByRole('button', { name: /재생|play/i });
    let clickResult = 'NO_ACCESSIBLE_PLAY_BUTTON';
    if (await play.count()) {
      try { await play.first().click({ timeout: 10000 }); clickResult = 'CLICKED'; }
      catch (e) { clickResult = `CLICK_FAILED:${e.name}`; }
    } else {
      try { await player.click({ timeout: 10000 }); clickResult = 'VIDEO_CLICKED'; }
      catch (e) { clickResult = `VIDEO_CLICK_FAILED:${e.name}`; }
    }
    await page.waitForTimeout(4000);
    const after = await player.evaluate(v => ({ readyState: v.readyState, currentTime: v.currentTime,
      duration: v.duration, paused: v.paused, hasSource: Boolean(v.currentSrc || v.src), error: v.error?.code || null }));
    await page.screenshot({ path: path.join(__dirname, '../verification/final-screenshots/1280x800-drive-iframe-after-click.png'), fullPage: true });
    const result = { iframeLoaded: true, before, buttons, clickResult, after,
      playbackAdvanced: after.currentTime > before.currentTime + 0.2 };
    fs.writeFileSync(path.join(__dirname, '../verification/day-drive-iframe-audit.json'), JSON.stringify(result, null, 2));
    process.stdout.write(`Drive iframe: ${result.playbackAdvanced ? 'PASS' : 'MANUAL_REQUIRED'}; ${clickResult}; source=${after.hasSource}; time=${after.currentTime}\n`);
  } finally { await browser.close(); }
})().catch(e => { process.stderr.write(`FAIL: ${e.stack || e.message}\n`); process.exitCode = 1; });
