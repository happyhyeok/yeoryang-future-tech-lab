(function () {
  "use strict";
  const planFields = [
    ["person", "누구를 돕고 싶나요?"], ["problem", "내가 해결하려는 문제"],
    ["device", "내가 만들 장치"], ["input", "입력"],
    ["condition", "작동 조건"], ["output", "출력"],
    ["firstGoal", "무엇부터 만들까요?"], ["successTest", "성공 기준"],
  ];
  const inputs = ["확인 필요", "버튼 A/B (내장)", "밝기 센서 (내장)", "움직임 감지 (내장)", "온도 센서 (내장)", "외부 거리센서 (모델 확인 필요)", "외부 감지센서 (모델 확인 필요)"];
  const outputs = ["확인 필요", "마이크로비트 LED (내장)", "마이크로비트 소리 (내장 V2)", "빨강 LED 모듈 (엣지 1번)", "서보모터 (엣지 2번)", "네오픽셀 8개 링 (엣지 1번)", "외부 출력장치 (모델 확인 필요)"];
  const checks = [["checkParts", "준비물을 확인했어요"], ["checkWiring", "연결 안내와 실제 부품을 확인했어요"], ["practiceLed", "LED 켜기·끄기 확인"], ["practiceServo", "서보 30도·90도 확인"], ["practiceRing", "네오픽셀 무지개 색상 회전 확인"], ["inputDone", "입력 기능 작동"], ["outputDone", "출력 기능 작동"], ["prototypeDone", "입력에 따라 출력이 한 번 반응"]];
  const textFields = [...planFields.map(([key]) => key), "finding", "nextAction"];
  const choices = {
    firstGoal: ["입력 기능부터 만들기", "출력 기능부터 만들기", "입력과 출력 연결하기", "작품의 틀부터 만들기"],
    finding: ["입력에 따라 출력이 달라졌어요", "일부만 작동했어요", "아직 작동하지 않았어요", "아직 시험하지 못했어요"],
    nextAction: ["입력 다시 확인", "출력·연결 다시 확인", "코드 고치기", "조건 바꾸기", "선생님과 상의하기"],
  };
  const previousChoices = {
    finding: ["연결을 바꾸니 작동했어요", "코드를 바꾸니 작동했어요", "아직 예상대로 작동하지 않았어요"],
    nextAction: ["입력이 잘 감지되는지 시험하기", "출력이 잘 작동하는지 시험하기", "작동 조건을 바꾸어 시험하기", "입력과 출력을 연결해 시험하기"],
  };
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
  function seed(state, record, preserveSaved = Boolean(state.serverUpdatedAt)) {
    const d = normalize(state);
    if (d.sourceInitialized || preserveSaved || !record) return false;
    let previous;
    try { previous = typeof record.dayStateJson === "string" ? JSON.parse(record.dayStateJson) : record.dayStateJson || record.dayState; } catch { return false; }
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
  const select = (key, title, choices, d, esc) => `<label class="record-field"><span>${esc(title)}</span><select data-day08-field="${key}">${choices.map(v => `<option value="${esc(v)}"${d[key] === v ? " selected" : ""}>${esc(v || "선택하세요")}</option>`).join("")}</select></label>`;
  const goalSelect = (d, esc) => select("firstGoal", "무엇부터 만들까요?", ["", ...choices.firstGoal, ...(!d.firstGoal || choices.firstGoal.includes(d.firstGoal) ? [] : [d.firstGoal])], d, esc);
  function choiceField(key, title, d, esc) {
    const value = d[key] || "";
    const options = [...choices[key], ...(previousChoices[key].includes(value) ? [value] : [])];
    const custom = Boolean(value && !options.includes(value));
    return `<div class="day08-choice"><label class="record-field"><span>${title}</span><select data-day08-choice="${key}"><option value="">선택하세요</option>${[...options, "기타"].map(v => `<option value="${esc(v)}"${(custom ? v === "기타" : value === v) ? " selected" : ""}>${esc(v)}</option>`).join("")}</select></label><label class="record-field" data-day08-other="${key}"${custom ? "" : " hidden"}><span>${title} · 기타</span><textarea data-day08-field="${key}">${esc(custom ? value : "")}</textarea></label></div>`;
  }
  function render(state, lesson, esc) {
    const d = normalize(state);
    const image = (name, alt) => `<img src="assets/day08/${name}" alt="${alt}">`;
    const quiz = lesson.quiz.questions.map((q, index) => `<fieldset class="day08-quiz"><legend>${index + 1}. ${esc(q.prompt)}</legend>${q.choices.map(c => `<label class="radio-option"><input type="radio" name="${q.id}" data-day08-quiz="${q.id}" value="${esc(c.text)}"${state.quizAnswers?.[q.id] === c.text ? " checked" : ""}><span>${esc(c.text)}</span></label>`).join("")}<p data-day08-feedback="${q.id}" aria-live="polite"></p></fieldset>`).join("");
    const practice = (title, materials, wiring, wiringAlt, code, codeAlt, check, note = "") => `<article><h3>${title}</h3><div><h4>준비물</h4><p>${materials}</p></div><figure><figcaption>결선 이미지</figcaption>${image(wiring, wiringAlt)}</figure><figure><figcaption>MakeCode 이미지</figcaption>${image(code, codeAlt)}${note ? `<p>${note}</p>` : ""}</figure><div><h4>체크 항목</h4>${checkbox(check, d, esc)}</div></article>`;
    return `<div class="day08"><section class="lesson-section"><h2>실제 시제품 만들기</h2><p>내 계획을 살펴보고 첫 번째 작동 모습을 만들어 보세요.</p></section>
      <section class="lesson-section" id="day08-plan"><h2>내 제작계획 수정하기</h2><p>지난 계획을 살펴보고, 오늘 만들 내용에 맞게 고쳐 보세요.</p><p data-day08-source aria-live="polite"></p>${planFields.filter(([key]) => key !== "firstGoal").map(([key, title]) => field(key, title, d, esc)).join("")}${goalSelect(d, esc)}</section>
      <section class="lesson-section"><h2>오늘 사용할 실제 부품 확인</h2><p>작품 설명과 선택한 출력이 다르면, 오늘 만들 기능을 먼저 선택하세요.</p>${select("inputType", "오늘 사용할 입력", inputs, d, esc)}${select("outputType", "오늘 사용할 출력", outputs, d, esc)}<div class="day08-parts" data-day08-parts aria-live="polite"></div>${checkbox("checkParts", d, esc)}${checkbox("checkWiring", d, esc)}<p>부품이 헷갈리면 선생님과 함께 확인하세요.</p></section>
      <section class="lesson-section"><h2>공통 실습 3가지 · 연결과 코드</h2><p>빨강 LED와 네오픽셀은 모두 엣지 1번을 사용하므로, 전원을 분리하고 하나씩 교체합니다.</p><a class="primary-link" href="https://makecode.microbit.org/" target="_blank" rel="noopener noreferrer">MakeCode 열기</a><div class="day08-practices">
        ${practice("실습 A · 빨강 LED · 엣지 1번 (P1)", "마이크로비트, USB 케이블, Sensor:Edge, 빨강 LED 모듈, 3핀 연결 케이블", "01_led_edge1.png", "빨강 LED 엣지 1번 P1 결선 안내", "04_led_code.png", "빨강 LED 실제 MakeCode 블록", "practiceLed")}
        ${practice("실습 B · 서보모터 · 엣지 2번 (P2)", "마이크로비트, USB 케이블, Sensor:Edge, SG90 서보모터", "02_servo_edge2.png", "서보모터 엣지 2번 P2 결선 안내", "05_servo_code.png", "서보모터 실제 MakeCode 블록", "practiceServo")}
        ${practice("실습 C · 네오픽셀 · 엣지 1번 (P1)", "마이크로비트, USB 케이블, Sensor:Edge, RAINBOW-B V1.2 네오픽셀 링, 3핀 연결 케이블", "03_ring_edge1.png", "네오픽셀 링 엣지 1번 P1 결선 안내", "06_ring_code_user_original.png", "실제 MakeCode 블록: 네오픽셀 P1, LED 8개, 무지개 1~360, 회전 1, 대기 1000ms", "practiceRing", "P1·LED 8개 설정을 확인하고 무지개 색상을 회전시켜 보세요.")}
      </div></section>
      <section class="lesson-section"><h2>첫 번째 시제품 시험과 기록</h2><p>연습한 방법을 떠올리며 내 장치의 입력과 출력을 연결해 보세요.</p>${["inputDone", "outputDone", "prototypeDone"].map(key => checkbox(key, d, esc)).join("")}${choiceField("finding", "오늘 발견한 점", d, esc)}${choiceField("nextAction", "다음 시간에 시험할 것", d, esc)}</section>
      <section class="lesson-section"><h2>오늘의 퀴즈</h2>${quiz}<p data-day08-quiz-status aria-live="polite"></p></section>
      <section class="lesson-section"><h2>오늘의 연구 저장</h2><button type="button" class="primary-link" data-day08-save>오늘의 기록 저장</button><p data-day08-save-status aria-live="polite"></p></section></div>`;
  }
  function sync(root, state, lesson, sourceStatus, saveStatus) {
    const d = normalize(state);
    const goal = root.querySelector('select[data-day08-field="firstGoal"]');
    if (goal && goal !== document.activeElement) {
      if (d.firstGoal && !Array.from(goal.options).some(option => option.value === d.firstGoal)) goal.add(new Option(d.firstGoal, d.firstGoal));
      goal.value = d.firstGoal;
    }
    const source = root.querySelector("[data-day08-source]");
    if (source) source.textContent = state.serverUpdatedAt ? "저장한 제작계획을 불러왔어요." : d.sourceInitialized ? "지난 계획을 불러왔어요. 필요한 내용을 고쳐 보세요." : sourceStatus === "error" ? "지난 계획을 불러오지 못했어요. 잠시 뒤 다시 열거나 직접 적어 보세요." : sourceStatus === "missing" ? "아직 지난 계획이 없어요. 오늘 만들 계획을 적어 보세요." : "제작계획을 불러오고 있어요.";
    const panel = root.querySelector("[data-day08-parts]");
    if (panel) { const p = parts(d); panel.replaceChildren(); const title = document.createElement("strong"); title.textContent = "확인한 준비물"; panel.append(title); const list = document.createElement("ul"); p.items.forEach(v => { const li = document.createElement("li"); li.textContent = v; list.append(li); }); panel.append(list); const note = document.createElement("p"); note.textContent = `연결 안내: ${p.connection}${p.external ? " · 실제 센서·모듈과 전원·단자 규격을 선생님과 확인하세요." : " · 전원·단자 규격을 실물에서 확인하세요."}`; panel.append(note); }
    lesson.quiz.questions.forEach(q => { const feedback = root.querySelector(`[data-day08-feedback="${q.id}"]`); const answer = state.quizAnswers?.[q.id]; if (feedback) feedback.textContent = !answer ? "" : q.choices.some(c => c.correct && c.text === answer) ? "맞아요." : "다시 생각하고 고쳐 보세요."; });
    const quizStatus = root.querySelector("[data-day08-quiz-status]");
    if (quizStatus) quizStatus.textContent = quizComplete(state, lesson) ? "네 문제를 모두 맞혔어요." : "네 문제를 확인해 보세요.";
    const status = root.querySelector("[data-day08-save-status]");
    if (status) status.textContent = saveStatus === "서버에서 저장 기록을 확인했어요." ? "오늘의 기록을 저장했어요." : saveStatus || (state.serverSyncPending ? "이 기기에 임시 저장했어요. 저장을 확인하고 있어요." : state.serverUpdatedAt ? "오늘의 기록을 저장했어요." : "오늘의 기록을 저장해 주세요.");
  }
  function input(event, state, update) {
    const choice = event.target.dataset.day08Choice;
    const key = event.target.dataset.day08Field || choice;
    const quiz = event.target.dataset.day08Quiz;
    if (!key && !quiz) return false;
    const target = event.target;
    if (key && ![...textFields, ...checks.map(([k]) => k), "inputType", "outputType"].includes(key)) return false;
    update(current => {
      const d = normalize(current);
      if (key) { d[key] = choice && target.value === "기타" ? "" : target.type === "checkbox" ? target.checked : target.value; d.editedFields = { ...d.editedFields, [key]: true }; if (["inputType", "outputType"].includes(key)) { d.checkParts = false; d.checkWiring = false; } }
      if (quiz) { current.quizAnswers = { ...current.quizAnswers, [quiz]: target.value }; }
    });
    if (choice) {
      const other = target.closest(".day08-choice").querySelector("[data-day08-other]");
      other.hidden = target.value !== "기타";
      const textarea = other.querySelector("textarea");
      textarea.value = "";
      if (!other.hidden && event.type === "change") textarea.focus();
    }
    return true;
  }
  function recordPayload(student, day, state, date, blockProgress, clone) {
    const d = normalize(state);
    return { studentId: student.studentId, workId: student.workId, dayId: day.dayId, date, blockProgress, role: "", activities: ["실제 시제품 만들기"], todayDecision: d.device, discovery: d.finding, difficulty: "", changeMade: d.condition, changeReason: "", nextAction: d.nextAction, targetUser: d.person, problemDefinition: d.problem, minimumCompleted: false, completionLevel: "", status: "in_progress", studentReflection: d.finding, dayState: clone(state, {}) };
  }
  window.Day08 = { normalize, seed, render, sync, input, updateProgress, quizComplete, recordPayload, parts };
})();
