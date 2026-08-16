function getStudents_() {
  const studentsTable = readSheetTable_(FUTURELAB_CONFIG.SHEETS.STUDENTS);
  const worksTable = readSheetTable_(FUTURELAB_CONFIG.SHEETS.WORKS);

  assertRequiredHeaders_(studentsTable, FUTURELAB_CONFIG.SHEETS.STUDENTS, [
    "studentId",
    "studentName",
    "workId",
    "active",
  ]);
  assertRequiredHeaders_(worksTable, FUTURELAB_CONFIG.SHEETS.WORKS, ["workId", "studentId"]);

  validateStudentDataIntegrity_(studentsTable);
  validateWorkDataIntegrity_(worksTable);

  const worksByWorkId = buildRowsByKey_(worksTable, "workId", {
    duplicateCode: "DUPLICATE_WORK_ID",
    duplicateMessage: "중복된 workId가 있습니다.",
  });
  const students = [];

  studentsTable.rows.forEach((rowValues) => {
    const rowObject = rowObjectFromValues_(studentsTable.headers, rowValues);
    const studentId = normalizeId_(rowObject.studentId);

    if (!studentId) {
      return;
    }

    if (!isActiveSheetValue_(rowObject.active)) {
      return;
    }

    const studentName = String(rowObject.studentName || "").trim();
    const workId = normalizeId_(rowObject.workId);

    assertId_(studentId, "INVALID_STUDENT_DATA", "studentId");
    assertApi_(studentName, "INVALID_STUDENT_DATA", "studentName 값이 필요합니다.");
    assertId_(workId, "INVALID_STUDENT_DATA", "workId");

    const workRow = worksByWorkId[workId];
    assertApi_(workRow, "WORK_NOT_FOUND", "작품 정보를 찾을 수 없습니다.");
    assertApi_(
      normalizeId_(workRow.studentId) === studentId,
      "WORK_STUDENT_MISMATCH",
      "학생과 작품 정보가 일치하지 않습니다."
    );

    students.push({
      studentId: studentId,
      studentName: studentName,
      workId: workId,
    });
  });

  return {
    students: students,
    count: students.length,
  };
}

function validateStudentDataIntegrity_(studentsTable) {
  const seenStudentIds = {};
  const seenWorkIds = {};

  studentsTable.rows.forEach((rowValues) => {
    const rowObject = rowObjectFromValues_(studentsTable.headers, rowValues);
    const studentId = normalizeId_(rowObject.studentId);

    if (!studentId) {
      return;
    }

    assertId_(studentId, "INVALID_STUDENT_DATA", "studentId");
    assertApi_(!seenStudentIds[studentId], "DUPLICATE_STUDENT_ID", "중복된 studentId가 있습니다.");
    seenStudentIds[studentId] = true;

    const workId = normalizeId_(rowObject.workId);

    if (!workId) {
      return;
    }

    assertId_(workId, "INVALID_STUDENT_DATA", "workId");
    assertApi_(!seenWorkIds[workId], "DUPLICATE_WORK_ID", "중복된 workId가 있습니다.");
    seenWorkIds[workId] = true;
  });
}

function validateWorkDataIntegrity_(worksTable) {
  buildRowsByKey_(worksTable, "workId", {
    duplicateCode: "DUPLICATE_WORK_ID",
    duplicateMessage: "중복된 workId가 있습니다.",
  });
  assertUniqueRowsByKey_(worksTable, "studentId", {
    duplicateCode: "DUPLICATE_WORK_STUDENT_ID",
    duplicateMessage: "학생 1명에 여러 작품이 연결되어 있습니다.",
  });
}

function assertRequiredHeaders_(table, sheetName, headers) {
  headers.forEach((header) => {
    assertApi_(
      table.headerMap[header] !== undefined,
      "SERVER_ERROR",
      sheetName + " 시트에 " + header + " 헤더가 없습니다."
    );
  });
}

function buildRowsByKey_(table, keyColumn, options) {
  const result = {};

  table.rows.forEach((rowValues) => {
    const rowObject = rowObjectFromValues_(table.headers, rowValues);
    const key = normalizeId_(rowObject[keyColumn]);

    if (!key) {
      return;
    }

    assertApi_(
      !result[key],
      options.duplicateCode,
      options.duplicateMessage
    );
    result[key] = rowObject;
  });

  return result;
}

function assertUniqueRowsByKey_(table, keyColumn, options) {
  const seen = {};

  table.rows.forEach((rowValues) => {
    const rowObject = rowObjectFromValues_(table.headers, rowValues);
    const key = normalizeId_(rowObject[keyColumn]);

    if (!key) {
      return;
    }

    assertApi_(
      !seen[key],
      options.duplicateCode,
      options.duplicateMessage
    );
    seen[key] = true;
  });
}
