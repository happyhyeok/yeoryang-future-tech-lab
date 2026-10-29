const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.IMAGE_PREVIEW_URL || '';
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/[a-z0-9-]+\.yeoryang-image-e2e-test-20261025\.pages\.dev$/.test(base) ||
    !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
    !process.env.IMAGE_TEST_SHEET_ID || !process.env.IMAGE_PRODUCTION_SHEET_ID ||
    process.env.IMAGE_TEST_SHEET_ID === process.env.IMAGE_PRODUCTION_SHEET_ID) throw Error('TEST preflight failed');
async function record() {
  const url = new URL(endpoint);
  for (const [k, v] of Object.entries({ action: 'getDayRecord', studentId: 'test_student_a', dayId: 'day07' })) url.searchParams.set(k, v);
  const r = await (await fetch(url, { signal: AbortSignal.timeout(30000) })).json();
  assert.equal(r.ok, true);
  return r.data.dayRecord;
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${base}/?day=7`);
    await page.getByRole('button', { name: /테스트 A/ }).click();
    await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
    await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
    await page.waitForFunction(() => document.querySelector('.day07')?.textContent?.includes('어두워지면 LED로 알려 주기'), null, { timeout: 30000 });
    for (const n of [3, 4, 6]) {
      const step = page.locator(`#day07-step-${n} > details`);
      if (!(await step.evaluate(x => x.open))) await step.locator(':scope > summary').click();
    }
    await page.locator('[data-day07-field="direction"]').selectOption({ index: 1 });
    await page.locator('[data-day07-field="person"]').fill('책을 읽는 사람');
    await page.locator('[data-day07-field="problem"]').fill('어두우면 글씨를 읽기 어렵다');
    await page.locator('[data-day07-field="device"]').fill('밝기 알림 장치');
    await page.locator('[data-day07-field="reason"]').selectOption({ index: 1 });
    await page.locator('[data-day07-field="input"]').selectOption({ index: 3 });
    await page.locator('[data-day07-field="condition"]').fill('주변이 어두울 때');
    await page.locator('[data-day07-field="output"]').selectOption({ index: 1 });
    await page.locator('[data-day07-field="firstGoal"]').fill('LED 한 개 켜 보기');
    await page.locator('[data-day07-field="successTest"]').fill('어두울 때 LED가 켜지면 성공');
    for (const [id, prefix] of [['day07-q1', '①'], ['day07-q2', '②'], ['day07-q3', '②']]) {
      await page.locator(`[data-day07-quiz="${id}"][value^="${prefix}"]`).check();
    }
    const details = page.locator('#day07-step-5 > details');
    if (!(await details.evaluate(n => n.open))) await details.locator(':scope > summary').click();
    await page.locator('[data-day07-field="part"]').selectOption({ index: 1 });
    await page.locator('[data-day07-field="peerQuestion"]').fill('센서는 어디에 있나요?');
    await page.locator('[data-day07-field="peerDecision"]').selectOption({ index: 1 });
    await page.locator('[data-day07-field="peerReason"]').fill('센서를 화분 가까이에 두면 값이 정확해요.');
    await page.waitForFunction(() => document.querySelector('[data-day07-next-access] a') &&
      document.querySelector('[data-day07-field="peerReason"]')?.value.includes('정확해요'), null, { timeout: 90000 });
    let saved;
    for (let i = 0; i < 15; i++) {
      saved = await record();
      if (saved.dayStateJson.day07BasicReady && saved.dayStateJson.day07.peerReason.includes('정확해요')) break;
      await page.waitForTimeout(1000);
    }
    assert.equal(saved.dayStateJson.day07BasicReady, true);
    assert.equal(saved.status, 'completed');
    assert.ok(saved.personalEvidenceRefs.includes('asset_test_student_a_day07_image'));
    await page.reload();
    await page.waitForFunction(() => document.querySelector('[data-day07-field="peerReason"]')?.value.includes('정확해요'), null, { timeout: 30000 });
    process.stdout.write('D07-08/13/14: PASS extended condition, server save, image ref and refresh\n');
  } finally { await browser.close(); }
})().catch(e => { process.stderr.write(`FAIL: ${e.stack || e.message}\n`); process.exitCode = 1; });
