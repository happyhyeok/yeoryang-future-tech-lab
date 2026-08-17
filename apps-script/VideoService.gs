function uploadVideo_(payload) {
  const video = normalizeVideoUploadPayload_(payload);
  const bytes = decodeVideoBytes_(video.base64Data);
  ensureAssetHeaders_();
  const folder = getVideoDayFolder_(video.studentId, video.dayId);
  const previousFileId = getExistingVideoStorageFileId_(video);
  const now = formatServerDateTime_(new Date());
  let newFile = null;

  try {
    const blob = Utilities.newBlob(bytes, video.mimeType, video.fileName);
    newFile = folder.createFile(blob);
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const storageFileId = newFile.getId();
    const storageUrl = makeDrivePreviewUrl_(storageFileId);
    const assetPayload = {
      assetId: video.assetId,
      assetType: "video",
      ownerType: "student",
      ownerId: video.studentId,
      dayId: video.dayId,
      blockId: video.blockId,
      title: "Day01 연구 모습 영상",
      description: "첫 연구장치 시험 모습",
      storageFileId: storageFileId,
      storageUrl: storageUrl,
      thumbnailUrl: "",
      fileName: video.fileName,
      mimeType: video.mimeType,
      capturedAt: video.capturedAt || now,
    };
    const asset = upsertAsset_(assetPayload).asset;
    let previousFileTrashed = false;

    if (previousFileId && previousFileId !== storageFileId) {
      previousFileTrashed = trashVideoFile_(previousFileId);
    }

    return {
      assetId: video.assetId,
      fileId: storageFileId,
      storageFileId: storageFileId,
      storageUrl: storageUrl,
      playbackUrl: storageUrl,
      fileName: video.fileName,
      mimeType: video.mimeType,
      capturedAt: asset.capturedAt || assetPayload.capturedAt,
      asset: asset,
      previousFileTrashed: previousFileTrashed,
    };
  } catch (error) {
    if (newFile) {
      try {
        newFile.setTrashed(true);
      } catch (trashError) {
        console.warn("new video file cleanup failed: " + trashError.message);
      }
    }

    throw error;
  }
}

function normalizeVideoUploadPayload_(payload) {
  const body = getRequiredPayload_(payload);
  const studentId = assertId_(body.studentId, "STUDENT_NOT_FOUND", "studentId");
  const workId = assertId_(body.workId, "WORK_NOT_FOUND", "workId");
  const dayId = assertId_(body.dayId, "DAY_NOT_FOUND", "dayId");
  const assetId = assertId_(body.assetId, "ASSET_VALIDATION_ERROR", "assetId");
  const mimeType = ensureAllowedValue_(
    String(body.mimeType || "").trim(),
    FUTURELAB_CONFIG.VIDEO_STORAGE.ALLOWED_MIME_TYPES,
    "INVALID_VIDEO_MIME_TYPE",
    "mimeType"
  );
  const expectedAssetId = "asset_" + studentId + "_" + dayId + "_video";

  validateStudent_(studentId);
  validateWorkForStudent_(studentId, workId);
  validateResearchDay_(dayId);
  assertApi_(dayId === "day01", "DAY_NOT_FOUND", "Day01 영상 업로드만 허용됩니다.");
  assertApi_(
    assetId === expectedAssetId,
    "ASSET_ID_CONFLICT",
    "Day01 video Asset ID가 학생·연구일 규칙과 일치하지 않습니다."
  );

  return {
    studentId: studentId,
    workId: workId,
    dayId: dayId,
    assetId: assetId,
    blockId: cleanFreeText_(body.blockId || "block03", FUTURELAB_CONFIG.LIMITS.TITLE, "blockId"),
    mimeType: mimeType,
    capturedAt: cleanFreeText_(body.capturedAt, FUTURELAB_CONFIG.LIMITS.TITLE, "capturedAt"),
    fileName: makeVideoFileName_(studentId, dayId, mimeType),
    base64Data: normalizeVideoBase64_(body.base64Data, mimeType),
  };
}

function normalizeVideoBase64_(base64Data, mimeType) {
  let text = String(base64Data || "").trim();
  const dataUrlMatch = text.match(/^data:([^;]+);base64,(.*)$/);

  if (dataUrlMatch) {
    assertApi_(
      dataUrlMatch[1] === mimeType,
      "INVALID_VIDEO_MIME_TYPE",
      "base64 데이터의 MIME type이 요청과 일치하지 않습니다."
    );
    text = dataUrlMatch[2];
  }

  text = text.replace(/\s/g, "");
  assertApi_(text, "INVALID_VIDEO_BASE64", "영상 base64 데이터가 필요합니다.");
  assertApi_(
    text.length <= FUTURELAB_CONFIG.LIMITS.VIDEO_BASE64_CHARS,
    "VIDEO_TOO_LARGE",
    "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요."
  );
  assertApi_(
    /^[A-Za-z0-9+/]*={0,2}$/.test(text) && text.length % 4 !== 1,
    "INVALID_VIDEO_BASE64",
    "영상 base64 형식이 올바르지 않습니다."
  );
  assertApi_(
    estimateBase64ByteLength_(text) <= FUTURELAB_CONFIG.LIMITS.VIDEO_BYTES,
    "VIDEO_TOO_LARGE",
    "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요."
  );

  return text;
}

function decodeVideoBytes_(base64Data) {
  let bytes;

  try {
    bytes = Utilities.base64Decode(base64Data);
  } catch (error) {
    throw createApiError_("INVALID_VIDEO_BASE64", "영상 base64 데이터를 해석할 수 없습니다.");
  }

  assertApi_(bytes.length > 0, "INVALID_VIDEO_BASE64", "영상 파일 내용이 비어 있습니다.");
  assertApi_(
    bytes.length <= FUTURELAB_CONFIG.LIMITS.VIDEO_BYTES,
    "VIDEO_TOO_LARGE",
    "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요."
  );

  return bytes;
}

function estimateBase64ByteLength_(base64Data) {
  const padding = base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0;
  return Math.floor((base64Data.length * 3) / 4) - padding;
}

function isAllowedVideoMimeType_(mimeType) {
  return FUTURELAB_CONFIG.VIDEO_STORAGE.ALLOWED_MIME_TYPES.indexOf(mimeType) !== -1;
}

function assertValidDriveFileId_(fileId, label) {
  assertApi_(
    /^[A-Za-z0-9_-]{10,200}$/.test(String(fileId || "").trim()),
    "INVALID_DRIVE_FILE_ID",
    (label || "fileId") + " 형식이 올바르지 않습니다."
  );
}

function makeDrivePreviewUrl_(fileId) {
  assertValidDriveFileId_(fileId, "fileId");
  return "https://drive.google.com/file/d/" + fileId + "/preview";
}

function makeVideoFileName_(studentId, dayId, mimeType) {
  const extension = mimeType === "video/mp4" ? "mp4" : "webm";
  return FUTURELAB_CONFIG.PROJECT_ID + "_" + studentId + "_" + dayId + "_video." + extension;
}

function getVideoRootFolder_() {
  const folder = DriveApp.getFolderById(FUTURELAB_CONFIG.VIDEO_STORAGE.ROOT_FOLDER_ID);

  assertApi_(
    folder.getName() === FUTURELAB_CONFIG.VIDEO_STORAGE.ROOT_FOLDER_NAME,
    "VIDEO_STORAGE_FOLDER_MISMATCH",
    "영상 저장 루트 폴더 이름이 설정과 일치하지 않습니다."
  );

  return folder;
}

function getOrCreateChildFolder_(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parentFolder.createFolder(folderName);
}

function getVideoDayFolder_(studentId, dayId) {
  const root = getVideoRootFolder_();
  const studentFolder = getOrCreateChildFolder_(root, studentId);
  return getOrCreateChildFolder_(studentFolder, dayId);
}

function getExistingVideoStorageFileId_(video) {
  const found = findAssetById_(video.assetId);

  if (!found.rowObject) {
    return "";
  }

  validateExistingAssetIdentity_(found.rowObject, {
    assetType: "video",
    ownerType: "student",
    ownerId: video.studentId,
    dayId: video.dayId,
  });

  const previousFileId = String(found.rowObject.storageFileId || "").trim();

  if (previousFileId) {
    assertValidDriveFileId_(previousFileId, "storageFileId");
  }

  return previousFileId;
}

function trashVideoFile_(fileId) {
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
    return true;
  } catch (error) {
    console.warn("previous video trash failed: " + error.message);
    return false;
  }
}

function verifyVideoStorage() {
  const report = {
    ok: false,
    rootFolderId: FUTURELAB_CONFIG.VIDEO_STORAGE.ROOT_FOLDER_ID,
    expectedFolderName: FUTURELAB_CONFIG.VIDEO_STORAGE.ROOT_FOLDER_NAME,
    actualFolderName: "",
    nameMatches: false,
    canWrite: false,
    probeFileTrashed: false,
    effectiveUser:
      typeof Session !== "undefined" && Session.getEffectiveUser
        ? Session.getEffectiveUser().getEmail()
        : "",
  };

  try {
    const root = DriveApp.getFolderById(FUTURELAB_CONFIG.VIDEO_STORAGE.ROOT_FOLDER_ID);
    report.actualFolderName = root.getName();
    report.nameMatches = report.actualFolderName === report.expectedFolderName;
    assertApi_(
      report.nameMatches,
      "VIDEO_STORAGE_FOLDER_MISMATCH",
      "영상 저장 루트 폴더 이름이 설정과 일치하지 않습니다."
    );

    const probeName = "verify_" + FUTURELAB_CONFIG.PROJECT_ID + "_video_storage.txt";
    const probe = root.createFile(
      Utilities.newBlob("video storage permission check", "text/plain", probeName)
    );
    report.canWrite = true;
    probe.setTrashed(true);
    report.probeFileTrashed = true;
    report.ok = true;
  } catch (error) {
    report.error = error && error.message ? error.message : String(error);
  }

  console.log(JSON.stringify(report, null, 2));
  return report;
}
