function saveQuizResult_(payload) {
  const body = getRequiredPayload_(payload);
  const studentId = assertId_(body.studentId, "STUDENT_NOT_FOUND", "studentId");
  const dayId = assertId_(body.dayId, "DAY_NOT_FOUND", "dayId");
  const quizType = assertId_(body.quizType, "INVALID_QUIZ", "quizType");
  const quizVersion = String(body.quizVersion || "").trim();

  validateStudent_(studentId);
  validateResearchDay_(dayId);
  assertApi_(quizVersion, "INVALID_QUIZ", "quizVersion 값이 필요합니다.");

  const answers = ensurePlainObject_(body.answers || {}, "INVALID_QUIZ", "answers");
  const totalQuestions = toNonNegativeInteger_(body.totalQuestions, "INVALID_QUIZ", "totalQuestions");
  assertApi_(totalQuestions >= 1, "INVALID_QUIZ", "totalQuestions는 1 이상이어야 합니다.");
  const score = toNumberInRange_(body.score, 0, totalQuestions, "INVALID_QUIZ", "score");
  const completed = requireBoolean_(body.completed, "INVALID_QUIZ", "completed");
  let attemptCount = toNonNegativeInteger_(body.attemptCount || 0, "INVALID_QUIZ", "attemptCount");
  const quizResultId = makeQuizResultId_(studentId, dayId, quizType);
  const now = formatServerDateTime_(new Date());
  const lock = LockService.getScriptLock();

  lock.waitLock(10000);

  try {
    const existing = findRowByColumn_(
      FUTURELAB_CONFIG.SHEETS.QUIZ_RESULTS,
      "quizResultId",
      quizResultId
    );
    const existingAttemptCount = Number(existing.rowObject && existing.rowObject.attemptCount) || 0;
    const existingCompletedAt = existing.rowObject && existing.rowObject.completedAt;

    if (existingAttemptCount > attemptCount) {
      attemptCount = existingAttemptCount;
    }

    const rowObject = upsertById_(
      FUTURELAB_CONFIG.SHEETS.QUIZ_RESULTS,
      "quizResultId",
      quizResultId,
      {
        quizResultId: quizResultId,
        studentId: studentId,
        dayId: dayId,
        quizType: quizType,
        quizVersion: cleanFreeText_(quizVersion, FUTURELAB_CONFIG.LIMITS.TITLE, "quizVersion"),
        answersJson: stringifyJson_(
          answers,
          FUTURELAB_CONFIG.LIMITS.ANSWERS_JSON,
          "answersJson"
        ),
        score: score,
        totalQuestions: totalQuestions,
        attemptCount: attemptCount,
        completed: completed,
        completedAt: existingCompletedAt || (completed ? now : ""),
      }
    );

    SpreadsheetApp.flush();

    return {
      quizResult: formatQuizResultForResponse_(rowObject),
    };
  } finally {
    lock.releaseLock();
  }
}

function makeQuizResultId_(studentId, dayId, quizType) {
  return "quiz_" + studentId + "_" + dayId + "_" + quizType;
}

function formatQuizResultForResponse_(rowObject) {
  const formatted = Object.assign({}, rowObject);
  formatted.answersJson = parseJsonCell_(rowObject.answersJson, {});
  formatted.completed = rowObject.completed === true || String(rowObject.completed).toUpperCase() === "TRUE";
  formatted.score = Number(rowObject.score) || 0;
  formatted.totalQuestions = Number(rowObject.totalQuestions) || 0;
  formatted.attemptCount = Number(rowObject.attemptCount) || 0;
  return formatted;
}
