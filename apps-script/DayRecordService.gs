function getDayRecord_(params) {
  const studentId = assertId_(params.studentId, "STUDENT_NOT_FOUND", "studentId");
  const dayId = assertId_(params.dayId, "DAY_NOT_FOUND", "dayId");

  validateStudent_(studentId);
  validateResearchDay_(dayId);

  const dayRecordId = makeDayRecordId_(studentId, dayId);
  const found = findRowByColumn_(
    FUTURELAB_CONFIG.SHEETS.DAY_RECORDS,
    "dayRecordId",
    dayRecordId
  );

  const dayRecord = found.rowObject ? formatDayRecordForResponse_(found.rowObject) : null;

  return {
    dayRecord: dayRecord,
    assets: dayRecord ? getDayRecordAssets_(dayRecord, studentId, dayId) : [],
  };
}

function saveDayRecord_(payload) {
  const body = getRequiredPayload_(payload);
  const studentId = assertId_(body.studentId, "STUDENT_NOT_FOUND", "studentId");
  const workId = assertId_(body.workId, "WORK_NOT_FOUND", "workId");
  const dayId = assertId_(body.dayId, "DAY_NOT_FOUND", "dayId");

  validateStudent_(studentId);
  validateWorkForStudent_(studentId, workId);
  const dayRow = validateResearchDay_(dayId);
  const date = validateResearchDate_(body.date, dayRow);

  const blockProgress = ensurePlainObject_(body.blockProgress, "INVALID_REQUEST", "blockProgress");
  validateBlockProgress_(blockProgress);
  const activities = ensureArray_(body.activities || [], "INVALID_REQUEST", "activities");
  const personalEvidenceRefs = ensureArray_(
    body.personalEvidenceRefs || [],
    "INVALID_REQUEST",
    "personalEvidenceRefs"
  );
  const commonEvidenceRefs = ensureArray_(
    body.commonEvidenceRefs || [],
    "INVALID_REQUEST",
    "commonEvidenceRefs"
  );
  const minimumCompleted = requireBoolean_(body.minimumCompleted, "INVALID_REQUEST", "minimumCompleted");
  const completionLevel = ensureAllowedValue_(
    String(body.completionLevel || ""),
    ["", "minimum", "basic", "advanced"],
    "INVALID_COMPLETION_LEVEL",
    "completionLevel"
  );
  const status = ensureAllowedValue_(
    String(body.status || ""),
    ["not_started", "in_progress", "completed", "needs_review"],
    "INVALID_STATUS",
    "status"
  );
  const dayState = normalizeDayStateIdentity_(
    ensurePlainObject_(body.dayState || body.dayStateJson || {}, "INVALID_JSON", "dayState"),
    studentId,
    workId,
    dayId
  );
  const dayRecordId = makeDayRecordId_(studentId, dayId);
  const now = formatServerDateTime_(new Date());
  const lock = LockService.getScriptLock();

  lock.waitLock(10000);

  try {
    validatePersonalEvidenceRefs_(personalEvidenceRefs, studentId, dayId);
    const existing = findRowByColumn_(
      FUTURELAB_CONFIG.SHEETS.DAY_RECORDS,
      "dayRecordId",
      dayRecordId
    );
    const createdAt = getExistingCreatedAt_(existing.rowObject, now);
    const rowObject = upsertById_(FUTURELAB_CONFIG.SHEETS.DAY_RECORDS, "dayRecordId", dayRecordId, {
      dayRecordId: dayRecordId,
      studentId: studentId,
      workId: workId,
      dayId: dayId,
      date: date,
      blockProgress: stringifyJson_(blockProgress, FUTURELAB_CONFIG.LIMITS.JSON_CELL, "blockProgress"),
      role: cleanFreeText_(body.role),
      activities: stringifyJson_(activities, FUTURELAB_CONFIG.LIMITS.JSON_CELL, "activities"),
      todayDecision: cleanFreeText_(body.todayDecision),
      discovery: cleanFreeText_(body.discovery),
      difficulty: cleanFreeText_(body.difficulty),
      changeMade: cleanFreeText_(body.changeMade),
      changeReason: cleanFreeText_(body.changeReason),
      nextAction: cleanFreeText_(body.nextAction),
      personalEvidenceRefs: stringifyJson_(
        personalEvidenceRefs,
        FUTURELAB_CONFIG.LIMITS.JSON_CELL,
        "personalEvidenceRefs"
      ),
      commonEvidenceRefs: stringifyJson_(
        commonEvidenceRefs,
        FUTURELAB_CONFIG.LIMITS.JSON_CELL,
        "commonEvidenceRefs"
      ),
      minimumCompleted: minimumCompleted,
      completionLevel: completionLevel,
      status: status,
      studentReflection: cleanFreeText_(body.studentReflection),
      dayStateJson: stringifyJson_(
        dayState,
        FUTURELAB_CONFIG.LIMITS.DAY_STATE_JSON,
        "dayStateJson"
      ),
      createdAt: createdAt,
      updatedAt: now,
    });

    SpreadsheetApp.flush();

    return {
      dayRecord: formatDayRecordForResponse_(rowObject),
    };
  } finally {
    lock.releaseLock();
  }
}

function makeDayRecordId_(studentId, dayId) {
  return "dayrec_" + studentId + "_" + dayId;
}

function normalizeDayStateIdentity_(dayState, studentId, workId, dayId) {
  const normalized = Object.assign({}, dayState);
  normalized.studentId = studentId;
  normalized.workId = workId;
  normalized.dayId = dayId;
  return normalized;
}

function validateBlockProgress_(blockProgress) {
  ["block01", "block02", "block03"].forEach((blockId) => {
    if (Object.prototype.hasOwnProperty.call(blockProgress, blockId)) {
      ensureAllowedValue_(
        String(blockProgress[blockId] || ""),
        ["not_started", "in_progress", "completed"],
        "INVALID_REQUEST",
        blockId
      );
    }
  });
}

function formatDayRecordForResponse_(rowObject) {
  const formatted = Object.assign({}, rowObject);
  formatted.blockProgress = parseJsonCell_(rowObject.blockProgress, {});
  formatted.activities = parseJsonCell_(rowObject.activities, []);
  formatted.personalEvidenceRefs = parseJsonCell_(rowObject.personalEvidenceRefs, []);
  formatted.commonEvidenceRefs = parseJsonCell_(rowObject.commonEvidenceRefs, []);
  formatted.dayStateJson = parseJsonCell_(rowObject.dayStateJson, {});
  formatted.minimumCompleted = rowObject.minimumCompleted === true || String(rowObject.minimumCompleted).toUpperCase() === "TRUE";
  return formatted;
}

function getDayRecordAssets_(dayRecord, studentId, dayId) {
  const refs = Array.isArray(dayRecord.personalEvidenceRefs) ? dayRecord.personalEvidenceRefs : [];
  const seen = {};
  const assets = [];

  refs.forEach((assetIdValue) => {
    const assetId = String(assetIdValue || "").trim();

    if (!assetId || seen[assetId]) {
      return;
    }

    seen[assetId] = true;

    const found = findAssetById_(assetId);

    if (!found.rowObject) {
      return;
    }

    if (!isAssetOwnedByDay_(found.rowObject, studentId, dayId)) {
      return;
    }

    assets.push(formatAssetForResponse_(found.rowObject));
  });

  return assets;
}

function validatePersonalEvidenceRefs_(refs, studentId, dayId) {
  refs.forEach((assetIdValue) => {
    const assetId = assertId_(assetIdValue, "INVALID_REQUEST", "personalEvidenceRefs");
    const found = findAssetById_(assetId);

    assertApi_(
      found.rowObject && isAssetOwnedByDay_(found.rowObject, studentId, dayId),
      "INVALID_EVIDENCE_REF",
      "학생 연구기록의 증거 Asset을 찾을 수 없습니다."
    );
  });
}

function isAssetOwnedByDay_(asset, studentId, dayId) {
  return Boolean(
    asset &&
      String(asset.ownerType || "").trim() === "student" &&
      String(asset.ownerId || "").trim() === studentId &&
      String(asset.dayId || "").trim() === dayId
  );
}
