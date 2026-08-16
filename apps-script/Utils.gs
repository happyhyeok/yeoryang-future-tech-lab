function createApiError_(code, message) {
  const error = new Error(message || code);
  error.code = code || "SERVER_ERROR";
  error.isApiError = true;
  return error;
}

function assertApi_(condition, code, message) {
  if (!condition) {
    throw createApiError_(code, message);
  }
}

function normalizeId_(value) {
  return String(value || "").trim();
}

function assertId_(value, code, label) {
  const id = normalizeId_(value);
  assertApi_(/^[A-Za-z0-9_-]{1,80}$/.test(id), code, label + " 형식이 올바르지 않습니다.");
  return id;
}

function isPlainObject_(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function ensurePlainObject_(value, code, label) {
  assertApi_(isPlainObject_(value), code, label + " 값은 객체여야 합니다.");
  return value;
}

function ensureArray_(value, code, label, maxItems) {
  assertApi_(Array.isArray(value), code, label + " 값은 배열이어야 합니다.");

  const limit =
    maxItems === undefined || maxItems === null
      ? FUTURELAB_CONFIG.LIMITS.ARRAY_ITEMS
      : maxItems;
  assertApi_(
    value.length <= limit,
    "PAYLOAD_TOO_LARGE",
    label + " 배열 항목이 너무 많습니다."
  );

  return value;
}

function assertMaxLength_(value, maxLength, label, code) {
  const text = String(value === undefined || value === null ? "" : value);

  assertApi_(
    text.length <= maxLength,
    code || "FIELD_TOO_LONG",
    label + " 값이 너무 깁니다."
  );

  return text;
}

function stringifyJson_(value, maxLength, label) {
  try {
    const json = JSON.stringify(value === undefined ? null : value);
    const limit =
      maxLength === undefined || maxLength === null
        ? FUTURELAB_CONFIG.LIMITS.JSON_CELL
        : maxLength;

    assertMaxLength_(json, limit, label || "JSON", "PAYLOAD_TOO_LARGE");

    return json;
  } catch (error) {
    if (error && error.isApiError) {
      throw error;
    }

    throw createApiError_("INVALID_JSON", "JSON으로 저장할 수 없는 값입니다.");
  }
}

function parseJsonCell_(value, fallback) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function requireBoolean_(value, code, label) {
  assertApi_(typeof value === "boolean", code, label + " 값은 Boolean이어야 합니다.");
  return value;
}

function isActiveSheetValue_(value) {
  if (value === true) {
    return true;
  }

  return String(value || "").trim().toUpperCase() === "TRUE";
}

function normalizeSheetDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, FUTURELAB_CONFIG.TIMEZONE, "yyyy-MM-dd");
  }

  const text = String(value || "").trim();
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : text;
}

function formatServerDateTime_(date) {
  return Utilities.formatDate(date || new Date(), FUTURELAB_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss") + "+09:00";
}

function escapeSheetFormulaText_(value) {
  const text = String(value === undefined || value === null ? "" : value);

  if (/^[=+\-@]/.test(text)) {
    return "'" + text;
  }

  return text;
}

function cleanFreeText_(value, maxLength, label) {
  const text = String(value || "").trim();
  const limit =
    maxLength === undefined || maxLength === null ? FUTURELAB_CONFIG.LIMITS.TEXT : maxLength;

  assertMaxLength_(text, limit, label || "텍스트", "FIELD_TOO_LONG");

  return escapeSheetFormulaText_(text);
}

function cleanUrlText_(value, label) {
  return cleanFreeText_(value, FUTURELAB_CONFIG.LIMITS.URL, label || "URL");
}

function ensureAllowedValue_(value, allowedValues, code, label) {
  assertApi_(allowedValues.indexOf(value) !== -1, code, label + " 값이 허용 범위를 벗어났습니다.");
  return value;
}

function toNonNegativeInteger_(value, code, label) {
  const numberValue = Number(value);
  assertApi_(
    Number.isInteger(numberValue) && numberValue >= 0,
    code,
    label + " 값은 0 이상의 정수여야 합니다."
  );
  return numberValue;
}

function toNumberInRange_(value, min, max, code, label) {
  const numberValue = Number(value);
  assertApi_(
    Number.isFinite(numberValue) && numberValue >= min && numberValue <= max,
    code,
    label + " 값이 허용 범위를 벗어났습니다."
  );
  return numberValue;
}

function getObjectValue_(objectValue, key) {
  return objectValue && Object.prototype.hasOwnProperty.call(objectValue, key)
    ? objectValue[key]
    : "";
}
