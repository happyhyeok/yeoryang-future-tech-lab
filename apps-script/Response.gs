function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function successResponse_(data) {
  return jsonOutput_({
    ok: true,
    data: data === undefined ? {} : data,
    error: null,
  });
}

function errorResponse_(code, message) {
  return jsonOutput_({
    ok: false,
    data: null,
    error: {
      code: code || "SERVER_ERROR",
      message: message || "서버 오류가 발생했습니다.",
    },
  });
}

function handleApiError_(error) {
  if (error && error.isApiError) {
    return errorResponse_(error.code, error.message);
  }

  console.error(error && error.stack ? error.stack : error);
  return errorResponse_("SERVER_ERROR", "서버 처리 중 오류가 발생했습니다.");
}
