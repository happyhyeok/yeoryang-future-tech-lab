// Local integration only: real browser + HTTP + repository DayRecord service.
// Spreadsheet storage and Apps Script platform services are test doubles.
// Run: PLAYWRIGHT_MODULE=/path/to/playwright node tests/day08-browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const tables = new Map();
const rows = name => {
  if (!tables.has(name)) tables.set(name, []);
  return tables.get(name);
};
const students = Array.from({ length: 5 }, (_, i) => ({
  studentId: 'fixture0' + (i + 1), studentName: '테스트' + (i + 1),
  workId: 'work_fixture0' + (i + 1), active: true,
}));
rows('01_학생').push(...students);
rows('02_작품').push(...students.map(s => ({ ...s })));
rows('03_연구일').push(...['day07', 'day08'].map(dayId => ({ dayId, active: true })));
const writes = [];
const context = vm.createContext({
  console,
  Utilities: { formatDate: (d, zone, format) => d.toISOString().slice(0, format === 'yyyy-MM-dd' ? 10 : 19) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  SpreadsheetApp: { flush() {} },
  findRowByColumn_: (table, key, value) => ({
    rowObject: rows(table).find(r => r[key] === value) || null,
  }),
  upsertById_: (table, key, value, row) => {
    const data = JSON.parse(JSON.stringify(row));
    const index = rows(table).findIndex(r => r[key] === value);
    if (index < 0) rows(table).push(data); else rows(table)[index] = data;
    writes.push({ studentId: row.studentId, dayId: row.dayId });
    return data;
  },
  getExistingCreatedAt_: (row, now) => row?.createdAt || now,
});
for (const file of ['Config.gs', 'Utils.gs', 'Validation.gs', 'DayRecordService.gs']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'apps-script', file), 'utf8'), context);
}
const plan = id => Object.fromEntries(
  ['person', 'problem', 'device', 'input', 'condition', 'output', 'firstGoal', 'successTest']
    .map(key => [key, id + '-' + key])
);
const saveFixture = (s, dayId, fields) => context.saveDayRecord_({
  ...s, dayId, blockProgress: {}, minimumCompleted: false,
  completionLevel: '', status: 'in_progress',
  dayState: { studentId: s.studentId, workId: s.workId, dayId, localRevision: 1, ...fields },
});
for (const s of students) saveFixture(s, 'day07', { day07: plan(s.studentId) });
// The regression: a server-saved practice exists, but no Day08 plan.
saveFixture(students[0], 'day08', { day08: { practiceLed: true } });
const originalDay07 = JSON.stringify(rows('05_학생연구기록').filter(r => r.dayId === 'day07'));
writes.length = 0;
let delayPrevious = 0;
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api') {
      const body = req.method === 'POST'
        ? JSON.parse(await Array.fromAsync(req).then(chunks => Buffer.concat(chunks).toString()))
        : null;
      const action = body?.action || url.searchParams.get('action');
      const params = Object.fromEntries(url.searchParams);
      let data;
      if (action === 'getStudents') data = { students, count: students.length };
      else if (action === 'getLessonContext') data = context.getLessonContext_(params);
      else if (action === 'getDayRecord') {
        if (params.dayId === 'day07' && delayPrevious) await new Promise(r => setTimeout(r, delayPrevious));
        data = context.getDayRecord_(params);
      } else if (action === 'saveDayRecord') data = context.saveDayRecord_(body.payload);
      else if (action === 'saveQuizResult') data = {}; // Quiz is outside this test's scope.
      else throw new Error('Unexpected action: ' + action);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, data }));
      return;
    }
    if (url.pathname === '/runtime-config.js') {
      res.setHeader('Content-Type', 'text/javascript');
      res.end('window.FUTURE_LAB_CONFIG=' + JSON.stringify({
        appsScriptApiUrl: 'http://127.0.0.1:' + server.address().port + '/api',
        devMode: true, students,
      }));
      return;
    }
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) throw new Error('Invalid path');
    const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).on('error', () => { res.statusCode = 404; res.end(); }).pipe(res);
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: { code: error.code || 'TEST_ERROR', message: error.message } }));
  }
});
const field = key => '[data-day08-field="' + key + '"]';
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const errors = [];
  const open = async s => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/?day=8&studentId=' + s.studentId);
    return { ctx, page };
  };
  try {
    for (const s of students) {
      const { ctx, page } = await open(s);
      const expected = plan(s.studentId);
      await page.waitForFunction(({ selector, value }) => document.querySelector(selector)?.value === value, { selector: field('device'), value: expected.device });
      for (const [key, value] of Object.entries(expected)) assert.equal(await page.locator(field(key)).inputValue(), value);
      if (s === students[0]) assert.equal(await page.locator(field('practiceLed')).isChecked(), true);
      await page.locator(field('device')).fill(s.studentId + '-Day08-edited');
      await page.locator('[data-day08-save]').click();
      await page.waitForFunction(() => document.querySelector('[data-day08-save-status]')?.textContent === '오늘의 기록을 저장했어요.');
      const saved = context.getDayRecord_({ studentId: s.studentId, dayId: 'day08' }).dayRecord;
      assert.equal(saved.dayStateJson.day08.device, s.studentId + '-Day08-edited');
      await page.reload();
      await page.waitForFunction(({ selector, value }) => document.querySelector(selector)?.value === value, { selector: field('device'), value: s.studentId + '-Day08-edited' });
      await ctx.close();
      // A new browser context has no cookies, sessionStorage or localStorage.
      const fresh = await open(s);
      await fresh.page.waitForFunction(({ selector, value }) => document.querySelector(selector)?.value === value, { selector: field('device'), value: s.studentId + '-Day08-edited' });
      await fresh.ctx.close();
    }
    // Race: an unrelated practice save finishes while Day07 is still loading.
    const s = students[4];
    rows('05_학생연구기록').splice(rows('05_학생연구기록').findIndex(r => r.studentId === s.studentId && r.dayId === 'day08'), 1);
    delayPrevious = 1800;
    const { ctx, page } = await open(s);
    await page.locator(field('practiceServo')).check();
    await page.locator('[data-day08-save]').click();
    await page.waitForFunction(({ selector, value }) => document.querySelector(selector)?.value === value, { selector: field('device'), value: plan(s.studentId).device });
    await ctx.close();
    assert.equal(JSON.stringify(rows('05_학생연구기록').filter(r => r.dayId === 'day07')), originalDay07);
    assert.ok(writes.length >= 5);
    assert.ok(writes.every(w => w.dayId === 'day08' && w.studentId.startsWith('fixture')));
    assert.deepEqual(errors, []);
    console.log('PASS: 5 isolated students; 8 plan fields; save/readback; reload; fresh session; delayed import; Day07 immutable.');
    console.log('Local HTTP and repository Apps Script DayRecord code executed; Google Sheets was NOT contacted.');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
