function upsertAsset_(payload) {
  const body = getRequiredPayload_(payload);
  const assetId = assertId_(body.assetId, "ASSET_VALIDATION_ERROR", "assetId");
  const assetType = ensureAllowedValue_(
    String(body.assetType || ""),
    ["webpage_link", "video"],
    "ASSET_VALIDATION_ERROR",
    "assetType"
  );
  const ownerType = ensureAllowedValue_(
    String(body.ownerType || ""),
    ["student"],
    "ASSET_VALIDATION_ERROR",
    "ownerType"
  );
  const ownerId = assertId_(body.ownerId, "ASSET_VALIDATION_ERROR", "ownerId");
  const dayId = assertId_(body.dayId, "DAY_NOT_FOUND", "dayId");
  const storageUrl = cleanUrlText_(body.storageUrl, "storageUrl");

  validateStudent_(ownerId);
  validateResearchDay_(dayId);
  validateDay01MakeCodeAssetId_(assetId, assetType, ownerId, dayId, storageUrl);

  const now = formatServerDateTime_(new Date());
  const lock = LockService.getScriptLock();

  lock.waitLock(10000);

  try {
    const existing = findRowByColumn_(FUTURELAB_CONFIG.SHEETS.ASSETS, "assetId", assetId);
    validateExistingAssetIdentity_(existing.rowObject, {
      assetType: assetType,
      ownerType: ownerType,
      ownerId: ownerId,
      dayId: dayId,
    });
    const createdAt = getExistingCreatedAt_(existing.rowObject, now);
    const rowObject = upsertById_(FUTURELAB_CONFIG.SHEETS.ASSETS, "assetId", assetId, {
      assetId: assetId,
      assetType: assetType,
      ownerType: ownerType,
      ownerId: ownerId,
      dayId: dayId,
      blockId: cleanFreeText_(body.blockId),
      title: cleanFreeText_(body.title, FUTURELAB_CONFIG.LIMITS.TITLE, "title"),
      description: cleanFreeText_(
        body.description,
        FUTURELAB_CONFIG.LIMITS.DESCRIPTION,
        "description"
      ),
      storageUrl: storageUrl,
      thumbnailUrl: cleanUrlText_(body.thumbnailUrl, "thumbnailUrl"),
      fileName: cleanFreeText_(body.fileName, FUTURELAB_CONFIG.LIMITS.TITLE, "fileName"),
      mimeType: cleanFreeText_(body.mimeType, FUTURELAB_CONFIG.LIMITS.TITLE, "mimeType"),
      capturedAt: cleanFreeText_(body.capturedAt, FUTURELAB_CONFIG.LIMITS.TITLE, "capturedAt"),
      createdAt: createdAt,
      updatedAt: now,
    });

    SpreadsheetApp.flush();

    return {
      asset: rowObject,
    };
  } finally {
    lock.releaseLock();
  }
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
