function upsertAsset_(payload) {
  const asset = normalizeAssetPayload_(payload);
  const now = formatServerDateTime_(new Date());
  const lock = LockService.getScriptLock();

  ensureAssetHeaders_();
  lock.waitLock(10000);

  try {
    const rowObject = upsertAssetRow_(asset, now);

    SpreadsheetApp.flush();

    return {
      asset: formatAssetForResponse_(rowObject),
    };
  } finally {
    lock.releaseLock();
  }
}

function ensureAssetHeaders_() {
  const sheet = getSheet_(FUTURELAB_CONFIG.SHEETS.ASSETS);
  ensureRequiredHeaders_(sheet, FUTURELAB_CONFIG.REQUIRED_HEADERS.ASSETS);
}

function normalizeAssetPayload_(payload) {
  const body = getRequiredPayload_(payload);
  const asset = {
    assetId: assertId_(body.assetId, "ASSET_VALIDATION_ERROR", "assetId"),
    assetType: ensureAllowedValue_(
      String(body.assetType || ""),
      ["webpage_link", "video"],
      "ASSET_VALIDATION_ERROR",
      "assetType"
    ),
    ownerType: ensureAllowedValue_(
      String(body.ownerType || ""),
      ["student"],
      "ASSET_VALIDATION_ERROR",
      "ownerType"
    ),
    ownerId: assertId_(body.ownerId, "ASSET_VALIDATION_ERROR", "ownerId"),
    dayId: assertId_(body.dayId, "DAY_NOT_FOUND", "dayId"),
    blockId: cleanFreeText_(body.blockId),
    title: cleanFreeText_(body.title, FUTURELAB_CONFIG.LIMITS.TITLE, "title"),
    description: cleanFreeText_(
      body.description,
      FUTURELAB_CONFIG.LIMITS.DESCRIPTION,
      "description"
    ),
    storageFileId: cleanDriveFileIdText_(body.storageFileId),
    storageUrl: cleanUrlText_(body.storageUrl, "storageUrl"),
    thumbnailUrl: cleanUrlText_(body.thumbnailUrl, "thumbnailUrl"),
    fileName: cleanFreeText_(body.fileName, FUTURELAB_CONFIG.LIMITS.TITLE, "fileName"),
    mimeType: cleanFreeText_(body.mimeType, FUTURELAB_CONFIG.LIMITS.TITLE, "mimeType"),
    capturedAt: cleanFreeText_(body.capturedAt, FUTURELAB_CONFIG.LIMITS.TITLE, "capturedAt"),
  };

  validateStudent_(asset.ownerId);
  validateResearchDay_(asset.dayId);
  validateDay01MakeCodeAssetId_(
    asset.assetId,
    asset.assetType,
    asset.ownerId,
    asset.dayId,
    asset.storageUrl
  );
  validateVideoAssetPayload_(asset);

  return asset;
}

function cleanDriveFileIdText_(value) {
  const fileId = String(value || "").trim();

  if (fileId) {
    assertValidDriveFileId_(fileId, "storageFileId");
  }

  return fileId;
}

function upsertAssetRow_(asset, now) {
  const existing = findRowByColumn_(FUTURELAB_CONFIG.SHEETS.ASSETS, "assetId", asset.assetId);
  validateExistingAssetIdentity_(existing.rowObject, {
    assetType: asset.assetType,
    ownerType: asset.ownerType,
    ownerId: asset.ownerId,
    dayId: asset.dayId,
  });
  const createdAt = getExistingCreatedAt_(existing.rowObject, now);

  return upsertById_(FUTURELAB_CONFIG.SHEETS.ASSETS, "assetId", asset.assetId, {
    assetId: asset.assetId,
    assetType: asset.assetType,
    ownerType: asset.ownerType,
    ownerId: asset.ownerId,
    dayId: asset.dayId,
    blockId: asset.blockId,
    title: asset.title,
    description: asset.description,
    storageFileId: asset.storageFileId,
    storageUrl: asset.storageUrl,
    thumbnailUrl: asset.thumbnailUrl,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    capturedAt: asset.capturedAt,
    createdAt: createdAt,
    updatedAt: now,
  });
}

function findAssetById_(assetId) {
  const normalizedAssetId = assertId_(assetId, "ASSET_VALIDATION_ERROR", "assetId");
  return findRowByColumn_(FUTURELAB_CONFIG.SHEETS.ASSETS, "assetId", normalizedAssetId);
}

function formatAssetForResponse_(rowObject) {
  return rowObject ? Object.assign({}, rowObject) : null;
}

function validateExistingAssetIdentity_(existing, incoming) {
  if (!existing) {
    return;
  }

  if (
    String(existing.ownerType || "").trim() !== incoming.ownerType ||
    String(existing.ownerId || "").trim() !== incoming.ownerId
  ) {
    throw createApiError_(
      "ASSET_OWNER_MISMATCH",
      "기존 Asset의 소유자 정보와 요청 정보가 일치하지 않습니다."
    );
  }

  if (
    String(existing.dayId || "").trim() !== incoming.dayId ||
    String(existing.assetType || "").trim() !== incoming.assetType
  ) {
    throw createApiError_(
      "ASSET_ID_CONFLICT",
      "기존 Asset의 연구일 또는 유형과 요청 정보가 일치하지 않습니다."
    );
  }
}

function validateDay01MakeCodeAssetId_(assetId, assetType, ownerId, dayId, storageUrl) {
  if (assetType !== "webpage_link" || dayId !== "day01") {
    return;
  }

  const expectedAssetId = "asset_" + ownerId + "_" + dayId + "_makecode";
  const mentionsMakeCodeHost = /makecode\.microbit\.org/i.test(storageUrl);

  if (assetId !== expectedAssetId && !mentionsMakeCodeHost) {
    return;
  }

  assertApi_(
    assetId === expectedAssetId,
    "ASSET_ID_CONFLICT",
    "Day01 MakeCode Asset ID가 학생·연구일 규칙과 일치하지 않습니다."
  );

  assertApi_(
    /^https:\/\/makecode\.microbit\.org(?:[/?#]|$)/i.test(storageUrl),
    "INVALID_ASSET_URL",
    "Day01 MakeCode 공유 주소는 https://makecode.microbit.org/ 주소여야 합니다."
  );
}

function validateVideoAssetPayload_(asset) {
  if (asset.assetType !== "video") {
    return;
  }

  const expectedAssetId = "asset_" + asset.ownerId + "_" + asset.dayId + "_video";

  assertApi_(
    asset.assetId === expectedAssetId,
    "ASSET_ID_CONFLICT",
    "video Asset ID가 학생·연구일 규칙과 일치하지 않습니다."
  );
  assertApi_(
    isAllowedVideoMimeType_(asset.mimeType),
    "INVALID_VIDEO_MIME_TYPE",
    "허용되지 않는 영상 형식입니다."
  );
  assertValidDriveFileId_(asset.storageFileId, "storageFileId");
  assertApi_(
    asset.storageUrl === makeDrivePreviewUrl_(asset.storageFileId),
    "INVALID_ASSET_URL",
    "영상 storageUrl은 Drive preview URL이어야 합니다."
  );
}
