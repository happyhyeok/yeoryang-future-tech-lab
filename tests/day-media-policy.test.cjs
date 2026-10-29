const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../apps-script/MediaPolicyService.gs'), 'utf8');

function policyHarness(options = {}) {
  const now = Date.now();
  const ago = days => new Date(now - days * 86400000).toISOString();
  const later = days => new Date(now + days * 86400000).toISOString();
  const asset = { assetId: 'asset_test_student_a_day06_image', assetType: 'screenshot',
    ownerId: 'test_student_a', dayId: 'day06', storageFileId: 'test_current_123456789' };
  const headers = ['fileId', 'assetId', 'studentId', 'dayId', 'mediaKind', 'reviewStatus',
    'replacedAt', 'expiresAt', 'cleanupStatus'];
  const rows = [
    ['test_current_123456789', asset.assetId, asset.ownerId, asset.dayId, 'image', 'APPROVED', ago(31), ago(1), 'CURRENT'],
    ['test_young_123456789', asset.assetId, asset.ownerId, asset.dayId, 'image', 'APPROVED', ago(29), later(1), 'RETAINED'],
    ['test_expired_123456789', asset.assetId, asset.ownerId, asset.dayId, 'image', 'APPROVED', ago(31), ago(1), 'RETAINED'],
    ['test_referenced_123456789', asset.assetId, asset.ownerId, asset.dayId, 'image', 'APPROVED', ago(31), ago(1), 'RETAINED'],
    ['student_original_123456789', asset.assetId, asset.ownerId, asset.dayId, 'image', 'APPROVED', ago(31), ago(1), 'RETAINED'],
  ];
  const mock = {
    getSpreadsheet_: () => ({ getSheetByName: () => ({}) }),
    ensureRequiredHeaders_: () => {},
    readSheetTable_: sheet => sheet === '10_미디어정책' ? { headers, rows } :
      { headers: ['dayStateJson'], rows: [['{"old":"test_referenced_123456789"}']] },
    rowObjectFromValues_: (keys, values) => Object.fromEntries(keys.map((key, i) => [key, values[i]])),
    findAssetById_: () => ({ rowObject: asset }),
    findRowByColumn_: (sheet, key, id) => sheet === '10_미디어정책'
      ? { rowObject: Object.fromEntries(headers.map((header, i) => [header,
        (rows.find(row => row[0] === id) || [])[i]])) }
      : { rowObject: { personalEvidenceRefs: '[]' } },
    FUTURELAB_CONFIG: { SHEETS: { DAY_RECORDS: 'dayrecords' } },
    makeDayRecordId_: () => 'dayrec_test_student_a_day06',
    parseJsonCell_: value => JSON.parse(value),
    getImageStorageFolder_: () => ({ getId: () => 'test_image_root' }),
    DriveApp: { Access: { ANYONE_WITH_LINK: 'any' }, getFileById: id => {
      const iterator = item => ({ hasNext: () => true, next: () => item });
      const source = { getId: () => 'test_image_root' };
      const root = { getName: () => id.startsWith('student_original_') ? '원본이미지' : '학생이미지_업로드',
        getParents: () => iterator(source) };
      const student = { getName: () => 'test_student_a', getParents: () => iterator(root) };
      const day = { getName: () => 'day06', getParents: () => iterator(student) };
      return { isTrashed: () => false, getSharingAccess: () => options.sharing || 'any',
        getParents: () => iterator(day) };
    } },
  };
  return new Function(...Object.keys(mock), source +
    ';return { reportMediaCleanupCandidates_, publicImageReview_ };')(...Object.values(mock));
}

test('30-day dry run excludes current, young, and DayRecord-referenced files', () => {
  const result = policyHarness().reportMediaCleanupCandidates_();
  assert.equal(result.length, 5);
  assert.deepEqual(result.filter(x => x.candidate).map(x => x.fileId), ['test_expired_123456789']);
  assert.equal(result.find(x => x.fileId === 'student_original_123456789').managed, false);
  assert.ok(result.every(x => x.mode === 'DRY_RUN'));
});

test('an APPROVED row alone cannot expose a private Drive image', () => {
  const asset = { assetType: 'screenshot', storageFileId: 'test_current_123456789' };
  assert.equal(policyHarness({ sharing: 'private' }).publicImageReview_(asset), 'PENDING_REVIEW');
  assert.equal(policyHarness({ sharing: 'any' }).publicImageReview_(asset), 'APPROVED');
});
