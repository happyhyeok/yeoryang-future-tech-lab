function getSpreadsheet_() {
  return SpreadsheetApp.openById(getSpreadsheetId_());
}

function getSheet_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  assertApi_(sheet, "SERVER_ERROR", "시트를 찾을 수 없습니다: " + sheetName);
  return sheet;
}

function getHeaderRow_(sheet) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn < 1) {
    return [];
  }

  return sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map((value) => String(value || "").trim());
}

function buildHeaderMap_(headers) {
  return headers.reduce((map, header, index) => {
    if (header) {
      map[header] = index;
    }

    return map;
  }, {});
}

function readSheetTable_(sheetName) {
  const sheet = getSheet_(sheetName);
  const headers = getHeaderRow_(sheet);
  const headerMap = buildHeaderMap_(headers);
  const lastRow = sheet.getLastRow();
  const rowCount = Math.max(0, lastRow - 1);
  const rows = rowCount
    ? sheet.getRange(2, 1, rowCount, headers.length).getValues()
    : [];

  return {
    sheet: sheet,
    headers: headers,
    headerMap: headerMap,
    rows: rows,
  };
}

function rowObjectFromValues_(headers, rowValues) {
  return headers.reduce((objectValue, header, index) => {
    if (header) {
      objectValue[header] = rowValues[index];
    }

    return objectValue;
  }, {});
}

function findRowByColumn_(sheetName, idColumn, idValue) {
  const table = readSheetTable_(sheetName);
  const columnIndex = table.headerMap[idColumn];
  assertApi_(columnIndex !== undefined, "SERVER_ERROR", sheetName + " 시트에 " + idColumn + " 헤더가 없습니다.");

  for (let index = 0; index < table.rows.length; index += 1) {
    if (String(table.rows[index][columnIndex] || "").trim() === idValue) {
      return {
        sheet: table.sheet,
        headers: table.headers,
        headerMap: table.headerMap,
        rowNumber: index + 2,
        rowValues: table.rows[index],
        rowObject: rowObjectFromValues_(table.headers, table.rows[index]),
      };
    }
  }

  return {
    sheet: table.sheet,
    headers: table.headers,
    headerMap: table.headerMap,
    rowNumber: 0,
    rowValues: null,
    rowObject: null,
  };
}

function ensureSheetRowExists_(sheet, rowNumber) {
  const maxRows = sheet.getMaxRows();

  if (rowNumber > maxRows) {
    sheet.insertRowsAfter(maxRows, rowNumber - maxRows);
  }
}

function normalizeIdCellValue_(value) {
  return String(value || "").trim();
}

function findFirstEmptyIdRow_(sheet, headerMap, idColumn) {
  const columnIndex = headerMap[idColumn];
  assertApi_(
    columnIndex !== undefined,
    "SERVER_ERROR",
    sheet.getName() + " 시트에 " + idColumn + " 헤더가 없습니다."
  );

  const lastRow = Math.max(1, sheet.getLastRow());
  const rowCount = Math.max(0, lastRow - 1);

  if (rowCount) {
    const idValues = sheet.getRange(2, columnIndex + 1, rowCount, 1).getValues();

    for (let index = 0; index < idValues.length; index += 1) {
      if (!normalizeIdCellValue_(idValues[index][0])) {
        return index + 2;
      }
    }
  }

  return Math.max(2, lastRow + 1);
}

function upsertById_(sheetName, idColumn, idValue, values) {
  const found = findRowByColumn_(sheetName, idColumn, idValue);
  const rowValues = found.rowValues ? found.rowValues.slice() : new Array(found.headers.length).fill("");

  Object.keys(values).forEach((key) => {
    const columnIndex = found.headerMap[key];

    if (columnIndex !== undefined) {
      rowValues[columnIndex] = values[key];
    }
  });

  if (found.rowNumber) {
    found.sheet.getRange(found.rowNumber, 1, 1, found.headers.length).setValues([rowValues]);
  } else {
    const insertRowNumber = findFirstEmptyIdRow_(found.sheet, found.headerMap, idColumn);
    ensureSheetRowExists_(found.sheet, insertRowNumber);
    found.sheet.getRange(insertRowNumber, 1, 1, found.headers.length).setValues([rowValues]);
  }

  return rowObjectFromValues_(found.headers, rowValues);
}

function getExistingCreatedAt_(rowObject, now) {
  return rowObject && rowObject.createdAt ? rowObject.createdAt : now;
}

function compactDayRecordRows() {
  return runCompactDayRecordRows_({ dryRun: false });
}

function previewCompactDayRecordRows() {
  return runCompactDayRecordRows_({ dryRun: true });
}

function runCompactDayRecordRows_(options) {
  const lock = LockService.getScriptLock();

  lock.waitLock(10000);

  try {
    return compactSheetDataRows_(
      FUTURELAB_CONFIG.SHEETS.DAY_RECORDS,
      "dayRecordId",
      FUTURELAB_CONFIG.REQUIRED_HEADERS.DAY_RECORDS,
      options
    );
  } finally {
    lock.releaseLock();
  }
}

function compactSheetDataRows_(sheetName, idColumn, requiredHeaders, options) {
  const table = readSheetTable_(sheetName);
  const report = {
    ok: false,
    dryRun: Boolean(options && options.dryRun),
    sheetName: sheetName,
    idColumn: idColumn,
    recordsFound: 0,
    moved: 0,
    firstDataRow: 0,
    lastDataRow: 1,
    duplicateIds: [],
    missingHeaders: [],
    warnings: [],
    movedRows: [],
  };
  const headersToCheck = requiredHeaders && requiredHeaders.length ? requiredHeaders : [idColumn];

  report.missingHeaders = headersToCheck.filter((header) => table.headerMap[header] === undefined);

  if (report.missingHeaders.length) {
    report.error = "필수 헤더가 없어 정리 작업을 중단했습니다.";
    return report;
  }

  const idColumnIndex = table.headerMap[idColumn];
  const records = [];
  const seenIds = {};

  table.rows.forEach((rowValues, index) => {
    const rowNumber = index + 2;
    const id = normalizeIdCellValue_(rowValues[idColumnIndex]);

    if (!id) {
      if (hasMeaningfulValuesWithoutId_(rowValues, idColumnIndex)) {
        report.warnings.push(rowNumber + "행에 ID 없이 값이 있어 자동 정리 대상에서 제외했습니다.");
      }

      return;
    }

    if (seenIds[id]) {
      report.duplicateIds.push(id);
    } else {
      seenIds[id] = true;
    }

    records.push({
      id: id,
      rowNumber: rowNumber,
      rowValues: rowValues.slice(),
    });
  });

  report.recordsFound = records.length;
  report.firstDataRow = records.length ? 2 : 0;
  report.lastDataRow = records.length ? records.length + 1 : 1;
  report.duplicateIds = report.duplicateIds.filter(
    (id, index, duplicateIds) => duplicateIds.indexOf(id) === index
  );

  if (report.duplicateIds.length) {
    report.error = "중복 ID가 있어 정리 작업을 중단했습니다.";
    return report;
  }

  const unsafeTargetRows = findUnsafeCompactTargetRows_(table, idColumnIndex, records.length);

  if (unsafeTargetRows.length) {
    report.error = "대상 영역에 ID 없는 실제 값이 있어 정리 작업을 중단했습니다.";
    report.unsafeTargetRows = unsafeTargetRows;
    return report;
  }

  if (!records.length) {
    report.ok = true;
    return report;
  }

  records.forEach((record, index) => {
    const targetRow = index + 2;
    const moved = record.rowNumber !== targetRow;

    if (moved) {
      report.moved += 1;
    }

    report.movedRows.push({
      id: record.id,
      fromRow: record.rowNumber,
      toRow: targetRow,
      moved: moved,
    });
  });

  if (report.dryRun) {
    report.ok = true;
    return report;
  }

  ensureSheetRowExists_(table.sheet, report.lastDataRow);
  table.sheet
    .getRange(report.firstDataRow, 1, records.length, table.headers.length)
    .setValues(records.map((record) => record.rowValues));

  records.forEach((record) => {
    if (record.rowNumber > report.lastDataRow) {
      table.sheet.getRange(record.rowNumber, 1, 1, table.headers.length).clearContent();
    }
  });

  SpreadsheetApp.flush();
  report.ok = true;
  return report;
}

function findUnsafeCompactTargetRows_(table, idColumnIndex, recordCount) {
  const unsafeRows = [];

  for (let index = 0; index < recordCount; index += 1) {
    const rowValues = table.rows[index];

    if (!rowValues) {
      continue;
    }

    if (
      !normalizeIdCellValue_(rowValues[idColumnIndex]) &&
      hasMeaningfulValuesWithoutId_(rowValues, idColumnIndex)
    ) {
      unsafeRows.push(index + 2);
    }
  }

  return unsafeRows;
}

function hasMeaningfulValuesWithoutId_(rowValues, idColumnIndex) {
  return rowValues.some((value, index) => index !== idColumnIndex && isMeaningfulSheetValue_(value));
}

function isMeaningfulSheetValue_(value) {
  if (value === null || value === undefined || value === false) {
    return false;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed !== "" && trimmed.toUpperCase() !== "FALSE";
  }

  return true;
}
