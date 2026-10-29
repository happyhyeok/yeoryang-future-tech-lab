(function () {
  "use strict";
  const planFields = [
    ["person", "누구를 돕고 싶나요?"], ["problem", "내가 해결하려는 문제"],
    ["device", "내가 만들 장치"], ["input", "Day07 입력 기록"],
    ["condition", "작동 조건"], ["output", "Day07 출력 기록"],
    ["firstGoal", "무엇부터 만들까요?"], ["successTest", "성공 기준"],
  ];
  const inputs = ["확인 필요", "버튼 A/B (내장)", "밝기 센서 (내장)", "움직임 감지 (내장)", "온도 센서 (내장)", "외부 거리센서 (모델 확인 필요)", "외부 감지센서 (모델 확인 필요)"];
  const outputs = ["확인 필요", "마이크로비트 LED (내장)", "마이크로비트 소리 (내장 V2)", "빨강 LED 모듈 (엣지 1번)", "서보모터 (엣지 2번)", "네오픽셀 8개 링 (엣지 1번)", "외부 출력장치 (모델 확인 필요)"];
  const checks = [["checkParts", "준비물을 확인했어요"], ["checkWiring", "연결 안내와 실제 부품을 확인했어요"], ["practiceLed", "LED 켜기·끄기 확인"], ["practiceServo", "서보 30도·90도 확인"], ["practiceRing", "네오픽셀 무지개 색상 회전 확인"], ["inputDone", "입력 기능 작동"], ["outputDone", "출력 기능 작동"], ["prototypeDone", "입력에 따라 출력이 한 번 반응"]];
  const textFields = [...planFields.map(([key]) => key), "finding", "nextAction"];
  function normalize(state) {
    const source = state.day08 && typeof state.day08 === "object" ? state.day08 : {};
    const d = { ...source };
    textFields.forEach(key => { d[key] = typeof d[key] === "string" ? d[key] : ""; });
    checks.forEach(([key]) => { d[key] = d[key] === true; });
    d.inputType = inputs.includes(d.inputType) ? d.inputType : inputs[0];
    d.outputType = outputs.includes(d.outputType) ? d.outputType : outputs[0];
    state.day08 = d;
    return d;
  }
  function seed(state, record) {
    const d = normalize(state);
    if (d.sourceInitialized || !record) return false;
    let previous;
    try { previous = typeof record.dayStateJson === "string" ? JSON.parse(record.dayStateJson) : record.dayState; } catch { return false; }
    if (!previous || previous.studentId !== state.studentId || previous.workId !== state.workId || previous.dayId !== "day07") return false;
    const plan = previous.day07 || {};
    planFields.forEach(([key]) => { if (!d[key] && !d.editedFields?.[key] && typeof plan[key] === "string") d[key] = plan[key]; });
    d.sourceInitialized = true;
    d.sourceUpdatedAt = record.updatedAt || "";
    return true;
  }
  function quizComplete(state, lesson) {
    return lesson.quiz.questions.every(q => q.choices.some(c => c.correct && c.text === state.quizAnswers?.[q.id]));
  }
  function updateProgress(state, lesson) {
    const d = normalize(state);
    state.lessonProgress = { ...state.lessonProgress, quizCompleted: quizComplete(state, lesson), recordCompleted: Boolean(d.finding.trim() && d.nextAction.trim()) };
    // The instructor has deferred Day08 completion criteria and Day09 access.
    state.minimumCompleted = false;
    state.basicCompleted = false;
    state.dayCompleted = false;
    state.completionLevel = "in_progress";
  }
  function parts(d) {
    const items = ["마이크로비트", "USB 케이블"];
    const external = /미확정|확인 필요/.test(d.inputType + d.outputType);
    let connection = "확인 필요";
    if (!external) {
      if (d.outputType.includes("빨강")) { items.push("Sensor:Edge", "빨강 LED 모듈", "3핀 연결 케이블"); connection = "빨강 LED · 엣지 1번 (P1)"; }
      else if (d.outputType.includes("서보")) { items.push("Sensor:Edge", "SG90 서보모터"); connection = "서보모터 · 엣지 2번 (P2)"; }
      else if (d.outputType.includes("네오픽셀")) { items.push("Sensor:Edge", "RAINBOW-B V1.2 네오픽셀 링", "3핀 연결 케이블"); connection = "네오픽셀 · 엣지 1번 (P1)"; }
      else connection = "내장 입력·출력 · 외부 출력 결선 없음";
    }
    return { items, connection, external };
  }
  const field = (key, title, d, esc) => `<label class="record-field"><span>${esc(title)}</span><textarea data-day08-field="${key}">${esc(d[key] || "")}</textarea></label>`;
  const checkbox = (key, d, esc) => `<label class="day08-check"><input type="checkbox" data-day08-field="${key}"${d[key] ? " checked" : ""}> ${esc(checks.find(([k]) => k === key)[1])}</label>`;
  const select = (key, title, choices, d, esc) => `<label class="record-field"><span>${title}</span><select data-day08-field="${key}">${choices.map(v => `<option${d[key] === v ? " selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
  function render(state, lesson, esc, access) {
    const d = normalize(state);
    const image = (name, alt) => `<img src="assets/day08/${name}" alt="${alt}">`;
    const quiz = lesson.quiz.questions.map((q, index) => `<fieldset class="day08-quiz"><legend>${index + 1}. ${esc(q.prompt)}</legend>${q.choices.map(c => `<label class="radio-option"><input type="radio" name="${q.id}" data-day08-quiz="${q.id}" value="${esc(c.text)}"${state.quizAnswers?.[q.id] === c.text ? " checked" : ""}><span>${esc(c.text)}</span></label>`).join("")}<p data-day08-feedback="${q.id}" aria-live="polite"></p></fieldset>`).join("");
    return `<div class="day08"><section class="lesson-section"><h2>실제 시제품 만들기</h2><p>지난 연구를 이어서 완성하거나 수정할 수 있어요. 빈 곳은 그대로 두고 필요한 것만 고치세요.</p><p class="day08-notice">${esc(access)}</p></section>
      <section class="lesson-section" id="day08-plan"><h2>내 제작계획 수정하기</h2><p>Day07 서버 기록을 Day08 초안으로 복사합니다. 수정안은 Day08에 저장되며 Day07 원본은 바뀌지 않습니다.</p><p data-day08-source></p>${planFields.map(([key, title]) => field(key, title, d, esc)).join("")}</section>
      <section class="lesson-section"><h2>오늘 사용할 실제 부품 확인</h2><p>작품 설명과 선택한 출력이 다르면, 오늘 만들 기능을 먼저 선택하세요.</p>${select("inputType", "오늘 사용할 입력", inputs, d, esc)}${select("outputType", "오늘 사용할 출력", outputs, d, esc)}<div class="day08-parts" data-day08-parts aria-live="polite"></div>${checkbox("checkParts", d, esc)}${checkbox("checkWiring", d, esc)}<p>부품 종류가 미확정이면 연결도를 보여주지 않습니다.</p></section>
      <section class="lesson-section"><h2>공통 실습 3가지 · 연결과 코드</h2><p>빨강 LED와 네오픽셀은 모두 엣지 1번을 사용하므로, 전원을 분리하고 하나씩 교체합니다.</p><a class="primary-link" href="https://makecode.microbit.org/" target="_blank" rel="noopener noreferrer">MakeCode 열기</a><div class="day08-practices">
        <article><h3>실습 A · 빨강 LED · 엣지 1번 (P1)</h3>${image("01_led_edge1.png", "빨강 LED 엣지 1번 P1 결선 안내")}${image("04_led_code.png", "빨강 LED 실제 MakeCode 블록")}${checkbox("practiceLed", d, esc)}</article>
        <article><h3>실습 B · 서보모터 · 엣지 2번 (P2)</h3>${image("02_servo_edge2.png", "서보모터 엣지 2번 P2 결선 안내")}${image("05_servo_code.png", "서보모터 실제 MakeCode 블록")}${checkbox("practiceServo", d, esc)}</article>
        <article><h3>실습 C · 네오픽셀 · 엣지 1번 (P1)</h3>${image("03_ring_edge1.png", "네오픽셀 링 엣지 1번 P1 결선 안내")}<p class="day08-notice">Sensor:Edge 1번(P1)에 연결하고, 아래 실제 MakeCode 블록의 <strong>P1·LED 8개</strong> 설정을 확인하세요. 이 코드는 무지개 색상 회전 코드입니다.</p>${image("06_ring_code_user_original.png", "실제 MakeCode 블록: 네오픽셀 P1, LED 8개, 무지개 1~360, 회전 1, 대기 1000ms")}${checkbox("practiceRing", d, esc)}</article>
      </div></section>
      <section class="lesson-section"><h2>첫 번째 시제품 시험</h2><p>내가 선택한 입력과 출력이 연결되는지 확인하세요.</p>${["inputDone", "outputDone", "prototypeDone"].map(key => checkbox(key, d, esc)).join("")}${field("finding", "오늘 발견한 점", d, esc)}${field("nextAction", "다음 시간에 시험할 것", d, esc)}</section>
      <section class="lesson-section"><h2>오늘의 퀴즈</h2>${quiz}<p data-day08-quiz-status aria-live="polite"></p></section>
      <section class="lesson-section"><h2>오늘의 연구 저장</h2><button type="button" class="primary-link" data-day08-save>오늘의 기록 저장</button><p data-day08-save-status aria-live="polite"></p><p>활동·퀴즈·연구기록을 저장합니다. 최종 완료 판정은 선생님이 기준을 정한 뒤 적용합니다.</p></section></div>`;
  }
  function sync(root, state, lesson, sourceStatus, saveStatus) {
    const d = normalize(state);
    const source = root.querySelector("[data-day08-source]");
    if (source) source.textContent = d.sourceInitialized ? "Day07 서버 기록을 복사한 Day08 수정안입니다." : sourceStatus === "error" ? "Day07 서버 기록을 불러오지 못했어요. 다시 확인하거나 빈 초안부터 작성할 수 있어요." : sourceStatus === "missing" ? "Day07 서버 기록이 없어요. Day08에서 초안을 작성할 수 있어요." : "Day07 서버 기록을 확인하고 있어요.";
    const panel = root.querySelector("[data-day08-parts]");
    if (panel) { const p = parts(d); panel.replaceChildren(); const title = document.createElement("strong"); title.textContent = "확인한 준비물"; panel.append(title); const list = document.createElement("ul"); p.items.forEach(v => { const li = document.createElement("li"); li.textContent = v; list.append(li); }); panel.append(list); const note = document.createElement("p"); note.textContent = `연결 안내: ${p.connection}${p.external ? " · 실제 센서·모듈과 전원·단자 규격을 선생님과 확인하세요." : " · 전원·단자 규격을 실물에서 확인하세요."}`; panel.append(note); }
    lesson.quiz.questions.forEach(q => { const feedback = root.querySelector(`[data-day08-feedback="${q.id}"]`); const answer = state.quizAnswers?.[q.id]; if (feedback) feedback.textContent = !answer ? "" : q.choices.some(c => c.correct && c.text === answer) ? "맞아요." : "다시 생각하고 고쳐 보세요."; });
    const quizStatus = root.querySelector("[data-day08-quiz-status]");
    if (quizStatus) quizStatus.textContent = quizComplete(state, lesson) ? "네 문제를 모두 맞혔어요." : "네 문제를 확인해 보세요.";
    const status = root.querySelector("[data-day08-save-status]");
    if (status) status.textContent = saveStatus || (state.serverSyncPending ? "이 기기에 임시 저장 · 서버 저장 확인 중" : state.serverUpdatedAt ? "서버에서 저장 기록을 확인했어요." : "오늘의 기록을 저장해 주세요.");
  }
  function input(event, state, update) {
    const key = event.target.dataset.day08Field;
    const quiz = event.target.dataset.day08Quiz;
    if (!key && !quiz) return false;
    const target = event.target;
    if (key && ![...textFields, ...checks.map(([k]) => k), "inputType", "outputType"].includes(key)) return false;
    update(current => {
      const d = normalize(current);
      if (key) { d[key] = target.type === "checkbox" ? target.checked : target.value; d.editedFields = { ...d.editedFields, [key]: true }; if (["inputType", "outputType"].includes(key)) { d.checkParts = false; d.checkWiring = false; } }
      if (quiz) { current.quizAnswers = { ...current.quizAnswers, [quiz]: target.value }; }
    });
    return true;
  }
  function recordPayload(student, day, state, date, blockProgress, clone) {
    const d = normalize(state);
    return { studentId: student.studentId, workId: student.workId, dayId: day.dayId, date, blockProgress, role: "", activities: ["실제 시제품 만들기"], todayDecision: d.device, discovery: d.finding, difficulty: "", changeMade: d.condition, changeReason: "", nextAction: d.nextAction, targetUser: d.person, problemDefinition: d.problem, minimumCompleted: false, completionLevel: "", status: "in_progress", studentReflection: d.finding, dayState: clone(state, {}) };
  }
  window.Day08 = { normalize, seed, render, sync, input, updateProgress, quizComplete, recordPayload, parts };
})();
