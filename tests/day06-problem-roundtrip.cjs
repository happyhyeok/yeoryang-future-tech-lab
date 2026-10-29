// Mutates synthetic TEST A only, backs up its records outside Git, and restores them.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.IMAGE_PREVIEW_URL || '';
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/[a-z0-9-]+\.yeoryang-image-e2e-test-20261025\.pages\.dev$/.test(base) ||
    !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
    !process.env.IMAGE_TEST_SHEET_ID || !process.env.IMAGE_PRODUCTION_SHEET_ID ||
    process.env.IMAGE_TEST_SHEET_ID === process.env.IMAGE_PRODUCTION_SHEET_ID ||
    !process.env.DAY06_PRIVATE_BACKUP_DIR) throw Error('Isolated TEST preflight/backup path missing');

async function api(action, payload, params) {
  const url = new URL(endpoint);
  let response;
  if (params) {
    url.searchParams.set('action', action);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } else {
    response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }), signal: AbortSignal.timeout(60000) });
  }
  const result = await response.json();
  assert.equal(result.ok, true, `${action}: ${result.error?.code || 'unknown'}`);
  return result.data;
}
const read = (studentId, dayId) => api('getDayRecord', null, { studentId, dayId });
function payloadFromRecord(record) {
  const keys = ['studentId','workId','dayId','blockProgress','role','activities','todayDecision',
    'discovery','difficulty','changeMade','changeReason','nextAction','personalEvidenceRefs',
    'commonEvidenceRefs','minimumCompleted','completionLevel','status','studentReflection'];
  const out = Object.fromEntries(keys.map(k => [k, record[k]]));
  out.dayState = record.dayStateJson;
  return out;
}
async function enter(page, day) {
  await page.goto(`${base}/?day=${day}`);
  const choose = page.getByRole('button', { name: /테스트 A/ });
  if (await choose.isVisible()) {
    await choose.click();
    await page.getByRole('button', { name: /내 연구소 들어가기/ }).click();
  }
  await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
}
async function openDay06Step2(page) {
  const details = page.locator('#day06-step-2 > details');
  if (!(await details.evaluate(n => n.open))) await details.locator(':scope > summary').click();
}
async function goDay05(page) {
  await page.locator('[data-day06-problem-edit] a').click();
  await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
  await page.locator('[data-day05-definition="problemDefinition"]').waitFor();
}
async function returnDay06(page) {
  await page.locator('[data-day06-return-from-day05]').click();
  await page.waitForURL(/\?day=6/,{ timeout: 90000 });
  await page.getByRole('button', { name: /오늘 연구 시작/ }).click();
}
async function confirmReload(page) {
  await openDay06Step2(page);
  const reload = page.locator('[data-day06-reload-problem]');
  if (await reload.isVisible()) await reload.click();
  try {
    await page.waitForFunction(() => !document.querySelector('[data-day06-problem-decision="keep"]')?.disabled,
      null, { timeout: 12000 });
  } catch (e) {
    const state = await page.evaluate(() => ({
      reloadMessage: document.querySelector('[data-day06-problem-reload-message]')?.textContent,
      refreshStatus: document.querySelector('[data-day06-record-refresh-status]')?.textContent,
      previous: document.querySelector('[data-day06-previous-record]')?.textContent?.slice(0, 250),
      reloadVisible: !document.querySelector('[data-day06-reload-problem]')?.hidden,
      editDisabled: document.querySelector('[data-day06-problem-decision="edit"]')?.disabled,
    }));
    const server05 = (await read('test_student_a','day05')).dayRecord;
    const server06 = (await read('test_student_a','day06')).dayRecord;
    throw Error(`Day06 problem reload did not release edit lock: ${JSON.stringify({
      ...state, day05Saved: server05.dayStateJson.problemDefinition,
      day06NeedsReload: server06.dayStateJson.day06NeedsReload,
      day06Decision: server06.dayStateJson.day06ProblemDecision,
      baselineEqualsCurrent: server06.dayStateJson.day06ProblemEditBaseline === server06.dayStateJson.day06ProblemKey,
      baselineLength: server06.dayStateJson.day06ProblemEditBaseline?.length,
      keyLength: server06.dayStateJson.day06ProblemKey?.length,
    })}`);
  }
}
async function main() {
  const originals = {};
  for (const studentId of ['test_student_a', 'test_student_b']) {
    for (const dayId of ['day05', 'day06']) originals[`${studentId}:${dayId}`] = (await read(studentId, dayId)).dayRecord;
  }
  assert.ok(originals['test_student_a:day05']?.dayStateJson?.problemDefinition);
  assert.ok(originals['test_student_a:day06']?.personalEvidenceRefs?.includes('asset_test_student_a_day06_image'));
  assert.ok(originals['test_student_a:day06']?.dayStateJson?.day06Ideas?.[0]);
  const backupDir = path.resolve(process.env.DAY06_PRIVATE_BACKUP_DIR);
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `test-day05-day06-records-${Date.now()}.json`);
  if (fs.existsSync(backupPath)) throw Error('Backup exists; refuse overwrite');
  fs.writeFileSync(backupPath, JSON.stringify(originals, null, 2), { flag: 'wx' });
  process.stdout.write('R00: PASS TEST A/B Day05/06 backup saved outside Git\n');
  const browser = await chromium.launch({ headless: true });
  let mutated = false;
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await enter(page, 6);
    const originalProblem = originals['test_student_a:day05'].dayStateJson.problemDefinition;
    await page.waitForFunction(p => document.querySelector('[data-day06-previous-record]')?.textContent?.includes(p), originalProblem, { timeout: 30000 });
    process.stdout.write('R01: PASS original TEST Day05 problem displayed in Day06\n');
    await openDay06Step2(page);
    await page.locator('[data-day06-problem-decision="edit"]').click();
    assert.equal(await page.locator('[data-day06-problem-edit]').isVisible(), true);
    await goDay05(page);
    await page.waitForFunction(p => document.querySelector('[data-day05-definition="problemDefinition"]')?.value === p,
      originalProblem, { timeout: 30000 });
    assert.equal(await page.locator('[data-day05-definition="problemDefinition"]').inputValue(), originalProblem);
    process.stdout.write('R02: PASS edit link opens existing TEST Day05 problem\n');
    const edited = 'TEST A: 어두운 책상에서 책을 읽는 사람이 글씨를 보기 어려워요.';
    await page.locator('[data-day05-definition="problemDefinition"]').fill(edited);
    mutated = true;
    await returnDay06(page);
    await page.waitForFunction(p => document.querySelector('[data-day06-previous-record]')?.textContent?.includes(p), edited, { timeout: 30000 });
    await confirmReload(page);
    assert.equal((await read('test_student_a','day05')).dayRecord.dayStateJson.problemDefinition, edited);
    await page.reload();
    await page.waitForFunction(p => document.querySelector('[data-day06-previous-record]')?.textContent?.includes(p), edited, { timeout: 30000 });
    await confirmReload(page);
    process.stdout.write('R03-R05: PASS Day05 edit saved; Day06 round trip and refresh restored\n');
    await openDay06Step2(page);
    if (!(await page.locator('[data-day06-problem-edit]').isVisible()))
      await page.locator('[data-day06-problem-decision="edit"]').click();
    await page.locator('[data-day06-cancel-problem-edit]').click();
    assert.equal((await read('test_student_a','day05')).dayRecord.dayStateJson.problemDefinition, edited);
    process.stdout.write('R06: PASS cancel retains last saved Day05 problem\n');
    await page.locator('[data-day06-problem-decision="replace"]').click();
    await goDay05(page);
    const replacement = 'TEST A: 복도에서 이동하는 사람이 어두운 곳을 알아채기 어려워요.';
    await page.locator('[data-day05-definition="targetUser"]').fill('복도에서 이동하는 사람');
    await page.locator('[data-day05-definition="situation"]').fill('복도가 어두울 때');
    await page.locator('[data-day05-definition="inconvenience"]').fill('앞을 보기 어렵다');
    await page.locator('[data-day05-definition="problemDefinition"]').fill(replacement);
    await returnDay06(page);
    await page.waitForFunction(p => document.querySelector('[data-day06-previous-record]')?.textContent?.includes(p), replacement, { timeout: 30000 });
    await confirmReload(page);
    const afterReplace = (await read('test_student_a','day06')).dayRecord;
    assert.ok(afterReplace.personalEvidenceRefs.includes('asset_test_student_a_day06_image'));
    assert.ok(JSON.stringify(afterReplace.dayStateJson).includes('어두워지면 LED로 알려 주기'));
    await page.reload();
    await page.waitForFunction(p => document.querySelector('[data-day06-previous-record]')?.textContent?.includes(p), replacement, { timeout: 30000 });
    await confirmReload(page);
    assert.equal((await read('test_student_a','day05')).dayRecord.dayStateJson.problemDefinition, replacement);
    process.stdout.write('R07-R10: PASS replacement, refresh, archived Day06 idea and image ref retained\n');
    await openDay06Step2(page);
    await page.locator('[data-day06-problem-decision="edit"]').click();
    await goDay05(page);
    let blocked = 0;
    await page.route('https://script.google.com/macros/s/**/exec', async route => {
      let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (_) {}
      if (body.action === 'saveDayRecord') { blocked++; return route.abort('failed'); }
      return route.continue();
    });
    const failedDraft = 'TEST A: 저장 실패 상황의 임시 문제 문장';
    await page.locator('[data-day05-definition="problemDefinition"]').fill(failedDraft);
    await page.locator('[data-day06-return-from-day05]').click();
    await page.waitForFunction(() => Array.from(document.querySelectorAll('[data-save-state]'))
      .some(node => node.textContent?.includes('저장하지 못')), null, { timeout: 30000 });
    assert.ok(blocked > 0);
    assert.equal((await read('test_student_a','day05')).dayRecord.dayStateJson.problemDefinition, replacement);
    await page.screenshot({ path: path.join(__dirname, '../verification/final-screenshots/390x844-day06-problem-save-failed.png'), fullPage: true });
    await page.unroute('https://script.google.com/macros/s/**/exec');
    await returnDay06(page);
    await page.waitForFunction(p => document.querySelector('[data-day06-previous-record]')?.textContent?.includes(p), failedDraft, { timeout: 30000 });
    process.stdout.write('R11: PASS failed save kept prior server problem, retry succeeded\n');
    const bNow = (await read('test_student_b','day06')).dayRecord;
    assert.equal(bNow.updatedAt, originals['test_student_b:day06'].updatedAt);
    assert.equal(bNow.dayStateJson.day06Ideas[0], originals['test_student_b:day06'].dayStateJson.day06Ideas[0]);
    process.stdout.write('R12: PASS TEST B Day06 unchanged\n');
    await page.screenshot({ path: path.join(__dirname, '../verification/final-screenshots/390x844-day06-problem-roundtrip.png'), fullPage: true });
  } finally {
    await browser.close();
    if (mutated) {
      for (const dayId of ['day05','day06']) {
        const original = originals[`test_student_a:${dayId}`];
        await api('saveDayRecord', payloadFromRecord(original));
      }
      const restored05 = (await read('test_student_a','day05')).dayRecord;
      const restored06 = (await read('test_student_a','day06')).dayRecord;
      assert.equal(restored05.dayStateJson.problemDefinition, originals['test_student_a:day05'].dayStateJson.problemDefinition);
      assert.equal(restored06.dayStateJson.day06Ideas[0], originals['test_student_a:day06'].dayStateJson.day06Ideas[0]);
      assert.deepEqual(restored06.personalEvidenceRefs, originals['test_student_a:day06'].personalEvidenceRefs);
      process.stdout.write('R13: PASS TEST A Day05/06 original contents restored after audit\n');
    }
  }
}
main().catch(e => { process.stderr.write(`FAIL: ${e.stack || e.message}\n`); process.exitCode = 1; });
