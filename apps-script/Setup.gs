function setupProject() {
  const spreadsheet = getSpreadsheet_();
  const report = {
    spreadsheetId: spreadsheet.getId(),
    scriptTimezone:
      typeof Session !== "undefined" && Session.getScriptTimeZone
        ? Session.getScriptTimeZone()
        : FUTURELAB_CONFIG.TIMEZONE,
    timezone: spreadsheet.getSpreadsheetTimeZone(),
    expectedTimezone: FUTURELAB_CONFIG.TIMEZONE,
    timezoneUpdated: false,
    sheets: {},
    day01Exists: false,
    activeStudentCount: 0,
    validStudentWorkCount: 0,
    studentWorkWarnings: [],
    warnings: [],
  };

  if (spreadsheet.getSpreadsheetTimeZone() !== FUTURELAB_CONFIG.TIMEZONE) {
    spreadsheet.setSpreadsheetTimeZone(FUTURELAB_CONFIG.TIMEZONE);
    report.timezone = FUTURELAB_CONFIG.TIMEZONE;
    report.timezoneUpdated = true;
  }

  Object.keys(FUTURELAB_CONFIG.SHEETS).forEach((key) => {
    const sheetName = FUTURELAB_CONFIG.SHEETS[key];
    let sheet = spreadsheet.getSheetByName(sheetName);
    const created = !sheet;

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    const missingHeaders = ensureRequiredHeaders_(sheet, FUTURELAB_CONFIG.REQUIRED_HEADERS[key] || []);
    report.sheets[sheetName] = {
      existed: !created,
      missingHeadersAdded: missingHeaders,
    };
  });

  const day01 = findRowByColumn_(FUTURELAB_CONFIG.SHEETS.RESEARCH_DAYS, "dayId", "day01");
  report.day01Exists = Boolean(day01.rowObject);

  const students = readSheetTable_(FUTURELAB_CONFIG.SHEETS.STUDENTS);
  const works = readSheetTable_(FUTURELAB_CONFIG.SHEETS.WORKS);
  validateStudentDataIntegrity_(students);
  validateWorkDataIntegrity_(works);

  const activeStudents = students.rows.filter((row) =>
    isActiveSheetValue_(getSetupCell_(students, row, "active"))
  );
  const worksByWorkId = buildSetupRowsByKey_(works, "workId");

  report.activeStudentCount = activeStudents.length;

  activeStudents.forEach((row) => {
    const studentId = String(getSetupCell_(students, row, "studentId") || "").trim();
    const studentName = String(getSetupCell_(students, row, "studentName") || "").trim();
    const workId = String(getSetupCell_(students, row, "workId") || "").trim();

    if (!studentId) {
      report.studentWorkWarnings.push("active 학생 행에 studentId가 없습니다.");
      return;
    }

    if (!studentName) {
      report.studentWorkWarnings.push(studentId + "의 studentName이 없습니다.");
      return;
    }

    if (!workId) {
      report.studentWorkWarnings.push(studentId + "의 workId가 없습니다.");
      return;
    }

    const workRow = worksByWorkId[workId];

    if (!workRow) {
      report.studentWorkWarnings.push(studentId + "의 " + workId + "가 02_작품에 없습니다.");
      return;
    }

    const workStudentId = String(getSetupCell_(works, workRow, "studentId") || "").trim();

    if (workStudentId !== studentId) {
      report.studentWorkWarnings.push(
        studentId + "의 " + workId + "가 02_작품에서 " + workStudentId + "에 연결되어 있습니다."
      );
      return;
    }

    report.validStudentWorkCount += 1;
  });

  if (report.scriptTimezone !== FUTURELAB_CONFIG.TIMEZONE) {
    report.warnings.push("Apps Script timezone이 Asia/Seoul이 아닙니다. appsscript.json 배포 설정을 확인하세요.");
  }

  if (!report.day01Exists) {
    report.warnings.push("03_연구일 시트에 day01 행이 없습니다.");
  }

  if (report.activeStudentCount === 0) {
    report.warnings.push("active=TRUE 학생이 없습니다.");
  }

  if (report.studentWorkWarnings.length) {
    report.warnings.push("학생-작품 관계를 확인해야 합니다.");
  }

  return report;
}

function getSetupCell_(table, row, header) {
  const index = table.headerMap[header];

  return index === undefined ? "" : row[index];
}

function buildSetupRowsByKey_(table, header) {
  const rowsByKey = {};

  table.rows.forEach((row) => {
    const key = String(getSetupCell_(table, row, header) || "").trim();

    if (key && rowsByKey[key] === undefined) {
      rowsByKey[key] = row;
    }
  });

  return rowsByKey;
}

function ensureRequiredHeaders_(sheet, requiredHeaders) {
  const added = [];

  if (!requiredHeaders.length) {
    return added;
  }

  if (sheet.getLastColumn() < 1) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    return requiredHeaders.slice();
  }

  requiredHeaders.forEach((header) => {
    let headers = getHeaderRow_(sheet);
    let headerMap = buildHeaderMap_(headers);

    if (headerMap[header] !== undefined) {
      return;
    }

    if (header === "dayStateJson" && headerMap.createdAt !== undefined) {
      const insertBeforeColumn = headerMap.createdAt + 1;
      sheet.insertColumnBefore(insertBeforeColumn);
      sheet.getRange(1, insertBeforeColumn).setValue(header);
    } else {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
    }

    added.push(header);
  });

  return added;
}
