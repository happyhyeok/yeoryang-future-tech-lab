const MEDIA_POLICY_SHEET_ = "10_미디어정책";
const MEDIA_POLICY_HEADERS_ = ["fileId", "mediaKind", "assetId", "studentId", "dayId", "reviewStatus", "replacedAt", "expiresAt", "cleanupStatus", "reviewedAt", "reviewedBy"];

function ensureMediaPolicySheet_() {
  const book = getSpreadsheet_();
  let sheet = book.getSheetByName(MEDIA_POLICY_SHEET_);
  if (!sheet) {
    sheet = book.insertSheet(MEDIA_POLICY_SHEET_);
    sheet.getRange(1, 1, 1, MEDIA_POLICY_HEADERS_.length).setValues([MEDIA_POLICY_HEADERS_]);
  }
  ensureRequiredHeaders_(sheet, MEDIA_POLICY_HEADERS_);
  return sheet;
}

function findMediaPolicy_(fileId) {
  ensureMediaPolicySheet_();
  return findRowByColumn_(MEDIA_POLICY_SHEET_, "fileId", String(fileId || "")).rowObject;
}

function writeMediaPolicy_(fileId, values) {
  ensureMediaPolicySheet_();
  return upsertById_(MEDIA_POLICY_SHEET_, "fileId", fileId, Object.assign({ fileId: fileId }, values));
}

function publicImageReview_(asset) {
  if (!asset || asset.assetType !== "screenshot" || !asset.storageFileId) return "NONE";
  const row = findMediaPolicy_(asset.storageFileId);
  if (!row || ["PENDING_REVIEW", "APPROVED", "REJECTED", "REVOKED"].indexOf(String(row.reviewStatus)) < 0)
    return "PENDING_REVIEW";
  if (row.reviewStatus === "APPROVED") {
    try {
      const file = DriveApp.getFileById(asset.storageFileId);
      if (file.isTrashed() || file.getSharingAccess() !== DriveApp.Access.ANYONE_WITH_LINK)
        return "PENDING_REVIEW";
    } catch (_) { return "PENDING_REVIEW"; }
  }
  return String(row.reviewStatus);
}

function keepReplacedMedia_(oldAsset, kind, replacedAt) {
  if (!oldAsset || !oldAsset.storageFileId) return;
  const fileId = String(oldAsset.storageFileId);
  const expires = new Date(replacedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const prior = findMediaPolicy_(fileId);
  writeMediaPolicy_(fileId, {
    mediaKind: kind, assetId: oldAsset.assetId, studentId: oldAsset.ownerId,
    dayId: oldAsset.dayId, reviewStatus: prior ? prior.reviewStatus : "PENDING_REVIEW",
    replacedAt: replacedAt.toISOString(), expiresAt: expires.toISOString(), cleanupStatus: "RETAINED",
    reviewedAt: prior ? prior.reviewedAt : "", reviewedBy: prior ? prior.reviewedBy : "",
  });
}

// This function has no WebApi route. Run only from the Apps Script editor as an authorized reviewer.
function reviewDayImageCopy_(assetId, expectedFileId, decision) {
  const reviewer = String(Session.getActiveUser().getEmail() || "").toLowerCase();
  const allowed = String(getScriptProperty_("MEDIA_REVIEWER_EMAIL") || "").toLowerCase();
  assertApi_(allowed && reviewer === allowed, "REVIEW_FORBIDDEN", "승인 권한이 없습니다.");
  assertApi_(["APPROVED", "REJECTED", "REVOKED"].indexOf(decision) >= 0,
    "INVALID_REVIEW", "승인 상태가 올바르지 않습니다.");
  const asset = findAssetById_(assetId).rowObject;
  assertApi_(asset && asset.assetType === "screenshot" && asset.storageFileId === expectedFileId,
    "IMAGE_CHANGED", "대표 이미지가 변경되었습니다.");
  const row = findMediaPolicy_(expectedFileId);
  assertApi_(row && row.assetId === assetId && row.mediaKind === "image" && !row.replacedAt,
    "IMAGE_NOT_REVIEWABLE", "승인할 수 있는 사본이 아닙니다.");
  const file = DriveApp.getFileById(expectedFileId);
  assertApi_(!file.isTrashed(), "IMAGE_NOT_REVIEWABLE", "파일을 사용할 수 없습니다.");
  assertApi_(isManagedImageCopy_(file, row.studentId, row.dayId),
    "IMAGE_NOT_REVIEWABLE", "승인된 별도 업로드 사본이 아닙니다.");
  // Sharing is changed before APPROVED is saved, so a failed permission update never yields approval.
  file.setSharing(decision === "APPROVED" ? DriveApp.Access.ANYONE_WITH_LINK : DriveApp.Access.PRIVATE,
    DriveApp.Permission.VIEW);
  try {
    writeMediaPolicy_(expectedFileId, { reviewStatus: decision,
      reviewedAt: new Date().toISOString(), reviewedBy: reviewer });
    SpreadsheetApp.flush();
  } catch (error) {
    // Fail closed if publication metadata could not be committed.
    if (decision === "APPROVED") file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    throw error;
  }
  return { assetId: assetId, status: decision };
}

function isManagedImageCopy_(file, studentId, dayId) {
  const dayParents = file.getParents();
  if (!dayParents.hasNext()) return false;
  const dayFolder = dayParents.next();
  if (dayFolder.getName() !== dayId) return false;
  const studentParents = dayFolder.getParents();
  if (!studentParents.hasNext()) return false;
  const studentFolder = studentParents.next();
  if (studentFolder.getName() !== studentId) return false;
  const rootParents = studentFolder.getParents();
  if (!rootParents.hasNext()) return false;
  const root = rootParents.next();
  if (root.getName() !== "학생이미지_업로드") return false;
  const sourceParents = root.getParents();
  return sourceParents.hasNext() && sourceParents.next().getId() === getImageStorageFolder_().getId();
}

// Read-only by default. Never trashes files; compare the report before any separate authorized cleanup.
function reportMediaCleanupCandidates_() {
  const now = Date.now();
  ensureMediaPolicySheet_();
  const table = readSheetTable_(MEDIA_POLICY_SHEET_);
  return table.rows.map(function(values) {
    const row = rowObjectFromValues_(table.headers, values);
    const asset = findAssetById_(String(row.assetId || "")).rowObject;
    const current = Boolean(asset && String(asset.storageFileId) === String(row.fileId));
    const referenced = isMediaFileReferenced_(String(row.fileId || "")) ||
      (current && isMediaAssetReferenced_(asset.assetId, asset.ownerId, asset.dayId));
    const expired = Boolean(row.expiresAt && Date.parse(String(row.expiresAt)) <= now);
    let managed = row.mediaKind === "video";
    if (row.mediaKind === "image") {
      try { managed = isManagedImageCopy_(DriveApp.getFileById(row.fileId), row.studentId, row.dayId); }
      catch (_) { managed = false; }
    }
    return { fileId: row.fileId, mediaKind: row.mediaKind, studentId: row.studentId,
      dayId: row.dayId, expiresAt: row.expiresAt, current: current, referenced: Boolean(referenced),
      expired: expired, managed: managed,
      candidate: Boolean(managed && expired && !current && !referenced && row.cleanupStatus === "RETAINED"),
      mode: "DRY_RUN" };
  });
}

function isMediaAssetReferenced_(assetId, studentId, dayId) {
  const found = findRowByColumn_(FUTURELAB_CONFIG.SHEETS.DAY_RECORDS, "dayRecordId", makeDayRecordId_(studentId, dayId));
  return Boolean(found.rowObject && parseJsonCell_(found.rowObject.personalEvidenceRefs, []).indexOf(assetId) >= 0);
}

function isMediaFileReferenced_(fileId) {
  if (!fileId) return false;
  const table = readSheetTable_(FUTURELAB_CONFIG.SHEETS.DAY_RECORDS);
  return table.rows.some(function(values) {
    const row = rowObjectFromValues_(table.headers, values);
    return String(row.dayStateJson || "").indexOf(fileId) >= 0;
  });
}
