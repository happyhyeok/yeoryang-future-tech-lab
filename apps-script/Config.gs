const FUTURELAB_CONFIG = {
  PROJECT_ID: "futurelab2026",
  API_VERSION: 1,
  SERVICE_VERSION: "1.0",
  TIMEZONE: "Asia/Seoul",
  DEFAULT_DAY01_DATE: "2026-08-21",
  LIMITS: {
    REQUEST_BODY: 120000,
    VIDEO_REQUEST_BODY: 8600000,
    VIDEO_BYTES: 6 * 1024 * 1024,
    VIDEO_BASE64_CHARS: 8400000,
    TEXT: 2000,
    URL: 2000,
    TITLE: 200,
    DESCRIPTION: 1000,
    ARRAY_ITEMS: 100,
    JSON_CELL: 45000,
    ANSWERS_JSON: 20000,
    DAY_STATE_JSON: 45000,
  },
  SHEETS: {
    STUDENTS: "01_학생",
    WORKS: "02_작품",
    RESEARCH_DAYS: "03_연구일",
    LESSON_BLOCKS: "04_학습블록",
    DAY_RECORDS: "05_학생연구기록",
    QUIZ_RESULTS: "06_퀴즈결과",
    ASSETS: "09_자료파일",
  },
  REQUIRED_HEADERS: {
    STUDENTS: ["studentId", "studentName", "workId", "active"],
    WORKS: ["workId", "studentId"],
    RESEARCH_DAYS: ["dayId", "date", "active"],
    DAY_RECORDS: [
      "dayRecordId",
      "studentId",
      "workId",
      "dayId",
      "date",
      "blockProgress",
      "role",
      "activities",
      "todayDecision",
      "discovery",
      "difficulty",
      "changeMade",
      "changeReason",
      "nextAction",
      "personalEvidenceRefs",
      "commonEvidenceRefs",
      "minimumCompleted",
      "completionLevel",
      "status",
      "studentReflection",
      "dayStateJson",
      "createdAt",
      "updatedAt",
    ],
    QUIZ_RESULTS: [
      "quizResultId",
      "studentId",
      "dayId",
      "quizType",
      "quizVersion",
      "answersJson",
      "score",
      "totalQuestions",
      "attemptCount",
      "completed",
      "completedAt",
    ],
    ASSETS: [
      "assetId",
      "assetType",
      "ownerType",
      "ownerId",
      "dayId",
      "blockId",
      "title",
      "description",
      "storageFileId",
      "storageUrl",
      "thumbnailUrl",
      "fileName",
      "mimeType",
      "capturedAt",
      "createdAt",
      "updatedAt",
    ],
  },
  VIDEO_STORAGE: {
    ROOT_FOLDER_ID: "1Cg0tGtOnVDwlDvVFhhWHd9LEAG5fxd0U",
    ROOT_FOLDER_NAME: "여량초_미래기술연구소_영상증거",
    ALLOWED_MIME_TYPES: ["video/webm", "video/mp4"],
  },
};

function getScriptProperty_(key, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value || fallback || "";
}

function getSpreadsheetId_() {
  const spreadsheetId = getScriptProperty_("SPREADSHEET_ID");

  if (!spreadsheetId) {
    throw createApiError_(
      "SERVER_ERROR",
      "Script Properties에 SPREADSHEET_ID가 설정되어 있지 않습니다."
    );
  }

  return spreadsheetId;
}

function getProjectId_() {
  return getScriptProperty_("PROJECT_ID", FUTURELAB_CONFIG.PROJECT_ID);
}

function getApiVersion_() {
  return Number(getScriptProperty_("API_VERSION", FUTURELAB_CONFIG.API_VERSION));
}
