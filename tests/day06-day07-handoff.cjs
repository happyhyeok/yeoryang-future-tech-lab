const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: { location: { search: '' } }, document: { addEventListener() {} }, URLSearchParams });
for (const file of ['research-days.js', 'day07.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const labels = ['내가 해결하고 싶었던 문제', '내가 선택한 아이디어', '이 방법을 선택한 이유'];
const saved = { problemDefinition: '06 problem', day06SelectedIdeaText: '06 idea', day06SelectionReason: '06 reason' };

function previous(record, day05 = { todayDecision: '05 problem' }, status = 'record') {
  const html = context.window.Day07.render({ day07: {}, quizAnswers: {} }, record, status, escape, context.window.DAY_LESSONS.day07, day05);
  return labels.map(label => {
    const marker = `<h3>${label}</h3><p>`;
    const start = html.indexOf(marker);
    assert.notEqual(start, -1, `missing ${label}`);
    return html.slice(start + marker.length).split('</p>', 1)[0];
  });
}

test('API object restores the three Day06 fields even if Day05 or summary fields differ', () => {
  assert.deepEqual(previous({ dayStateJson: saved, todayDecision: 'older idea', changeReason: 'older reason' }), ['06 problem', '06 idea', '06 reason']);
});
test('serialized Day06 state has the same result as an API object', () => {
  assert.deepEqual(previous({ dayStateJson: JSON.stringify(saved), todayDecision: 'older idea', changeReason: 'older reason' }), ['06 problem', '06 idea', '06 reason']);
});
test('older dayState object remains readable', () => {
  assert.deepEqual(previous({ dayState: saved }), ['06 problem', '06 idea', '06 reason']);
});
test('Day06 problem snapshot is used when its problem definition is absent', () => {
  assert.deepEqual(previous({ dayStateJson: { day06ProblemSnapshot: '06 snapshot' }, todayDecision: 'summary idea', changeReason: 'summary reason' }), ['06 snapshot', 'summary idea', 'summary reason']);
});
test('missing nested fields use the existing Day06 summaries and Day05 fallback', () => {
  assert.deepEqual(previous({ dayStateJson: {}, todayDecision: 'summary idea', changeReason: 'summary reason' }), ['05 problem', 'summary idea', 'summary reason']);
});
test('an unreadable JSON string still uses the existing summary fallbacks', () => {
  assert.deepEqual(previous({ dayStateJson: '{bad', todayDecision: 'summary idea', changeReason: 'summary reason' }), ['05 problem', 'summary idea', 'summary reason']);
});
test('an existing top-level Day06 problem remains the first choice', () => {
  assert.deepEqual(previous({ problemDefinition: 'top problem', dayStateJson: saved }), ['top problem', '06 idea', '06 reason']);
});
test('missing Day06 record keeps the Day05 problem and unavailable messages', () => {
  assert.deepEqual(previous(null), ['05 problem', '기록을 확인할 수 없습니다.', '기록을 확인할 수 없습니다.']);
});
