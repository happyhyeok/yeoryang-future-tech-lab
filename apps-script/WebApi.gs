function doGet(e) {
  return handleApiRequest_("GET", e || {});
}

function doPost(e) {
  return handleApiRequest_("POST", e || {});
}

function handleApiRequest_(method, e) {
  const startedAt = Date.now();
  const previousMetrics = ACTIVE_REQUEST_METRICS;
  const metrics = {
    spreadsheetOpenMs: 0,
    sheetLookupMs: 0,
    getValuesMs: 0,
    getValuesCalls: 0,
    responseBuildMs: 0,
    tableReads: 0,
    cachedTableReads: 0,
    searchedRows: 0,
    rowSearchMs: 0,
    sheetTables: {},
    sheets: {},
  };
  ACTIVE_REQUEST_METRICS = metrics;
  let action = "";

  try {
    const request = parseRequest_(method, e);
    action = request.action;
    metrics.action = action;
    const data = dispatchAction_(request.action, request.payload, request.params);
    const responseStartedAt = Date.now();
    const response = successResponse_(data);
    metrics.responseBuildMs = Date.now() - responseStartedAt;
    return response;
  } catch (error) {
    return handleApiError_(error);
  } finally {
    if (["getStudents", "getDayRecord", "getLessonContext"].includes(action)) {
      console.log("[read-performance] " + JSON.stringify({
        action: action,
        totalMs: Date.now() - startedAt,
        spreadsheetOpenMs: metrics.spreadsheetOpenMs,
        sheetLookupMs: metrics.sheetLookupMs,
        getValuesMs: metrics.getValuesMs,
        getValuesCalls: metrics.getValuesCalls,
        responseBuildMs: metrics.responseBuildMs,
        tableReads: metrics.tableReads,
        cachedTableReads: metrics.cachedTableReads,
        searchedRows: metrics.searchedRows,
        rowSearchMs: metrics.rowSearchMs,
        studentDirectoryCache: metrics.studentDirectoryCache || "not-applicable",
      }));
    }
    ACTIVE_REQUEST_METRICS = previousMetrics;
  }
}

var ACTIVE_REQUEST_METRICS = null;

function recordRequestMetricDuration_(name, elapsedMs) {
  if (ACTIVE_REQUEST_METRICS) {
    ACTIVE_REQUEST_METRICS[name] = (ACTIVE_REQUEST_METRICS[name] || 0) + elapsedMs;
  }
}

function parseRequest_(method, e) {
  const params = (e && e.parameter) || {};

  if (method === "GET") {
    return {
      action: String(params.action || "").trim(),
      params: params,
      payload: {},
    };
  }

  const contents = e && e.postData && e.postData.contents ? e.postData.contents : "";
  assertApi_(contents, "INVALID_REQUEST", "POST body가 비어 있습니다.");
  assertMaxLength_(
    contents,
    FUTURELAB_CONFIG.LIMITS.VIDEO_REQUEST_BODY,
    "POST body",
    "PAYLOAD_TOO_LARGE"
  );

  let body;

  try {
    body = JSON.parse(contents);
  } catch (error) {
    throw createApiError_("INVALID_JSON", "POST body JSON을 파싱할 수 없습니다.");
  }

  assertApi_(isPlainObject_(body), "INVALID_REQUEST", "POST body는 객체여야 합니다.");

  const action = String(body.action || params.action || "").trim();

  if (action !== "uploadVideo") {
    assertMaxLength_(
      contents,
      FUTURELAB_CONFIG.LIMITS.REQUEST_BODY,
      "POST body",
      "PAYLOAD_TOO_LARGE"
    );
  }

  return {
    action: action,
    params: params,
    payload: body.payload || {},
  };
}

function dispatchAction_(action, payload, params) {
  switch (action) {
    case "ping":
      return ping_();
    case "getStudents":
      return getStudents_();
    case "getDayRecord":
      return getDayRecord_(params || {});
    case "getLessonContext":
      return getLessonContext_(params || {});
    case "saveDayRecord":
      return saveDayRecord_(payload || {});
    case "saveQuizResult":
      return saveQuizResult_(payload || {});
    case "upsertAsset":
      return upsertAsset_(payload || {});
    case "uploadVideo":
      return uploadVideo_(payload || {});
    default:
      throw createApiError_("INVALID_ACTION", "알 수 없는 action입니다: " + action);
  }
}

function ping_() {
  getSpreadsheet_().getId();

  return {
    service: getProjectId_(),
    version: FUTURELAB_CONFIG.SERVICE_VERSION,
  };
}
