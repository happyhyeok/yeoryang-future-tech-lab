const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(require.resolve('../day08.js'), 'utf8'), context);
const { seed } = context.window.Day08;
const state = (id = 'fixture01', extra = {}) => ({
  studentId: id, workId: 'work_' + id, dayId: 'day08', ...extra,
});
const record = (id = 'fixture01', plan = { device: '테스트 장치' }) => ({
  studentId: id, workId: 'work_' + id, dayId: 'day07', updatedAt: '2026-10-30',
  dayStateJson: { ...state(id), dayId: 'day07', day07: plan },
});

test('a saved non-plan activity must not prevent first plan import', () => {
  const s = state('fixture01', { serverUpdatedAt: '2026-10-30', day08: { practiceLed: true } });
  assert.equal(seed(s, record()), true);
  assert.equal(s.day08.device, '테스트 장치');
  assert.equal(s.day08.practiceLed, true);
});
test('an empty Day07 must not permanently mark the import complete', () => {
  const s = state();
  assert.equal(seed(s, record('fixture01', {})), false);
  assert.equal(seed(s, record()), true);
});
test('an already-saved empty import marker can recover without erasing activity', () => {
  const s = state('fixture01', {
    serverUpdatedAt: '2026-10-30',
    day08: { sourceInitialized: true, practiceLed: true },
  });
  assert.equal(seed(s, record()), true);
  assert.equal(s.day08.device, '테스트 장치');
  assert.equal(s.day08.practiceLed, true);
});
test('saved Day08 plan wins, including an explicitly cleared field', () => {
  for (const day08 of [{ device: 'Day08 수정' }, { editedFields: { device: true } }]) {
    const s = state('fixture01', { serverUpdatedAt: '2026-10-30', day08 });
    assert.equal(seed(s, record()), false);
    assert.equal(s.day08.device, day08.device || '');
  }
});
test('stu01 partial saved Day08 person imports remaining Day07 plan without overwriting person', () => {
  const s = state('fixture01', {
    serverUpdatedAt: '2026-10-30',
    day08: { person: 'Day08 직접 수정', editedFields: { person: true, practiceRing: true }, practiceRing: false },
  });
  assert.equal(seed(s, record('fixture01', { person: 'Day07 대상', problem: '배드민턴 콕이 안 보임', device: '불빛 장치', input: '주변의 밝기' })), true);
  assert.equal(s.day08.person, 'Day08 직접 수정');
  assert.equal(s.day08.problem, '배드민턴 콕이 안 보임');
  assert.equal(s.day08.device, '불빛 장치');
  assert.equal(s.day08.input, '주변의 밝기');
  assert.equal(s.day08.practiceRing, false);
});
test('explicitly cleared Day08 field remains empty while other missing fields import', () => {
  const s = state('fixture01', { serverUpdatedAt: '2026-10-30', day08: { editedFields: { device: true } } });
  assert.equal(seed(s, record('fixture01', { device: 'Day07 장치', problem: 'Day07 문제' })), true);
  assert.equal(s.day08.device, '');
  assert.equal(s.day08.problem, 'Day07 문제');
});
test('five student/work contexts stay isolated and Day07 stays immutable', () => {
  for (let n = 1; n <= 5; n++) {
    const id = 'fixture0' + n;
    const r = record(id, { device: id });
    const original = JSON.stringify(r);
    for (let other = 1; other <= 5; other++) {
      const s = state('fixture0' + other);
      assert.equal(seed(s, r), n === other);
      if (n === other) assert.equal(s.day08.device, id);
    }
    const s = state(id);
    assert.equal(seed(s, { ...r, workId: 'wrong' }), false);
    assert.equal(seed(s, { ...r, dayId: 'day08' }), false);
    assert.equal(JSON.stringify(r), original);
  }
});
test('a delayed import preserves edits and restored imports are idempotent', () => {
  const s = state('fixture01', { day08: { device: '', editedFields: { device: true } } });
  assert.equal(seed(s, record('fixture01', { device: '이전 장치', problem: '테스트 문제' })), true);
  assert.equal(s.day08.device, '');
  assert.equal(s.day08.problem, '테스트 문제');
  assert.equal(seed(JSON.parse(JSON.stringify(s)), record('fixture01', { problem: '새 문제' })), false);
});
