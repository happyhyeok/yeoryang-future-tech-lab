function getRequiredPayload_(payload) {
  assertApi_(isPlainObject_(payload), "INVALID_REQUEST", "payload가 필요합니다.");
  return payload;
}

function validateStudent_(studentId) {
  const normalizedStudentId = assertId_(studentId, "STUDENT_NOT_FOUND", "studentId");
  const found = findRowByColumn_(
    FUTURELAB_CONFIG.SHEETS.STUDENTS,
    "studentId",
    normalizedStudentId
  );

  assertApi_(found.rowObject, "STUDENT_NOT_FOUND", "학생 정보를 찾을 수 없습니다.");
  assertApi_(isActiveSheetValue_(found.rowObject.active), "STUDENT_INACTIVE", "비활성 학생입니다.");

  return found.rowObject;
}

function validateWorkForStudent_(studentId, workId) {
  const normalizedWorkId = assertId_(workId, "WORK_NOT_FOUND", "workId");
  const found = findRowByColumn_(FUTURELAB_CONFIG.SHEETS.WORKS, "workId", normalizedWorkId);

  assertApi_(found.rowObject, "WORK_NOT_FOUND", "작품 정보를 찾을 수 없습니다.");

  if (Object.prototype.hasOwnProperty.call(found.rowObject, "active")) {
    assertApi_(isActiveSheetValue_(found.rowObject.active), "WORK_NOT_FOUND", "비활성 작품입니다.");
  }

  assertApi_(
    String(found.rowObject.studentId || "").trim() === studentId,
    "WORK_STUDENT_MISMATCH",
    "학생과 작품 정보가 일치하지 않습니다."
  );

  return found.rowObject;
}

function validateResearchDay_(dayId) {
  const normalizedDayId = assertId_(dayId, "DAY_NOT_FOUND", "dayId");
  const found = findRowByColumn_(FUTURELAB_CONFIG.SHEETS.RESEARCH_DAYS, "dayId", normalizedDayId);

  assertApi_(found.rowObject, "DAY_NOT_FOUND", "연구일 정보를 찾을 수 없습니다.");
  assertApi_(isActiveSheetValue_(found.rowObject.active), "DAY_INACTIVE", "비활성 연구일입니다.");

  return found.rowObject;
}

function validateResearchDate_(payloadDate, dayRow) {
  const actualDate = normalizeSheetDate_(payloadDate);
  const expectedDate =
    normalizeSheetDate_(dayRow.date || dayRow.dayDate || dayRow.researchDate) ||
    (String(dayRow.dayId || "") === "day01" ? FUTURELAB_CONFIG.DEFAULT_DAY01_DATE : "");

  assertApi_(actualDate, "INVALID_REQUEST", "date 값이 필요합니다.");

  if (expectedDate) {
    assertApi_(
      actualDate === expectedDate,
      "INVALID_REQUEST",
      "요청 date가 연구일 시트의 날짜와 일치하지 않습니다."
    );
  }

  return actualDate;
}
