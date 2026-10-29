// Restore TEST A Day05/06 from an explicit private backup after an interrupted audit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const endpoint = process.env.IMAGE_TEST_API_URL || '';
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint) ||
    !process.env.IMAGE_TEST_SHEET_ID || !process.env.IMAGE_PRODUCTION_SHEET_ID ||
    process.env.IMAGE_TEST_SHEET_ID === process.env.IMAGE_PRODUCTION_SHEET_ID ||
    !process.env.DAY06_BACKUP_FILE) throw Error('Isolated TEST endpoint and explicit backup required');
const data = JSON.parse(fs.readFileSync(process.env.DAY06_BACKUP_FILE, 'utf8'));
async function call(action, payload, params) {
  const url = new URL(endpoint);
  let response;
  if (params) {
    url.searchParams.set('action', action);
    for (const [k,v] of Object.entries(params)) url.searchParams.set(k,v);
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } else {
    response = await fetch(url, { method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action,payload}),signal:AbortSignal.timeout(60000) });
  }
  const result = await response.json();
  assert.equal(result.ok, true, `${action}: ${result.error?.code || 'unknown'}`);
  return result.data;
}
function payload(r) {
  const keys=['studentId','workId','dayId','blockProgress','role','activities','todayDecision',
    'discovery','difficulty','changeMade','changeReason','nextAction','personalEvidenceRefs',
    'commonEvidenceRefs','minimumCompleted','completionLevel','status','studentReflection'];
  return {...Object.fromEntries(keys.map(k=>[k,r[k]])),dayState:r.dayStateJson};
}
(async()=>{
  for(const dayId of ['day05','day06']){
    const original=data[`test_student_a:${dayId}`];
    assert.equal(original?.studentId,'test_student_a');
    await call('saveDayRecord',payload(original));
    const saved=(await call('getDayRecord',null,{studentId:'test_student_a',dayId})).dayRecord;
    assert.equal(saved.dayStateJson.problemDefinition,original.dayStateJson.problemDefinition);
    assert.deepEqual(saved.personalEvidenceRefs,original.personalEvidenceRefs);
    process.stdout.write(`TEST A ${dayId}: restored original content and refs\n`);
  }
})().catch(e=>{process.stderr.write(`FAIL: ${e.stack||e.message}\n`);process.exitCode=1});
