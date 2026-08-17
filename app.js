(function () {
  "use strict";

  const TOTAL_DAYS = window.RESEARCH_DAYS.length;
  const STORAGE_PREFIX = "futurelab2026";
  const CONFIG = Object.assign(
    {
      videoUploadEndpoint: "",
      videoPlaybackResolveEndpoint: "",
      appsScriptApiUrl: "",
      dayDates: {
        day01: "2026-08-21",
      },
      teacherMode: false,
      devMode: false,
      students: null,
    },
    window.FUTURE_LAB_CONFIG || {}
  );
  const DEFAULT_STUDENTS = [
    { studentId: "stu01", studentName: "김○○", workId: "work_stu01", active: true },
    { studentId: "stu02", studentName: "이○○", workId: "work_stu02", active: true },
    { studentId: "stu03", studentName: "박○○", workId: "work_stu03", active: true },
    { studentId: "stu04", studentName: "최○○", workId: "work_stu04", active: true },
    { studentId: "stu05", studentName: "정○○", workId: "work_stu05", active: true },
  ];
  const HAS_CONFIGURED_STUDENTS =
    Array.isArray(CONFIG.students) || Array.isArray(window.FUTURE_LAB_STUDENTS);
  const CONFIGURED_STUDENT_SOURCE = CONFIG.students || window.FUTURE_LAB_STUDENTS || [];
  const STUDENT_LOAD_ERROR_MESSAGE =
    "연구원 정보를 불러오지 못했습니다. 강사에게 알려 주세요.";
  const SESSION_KEYS = {
    studentId: "currentStudentId",
    studentName: "currentStudentName",
    workId: "currentWorkId",
  };
  const DAY01_RECORDING_SECONDS = 10;
  const DAY01_MAX_RECORDING_SECONDS = 15;
  const DAY01_UPLOAD_TIMEOUT_MS = 45000;
  const DAY01_MAX_VIDEO_BYTES = 6 * 1024 * 1024;
  const DAY01_RECORDER_BITS_PER_SECOND = 900000;
  const DAY01_SERVER_TIMEOUT_MS = 8000;
  const DAY01_SERVER_SAVE_DEBOUNCE_MS = 1200;
  const SAVE_STATUS = {
    saving: "저장 중...",
    saved: "✓ 저장됨",
    failed: "저장하지 못했어요",
    localSaved: "기기에 저장됨",
    localFailed: "기기에 저장하지 못했어요",
  };

  let activeDay = null;
  let activeDayState = null;
  let currentStudent = null;
  let currentStudentRecords = {};
  let pendingStudentId = "";
  let registeredStudents = [];
  let registeredStudentSource = "unloaded";
  let registeredStudentsMessage = "";
  let day01CameraStream = null;
  let day01Recorder = null;
  let day01RecordedChunks = [];
  let day01RecordedBlob = null;
  let day01RecordedUrl = "";
  let day01RecordedContext = null;
  let day01RecordingTimer = null;
  let day01RecordingStartedAt = 0;
  let day01UploadInFlight = false;
  let mediaRuntimeGeneration = 0;
  let day01RecorderContext = null;
  let pendingCameraContext = null;
  let draggedResearchOrderCard = null;
  let selectedResearchOrderCard = "";
  let day01NeedsInitialSave = false;
  const day01ServerSaveSlots = new Map();

  const elements = {
    appHeader: document.querySelector(".app-header"),
    labShell: document.querySelector("[data-lab-shell]"),
    identityGate: document.querySelector("[data-identity-gate]"),
    studentName: document.querySelector("[data-student-name]"),
    changeStudent: document.querySelector("[data-change-student]"),
    headerCurrent: document.querySelector("[data-header-current]"),
    saveState: document.querySelector("[data-save-state]"),
    location: document.querySelector("[data-current-location]"),
    intro: document.querySelector("[data-project-intro]"),
    phaseNotice: document.querySelector("[data-phase-notice]"),
    specialNotice: document.querySelector("[data-special-notice]"),
    researchDays: document.querySelector("[data-research-days]"),
    standardDay: document.querySelector("[data-standard-day]"),
  };

  function normalizeStudentList(students) {
    if (!Array.isArray(students)) {
      return [];
    }

    const normalizedStudents = students
      .map((student) => normalizeStudent(student))
      .filter(Boolean);
    const duplicateStudentIds = findDuplicateValues(
      normalizedStudents.map((student) => student.studentId)
    );
    const duplicateWorkIds = findDuplicateValues(
      normalizedStudents.map((student) => student.workId)
    );

    duplicateStudentIds.forEach((studentId) => console.error(`Duplicate studentId: ${studentId}`));
    duplicateWorkIds.forEach((workId) => console.error(`Duplicate workId: ${workId}`));

    return normalizedStudents.filter(
      (student) =>
        student.active !== false &&
        !duplicateStudentIds.has(student.studentId) &&
        !duplicateWorkIds.has(student.workId)
    );
  }

  function findDuplicateValues(values) {
    const seen = new Set();
    const duplicates = new Set();

    values.forEach((value) => {
      if (seen.has(value)) {
        duplicates.add(value);
      } else {
        seen.add(value);
      }
    });

    return duplicates;
  }

  function normalizeStudent(student) {
    if (!student) {
      return null;
    }

    const studentId = String(student.studentId || student.id || "").trim();
    const studentName = String(student.studentName || student.name || "").trim();
    const workId = String(student.workId || student.work || "").trim();

    if (
      !/^[A-Za-z0-9_-]{1,40}$/.test(studentId) ||
      !studentName ||
      !/^[A-Za-z0-9_-]{1,60}$/.test(workId)
    ) {
      return null;
    }

    return {
      studentId,
      studentName,
      workId,
      active: student.active !== false,
    };
  }

  function isDevelopmentMode() {
    const hostname = window.location.hostname;

    return (
      CONFIG.devMode === true ||
      window.location.protocol === "file:" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    );
  }

  function formatResearcherName(student) {
    if (!student || !student.studentName) {
      return "";
    }

    return /연구원$/.test(student.studentName)
      ? student.studentName
      : `${student.studentName} 연구원`;
  }

  function findStudentById(studentId) {
    return registeredStudents.find((student) => student.studentId === studentId) || null;
  }

  function getConfiguredStudentSource() {
    return CONFIGURED_STUDENT_SOURCE;
  }

  function isConfiguredStudentId(studentId) {
    if (!HAS_CONFIGURED_STUDENTS || !studentId) {
      return false;
    }

    return getConfiguredStudentSource().some((student) => {
      const configuredStudentId = String((student && (student.studentId || student.id)) || "").trim();

      return configuredStudentId === studentId;
    });
  }

  function isAuthoritativeStudentSource() {
    return (
      registeredStudentSource === "server" ||
      registeredStudentSource === "server-error" ||
      registeredStudentSource === "config"
    );
  }

  function setRegisteredStudents(students, source) {
    registeredStudents = normalizeStudentList(students);
    registeredStudentSource = source;
    registeredStudentsMessage = "";
  }

  function readSessionValue(key) {
    try {
      return window.sessionStorage.getItem(key) || "";
    } catch (error) {
      console.warn("student session read failed", error);
      return "";
    }
  }

  function writeSessionValue(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn("student session write failed", error);
    }
  }

  function removeSessionValue(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.warn("student session remove failed", error);
    }
  }

  function getCurrentStudent() {
    return currentStudent ? Object.assign({}, currentStudent) : null;
  }

  function setCurrentStudent(student, options = {}) {
    const normalized = normalizeStudent(student);

    if (!normalized) {
      return false;
    }

    currentStudent = normalized;
    pendingStudentId = normalized.studentId;
    loadCurrentStudentRecords();

    if (options.persist !== false) {
      writeSessionValue(SESSION_KEYS.studentId, normalized.studentId);
      writeSessionValue(SESSION_KEYS.studentName, normalized.studentName);
      writeSessionValue(SESSION_KEYS.workId, normalized.workId);
    }

    return true;
  }

  function clearCurrentStudent() {
    currentStudent = null;
    currentStudentRecords = {};
    removeSessionValue(SESSION_KEYS.studentId);
    removeSessionValue(SESSION_KEYS.studentName);
    removeSessionValue(SESSION_KEYS.workId);
  }

  function isStudentSelected() {
    return Boolean(currentStudent);
  }

  function getStudentFromSession() {
    const studentId = readSessionValue(SESSION_KEYS.studentId);
    const studentName = readSessionValue(SESSION_KEYS.studentName);
    const workId = readSessionValue(SESSION_KEYS.workId);
    const registeredStudent = findStudentById(studentId);

    if (registeredStudent) {
      return registeredStudent;
    }

    if (isAuthoritativeStudentSource()) {
      return null;
    }

    if (isConfiguredStudentId(studentId)) {
      return null;
    }

    return isDevelopmentMode() ? normalizeStudent({ studentId, studentName, workId }) : null;
  }

  function getDevelopmentStudentFromUrl() {
    if (!isDevelopmentMode()) {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const studentId = String(params.get("studentId") || "").trim();

    if (!/^[A-Za-z0-9_-]{1,40}$/.test(studentId)) {
      return null;
    }

    const registeredStudent = findStudentById(studentId);

    if (registeredStudent) {
      return registeredStudent;
    }

    if (isAuthoritativeStudentSource() || isConfiguredStudentId(studentId)) {
      return null;
    }

    return {
      studentId,
      studentName: "개발 연구원",
      workId: `work_${studentId}`,
    };
  }

  function restoreStudentContext() {
    const developmentStudent = getDevelopmentStudentFromUrl();

    if (developmentStudent && setCurrentStudent(developmentStudent)) {
      return true;
    }

    const sessionStudent = getStudentFromSession();

    if (sessionStudent && setCurrentStudent(sessionStudent)) {
      return true;
    }

    clearCurrentStudent();
    return false;
  }

  function loadCurrentStudentRecords() {
    const student = getCurrentStudent();

    if (!student) {
      currentStudentRecords = {};
      return;
    }

    const recordsByStudent =
      window.STUDENT_DAY_RECORDS_BY_STUDENT || window.STUDENT_RECORDS_BY_STUDENT || {};
    const sharedRecords = window.STUDENT_DAY_RECORDS || {};
    const sharedRecordsStudentId =
      window.STUDENT_DAY_RECORDS_STUDENT_ID || sharedRecords.studentId || "";
    const sharedRecordsWorkId = window.STUDENT_DAY_RECORDS_WORK_ID || sharedRecords.workId || "";

    currentStudentRecords =
      recordsByStudent[student.studentId] ||
      recordsByStudent[student.workId] ||
      (sharedRecordsStudentId === student.studentId || sharedRecordsWorkId === student.workId
        ? sharedRecords
        : {});
  }

  function getCurrentDay() {
    const params = new URLSearchParams(window.location.search);
    const requestedDay = Number(params.get("day"));
    const dayNo =
      Number.isInteger(requestedDay) && requestedDay >= 1 && requestedDay <= TOTAL_DAYS
        ? requestedDay
        : 1;

    return window.RESEARCH_DAYS.find((day) => day.dayNo === dayNo) || window.RESEARCH_DAYS[0];
  }

  function getPreviousDay(currentDay) {
    return window.RESEARCH_DAYS.find((day) => day.dayNo === currentDay.dayNo - 1);
  }

  function getNextDay(currentDay) {
    return window.RESEARCH_DAYS.find((day) => day.dayNo === currentDay.dayNo + 1);
  }

  function getLessonForDay(currentDay) {
    return window.DAY_LESSONS ? window.DAY_LESSONS[currentDay.dayId] : null;
  }

  function getStudentId() {
    const student = getCurrentStudent();

    return student ? student.studentId : "";
  }

  function getWorkId() {
    const student = getCurrentStudent();

    return student ? student.workId : "";
  }

  function getStorageKey(dayId) {
    const studentId = getStudentId();

    return studentId ? `${STORAGE_PREFIX}:${studentId}:${dayId}` : "";
  }

  function getAppsScriptApiUrl() {
    return String(
      CONFIG.appsScriptApiUrl || CONFIG.apiUrl || CONFIG.dayRecordEndpoint || ""
    ).trim();
  }

  function isDay01ServerSyncEnabled() {
    return Boolean(getAppsScriptApiUrl());
  }

  function getConfiguredDayDate(currentDay) {
    const dayDates = CONFIG.dayDates || {};

    return (
      currentDay.date ||
      currentDay.researchDate ||
      dayDates[currentDay.dayId] ||
      (currentDay.dayId === "day01" ? "2026-08-21" : "")
    );
  }

  function cloneJsonValue(value, fallback) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return fallback;
    }
  }

  function writeDayStateToLocalStorage(currentDay, state) {
    const storageKey = getStorageKey(currentDay.dayId);

    if (!storageKey) {
      return false;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  }

  function createApiUrl(action, params = {}) {
    const apiUrl = new URL(getAppsScriptApiUrl());
    apiUrl.searchParams.set("action", action);

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        apiUrl.searchParams.set(key, params[key]);
      }
    });

    return apiUrl.href;
  }

  async function callAppsScriptApi(action, options = {}) {
    const timeout = createTimeoutSignal(options.timeoutMs || DAY01_SERVER_TIMEOUT_MS);
    const method = options.method || "POST";

    try {
      const response =
        method === "GET"
          ? await fetch(createApiUrl(action, options.params), {
              signal: timeout.signal,
            })
          : await fetch(getAppsScriptApiUrl(), {
              method: "POST",
              headers: {
                "Content-Type": "text/plain;charset=utf-8",
              },
              body: JSON.stringify({
                action,
                payload: options.payload || {},
              }),
              signal: timeout.signal,
            });

      if (!response.ok) {
        throw new Error(`Apps Script ${action} failed: ${response.status}`);
      }

      const text = await response.text();
      const result = JSON.parse(text);

      if (!result.ok) {
        const error = new Error(result.error ? result.error.message : `${action} failed`);
        error.code = result.error ? result.error.code : "SERVER_ERROR";
        throw error;
      }

      return result.data;
    } finally {
      timeout.clear();
    }
  }

  async function loadRegisteredStudents() {
    if (getAppsScriptApiUrl()) {
      try {
        const data = await callAppsScriptApi("getStudents", {
          method: "GET",
          timeoutMs: DAY01_SERVER_TIMEOUT_MS,
        });
        const serverStudents = data && Array.isArray(data.students) ? data.students : [];
        const normalizedStudents = normalizeStudentList(serverStudents);

        if (normalizedStudents.length !== serverStudents.length) {
          throw new Error("Apps Script getStudents returned an invalid student list.");
        }

        registeredStudents = normalizedStudents;
        registeredStudentSource = "server";
        registeredStudentsMessage = registeredStudents.length ? "" : STUDENT_LOAD_ERROR_MESSAGE;
        return true;
      } catch (error) {
        console.warn("student list load failed", error);
        registeredStudents = [];
        registeredStudentSource = "server-error";
        registeredStudentsMessage = STUDENT_LOAD_ERROR_MESSAGE;
        return false;
      }
    }

    if (!isDevelopmentMode()) {
      registeredStudents = [];
      registeredStudentSource = "server-error";
      registeredStudentsMessage = STUDENT_LOAD_ERROR_MESSAGE;
      return false;
    }

    setRegisteredStudents(
      HAS_CONFIGURED_STUDENTS ? getConfiguredStudentSource() : DEFAULT_STUDENTS,
      HAS_CONFIGURED_STUDENTS ? "config" : "default"
    );

    if (!registeredStudents.length) {
      registeredStudentsMessage = STUDENT_LOAD_ERROR_MESSAGE;
    }

    return true;
  }

  function uniqueItems(items) {
    return Array.from(new Set((items || []).filter(Boolean)));
  }

  function normalizeResearchOrder(order) {
    const activity = getResearchOrderActivity();

    if (!activity || !Array.isArray(order) || !order.length) {
      return [];
    }

    const validIds = activity.steps.map((step) => step.id);
    const seen = new Set();
    const normalized = order.slice(0, validIds.length).map((itemId) => {
      const value = String(itemId || "");

      if (!value || !validIds.includes(value) || seen.has(value)) {
        return "";
      }

      seen.add(value);
      return value;
    });

    while (normalized.length < validIds.length) {
      normalized.push("");
    }

    return normalized;
  }

  function shuffleItems(items) {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
  }

  function ensureProblemHelpCardOrder(state) {
    const activity = getCardMatchActivity();

    if (!activity || !state.problemHelpMatch) {
      return false;
    }

    const currentOrder = state.problemHelpMatch.cardOrder || {};
    const nextOrder = {};
    let changed = false;

    activity.groups.forEach((group) => {
      const cardIds = group.cards.map((card) => card.id);
      const savedIds = Array.isArray(currentOrder[group.id])
        ? currentOrder[group.id].filter((cardId) => cardIds.includes(cardId))
        : [];
      const missingIds = cardIds.filter((cardId) => !savedIds.includes(cardId));

      nextOrder[group.id] = savedIds.length
        ? [...savedIds, ...shuffleItems(missingIds)]
        : shuffleItems(cardIds);

      if (
        !Array.isArray(currentOrder[group.id]) ||
        nextOrder[group.id].join("|") !== currentOrder[group.id].join("|")
      ) {
        changed = true;
      }
    });

    ["problem", "help"].forEach((groupId) => {
      const group = activity.groups.find((item) => item.id === groupId);
      const personGroup = activity.groups.find((item) => item.id === "person");
      const personOrder = getMatchSetOrder(personGroup, nextOrder.person);
      const currentOrder = getMatchSetOrder(group, nextOrder[groupId]);
      const shouldRotate =
        currentOrder.join("|") === personOrder.join("|") ||
        (groupId === "help" &&
          currentOrder.join("|") ===
            getMatchSetOrder(
              activity.groups.find((item) => item.id === "problem"),
              nextOrder.problem
            ).join("|"));

      if (shouldRotate && nextOrder[groupId].length > 1) {
        nextOrder[groupId] = [...nextOrder[groupId].slice(1), nextOrder[groupId][0]];
        changed = true;
      }
    });

    state.problemHelpMatch.cardOrder = nextOrder;

    if (changed) {
      day01NeedsInitialSave = true;
    }

    return changed;
  }

  function getMatchSetOrder(group, cardOrder) {
    if (!group || !Array.isArray(cardOrder)) {
      return [];
    }

    return cardOrder.map((cardId) => {
      const card = group.cards.find((item) => item.id === cardId);

      return card ? card.matchSet : "";
    });
  }

  function createDefaultDayState(currentDay) {
    return {
      studentId: getStudentId(),
      workId: getWorkId(),
      dayId: currentDay.dayId,
      discoveredTarget: "",
      discoveredProblem: null,
      problemHelpMatch: {
        person: "",
        problem: "",
        help: "",
        cardOrder: {},
        completed: false,
      },
      researchOrder: [],
      researchOrderCompleted: false,
      selectedRoles: [],
      selfCheckItems: [],
      ipoConceptChecked: false,
      codePredictionOrder: [],
      codePredictionSelections: [],
      buttonPredictionCompleted: false,
      makeCodeUiCheckItems: [],
      pairingChecklist: [],
      buttonChecklist: [],
      buttonToolCompleted: false,
      shakePrediction: "",
      shakeFeatureFound: false,
      shakeLedChoice: "",
      shakeChecklist: [],
      shakeToolCompleted: false,
      unlockedTools: [],
      combinationChanges: [],
      freeResearchSteps: [],
      usedFeatures: [],
      peerTestResult: "",
      makeCodeShareUrl: "",
      recordValues: {
        favoriteTool: "",
        nextSensor: "",
      },
      videoAssetId: "",
      videoFileId: "",
      videoStorageFileId: "",
      videoPlaybackUrl: "",
      videoStorageUrl: "",
      videoFileName: "",
      videoMimeType: "",
      videoCapturedAt: "",
      videoPersisted: false,
      videoUploadError: "",
      videoRetakeInProgress: false,
      supersededVideoEvidence: [],
      videoLocalState: {
        captureStatus: "not_started",
        storageStatus: "not_configured",
        ingestMethod: "",
      },
      captureStatus: "not_started",
      storageStatus: "not_configured",
      ingestMethod: "",
      quizAnswers: {},
      lessonProgress: {},
      minimumCompleted: false,
      basicCompleted: false,
      dayCompleted: false,
      completionLevel: "in_progress",
      serverSyncPending: false,
      localRevision: 0,
      localUpdatedAt: "",
      serverUpdatedAt: "",
    };
  }

  function normalizeDayState(currentDay, savedState) {
    const defaultState = createDefaultDayState(currentDay);
    const state = Object.assign({}, defaultState, savedState || {});
    state.studentId = getStudentId();
    state.workId = getWorkId();
    state.dayId = currentDay.dayId;
    if (state.discoveredProblem && state.discoveredProblem.situationId) {
      const situation = getProblemSituation(state.discoveredProblem.situationId);
      const discoveredTarget =
        state.discoveredTarget || state.discoveredProblem.target || (situation ? situation.target : "");

      state.discoveredTarget = discoveredTarget;
      state.discoveredProblem = Object.assign({}, state.discoveredProblem, {
        target: discoveredTarget,
      });
    }
    state.problemHelpMatch = Object.assign(
      {},
      defaultState.problemHelpMatch,
      savedState && savedState.problemHelpMatch ? savedState.problemHelpMatch : {}
    );
    ensureProblemHelpCardOrder(state);
    state.problemHelpMatch.completed = getCardMatchStatus(state.problemHelpMatch).isValid;
    state.videoLocalState = Object.assign(
      {},
      defaultState.videoLocalState,
      savedState && savedState.videoLocalState ? savedState.videoLocalState : {}
    );
    state.recordValues = Object.assign(
      {},
      defaultState.recordValues,
      savedState && savedState.recordValues ? savedState.recordValues : {}
    );
    state.supersededVideoEvidence = Array.isArray(state.supersededVideoEvidence)
      ? state.supersededVideoEvidence
      : [];
    state.selectedRoles = uniqueItems(state.selectedRoles);
    state.selfCheckItems = uniqueItems(state.selfCheckItems);
    state.ipoConceptChecked = Boolean(
      state.ipoConceptChecked || state.selfCheckItems.includes("block02:1")
    );
    state.researchOrder = normalizeResearchOrder(state.researchOrder);
    state.codePredictionOrder = uniqueItems(state.codePredictionOrder);
    state.codePredictionSelections = normalizeCodePredictionSelections(state);
    state.buttonPredictionCompleted = Boolean(
      state.buttonPredictionCompleted && isCodePredictionCorrect(state.codePredictionSelections)
    );
    state.makeCodeUiCheckItems = uniqueItems(state.makeCodeUiCheckItems);
    state.pairingChecklist = uniqueItems(state.pairingChecklist);
    state.buttonChecklist = uniqueItems(state.buttonChecklist);
    state.shakeChecklist = normalizeShakeChecklist(state.shakeChecklist);
    state.shakeToolCompleted = isShakeActivityComplete(state);
    state.unlockedTools = uniqueItems(state.unlockedTools);
    state.combinationChanges = uniqueItems(state.combinationChanges);
    state.freeResearchSteps = uniqueItems(state.freeResearchSteps);
    state.usedFeatures = uniqueItems(state.usedFeatures);
    state.quizAnswers = state.quizAnswers || {};
    state.lessonProgress = state.lessonProgress || {};
    state.videoFileId = state.videoFileId || "";
    state.videoStorageFileId = state.videoStorageFileId || state.storageFileId || state.videoFileId || "";
    state.videoPlaybackUrl = getSafePlaybackUrl(state.videoPlaybackUrl);
    state.videoStorageUrl = getSafePlaybackUrl(state.videoStorageUrl);
    state.videoFileName = state.videoFileName || "";
    state.videoMimeType = state.videoMimeType || "";
    state.videoCapturedAt = state.videoCapturedAt || "";
    state.videoPersisted = Boolean(
      state.videoPersisted &&
        state.videoAssetId &&
        (state.videoStorageFileId || state.videoFileId) &&
        (state.videoPlaybackUrl || state.videoStorageUrl)
    );
    state.videoUploadError = state.videoUploadError || "";
    state.videoRetakeInProgress = Boolean(state.videoRetakeInProgress && state.videoPersisted);
    state.captureStatus = state.videoLocalState.captureStatus || state.captureStatus;
    state.storageStatus = state.videoLocalState.storageStatus || state.storageStatus;
    state.ingestMethod = state.videoLocalState.ingestMethod || state.ingestMethod;

    if (state.storageStatus === "uploaded") {
      state.storageStatus = state.videoPlaybackUrl ? "playback_ready" : "stored";
    }

    if (state.videoLocalState.storageStatus === "uploaded") {
      state.videoLocalState.storageStatus = state.videoPlaybackUrl ? "playback_ready" : "stored";
    }

    if (state.videoPersisted) {
      state.videoFileId = state.videoFileId || state.videoStorageFileId;
      state.videoStorageFileId = state.videoStorageFileId || state.videoFileId;
      state.captureStatus = state.videoRetakeInProgress ? state.captureStatus : "recorded";
      state.storageStatus = state.videoPlaybackUrl || state.videoStorageUrl ? "playback_ready" : "stored";
      state.ingestMethod = state.ingestMethod || "auto_drive";
    }

    state.videoLocalState.captureStatus = state.captureStatus;
    state.videoLocalState.storageStatus = state.storageStatus;
    state.videoLocalState.ingestMethod = state.ingestMethod;

    if (
      state.captureStatus === "recorded" &&
      !hasPersistentVideoReference(state) &&
      !hasRuntimeVideoReference()
    ) {
      setVideoState(state, {
        captureStatus: "not_started",
        storageStatus: "not_configured",
        ingestMethod: "",
      });
    }

    state.minimumCompleted = Boolean(state.minimumCompleted);
    state.basicCompleted = Boolean(state.basicCompleted);
    state.dayCompleted = Boolean(state.dayCompleted);
    state.serverSyncPending = state.serverSyncPending === true;
    state.localRevision = Number.isFinite(Number(state.localRevision))
      ? Math.max(0, Number(state.localRevision))
      : 0;
    state.localUpdatedAt = String(state.localUpdatedAt || "");
    state.serverUpdatedAt = String(state.serverUpdatedAt || "");

    return state;
  }

  function extractDayStateFromDayRecord(dayRecord) {
    if (!dayRecord) {
      return null;
    }

    const rawState = dayRecord.dayStateJson || dayRecord.dayState || null;

    if (!rawState) {
      return null;
    }

    if (typeof rawState === "string") {
      try {
        return JSON.parse(rawState);
      } catch (error) {
        console.warn("server dayStateJson parse failed", error);
        return null;
      }
    }

    return typeof rawState === "object" ? rawState : null;
  }

  function getExpectedVideoAssetId(studentId, dayId) {
    return `asset_${studentId}_${dayId}_video`;
  }

  function findRestorableVideoAsset(assets, dayRecord, student, currentDay) {
    if (!Array.isArray(assets) || !student || !currentDay) {
      return null;
    }

    const refs = Array.isArray(dayRecord && dayRecord.personalEvidenceRefs)
      ? dayRecord.personalEvidenceRefs
      : [];
    const expectedAssetId = getExpectedVideoAssetId(student.studentId, currentDay.dayId);

    if (!refs.includes(expectedAssetId)) {
      return null;
    }

    return (
      assets.find(
        (asset) =>
          asset &&
          asset.assetId === expectedAssetId &&
          asset.assetType === "video" &&
          asset.ownerType === "student" &&
          asset.ownerId === student.studentId &&
          asset.dayId === currentDay.dayId &&
          asset.storageFileId &&
          getSafePlaybackUrl(asset.storageUrl)
      ) || null
    );
  }

  function applyRestoredVideoAsset(dayState, asset) {
    if (!asset) {
      return dayState;
    }

    const restored = Object.assign({}, dayState || {});
    const playbackUrl = getSafePlaybackUrl(asset.storageUrl);

    restored.videoAssetId = asset.assetId || "";
    restored.videoFileId = asset.storageFileId || "";
    restored.videoStorageFileId = asset.storageFileId || "";
    restored.videoPlaybackUrl = playbackUrl;
    restored.videoStorageUrl = playbackUrl;
    restored.videoFileName = asset.fileName || "";
    restored.videoMimeType = asset.mimeType || "";
    restored.videoCapturedAt = asset.capturedAt || "";
    restored.videoPersisted = Boolean(restored.videoAssetId && restored.videoStorageFileId && playbackUrl);
    restored.videoUploadError = "";
    restored.videoRetakeInProgress = false;

    if (restored.videoPersisted) {
      setVideoState(restored, {
        captureStatus: "recorded",
        storageStatus: "playback_ready",
        ingestMethod: restored.ingestMethod || "auto_drive",
      });
    }

    return restored;
  }

  async function loadServerDayState(currentDay) {
    if (!isDay01ServerSyncEnabled() || !isStudentSelected() || currentDay.dayId !== "day01") {
      return {
        state: null,
        status: "",
      };
    }

    const requestStudent = getCurrentStudent();

    try {
      const data = await callAppsScriptApi("getDayRecord", {
        method: "GET",
        params: {
          studentId: requestStudent.studentId,
          dayId: currentDay.dayId,
        },
      });
      const current = getCurrentStudent();

      if (
        !current ||
        current.studentId !== requestStudent.studentId ||
        (activeDay && activeDay.dayId !== currentDay.dayId)
      ) {
        return {
          state: null,
          status: "",
        };
      }

      if (
        data.dayRecord &&
        data.dayRecord.studentId &&
        data.dayRecord.studentId !== requestStudent.studentId
      ) {
        console.warn("server dayRecord student mismatch", {
          expected: requestStudent.studentId,
          actual: data.dayRecord.studentId,
        });
        return {
          state: null,
          status: "서버 기록 학생 정보 불일치",
        };
      }

      const serverVideoAsset = findRestorableVideoAsset(
        data.assets,
        data.dayRecord,
        requestStudent,
        currentDay
      );
      const serverState = applyRestoredVideoAsset(
        extractDayStateFromDayRecord(data.dayRecord),
        serverVideoAsset
      );

      if (
        serverState &&
        serverState.studentId &&
        serverState.studentId !== requestStudent.studentId
      ) {
        console.warn("server dayStateJson student mismatch", {
          expected: requestStudent.studentId,
          actual: serverState.studentId,
        });
        return {
          state: null,
          status: "서버 기록 학생 정보 불일치",
        };
      }

      if (serverState) {
        serverState.serverSyncPending = false;
        serverState.serverUpdatedAt = data.dayRecord ? data.dayRecord.updatedAt || "" : "";
      }

      return {
        state: serverState,
        dayRecord: data.dayRecord || null,
        assets: Array.isArray(data.assets) ? data.assets : [],
        status: serverState ? "서버 기록 복원" : "",
      };
    } catch (error) {
      console.warn("server day01 state load failed", error);
      return {
        state: null,
        status: "서버 연결 실패, 브라우저 임시기록 사용",
      };
    }
  }

  function readStoredDayState(currentDay) {
    const storageKey = getStorageKey(currentDay.dayId);

    if (!storageKey) {
      return null;
    }

    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  }

  function isLocalStateForCurrentContext(state, currentDay) {
    const student = getCurrentStudent();

    return Boolean(
      state &&
        student &&
        state.studentId === student.studentId &&
        state.workId === student.workId &&
        state.dayId === currentDay.dayId
    );
  }

  function loadDayState(currentDay, serverState = null) {
    if (!isStudentSelected()) {
      return {
        state: null,
        status: "",
        retryServerSync: false,
      };
    }

    if (currentDay.dayId !== "day01") {
      return {
        state: null,
        status: "",
        retryServerSync: false,
      };
    }

    try {
      const storedState = readStoredDayState(currentDay);
      const localState = isLocalStateForCurrentContext(storedState, currentDay)
        ? normalizeDayState(currentDay, storedState)
        : null;

      if (localState && localState.serverSyncPending === true) {
        return {
          state: localState,
          status: "브라우저 미동기화 기록 복원",
          retryServerSync: true,
        };
      }

      if (serverState) {
        const normalizedServerState = normalizeDayState(currentDay, serverState);
        writeDayStateToLocalStorage(currentDay, normalizedServerState);
        return {
          state: normalizedServerState,
          status: "서버 기록 복원",
          retryServerSync: false,
        };
      }

      return {
        state: localState || normalizeDayState(currentDay, null),
        status: "",
        retryServerSync: false,
      };
    } catch (error) {
      console.warn("day01 state load failed", error);
      return {
        state: createDefaultDayState(currentDay),
        status: "",
        retryServerSync: false,
      };
    }
  }

  function isDay01Active() {
    return activeDay && activeDay.dayId === "day01" && activeDayState;
  }

  function addUnlockedTools(state, tools) {
    state.unlockedTools = uniqueItems([...(state.unlockedTools || []), ...(tools || [])]);
  }

  function setVideoState(state, nextVideoState) {
    state.videoLocalState = Object.assign({}, state.videoLocalState, nextVideoState);
    state.captureStatus = state.videoLocalState.captureStatus;
    state.storageStatus = state.videoLocalState.storageStatus;
    state.ingestMethod = state.videoLocalState.ingestMethod;
  }

  function hasRuntimeVideoReference() {
    return Boolean(day01RecordedBlob || day01RecordedUrl);
  }

  function hasPersistentVideoReference(state) {
    if (!state) {
      return false;
    }

    return Boolean(
      state.videoPersisted === true &&
        state.videoAssetId &&
        (state.videoStorageFileId || state.videoFileId) &&
        (state.videoStorageUrl || state.videoPlaybackUrl)
    );
  }

  function hasVideoEvidence(state) {
    return Boolean(hasPersistentVideoReference(state) || hasRuntimeVideoReference());
  }

  function createMediaContext() {
    return {
      generation: mediaRuntimeGeneration,
      studentId: getStudentId(),
      workId: getWorkId(),
      dayId: activeDay ? activeDay.dayId : "",
    };
  }

  function isCurrentMediaContext(context) {
    return Boolean(
      context &&
        context.generation === mediaRuntimeGeneration &&
        context.studentId &&
        context.studentId === getStudentId() &&
        context.workId === getWorkId() &&
        context.dayId &&
        activeDay &&
        context.dayId === activeDay.dayId
    );
  }

  function invalidateMediaRuntime() {
    mediaRuntimeGeneration += 1;
    day01RecorderContext = null;
    pendingCameraContext = null;
  }

  function isDay01QuizAnswerComplete(question, answer) {
    if (!question || answer === undefined || answer === null) {
      return false;
    }

    if (question.type === "matching") {
      return question.pairs.every((pair) => Boolean(answer[pair.id]));
    }

    return String(answer).trim().length > 0;
  }

  function isDay01QuizCompleted(state, lesson) {
    if (!lesson || !lesson.quiz || !lesson.quiz.questions) {
      return false;
    }

    return lesson.quiz.questions.every((question) =>
      isDay01QuizAnswerComplete(question, state.quizAnswers[question.id])
    );
  }

  function isDay01RecordCompleted(state) {
    return Boolean(
      state.recordValues &&
        state.recordValues.favoriteTool &&
        String(state.recordValues.nextSensor || "").trim()
    );
  }

  function updateDay01Progress(state) {
    const lesson = activeDay ? getLessonForDay(activeDay) : null;
    const hasProblem = Boolean(getDiscoveredProblemSummary(state.discoveredProblem || {}));
    const hasMatch = Boolean(state.problemHelpMatch && state.problemHelpMatch.completed);
    const hasRoles = state.selectedRoles.length > 0;
    const freeStepsDone = ["try", "change", "test"].every((step) =>
      state.freeResearchSteps.includes(step)
    );
    const hasRecordedVideoEvidence = hasVideoEvidence(state);
    const hasMinimumDevice =
      state.buttonToolCompleted && state.unlockedTools.includes("LED 출력");

    state.lessonProgress = {
      block01Completed: hasProblem && hasMatch && state.researchOrderCompleted && hasRoles,
      block02Completed:
        state.ipoConceptChecked &&
        state.buttonToolCompleted &&
        state.shakeToolCompleted,
      block03Completed:
        freeStepsDone && state.usedFeatures.length > 0 && Boolean(state.peerTestResult),
      evidenceChecked: Boolean(state.makeCodeShareUrl) && hasRecordedVideoEvidence,
      quizCompleted: isDay01QuizCompleted(state, lesson),
      recordCompleted: isDay01RecordCompleted(state),
    };
    state.minimumCompleted = Boolean(hasMinimumDevice);
    state.basicCompleted = Boolean(
      state.lessonProgress.block01Completed &&
        state.lessonProgress.block02Completed &&
        state.lessonProgress.block03Completed &&
        state.lessonProgress.evidenceChecked &&
        state.lessonProgress.quizCompleted &&
        state.lessonProgress.recordCompleted
    );
    state.dayCompleted = state.basicCompleted;
    state.completionLevel = state.basicCompleted
      ? "basic"
      : state.minimumCompleted
      ? "minimum"
      : "in_progress";
  }

  function hasAnyValue(value) {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (value && typeof value === "object") {
      return Object.keys(value).some((key) => hasAnyValue(value[key]));
    }

    return String(value || "").trim().length > 0;
  }

  function getProgressValue(isCompleted, isStarted) {
    if (isCompleted) {
      return "completed";
    }

    return isStarted ? "in_progress" : "not_started";
  }

  function getDay01BlockProgress(state) {
    const progress = state.lessonProgress || {};
    const block01Started = Boolean(
      getDiscoveredProblemSummary(state.discoveredProblem || {}) ||
        hasAnyValue(state.problemHelpMatch) ||
        hasAnyValue(state.researchOrder) ||
        state.selectedRoles.length
    );
    const block02Started = Boolean(
      state.ipoConceptChecked ||
        state.buttonPredictionCompleted ||
        state.makeCodeUiCheckItems.length ||
        state.pairingChecklist.length ||
        state.buttonChecklist.length ||
        state.buttonToolCompleted ||
        state.shakeFeatureFound ||
        state.shakeToolCompleted
    );
    const block03Started = Boolean(
      state.freeResearchSteps.length ||
        state.usedFeatures.length ||
        state.peerTestResult ||
        state.makeCodeShareUrl ||
        hasVideoEvidence(state)
    );

    return {
      block01: getProgressValue(Boolean(progress.block01Completed), block01Started),
      block02: getProgressValue(Boolean(progress.block02Completed), block02Started),
      block03: getProgressValue(Boolean(progress.block03Completed), block03Started),
    };
  }

  function joinKoreanList(items) {
    const values = uniqueItems(items);

    if (values.length <= 1) {
      return values[0] || "";
    }

    return `${values.slice(0, -1).join(", ")}과 ${values[values.length - 1]}`;
  }

  function getDay01TodayDecision(state) {
    const inputFeatures = [];
    const outputFeatures = [];

    if (state.buttonToolCompleted) {
      inputFeatures.push("A 버튼 입력");
    }

    if (state.shakeToolCompleted) {
      inputFeatures.push("흔들기 입력");
    }

    if (
      state.unlockedTools.includes("LED 출력") ||
      state.buttonToolCompleted ||
      state.shakeToolCompleted ||
      state.usedFeatures.includes("LED 출력")
    ) {
      outputFeatures.push("LED 출력");
    }

    if (!inputFeatures.length || !outputFeatures.length) {
      return "";
    }

    return `오늘은 ${joinKoreanList(inputFeatures)}과 ${joinKoreanList(
      outputFeatures
    )}을 이용해\n마이크로비트 장치를 만들고 시험했습니다.`;
  }

  function getDay01Activities(state) {
    const activities = [];

    if (getDiscoveredProblemSummary(state.discoveredProblem || {})) {
      activities.push("미래생활 문제 탐색");
    }

    if (state.researchOrderCompleted) {
      activities.push("연구 순서 완성");
    }

    if (state.buttonToolCompleted) {
      activities.push("A 버튼→LED 작동 시험");
    }

    if (state.shakeToolCompleted) {
      activities.push("흔들기 입력 시험");
    }

    if (state.freeResearchSteps.length || state.usedFeatures.length) {
      activities.push("자유 연구");
    }

    if (state.peerTestResult) {
      activities.push("친구 시험");
    }

    if (state.makeCodeShareUrl) {
      activities.push("MakeCode 코드 연결");
    }

    if (hasVideoEvidence(state)) {
      activities.push("연구 모습 기록");
    }

    return activities;
  }

  function getDay01ChangeMade(state) {
    const changes = [];

    if (state.usedFeatures.length) {
      changes.push(`사용한 기능: ${state.usedFeatures.join(", ")}`);
    }

    if (state.combinationChanges.length) {
      changes.push(`조합 도전: ${state.combinationChanges.join(", ")}`);
    }

    if (state.recordValues.favoriteTool) {
      changes.push(`가장 많이 사용한 도구: ${state.recordValues.favoriteTool}`);
    }

    return changes.join(" / ");
  }

  function getDay01NextAction(state) {
    const nextSensor = String(state.recordValues.nextSensor || "").trim();

    return nextSensor ? `다음에는 ${nextSensor} 상태를 장치가 알아차리는 방법을 알아봅니다.` : "";
  }

  function getDay01CompletionLevel(state) {
    if (!state.minimumCompleted) {
      return "";
    }

    if (state.advancedCompleted) {
      return "advanced";
    }

    return state.basicCompleted ? "basic" : "minimum";
  }

  function getDay01RecordStatus(state) {
    return state.minimumCompleted ? "completed" : "in_progress";
  }

  function getMakeCodeAssetId(studentId, dayId) {
    return `asset_${studentId}_${dayId}_makecode`;
  }

  function getVideoAssetId(studentId, dayId, state) {
    return state.videoAssetId || getExpectedVideoAssetId(studentId, dayId);
  }

  function getDay01PersonalEvidenceRefs(student, currentDay, state) {
    const refs = [];

    if (state.makeCodeShareUrl) {
      refs.push(getMakeCodeAssetId(student.studentId, currentDay.dayId));
    }

    if (hasPersistentVideoReference(state)) {
      refs.push(getVideoAssetId(student.studentId, currentDay.dayId, state));
    }

    return refs;
  }

  function isQuestionAnswerCorrect(question, answer) {
    if (!isDay01QuizAnswerComplete(question, answer)) {
      return false;
    }

    if (question.type === "matching") {
      return question.pairs.every((pair) => answer[pair.id] === pair.answer);
    }

    const choices = question.choices || [];
    const selectedChoice = choices.find((choice) => (choice.value || choice.text) === answer);

    return Boolean(selectedChoice && selectedChoice.correct);
  }

  function getDay01QuizScore(state, lesson) {
    if (!lesson || !lesson.quiz || !lesson.quiz.questions) {
      return 0;
    }

    return lesson.quiz.questions.reduce(
      (score, question) =>
        score + (isQuestionAnswerCorrect(question, state.quizAnswers[question.id]) ? 1 : 0),
      0
    );
  }

  function hasAnyQuizAnswer(state) {
    return hasAnyValue(state.quizAnswers || {});
  }

  function createDay01RecordPayload(student, currentDay, state) {
    return {
      studentId: student.studentId,
      workId: student.workId,
      dayId: currentDay.dayId,
      date: getConfiguredDayDate(currentDay),
      blockProgress: getDay01BlockProgress(state),
      role: "",
      activities: getDay01Activities(state),
      todayDecision: getDay01TodayDecision(state),
      discovery: getDiscoveredProblemSummary(state.discoveredProblem || {}),
      difficulty: "",
      changeMade: getDay01ChangeMade(state),
      changeReason: "",
      nextAction: getDay01NextAction(state),
      personalEvidenceRefs: getDay01PersonalEvidenceRefs(student, currentDay, state),
      commonEvidenceRefs: [],
      minimumCompleted: Boolean(state.minimumCompleted),
      completionLevel: getDay01CompletionLevel(state),
      status: getDay01RecordStatus(state),
      studentReflection: "",
      dayState: cloneJsonValue(state, {}),
    };
  }

  function createDay01QuizPayload(student, currentDay, state, lesson) {
    if (!lesson || !lesson.quiz || !lesson.quiz.questions || !hasAnyQuizAnswer(state)) {
      return null;
    }

    const totalQuestions = lesson.quiz.questions.length;
    const completed = isDay01QuizCompleted(state, lesson);

    return {
      studentId: student.studentId,
      dayId: currentDay.dayId,
      quizType: "concept",
      quizVersion: "day01-v1",
      answers: cloneJsonValue(state.quizAnswers || {}, {}),
      score: getDay01QuizScore(state, lesson),
      totalQuestions,
      attemptCount: completed ? 1 : 0,
      completed,
    };
  }

  function createDay01AssetPayloads(student, currentDay, state) {
    const assets = [];

    if (state.makeCodeShareUrl) {
      assets.push({
        assetId: getMakeCodeAssetId(student.studentId, currentDay.dayId),
        assetType: "webpage_link",
        ownerType: "student",
        ownerId: student.studentId,
        dayId: currentDay.dayId,
        blockId: "block03",
        title: "Day01 MakeCode 코드",
        description: "첫 연구장치 MakeCode 공유 주소",
        storageUrl: state.makeCodeShareUrl,
        thumbnailUrl: "",
        fileName: "",
        mimeType: "",
        capturedAt: "",
      });
    }

    if (hasPersistentVideoReference(state)) {
      assets.push({
        assetId: getVideoAssetId(student.studentId, currentDay.dayId, state),
        assetType: "video",
        ownerType: "student",
        ownerId: student.studentId,
        dayId: currentDay.dayId,
        blockId: "block03",
        title: "Day01 연구 모습 영상",
        description: "첫 연구장치 시험 모습",
        storageFileId: state.videoStorageFileId || state.videoFileId || "",
        storageUrl: state.videoStorageUrl || state.videoPlaybackUrl || "",
        thumbnailUrl: "",
        fileName: state.videoFileName || "",
        mimeType: state.videoMimeType || "video/webm",
        capturedAt: state.videoCapturedAt || "",
      });
    }

    return assets;
  }

  function createDay01ServerSaveRequest(currentDay, state) {
    if (!isDay01ServerSyncEnabled() || !state || currentDay.dayId !== "day01") {
      return null;
    }

    const student = getCurrentStudent();

    if (!student) {
      return null;
    }

    const normalizedState = normalizeDayState(currentDay, cloneJsonValue(state, {}));
    updateDay01Progress(normalizedState);
    const lesson = getLessonForDay(currentDay);
    const syncedDayState = cloneJsonValue(normalizedState, {});
    syncedDayState.serverSyncPending = false;

    return {
      saveKey: `${student.studentId}:${currentDay.dayId}`,
      studentId: student.studentId,
      workId: student.workId,
      dayId: currentDay.dayId,
      localRevision: normalizedState.localRevision,
      localUpdatedAt: normalizedState.localUpdatedAt,
      assets: createDay01AssetPayloads(student, currentDay, normalizedState),
      quizResult: createDay01QuizPayload(student, currentDay, normalizedState, lesson),
      dayRecord: createDay01RecordPayload(student, currentDay, syncedDayState),
    };
  }

  function isServerSaveRequestCurrent(request) {
    const student = getCurrentStudent();

    return Boolean(
      request &&
        student &&
        activeDay &&
        request.studentId === student.studentId &&
        request.dayId === activeDay.dayId
    );
  }

  function getDay01ServerSaveSlot(saveKey) {
    if (!day01ServerSaveSlots.has(saveKey)) {
      day01ServerSaveSlots.set(saveKey, {
        pendingRequest: null,
        timer: null,
        inFlight: false,
        queued: false,
        waiters: [],
        lastFlushOk: true,
      });
    }

    return day01ServerSaveSlots.get(saveKey);
  }

  function resolveDay01ServerSaveWaiters(slot, ok) {
    const waiters = slot.waiters || [];
    slot.waiters = [];
    waiters.forEach((resolve) => resolve(ok));
  }

  function getPendingVideoSaveNotice(request) {
    if (request && !isServerSaveRequestCurrent(request)) {
      return null;
    }

    if (
      !isDay01Active() ||
      !activeDayState ||
      activeDayState.captureStatus !== "recorded" ||
      hasPersistentVideoReference(activeDayState)
    ) {
      return null;
    }

    const storageStatus = activeDayState.storageStatus;

    if (day01UploadInFlight || storageStatus === "pending_upload") {
      return {
        status: "영상 저장 중...",
        options: {},
      };
    }

    if (storageStatus === "failed") {
      return {
        status: SAVE_STATUS.failed,
        options: { retryVideo: Boolean(day01RecordedBlob) },
      };
    }

    if (storageStatus === "too_large") {
      return {
        status: "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요.",
        options: {},
      };
    }

    if (!day01RecordedBlob) {
      return null;
    }

    return {
      status: "영상이 아직 저장되지 않았습니다.",
      options: {},
    };
  }

  function renderSaveStateWithVideoPriority(status, options = {}, request) {
    const videoNotice = getPendingVideoSaveNotice(request);

    if (videoNotice) {
      renderSaveState(videoNotice.status, videoNotice.options);
      return;
    }

    renderSaveState(status, options);
  }

  function getStorageKeyForStudent(studentId, dayId) {
    return studentId ? `${STORAGE_PREFIX}:${studentId}:${dayId}` : "";
  }

  function markDayStateServerPending(state) {
    state.localRevision = Number(state.localRevision || 0) + 1;
    state.localUpdatedAt = new Date().toISOString();
    state.serverSyncPending = true;
  }

  function getStoredStateForRequest(request) {
    try {
      const storageKey = getStorageKeyForStudent(request.studentId, request.dayId);
      const saved = storageKey ? window.localStorage.getItem(storageKey) : "";

      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("stored day01 state read failed", error);
      return null;
    }
  }

  function writeStoredStateForRequest(request, state) {
    try {
      const storageKey = getStorageKeyForStudent(request.studentId, request.dayId);

      if (storageKey) {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      }
    } catch (error) {
      console.warn("stored day01 state write failed", error);
    }
  }

  function applyServerSaveSuccess(request, updatedAt) {
    const isCurrent = isServerSaveRequestCurrent(request);

    if (
      isCurrent &&
      activeDayState &&
      Number(activeDayState.localRevision) === Number(request.localRevision)
    ) {
      activeDayState.serverSyncPending = false;
      activeDayState.serverUpdatedAt = updatedAt;
      writeDayStateToLocalStorage(activeDay, activeDayState);
      return true;
    }

    const storedState = getStoredStateForRequest(request);

    if (
      storedState &&
      storedState.studentId === request.studentId &&
      storedState.workId === request.workId &&
      storedState.dayId === request.dayId &&
      Number(storedState.localRevision || 0) === Number(request.localRevision)
    ) {
      storedState.serverSyncPending = false;
      storedState.serverUpdatedAt = updatedAt;
      writeStoredStateForRequest(request, storedState);
      return isCurrent;
    }

    return false;
  }

  function queueDay01ServerSave(currentDay, state, options = {}) {
    const request = createDay01ServerSaveRequest(currentDay, state);

    if (!request) {
      return Promise.resolve(false);
    }

    const slot = getDay01ServerSaveSlot(request.saveKey);
    slot.pendingRequest = request;
    const waitForFlush = options.waitForFlush
      ? new Promise((resolve) => {
          slot.waiters.push(resolve);
        })
      : null;

    if (options.immediate) {
      if (slot.timer) {
        window.clearTimeout(slot.timer);
        slot.timer = null;
      }

      flushDay01ServerSave(request.saveKey);
      return waitForFlush || Promise.resolve(true);
    }

    if (slot.timer) {
      window.clearTimeout(slot.timer);
    }

    slot.timer = window.setTimeout(() => {
      slot.timer = null;
      flushDay01ServerSave(request.saveKey);
    }, DAY01_SERVER_SAVE_DEBOUNCE_MS);

    return waitForFlush || Promise.resolve(true);
  }

  async function flushDay01ServerSave(saveKey) {
    const slot = day01ServerSaveSlots.get(saveKey);

    if (!slot || !slot.pendingRequest) {
      if (slot && !slot.inFlight) {
        resolveDay01ServerSaveWaiters(slot, slot.lastFlushOk !== false);
      }
      return;
    }

    if (slot.inFlight) {
      slot.queued = true;
      return;
    }

    const request = slot.pendingRequest;
    slot.pendingRequest = null;
    slot.inFlight = true;

    try {
      const result = await submitDay01ServerSave(request);
      const updatedAt = result.dayRecord && result.dayRecord.updatedAt;
      slot.lastFlushOk = true;

      if (updatedAt && applyServerSaveSuccess(request, updatedAt)) {
        renderSaveStateWithVideoPriority(SAVE_STATUS.saved, {}, request);
      } else if (isServerSaveRequestCurrent(request) && activeDayState.serverSyncPending) {
        renderServerSaveFailed();
      }
    } catch (error) {
      console.warn("day01 server save failed", error);
      slot.lastFlushOk = false;

      if (isServerSaveRequestCurrent(request)) {
        renderServerSaveFailed();
      }
    } finally {
      slot.inFlight = false;

      if (slot.pendingRequest || slot.queued) {
        slot.queued = false;
        flushDay01ServerSave(saveKey);
      } else if (!slot.timer) {
        resolveDay01ServerSaveWaiters(slot, slot.lastFlushOk !== false);
        day01ServerSaveSlots.delete(saveKey);
      }
    }
  }

  async function submitDay01ServerSave(request) {
    for (const asset of request.assets) {
      await callAppsScriptApi("upsertAsset", {
        payload: asset,
      });
    }

    if (request.quizResult) {
      await callAppsScriptApi("saveQuizResult", {
        payload: request.quizResult,
      });
    }

    const data = await callAppsScriptApi("saveDayRecord", {
      payload: request.dayRecord,
    });

    return {
      dayRecord: data.dayRecord || null,
    };
  }

  function saveDayState(status = SAVE_STATUS.saving, options = {}) {
    if (!isStudentSelected() || !isDay01Active()) {
      return Promise.resolve(false);
    }

    updateDay01Progress(activeDayState);
    updateDay01ProgressLine();
    markDayStateServerPending(activeDayState);

    try {
      const storageKey = getStorageKey(activeDay.dayId);

      if (!storageKey) {
        renderSaveState("연구원 정보를 확인하지 못했습니다.");
        return Promise.resolve(false);
      }

      window.localStorage.setItem(storageKey, JSON.stringify(activeDayState));
      renderSaveStateWithVideoPriority(
        isDay01ServerSyncEnabled() ? status : SAVE_STATUS.localSaved
      );
      return queueDay01ServerSave(activeDay, activeDayState, {
        immediate: options.server === "immediate",
        waitForFlush: options.waitForServer === true,
      });
    } catch (error) {
      console.warn("day01 state save failed", error);
      renderSaveState(SAVE_STATUS.localFailed);
      return Promise.resolve(false);
    }
  }

  function updateDay01State(mutator, status) {
    if (!isDay01Active()) {
      return;
    }

    const beforeProgress = getDay01BlockProgress(activeDayState);
    const wasDayCompleted = Boolean(activeDayState.dayCompleted);

    mutator(activeDayState);
    updateDay01Progress(activeDayState);
    const afterProgress = getDay01BlockProgress(activeDayState);
    const completedBlockNow = Object.keys(afterProgress).some(
      (blockId) =>
        afterProgress[blockId] === "completed" && beforeProgress[blockId] !== "completed"
    );
    const completedDayNow = Boolean(activeDayState.dayCompleted) && !wasDayCompleted;

    saveDayState(status, {
      server: completedBlockNow || completedDayNow ? "immediate" : "",
    });
    syncDay01UiFromState();
  }

  function updateDay01RuntimeState(mutator, status, options = {}) {
    if (!isDay01Active()) {
      return;
    }

    mutator(activeDayState);
    updateDay01Progress(activeDayState);
    writeDayStateToLocalStorage(activeDay, activeDayState);

    if (status !== undefined) {
      renderSaveState(status, options);
    }

    syncDay01UiFromState();
  }

  function formatDayNo(dayNo) {
    return String(dayNo).padStart(2, "0");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderParagraphs(paragraphs) {
    return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  }

  function renderPlainList(items, className) {
    return `
      <ul class="${className}">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    `;
  }

  function renderNumberedList(items, className) {
    return `
      <ol class="${className}">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    `;
  }

  function renderTextInputField(field, prefix) {
    const inputId = `${prefix}-${field.id}`;
    const readonlyAttribute = field.readonly ? " readonly" : "";
    const sourceAttribute = field.source ? ` data-record-source="${escapeHtml(field.source)}"` : "";
    const valueAttribute =
      field.value !== undefined ? ` value="${escapeHtml(field.value)}"` : "";
    const extraAttributes = field.extraAttributes ? ` ${field.extraAttributes}` : "";
    const helpText = field.helpText
      ? `<p class="field-help" id="${escapeHtml(inputId)}-help">${escapeHtml(field.helpText)}</p>`
      : "";
    const describedBy = field.helpText ? ` aria-describedby="${escapeHtml(inputId)}-help"` : "";

    return `
      <label class="record-field" for="${escapeHtml(inputId)}">
        <span>${escapeHtml(field.label)}</span>
        <input id="${escapeHtml(inputId)}" type="text" placeholder="${escapeHtml(
      field.placeholder || ""
    )}"${valueAttribute}${readonlyAttribute}${sourceAttribute}${extraAttributes}${describedBy}>
        ${helpText}
      </label>
    `;
  }

  function renderIdeaInputField(field, ideaIndex) {
    const inputId = `block-activity-${field.id}`;

    return `
      <label class="record-field" for="${escapeHtml(inputId)}">
        <span>${escapeHtml(field.label)}</span>
        <input
          id="${escapeHtml(inputId)}"
          type="text"
          placeholder="${escapeHtml(field.placeholder || "")}"
          data-idea-input="${ideaIndex}"
        >
      </label>
    `;
  }

  function groupDaysByPhase(days) {
    return days.reduce((groups, day) => {
      if (!groups.some((group) => group.phase === day.phase)) {
        groups.push({ phase: day.phase, days: [] });
      }

      groups.find((group) => group.phase === day.phase).days.push(day);
      return groups;
    }, []);
  }

  function getDayState(day, currentDay) {
    if (day.dayNo < currentDay.dayNo) {
      return "completed";
    }

    if (day.dayNo === currentDay.dayNo) {
      return "current";
    }

    if (day.dayNo === currentDay.dayNo + 1) {
      return "next";
    }

    return "future";
  }

  function renderAppHeader(currentDay) {
    const student = getCurrentStudent();

    elements.studentName.textContent = student ? formatResearcherName(student) : "";
    elements.headerCurrent.textContent = `연구 ${formatDayNo(currentDay.dayNo)} · ${
      currentDay.title
    }`;
    renderSaveState();
  }

  function renderSaveState(status = "", options = {}) {
    if (!elements.saveState) {
      return;
    }

    elements.saveState.replaceChildren();

    if (!status) {
      elements.saveState.hidden = true;
      return;
    }

    const statusText = document.createElement("span");
    statusText.textContent = status;
    elements.saveState.appendChild(statusText);

    if ((options.retry || options.retryVideo) && isDay01Active() && isDay01ServerSyncEnabled()) {
      const retryButton = document.createElement("button");
      retryButton.className = "retry-save-button";
      retryButton.type = "button";
      if (options.retryVideo) {
        retryButton.dataset.retryVideoUpload = "true";
      } else {
        retryButton.dataset.retryServerSave = "true";
      }
      retryButton.textContent = "다시 저장";
      elements.saveState.appendChild(retryButton);
    }

    elements.saveState.hidden = false;
  }

  function renderServerSaveFailed() {
    renderSaveStateWithVideoPriority(SAVE_STATUS.failed, { retry: true });
  }

  function retryDay01ServerSave() {
    if (!isDay01Active()) {
      return;
    }

    renderSaveState(SAVE_STATUS.saving);
    queueDay01ServerSave(activeDay, activeDayState, { immediate: true });
  }

  function handleSaveStateClick(event) {
    if (event.target.closest("[data-retry-video-upload]")) {
      useDay01Recording();
      return;
    }

    if (event.target.closest("[data-retry-server-save]")) {
      retryDay01ServerSave();
    }
  }

  function setLabShellVisible(isVisible) {
    if (elements.appHeader) {
      elements.appHeader.hidden = !isVisible;
    }

    if (elements.labShell) {
      elements.labShell.hidden = !isVisible;
    }

    if (elements.identityGate) {
      elements.identityGate.hidden = isVisible;
    }
  }

  function clearRenderedLabSurfaces() {
    if (elements.researchDays) {
      elements.researchDays.innerHTML = "";
    }

    if (elements.standardDay) {
      elements.standardDay.innerHTML = "";
      elements.standardDay.hidden = true;
    }

    [elements.intro, elements.phaseNotice, elements.specialNotice].forEach((element) => {
      if (!element) {
        return;
      }

      element.innerHTML = "";
      element.hidden = true;
    });

    if (elements.location) {
      elements.location.textContent = "";
    }

    if (elements.headerCurrent) {
      elements.headerCurrent.textContent = "";
    }

    if (elements.studentName) {
      elements.studentName.textContent = "";
    }

    renderSaveState();
  }

  function renderStudentOption(student) {
    const isSelected = student.studentId === pendingStudentId;

    return `
      <button
        class="student-card${isSelected ? " is-selected" : ""}"
        type="button"
        aria-pressed="${isSelected ? "true" : "false"}"
        data-student-option="${escapeHtml(student.studentId)}"
      >
        <span class="student-card__name">${escapeHtml(student.studentName)}</span>
        <span class="student-card__status">${isSelected ? "선택됨 ✓" : "선택하려면 누르기"}</span>
      </button>
    `;
  }

  function getPendingStudent() {
    return findStudentById(pendingStudentId);
  }

  function updateIdentitySelection() {
    const selectedStudent = getPendingStudent();
    const confirmation = elements.identityGate.querySelector("[data-identity-confirmation]");
    const enterButton = elements.identityGate.querySelector("[data-enter-lab]");

    elements.identityGate.querySelectorAll("[data-student-option]").forEach((button) => {
      const isSelected = button.dataset.studentOption === pendingStudentId;
      const status = button.querySelector(".student-card__status");

      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");

      if (status) {
        status.textContent = isSelected ? "선택됨 ✓" : "선택하려면 누르기";
      }
    });

    if (confirmation) {
      confirmation.textContent = selectedStudent
        ? `${formatResearcherName(selectedStudent)}으로 시작합니다.`
        : "";
      confirmation.hidden = !selectedStudent;
    }

    if (enterButton) {
      enterButton.disabled = !selectedStudent;
    }
  }

  function renderIdentityGate(message = "") {
    const displayMessage = message || registeredStudentsMessage;

    activeDay = null;
    activeDayState = null;
    setLabShellVisible(false);
    clearRenderedLabSurfaces();

    elements.identityGate.innerHTML = `
      <div class="identity-gate__content">
        <div class="identity-gate__heading">
          <p class="project-name">내일을 바꾸는 미래기술 연구소</p>
          <h1>다섯 연구원, 다섯 발명, 하나의 미래</h1>
        </div>
        <div class="identity-gate__intro" aria-label="프로젝트 취지">
          <p>사람과 환경의 불편을 발견하고,</p>
          <p>생각하고 → 만들고 → 시험하고 → 다시 고치는 연구를 합니다.</p>
          <p>그 과정은 나만의 프로젝트 북에 남습니다.</p>
        </div>
        <div class="identity-gate__selector" aria-label="연구원 이름 선택">
          ${registeredStudents.map((student) => renderStudentOption(student)).join("")}
        </div>
        <p class="identity-gate__confirmation" data-identity-confirmation hidden></p>
        ${
          displayMessage
            ? `<p class="identity-gate__message" role="alert">${escapeHtml(displayMessage)}</p>`
            : ""
        }
        <button class="primary-link identity-gate__enter" type="button" data-enter-lab disabled>
          내 연구소 들어가기
        </button>
      </div>
    `;

    updateIdentitySelection();
  }

  async function enterSelectedStudent() {
    if (elements.identityGate.hidden) {
      return;
    }

    const selectedStudent = getPendingStudent();

    if (!selectedStudent) {
      renderIdentityGate("연구원 정보를 확인하지 못했습니다. 다시 이름을 선택해 주세요.");
      return;
    }

    if (!setCurrentStudent(selectedStudent)) {
      renderIdentityGate("연구원 정보를 확인하지 못했습니다. 다시 이름을 선택해 주세요.");
      return;
    }

    await renderPage();
  }

  function handleIdentityGateClick(event) {
    if (elements.identityGate.hidden) {
      return;
    }

    const studentOption = event.target.closest("[data-student-option]");

    if (studentOption) {
      pendingStudentId = studentOption.dataset.studentOption;
      updateIdentitySelection();
      return;
    }

    if (event.target.closest("[data-enter-lab]")) {
      enterSelectedStudent();
    }
  }

  function hasSavedVideoReference(state) {
    return hasPersistentVideoReference(state);
  }

  function prepareActiveStateForStudentChange() {
    if (!isDay01Active()) {
      return;
    }

    if (
      activeDayState.captureStatus === "camera_ready" ||
      activeDayState.captureStatus === "recording" ||
      (activeDayState.captureStatus === "recorded" && !hasSavedVideoReference(activeDayState))
    ) {
      setVideoState(activeDayState, {
        captureStatus: "not_started",
        storageStatus: hasSavedVideoReference(activeDayState)
          ? activeDayState.storageStatus
          : "not_configured",
        ingestMethod: hasSavedVideoReference(activeDayState) ? activeDayState.ingestMethod : "",
      });
    }
  }

  function resetRuntimeForStudentChange() {
    invalidateMediaRuntime();
    cleanupDay01Media();
    day01Recorder = null;
    day01RecorderContext = null;
    pendingCameraContext = null;
    day01RecordedChunks = [];
    day01RecordedBlob = null;
    day01RecordedContext = null;
    day01RecordingStartedAt = 0;
    draggedResearchOrderCard = null;
    selectedResearchOrderCard = "";
    activeDay = null;
    activeDayState = null;
    currentStudentRecords = {};
    clearRenderedLabSurfaces();
  }

  async function handleChangeStudent() {
    if (elements.changeStudent.disabled) {
      return;
    }

    if (!isStudentSelected()) {
      clearCurrentStudent();
      pendingStudentId = "";
      renderIdentityGate();
      return;
    }

    if (day01UploadInFlight) {
      renderSaveState("영상 저장 중입니다. 잠시 후 다시 변경하세요.");
      return;
    }

    elements.changeStudent.disabled = true;

    try {
      prepareActiveStateForStudentChange();

      if (isDay01Active()) {
        await saveDayState(SAVE_STATUS.saving, {
          server: "immediate",
          waitForServer: true,
        });
      }

      resetRuntimeForStudentChange();
      clearCurrentStudent();
      pendingStudentId = "";
      renderIdentityGate();
    } finally {
      elements.changeStudent.disabled = false;
    }
  }

  function renderProjectIntro(currentDay) {
    if (currentDay.dayType !== "first") {
      elements.intro.hidden = true;
      elements.intro.innerHTML = "";
      return;
    }

    elements.intro.hidden = false;
    elements.intro.innerHTML = `
      <p>첫 연구에서는 주변의 문제를 찾고, 작은 장치를 직접 작동시켜 봅니다.</p>
      <p>오늘 남긴 코드와 오늘의 연구 모습 영상은 다음 연구로 이어집니다.</p>
    `;
  }

  function renderSpecialNotice(currentDay) {
    if (!currentDay.specialNotice) {
      elements.specialNotice.hidden = true;
      elements.specialNotice.innerHTML = "";
      return;
    }

    elements.specialNotice.hidden = false;
    elements.specialNotice.innerHTML = `<p>${escapeHtml(currentDay.specialNotice)}</p>`;
  }

  function renderPhaseNotice(currentDay) {
    if (!currentDay.phaseNotice) {
      elements.phaseNotice.hidden = true;
      elements.phaseNotice.innerHTML = "";
      return;
    }

    elements.phaseNotice.hidden = false;
    elements.phaseNotice.innerHTML = `<p>${escapeHtml(currentDay.phaseNotice)}</p>`;
  }

  function renderConnectionNotice(currentDay) {
    const previousDay = getPreviousDay(currentDay);
    const nextDay = getNextDay(currentDay);

    if (currentDay.dayType === "first") {
      return "";
    }

    if (currentDay.dayType === "reload") {
      return `
        <div class="research-day__connection">
          <p>
            <span class="research-day__connection-label">지난 연구에서</span>
            「${escapeHtml(previousDay.title)}」를 통해 해결할 문제를 정했습니다.
          </p>
          <p>오늘은 그 문제를 다시 확인하며 아이디어를 비교하고, 다음 연구 「${escapeHtml(
            nextDay.title
          )}」로 이어집니다.</p>
        </div>
      `;
    }

    if (currentDay.dayType === "final") {
      return `
        <div class="research-day__connection">
          <p>
            <span class="research-day__connection-label">지난 연구에서</span>
            「${escapeHtml(previousDay.title)}」까지 마쳤습니다.
          </p>
          <p>오늘은 지금까지의 연구를 발표하고 나의 미래기술 프로젝트를 완성합니다.</p>
        </div>
      `;
    }

    return `
      <div class="research-day__connection">
        <p>
          <span class="research-day__connection-label">지난 연구</span>
          「${escapeHtml(previousDay.title)}」에서 익힌 내용과 결과를 이어갑니다.
        </p>
        <p>오늘의 연구는 다음 연구 「${escapeHtml(nextDay.title)}」로 이어집니다.</p>
      </div>
    `;
  }

  function renderStartButton(currentDay) {
    const lesson = getLessonForDay(currentDay);

    if (!lesson) {
      return "";
    }

    return `
      <div class="research-day__actions">
        <button class="start-button" type="button" data-start-research>
          오늘 연구 시작
        </button>
      </div>
    `;
  }

  function renderDayItem(day, currentDay, options = {}) {
    const { includeCurrentBody = false } = options;
    const state = getDayState(day, currentDay);
    const statusText = {
      completed: "완료",
      current: "오늘",
      next: "다음",
      future: "",
    }[state];
    const statusLabel = {
      completed: "완료한 연구",
      current: "오늘 연구",
      next: "다음 연구",
      future: "",
    }[state];
    const currentAttributes = state === "current" ? ' aria-current="step"' : "";
    const currentContent =
      includeCurrentBody && state === "current"
        ? `
          <div class="research-day__body">
            <p class="research-day__description">${escapeHtml(day.todayDescription)}</p>
            ${renderConnectionNotice(currentDay)}
            ${renderStartButton(currentDay)}
          </div>
        `
        : "";
    const status = statusText
      ? `<span class="research-day__status" aria-label="${statusLabel}">${statusText}</span>`
      : "";

    return `
      <li class="research-day research-day--${state}"${currentAttributes}>
        <div class="research-day__line">
          <span class="research-day__number">${formatDayNo(day.dayNo)}</span>
          <span class="research-day__title">${escapeHtml(day.title)}</span>
          ${status}
        </div>
        ${currentContent}
      </li>
    `;
  }

  function getContextDays(currentDay) {
    return [getPreviousDay(currentDay), currentDay, getNextDay(currentDay)].filter(Boolean);
  }

  function renderResearchMap(currentDay) {
    const phaseGroups = groupDaysByPhase(window.RESEARCH_DAYS);
    const contextDays = getContextDays(currentDay);

    elements.researchDays.innerHTML = `
      <ol class="phase-group__list research-map__focus-list">
        ${contextDays
          .map((day) => renderDayItem(day, currentDay, { includeCurrentBody: true }))
          .join("")}
      </ol>

      <details class="full-map">
        <summary>전체 연구지도 보기</summary>
        <div class="full-map__body">
          ${phaseGroups
            .map(
              (group, index) => `
                <section class="phase-group" aria-labelledby="phase-${index + 1}">
                  <h2 class="phase-group__title" id="phase-${index + 1}">${escapeHtml(
                    group.phase
                  )}</h2>
                  <ol class="phase-group__list">
                    ${group.days.map((day) => renderDayItem(day, currentDay)).join("")}
                  </ol>
                </section>
              `
            )
            .join("")}
        </div>
      </details>
    `;
  }

  function renderChoiceGroup(group, options = {}) {
    const quizAttribute = options.quizId ? ` data-day01-quiz-id="${escapeHtml(options.quizId)}"` : "";

    return `
      <div
        class="choice-list"
        data-choice-group
        ${quizAttribute}
        data-correct-feedback="${escapeHtml(group.correctFeedback)}"
        data-incorrect-feedback="${escapeHtml(group.incorrectFeedback || group.correctFeedback)}"
      >
        ${group.choices
          .map(
            (choice) => `
              <button
                class="choice-button"
                type="button"
                aria-pressed="false"
                data-choice-button
                data-correct="${choice.correct ? "true" : "false"}"
                data-choice-value="${escapeHtml(choice.value || choice.text)}"
              >
                ${escapeHtml(choice.text)}
              </button>
            `
          )
          .join("")}
        <p class="inline-feedback" data-feedback-region hidden></p>
      </div>
    `;
  }

  function getCarryResult(lesson) {
    const recordSource = currentStudentRecords || {};
    const previousRecord = recordSource[lesson.bridge.carry.previousDayId];

    return previousRecord && (previousRecord.todayDecision || previousRecord.resultSummary)
      ? previousRecord.todayDecision || previousRecord.resultSummary
      : lesson.bridge.carry.fallbackResult;
  }

  function getProjectReloadRecord(lesson) {
    const recordSource = currentStudentRecords || {};
    const previous = lesson.projectReload.previousRecord;
    const evidence = lesson.projectReload.evidence;
    const previousRecord = recordSource[previous.previousDayId] || {};
    const problemDefinition = String(previousRecord[previous.problemDefinitionField] || "").trim();
    const nextAction = String(previousRecord[previous.nextActionField] || "").trim();
    const memo = String(previousRecord[evidence.memoField] || "").trim();
    const hasProblemDefinition = Boolean(problemDefinition);
    const hasNextAction = Boolean(nextAction);
    const hasSelectionReason = Boolean(memo);

    return {
      hasAnyRealRecord: hasProblemDefinition || hasNextAction || hasSelectionReason,
      hasProblemDefinition,
      hasNextAction,
      hasSelectionReason,
      problemDefinition,
      nextAction,
      memo,
      exampleProblemDefinition: previous.fallbackProblemDefinition,
      exampleNextAction: previous.fallbackNextAction,
      exampleMemo: evidence.fallbackMemo,
    };
  }

  function getReloadRecordTitle(reload, record) {
    return record.hasAnyRealRecord ? reload.previousRecord.title : "지난 연구 기록 예시";
  }

  function getReloadRecordNote(record) {
    return record.hasAnyRealRecord
      ? ""
      : "아직 불러올 지난 연구기록이 없습니다. 아래 내용은 화면 확인을 위한 예시입니다.";
  }

  function getReloadMemoLabel(reload, record) {
    return record.hasAnyRealRecord ? reload.evidence.memoLabel : "예시 메모";
  }

  function renderResearchBridge(lesson) {
    return `
      <section class="lesson-section research-bridge" id="research-bridge" data-section="researchBridge">
        <p class="section-kicker">연구 이어보기</p>
        <h2 class="section-title">지난 연구에서 오늘 연구로</h2>

        <div class="story-step" data-section="researchBridgeRecall">
          <p class="step-label">${escapeHtml(lesson.bridge.recall.title)}</p>
          <p class="question-text">${escapeHtml(lesson.bridge.recall.question)}</p>
          ${renderChoiceGroup(lesson.bridge.recall)}
        </div>

        <div class="story-step" data-section="researchBridgeCarry">
          <p class="step-label">${escapeHtml(lesson.bridge.carry.title)}</p>
          <p class="carried-result">${escapeHtml(getCarryResult(lesson))}</p>
          <p class="reusable-idea">
            <span>오늘 다시 사용할 생각</span>
            ${escapeHtml(lesson.bridge.carry.reusableIdea)}
          </p>
        </div>

        <div class="story-step" data-section="researchBridgeConnect">
          <p class="question-text">${escapeHtml(lesson.bridge.connect.question)}</p>
          ${renderChoiceGroup(lesson.bridge.connect)}
        </div>

        <div class="section-action">
          <a class="primary-link" href="#today-research">오늘 연구 확인하기 →</a>
        </div>
      </section>
    `;
  }

  function renderProjectReload(lesson) {
    const reload = lesson.projectReload;
    const record = getProjectReloadRecord(lesson);
    const recordNote = getReloadRecordNote(record);

    return `
      <section
        class="lesson-section project-reload"
        id="project-reload"
        data-section="projectReload"
        data-has-saved-record="${record.hasAnyRealRecord ? "true" : "false"}"
        data-example-problem="${escapeHtml(record.exampleProblemDefinition)}"
        data-example-next="${escapeHtml(record.exampleNextAction)}"
        data-example-memo="${escapeHtml(record.exampleMemo)}"
      >
        <p class="section-kicker">연구 다시 이어가기</p>
        <h2 class="section-title">${escapeHtml(reload.recall.title)}</h2>

        <div class="story-step" data-section="projectReloadRecall">
          <div class="readable-copy project-reload__lead">
            ${renderParagraphs(reload.recall.lead)}
          </div>
          <div class="project-reload__fields">
            ${reload.recall.fields.map((field) => renderTextInputField(field, "reload")).join("")}
          </div>
          <div class="section-action">
            <button class="primary-link project-reload__button" type="button" data-reveal-project-reload>
              ${escapeHtml(
              reload.recall.actionLabel
            )}
            </button>
          </div>
        </div>

        <div class="story-step" id="project-reload-record" data-section="projectReloadRecord" data-reload-hidden hidden>
          <h3 class="step-label" tabindex="-1" data-reload-record-title>${escapeHtml(
            getReloadRecordTitle(reload, record)
          )}</h3>
          <p class="section-description project-reload__notice" data-reload-record-note${
            recordNote ? "" : " hidden"
          }>${escapeHtml(recordNote)}</p>
          <p class="carried-result" data-reload-problem>${escapeHtml(
            record.hasAnyRealRecord
              ? record.problemDefinition || "기록이 없습니다."
              : record.exampleProblemDefinition
          )}</p>
          <div class="plain-group">
            <h3>그때 적어 둔 다음 연구</h3>
            <p data-reload-next>${escapeHtml(
              record.hasAnyRealRecord ? record.nextAction || "기록이 없습니다." : record.exampleNextAction
            )}</p>
          </div>
        </div>

        <div class="story-step" data-section="projectReloadEvidence" data-reload-hidden hidden>
          <p class="question-text">${escapeHtml(reload.evidence.title)}</p>
          <div class="plain-group">
            <h3 data-reload-memo-label>${escapeHtml(getReloadMemoLabel(reload, record))}</h3>
            <p data-reload-memo>${escapeHtml(
              record.hasAnyRealRecord ? record.memo || "기록이 없습니다." : record.exampleMemo
            )}</p>
          </div>
          <details class="help-toggle">
            <summary>${escapeHtml(reload.evidence.materialsSummary)}</summary>
            ${renderPlainList(reload.evidence.materials, "help-list")}
          </details>
        </div>

        <div class="story-step" data-section="projectReloadExplain" data-reload-hidden hidden>
          <p class="question-text">${escapeHtml(reload.explain.title)}</p>
          <p class="section-description">${escapeHtml(reload.explain.lead)}</p>
          <div class="plain-group">
            <h3>${escapeHtml(reload.explain.guide)}</h3>
            ${renderNumberedList(reload.explain.points, "task-list")}
          </div>
          <label class="checkbox-option project-reload__check">
            <input type="checkbox">
            <span>${escapeHtml(reload.explain.checkboxLabel)}</span>
          </label>
        </div>

        <div class="story-step" data-section="projectReloadConnect" data-reload-hidden hidden>
          <p class="carried-result">${escapeHtml(reload.connect.lead)}</p>
          <div class="readable-copy">
            ${renderParagraphs(reload.connect.paragraphs)}
          </div>
          <div class="plain-group">
            <h3>오늘의 연구</h3>
            <p>${escapeHtml(reload.connect.todayTitle)}</p>
          </div>
          ${renderPlainList(reload.connect.blocks, "project-reload__block-list")}
          <p class="next-connection">${escapeHtml(reload.connect.nextConnection)}</p>
          <div class="section-action">
            <a class="primary-link" href="#today-research">${escapeHtml(
              reload.connect.actionLabel
            )}</a>
          </div>
        </div>
      </section>
    `;
  }

  function getDay01ChallengeStatus(challengeId) {
    if (!isDay01Active()) {
      return false;
    }

    const progress = activeDayState.lessonProgress || {};

    if (challengeId === "problem") {
      return Boolean(progress.block01Completed);
    }

    if (challengeId === "tools") {
      return Boolean(progress.block02Completed);
    }

    if (challengeId === "device") {
      return Boolean(progress.block03Completed);
    }

    return false;
  }

  function getDay01ProgressSteps(state = activeDayState) {
    const progress = state && state.lessonProgress ? state.lessonProgress : {};
    const completedKeys = [
      Boolean(progress.block01Completed),
      Boolean(progress.block02Completed),
      Boolean(progress.block03Completed),
      Boolean(state && state.dayCompleted),
    ];
    const currentIndex = completedKeys.findIndex((isComplete) => !isComplete);

    return [
      "① 문제와 기술",
      "② 마이크로비트",
      "③ 자유 연구",
      "④ 연구 마무리",
    ].map((label, index) => {
      const isComplete = completedKeys[index];
      const isCurrent = !isComplete && index === (currentIndex === -1 ? 3 : currentIndex);

      return {
        label,
        mark: isComplete ? "✓" : isCurrent ? "●" : "○",
        status: isComplete ? "complete" : isCurrent ? "current" : "upcoming",
      };
    });
  }

  function renderDay01ProgressLine() {
    const steps = getDay01ProgressSteps();

    return `
      <nav class="day01-progress-line" aria-label="오늘 연구 안의 현재 위치">
        ${steps
          .map(
            (step) => `
              <span
                class="day01-progress-line__step day01-progress-line__step--${escapeHtml(
                  step.status
                )}"
                data-day01-progress-step
              >
                <span data-day01-progress-label>${escapeHtml(step.label)}</span>
                <strong data-day01-progress-mark>${escapeHtml(step.mark)}</strong>
              </span>
            `
          )
          .join('<span class="day01-progress-line__connector" aria-hidden="true"></span>')}
      </nav>
    `;
  }

  function updateDay01ProgressLine() {
    const steps = getDay01ProgressSteps();
    const stepElements = elements.standardDay.querySelectorAll("[data-day01-progress-step]");

    stepElements.forEach((element, index) => {
      const step = steps[index];
      const mark = element.querySelector("[data-day01-progress-mark]");

      element.classList.remove(
        "day01-progress-line__step--complete",
        "day01-progress-line__step--current",
        "day01-progress-line__step--upcoming"
      );
      element.classList.add(`day01-progress-line__step--${step.status}`);
      element.setAttribute("aria-current", step.status === "current" ? "step" : "false");

      if (mark) {
        mark.textContent = step.mark;
      }
    });
  }

  function shouldRenderSequentialNav(lesson) {
    return lesson.dayId !== "day01";
  }

  function renderTodayResearch(lesson) {
    const today = lesson.todayResearch;
    const firstBlockId = lesson.lessonBlocks && lesson.lessonBlocks[0] ? lesson.lessonBlocks[0].blockId : "today-quiz";
    const renderSequentialNav = shouldRenderSequentialNav(lesson);

    return `
      <section class="lesson-section today-research" id="today-research" data-section="todayResearch">
        <p class="section-kicker">${escapeHtml(today.label)}</p>
        <h2 class="section-title">${escapeHtml(today.title)}</h2>

        <p class="core-statement">${escapeHtml(today.coreStatement)}</p>
        <p class="big-question">${escapeHtml(today.question)}</p>
        ${lesson.dayId === "day01" ? renderDay01ProgressLine() : ""}

        <div class="plain-group">
          <h3>오늘 할 연구</h3>
          <ol class="research-summary-list">
            ${today.blocks
              .map(
                (block) => `
                  <li data-day01-challenge="${escapeHtml(block.challengeId || "")}" class="${
                    block.challengeId && getDay01ChallengeStatus(block.challengeId)
                      ? "is-complete"
                      : ""
                  }">
                    <span>${escapeHtml(block.number)}</span>
                    <span>${escapeHtml(block.title)}</span>
                    ${
                      block.challengeId
                        ? `<strong data-day01-challenge-mark>${getDay01ChallengeStatus(
                            block.challengeId
                          ) ? "완료 ✓" : "진행 전"}</strong>`
                        : ""
                    }
                  </li>
                `
              )
              .join("")}
          </ol>
        </div>

        <div class="plain-group">
          <h3>오늘 완성할 것</h3>
          <p>${escapeHtml(today.outcome)}</p>
        </div>

        <p class="next-connection">${escapeHtml(today.nextConnection)}</p>

        ${
          renderSequentialNav
            ? `<div class="section-action">
                <a class="primary-link" href="#${escapeHtml(firstBlockId)}">연구 시작하기 →</a>
              </div>`
            : ""
        }
      </section>
    `;
  }

  function getOrderedItems(items, order) {
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const ordered = (order || []).map((itemId) => itemMap.get(itemId)).filter(Boolean);
    const missing = items.filter((item) => !ordered.some((orderedItem) => orderedItem.id === item.id));

    return [...ordered, ...missing];
  }

  function renderActivitySequence(activity) {
    return `
      <div class="day01-activity-sequence">
        ${activity.items.map((item) => renderBlockActivity(item)).join("")}
      </div>
    `;
  }

  function renderLessonGuideFigure(activity) {
    if (!activity.image) {
      return "";
    }

    return `
      <figure class="lesson-guide-figure">
        <img
          class="lesson-guide-image"
          src="${escapeHtml(activity.image)}"
          alt="${escapeHtml(activity.imageAlt || activity.title || "학습 안내 이미지")}"
        >
        ${
          activity.caption
            ? `<figcaption class="lesson-guide-caption">${escapeHtml(activity.caption)}</figcaption>`
            : ""
        }
      </figure>
    `;
  }

  function renderActivityLabel(label) {
    return `<p class="activity-label">${escapeHtml(label)}</p>`;
  }

  function renderActivityStep(label, guide, content = "", className = "") {
    const classAttribute = className ? ` ${escapeHtml(className)}` : "";

    return `
      <div class="activity-step${classAttribute}">
        ${renderActivityLabel(label)}
        ${guide ? `<p class="activity-guide">${escapeHtml(guide)}</p>` : ""}
        ${content}
      </div>
    `;
  }

  function renderNoticeActivity(activity) {
    return `
      <div class="plain-group block-activity day01-activity day01-notice" data-day01-activity="notice">
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep("알아보기", "", renderParagraphs(activity.paragraphs || []))}
      </div>
    `;
  }

  function renderGuideImageActivity(activity) {
    return `
      <div class="plain-group block-activity day01-activity day01-guide" data-day01-activity="guide-image">
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep(
          "알아보기",
          activity.caption || "그림을 보며 핵심 개념을 확인하세요.",
          `${renderLessonGuideFigure(Object.assign({}, activity, { caption: "" }))}${
            activity.summaryLines
              ? `<div class="lesson-guide-summary activity-result">${renderParagraphs(
                  activity.summaryLines
                )}</div>`
              : ""
          }`
        )}
      </div>
    `;
  }

  function renderMakeCodeStartActivity(activity) {
    return `
      <div class="plain-group block-activity day01-activity makecode-start" data-day01-activity="makecode-start">
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep(
          "해보기",
          activity.prompt,
          `${renderNumberedList(activity.steps || [], "task-list")}${
            activity.examples && activity.examples.length
              ? `
                <div class="example-chip-list" aria-label="프로젝트 이름 예시">
                  ${activity.examples
                    .map((example) => `<span class="example-chip">${escapeHtml(example)}</span>`)
                    .join("")}
                </div>
              `
              : ""
          }
          <a
            class="primary-link makecode-open-link"
            href="${escapeHtml(activity.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${escapeHtml(activity.linkLabel)}
          </a>`
        )}
      </div>
    `;
  }

  function renderMakeCodeUiCheckActivity(activity) {
    const checkedItems = activeDayState ? activeDayState.makeCodeUiCheckItems || [] : [];

    return `
      <div class="plain-group block-activity day01-activity makecode-ui-check" data-day01-activity="makecode-ui-check">
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep(
          "찾아보기",
          activity.prompt,
          `<div class="checkbox-group">
            ${(activity.items || [])
              .map((item, index) => {
                const value = String(index + 1);
                const inputId = `makecode-ui-check-${index + 1}`;

                return `
                  <label class="checkbox-option" for="${escapeHtml(inputId)}">
                    <input
                      id="${escapeHtml(inputId)}"
                      type="checkbox"
                      value="${escapeHtml(value)}"
                      data-makecode-ui-check
                      ${checkedItems.includes(value) ? "checked" : ""}
                    >
                    <span>${escapeHtml(item)}</span>
                  </label>
                `;
              })
              .join("")}
          </div>
          <details class="lesson-guide-details">
            <summary>${escapeHtml(activity.helpSummary)}</summary>
            ${renderLessonGuideFigure(activity)}
          </details>`
        )}
      </div>
    `;
  }

  function renderSavedChecklistActivity(activity) {
    const stateListKey = activity.stateListKey || "";
    const checkedItems = activeDayState && stateListKey ? activeDayState[stateListKey] || [] : [];

    return `
      <div
        class="plain-group block-activity day01-activity saved-checklist"
        data-day01-activity="saved-checklist"
        data-state-list-key="${escapeHtml(stateListKey)}"
      >
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep(
          "확인하기",
          activity.prompt,
          `${activity.note ? `<p class="field-help">${escapeHtml(activity.note)}</p>` : ""}
          ${renderLessonGuideFigure(activity)}
          <div class="checkbox-group">
            ${(activity.items || [])
              .map((item, index) => {
                const value = String(index + 1);
                const inputId = `${stateListKey || "saved-checklist"}-${index + 1}`;

                return `
                  <label class="checkbox-option" for="${escapeHtml(inputId)}">
                    <input
                      id="${escapeHtml(inputId)}"
                      type="checkbox"
                      value="${escapeHtml(value)}"
                      data-saved-checklist-item
                      ${checkedItems.includes(value) ? "checked" : ""}
                    >
                    <span>${escapeHtml(item)}</span>
                  </label>
                `;
              })
              .join("")}
          </div>`
        )}
      </div>
    `;
  }

  function renderProblemSituationCards(activity, discovered = {}) {
    return `
      <div class="scenario-grid problem-discovery-situation-grid">
        ${(activity.situations || [])
          .map((situation) => {
            const isSelected = discovered.situationId === situation.id;

            return `
              <button
                class="scenario-card${isSelected ? " is-selected" : ""}"
                type="button"
                aria-pressed="${isSelected ? "true" : "false"}"
                data-problem-card="${escapeHtml(situation.id)}"
              >
                <span class="scenario-card__media">
                  ${
                    situation.image
                      ? `<img src="${escapeHtml(situation.image)}" alt="${escapeHtml(
                          situation.imageAlt || situation.title
                        )}">`
                      : "이미지 자리"
                  }
                </span>
                <span class="scenario-card__title">${escapeHtml(situation.title)}</span>
                <span class="scenario-card__description">${escapeHtml(situation.description)}</span>
                <strong class="scenario-card__mark"${isSelected ? "" : " hidden"}>발견</strong>
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderProblemMeaningPanel(activity, selectedSituation, discovered = {}) {
    const discoveredProblem = getDiscoveredProblemSummary(discovered);
    const meaningOptions = selectedSituation ? uniqueItems(selectedSituation.meaningOptions) : [];

    return `
      <div class="problem-discovery-panel__inner">
        <div class="problem-discovery-panel__header">
          ${renderActivityLabel("골라보기")}
          <h4>어떤 불편인가요?</h4>
          ${
            selectedSituation
              ? `<p>선택한 상황 <strong>${escapeHtml(selectedSituation.title)}</strong></p>`
              : "<p>← 먼저 왼쪽에서 상황을 하나 골라보세요.</p>"
          }
        </div>
        ${
          selectedSituation
            ? `
              <fieldset class="problem-meaning-options" data-problem-meaning-group>
                <legend>불편 선택</legend>
                ${meaningOptions
                  .map((option, index) => {
                    const optionId = `problem-meaning-${selectedSituation.id}-${index + 1}`;

                    return `
                      <label class="problem-meaning-option" for="${escapeHtml(optionId)}">
                        <input
                          id="${escapeHtml(optionId)}"
                          name="problem-meaning"
                          type="radio"
                          value="${escapeHtml(option)}"
                          data-problem-meaning
                          ${discovered.meaning === option ? "checked" : ""}
                        >
                        <span>${escapeHtml(option)}</span>
                      </label>
                    `;
                  })
                  .join("")}
              </fieldset>
            `
            : ""
        }
        <div class="problem-summary activity-result${discoveredProblem ? "" : " problem-summary--empty"}" data-problem-summary>
          ${renderActivityLabel("결과")}
          <p>내가 발견한 문제</p>
          <strong data-problem-summary-text>${escapeHtml(
            discoveredProblem || "불편을 하나 선택하면 문장이 완성됩니다."
          )}</strong>
        </div>
      </div>
    `;
  }

  function renderProblemHotspotActivity(activity) {
    const state = activeDayState || {};
    const discovered = state.discoveredProblem || {};
    const selectedSituation = activity.situations.find(
      (situation) => situation.id === discovered.situationId
    );
    const discoveredProblem = getDiscoveredProblemSummary(discovered);

    return `
      <div class="plain-group block-activity day01-activity problem-discovery-activity" data-day01-activity="problem-hotspot">
        <h3>${escapeHtml(activity.title)}</h3>
        <p>${escapeHtml(activity.prompt)}</p>
        <div class="problem-discovery-board">
          <section class="problem-discovery-situations" aria-label="상황 선택">
            ${renderActivityLabel("찾아보기")}
            <h4>상황 선택</h4>
            <p class="activity-guide">상황을 하나 골라보세요.</p>
            ${renderProblemSituationCards(activity, discovered)}
          </section>
          <section
            class="problem-discovery-panel"
            data-problem-meaning-panel
            aria-label="불편 선택과 발견한 문제"
          >
            ${renderProblemMeaningPanel(activity, selectedSituation, discovered)}
          </section>
        </div>
        <p class="inline-feedback inline-feedback--correct" data-day01-feedback="problem-hotspot"${
          discoveredProblem ? "" : " hidden"
        }>${escapeHtml(activity.successFeedback)}</p>
      </div>
    `;
  }

  function getProblemHotspotActivity() {
    return getDay01NestedActivities().find((item) => item.type === "problem-hotspot");
  }

  function getProblemSituation(situationId) {
    const activity = getProblemHotspotActivity();

    return activity ? activity.situations.find((item) => item.id === situationId) : null;
  }

  function getDiscoveredProblemSummary(discovered = {}) {
    if (!discovered || !discovered.situationId || !discovered.meaning) {
      return "";
    }

    const situation = getProblemSituation(discovered.situationId);
    const target = discovered.target || (situation ? situation.target : "");

    return target ? `${target}\n${discovered.meaning}` : discovered.meaning;
  }

  function getCardMatchActivity() {
    return getDay01NestedActivities().find((item) => item.type === "card-match");
  }

  function getMatchCard(groupId, cardId) {
    const activity = getCardMatchActivity();
    const group = activity ? activity.groups.find((item) => item.id === groupId) : null;

    return group ? group.cards.find((card) => card.id === cardId) : null;
  }

  function getCardMatchStatus(match) {
    const hasAllSelections = Boolean(match && match.person && match.problem && match.help);

    if (!hasAllSelections) {
      return {
        hasAllSelections,
        isValid: false,
      };
    }

    const person = getMatchCard("person", match.person);
    const problem = getMatchCard("problem", match.problem);
    const help = getMatchCard("help", match.help);
    const matchSet = person && person.matchSet;
    const isValid = Boolean(
      matchSet &&
        problem &&
        help &&
        problem.matchSet === matchSet &&
        help.matchSet === matchSet
    );

    return {
      hasAllSelections,
      isValid,
    };
  }

  function renderCardMatchActivity(activity) {
    const match = activeDayState ? activeDayState.problemHelpMatch : {};
    const status = getCardMatchStatus(match);

    return `
      <div class="plain-group block-activity day01-activity" data-day01-activity="card-match">
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep(
          "생각하기",
          activity.intro || activity.prompt,
          activity.intro ? `<p>${escapeHtml(activity.prompt)}</p>` : ""
        )}
        <div class="match-board">
          ${activity.groups
            .map(
              (group) => `
                <section class="match-column" aria-labelledby="match-${escapeHtml(group.id)}">
                  <h4 id="match-${escapeHtml(group.id)}">${escapeHtml(group.title)}</h4>
                  <div class="match-card-list">
                    ${getOrderedMatchCards(group, match)
                      .map((card) => {
                        const isSelected = match && match[group.id] === card.id;

                        return `
                          <button
                            class="match-card${isSelected ? " is-selected" : ""}"
                            type="button"
                            aria-pressed="${isSelected ? "true" : "false"}"
                            data-match-group="${escapeHtml(group.id)}"
                            data-match-card="${escapeHtml(card.id)}"
                          >
                            ${escapeHtml(card.text)}
                          </button>
                        `;
                      })
                      .join("")}
                  </div>
                </section>
              `
            )
            .join("")}
        </div>
        <p class="inline-feedback${status.isValid ? " inline-feedback--correct" : ""}" data-day01-feedback="card-match"${
          status.hasAllSelections ? "" : " hidden"
        }>${escapeHtml(status.isValid ? activity.successFeedback : activity.wrongFeedback)}</p>
      </div>
    `;
  }

  function getOrderedMatchCards(group, match) {
    const cardOrder = match && match.cardOrder ? match.cardOrder[group.id] : [];

    return getOrderedItems(group.cards, cardOrder);
  }

  function renderResearchOrderCard(card, source, slotIndex = "") {
    const isSelected = selectedResearchOrderCard === card.id;
    const slotAttribute = slotIndex === "" ? "" : ` data-slot-index="${escapeHtml(slotIndex)}"`;

    return `
      <button
        class="research-order-card${isSelected ? " is-selected" : ""}"
        type="button"
        draggable="true"
        data-research-order-card="${escapeHtml(card.id)}"
        data-research-order-source="${escapeHtml(source)}"
        ${slotAttribute}
        aria-pressed="${isSelected ? "true" : "false"}"
      >
        <span>${escapeHtml(card.text)}</span>
      </button>
    `;
  }

  function getResearchOrderSlots(activity, state = activeDayState) {
    const savedOrder = state ? normalizeResearchOrder(state.researchOrder) : [];

    return savedOrder.length ? savedOrder : Array(activity.steps.length).fill("");
  }

  function getResearchOrderCardById(activity, cardId) {
    return activity.steps.find((step) => step.id === cardId) || null;
  }

  function renderResearchOrderSlotActivity(activity) {
    const slots = getResearchOrderSlots(activity);
    const placedCards = new Set(slots.filter(Boolean));
    const poolOrder = (activity.initialOrder || activity.steps.map((step) => step.id)).filter(
      (cardId) => !placedCards.has(cardId)
    );
    const allSlotsFilled = slots.every(Boolean);

    return `
      <div
        class="plain-group block-activity day01-activity research-order-activity"
        data-day01-activity="sequence-sort"
        data-research-order-activity
        data-correct-order="${escapeHtml(activity.correctOrder.join("|"))}"
        data-success-feedback="${escapeHtml(activity.successFeedback || "")}"
        data-retry-feedback="${escapeHtml(activity.retryFeedback || "")}"
      >
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep("생각하기", activity.prompt)}

        <section class="research-order-area" aria-labelledby="research-order-pool-title">
          ${renderActivityLabel("해보기")}
          <h4 id="research-order-pool-title">섞인 연구 카드</h4>
          <p>카드를 아래 순서 칸으로 끌어 놓으세요.</p>
          <div class="research-order-scroll" data-research-order-pool>
            <div class="research-order-card-row" data-research-order-pool-row>
              ${
                poolOrder.length
                  ? poolOrder
                      .map((cardId) => getResearchOrderCardById(activity, cardId))
                      .filter(Boolean)
                      .map((card) => renderResearchOrderCard(card, "pool"))
                      .join("")
                  : `<p class="research-order-empty">모든 카드를 아래에 놓았습니다.</p>`
              }
            </div>
          </div>
        </section>

        <section class="research-order-area" aria-labelledby="research-order-slots-title">
          <h4 id="research-order-slots-title">연구 순서 완성하기</h4>
          <p class="research-order-scroll-hint">← 옆으로 밀어 전체 순서를 볼 수 있어요 →</p>
          <div class="research-order-scroll">
            <ol class="research-order-slots" data-research-order-slots>
              ${slots
                .map((cardId, index) => {
                  const card = cardId ? getResearchOrderCardById(activity, cardId) : null;
                  const isSelected = card && selectedResearchOrderCard === card.id;

                  return `
                    <li class="research-order-slot-wrap">
                      <button
                        class="research-order-slot${card ? " is-filled" : ""}${
                    isSelected ? " is-selected" : ""
                  }"
                        type="button"
                        data-research-order-slot="${index}"
                        ${card ? `data-research-order-card="${escapeHtml(card.id)}"` : ""}
                        ${card ? `data-research-order-source="slot" data-slot-index="${index}" draggable="true"` : ""}
                        aria-label="${index + 1}번 연구 순서 칸${
                    card ? `, ${escapeHtml(card.text)}` : ", 비어 있음"
                  }"
                        aria-pressed="${isSelected ? "true" : "false"}"
                      >
                        <span class="research-order-slot__number">${index + 1}</span>
                        <span class="research-order-slot__content">${
                          card ? escapeHtml(card.text) : "여기에 놓기"
                        }</span>
                      </button>
                    </li>
                  `;
                })
                .join("")}
            </ol>
          </div>
        </section>

        <div class="research-order-actions">
          <button
            class="secondary-button"
            type="button"
            data-research-order-check
            ${allSlotsFilled ? "" : "disabled"}
          >
            ${escapeHtml(activity.checkLabel)}
          </button>
          <p class="field-help"${allSlotsFilled ? " hidden" : ""}>7개의 연구 카드를 모두 놓아보세요.</p>
        </div>
        <p class="inline-feedback${
          activeDayState && activeDayState.researchOrderCompleted
            ? " inline-feedback--correct"
            : ""
        }" data-day01-feedback="research-order"${
          activeDayState && activeDayState.researchOrderCompleted ? "" : " hidden"
        }>${escapeHtml(
      activeDayState && activeDayState.researchOrderCompleted
        ? activity.successFeedback
        : activity.retryFeedback
    )}</p>
      </div>
    `;
  }

  function renderSequenceSortActivity(activity) {
    return `
      ${renderResearchOrderSlotActivity(activity)}
    `;
  }

  function renderRolePickActivity(activity) {
    const selectedRoles = activeDayState ? activeDayState.selectedRoles : [];

    return `
      <div
        class="plain-group block-activity day01-activity"
        data-day01-activity="role-pick"
        data-role-max="${activity.max}"
      >
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep(
          "알아보기",
          "각 역할이 어떤 일을 하는지 읽어보세요.",
          `<div class="role-guide">
            <p>${escapeHtml(activity.prompt)}</p>
            ${activity.note ? `<p>${escapeHtml(activity.note)}</p>` : ""}
          </div>`
        )}
        ${renderActivityStep("골라보기", `내가 해보고 싶은 역할을 최대 ${activity.max}개 골라보세요.`)}
        <div class="pill-grid role-grid">
          ${activity.roles
            .map((role) => {
              const roleName = typeof role === "string" ? role : role.name;
              const description = typeof role === "string" ? "" : role.description;
              const isSelected = selectedRoles.includes(roleName);

              return `
                <button
                  class="pill-button${isSelected ? " is-selected" : ""}"
                  type="button"
                  aria-pressed="${isSelected ? "true" : "false"}"
                  data-role-option="${escapeHtml(roleName)}"
                >
                  <strong>${escapeHtml(roleName)}</strong>
                  ${description ? `<span>${escapeHtml(description)}</span>` : ""}
                </button>
              `;
            })
            .join("")}
        </div>
        <p class="inline-feedback inline-feedback--correct" data-day01-feedback="role-pick"${
          selectedRoles.length ? "" : " hidden"
        }>${escapeHtml(activity.successFeedback)}</p>
      </div>
    `;
  }

  function renderIpoFlow(flow) {
    if (!flow) {
      return "";
    }

    const items = [
      {
        label: "입력",
        help: "장치가 알아차리는 것",
        text: flow.input,
      },
      {
        label: "처리",
        help: "프로그램에 정한 규칙대로 무엇을 할지 정하는 부분",
        text: flow.process,
      },
      {
        label: "출력",
        help: "장치가 반응하는 것",
        text: flow.output,
      },
    ];

    return `
      <div class="ipo-flow" aria-label="입력 처리 출력 흐름">
        ${items
          .map(
            (item) => `
              <div class="ipo-flow__item">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.help)}</span>
                <p>${escapeHtml(item.text)}</p>
              </div>
            `
          )
          .join('<span class="ipo-flow__arrow" aria-hidden="true">→</span>')}
      </div>
    `;
  }

  function renderCodePredictionGoal(activity) {
    const flow = activity.ipoFlow || {};

    return `
      <div class="code-prediction-goal" aria-label="입력과 출력 목표">
        <div class="code-prediction-goal__item">
          <strong>입력</strong>
          <p>${escapeHtml(flow.input || "")}</p>
        </div>
        <span class="code-prediction-goal__arrow" aria-hidden="true">→</span>
        <div class="code-prediction-goal__question">
          <span>어떤 프로그램 블록이 필요할까요?</span>
        </div>
        <span class="code-prediction-goal__arrow" aria-hidden="true">→</span>
        <div class="code-prediction-goal__item">
          <strong>출력</strong>
          <p>${escapeHtml(flow.output || "")}</p>
        </div>
      </div>
    `;
  }

  function renderCodePredictionPreview(activity, selections) {
    const selectedBlocks = uniqueItems(selections)
      .map((blockId) => getCodePredictionBlock(activity, blockId))
      .filter(Boolean);

    if (!selectedBlocks.length) {
      return "";
    }

    const eventBlock = selectedBlocks.find((block) => block.id === "event-a");
    const actionBlocks = selectedBlocks.filter((block) => block.id !== "event-a");

    return `
      ${renderActivityLabel("결과")}
      <p class="code-prediction-preview__title">내가 예상한 코드</p>
      <div class="code-preview-block${eventBlock ? "" : " code-preview-block--missing-event"}">
        <strong>${escapeHtml(eventBlock ? eventBlock.text : "시작 조건을 아직 고르지 않았어요")}</strong>
        <div class="code-preview-block__body">
          ${
            actionBlocks.length
              ? actionBlocks
                  .map(
                    (block) => `
                      <span class="code-preview-action">${escapeHtml(block.text)}</span>
                    `
                  )
                  .join("")
              : '<span class="code-preview-placeholder">실행할 블록을 더 골라보세요.</span>'
          }
        </div>
      </div>
    `;
  }

  function renderCodePredictionActivity(activity) {
    const selections = activeDayState ? activeDayState.codePredictionSelections || [] : [];
    const maxSelections = getCodePredictionMaxSelections(activity);
    const canCheck = selections.length === maxSelections;
    const isCompleted = Boolean(activeDayState && activeDayState.buttonPredictionCompleted);

    return `
      <div class="plain-group block-activity day01-activity" data-day01-activity="code-prediction">
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep("생각하기", activity.prompt)}
        ${renderCodePredictionGoal(activity)}
        ${renderActivityStep("골라보기", "필요한 블록 2개를 골라보세요.")}
        <div class="code-prediction-blocks" aria-label="필요한 블록 선택">
          ${activity.blocks
            .map((block) => {
              const isSelected = selections.includes(block.id);

              return `
                <button
                  class="code-prediction-choice${isSelected ? " is-selected" : ""}"
                  type="button"
                  aria-pressed="${isSelected ? "true" : "false"}"
                  data-code-prediction-choice="${escapeHtml(block.id)}"
                >
                  <span>${escapeHtml(block.text)}</span>
                  <strong class="code-prediction-choice__mark"${isSelected ? "" : " hidden"}>
                    선택됨 ✓
                  </strong>
                </button>
              `;
            })
            .join("")}
        </div>
        <p class="field-help code-prediction-limit" data-code-prediction-limit aria-live="polite">
          ${canCheck ? "선택을 바꾸려면 하나를 해제한 뒤 다시 골라보세요." : "필요한 블록 2개를 골라보세요."}
        </p>
        <div class="code-prediction-preview activity-result" data-code-prediction-preview${selections.length ? "" : " hidden"}>
          ${renderCodePredictionPreview(activity, selections)}
        </div>
        <div class="activity-step code-prediction-check-step">
          ${renderActivityLabel("확인하기")}
          <button class="secondary-button" type="button" data-code-prediction-check${canCheck ? "" : " disabled"}>
            ${escapeHtml(activity.checkLabel)}
          </button>
        </div>
        <p class="inline-feedback${isCompleted ? " inline-feedback--correct" : ""}" data-day01-feedback="code-prediction"${
      isCompleted ? "" : " hidden"
    }>${escapeHtml(isCompleted ? activity.successFeedback : activity.retryFeedback)}</p>
      </div>
    `;
  }

  function getChecklistKey(activity) {
    return activity.stateKey === "buttonToolCompleted" ? "buttonChecklist" : "shakeChecklist";
  }

  function renderMakeCodeChecklistActivity(activity) {
    const checklistKey = getChecklistKey(activity);
    const checkedItems = activeDayState ? activeDayState[checklistKey] || [] : [];
    const completed = activeDayState ? Boolean(activeDayState[activity.stateKey]) : false;
    const makeSteps = activity.steps.slice(0, Math.max(1, activity.steps.length - 1));
    const testSteps = activity.steps.slice(makeSteps.length);
    const renderChecklistItems = (steps, offset = 0) =>
      steps
        .map((step, index) => {
          const value = String(offset + index + 1);
          const inputId = `${activity.stateKey}-${value}`;

          return `
            <label class="checkbox-option" for="${escapeHtml(inputId)}">
              <input
                id="${escapeHtml(inputId)}"
                type="checkbox"
                value="${escapeHtml(value)}"
                data-makecode-step
                ${checkedItems.includes(value) ? "checked" : ""}
              >
              <span>${escapeHtml(step)}</span>
            </label>
          `;
        })
        .join("");

    return `
      <div
        class="plain-group block-activity day01-activity"
        data-day01-activity="makecode-checklist"
        data-state-key="${escapeHtml(activity.stateKey)}"
        data-checklist-key="${escapeHtml(checklistKey)}"
        data-unlock-tools="${escapeHtml(activity.unlockTools.join("|"))}"
      >
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderIpoFlow(activity.ipoFlow)}
        <div class="activity-step">
          ${renderActivityLabel("해보기")}
          <p class="activity-guide">${escapeHtml(activity.prompt)}</p>
          <div class="checkbox-group">
            ${renderChecklistItems(makeSteps, 0)}
          </div>
        </div>
        ${
          testSteps.length
            ? `<div class="activity-step">
                ${renderActivityLabel("시험하기")}
                <div class="checkbox-group">
                  ${renderChecklistItems(testSteps, makeSteps.length)}
                </div>
              </div>`
            : ""
        }
        <p class="inline-feedback inline-feedback--correct" data-day01-feedback="${escapeHtml(
          activity.stateKey
        )}"${completed ? "" : " hidden"}>${escapeHtml(activity.successFeedback)}</p>
      </div>
    `;
  }

  function renderShakeTransition(activity, state) {
    const selectedLed = state && state.shakeLedChoice ? state.shakeLedChoice : "내가 고른 LED";

    return `
      <div class="shake-transition" aria-label="지난 입력과 새 입력">
        <div class="shake-transition__item">
          <span>지난 활동</span>
          <strong>A 버튼 → LED 하트 ✓</strong>
        </div>
        <div class="shake-transition__item shake-transition__item--current">
          <span>이번 활동</span>
          <strong>흔들기 → ${escapeHtml(selectedLed)}</strong>
        </div>
      </div>
    `;
  }

  function renderShakeCodePreview(state) {
    if (!state || !state.shakeLedChoice) {
      return "";
    }

    return `
      ${renderActivityLabel("결과")}
      <p class="shake-code-preview__title">내가 만들 코드</p>
      <div class="shake-code-flow">
        <span><strong>입력</strong>흔들기</span>
        <span class="shake-code-flow__arrow" aria-hidden="true">→</span>
        <span><strong>출력</strong>${escapeHtml(state.shakeLedChoice)}</span>
      </div>
    `;
  }

  function renderFeatureFindActivity(activity) {
    const state = activeDayState || {};
    const shakeSteps = getShakeSteps(activity);
    const hasCompletedMenu = Boolean(state.shakeFeatureFound);

    return `
      <div
        class="plain-group block-activity day01-activity shake-activity"
        data-day01-activity="feature-find"
        data-state-key="${escapeHtml(activity.stateKey)}"
        data-unlock-tools="${escapeHtml(activity.unlockTools.join("|"))}"
      >
        <h3>${escapeHtml(activity.title)}</h3>
        <p>${escapeHtml(activity.prompt)}</p>
        ${renderShakeTransition(activity, state)}
        <div class="shake-activity-board">
          <section class="shake-step">
            ${renderActivityLabel("찾아보기")}
            <h4>${escapeHtml(activity.menuPrompt)}</h4>
            <div class="makecode-menu-grid shake-menu-grid">
            ${activity.menuItems
              .map((item) => {
                const isFound = item.correct && state.shakeFeatureFound;

                return `
                  <button
                    class="menu-card shake-menu-card${isFound ? " is-selected" : ""}"
                    type="button"
                    aria-pressed="${isFound ? "true" : "false"}"
                    data-feature-menu="${escapeHtml(item.id)}"
                    data-feature-correct="${item.correct ? "true" : "false"}"
                  >
                    <span>${escapeHtml(item.text)}</span>
                    <strong class="shake-menu-card__mark"${isFound ? "" : " hidden"}>선택됨 ✓</strong>
                  </button>
                `;
              })
              .join("")}
            </div>
            <p class="inline-feedback${hasCompletedMenu ? " inline-feedback--correct" : ""}" data-shake-menu-feedback${
      hasCompletedMenu ? "" : " hidden"
    }>${escapeHtml(
      hasCompletedMenu
        ? "맞아요!\n\n'입력' 메뉴를 열고\n'흔들었을 때' 블록을 찾아보세요."
        : ""
    )}</p>
          </section>
          <section class="shake-step">
            <fieldset class="simple-choice day01-led-choice shake-led-choice">
              <legend><span class="activity-label">골라보기</span><span>흔들었을 때 무엇을 보여줄까요?</span></legend>
              ${activity.ledChoices
                .map((choice, index) => {
                  const inputId = `shake-led-${index + 1}`;
                  const isSelected = state.shakeLedChoice === choice;

                  return `
                    <label class="radio-option shake-led-option${isSelected ? " is-selected" : ""}" for="${escapeHtml(
                    inputId
                  )}">
                      <input
                        id="${escapeHtml(inputId)}"
                        name="shake-led-choice"
                        type="radio"
                        value="${escapeHtml(choice)}"
                        data-shake-led-choice
                        ${isSelected ? "checked" : ""}
                      >
                      <span>${escapeHtml(choice)}</span>
                      <strong class="shake-led-option__mark"${isSelected ? "" : " hidden"}>선택됨 ✓</strong>
                    </label>
                  `;
                })
                .join("")}
            </fieldset>
            <div class="shake-code-preview activity-result" data-shake-code-preview${state.shakeLedChoice ? "" : " hidden"}>
              ${renderShakeCodePreview(state)}
            </div>
          </section>
          <section class="shake-step">
            ${renderActivityLabel("해보기")}
            <h4>실제 MakeCode에서 만들기</h4>
            <p class="field-help">
              입력 메뉴에서 '흔들었을 때' 블록을 찾고, 내가 고른 LED 표시를 넣은 뒤 micro:bit로 보내 실제로 흔들어 봅니다.
            </p>
            ${renderActivityLabel("시험하기")}
            <div class="checkbox-group shake-checklist">
              ${shakeSteps
                .map((step, index) => {
                  const value = String(index + 1);
                  const inputId = `shake-step-${index + 1}`;

                  return `
                    <label class="checkbox-option" for="${escapeHtml(inputId)}">
                      <input
                        id="${escapeHtml(inputId)}"
                        type="checkbox"
                        value="${escapeHtml(value)}"
                        data-shake-step
                        ${state.shakeChecklist && state.shakeChecklist.includes(value) ? "checked" : ""}
                      >
                      <span>${escapeHtml(step)}</span>
                    </label>
                  `;
                })
                .join("")}
            </div>
          </section>
        </div>
        <p class="inline-feedback inline-feedback--correct" data-day01-feedback="${escapeHtml(
          activity.stateKey
        )}"${state.shakeToolCompleted ? "" : " hidden"}>${escapeHtml(activity.successFeedback)}</p>
      </div>
    `;
  }

  function renderCombinationChallengeActivity(activity) {
    const changes = activeDayState ? activeDayState.combinationChanges : [];
    const content = `
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep("더 해보기", activity.prompt)}
        ${renderIpoFlow(activity.ipoFlow)}
        <div class="checkbox-group">
          ${activity.options
            .map((option, index) => {
              const inputId = `combination-${index + 1}`;

              return `
                <label class="checkbox-option" for="${escapeHtml(inputId)}">
                  <input
                    id="${escapeHtml(inputId)}"
                    type="checkbox"
                    value="${escapeHtml(option)}"
                    data-combination-change
                    ${changes.includes(option) ? "checked" : ""}
                  >
                  <span>${escapeHtml(option)}</span>
                </label>
              `;
            })
            .join("")}
        </div>
        <p class="inline-feedback inline-feedback--correct" data-day01-feedback="combination-challenge"${
          changes.length ? "" : " hidden"
        }>${escapeHtml(activity.successFeedback)}</p>
    `;

    if (activity.optional) {
      return `
        <details class="plain-group block-activity day01-activity optional-activity" data-day01-activity="combination-challenge">
          <summary>${escapeHtml(activity.summary || "더 해보기")}</summary>
          <div class="optional-activity__body">
            ${content}
          </div>
        </details>
      `;
    }

    return `
      <div class="plain-group block-activity day01-activity" data-day01-activity="combination-challenge">
        ${content}
      </div>
    `;
  }

  function renderToolbox(tools) {
    const unlockedTools = activeDayState ? activeDayState.unlockedTools : [];

    return `
      <div class="toolbox" aria-label="내 도구함">
        <h4>내 도구함</h4>
        <div class="toolbox__items">
          ${tools
            .map(
              (tool) => `
                <span class="tool-chip${unlockedTools.includes(tool) ? " is-unlocked" : ""}">
                  ${escapeHtml(tool)}
                </span>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function getFreeStepId(step, index) {
    return ["try", "change", "test"][index] || step;
  }

  function renderFreeLabActivity(activity) {
    const state = activeDayState || {};
    const completed = activity.steps.every((step, index) =>
      (state.freeResearchSteps || []).includes(getFreeStepId(step, index))
    );

    return `
      <div class="plain-group block-activity day01-activity" data-day01-activity="free-lab">
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep("해보기", activity.prompt)}
        ${renderToolbox(activity.toolbox)}
        <div class="free-lab-grid">
          <fieldset class="record-field">
            <legend><span class="activity-label">바꿔보기</span><span>자유 연구 단계</span></legend>
            <div class="checkbox-group">
              ${activity.steps
                .map((step, index) => {
                  const stepId = getFreeStepId(step, index);
                  const inputId = `free-step-${stepId}`;

                  return `
                    <label class="checkbox-option" for="${escapeHtml(inputId)}">
                      <input
                        id="${escapeHtml(inputId)}"
                        type="checkbox"
                        value="${escapeHtml(stepId)}"
                        data-free-step
                        ${(state.freeResearchSteps || []).includes(stepId) ? "checked" : ""}
                      >
                      <span>${escapeHtml(step)}</span>
                    </label>
                  `;
                })
                .join("")}
            </div>
          </fieldset>
          <fieldset class="record-field">
            <legend><span class="activity-label">해보기</span><span>내가 사용한 기능</span></legend>
            <div class="checkbox-group">
              ${activity.usedFeatures
                .map((feature, index) => {
                  const inputId = `used-feature-${index + 1}`;

                  return `
                    <label class="checkbox-option" for="${escapeHtml(inputId)}">
                      <input
                        id="${escapeHtml(inputId)}"
                        type="checkbox"
                        value="${escapeHtml(feature)}"
                        data-used-feature
                        ${(state.usedFeatures || []).includes(feature) ? "checked" : ""}
                      >
                      <span>${escapeHtml(feature)}</span>
                    </label>
                  `;
                })
                .join("")}
            </div>
          </fieldset>
        </div>
        <div class="idea-draw">
          <button class="secondary-button" type="button" data-draw-idea data-ideas="${escapeHtml(
            activity.ideas.join("|")
          )}">
            아이디어 하나 뽑기
          </button>
          <p data-random-idea hidden></p>
        </div>
        <p class="inline-feedback inline-feedback--correct" data-day01-feedback="free-lab"${
          completed ? "" : " hidden"
        }>${escapeHtml(activity.successFeedback)}</p>
      </div>
    `;
  }

  function renderPeerTestActivity(activity) {
    const result = activeDayState ? activeDayState.peerTestResult : "";

    return `
      <div class="plain-group block-activity day01-activity" data-day01-activity="peer-test">
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep("시험하기", activity.prompt)}
        <div class="choice-list compact-choice-list">
          ${activity.options
            .map((option) => {
              const isSelected = result === option;

              return `
                <button
                  class="choice-button${isSelected ? " is-selected" : ""}"
                  type="button"
                  aria-pressed="${isSelected ? "true" : "false"}"
                  data-peer-result="${escapeHtml(option)}"
                >
                  ${escapeHtml(option)}
                </button>
              `;
            })
            .join("")}
        </div>
        <p class="inline-feedback inline-feedback--correct" data-day01-feedback="peer-test"${
          result ? "" : " hidden"
        }>${escapeHtml(activity.successFeedback)}</p>
      </div>
    `;
  }

  function renderMakeCodeLinkActivity(activity) {
    const shareUrl = activeDayState ? activeDayState.makeCodeShareUrl : "";

    return `
      <div class="plain-group block-activity day01-activity" data-day01-activity="makecode-link">
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep("확인하기", activity.prompt)}
        <div class="makecode-link-row">
          <label class="record-field" for="makecode-share-url">
            <span>URL 입력</span>
            <input
              id="makecode-share-url"
              type="url"
              inputmode="url"
              data-makecode-url
              value="${escapeHtml(shareUrl)}"
              placeholder="https://makecode.microbit.org/_..."
            >
          </label>
          <button class="secondary-button" type="button" data-save-makecode-link>
            내 코드 연결하기
          </button>
        </div>
        <p class="inline-feedback inline-feedback--correct" data-day01-feedback="makecode-link"${
          shareUrl ? "" : " hidden"
        }>${shareUrl ? escapeHtml(activity.successFeedback) : ""}</p>
        <a
          class="primary-link makecode-open-link"
          href="${escapeHtml(shareUrl || "#")}"
          target="_blank"
          rel="noopener noreferrer"
          data-makecode-open
          ${shareUrl ? "" : "hidden"}
        >
          MakeCode에서 다시 열기
        </a>
      </div>
    `;
  }

  function getPersistentVideoPlaybackSource(state = activeDayState) {
    if (!state) {
      return "";
    }

    if (state.videoRetakeInProgress) {
      return "";
    }

    return hasPersistentVideoReference(state)
      ? getSafePlaybackUrl(state.videoPlaybackUrl || state.videoStorageUrl)
      : "";
  }

  function isDrivePreviewUrl(value) {
    try {
      const parsed = new URL(value);

      return (
        parsed.hostname === "drive.google.com" &&
        /^\/file\/d\/[^/]+\/preview\/?$/.test(parsed.pathname)
      );
    } catch (error) {
      return false;
    }
  }

  function isDriveViewUrl(value) {
    try {
      const parsed = new URL(value);

      return (
        parsed.hostname === "drive.google.com" &&
        !isDrivePreviewUrl(value) &&
        (parsed.pathname.includes("/file/d/") || parsed.pathname.includes("/view"))
      );
    } catch (error) {
      return false;
    }
  }

  function getSafePlaybackUrl(value) {
    const trimmed = String(value || "").trim();

    if (!trimmed || isDriveViewUrl(trimmed)) {
      return "";
    }

    try {
      return new URL(trimmed).href;
    } catch (error) {
      return "";
    }
  }

  function getBaseVideoMimeType(value) {
    const mimeType = String(value || "")
      .trim()
      .toLowerCase()
      .split(";")[0]
      .trim();

    return mimeType === "video/mp4" || mimeType === "video/webm" ? mimeType : "";
  }

  function isVideoEvidenceComplete(state = activeDayState) {
    if (!state) {
      return hasRuntimeVideoReference();
    }

    return hasVideoEvidence(state);
  }

  function hasCurrentVideoReference(state = activeDayState) {
    if (!state) {
      return Boolean(day01RecordedBlob || day01RecordedUrl);
    }

    return Boolean(
      hasRuntimeVideoReference() ||
        (hasPersistentVideoReference(state) && !state.videoRetakeInProgress)
    );
  }

  function getVideoStatusText(videoState = {}) {
    if (videoState.storageStatus === "playback_ready") {
      return "저장된 연구 영상이 있습니다.";
    }

    if (videoState.storageStatus === "stored") {
      return "영상은 저장되었습니다. 재생 연결을 준비하고 있습니다.";
    }

    if (videoState.storageStatus === "pending_upload") {
      return "영상 저장 중...";
    }

    if (videoState.storageStatus === "pending_teacher_upload") {
      return "영상이 아직 저장되지 않았습니다. 새로고침하기 전에 다시 저장해 주세요.";
    }

    if (videoState.storageStatus === "failed") {
      return "영상 저장하지 못했어요. 새로고침하기 전에 다시 저장해 주세요.";
    }

    if (videoState.storageStatus === "too_large") {
      return "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요.";
    }

    if (videoState.storageStatus === "retake_ready") {
      return "다시 촬영할 준비가 되었습니다.";
    }

    if (videoState.captureStatus === "recorded") {
      return "영상 촬영 완료. 이 영상을 저장하거나 다시 찍을 수 있습니다.";
    }

    if (videoState.captureStatus === "recording") {
      return "촬영 중입니다.";
    }

    if (videoState.captureStatus === "camera_ready") {
      return "카메라가 켜졌습니다. 장치가 보이게 놓고 촬영을 시작하세요.";
    }

    return "카메라 권한은 버튼을 누른 뒤 요청합니다.";
  }

  function getVideoSaveStateLabel(result = {}) {
    if (result.storageStatus === "playback_ready") {
      return "영상 저장 완료";
    }

    if (result.storageStatus === "stored") {
      return "영상 저장됨 · 재생 연결 준비 중";
    }

    return "강사 보완 필요";
  }

  function renderTeacherVideoIngest() {
    if (CONFIG.teacherMode !== true) {
      return "";
    }

    return `
      <details class="teacher-ingest">
        <summary>강사용 보완 연결</summary>
        <div class="teacher-ingest__fields">
          <label class="record-field" for="manual-video-file-id">
            <span>Drive fileId</span>
            <input
              id="manual-video-file-id"
              type="text"
              data-manual-video-file-id
              value="${escapeHtml(activeDayState ? activeDayState.videoFileId : "")}"
              placeholder="Drive fileId"
            >
          </label>
          <label class="record-field" for="manual-video-playback-url">
            <span>서버가 제공한 playback URL</span>
            <input
              id="manual-video-playback-url"
              type="url"
              data-manual-video-playback-url
              value="${escapeHtml(activeDayState ? activeDayState.videoPlaybackUrl : "")}"
              placeholder="Apps Script가 반환한 재생 URL"
            >
          </label>
          <label class="record-field" for="manual-asset-id">
            <span>Asset ID</span>
            <input
              id="manual-asset-id"
              type="text"
              data-manual-asset-id
              value="${escapeHtml(activeDayState ? activeDayState.videoAssetId : "")}"
              placeholder="assetId"
            >
          </label>
          <button class="secondary-button" type="button" data-save-manual-video>
            강사 연결 저장
          </button>
        </div>
      </details>
    `;
  }

  function renderWebcamEvidenceActivity(activity) {
    const videoState = activeDayState ? activeDayState.videoLocalState : {};
    const localPlaybackSource = day01RecordedUrl || "";
    const drivePreviewSource = getPersistentVideoPlaybackSource(activeDayState);

    return `
      <div class="plain-group block-activity day01-activity webcam-panel" id="video-evidence" data-day01-activity="webcam-evidence">
        <h3>${escapeHtml(activity.title)}</h3>
        ${renderActivityStep("확인하기", activity.prompt)}
        <div class="webcam-grid">
          <div class="webcam-preview">
            <video data-camera-preview autoplay muted playsinline></video>
            <video
              data-recorded-video
              controls
              playsinline
              src="${escapeHtml(localPlaybackSource)}"
              ${localPlaybackSource ? "" : "hidden"}
            ></video>
            <iframe
              data-drive-video-preview
              src="${escapeHtml(drivePreviewSource)}"
              title="저장된 연구 영상"
              allow="autoplay; fullscreen"
              allowfullscreen
              ${drivePreviewSource ? "" : "hidden"}
            ></iframe>
          </div>
          <div class="webcam-controls">
            <p class="webcam-status" data-webcam-status aria-live="polite">${escapeHtml(
              getVideoStatusText(videoState)
            )}</p>
            <p class="webcam-countdown" data-webcam-countdown hidden></p>
            <div class="webcam-buttons">
              <button class="secondary-button" type="button" data-camera-start>카메라 켜기</button>
              <button class="secondary-button" type="button" data-record-start disabled>촬영 시작</button>
              <button class="secondary-button" type="button" data-record-stop disabled>촬영 중지</button>
              <button class="secondary-button" type="button" data-use-recording disabled>이 영상 사용</button>
              <button class="secondary-button" type="button" data-retake-recording disabled>다시 찍기</button>
            </div>
          </div>
        </div>
        ${renderTeacherVideoIngest()}
      </div>
    `;
  }

  function renderBlockActivity(activity) {
    if (!activity) {
      return "";
    }

    if (activity.type === "activity-sequence") {
      return renderActivitySequence(activity);
    }

    if (activity.type === "notice") {
      return renderNoticeActivity(activity);
    }

    if (activity.type === "guide-image") {
      return renderGuideImageActivity(activity);
    }

    if (activity.type === "makecode-start") {
      return renderMakeCodeStartActivity(activity);
    }

    if (activity.type === "makecode-ui-check") {
      return renderMakeCodeUiCheckActivity(activity);
    }

    if (activity.type === "saved-checklist") {
      return renderSavedChecklistActivity(activity);
    }

    if (activity.type === "problem-hotspot") {
      return renderProblemHotspotActivity(activity);
    }

    if (activity.type === "card-match") {
      return renderCardMatchActivity(activity);
    }

    if (activity.type === "sequence-sort") {
      return renderSequenceSortActivity(activity);
    }

    if (activity.type === "role-pick") {
      return renderRolePickActivity(activity);
    }

    if (activity.type === "code-prediction") {
      return renderCodePredictionActivity(activity);
    }

    if (activity.type === "makecode-checklist") {
      return renderMakeCodeChecklistActivity(activity);
    }

    if (activity.type === "feature-find") {
      return renderFeatureFindActivity(activity);
    }

    if (activity.type === "combination-challenge") {
      return renderCombinationChallengeActivity(activity);
    }

    if (activity.type === "free-lab") {
      return renderFreeLabActivity(activity);
    }

    if (activity.type === "peer-test") {
      return renderPeerTestActivity(activity);
    }

    if (activity.type === "makecode-link") {
      return renderMakeCodeLinkActivity(activity);
    }

    if (activity.type === "webcam-evidence") {
      return renderWebcamEvidenceActivity(activity);
    }

    if (activity.type === "idea-list") {
      return `
        <div class="plain-group block-activity block-activity--idea-list">
          <h3>${escapeHtml(activity.title)}</h3>
          <div class="block-activity__fields">
            ${activity.fields
              .map((field, index) => renderIdeaInputField(field, index + 1))
              .join("")}
          </div>
        </div>
      `;
    }

    if (activity.type === "idea-comparison") {
      return `
        <div class="plain-group block-activity block-activity--comparison">
          <h3>${escapeHtml(activity.title)}</h3>
          <div class="comparison-list">
            ${activity.ideas
              .map(
                (idea, ideaIndex) => `
                  <section class="comparison-item" aria-labelledby="comparison-${ideaIndex + 1}">
                    <h4 id="comparison-${ideaIndex + 1}">
                      <span data-idea-display="${ideaIndex + 1}">${escapeHtml(idea)}</span>
                    </h4>
                    ${activity.criteria
                      .map(
                        (criterion) => `
                          <fieldset class="simple-choice">
                            <legend>
                              <span>${escapeHtml(criterion.title)}</span>
                              ${escapeHtml(criterion.question)}
                            </legend>
                            ${criterion.options
                              .map((option, optionIndex) => {
                                const id = `comparison-${ideaIndex + 1}-${criterion.id}-${optionIndex + 1}`;

                                return `
                                  <label class="radio-option" for="${escapeHtml(id)}">
                                    <input id="${escapeHtml(id)}" name="${escapeHtml(
                                  `comparison-${ideaIndex + 1}-${criterion.id}`
                                )}" type="radio" value="${escapeHtml(option)}">
                                    <span>${escapeHtml(option)}</span>
                                  </label>
                                `;
                              })
                              .join("")}
                          </fieldset>
                        `
                      )
                      .join("")}
                  </section>
                `
              )
              .join("")}
          </div>

          <fieldset class="simple-choice final-choice">
            <legend>${escapeHtml(activity.finalChoice.label)}</legend>
            ${activity.finalChoice.options
              .map((option, index) => {
                const id = `final-choice-${index + 1}`;
                const value = `idea${index + 1}`;

                return `
                  <label class="radio-option" for="${escapeHtml(id)}">
                    <input id="${escapeHtml(id)}" name="final-choice" type="radio" value="${escapeHtml(
                  value
                )}">
                    <span data-idea-display="${index + 1}">${escapeHtml(option)}</span>
                  </label>
                `;
              })
              .join("")}
          </fieldset>
          ${renderTextInputField(
            {
              id: "final-choice-reason",
              label: activity.finalChoice.reasonLabel,
              placeholder: activity.finalChoice.reasonPlaceholder,
            },
            "block-activity"
          )}
        </div>
      `;
    }

    return "";
  }

  function renderJudgementCheck(check) {
    if (!check) {
      return "";
    }

    return `
      <div class="judgement-check" data-section="blockCheckpoint">
        <h3>짧은 판단 질문</h3>
        <p class="question-text">${escapeHtml(check.prompt)}</p>
        ${renderChoiceGroup(check)}
      </div>
    `;
  }

  function getBlockNav(lesson, index) {
    const blocks = lesson.lessonBlocks;
    const previousBlock = blocks[index - 1];
    const nextBlock = blocks[index + 1];
    const afterBlocksHref = lesson.evidence ? "#research-evidence" : "#today-quiz";
    const afterBlocksLabel = lesson.evidence ? "연구 증거함" : "오늘의 퀴즈";

    return {
      previousHref: previousBlock ? `#${previousBlock.blockId}` : "#today-research",
      previousLabel: previousBlock ? previousBlock.shortTitle : "오늘의 연구",
      nextHref: nextBlock ? `#${nextBlock.blockId}` : afterBlocksHref,
      nextLabel: nextBlock ? nextBlock.shortTitle : afterBlocksLabel,
    };
  }

  function getSelfCheckKey(block, index) {
    return `${block.blockId}:${index + 1}`;
  }

  function renderCheckpointList(block, currentDay) {
    if (currentDay.dayId !== "day01") {
      return `
        <ul class="checkpoint-list">
          ${block.checkpoint
            .map((item) => `<li><span aria-hidden="true">□</span>${escapeHtml(item)}</li>`)
            .join("")}
        </ul>
      `;
    }

    const checkedItems = activeDayState ? activeDayState.selfCheckItems || [] : [];

    return `
      <p class="checkpoint-guide">여기까지 했다면 직접 확인하세요. 이 체크는 학생 자기확인입니다.</p>
      <div class="checkbox-group checkpoint-checks">
        ${block.checkpoint
          .map((item, index) => {
            const value = getSelfCheckKey(block, index);
            const inputId = `self-check-${block.blockId}-${index + 1}`;
            const checked = checkedItems.includes(value);

            return `
              <label class="checkbox-option self-check-option" for="${escapeHtml(inputId)}">
                <input
                  id="${escapeHtml(inputId)}"
                  type="checkbox"
                  value="${escapeHtml(value)}"
                  data-self-check-item
                  ${checked ? "checked" : ""}
                >
                <span>${escapeHtml(item)}</span>
                <strong data-self-check-status>${checked ? "✓ 완료" : "○ 아직 확인하지 않음"}</strong>
              </label>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderLessonBlock(block, lesson, index, currentDay) {
    const renderSequentialNav = shouldRenderSequentialNav(lesson);
    const nav = renderSequentialNav ? getBlockNav(lesson, index) : null;
    const isDay01Block = currentDay.dayId === "day01";

    return `
      <section class="lesson-section lesson-block" id="${escapeHtml(block.blockId)}" data-section="lessonBlock">
        <p class="research-context">연구 ${formatDayNo(currentDay.dayNo)} · ${escapeHtml(
          currentDay.title
        )}</p>
        <div class="block-position">
          <p><span>지금</span> ${escapeHtml(block.position.current)}</p>
          <p><span>다음</span> ${escapeHtml(block.position.next)}</p>
        </div>

        <p class="block-number">${escapeHtml(block.number)}</p>
        <h2 class="section-title">${escapeHtml(block.title)}</h2>

        <div class="readable-copy">
          ${renderParagraphs(block.explanation)}
        </div>

        <div class="plain-group">
          <h3>생각해 보기</h3>
          <p>${escapeHtml(block.thinkingQuestion)}</p>
        </div>

        ${renderJudgementCheck(block.judgementCheck)}

        ${renderBlockActivity(block.activity)}

        ${
          block.tasks
            ? `
              <div class="plain-group">
                <h3>${escapeHtml(block.taskTitle)}</h3>
                ${renderNumberedList(block.tasks, "task-list")}
              </div>
            `
            : ""
        }

        <div class="plain-group checkpoint-group">
          <h3>여기까지 했다면</h3>
          ${
            isDay01Block
              ? `${renderActivityLabel("확인하기")}
                <p class="activity-guide">여기까지 했다면 직접 확인하세요.</p>`
              : ""
          }
          ${renderCheckpointList(block, currentDay)}
        </div>

        <details class="help-toggle">
          <summary>${escapeHtml(block.helpSummary || "막혔나요? 도움 보기")}</summary>
          ${renderPlainList(block.help, "help-list")}
        </details>

        ${
          renderSequentialNav
            ? `<nav class="section-nav" aria-label="${escapeHtml(block.shortTitle)} 이동">
                <a href="${nav.previousHref}">← ${escapeHtml(nav.previousLabel)}</a>
                <a class="section-nav__next" href="${nav.nextHref}">${escapeHtml(nav.nextLabel)} →</a>
              </nav>`
            : ""
        }
      </section>
    `;
  }

  function getDay01NestedActivities() {
    const lesson = activeDay ? getLessonForDay(activeDay) : null;

    if (!lesson || !lesson.lessonBlocks) {
      return [];
    }

    return lesson.lessonBlocks.flatMap((block) => {
      if (!block.activity) {
        return [];
      }

      return block.activity.type === "activity-sequence"
        ? block.activity.items
        : [block.activity];
    });
  }

  function getResearchOrderActivity() {
    return getDay01NestedActivities().find((item) => item.type === "sequence-sort");
  }

  function getCodePredictionActivity() {
    return getDay01NestedActivities().find((item) => item.type === "code-prediction");
  }

  function getFeatureFindActivity() {
    return getDay01NestedActivities().find((item) => item.type === "feature-find");
  }

  function getShakeSteps(activity = getFeatureFindActivity()) {
    return activity && activity.steps
      ? activity.steps
      : [
          "'흔들었을 때 → 내가 고른 LED' 코드를 만들었다.",
          "micro:bit로 보내고 실제로 흔들어 작동을 확인했다.",
        ];
  }

  function normalizeShakeChecklist(checklist) {
    const allowedValues = getShakeSteps().map((_, index) => String(index + 1));

    return uniqueItems(checklist).filter((value) => allowedValues.includes(value));
  }

  function isShakeActivityComplete(state) {
    return Boolean(
      state &&
        state.shakeFeatureFound &&
        state.shakeLedChoice &&
        normalizeShakeChecklist(state.shakeChecklist).length === getShakeSteps().length
    );
  }

  function getCodePredictionBlock(activity, blockId) {
    return activity && activity.blocks ? activity.blocks.find((block) => block.id === blockId) : null;
  }

  function getCodePredictionMaxSelections(activity) {
    return Number(activity && activity.maxSelections ? activity.maxSelections : 2);
  }

  function getCodePredictionCorrectSelections(activity = getCodePredictionActivity()) {
    return activity ? activity.correctSelections || activity.correctOrder || [] : [];
  }

  function normalizeCodePredictionSelections(state) {
    const activity = getCodePredictionActivity();
    const allowedIds = activity && activity.blocks ? activity.blocks.map((block) => block.id) : [];
    const maxSelections = getCodePredictionMaxSelections(activity);
    const currentSelections = uniqueItems(state.codePredictionSelections || []).filter((blockId) =>
      allowedIds.includes(blockId)
    );

    if (currentSelections.length) {
      return currentSelections.slice(0, maxSelections);
    }

    const legacyOrder = uniqueItems(state.codePredictionOrder || []).filter((blockId) =>
      allowedIds.includes(blockId)
    );
    const correctSelections = getCodePredictionCorrectSelections(activity).filter((blockId) =>
      legacyOrder.includes(blockId)
    );

    if (correctSelections.length) {
      return correctSelections.slice(0, maxSelections);
    }

    return legacyOrder.slice(0, maxSelections);
  }

  function isCodePredictionCorrect(selections, activity = getCodePredictionActivity()) {
    const selected = uniqueItems(selections || []);
    const correct = uniqueItems(getCodePredictionCorrectSelections(activity));

    return (
      selected.length === correct.length &&
      correct.length > 0 &&
      correct.every((blockId) => selected.includes(blockId))
    );
  }

  function getProblemSituationTitle(situationId) {
    const situation = getProblemSituation(situationId);

    return situation ? situation.title : "";
  }

  function getEvidenceStatusClass(isComplete) {
    return isComplete ? " evidence-card--complete" : "";
  }

  function renderResearchEvidence(lesson) {
    if (!lesson.evidence) {
      return "";
    }

    const state = activeDayState || createDefaultDayState(activeDay || { dayId: "day01" });
    const renderSequentialNav = shouldRenderSequentialNav(lesson);
    const lastBlock = lesson.lessonBlocks[lesson.lessonBlocks.length - 1];
    const problemSummary = getDiscoveredProblemSummary(state.discoveredProblem || {});
    const usedFeatures = uniqueItems([
      ...(state.unlockedTools || []),
      ...(state.usedFeatures || []),
    ]);
    const videoState = state.videoLocalState || {};
    const videoDrivePreviewSource = getPersistentVideoPlaybackSource(state);
    const videoLocalPlaybackSource = day01RecordedUrl || "";

    return `
      <section class="lesson-section research-evidence" id="research-evidence" data-section="researchEvidence">
        <p class="section-kicker">증거 확인</p>
        <h2 class="section-title">${escapeHtml(lesson.evidence.title)}</h2>
        <p class="section-description">${escapeHtml(lesson.evidence.description)}</p>

        <div class="evidence-grid">
          <article class="evidence-card${getEvidenceStatusClass(Boolean(problemSummary))}" data-evidence-problem>
            <h3>문제 발견</h3>
            <p>${problemSummary ? `${escapeHtml(problemSummary)} ✓` : "아직 미완료"}</p>
          </article>
          <article class="evidence-card${getEvidenceStatusClass(
            state.researchOrderCompleted
          )}" data-evidence-order>
            <h3>연구 과정</h3>
            <p>${state.researchOrderCompleted ? "연구 과정 ✓" : "아직 미완료"}</p>
          </article>
          <article class="evidence-card${getEvidenceStatusClass(
            usedFeatures.length > 0
          )}" data-evidence-tools>
            <h3>사용한 기능</h3>
            <p>${usedFeatures.length ? escapeHtml(usedFeatures.join(" · ")) : "아직 미완료"}</p>
          </article>
          <article class="evidence-card${getEvidenceStatusClass(
            Boolean(state.peerTestResult)
          )}" data-evidence-peer>
            <h3>친구 시험</h3>
            <p>${state.peerTestResult ? `${escapeHtml(state.peerTestResult)} ✓` : "아직 미완료"}</p>
          </article>
          <article class="evidence-card${getEvidenceStatusClass(
            Boolean(state.makeCodeShareUrl)
          )}" data-evidence-code>
            <h3>코드</h3>
            <p>${state.makeCodeShareUrl ? "연결 완료 ✓" : "미연결"}</p>
            <a
              href="${escapeHtml(state.makeCodeShareUrl || "#")}"
              target="_blank"
              rel="noopener noreferrer"
              ${state.makeCodeShareUrl ? "" : "hidden"}
              data-evidence-code-link
            >
              MakeCode에서 다시 열기
            </a>
          </article>
          <article class="evidence-card${getEvidenceStatusClass(
            isVideoEvidenceComplete(state)
          )}" data-evidence-video>
            <h3>오늘의 연구 모습 영상</h3>
            <p>${escapeHtml(
              isVideoEvidenceComplete(state) ? "촬영 완료 ✓" : getVideoStatusText(videoState)
            )}</p>
            <a
              href="#video-evidence"
              data-evidence-video-review
              ${isVideoEvidenceComplete(state) ? "" : "hidden"}
            >
              다시 보기
            </a>
            <iframe
              src="${escapeHtml(videoDrivePreviewSource)}"
              title="저장된 연구 영상"
              allow="autoplay; fullscreen"
              allowfullscreen
              ${videoDrivePreviewSource ? "" : "hidden"}
              data-evidence-video-frame
            ></iframe>
            <video
              controls
              playsinline
              src="${escapeHtml(videoLocalPlaybackSource)}"
              ${videoLocalPlaybackSource ? "" : "hidden"}
              data-evidence-video-player
            ></video>
          </article>
        </div>

        ${
          renderSequentialNav
            ? `<nav class="section-nav" aria-label="연구 증거함 이동">
                <a href="#${escapeHtml(lastBlock.blockId)}">← ${escapeHtml(lastBlock.shortTitle)}</a>
                <a class="section-nav__next" href="#today-quiz">오늘의 퀴즈 →</a>
              </nav>`
            : ""
        }
      </section>
    `;
  }

  function renderQuizQuestion(question, index) {
    if (!question.type || question.type === "choice") {
      return `
        <div class="quiz-question">
          <p class="quiz-question__number">문제 ${index + 1}</p>
          <p class="question-text">${escapeHtml(question.prompt)}</p>
          ${renderChoiceGroup(
            {
              choices: question.choices,
              correctFeedback: `맞아요. ${question.explanation}`,
              incorrectFeedback: `다시 생각해 보세요. ${question.explanation}`,
            },
            question.id
              ? {
                  quizId: question.id,
                }
              : {}
          )}
        </div>
      `;
    }

    if (question.type === "matching") {
      const savedAnswers =
        activeDayState && activeDayState.quizAnswers
          ? activeDayState.quizAnswers[question.id] || {}
          : {};

      return `
        <div class="quiz-question" data-quiz-matching="${escapeHtml(question.id)}">
          <p class="quiz-question__number">문제 ${index + 1}</p>
          <p class="question-text">${escapeHtml(question.prompt)}</p>
          <div class="matching-quiz">
            ${question.pairs
              .map((pair) => {
                const selectId = `quiz-${question.id}-${pair.id}`;

                return `
                  <label class="record-field" for="${escapeHtml(selectId)}">
                    <span>${escapeHtml(pair.text)}</span>
                    <select
                      id="${escapeHtml(selectId)}"
                      data-quiz-match-select
                      data-quiz-id="${escapeHtml(question.id)}"
                      data-pair-id="${escapeHtml(pair.id)}"
                      data-answer="${escapeHtml(pair.answer)}"
                    >
                      <option value="">선택</option>
                      ${question.options
                        .map(
                          (option) => `
                            <option value="${escapeHtml(option)}"${
                            savedAnswers[pair.id] === option ? " selected" : ""
                          }>${escapeHtml(option)}</option>
                          `
                        )
                        .join("")}
                    </select>
                  </label>
                `;
              })
              .join("")}
          </div>
          <p class="inline-feedback" data-day01-feedback="quiz-${escapeHtml(question.id)}" hidden></p>
        </div>
      `;
    }

    if (question.type === "free-choice") {
      const savedAnswer =
        activeDayState && activeDayState.quizAnswers ? activeDayState.quizAnswers[question.id] : "";

      return `
        <div class="quiz-question" data-quiz-free-choice="${escapeHtml(question.id)}">
          <p class="quiz-question__number">문제 ${index + 1}</p>
          <p class="question-text">${escapeHtml(question.prompt)}</p>
          <div class="pill-grid">
            ${question.options
              .map((option) => {
                const isSelected = savedAnswer === option;

                return `
                  <button
                    class="pill-button${isSelected ? " is-selected" : ""}"
                    type="button"
                    aria-pressed="${isSelected ? "true" : "false"}"
                    data-quiz-free-option="${escapeHtml(option)}"
                    data-quiz-id="${escapeHtml(question.id)}"
                  >
                    ${escapeHtml(option)}
                  </button>
                `;
              })
              .join("")}
          </div>
          <p class="inline-feedback inline-feedback--correct" data-day01-feedback="quiz-${escapeHtml(
            question.id
          )}"${savedAnswer ? "" : " hidden"}>${escapeHtml(question.explanation)}</p>
        </div>
      `;
    }

    return "";
  }

  function renderTodayQuiz(lesson) {
    const lastBlock = lesson.lessonBlocks[lesson.lessonBlocks.length - 1];
    const previousHref = lesson.evidence ? "#research-evidence" : `#${lastBlock.blockId}`;
    const previousLabel = lesson.evidence ? "연구 증거함" : lastBlock.shortTitle;
    const renderSequentialNav = shouldRenderSequentialNav(lesson);

    return `
      <section class="lesson-section today-quiz" id="today-quiz" data-section="todayQuiz">
        <p class="section-kicker">확인하기</p>
        <h2 class="section-title">${escapeHtml(lesson.quiz.title)}</h2>
        <p class="section-description">${escapeHtml(lesson.quiz.description)}</p>

        <div class="quiz-list">
          ${lesson.quiz.questions
            .map((question, index) => renderQuizQuestion(question, index))
            .join("")}
        </div>

        ${
          renderSequentialNav
            ? `<nav class="section-nav" aria-label="퀴즈 이동">
                <a href="${escapeHtml(previousHref)}">← ${escapeHtml(previousLabel)}</a>
                <a class="section-nav__next" href="#research-record">연구기록 →</a>
              </nav>`
            : ""
        }
      </section>
    `;
  }

  function getDay01RecordValueKey(fieldId) {
    return {
      "favorite-tool": "favoriteTool",
      "next-sensor": "nextSensor",
    }[fieldId];
  }

  function getDay01RecordValue(field) {
    const key = getDay01RecordValueKey(field.id);

    return isDay01Active() && key ? activeDayState.recordValues[key] || "" : "";
  }

  function getDay01RecordAttribute(field) {
    const key = getDay01RecordValueKey(field.id);

    return isDay01Active() && key ? `data-day01-record-field="${escapeHtml(key)}"` : "";
  }

  function renderField(field) {
    const day01RecordAttribute = getDay01RecordAttribute(field);
    const day01RecordValue = getDay01RecordValue(field);

    if (field.type === "select") {
      return `
        <label class="record-field" for="record-${escapeHtml(field.id)}">
          <span>${escapeHtml(field.label)}</span>
          <select id="record-${escapeHtml(field.id)}"${day01RecordAttribute ? ` ${day01RecordAttribute}` : ""}>
            <option value="">선택</option>
            ${field.options
              .map(
                (option) =>
                  `<option value="${escapeHtml(option)}"${
                    day01RecordValue === option ? " selected" : ""
                  }>${escapeHtml(option)}</option>`
              )
              .join("")}
          </select>
        </label>
      `;
    }

    if (field.type === "checkbox-group") {
      return `
        <fieldset class="record-field record-field--checkbox-group">
          <legend>${escapeHtml(field.label)}</legend>
          <div class="checkbox-group">
            ${field.options
              .map((option, index) => {
                const inputId = `record-${field.id}-${index + 1}`;

                return `
                  <label class="checkbox-option" for="${escapeHtml(inputId)}">
                    <input id="${escapeHtml(inputId)}" name="${escapeHtml(
                  field.id
                )}" type="checkbox" value="${escapeHtml(option)}">
                    <span>${escapeHtml(option)}</span>
                  </label>
                `;
              })
              .join("")}
          </div>
        </fieldset>
      `;
    }

    if (field.type === "textarea") {
      return `
        <label class="record-field" for="record-${escapeHtml(field.id)}">
          <span>${escapeHtml(field.label)}</span>
          <textarea id="record-${escapeHtml(field.id)}" rows="3" placeholder="${escapeHtml(
        field.placeholder
      )}"></textarea>
        </label>
      `;
    }

    return renderTextInputField(
      Object.assign({}, field, {
        value: day01RecordAttribute ? day01RecordValue : undefined,
        extraAttributes: day01RecordAttribute,
      }),
      "record"
    );
  }

  function renderResearchRecord(lesson) {
    const renderSequentialNav = shouldRenderSequentialNav(lesson);

    return `
      <section class="lesson-section research-record" id="research-record" data-section="researchRecord">
        <p class="section-kicker">기록하기</p>
        <h2 class="section-title">${escapeHtml(lesson.record.title)}</h2>
        <form class="record-form">
          ${lesson.record.fields.map((field) => renderField(field)).join("")}
        </form>

        ${
          renderSequentialNav
            ? `<nav class="section-nav" aria-label="연구기록 이동">
                <a href="#today-quiz">← 오늘의 퀴즈</a>
                <a class="section-nav__next primary-link" href="#research-complete">오늘 연구 정리 보기 →</a>
              </nav>`
            : ""
        }
      </section>
    `;
  }

  function getDay01RequirementItems(state) {
    const hasUsedFeature = state.usedFeatures.length > 0;
    const hasCode = Boolean(state.makeCodeShareUrl);
    const hasVideo = hasVideoEvidence(state);
    const freeStepsDone = ["try", "change", "test"].every((step) =>
      state.freeResearchSteps.includes(step)
    );
    const progress = state.lessonProgress || {};

    return [
      {
        id: "problem-research",
        label: "문제 발견과 연구 준비",
        done: Boolean(progress.block01Completed),
        href: "#block01",
        action: "문제 찾기 이어가기",
      },
      {
        id: "ipo-check",
        label: "입력 → 처리 → 출력 자기확인",
        done: Boolean(state.ipoConceptChecked),
        href: "#block02",
        action: "흐름 확인하러 가기",
      },
      {
        id: "minimum-device",
        label: "A 버튼 → LED 기본 작동",
        done: Boolean(state.minimumCompleted),
        href: "#block02",
        action: "기본 작동 완성하러 가기",
      },
      {
        id: "shake-input",
        label: "흔들기 입력 시험",
        done: Boolean(state.shakeToolCompleted),
        href: "#block02",
        action: "흔들기 시험하러 가기",
      },
      {
        id: "free-research",
        label: "자유 연구 해보기·바꿔보기·시험하기",
        done: freeStepsDone,
        href: "#block03",
        action: "자유 연구 이어가기",
      },
      {
        id: "used-feature",
        label: "내 장치에서 사용한 기능 체크",
        done: hasUsedFeature,
        href: "#block03",
        action: "사용한 기능 체크하러 가기",
      },
      {
        id: "peer-test",
        label: "친구 시험",
        done: Boolean(state.peerTestResult),
        href: "#block03",
        action: "친구 시험하러 가기",
      },
      {
        id: "makecode-link",
        label: "MakeCode 코드 연결",
        done: hasCode,
        href: "#block03",
        action: "코드 연결하러 가기",
      },
      {
        id: "video-evidence",
        label: "오늘의 연구 모습 영상",
        done: hasVideo,
        href: "#video-evidence",
        action: "영상 남기러 가기",
      },
      {
        id: "quiz",
        label: "오늘의 퀴즈 완료",
        done: Boolean(progress.quizCompleted),
        href: "#today-quiz",
        action: "퀴즈 하러 가기",
      },
      {
        id: "record",
        label: "연구기록 작성",
        done: Boolean(progress.recordCompleted),
        href: "#research-record",
        action: "연구기록 작성하러 가기",
      },
    ];
  }

  function renderDay01RequirementList(state) {
    return `
      <ul class="completion-requirements" data-day01-requirements>
        ${getDay01RequirementItems(state)
          .map(
            (item) => `
              <li class="${item.done ? "is-complete" : ""}">
                <span aria-hidden="true">${item.done ? "✓" : "□"}</span>
                <strong>${escapeHtml(item.label)}</strong>
                ${item.done ? "" : `<a href="${escapeHtml(item.href)}">${escapeHtml(item.action)} →</a>`}
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  function getDay01CompletionTitle(state) {
    if (state.dayCompleted) {
      return "첫 번째 연구 완료 ✓";
    }

    return state.minimumCompleted ? "기본 작동 성공 ✓" : "아직 기본 작동을 완성하지 못했어요";
  }

  function renderDay01CompletionBody(state) {
    if (state.dayCompleted) {
      return "<p>오늘 연구를 모두 마쳤습니다.</p>";
    }

    const lead = state.minimumCompleted
      ? "A 버튼 → LED 작동에 성공했습니다. 이제 남은 연구를 이어가면 오늘 연구를 완성할 수 있어요."
      : "먼저 A 버튼을 눌렀을 때 LED가 반응하도록 만들어 보세요.";

    return `<p>${escapeHtml(lead)}</p>${renderDay01RequirementList(state)}`;
  }

  function renderDay01ResearchComplete(lesson) {
    const state = activeDayState || createDefaultDayState(activeDay || { dayId: "day01" });
    updateDay01Progress(state);
    const isComplete = state.dayCompleted;

    return `
      <section class="lesson-section research-complete" id="research-complete" data-section="researchComplete">
        <p class="section-kicker">마무리</p>
        <h2 class="section-title" data-day01-complete-title>${escapeHtml(
          getDay01CompletionTitle(state)
        )}</h2>

        <div class="plain-group" data-day01-complete-body>
          ${renderDay01CompletionBody(state)}
        </div>

        <div class="plain-group" data-day01-complete-gained${isComplete ? "" : " hidden"}>
          <h3>오늘 연구에서 얻은 것</h3>
          <p>${escapeHtml(lesson.complete.gained)}</p>
        </div>

        <div class="section-description" data-day01-complete-summary${isComplete ? "" : " hidden"}>
          ${renderParagraphs(lesson.complete.summaryLines || [lesson.complete.summary])}
        </div>

        <div class="plain-group" data-day01-next-research${isComplete ? "" : " hidden"}>
          <h3>다음 연구</h3>
          <p>${escapeHtml(lesson.complete.nextTitle)}</p>
          <p>${escapeHtml(lesson.complete.nextSummary)}</p>
        </div>

        <div class="section-action">
          <a class="primary-link" href="#page-title">연구소 지도에서 확인하기 →</a>
        </div>
      </section>
    `;
  }

  function renderResearchComplete(lesson) {
    if (lesson.dayId === "day01") {
      return renderDay01ResearchComplete(lesson);
    }

    return `
      <section class="lesson-section research-complete" id="research-complete" data-section="researchComplete">
        <p class="section-kicker">마무리</p>
        <h2 class="section-title">${escapeHtml(lesson.complete.title)}</h2>

        <div class="plain-group">
          <h3>오늘 연구에서 얻은 것</h3>
          <p>${escapeHtml(lesson.complete.gained)}</p>
        </div>

        <div class="section-description">
          ${renderParagraphs(lesson.complete.summaryLines || [lesson.complete.summary])}
        </div>

        <div class="plain-group">
          <h3>다음 연구</h3>
          <p>${escapeHtml(lesson.complete.nextTitle)}</p>
          <p>${escapeHtml(lesson.complete.nextSummary)}</p>
        </div>

        <div class="section-action">
          <a class="primary-link" href="#page-title">연구소 지도에서 확인하기 →</a>
        </div>
      </section>
    `;
  }

  function renderStandardDay(currentDay) {
    const lesson = getLessonForDay(currentDay);

    if (!lesson) {
      elements.standardDay.hidden = true;
      elements.standardDay.innerHTML = "";
      return;
    }

    elements.standardDay.hidden = false;
    elements.standardDay.innerHTML = `
      ${
        lesson.dayType === "reload"
          ? renderProjectReload(lesson)
          : lesson.dayType === "standard"
          ? renderResearchBridge(lesson)
          : ""
      }
      ${renderTodayResearch(lesson)}
      ${lesson.lessonBlocks
        .map((block, index) => renderLessonBlock(block, lesson, index, currentDay))
        .join("")}
      ${renderResearchEvidence(lesson)}
      ${renderTodayQuiz(lesson)}
      ${renderResearchRecord(lesson)}
      ${renderResearchComplete(lesson)}
    `;
  }

  function renderCurrentDay(currentDay) {
    elements.location.textContent = "";
    elements.location.hidden = true;
    document.title = `${formatDayNo(currentDay.dayNo)} ${currentDay.title} | 내일을 바꾸는 미래기술 연구소`;
  }

  function focusSection(sectionId) {
    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
    const heading = section.querySelector("h2");

    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }

  function getIdeaValues() {
    return [1, 2, 3].map((ideaIndex) => {
      const input = elements.standardDay.querySelector(`[data-idea-input="${ideaIndex}"]`);
      const value = input ? input.value.trim() : "";

      return value || `아이디어 ${ideaIndex}`;
    });
  }

  function updateIdeaDisplays() {
    const ideaValues = getIdeaValues();

    ideaValues.forEach((idea, index) => {
      elements.standardDay
        .querySelectorAll(`[data-idea-display="${index + 1}"]`)
        .forEach((display) => {
          display.textContent = idea;
        });
    });
  }

  function getSelectedIdea() {
    const selected = elements.standardDay.querySelector(
      ".final-choice input[type='radio']:checked"
    );

    if (!selected) {
      return null;
    }

    const ideaIndex = Number(selected.value.replace("idea", ""));
    const ideaValues = getIdeaValues();

    if (!Number.isInteger(ideaIndex) || ideaIndex < 1 || ideaIndex > ideaValues.length) {
      return null;
    }

    return {
      id: selected.value,
      text: ideaValues[ideaIndex - 1],
    };
  }

  function syncSelectedIdeaToRecord() {
    const target = elements.standardDay.querySelector('[data-record-source="finalIdea"]');

    if (!target) {
      return;
    }

    const selectedIdea = getSelectedIdea();
    target.value = selectedIdea ? selectedIdea.text : "";
  }

  function getRecalledProjectText() {
    const helper = elements.standardDay.querySelector("#reload-helper")?.value.trim() || "";
    const difficulty =
      elements.standardDay.querySelector("#reload-difficulty")?.value.trim() || "";

    if (helper && difficulty) {
      return {
        hasRecalledText: true,
        problemDefinition: `나는 ${helper}이(가) 겪는 "${difficulty}" 문제를 해결하고 싶습니다.`,
        memo: `${difficulty} 불편을 해결할 방법을 오늘 여러 가지로 생각해 봅니다.`,
      };
    }

    if (helper) {
      return {
        hasRecalledText: true,
        problemDefinition: `나는 ${helper}에게 필요한 도움을 다시 떠올렸습니다.`,
        memo: "방금 떠올린 사람에게 어떤 도움이 필요한지 오늘 아이디어로 넓혀 봅니다.",
      };
    }

    if (difficulty) {
      return {
        hasRecalledText: true,
        problemDefinition: `나는 "${difficulty}" 문제를 해결하고 싶습니다.`,
        memo: `${difficulty} 불편을 해결할 방법을 오늘 여러 가지로 생각해 봅니다.`,
      };
    }

    return {
      hasRecalledText: false,
      problemDefinition: "",
      memo: "",
    };
  }

  function updateProjectReloadRecord() {
    const section = elements.standardDay.querySelector("[data-section='projectReload']");

    if (!section || section.dataset.hasSavedRecord === "true") {
      return;
    }

    const recalled = getRecalledProjectText();
    const title = section.querySelector("[data-reload-record-title]");
    const note = section.querySelector("[data-reload-record-note]");
    const problem = section.querySelector("[data-reload-problem]");
    const next = section.querySelector("[data-reload-next]");
    const memoLabel = section.querySelector("[data-reload-memo-label]");
    const memo = section.querySelector("[data-reload-memo]");

    if (recalled.hasRecalledText) {
      title.textContent = "내가 다시 떠올린 문제";
      note.textContent =
        "지난 연구기록을 불러올 수 없어, 방금 떠올린 내용을 바탕으로 임시로 정리했습니다.";
      problem.textContent = recalled.problemDefinition;
      next.textContent = "기록이 없습니다.";
      memoLabel.textContent = "그때 남긴 메모";
      memo.textContent = "기록이 없습니다.";
    } else {
      title.textContent = "지난 연구 기록 예시";
      note.textContent =
        "아직 불러올 지난 연구기록이 없습니다. 아래 내용은 화면 확인을 위한 예시입니다.";
      problem.textContent = section.dataset.exampleProblem;
      next.textContent = section.dataset.exampleNext;
      memoLabel.textContent = "예시 메모";
      memo.textContent = section.dataset.exampleMemo;
    }

    note.hidden = false;
  }

  function revealProjectReload() {
    const section = elements.standardDay.querySelector("[data-section='projectReload']");

    if (!section) {
      return;
    }

    updateProjectReloadRecord();

    section.querySelectorAll("[data-reload-hidden]").forEach((element) => {
      element.hidden = false;
    });

    const recordTitle = section.querySelector("[data-reload-record-title]");

    if (recordTitle) {
      recordTitle.scrollIntoView({ behavior: "smooth", block: "start" });
      recordTitle.focus({ preventScroll: true });
    }
  }

  function setButtonSelection(selector, selectedValues) {
    const selectedSet = new Set(selectedValues || []);

    elements.standardDay.querySelectorAll(selector).forEach((button) => {
      const value =
        button.dataset.roleOption ||
        button.dataset.peerResult ||
        button.dataset.shakePrediction ||
        button.dataset.quizFreeOption ||
        button.dataset.problemCard ||
        button.dataset.matchCard;
      const isSelected = selectedSet.has(value);
      const mark = button.querySelector(".scenario-card__mark");

      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");

      if (mark) {
        mark.hidden = !isSelected;
      }
    });
  }

  function setDay01Feedback(name, isVisible, text) {
    const feedback = elements.standardDay.querySelector(`[data-day01-feedback="${name}"]`);

    if (!feedback) {
      return;
    }

    if (text) {
      feedback.textContent = text;
    }

    feedback.classList.add("inline-feedback--correct");
    feedback.hidden = !isVisible;
  }

  function updateProblemMeaningSelect() {
    const panel = elements.standardDay.querySelector("[data-problem-meaning-panel]");

    if (!panel || !activeDayState) {
      return;
    }

    const discovered = activeDayState.discoveredProblem || {};
    const activity = getProblemHotspotActivity();
    const situation = getProblemSituation(discovered.situationId);

    if (!activity) {
      return;
    }

    panel.innerHTML = renderProblemMeaningPanel(activity, situation, discovered);
  }

  function updateProblemSummaryUi() {
    const summary = elements.standardDay.querySelector("[data-problem-summary]");
    const summaryText = elements.standardDay.querySelector("[data-problem-summary-text]");
    const discoveredProblem = getDiscoveredProblemSummary(activeDayState.discoveredProblem || {});
    const placeholder = "불편을 하나 선택하면 문장이 완성됩니다.";

    if (summaryText) {
      summaryText.textContent = discoveredProblem || placeholder;
    }

    if (summary) {
      summary.hidden = false;
      summary.classList.toggle("problem-summary--empty", !discoveredProblem);
    }
  }

  function getCodePredictionSelections() {
    return activeDayState ? activeDayState.codePredictionSelections || [] : [];
  }

  function getCodePredictionLimitText(selectedCount, maxSelections) {
    return selectedCount === maxSelections
      ? "선택을 바꾸려면 하나를 해제한 뒤 다시 골라보세요."
      : "필요한 블록 2개를 골라보세요.";
  }

  function updateCodePredictionUi() {
    const activityElement = elements.standardDay.querySelector(
      "[data-day01-activity='code-prediction']"
    );
    const activity = getCodePredictionActivity();

    if (!activityElement || !activity) {
      return;
    }

    const selections = getCodePredictionSelections();
    const maxSelections = getCodePredictionMaxSelections(activity);

    activityElement.querySelectorAll("[data-code-prediction-choice]").forEach((button) => {
      const isSelected = selections.includes(button.dataset.codePredictionChoice);
      const mark = button.querySelector(".code-prediction-choice__mark");

      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");

      if (mark) {
        mark.hidden = !isSelected;
      }
    });

    const preview = activityElement.querySelector("[data-code-prediction-preview]");

    if (preview) {
      preview.innerHTML = renderCodePredictionPreview(activity, selections);
      preview.hidden = selections.length === 0;
    }

    const limit = activityElement.querySelector("[data-code-prediction-limit]");

    if (limit) {
      limit.textContent = getCodePredictionLimitText(selections.length, maxSelections);
      limit.classList.remove("code-prediction-limit--warning");
    }

    const checkButton = activityElement.querySelector("[data-code-prediction-check]");

    if (checkButton) {
      checkButton.disabled = selections.length !== maxSelections;
    }

    const feedback = activityElement.querySelector('[data-day01-feedback="code-prediction"]');

    if (feedback) {
      feedback.textContent = activeDayState.buttonPredictionCompleted
        ? activity.successFeedback
        : activity.retryFeedback;
      feedback.classList.toggle("inline-feedback--correct", activeDayState.buttonPredictionCompleted);
      feedback.hidden = !activeDayState.buttonPredictionCompleted;
    }
  }

  function showCodePredictionLimitMessage() {
    const limit = elements.standardDay.querySelector("[data-code-prediction-limit]");

    if (!limit) {
      return;
    }

    limit.textContent = "필요한 블록은 2개입니다. 하나를 해제한 뒤 다시 골라보세요.";
    limit.classList.add("code-prediction-limit--warning");
  }

  function toggleCodePredictionChoice(button) {
    const activity = getCodePredictionActivity();

    if (!activity) {
      return;
    }

    const blockId = button.dataset.codePredictionChoice;
    const selections = getCodePredictionSelections();
    const maxSelections = getCodePredictionMaxSelections(activity);
    let nextSelections = selections;

    if (selections.includes(blockId)) {
      nextSelections = selections.filter((item) => item !== blockId);
    } else {
      if (selections.length >= maxSelections) {
        showCodePredictionLimitMessage();
        return;
      }

      nextSelections = [...selections, blockId];
    }

    updateDay01State((state) => {
      state.codePredictionSelections = nextSelections;
      state.buttonPredictionCompleted = false;
    });
  }

  function setCodePredictionFeedback(isCorrect, activity) {
    const feedback = elements.standardDay.querySelector('[data-day01-feedback="code-prediction"]');

    if (!feedback) {
      return;
    }

    feedback.textContent = isCorrect ? activity.successFeedback : activity.retryFeedback;
    feedback.classList.toggle("inline-feedback--correct", isCorrect);
    feedback.hidden = false;
  }

  function checkCodePrediction() {
    const activity = getCodePredictionActivity();

    if (!activity) {
      return;
    }

    const isCorrect = isCodePredictionCorrect(getCodePredictionSelections(), activity);

    updateDay01State((state) => {
      state.buttonPredictionCompleted = isCorrect;
    });
    setCodePredictionFeedback(isCorrect, activity);
  }

  function refreshResearchOrderActivity() {
    const activityElement = elements.standardDay.querySelector("[data-research-order-activity]");
    const activity = getResearchOrderActivity();

    if (activityElement && activity) {
      activityElement.outerHTML = renderResearchOrderSlotActivity(activity);
    }
  }

  function clearResearchOrderDropTargets() {
    elements.standardDay
      .querySelectorAll(".research-order-slot.is-drag-over, [data-research-order-pool].is-drag-over")
      .forEach((element) => element.classList.remove("is-drag-over"));
  }

  function setSelectedResearchOrderCard(cardId) {
    selectedResearchOrderCard = cardId || "";

    elements.standardDay.querySelectorAll("[data-research-order-card]").forEach((element) => {
      const isSelected =
        Boolean(selectedResearchOrderCard) &&
        element.dataset.researchOrderCard === selectedResearchOrderCard;
      element.classList.toggle("is-selected", isSelected);
      element.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function saveResearchOrderSlots(slots) {
    updateDay01State((state) => {
      state.researchOrder = slots;
      state.researchOrderCompleted = false;
    });
    setSelectedResearchOrderCard("");
    refreshResearchOrderActivity();
  }

  function placeResearchOrderCard(cardId, targetIndex) {
    const activity = getResearchOrderActivity();
    const card = activity ? getResearchOrderCardById(activity, cardId) : null;

    if (!activity || !card || !Number.isInteger(targetIndex)) {
      return;
    }

    const slots = getResearchOrderSlots(activity).slice();

    if (targetIndex < 0 || targetIndex >= slots.length) {
      return;
    }

    const sourceIndex = slots.indexOf(cardId);
    const targetCard = slots[targetIndex] || "";

    if (sourceIndex === targetIndex) {
      setSelectedResearchOrderCard("");
      return;
    }

    if (sourceIndex !== -1) {
      slots[sourceIndex] = targetCard;
    }

    slots[targetIndex] = cardId;
    saveResearchOrderSlots(slots);
  }

  function removeResearchOrderCard(cardId) {
    const activity = getResearchOrderActivity();
    const slots = activity ? getResearchOrderSlots(activity).slice() : [];
    const sourceIndex = slots.indexOf(cardId);

    if (sourceIndex === -1) {
      setSelectedResearchOrderCard("");
      return;
    }

    slots[sourceIndex] = "";
    saveResearchOrderSlots(slots);
  }

  function checkResearchOrderSlots(button) {
    const activityElement = button.closest("[data-research-order-activity]");
    const feedback = activityElement
      ? activityElement.querySelector('[data-day01-feedback="research-order"]')
      : null;
    const activity = getResearchOrderActivity();

    if (!activityElement || !activity || !feedback) {
      return;
    }

    const slots = getResearchOrderSlots(activity);
    const isFilled = slots.length === activity.correctOrder.length && slots.every(Boolean);

    if (!isFilled) {
      return;
    }

    const isCorrect = activity.correctOrder.every((itemId, index) => slots[index] === itemId);

    updateDay01State((state) => {
      state.researchOrder = slots;
      state.researchOrderCompleted = isCorrect;
    });

    feedback.textContent = isCorrect
      ? activityElement.dataset.successFeedback || "순서를 잘 맞췄습니다."
      : activityElement.dataset.retryFeedback || "순서를 다시 확인해 보세요.";
    feedback.classList.toggle("inline-feedback--correct", isCorrect);
    feedback.hidden = false;
    setSelectedResearchOrderCard("");
  }

  function handleResearchOrderDragStart(event) {
    const card = event.target.closest("[data-research-order-card]");

    if (!card || !card.closest("[data-research-order-activity]") || !isDay01Active()) {
      return;
    }

    draggedResearchOrderCard = {
      cardId: card.dataset.researchOrderCard,
      source: card.dataset.researchOrderSource || "pool",
      slotIndex:
        card.dataset.slotIndex === undefined || card.dataset.slotIndex === ""
          ? null
          : Number(card.dataset.slotIndex),
    };
    card.classList.add("is-dragging");

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedResearchOrderCard.cardId);
    }
  }

  function handleResearchOrderDragOver(event) {
    if (!draggedResearchOrderCard) {
      return;
    }

    const target = event.target.closest("[data-research-order-slot], [data-research-order-pool]");

    if (!target) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }

    clearResearchOrderDropTargets();
    target.classList.add("is-drag-over");
  }

  function handleResearchOrderDrop(event) {
    if (!draggedResearchOrderCard) {
      return;
    }

    const slot = event.target.closest("[data-research-order-slot]");
    const pool = event.target.closest("[data-research-order-pool]");

    if (!slot && !pool) {
      return;
    }

    event.preventDefault();
    clearResearchOrderDropTargets();

    if (slot) {
      placeResearchOrderCard(draggedResearchOrderCard.cardId, Number(slot.dataset.researchOrderSlot));
    } else if (pool) {
      removeResearchOrderCard(draggedResearchOrderCard.cardId);
    }
  }

  function handleResearchOrderDragEnd() {
    const draggingCard = elements.standardDay.querySelector(
      "[data-research-order-card].is-dragging"
    );

    if (draggingCard) {
      draggingCard.classList.remove("is-dragging");
    }

    clearResearchOrderDropTargets();
    draggedResearchOrderCard = null;
  }

  function getCheckedValues(container, selector) {
    return Array.from(container.querySelectorAll(`${selector}:checked`)).map(
      (input) => input.value
    );
  }

  function getMakeCodeUrlResult(rawValue) {
    const trimmed = String(rawValue || "").trim();

    if (!trimmed) {
      return {
        ok: false,
        message: "공유 주소를 붙여넣어 주세요.",
      };
    }

    try {
      const parsed = new URL(trimmed);

      if (parsed.hostname !== "makecode.microbit.org") {
        return {
          ok: false,
          message: "makecode.microbit.org 공유 링크만 연결할 수 있습니다.",
        };
      }

      return {
        ok: true,
        url: parsed.href,
      };
    } catch (error) {
      return {
        ok: false,
        message: "주소 형식을 다시 확인해 주세요.",
      };
    }
  }

  function updateMakeCodeLink() {
    const input = elements.standardDay.querySelector("[data-makecode-url]");
    const feedback = elements.standardDay.querySelector('[data-day01-feedback="makecode-link"]');

    if (!input || !feedback) {
      return;
    }

    const result = getMakeCodeUrlResult(input.value);

    if (!result.ok) {
      feedback.textContent = result.message;
      feedback.classList.remove("inline-feedback--correct");
      feedback.hidden = false;
      return;
    }

    updateDay01State((state) => {
      state.makeCodeShareUrl = result.url;
    });
  }

  function setVideoStatus(message) {
    const status = elements.standardDay.querySelector("[data-webcam-status]");

    if (status) {
      status.textContent = message;
    }
  }

  function selectRecorderMimeType() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) {
      return "";
    }

    return (
      [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm;codecs=h264",
        "video/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type)) || ""
    );
  }

  function clearRecordingTimer() {
    if (day01RecordingTimer) {
      window.clearInterval(day01RecordingTimer);
      day01RecordingTimer = null;
    }
  }

  function stopMediaStream(stream) {
    if (!stream || typeof stream.getTracks !== "function") {
      return;
    }

    stream.getTracks().forEach((track) => track.stop());
  }

  function stopCameraStream() {
    if (!day01CameraStream) {
      return;
    }

    stopMediaStream(day01CameraStream);
    day01CameraStream = null;
  }

  function revokeRecordedUrl() {
    if (day01RecordedUrl) {
      URL.revokeObjectURL(day01RecordedUrl);
      day01RecordedUrl = "";
    }
  }

  function clearDay01VideoElements() {
    const preview = elements.standardDay.querySelector("[data-camera-preview]");
    const recordedVideo = elements.standardDay.querySelector("[data-recorded-video]");
    const evidenceVideo = elements.standardDay.querySelector("[data-evidence-video-player]");
    const drivePreview = elements.standardDay.querySelector("[data-drive-video-preview]");
    const evidenceFrame = elements.standardDay.querySelector("[data-evidence-video-frame]");

    if (preview) {
      preview.srcObject = null;
    }

    [recordedVideo, evidenceVideo].forEach((video) => {
      if (!video) {
        return;
      }

      video.removeAttribute("src");
      video.hidden = true;
    });

    [drivePreview, evidenceFrame].forEach((frame) => {
      if (!frame) {
        return;
      }

      frame.removeAttribute("src");
      frame.hidden = true;
    });
  }

  function cleanupDay01Media(options = {}) {
    if (options.invalidate) {
      invalidateMediaRuntime();
    }

    clearRecordingTimer();

    if (day01Recorder && day01Recorder.state === "recording") {
      day01Recorder.stop();
    }

    stopCameraStream();
    revokeRecordedUrl();
    day01RecordedBlob = null;
    day01RecordedChunks = [];
    day01RecordedContext = null;
    clearDay01VideoElements();
  }

  function getCameraErrorMessage(error) {
    if (!error) {
      return "카메라를 사용할 수 없습니다. 권한과 연결 상태를 확인해 주세요.";
    }

    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "카메라 권한이 필요합니다. 브라우저 권한을 확인하고 다시 시도하세요.";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "연결된 카메라를 찾을 수 없습니다.";
    }

    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "다른 앱이 카메라를 사용 중일 수 있습니다.";
    }

    return "카메라를 사용할 수 없습니다. 권한과 연결 상태를 확인해 주세요.";
  }

  async function startDay01Camera() {
    if (!isDay01Active()) {
      return;
    }

    const requestContext = createMediaContext();

    if (activeDayState.captureStatus === "recording") {
      setVideoStatus("촬영 중입니다. 촬영 중지를 먼저 눌러 주세요.");
      return;
    }

    if (hasCurrentVideoReference(activeDayState)) {
      setVideoStatus("새로 촬영하려면 '다시 찍기'를 눌러 주세요.");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVideoStatus("이 브라우저에서는 카메라 촬영을 사용할 수 없습니다.");
      return;
    }

    if (!window.MediaRecorder) {
      setVideoStatus("이 브라우저에서는 영상 녹화를 사용할 수 없습니다.");
      updateDay01State((state) => {
        setVideoState(state, {
          captureStatus: "unsupported",
          storageStatus: "pending_teacher_upload",
          ingestMethod: "teacher_manual",
        });
      });
      return;
    }

    try {
      pendingCameraContext = requestContext;
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 24 },
        },
        audio: false,
      });

      if (pendingCameraContext !== requestContext || !isCurrentMediaContext(requestContext)) {
        stopMediaStream(stream);
        return;
      }

      pendingCameraContext = null;
      day01CameraStream = stream;
      const preview = elements.standardDay.querySelector("[data-camera-preview]");

      if (preview) {
        preview.srcObject = day01CameraStream;
      }

      updateDay01State((state) => {
        setVideoState(state, {
          captureStatus: "camera_ready",
          storageStatus: "not_configured",
          ingestMethod: "",
        });
      }, "카메라 준비");
    } catch (error) {
      if (pendingCameraContext !== requestContext || !isCurrentMediaContext(requestContext)) {
        return;
      }

      pendingCameraContext = null;
      console.warn("camera start failed", error);
      setVideoStatus(getCameraErrorMessage(error));
    }
  }

  function startRecordingCountdown() {
    const countdown = elements.standardDay.querySelector("[data-webcam-countdown]");

    if (!countdown) {
      return;
    }

    countdown.hidden = false;
    day01RecordingStartedAt = Date.now();
    clearRecordingTimer();
    day01RecordingTimer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - day01RecordingStartedAt) / 1000);
      const remaining = Math.max(0, DAY01_RECORDING_SECONDS - elapsed);
      countdown.textContent = `남은 시간 ${remaining}초`;

      if (
        remaining <= 0 ||
        elapsed >= Math.min(DAY01_RECORDING_SECONDS, DAY01_MAX_RECORDING_SECONDS)
      ) {
        stopDay01Recording();
      }
    }, 250);
  }

  function startDay01Recording() {
    if (!isDay01Active()) {
      return;
    }

    const recordingContext = Object.assign(createMediaContext(), {
      chunks: [],
      recorder: null,
    });

    if (activeDayState.captureStatus === "recording") {
      setVideoStatus("이미 촬영 중입니다.");
      return;
    }

    if (hasCurrentVideoReference(activeDayState)) {
      setVideoStatus("새로 촬영하려면 '다시 찍기'를 눌러 주세요.");
      return;
    }

    if (!day01CameraStream || !window.MediaRecorder) {
      setVideoStatus("카메라를 먼저 켜 주세요.");
      return;
    }

    try {
      revokeRecordedUrl();
      day01RecordedBlob = null;
      day01RecordedChunks = [];
      day01RecordedContext = null;

      const mimeType = selectRecorderMimeType();
      const options = Object.assign(
        { videoBitsPerSecond: DAY01_RECORDER_BITS_PER_SECOND },
        mimeType ? { mimeType } : {}
      );
      const recorder = new MediaRecorder(day01CameraStream, options);
      recordingContext.recorder = recorder;
      day01Recorder = recorder;
      day01RecorderContext = recordingContext;
      day01RecordedChunks = recordingContext.chunks;
      recorder.addEventListener("dataavailable", (event) => {
        if (
          !isCurrentMediaContext(recordingContext) ||
          day01RecorderContext !== recordingContext
        ) {
          return;
        }

        if (event.data && event.data.size > 0) {
          recordingContext.chunks.push(event.data);
          day01RecordedChunks = recordingContext.chunks;
        }
      });
      recorder.addEventListener("stop", () => finishDay01Recording(recordingContext, recorder));
      recorder.start();
      updateDay01State((state) => {
        setVideoState(state, {
          captureStatus: "recording",
          storageStatus: "not_configured",
          ingestMethod: "",
        });
      }, "촬영 중");
      startRecordingCountdown();
    } catch (error) {
      console.warn("record start failed", error);
      setVideoStatus("녹화를 시작할 수 없습니다. 브라우저와 카메라 상태를 확인해 주세요.");
    }
  }

  function stopDay01Recording() {
    if (!day01Recorder || day01Recorder.state !== "recording") {
      return;
    }

    clearRecordingTimer();
    day01Recorder.stop();
  }

  function finishDay01Recording(recordingContext, recorder) {
    if (
      !isCurrentMediaContext(recordingContext) ||
      day01RecorderContext !== recordingContext
    ) {
      return;
    }

    clearRecordingTimer();

    const countdown = elements.standardDay.querySelector("[data-webcam-countdown]");

    if (countdown) {
      countdown.hidden = true;
    }

    const mimeType = recorder && recorder.mimeType ? recorder.mimeType : "video/webm";
    const blob = new Blob(recordingContext.chunks, { type: mimeType });

    if (!blob.size) {
      setVideoStatus("녹화 영상이 만들어지지 않았습니다. 다시 촬영해 주세요.");
      updateDay01State((state) => {
        setVideoState(state, {
          captureStatus: "empty_blob",
          storageStatus: "pending_teacher_upload",
          ingestMethod: "teacher_manual",
        });
      });
      day01Recorder = null;
      day01RecorderContext = null;
      return;
    }

    if (
      !isCurrentMediaContext(recordingContext) ||
      day01RecorderContext !== recordingContext
    ) {
      return;
    }

    day01RecordedBlob = blob;
    day01RecordedUrl = URL.createObjectURL(blob);
    day01RecordedContext = Object.assign({}, recordingContext);

    const recordedVideo = elements.standardDay.querySelector("[data-recorded-video]");

    if (recordedVideo) {
      recordedVideo.src = day01RecordedUrl;
      recordedVideo.hidden = false;
    }

    updateDay01RuntimeState(
      (state) => {
        setVideoState(state, {
          captureStatus: "recorded",
          storageStatus: blob.size > DAY01_MAX_VIDEO_BYTES ? "too_large" : "not_configured",
          ingestMethod: "",
        });
        state.videoUploadError =
          blob.size > DAY01_MAX_VIDEO_BYTES
            ? "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요."
            : "";
      },
      blob.size > DAY01_MAX_VIDEO_BYTES
        ? "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요."
        : "영상이 아직 저장되지 않았습니다."
    );
    day01Recorder = null;
    day01RecorderContext = null;
  }

  function createRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `day01-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createTimeoutSignal(timeoutMs) {
    if (!window.AbortController) {
      return {
        signal: undefined,
        clear() {},
      };
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);

    return {
      signal: controller.signal,
      clear() {
        window.clearTimeout(timer);
      },
    };
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        const result = String(reader.result || "");
        const commaIndex = result.indexOf(",");
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      });
      reader.addEventListener("error", () => reject(reader.error || new Error("blob read failed")));
      reader.readAsDataURL(blob);
    });
  }

  async function uploadVideoEvidence(blob, metadata) {
    if (!getAppsScriptApiUrl()) {
      const error = new Error("video upload endpoint unavailable");
      error.code = "VIDEO_UPLOAD_UNAVAILABLE";
      throw error;
    }

    if (blob.size > DAY01_MAX_VIDEO_BYTES) {
      const error = new Error("video too large");
      error.code = "VIDEO_TOO_LARGE";
      throw error;
    }

    const normalizedMimeType =
      getBaseVideoMimeType(metadata.mimeType || blob.type) || "video/webm";
    const base64Data = await blobToBase64(blob);
    const data = await callAppsScriptApi("uploadVideo", {
      timeoutMs: DAY01_UPLOAD_TIMEOUT_MS,
      payload: {
        requestId: metadata.requestId,
        studentId: metadata.studentId,
        workId: metadata.workId,
        dayId: metadata.dayId,
        assetId: metadata.assetId,
        blockId: metadata.blockId || "block03",
        mimeType: normalizedMimeType,
        capturedAt: metadata.capturedAt,
        base64Data,
      },
    });
    const playbackUrl = getSafePlaybackUrl(data.playbackUrl || data.storageUrl);

    return {
      ok: true,
      assetId: data.assetId || "",
      fileId: data.storageFileId || data.fileId || "",
      storageFileId: data.storageFileId || data.fileId || "",
      playbackUrl,
      storageUrl: getSafePlaybackUrl(data.storageUrl || data.playbackUrl),
      fileName: data.fileName || "",
      mimeType: data.mimeType || normalizedMimeType,
      capturedAt: data.capturedAt || metadata.capturedAt || "",
      storageStatus: playbackUrl ? "playback_ready" : "stored",
      ingestMethod: "auto_drive",
    };
  }

  function logVideoUploadFailure(error, metadata) {
    console.warn("video upload failed", {
      action: "uploadVideo",
      studentId: metadata.studentId,
      dayId: metadata.dayId,
      blobSize: metadata.blobSize,
      blobType: metadata.blobType,
      normalizedMimeType: metadata.normalizedMimeType,
      errorCode: error && error.code ? error.code : "",
      errorMessage: error && error.message ? error.message : "",
    });
  }

  async function useDay01Recording() {
    if (day01UploadInFlight) {
      return;
    }

    if (activeDayState.captureStatus === "recording") {
      setVideoStatus("촬영이 끝난 뒤 이 영상을 사용할 수 있습니다.");
      return;
    }

    if (!day01RecordedBlob) {
      setVideoStatus("사용할 녹화 영상이 없습니다. 먼저 촬영해 주세요.");
      return;
    }

    const uploadContext = day01RecordedContext || createMediaContext();

    if (!isCurrentMediaContext(uploadContext)) {
      setVideoStatus("연구원 정보가 바뀌어 이 영상은 저장하지 않습니다. 다시 촬영해 주세요.");
      return;
    }

    if (day01RecordedBlob.size > DAY01_MAX_VIDEO_BYTES) {
      updateDay01RuntimeState((state) => {
        state.videoUploadError = "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요.";
        setVideoState(state, {
          captureStatus: "recorded",
          storageStatus: "too_large",
          ingestMethod: "",
        });
      }, "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요.");
      setVideoStatus("영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요.");
      return;
    }

    const uploadBlob = day01RecordedBlob;
    const originalUploadMimeType = uploadBlob.type || selectRecorderMimeType() || "video/webm";
    const uploadMimeType = getBaseVideoMimeType(originalUploadMimeType) || "video/webm";
    const capturedAt = new Date().toISOString();

    day01UploadInFlight = true;
    updateDay01RuntimeState((state) => {
      state.videoUploadError = "";
      setVideoState(state, {
        captureStatus: "recorded",
        storageStatus: "pending_upload",
        ingestMethod: "auto_drive",
      });
    }, "영상 저장 중...");

    try {
      const requestId = createRequestId();
      const result = await uploadVideoEvidence(uploadBlob, {
        requestId,
        studentId: uploadContext.studentId,
        workId: uploadContext.workId,
        dayId: uploadContext.dayId,
        assetId: getExpectedVideoAssetId(uploadContext.studentId, uploadContext.dayId),
        blockId: "block03",
        mimeType: uploadMimeType,
        capturedAt,
      });

      if (!isCurrentMediaContext(uploadContext)) {
        return;
      }

      updateDay01RuntimeState((state) => {
        state.videoAssetId = result.assetId || "";
        state.videoFileId = result.storageFileId || result.fileId || "";
        state.videoStorageFileId = result.storageFileId || result.fileId || "";
        state.videoPlaybackUrl = result.playbackUrl || "";
        state.videoStorageUrl = result.storageUrl || "";
        state.videoFileName = result.fileName || "";
        state.videoMimeType = result.mimeType || uploadMimeType;
        state.videoCapturedAt = result.capturedAt || capturedAt;
        state.videoPersisted = Boolean(
          state.videoAssetId && state.videoStorageFileId && state.videoPlaybackUrl
        );
        state.videoUploadError = "";
        state.videoRetakeInProgress = false;
        setVideoState(state, {
          captureStatus: "recorded",
          storageStatus: result.storageStatus,
          ingestMethod: result.ingestMethod,
        });
      }, "영상 기록 저장 중...");

      revokeRecordedUrl();
      day01RecordedBlob = null;
      day01RecordedChunks = [];
      day01RecordedContext = null;

      const recordSaved = await saveDayState("영상 기록 저장 중...", {
        server: "immediate",
        waitForServer: true,
      });

      if (!recordSaved) {
        setVideoStatus("영상은 Drive에 저장됐지만 연구 기록 저장을 다시 시도해야 합니다.");
      }
    } catch (error) {
      const isTooLargeError = error && error.code === "VIDEO_TOO_LARGE";
      logVideoUploadFailure(error, {
        studentId: uploadContext.studentId,
        dayId: uploadContext.dayId,
        blobSize: uploadBlob.size,
        blobType: originalUploadMimeType,
        normalizedMimeType: uploadMimeType,
      });
      updateDay01RuntimeState(
        (state) => {
          state.videoUploadError = isTooLargeError
            ? "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요."
            : "영상 저장하지 못했어요. 새로고침하기 전에 다시 저장해 주세요.";
          setVideoState(state, {
            captureStatus: "recorded",
            storageStatus: isTooLargeError ? "too_large" : "failed",
            ingestMethod: "auto_drive",
          });
        },
        isTooLargeError
          ? "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요."
          : SAVE_STATUS.failed,
        { retryVideo: !isTooLargeError }
      );
      setVideoStatus(
        isTooLargeError
          ? "영상이 너무 커서 저장하지 못했습니다. 짧게 다시 촬영해 주세요."
          : "영상 저장하지 못했어요. 새로고침하기 전에 다시 저장해 주세요."
      );
    } finally {
      day01UploadInFlight = false;
      syncDay01UiFromState();
    }
  }

  function markVideoEvidenceSuperseded(state) {
    if (
      !state.videoAssetId &&
      !state.videoFileId &&
      !state.videoPlaybackUrl &&
      !state.videoStorageUrl
    ) {
      return;
    }

    state.supersededVideoEvidence = [
      ...(state.supersededVideoEvidence || []),
      {
        assetId: state.videoAssetId || "",
        fileId: state.videoFileId || "",
        storageFileId: state.videoStorageFileId || state.videoFileId || "",
        playbackUrl: state.videoPlaybackUrl || "",
        storageUrl: state.videoStorageUrl || "",
        supersededAt: new Date().toISOString(),
      },
    ];
  }

  function retakeDay01Recording() {
    if (!isDay01Active()) {
      return;
    }

    if (activeDayState.captureStatus === "recording") {
      setVideoStatus("촬영 중에는 다시 찍을 수 없습니다. 촬영 중지를 먼저 눌러 주세요.");
      return;
    }

    if (day01UploadInFlight) {
      setVideoStatus("영상 저장 중입니다. 잠시 후 다시 찍을 수 있습니다.");
      return;
    }

    if (!hasCurrentVideoReference(activeDayState)) {
      setVideoStatus("다시 찍을 영상이 없습니다.");
      return;
    }

    const hadPersistentVideo = hasPersistentVideoReference(activeDayState);

    revokeRecordedUrl();
    day01RecordedBlob = null;
    day01RecordedChunks = [];
    day01RecordedContext = null;

    const recordedVideo = elements.standardDay.querySelector("[data-recorded-video]");

    if (recordedVideo) {
      recordedVideo.removeAttribute("src");
      recordedVideo.hidden = true;
    }

    updateDay01RuntimeState((state) => {
      markVideoEvidenceSuperseded(state);
      if (!hadPersistentVideo) {
        state.videoAssetId = "";
        state.videoFileId = "";
        state.videoStorageFileId = "";
        state.videoPlaybackUrl = "";
        state.videoStorageUrl = "";
        state.videoFileName = "";
        state.videoMimeType = "";
        state.videoCapturedAt = "";
        state.videoPersisted = false;
      }
      state.videoUploadError = "";
      state.videoRetakeInProgress = hadPersistentVideo;
      setVideoState(state, {
        captureStatus: day01CameraStream ? "camera_ready" : "not_started",
        storageStatus: hadPersistentVideo ? "retake_ready" : "not_configured",
        ingestMethod: hadPersistentVideo ? state.ingestMethod : "",
      });
    }, "다시 촬영할 준비가 되었습니다.");

    setVideoStatus(
      day01CameraStream
        ? "다시 촬영할 준비가 되었습니다."
        : "다시 촬영하려면 카메라를 켜 주세요."
    );
  }

  async function resolveVideoPlaybackUrl(fileId) {
    if (!CONFIG.videoPlaybackResolveEndpoint || !fileId) {
      return "";
    }

    const parsedEndpoint = new URL(CONFIG.videoPlaybackResolveEndpoint);
    parsedEndpoint.searchParams.set("fileId", fileId);
    const timeout = createTimeoutSignal(DAY01_UPLOAD_TIMEOUT_MS);

    try {
      const response = await fetch(parsedEndpoint.href, {
        signal: timeout.signal,
      });

      if (!response.ok) {
        throw new Error(`playback resolve failed: ${response.status}`);
      }

      const payload = await response.json();
      return payload.playbackUrl || "";
    } finally {
      timeout.clear();
    }
  }

  async function saveManualVideoIngest() {
    const fileIdInput = elements.standardDay.querySelector("[data-manual-video-file-id]");
    const playbackInput = elements.standardDay.querySelector("[data-manual-video-playback-url]");
    const assetInput = elements.standardDay.querySelector("[data-manual-asset-id]");
    const feedback = elements.standardDay.querySelector("[data-webcam-status]");
    const fileIdValue = String(fileIdInput ? fileIdInput.value : "").trim();
    const playbackValue = String(playbackInput ? playbackInput.value : "").trim();
    const assetValue = String(assetInput ? assetInput.value : "").trim();

    if (!fileIdValue && !playbackValue && !assetValue) {
      setVideoStatus("Drive fileId 또는 서버가 제공한 playback URL을 입력해 주세요.");
      return;
    }

    try {
      const playbackUrl = playbackValue || (await resolveVideoPlaybackUrl(fileIdValue));
      const safePlaybackUrl = getSafePlaybackUrl(playbackUrl);
      const resolvedAssetValue =
        assetValue ||
        (fileIdValue && safePlaybackUrl ? getExpectedVideoAssetId(getStudentId(), activeDay.dayId) : "");
      const storageStatus = safePlaybackUrl
        ? "playback_ready"
        : fileIdValue || resolvedAssetValue
        ? "stored"
        : "pending_teacher_upload";

      if (playbackValue && !safePlaybackUrl) {
        throw new Error("invalid playback url");
      }

      updateDay01State((state) => {
        state.videoFileId = fileIdValue;
        state.videoStorageFileId = fileIdValue;
        state.videoPlaybackUrl = safePlaybackUrl;
        state.videoStorageUrl = safePlaybackUrl;
        state.videoAssetId = resolvedAssetValue;
        state.videoFileName = fileIdValue ? `${state.dayId}-${state.studentId}-manual-video.webm` : "";
        state.videoMimeType = "video/webm";
        state.videoCapturedAt = new Date().toISOString();
        state.videoPersisted = Boolean(resolvedAssetValue && fileIdValue && safePlaybackUrl);
        state.videoUploadError = "";
        state.videoRetakeInProgress = false;
        setVideoState(state, {
          captureStatus: "recorded",
          storageStatus,
          ingestMethod: "teacher_manual",
        });
      }, getVideoSaveStateLabel({ storageStatus }));
    } catch (error) {
      if (feedback) {
        feedback.textContent = "Drive 보기 주소가 아닌 서버 playback URL을 입력해 주세요.";
      }
    }
  }

  function setEvidenceCardComplete(selector, completed) {
    const card = elements.standardDay.querySelector(selector);

    if (card) {
      card.classList.toggle("evidence-card--complete", Boolean(completed));
    }
  }

  function updateDay01EvidenceUi() {
    if (!isDay01Active()) {
      return;
    }

    const problemSummary = getDiscoveredProblemSummary(activeDayState.discoveredProblem || {});
    const usedFeatures = uniqueItems([
      ...(activeDayState.unlockedTools || []),
      ...(activeDayState.usedFeatures || []),
    ]);
    const videoState = activeDayState.videoLocalState || {};

    const evidenceProblem = elements.standardDay.querySelector("[data-evidence-problem] p");
    const evidenceOrder = elements.standardDay.querySelector("[data-evidence-order] p");
    const evidenceTools = elements.standardDay.querySelector("[data-evidence-tools] p");
    const evidencePeer = elements.standardDay.querySelector("[data-evidence-peer] p");
    const evidenceCode = elements.standardDay.querySelector("[data-evidence-code] p");
    const evidenceCodeLink = elements.standardDay.querySelector("[data-evidence-code-link]");
    const evidenceVideo = elements.standardDay.querySelector("[data-evidence-video] p");
    const evidenceVideoPlayer = elements.standardDay.querySelector("[data-evidence-video-player]");
    const evidenceVideoFrame = elements.standardDay.querySelector("[data-evidence-video-frame]");
    const evidenceVideoReview = elements.standardDay.querySelector("[data-evidence-video-review]");
    const videoLocalPlaybackSource = day01RecordedUrl || "";
    const videoDrivePreviewSource = getPersistentVideoPlaybackSource(activeDayState);

    if (evidenceProblem) {
      evidenceProblem.textContent = problemSummary ? `${problemSummary} ✓` : "아직 미완료";
    }

    if (evidenceOrder) {
      evidenceOrder.textContent = activeDayState.researchOrderCompleted
        ? "연구 과정 ✓"
        : "아직 미완료";
    }

    if (evidenceTools) {
      evidenceTools.textContent = usedFeatures.length ? usedFeatures.join(" · ") : "아직 미완료";
    }

    if (evidencePeer) {
      evidencePeer.textContent = activeDayState.peerTestResult
        ? `${activeDayState.peerTestResult} ✓`
        : "아직 미완료";
    }

    if (evidenceCode) {
      evidenceCode.textContent = activeDayState.makeCodeShareUrl ? "연결 완료 ✓" : "미연결";
    }

    if (evidenceCodeLink) {
      evidenceCodeLink.href = activeDayState.makeCodeShareUrl || "#";
      evidenceCodeLink.hidden = !activeDayState.makeCodeShareUrl;
    }

    if (evidenceVideo) {
      evidenceVideo.textContent = isVideoEvidenceComplete(activeDayState)
        ? "촬영 완료 ✓"
        : getVideoStatusText(videoState);
    }

    if (evidenceVideoPlayer) {
      evidenceVideoPlayer.src = videoLocalPlaybackSource;
      evidenceVideoPlayer.hidden = !videoLocalPlaybackSource;
    }

    if (evidenceVideoFrame) {
      evidenceVideoFrame.src = videoDrivePreviewSource;
      evidenceVideoFrame.hidden = !videoDrivePreviewSource;
    }

    if (evidenceVideoReview) {
      evidenceVideoReview.hidden = !isVideoEvidenceComplete(activeDayState);
    }

    setEvidenceCardComplete("[data-evidence-problem]", Boolean(problemSummary));
    setEvidenceCardComplete("[data-evidence-order]", activeDayState.researchOrderCompleted);
    setEvidenceCardComplete("[data-evidence-tools]", usedFeatures.length > 0);
    setEvidenceCardComplete("[data-evidence-peer]", Boolean(activeDayState.peerTestResult));
    setEvidenceCardComplete("[data-evidence-code]", Boolean(activeDayState.makeCodeShareUrl));
    setEvidenceCardComplete("[data-evidence-video]", isVideoEvidenceComplete(activeDayState));
  }

  function updateDay01CompletionUi() {
    if (!isDay01Active()) {
      return;
    }

    const title = elements.standardDay.querySelector("[data-day01-complete-title]");
    const body = elements.standardDay.querySelector("[data-day01-complete-body]");
    const gained = elements.standardDay.querySelector("[data-day01-complete-gained]");
    const summary = elements.standardDay.querySelector("[data-day01-complete-summary]");
    const nextResearch = elements.standardDay.querySelector("[data-day01-next-research]");

    if (!title || !body) {
      return;
    }

    updateDay01Progress(activeDayState);

    title.textContent = getDay01CompletionTitle(activeDayState);
    body.innerHTML = renderDay01CompletionBody(activeDayState);

    if (gained) gained.hidden = !activeDayState.dayCompleted;
    if (summary) summary.hidden = !activeDayState.dayCompleted;
    if (nextResearch) nextResearch.hidden = !activeDayState.dayCompleted;
  }

  function syncDay01UiFromState() {
    if (!isDay01Active() || !elements.standardDay) {
      return;
    }

    updateDay01Progress(activeDayState);

    elements.standardDay.querySelectorAll("[data-day01-challenge]").forEach((item) => {
      const challengeId = item.dataset.day01Challenge;
      const isComplete = getDay01ChallengeStatus(challengeId);
      const mark = item.querySelector("[data-day01-challenge-mark]");

      item.classList.toggle("is-complete", isComplete);

      if (mark) {
        mark.textContent = isComplete ? "완료 ✓" : "진행 전";
      }
    });

    setButtonSelection("[data-problem-card]", [
      activeDayState.discoveredProblem ? activeDayState.discoveredProblem.situationId : "",
    ]);
    updateProblemMeaningSelect();
    updateProblemSummaryUi();

    if (activeDayState.problemHelpMatch) {
      ["person", "problem", "help"].forEach((group) => {
        elements.standardDay
          .querySelectorAll(`[data-match-group="${group}"]`)
          .forEach((button) => {
            const isSelected = activeDayState.problemHelpMatch[group] === button.dataset.matchCard;
            button.classList.toggle("is-selected", isSelected);
            button.setAttribute("aria-pressed", isSelected ? "true" : "false");
          });
      });
    }

    setButtonSelection("[data-role-option]", activeDayState.selectedRoles);
    setButtonSelection("[data-peer-result]", [activeDayState.peerTestResult]);
    updateCodePredictionUi();
    updateShakeActivityUi();

    setDay01Feedback(
      "problem-hotspot",
      Boolean(getDiscoveredProblemSummary(activeDayState.discoveredProblem || {})),
      "첫 문제 발견! 연구는 누가 무엇 때문에 불편한지 알아차리는 것부터 시작합니다."
    );
    {
      const matchStatus = getCardMatchStatus(activeDayState.problemHelpMatch);
      const feedback = elements.standardDay.querySelector('[data-day01-feedback="card-match"]');

      if (feedback) {
        feedback.textContent = matchStatus.isValid
          ? "문제와 도움 연결 완료 ✓"
          : "이 사람의 문제와 도움 방법이 서로 잘 이어지는지 다시 확인해 보세요.";
        feedback.classList.toggle("inline-feedback--correct", matchStatus.isValid);
        feedback.hidden = !matchStatus.hasAllSelections;
      }
    }
    setDay01Feedback("role-pick", activeDayState.selectedRoles.length > 0, "역할 선택 저장 완료 ✓");
    setDay01Feedback(
      "buttonToolCompleted",
      activeDayState.buttonToolCompleted,
      "내 코드가 실제 장치에서 움직였습니다!"
    );
    setDay01Feedback(
      "shakeToolCompleted",
      activeDayState.shakeToolCompleted,
      "새 입력 발견 ✓\n\n버튼뿐 아니라 움직임도 입력으로 사용할 수 있습니다."
    );
    setDay01Feedback(
      "combination-challenge",
      activeDayState.combinationChanges.length > 0,
      "기술 도구 획득 ✓"
    );
    setDay01Feedback(
      "free-lab",
      ["try", "change", "test"].every((step) => activeDayState.freeResearchSteps.includes(step)),
      "나의 첫 자유 연구 완료 ✓"
    );
    setDay01Feedback("peer-test", Boolean(activeDayState.peerTestResult), "친구 시험 완료 ✓");

    elements.standardDay.querySelectorAll("[data-self-check-item]").forEach((input) => {
      const isChecked = activeDayState.selfCheckItems.includes(input.value);
      const status = input.parentElement.querySelector("[data-self-check-status]");

      input.checked = isChecked;

      if (status) {
        status.textContent = isChecked ? "✓ 완료" : "○ 아직 확인하지 않음";
      }
    });

    elements.standardDay.querySelectorAll("[data-feature-menu]").forEach((button) => {
      const isSelected =
        button.dataset.featureCorrect === "true" && activeDayState.shakeFeatureFound;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    elements.standardDay.querySelectorAll("[data-quiz-free-option]").forEach((button) => {
      const selected = activeDayState.quizAnswers[button.dataset.quizId] === button.dataset.quizFreeOption;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    elements.standardDay.querySelectorAll("[data-day01-quiz-id]").forEach((group) => {
      const selectedValue = activeDayState.quizAnswers[group.dataset.day01QuizId];

      group.querySelectorAll("[data-choice-button]").forEach((button) => {
        const selected = selectedValue === button.dataset.choiceValue;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    });

    const makeCodeInput = elements.standardDay.querySelector("[data-makecode-url]");
    const makeCodeFeedback = elements.standardDay.querySelector('[data-day01-feedback="makecode-link"]');
    const makeCodeOpen = elements.standardDay.querySelector("[data-makecode-open]");

    if (makeCodeInput && makeCodeInput.value !== activeDayState.makeCodeShareUrl) {
      makeCodeInput.value = activeDayState.makeCodeShareUrl || "";
    }

    if (makeCodeFeedback && activeDayState.makeCodeShareUrl) {
      makeCodeFeedback.textContent = "코드 연결 완료 ✓";
      makeCodeFeedback.classList.add("inline-feedback--correct");
      makeCodeFeedback.hidden = false;
    }

    if (makeCodeOpen) {
      makeCodeOpen.href = activeDayState.makeCodeShareUrl || "#";
      makeCodeOpen.hidden = !activeDayState.makeCodeShareUrl;
    }

    const recordedVideo = elements.standardDay.querySelector("[data-recorded-video]");
    const drivePreview = elements.standardDay.querySelector("[data-drive-video-preview]");

    if (recordedVideo) {
      recordedVideo.src = day01RecordedUrl || "";
      recordedVideo.hidden = !day01RecordedUrl;
    }

    if (drivePreview) {
      const drivePreviewUrl = getPersistentVideoPlaybackSource(activeDayState);
      drivePreview.src = drivePreviewUrl;
      drivePreview.hidden = !drivePreviewUrl;
    }

    const webcamStatus = elements.standardDay.querySelector("[data-webcam-status]");

    if (webcamStatus) {
      webcamStatus.textContent = getVideoStatusText(activeDayState.videoLocalState);
    }

    const cameraStart = elements.standardDay.querySelector("[data-camera-start]");
    const recordStart = elements.standardDay.querySelector("[data-record-start]");
    const recordStop = elements.standardDay.querySelector("[data-record-stop]");
    const useRecording = elements.standardDay.querySelector("[data-use-recording]");
    const retake = elements.standardDay.querySelector("[data-retake-recording]");
    const isRecording = activeDayState.captureStatus === "recording";
    const hasVideoReference = hasCurrentVideoReference(activeDayState);

    if (cameraStart) {
      cameraStart.disabled = isRecording || hasVideoReference || day01UploadInFlight;
    }

    if (recordStart) {
      recordStart.disabled =
        !day01CameraStream || isRecording || hasVideoReference || day01UploadInFlight;
    }

    if (recordStop) {
      recordStop.disabled = !isRecording;
    }

    if (useRecording) {
      useRecording.textContent =
        activeDayState.storageStatus === "failed" ? "다시 저장" : "이 영상 사용";
      useRecording.disabled =
        isRecording ||
        !day01RecordedBlob ||
        day01UploadInFlight ||
        activeDayState.storageStatus === "too_large";
    }

    if (retake) {
      retake.disabled = isRecording || day01UploadInFlight || !hasVideoReference;
    }

    updateDay01EvidenceUi();
    updateDay01CompletionUi();
  }

  function handleStartResearch() {
    const currentDay = getCurrentDay();
    const lesson = getLessonForDay(currentDay);

    if (!lesson) {
      return;
    }

    focusSection(lesson.flowStartId);
  }

  function handleProjectReloadReveal(event) {
    const button = event.target.closest("[data-reveal-project-reload]");

    if (!button) {
      return;
    }

    revealProjectReload();
  }

  function handleChoiceClick(event) {
    const button = event.target.closest("[data-choice-button]");

    if (!button) {
      return;
    }

    const group = button.closest("[data-choice-group]");
    const feedback = group.querySelector("[data-feedback-region]");
    const isCorrect = button.dataset.correct === "true";

    group.querySelectorAll("[data-choice-button]").forEach((choice) => {
      choice.classList.remove("is-selected");
      choice.setAttribute("aria-pressed", "false");
    });

    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");

    feedback.textContent = isCorrect ? group.dataset.correctFeedback : group.dataset.incorrectFeedback;
    feedback.hidden = false;
    feedback.classList.toggle("inline-feedback--correct", isCorrect);

    if (isDay01Active() && group.dataset.day01QuizId) {
      updateDay01State((state) => {
        state.quizAnswers[group.dataset.day01QuizId] = button.dataset.choiceValue;
      });
    }
  }

  function updateShakeCompletionState(state, unlockTools = []) {
    state.shakeChecklist = normalizeShakeChecklist(state.shakeChecklist);
    state.shakeToolCompleted = isShakeActivityComplete(state);

    if (state.shakeToolCompleted) {
      addUnlockedTools(state, unlockTools);
    }
  }

  function updateShakeActivityUi() {
    const activityElement = elements.standardDay.querySelector("[data-day01-activity='feature-find']");

    if (!activityElement || !activeDayState) {
      return;
    }

    activityElement.querySelectorAll("[data-feature-menu]").forEach((button) => {
      const isSelected =
        button.dataset.featureCorrect === "true" && activeDayState.shakeFeatureFound;
      const mark = button.querySelector(".shake-menu-card__mark");

      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");

      if (mark) {
        mark.hidden = !isSelected;
      }
    });

    activityElement.querySelectorAll("[data-shake-led-choice]").forEach((input) => {
      const isSelected = activeDayState.shakeLedChoice === input.value;
      const label = input.closest(".shake-led-option");
      const mark = label ? label.querySelector(".shake-led-option__mark") : null;

      input.checked = isSelected;

      if (label) {
        label.classList.toggle("is-selected", isSelected);
      }

      if (mark) {
        mark.hidden = !isSelected;
      }
    });

    activityElement.querySelectorAll("[data-shake-step]").forEach((input) => {
      input.checked = activeDayState.shakeChecklist.includes(input.value);
    });

    const preview = activityElement.querySelector("[data-shake-code-preview]");

    if (preview) {
      preview.innerHTML = renderShakeCodePreview(activeDayState);
      preview.hidden = !activeDayState.shakeLedChoice;
    }

    const menuFeedback = activityElement.querySelector("[data-shake-menu-feedback]");

    if (menuFeedback && activeDayState.shakeFeatureFound) {
      menuFeedback.textContent =
        "맞아요!\n\n'입력' 메뉴를 열고\n'흔들었을 때' 블록을 찾아보세요.";
      menuFeedback.classList.add("inline-feedback--correct");
      menuFeedback.hidden = false;
    }
  }

  function setShakeMenuFeedback(activityElement, isCorrect) {
    const feedback = activityElement ? activityElement.querySelector("[data-shake-menu-feedback]") : null;

    if (!feedback) {
      return;
    }

    feedback.textContent = isCorrect
      ? "맞아요!\n\n'입력' 메뉴를 열고\n'흔들었을 때' 블록을 찾아보세요."
      : "다시 찾아보세요.\n버튼이나 움직임처럼 장치가 알아차리는 기능은 어느 메뉴에 있을까요?";
    feedback.classList.toggle("inline-feedback--correct", isCorrect);
    feedback.hidden = false;
  }

  function updateShakeCompletion(activityElement) {
    const checked = getCheckedValues(activityElement, "[data-shake-step]");
    const unlockTools = (activityElement.dataset.unlockTools || "").split("|").filter(Boolean);

    updateDay01State((state) => {
      state.shakeChecklist = checked;
      updateShakeCompletionState(state, unlockTools);
    });
  }

  function handleDay01Click(event) {
    if (!isDay01Active()) {
      return;
    }

    const researchOrderCheck = event.target.closest("[data-research-order-check]");

    if (researchOrderCheck) {
      checkResearchOrderSlots(researchOrderCheck);
      return;
    }

    const researchOrderSlot = event.target.closest("[data-research-order-slot]");

    if (researchOrderSlot) {
      const slotCard = researchOrderSlot.dataset.researchOrderCard || "";

      if (selectedResearchOrderCard) {
        if (selectedResearchOrderCard === slotCard) {
          setSelectedResearchOrderCard("");
        } else {
          placeResearchOrderCard(
            selectedResearchOrderCard,
            Number(researchOrderSlot.dataset.researchOrderSlot)
          );
        }
      } else if (slotCard) {
        setSelectedResearchOrderCard(slotCard);
      }

      return;
    }

    const researchOrderCard = event.target.closest("[data-research-order-card]");

    if (researchOrderCard && researchOrderCard.closest("[data-research-order-activity]")) {
      setSelectedResearchOrderCard(researchOrderCard.dataset.researchOrderCard);
      return;
    }

    const researchOrderPool = event.target.closest("[data-research-order-pool]");

    if (researchOrderPool && selectedResearchOrderCard) {
      removeResearchOrderCard(selectedResearchOrderCard);
      return;
    }

    const codePredictionChoice = event.target.closest("[data-code-prediction-choice]");

    if (codePredictionChoice) {
      toggleCodePredictionChoice(codePredictionChoice);
      return;
    }

    const codePredictionCheck = event.target.closest("[data-code-prediction-check]");

    if (codePredictionCheck) {
      checkCodePrediction();
      return;
    }

    const problemCard = event.target.closest("[data-problem-card]");

    if (problemCard) {
      updateDay01State((state) => {
        const situation = getProblemSituation(problemCard.dataset.problemCard);
        const previousMeaning =
          state.discoveredProblem && state.discoveredProblem.meaning
            ? state.discoveredProblem.meaning
            : "";
        const nextMeaning =
          situation && situation.meaningOptions.includes(previousMeaning) ? previousMeaning : "";

        state.discoveredTarget = situation ? situation.target : "";
        state.discoveredProblem = Object.assign({}, state.discoveredProblem || {}, {
          situationId: problemCard.dataset.problemCard,
          target: situation ? situation.target : "",
          meaning: nextMeaning,
        });
      });
      return;
    }

    const matchCard = event.target.closest("[data-match-card]");

    if (matchCard) {
      updateDay01State((state) => {
        const nextMatch = Object.assign({}, state.problemHelpMatch, {
          [matchCard.dataset.matchGroup]: matchCard.dataset.matchCard,
        });
        nextMatch.completed = getCardMatchStatus(nextMatch).isValid;
        state.problemHelpMatch = nextMatch;
      });
      return;
    }

    const roleButton = event.target.closest("[data-role-option]");

    if (roleButton) {
      const max = Number(roleButton.closest("[data-role-max]").dataset.roleMax || 2);

      updateDay01State((state) => {
        const role = roleButton.dataset.roleOption;
        const selectedRoles = state.selectedRoles.includes(role)
          ? state.selectedRoles.filter((item) => item !== role)
          : state.selectedRoles.length < max
          ? [...state.selectedRoles, role]
          : state.selectedRoles;
        state.selectedRoles = uniqueItems(selectedRoles);
      });
      return;
    }

    const featureMenu = event.target.closest("[data-feature-menu]");

    if (featureMenu) {
      const activityElement = featureMenu.closest("[data-day01-activity='feature-find']");
      const isCorrect = featureMenu.dataset.featureCorrect === "true";
      const unlockTools = (activityElement.dataset.unlockTools || "").split("|").filter(Boolean);

      updateDay01State((state) => {
        if (isCorrect) {
          state.shakeFeatureFound = true;
        }

        updateShakeCompletionState(state, unlockTools);
      });

      setShakeMenuFeedback(activityElement, isCorrect);
      return;
    }

    const drawIdeaButton = event.target.closest("[data-draw-idea]");

    if (drawIdeaButton) {
      const ideas = drawIdeaButton.dataset.ideas.split("|").filter(Boolean);
      const target = drawIdeaButton.parentElement.querySelector("[data-random-idea]");
      const idea = ideas[Math.floor(Math.random() * ideas.length)];

      if (target && idea) {
        target.textContent = idea;
        target.hidden = false;
      }
      return;
    }

    const peerButton = event.target.closest("[data-peer-result]");

    if (peerButton) {
      updateDay01State((state) => {
        state.peerTestResult = peerButton.dataset.peerResult;
      });
      return;
    }

    const saveMakeCode = event.target.closest("[data-save-makecode-link]");

    if (saveMakeCode) {
      updateMakeCodeLink();
      return;
    }

    const quizFreeOption = event.target.closest("[data-quiz-free-option]");

    if (quizFreeOption) {
      updateDay01State((state) => {
        state.quizAnswers[quizFreeOption.dataset.quizId] = quizFreeOption.dataset.quizFreeOption;
      });
      return;
    }

    if (event.target.closest("[data-camera-start]")) {
      startDay01Camera();
      return;
    }

    if (event.target.closest("[data-record-start]")) {
      startDay01Recording();
      return;
    }

    if (event.target.closest("[data-record-stop]")) {
      stopDay01Recording();
      return;
    }

    if (event.target.closest("[data-use-recording]")) {
      useDay01Recording();
      return;
    }

    if (event.target.closest("[data-retake-recording]")) {
      retakeDay01Recording();
      return;
    }

    if (event.target.closest("[data-save-manual-video]")) {
      saveManualVideoIngest();
    }
  }

  function handleDay01Input(event) {
    if (!isDay01Active()) {
      return;
    }

    if (event.target.closest("[data-day01-record-field]")) {
      const fieldKey = event.target.dataset.day01RecordField;
      updateDay01State((state) => {
        state.recordValues[fieldKey] = event.target.value.trim();
      });
      return;
    }

  }

  function handleDay01Change(event) {
    if (!isDay01Active()) {
      return;
    }

    if (event.target.closest("[data-day01-record-field]")) {
      const fieldKey = event.target.dataset.day01RecordField;
      updateDay01State((state) => {
        state.recordValues[fieldKey] = event.target.value;
      });
      return;
    }

    if (event.target.closest("[data-problem-meaning]")) {
      if (event.target.type === "radio" && !event.target.checked) {
        return;
      }

      updateDay01State((state) => {
        const situation = getProblemSituation(
          state.discoveredProblem ? state.discoveredProblem.situationId : ""
        );

        state.discoveredTarget = situation ? situation.target : state.discoveredTarget;
        state.discoveredProblem = Object.assign({}, state.discoveredProblem || {}, {
          target: situation ? situation.target : state.discoveredTarget,
          meaning: event.target.value,
        });
      });
      return;
    }

    if (event.target.closest("[data-makecode-step]")) {
      const activityElement = event.target.closest("[data-day01-activity='makecode-checklist']");
      const checklistKey = activityElement.dataset.checklistKey;
      const stateKey = activityElement.dataset.stateKey;
      const checked = getCheckedValues(activityElement, "[data-makecode-step]");
      const total = activityElement.querySelectorAll("[data-makecode-step]").length;
      const unlockTools = (activityElement.dataset.unlockTools || "").split("|").filter(Boolean);

      updateDay01State((state) => {
        state[checklistKey] = checked;
        state[stateKey] = checked.length === total;

        if (state[stateKey]) {
          addUnlockedTools(state, unlockTools);
        }
      });
      return;
    }

    if (event.target.closest("[data-makecode-ui-check]")) {
      const activityElement = event.target.closest("[data-day01-activity='makecode-ui-check']");
      const checked = getCheckedValues(activityElement, "[data-makecode-ui-check]");

      updateDay01State((state) => {
        state.makeCodeUiCheckItems = checked;
      });
      return;
    }

    if (event.target.closest("[data-saved-checklist-item]")) {
      const activityElement = event.target.closest("[data-day01-activity='saved-checklist']");
      const stateListKey = activityElement.dataset.stateListKey;
      const checked = getCheckedValues(activityElement, "[data-saved-checklist-item]");

      if (!stateListKey) {
        return;
      }

      updateDay01State((state) => {
        state[stateListKey] = checked;
      });
      return;
    }

    if (event.target.closest("[data-shake-led-choice]")) {
      const activityElement = event.target.closest("[data-day01-activity='feature-find']");
      const unlockTools = (activityElement.dataset.unlockTools || "").split("|").filter(Boolean);

      updateDay01State((state) => {
        state.shakeLedChoice = event.target.value;
        updateShakeCompletionState(state, unlockTools);
      });
      return;
    }

    if (event.target.closest("[data-shake-step]")) {
      updateShakeCompletion(event.target.closest("[data-day01-activity='feature-find']"));
      return;
    }

    if (event.target.closest("[data-combination-change]")) {
      const activityElement = event.target.closest("[data-day01-activity='combination-challenge']");
      const changes = getCheckedValues(activityElement, "[data-combination-change]");

      updateDay01State((state) => {
        state.combinationChanges = changes;
      });
      return;
    }

    if (event.target.closest("[data-free-step]")) {
      const activityElement = event.target.closest("[data-day01-activity='free-lab']");
      const steps = getCheckedValues(activityElement, "[data-free-step]");

      updateDay01State((state) => {
        state.freeResearchSteps = steps;
      });
      return;
    }

    if (event.target.closest("[data-used-feature]")) {
      const activityElement = event.target.closest("[data-day01-activity='free-lab']");
      const features = getCheckedValues(activityElement, "[data-used-feature]");

      updateDay01State((state) => {
        state.usedFeatures = features;
      });
      return;
    }

    if (event.target.closest("[data-self-check-item]")) {
      const checked = getCheckedValues(elements.standardDay, "[data-self-check-item]");

      updateDay01State((state) => {
        state.selfCheckItems = checked;
        state.ipoConceptChecked = checked.includes("block02:1");
      });
      return;
    }

    if (event.target.closest("[data-quiz-match-select]")) {
      const question = event.target.closest("[data-quiz-matching]");
      const quizId = question.dataset.quizMatching;
      const answers = {};
      let allSelected = true;
      let allCorrect = true;

      question.querySelectorAll("[data-quiz-match-select]").forEach((select) => {
        answers[select.dataset.pairId] = select.value;
        allSelected = allSelected && Boolean(select.value);
        allCorrect = allCorrect && select.value === select.dataset.answer;
      });

      updateDay01State((state) => {
        state.quizAnswers[quizId] = answers;
      });

      const feedback = question.querySelector(`[data-day01-feedback="quiz-${quizId}"]`);

      if (feedback && allSelected) {
        feedback.textContent = allCorrect
          ? "잘 연결했습니다. 입력 → 처리 → 출력의 흐름입니다."
          : "다시 확인해 보세요. 장치는 입력을 받고 처리한 뒤 출력합니다.";
        feedback.classList.toggle("inline-feedback--correct", allCorrect);
        feedback.hidden = false;
      }
    }
  }

  function handleStandardInput(event) {
    if (event.target.closest("[data-idea-input]")) {
      updateIdeaDisplays();
      syncSelectedIdeaToRecord();
    }

    if (event.target.closest("#reload-helper, #reload-difficulty")) {
      updateProjectReloadRecord();
    }
  }

  function handleStandardChange(event) {
    if (event.target.closest(".final-choice input[type='radio']")) {
      syncSelectedIdeaToRecord();
    }
  }

  function initializeDynamicLessonState() {
    updateIdeaDisplays();
    syncSelectedIdeaToRecord();
    updateProjectReloadRecord();
    syncDay01UiFromState();
  }

  async function renderPage() {
    if (!isStudentSelected()) {
      renderIdentityGate();
      return;
    }

    loadCurrentStudentRecords();
    setLabShellVisible(true);

    const currentDay = getCurrentDay();
    const requestStudentId = getStudentId();
    activeDay = currentDay;
    const serverRestore = await loadServerDayState(currentDay);

    if (!isStudentSelected() || getStudentId() !== requestStudentId) {
      return;
    }

    const dayStateRestore = loadDayState(currentDay, serverRestore.state);
    activeDayState = dayStateRestore.state;

    if (activeDayState) {
      updateDay01Progress(activeDayState);

      if (day01NeedsInitialSave) {
        saveDayState("");
        day01NeedsInitialSave = false;
      }
    }

    renderAppHeader(currentDay);
    renderCurrentDay(currentDay);
    renderProjectIntro(currentDay);
    renderPhaseNotice(currentDay);
    renderSpecialNotice(currentDay);
    renderResearchMap(currentDay);
    renderStandardDay(currentDay);
    initializeDynamicLessonState();

    if (dayStateRestore.retryServerSync && activeDayState) {
      queueDay01ServerSave(currentDay, activeDayState, { immediate: true });
    }

    if (dayStateRestore.status || serverRestore.status) {
      renderSaveState(dayStateRestore.status || serverRestore.status);
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderIdentityGate("연구원 정보를 불러오는 중입니다.");
    await loadRegisteredStudents();

    if (restoreStudentContext()) {
      await renderPage();
    } else {
      renderIdentityGate();
    }

    elements.identityGate.addEventListener("click", handleIdentityGateClick);
    elements.changeStudent.addEventListener("click", handleChangeStudent);
    elements.saveState.addEventListener("click", handleSaveStateClick);
    elements.researchDays.addEventListener("click", (event) => {
      if (!event.target.closest("[data-start-research]")) {
        return;
      }

      handleStartResearch();
    });
    elements.standardDay.addEventListener("click", handleChoiceClick);
    elements.standardDay.addEventListener("click", handleProjectReloadReveal);
    elements.standardDay.addEventListener("click", handleDay01Click);
    elements.standardDay.addEventListener("input", handleStandardInput);
    elements.standardDay.addEventListener("input", handleDay01Input);
    elements.standardDay.addEventListener("change", handleStandardChange);
    elements.standardDay.addEventListener("change", handleDay01Change);
    elements.standardDay.addEventListener("dragstart", handleResearchOrderDragStart);
    elements.standardDay.addEventListener("dragover", handleResearchOrderDragOver);
    elements.standardDay.addEventListener("drop", handleResearchOrderDrop);
    elements.standardDay.addEventListener("dragend", handleResearchOrderDragEnd);
    window.addEventListener("beforeunload", () => cleanupDay01Media({ invalidate: true }));
  });
})();
