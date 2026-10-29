// Synthetic TEST Day05 source records for Day06/Day07 lesson regression.
const assert = require('node:assert/strict');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
    process.env.IMAGE_TEST_SHEET_ID === process.env.IMAGE_PRODUCTION_SHEET_ID ||
    !process.env.IMAGE_TEST_SHEET_ID || !process.env.IMAGE_PRODUCTION_SHEET_ID) {
  throw Error('TEST endpoint and distinct Sheet IDs required');
}
async function api(action, payload, params) {
  const url = new URL(endpoint);
  let response;
  if (params) {
    url.searchParams.set('action', action);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } else {
    response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }), signal: AbortSignal.timeout(60000) });
  }
  assert.equal(response.status, 200);
  return response.json();
}
async function main() {
  const students = await api('getStudents', null, {});
  assert.deepEqual(students.data.students.map(s => s.studentId).sort(), ['test_student_a', 'test_student_b']);
  for (const [letter, problem] of [
    ['a', '테스트 A: 책상 주변이 어두워 글씨를 읽기 어려워요.'],
    ['b', '테스트 B: 화분 흙이 마른 때를 놓쳐요.'],
  ]) {
    const studentId = `test_student_${letter}`;
    const workId = `test_work_${letter}`;
    const payload = { studentId, workId, dayId: 'day05', blockProgress: {}, activities: [],
      personalEvidenceRefs: [], commonEvidenceRefs: [], minimumCompleted: false,
      completionLevel: '', status: 'in_progress', todayDecision: problem,
      dayState: { targetUser: letter === 'a' ? '책을 읽는 사람' : '화분을 돌보는 사람',
        problemDefinition: problem, day05Situation: '가상 TEST 상황',
        inconvenience: problem, problemDefinitionEdited: true } };
    const saved = await api('saveDayRecord', payload);
    assert.equal(saved.ok, true, `${studentId} save`);
    const read = await api('getDayRecord', null, { studentId, dayId: 'day05' });
    assert.equal(read.data.dayRecord.dayStateJson.problemDefinition, problem);
  }
  process.stdout.write('Day05 synthetic A/B source records: PASS TEST API readback\n');
}
main().catch(error => { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; });
