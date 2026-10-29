/**
 * Day06/Day07: one image per student and day.
 * The existing uploadVideo API action dispatches here for mediaKind=image.
 */
function uploadDayImage_(payload) {
  const body = getRequiredPayload_(payload);
  const studentId = assertId_(body.studentId, "STUDENT_NOT_FOUND", "studentId");
  const workId = assertId_(body.workId, "WORK_NOT_FOUND", "workId");
  const dayId = assertId_(body.dayId, "DAY_NOT_FOUND", "dayId");
  assertApi_(dayId === "day06" || dayId === "day07", "DAY_NOT_FOUND", "이미지 등록은 Day06·Day07만 가능합니다.");
  validateStudent_(studentId);
  validateWorkForStudent_(studentId, workId);
  const dayRow = validateResearchDay_(dayId);
  const assetId = "asset_" + studentId + "_" + dayId + "_image";
  assertApi_(String(body.assetId || "") === assetId, "ASSET_ID_CONFLICT", "이미지 Asset ID가 맞지 않습니다.");
  const mimeType = String(body.mimeType || "").trim().toLowerCase();
  assertApi_(["image/png", "image/jpeg", "image/webp"].indexOf(mimeType) >= 0,
    "INVALID_IMAGE_MIME_TYPE", "PNG·JPG·WEBP 이미지만 등록할 수 있습니다.");
  const base64 = String(body.base64Data || "").replace(/\s/g, "");
  assertApi_(base64.length && base64.length <= 4200000 && /^[A-Za-z0-9+/]*={0,2}$/.test(base64) && base64.length % 4 !== 1,
    "INVALID_IMAGE_BASE64", "이미지 데이터가 올바르지 않거나 너무 큽니다.");
  let bytes;
  try { bytes = Utilities.base64Decode(base64); }
  catch (_) { throw createApiError_("INVALID_IMAGE_BASE64", "이미지를 읽을 수 없습니다."); }
  assertApi_(bytes.length > 0 && bytes.length <= 3 * 1024 * 1024, "IMAGE_TOO_LARGE", "3MB 이하 이미지만 등록할 수 있습니다.");
  assertApi_(validDayImageSignature_(bytes, mimeType), "INVALID_IMAGE_DATA", "이미지 형식이 파일 내용과 다릅니다.");

  const ext = mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "webp";
  const fileName = getProjectId_() + "_" + studentId + "_" + dayId + "_image." + ext;
  const parent = getImageStorageFolder_();
  const root = getOrCreateChildFolder_(parent, "학생이미지_업로드");
  const folder = getOrCreateChildFolder_(getOrCreateChildFolder_(root, studentId), dayId);
  let created = null;
  const previous = findAssetById_(assetId).rowObject;
  let assetUpdated = false;
  try {
    created = folder.createFile(Utilities.newBlob(bytes, mimeType, fileName));
    const fileId = created.getId();
    // Each new copy begins private. A reviewer must explicitly approve this exact file.
    created.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    assertApi_(created.getSharingAccess() === DriveApp.Access.PRIVATE,
      "IMAGE_PRIVATE_REQUIRED", "비공개 저장 상태를 확인하지 못했습니다.");
    writeMediaPolicy_(fileId, { mediaKind: "image", assetId: assetId,
      studentId: studentId, dayId: dayId, reviewStatus: "PENDING_REVIEW",
      replacedAt: "", expiresAt: "", cleanupStatus: "CURRENT",
      reviewedAt: "", reviewedBy: "" });
    const now = formatServerDateTime_(new Date());
    const asset = upsertAsset_({
      assetId: assetId, assetType: "screenshot", ownerType: "student",
      ownerId: studentId, dayId: dayId, blockId: dayId === "day06" ? "block14" : "plan",
      title: dayId === "day06" ? "Day06 아이디어 그림" : "Day07 제작계획 그림",
      description: "", storageFileId: fileId,
      storageUrl: "https://drive.google.com/file/d/" + fileId + "/preview",
      thumbnailUrl: "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200",
      fileName: fileName, mimeType: mimeType, capturedAt: cleanFreeText_(body.capturedAt || now),
    }).asset;
    assetUpdated = true;
    linkMediaEvidence_(studentId, workId, dayId, assetId, dayRow);
    const readback = getDayRecordById_(studentId, dayId, true);
    assertApi_(readback.dayRecord && readback.dayRecord.personalEvidenceRefs.indexOf(assetId) >= 0 &&
      String(findAssetById_(assetId).rowObject.storageFileId) === fileId,
      "IMAGE_VERIFY_FAILED", "이미지 저장 검증에 실패했습니다.");
    if (previous && previous.storageFileId && previous.storageFileId !== fileId) {
      keepReplacedMedia_(previous, "image", new Date());
      // Retained copies are private even if their earlier approval permitted link viewing.
      DriveApp.getFileById(previous.storageFileId).setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    }
    return { assetId: assetId, reviewStatus: "PENDING_REVIEW" };
  } catch (error) {
    // Compensating write: preserve the previous visible image if the new image
    // was uploaded but record linkage/readback fails.
    let restored = !assetUpdated;
    if (assetUpdated && previous) {
      try {
        upsertAsset_({
          assetId: previous.assetId, assetType: previous.assetType,
          ownerType: previous.ownerType, ownerId: previous.ownerId,
          dayId: previous.dayId, blockId: previous.blockId,
          title: previous.title, description: previous.description,
          storageFileId: previous.storageFileId, storageUrl: previous.storageUrl,
          thumbnailUrl: previous.thumbnailUrl, fileName: previous.fileName,
          mimeType: previous.mimeType, capturedAt: previous.capturedAt,
        });
        restored = true;
      } catch (restoreError) {
        console.warn("Day image metadata restoration failed: " + restoreError.message);
      }
    }
    if (assetUpdated && !previous) {
      try {
        deleteAssetIfMatches_(assetId, created.getId());
        unlinkMediaEvidenceIfOrphan_(studentId, dayId, assetId);
        restored = true;
      }
      catch (restoreError) { console.warn("Day image new Asset cleanup failed: " + restoreError.message); }
    }
    if (restored && created) {
      try { created.setTrashed(true); }
      catch (trashError) { console.warn("Day image failed upload cleanup: " + trashError.message); }
    }
    throw error;
  }
}
function getImageStorageFolder_() {
  const environment = getScriptProperty_("ENVIRONMENT").trim().toUpperCase();
  const folderId = getScriptProperty_("IMAGE_STORAGE_FOLDER_ID").trim();
  const spreadsheetId = getSpreadsheetId_();
  assertApi_(environment === "TEST" || environment === "PRODUCTION",
    "IMAGE_STORAGE_NOT_CONFIGURED", "이미지 저장 환경이 설정되지 않았습니다.");
  assertApi_(folderId, "IMAGE_STORAGE_NOT_CONFIGURED", "이미지 저장 폴더가 설정되지 않았습니다.");
  if (environment === "TEST") {
    const productionSheetId = getScriptProperty_("PRODUCTION_SPREADSHEET_ID").trim();
    const productionFolderId = getScriptProperty_("PRODUCTION_IMAGE_STORAGE_FOLDER_ID").trim();
    assertApi_(productionSheetId && productionFolderId &&
      spreadsheetId !== productionSheetId && folderId !== productionFolderId,
      "TEST_STORAGE_NOT_ISOLATED", "테스트 저장소가 운영 저장소와 분리되지 않았습니다.");
  }
  let folder;
  try {
    folder = DriveApp.getFolderById(folderId);
    assertApi_(!folder.isTrashed(), "IMAGE_STORAGE_UNAVAILABLE", "이미지 저장 폴더를 사용할 수 없습니다.");
  } catch (_) {
    throw createApiError_("IMAGE_STORAGE_UNAVAILABLE", "이미지 저장 폴더에 접근할 수 없습니다.");
  }
  return folder;
}
function validDayImageSignature_(b, mime) {
  const u = function (i) { return (b[i] + 256) % 256; };
  if (mime === "image/png") return b.length > 24 && [137,80,78,71,13,10,26,10].every(function(v,i){return u(i)===v;});
  if (mime === "image/jpeg") return b.length > 4 && u(0) === 255 && u(1) === 216 && u(2) === 255;
  return b.length > 12 && [82,73,70,70].every(function(v,i){return u(i)===v;}) &&
    [87,69,66,80].every(function(v,i){return u(i+8)===v;});
}
function linkMediaEvidence_(studentId, workId, dayId, assetId, dayRow) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const dayRecordId = makeDayRecordId_(studentId, dayId);
    const found = findRowByColumn_(FUTURELAB_CONFIG.SHEETS.DAY_RECORDS, "dayRecordId", dayRecordId);
    const old = found.rowObject;
    const now = formatServerDateTime_(new Date());
    const refs = old ? parseJsonCell_(old.personalEvidenceRefs, []) : [];
    const next = refs.filter(function(ref){return ref !== assetId;}).concat([assetId]);
    const values = old ? Object.assign({}, old) : {
      dayRecordId: dayRecordId, studentId: studentId, workId: workId, dayId: dayId,
      date: String(dayRow.date || ""), blockProgress: "{}", role: "", activities: "[]",
      todayDecision: "", discovery: "", difficulty: "", changeMade: "", changeReason: "",
      nextAction: "", commonEvidenceRefs: "[]", minimumCompleted: false,
      completionLevel: "", status: "not_started", studentReflection: "",
      dayStateJson: JSON.stringify({ studentId: studentId, workId: workId, dayId: dayId }),
      createdAt: now,
    };
    assertApi_(String(values.studentId) === studentId && String(values.workId) === workId,
      "WORK_STUDENT_MISMATCH", "연구기록 소유자가 일치하지 않습니다.");
    values.personalEvidenceRefs = JSON.stringify(next);
    values.updatedAt = now;
    upsertById_(FUTURELAB_CONFIG.SHEETS.DAY_RECORDS, "dayRecordId", dayRecordId, values);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}

function unlinkMediaEvidenceIfOrphan_(studentId, dayId, assetId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (findAssetById_(assetId).rowObject) return;
    const found = findRowByColumn_(FUTURELAB_CONFIG.SHEETS.DAY_RECORDS,
      "dayRecordId", makeDayRecordId_(studentId, dayId));
    if (!found.rowObject) return;
    const refs = parseJsonCell_(found.rowObject.personalEvidenceRefs, []);
    if (refs.indexOf(assetId) < 0) return;
    upsertById_(FUTURELAB_CONFIG.SHEETS.DAY_RECORDS, "dayRecordId",
      makeDayRecordId_(studentId, dayId), Object.assign({}, found.rowObject, {
        personalEvidenceRefs: JSON.stringify(refs.filter(function(ref) { return ref !== assetId; })),
        updatedAt: formatServerDateTime_(new Date()),
      }));
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}
