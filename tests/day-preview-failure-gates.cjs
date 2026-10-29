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
const output = path.resolve(__dirname, '../verification/final-screenshots');
async function api(action, payload, params) {
  const url = new URL(endpoint);
  let response;
  if (params) {
    url.searchParams.set('action', action);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } else {
    response = await fetch(url, { method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }), signal: AbortSignal.timeout(60000) });
  }
  const result = await response.json();
  assert.equal(result.ok, true, `${action}: ${result.error?.code || ''}`);
  return result.data;
}
async function openStep(page, n) {
  const details = page.locator(`#day07-step-${n} > details`);
  if (!(await details.evaluate(node => node.open))) await details.locator('summary').click();
}
async function main() {
  const aBefore = (await api('getDayRecord', null, { studentId: 'test_student_a', dayId: 'day07' })).dayRecord;
  await api('saveDayRecord', { studentId: 'test_student_b', workId: 'test_work_b', dayId: 'day07',
    blockProgress: {}, activities: [], personalEvidenceRefs: [], commonEvidenceRefs: [],
    minimumCompleted: false, completionLevel: '', status: 'in_progress',
    dayState: { dayCompleted: false, quizAnswers: {}, day07: {} } });
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
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
    await page.goto(`${base}/?day=7`);
    await page.getByRole('button', { name: /테스트 B/ }).click();
    await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
    await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
    await openStep(page, 3);
    await page.locator('[data-day07-field="direction"]').selectOption({ index: 1 });
    await page.locator('[data-day07-field="person"]').fill('화분을 돌보는 사람');
    await page.locator('[data-day07-field="problem"]').fill('흙이 마른 때를 놓친다');
    await page.locator('[data-day07-field="device"]').fill('TEST B 흙 상태 알림');
    await page.locator('[data-day07-field="reason"]').selectOption({ index: 1 });
    await openStep(page, 4);
    await page.locator('[data-day07-field="input"]').selectOption({ index: 1 });
    await page.locator('[data-day07-field="condition"]').fill('흙이 마르면');
    await page.locator('[data-day07-field="output"]').selectOption({ index: 1 });
    await openStep(page, 6);
    await page.locator('[data-day07-field="firstGoal"]').fill('센서 값 읽기');
    await page.locator('[data-day07-field="successTest"]').fill('흙이 마르면 LED 켜짐');
    for (const [id, prefix] of [['day07-q1', '①'], ['day07-q2', '②'], ['day07-q3', '②']]) {
      await page.locator(`[data-day07-quiz="${id}"][value^="${prefix}"]`).check();
    }
    await page.waitForFunction(() => document.querySelector('[data-day07-progress]')?.textContent?.includes('저장이 끝나면'), null, { timeout: 10000 });
    assert.equal(await page.locator('[data-day07-next-access] a').count(), 0);
    await page.waitForFunction(() => document.querySelector('[data-save-status]')?.textContent?.includes('저장하지 못'), null, { timeout: 25000 }).catch(() => {});
    assert.ok(blocked > 0);
    await page.screenshot({ path: path.join(output, '390x844-day07-server-failure-gate.png'), fullPage: true });
    const bUnsaved = (await api('getDayRecord', null, { studentId: 'test_student_b', dayId: 'day07' })).dayRecord;
    assert.notEqual(bUnsaved.dayStateJson.day07?.device, 'TEST B 흙 상태 알림');
    await page.goto(`${base}/?day=8`);
    await page.getByText('다음 연구는 아직 잠겨 있어요').waitFor({ timeout: 30000 });
    process.stdout.write('D07-10/11 P12/P15: PASS completed local plan with failed save cannot open Day08\n');
    await page.unroute('https://script.google.com/macros/s/**/exec');
    await page.goto(`${base}/?day=7`);
    await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
    await openStep(page, 4);
    await page.locator('[data-day07-field="condition"]').fill('흙이 말랐을 때');
    await page.locator('[data-day07-next-access] a').waitFor({ state: 'attached', timeout: 90000 });
    const bSaved = (await api('getDayRecord', null, { studentId: 'test_student_b', dayId: 'day07' })).dayRecord;
    assert.equal(bSaved.dayStateJson.day07.device, 'TEST B 흙 상태 알림');
    assert.equal(bSaved.status, 'completed');
    assert.ok(bSaved.personalEvidenceRefs.includes('asset_test_student_b_day07_image'));
    const aAfter = (await api('getDayRecord', null, { studentId: 'test_student_a', dayId: 'day07' })).dayRecord;
    assert.equal(aAfter.dayStateJson.day07.device, aBefore.dayStateJson.day07.device);
    await openStep(page, 6);
    await page.screenshot({ path: path.join(output, '390x844-day07-retry-and-B-separate.png'), fullPage: true });
    process.stdout.write('D07-12/15 P14/P15: PASS retry saved TEST B, image ref retained, TEST A untouched\n');
  } finally { await browser.close(); }
}
main().catch(error => { process.stderr.write(`FAIL: ${error.stack || error.message}\n`); process.exitCode = 1; });
