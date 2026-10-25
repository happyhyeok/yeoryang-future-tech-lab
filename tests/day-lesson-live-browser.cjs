// Real Chromium against the isolated HTTPS TEST Pages Preview and TEST Apps Script.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.IMAGE_PREVIEW_URL || '';
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/[a-z0-9-]+\.yeoryang-image-e2e-test-20261025\.pages\.dev$/.test(base) ||
    !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
    !process.env.IMAGE_TEST_SHEET_ID || !process.env.IMAGE_PRODUCTION_SHEET_ID ||
    process.env.IMAGE_TEST_SHEET_ID === process.env.IMAGE_PRODUCTION_SHEET_ID) {
  throw Error('Isolated TEST Preview/API/Sheet preflight failed');
}
const output = path.resolve(__dirname, '../verification/final-screenshots');
fs.mkdirSync(output, { recursive: true });
async function read(studentId, dayId) {
  const url = new URL(endpoint);
  url.searchParams.set('action', 'getDayRecord');
  url.searchParams.set('studentId', studentId);
  url.searchParams.set('dayId', dayId);
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const data = await response.json();
  assert.equal(data.ok, true, `getDayRecord ${dayId}`);
  return data.data;
}
async function resetLesson(dayId) {
  const response = await fetch(endpoint, { method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'saveDayRecord', payload: {
      studentId: 'test_student_a', workId: 'test_work_a', dayId,
      blockProgress: {}, activities: [], personalEvidenceRefs: [], commonEvidenceRefs: [],
      minimumCompleted: false, completionLevel: '', status: 'in_progress',
      dayState: { dayCompleted: false, quizAnswers: {}, day07: {} },
    } }), signal: AbortSignal.timeout(60000) });
  const data = await response.json();
  assert.equal(data.ok, true, `${dayId} TEST reset`);
  assert.ok(data.data.dayRecord.personalEvidenceRefs.includes(`asset_test_student_a_${dayId}_image`));
}
async function enter(page, day, name = '테스트 A') {
  await page.goto(`${base}/?day=${day}`);
  await page.getByRole('button', { name: new RegExp(name) }).click();
  await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
  await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
}
async function openStep(page, selector) {
  const details = page.locator(selector).locator('details').first();
  if (!(await details.evaluate(node => node.open))) await details.locator('summary').first().click();
}
async function day06(page, size) {
  await enter(page, 6);
  await page.waitForFunction(() => document.querySelector('[data-day06-previous-record]')?.textContent?.includes('테스트 A:'), null, { timeout: 30000 });
  assert.match(await page.locator('[data-day06-previous-record]').innerText(), /책상 주변이 어두워/);
  await openStep(page, '#day06-step-2');
  await page.locator('[data-day06-problem-decision="edit"]').click();
  assert.equal(await page.locator('[data-day06-problem-edit]').isVisible(), true);
  await page.locator('[data-day06-cancel-problem-edit]').click();
  await page.locator('[data-day06-problem-decision="keep"]').click();
  await openStep(page, '#day06-step-3');
  await page.locator('#day06-idea-1').fill('어두워지면 LED로 알려 주기');
  await page.locator('#day06-idea-2').fill('버튼을 눌러 밝기 확인하기');
  assert.equal(await page.locator('[data-day06-next="4"]').isEnabled(), true);
  await openStep(page, '#day06-step-4');
  for (const i of [0, 1]) for (const criterion of ['help', 'possible']) {
    await page.locator(`[data-day06-comparison="${i}:${criterion}"]`).first().check();
  }
  assert.equal(await page.locator('[data-day06-next="5"]').isEnabled(), true);
  await openStep(page, '#day06-step-5');
  await page.locator('[data-day06-final-choices] input[value="idea1"]').check();
  await page.locator('[data-day06-reason]').fill('책을 읽는 사람이 어두움을 바로 알 수 있고 LED부터 시험할 수 있어요.');
  await page.locator('[data-day06-next-question]').fill('어느 밝기에서 LED가 켜져야 할까요?');
  const quiz = page.locator('#today-quiz [data-day01-quiz-id]');
  assert.equal(await quiz.count(), 4);
  await quiz.first().locator('[data-correct="false"]').first().click();
  assert.equal(await quiz.first().locator('[data-correct="false"]').first().getAttribute('aria-pressed'), 'true');
  for (let i = 0; i < 4; i++) await quiz.nth(i).locator('[data-correct="true"]').click();
  await page.locator('[data-day06-save]').click();
  try {
    await page.waitForFunction(() => document.querySelector('[data-day06-save-status]')?.textContent?.includes('저장되었습니다'), null, { timeout: 40000 });
  } catch (error) {
    const status = await page.locator('[data-day06-save-status]').innerText();
    throw Error(`Day06 save UI: ${status || '(empty)'}; ${error.message}`);
  }
  let record = (await read('test_student_a', 'day06')).dayRecord;
  assert.equal(record.dayStateJson.day06Ideas[0], '어두워지면 LED로 알려 주기');
  assert.equal(record.dayStateJson.day06Ideas[1], '버튼을 눌러 밝기 확인하기');
  assert.equal(record.dayStateJson.day06SelectedIdea, 'idea1');
  assert.equal(record.minimumCompleted, true);
  assert.equal(record.completionLevel, 'minimum');
  await openStep(page, '#day06-step-3');
  await page.locator('#day06-idea-3').fill('사람이 직접 조명을 조절하기');
  await openStep(page, '#day06-step-4');
  for (const criterion of ['help', 'possible']) {
    await page.locator(`[data-day06-comparison="2:${criterion}"]`).first().check();
  }
  await page.locator('[data-day06-save]').click();
  await page.waitForFunction(() => document.querySelector('[data-day06-save-status]')?.textContent?.includes('저장되었습니다'), null, { timeout: 90000 });
  record = (await read('test_student_a', 'day06')).dayRecord;
  assert.equal(record.dayStateJson.day06Ideas[2], '사람이 직접 조명을 조절하기');
  assert.equal(record.completionLevel, 'basic');
  assert.ok(record.personalEvidenceRefs.includes('asset_test_student_a_day06_image'));
  await page.screenshot({ path: path.join(output, `${size}-day06-complete.png`), fullPage: true });
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#day06-idea-1')?.value === '어두워지면 LED로 알려 주기', null, { timeout: 30000 });
  assert.equal(await page.locator('[data-day06-reason]').inputValue(), '책을 읽는 사람이 어두움을 바로 알 수 있고 LED부터 시험할 수 있어요.');
  process.stdout.write(`${size} D06 core: PASS previous record, edit/cancel, minimum with 2 ideas, basic with 3, quiz, save, image ref, reload\n`);
}
async function day07(page, size) {
  await enter(page, 7);
  await page.waitForFunction(() => document.querySelector('.day07')?.textContent?.includes('어두워지면 LED로 알려 주기'), null, { timeout: 30000 });
  assert.equal(await page.locator('[data-day07-next-access] a').count(), 0);
  await openStep(page, '#day07-step-2');
  const sensor = page.locator('[data-day07-card="light"]');
  await sensor.locator('details summary').click();
  await sensor.locator('[data-day07-sensor]').fill('10');
  assert.match(await sensor.locator('.day07-sensor-readout').innerText(), /입력:/);
  await openStep(page, '#day07-step-3');
  await page.locator('[data-day07-field="direction"]').selectOption({ index: 1 });
  await page.locator('[data-day07-field="person"]').fill('책을 읽는 사람');
  await page.locator('[data-day07-field="problem"]').fill('어두우면 글씨를 읽기 어렵다');
  await page.locator('[data-day07-field="device"]').fill('밝기 알림 장치');
  await page.locator('[data-day07-field="reason"]').selectOption({ index: 1 });
  await openStep(page, '#day07-step-4');
  await page.locator('[data-day07-field="input"]').selectOption({ index: 3 });
  await page.locator('[data-day07-field="condition"]').fill('주변이 어두울 때');
  await page.locator('[data-day07-field="output"]').selectOption({ index: 1 });
  await openStep(page, '#day07-step-6');
  await page.locator('[data-day07-field="firstGoal"]').fill('LED 한 개 켜 보기');
  await page.locator('[data-day07-field="successTest"]').fill('어두울 때 LED가 켜지면 성공');
  const quiz = page.locator('[data-day07-quiz]');
  assert.equal(await quiz.count(), 9);
  await quiz.first().check();
  assert.match(await page.locator('[data-day07-quiz-feedback="day07-q1"]').innerText(), /맞아요/);
  for (const id of ['day07-q2', 'day07-q3']) {
    await page.locator(`[data-day07-quiz="${id}"][value^="②"]`).check();
  }
  await page.waitForFunction(() => Boolean(document.querySelector('[data-day07-next-access] a')), null, { timeout: 90000 });
  const record = (await read('test_student_a', 'day07')).dayRecord;
  assert.equal(record.dayStateJson.day07.device, '밝기 알림 장치');
  assert.equal(record.dayStateJson.dayCompleted, true);
  assert.equal(record.status, 'completed');
  assert.ok(record.personalEvidenceRefs.includes('asset_test_student_a_day07_image'));
  await page.screenshot({ path: path.join(output, `${size}-day07-complete.png`), fullPage: true });
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-day07-field="device"]')?.value === '밝기 알림 장치', null, { timeout: 30000 });
  try { await page.locator('[data-day07-next-access] a').waitFor({ state: 'attached', timeout: 30000 }); }
  catch (error) {
    const access = await page.locator('[data-day07-next-access]').innerText();
    throw Error(`Day07 saved record restored but Day08 gate closed: ${access}; ${error.message}`);
  }
  await openStep(page, '#day07-step-6');
  assert.equal(await page.locator('[data-day07-next-access] a').isVisible(), true);
  process.stdout.write(`${size} D07 core: PASS Day06 handoff, sensor, plan, quiz, server gate, image ref, reload\n`);
}
async function main() {
  const config = await (await fetch(`${base}/runtime-config.js`)).text();
  assert.ok(config.includes(endpoint) && config.includes('test_student_a') && config.includes('test_student_b'));
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 650, height: 900 }, { width: 1440, height: 900 }]) {
      const size = `${viewport.width}x${viewport.height}`;
      await resetLesson('day06');
      await resetLesson('day07');
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.on('console', message => { if (message.type() === 'error') process.stdout.write(`browser console: ${message.text().slice(0, 240)}\n`); });
      page.on('response', async response => {
        if (response.url().includes('script.googleusercontent.com')) {
          try {
            const body = await response.json();
            if (!body.ok) process.stdout.write(`Apps Script response: ${body.error?.code || 'FAIL'} ${body.error?.message || ''}\n`);
          } catch (_) {}
        }
      });
      await day06(page, size);
      const fresh = await context.newPage();
      await day07(fresh, size);
      for (const p of [page, fresh]) {
        assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${size} overflow`);
      }
      await context.close();
    }
  } finally { await browser.close(); }
}
main().catch(error => { process.stderr.write(`FAIL: ${error.stack || error.message}\n`); process.exitCode = 1; });
