const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../apps-script/VideoService.gs'), 'utf8');

function harness(failRetention) {
  const old = { assetId: 'asset_test_student_a_day02_video', assetType: 'video',
    ownerType: 'student', ownerId: 'test_student_a', dayId: 'day02',
    storageFileId: 'test_old_file_123456789', storageUrl: 'old-url', mimeType: 'video/webm' };
  let asset = { ...old }, retained = false;
  const file = { id: 'test_new_file_123456789', trashed: false,
    setSharing() {}, getId() { return this.id; }, setTrashed(value) { this.trashed = value; } };
  const video = { studentId: 'test_student_a', workId: 'test_work_a', dayId: 'day02',
    assetId: old.assetId, mimeType: 'video/webm', fileName: 'test.webm', base64Data: 'AA==' };
  const mock = {
    FUTURELAB_CONFIG: {}, Utilities: { newBlob: () => ({}) },
    DriveApp: { Access: { ANYONE_WITH_LINK: 'any' }, Permission: { VIEW: 'view' } },
    validateResearchDay_: () => ({ date: '2026-10-27' }),
    ensureAssetHeaders_: () => {}, findAssetById_: () => ({ rowObject: asset }),
    upsertAsset_: value => ({ asset: asset = { ...value } }),
    writeMediaPolicy_: () => {},
    linkMediaEvidence_: () => {},
    getDayRecordById_: () => ({ dayRecord: { personalEvidenceRefs: [old.assetId] }, assets: [asset] }),
    keepReplacedMedia_: () => { if (failRetention) throw Error('retention write failed'); retained = true; },
    formatServerDateTime_: () => '2026-10-27T12:00:00+09:00',
    assertApi_: (ok, code) => { if (!ok) throw Error(code); },
    console: { warn() {} },
  };
  const override = `
    normalizeVideoUploadPayload_ = () => (${JSON.stringify(video)});
    decodeVideoBytes_ = () => [0,1,2];
    getVideoDayFolder_ = () => ({ createFile: () => file });
    getExistingVideoStorageFileId_ = () => '${old.storageFileId}';
    getVideoDayLabels_ = () => ({ title: 'test', description: '' });
    makeDrivePreviewUrl_ = id => 'https://drive.google.com/file/d/' + id + '/preview';
    return uploadVideo_;`;
  const upload = new Function(...Object.keys(mock), 'file', source + override)(...Object.values(mock), file);
  return { upload, state: () => ({ asset, old, file, retained }) };
}

test('successful video replacement keeps the old file and reports no trash', () => {
  const h = harness(false);
  const result = h.upload({});
  assert.equal(result.previousFileTrashed, false);
  assert.equal(h.state().asset.storageFileId, h.state().file.id);
  assert.equal(h.state().file.trashed, false);
  assert.equal(h.state().retained, true);
});

test('failure after new Asset write restores old representative and keeps old file', () => {
  const h = harness(true);
  assert.throws(() => h.upload({}), /retention write failed/);
  assert.equal(h.state().asset.storageFileId, h.state().old.storageFileId);
  assert.equal(h.state().file.trashed, true);
});
