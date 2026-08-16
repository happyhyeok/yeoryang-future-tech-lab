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
    found.sheet.appendRow(rowValues);
  }

  return rowObjectFromValues_(found.headers, rowValues);
}

function getExistingCreatedAt_(rowObject, now) {
  return rowObject && rowObject.createdAt ? rowObject.createdAt : now;
}
