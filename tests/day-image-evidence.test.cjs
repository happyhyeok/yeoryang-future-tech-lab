// Run: node --test tests/day-image-evidence.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../apps-script/ImageService.gs"), "utf8");

function harness() {
  let nextId = 0, asset = null, record = null, failWrite = false;
  const files = [];
  const folder = { createFile() {
    const file = { id: "test_file_" + (++nextId) + "_xxxx", trashed: false,
      getId() { return this.id; }, setSharing() {}, setTrashed() { this.trashed = true; } };
    files.push(file);
    return file;
  } };
  const mock = {
    FUTURELAB_CONFIG: { PROJECT_ID: "futurelab2026", SHEETS: { DAY_RECORDS: "dayrecords" } },
    getRequiredPayload_: x => x, assertId_: x => x,
    assertApi_: (ok, code) => { if (!ok) throw Error(code); },
    validateStudent_: id => { if (id !== "stu01") throw Error("wrong student"); },
    validateWorkForStudent_: (id, work) => { if (work !== "work_stu01") throw Error("wrong work"); },
    validateResearchDay_: () => ({ date: "2026-10-16" }),
    findAssetById_: () => ({ rowObject: asset }),
    DriveApp: { getFolderById: () => folder, Access: { ANYONE_WITH_LINK: "any" }, Permission: { VIEW: "view" } },
    getOrCreateChildFolder_: parent => parent,
    Utilities: { base64Decode: () => [-119, 80, 78, 71, 13, 10, 26, 10, ...Array(40).fill(0)], newBlob: () => ({}) },
    formatServerDateTime_: () => "2026-10-25T12:00:00",
    upsertAsset_: value => ({ asset: asset = { ...value } }),
    getDayRecordById_: () => ({ dayRecord: record,
      assets: record && JSON.parse(record.personalEvidenceRefs).includes(asset.assetId) ? [asset] : [] }),
    cleanFreeText_: value => value || "", createApiError_: code => Error(code),
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    findRowByColumn_: () => ({ rowObject: record }), parseJsonCell_: x => JSON.parse(x),
    upsertById_: (table, key, id, value) => { if (failWrite) throw Error("mock write failed"); record = { ...value }; },
    SpreadsheetApp: { flush() {} }, makeDayRecordId_: (s, d) => "dayrec_" + s + "_" + d,
    console: { warn() {} },
  };
  const fn = new Function(...Object.keys(mock), source + ";return uploadDayImage_;")(...Object.values(mock));
  const payload = { studentId: "stu01", workId: "work_stu01", dayId: "day06",
    assetId: "asset_stu01_day06_image", mimeType: "image/png", base64Data: "iVBORw0KGgo=" };
  return { fn, payload, snapshot: () => ({ asset, record, files }),
    failNextWrite: () => { failWrite = true; } };
}

test("first image writes Asset and references it in DayRecord", () => {
  const h = harness();
  const saved = h.fn(h.payload);
  const { asset, record } = h.snapshot();
  assert.equal(saved.storageFileId, asset.storageFileId);
  assert.deepEqual(JSON.parse(record.personalEvidenceRefs), [h.payload.assetId]);
});

test("replacement updates the same asset ID to a new Drive file", () => {
  const h = harness();
  const a = h.fn(h.payload);
  const b = h.fn(h.payload);
  assert.notEqual(a.storageFileId, b.storageFileId);
  assert.equal(h.snapshot().asset.assetId, h.payload.assetId);
  assert.deepEqual(JSON.parse(h.snapshot().record.personalEvidenceRefs), [h.payload.assetId]);
});

test("link failure keeps previous representative image", () => {
  const h = harness();
  const first = h.fn(h.payload);
  h.failNextWrite();
  assert.throws(() => h.fn(h.payload), /mock write failed/);
  assert.equal(h.snapshot().asset.storageFileId, first.storageFileId);
});

test("day outside Day06/Day07 and other student are rejected", () => {
  const h = harness();
  assert.throws(() => h.fn({ ...h.payload, dayId: "day05" }), /DAY_NOT_FOUND/);
  assert.throws(() => h.fn({ ...h.payload, studentId: "stu02" }), /wrong student/);
});
