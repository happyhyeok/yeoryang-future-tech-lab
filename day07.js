(() => {
  "use strict";
  const sensors = [
    { key: "soil", title: "① 화분의 흙이 말랐어요", problem: "식물을 돌보는 사람이 물 줄 때를 놓칠 수 있어요.", name: "토양 습도 센서 — 흙의 상태를 알아차려요.", first: "흙이 건조하면 LED로 알려 주기", instruction: "흙의 상태를 ‘촉촉함’에서 ‘건조함’으로 바꿔 보세요.", question: "LED의 반응이 어떻게 달라지나요?", input: "흙의 상태", condition: "흙이 건조할 때", output: "LED 불빛 켜기", min: 0, max: 100, start: 75, unit: "%", alert: value => value < 40, state: value => value < 40 ? "건조함" : "촉촉함", person: "식물을 돌보는 사람", device: "흙이 마르면 알려 주는 장치", test: "흙 상태를 건조함으로 바꾸었을 때 LED가 켜지면 성공입니다." },
    { key: "distance", title: "② 물체가 너무 가까워졌어요", problem: "좁은 공간에서 물체가 가까워지는 것을 미리 알면 도움이 될 수 있어요.", name: "초음파센서 — 물체까지의 거리를 알아차려요.", first: "물체가 가까워지면 LED 경고 표시하기", instruction: "물체를 센서 가까이 움직여 보세요.", question: "어느 순간 경고 표시가 나타나나요?", input: "물체와의 거리", condition: "물체가 가까워졌을 때", output: "마이크로비트 LED에 그림 보여 주기", min: 0, max: 100, start: 75, unit: "cm", alert: value => value < 20, state: value => `${value}cm`, person: "좁은 공간을 이용하는 사람", device: "가까운 물체를 알려 주는 장치", test: "물체를 가까이 움직였을 때 LED 경고가 나타나면 성공입니다." },
    { key: "light", title: "③ 주변이 어두워졌어요", problem: "책상이나 복도 주변이 어두워지면 물건이나 길이 잘 보이지 않을 수 있어요.", name: "광센서 — 주변의 밝기를 알아차려요.", first: "어두워지면 LED 켜기", instruction: "밝기를 낮춰 보세요.", question: "어느 정도 어두워졌을 때 LED가 켜지면 좋을까요?", input: "주변의 밝기", condition: "주변이 어두워졌을 때", output: "LED 불빛 켜기", min: 0, max: 100, start: 75, unit: "%", alert: value => value < 35, state: value => `${value}%`, person: "어두운 곳을 이용하는 사람", device: "어두워지면 불을 켜는 장치", test: "광센서를 손으로 가렸을 때 LED가 켜지면 성공입니다." },
    { key: "temp", title: "④ 온도가 너무 높거나 낮아요", problem: "교실이나 물건을 보관하는 곳의 온도가 달라진 것을 늦게 알아차릴 수 있어요.", name: "TMP36 온도 센서 — 온도를 측정하는 데 사용하는 센서예요.", first: "온도가 정한 기준을 벗어나면 LED로 알려 주기", instruction: "온도를 높이거나 낮춰 보세요.", question: "어느 때 알림이 필요한지 생각해 보세요.", input: "온도", condition: "온도가 정한 기준을 벗어났을 때", output: "LED 불빛 켜기", min: 0, max: 50, start: 24, unit: "°C", alert: value => value < 15 || value > 30, state: value => `${value}°C`, person: "교실을 이용하는 사람", device: "온도 변화를 알려 주는 장치", test: "온도를 기준 밖으로 바꾸었을 때 LED가 켜지면 성공입니다." },
    { key: "pir", title: "⑤ 사람이 움직이고 있어요", problem: "출입구나 특정 장소에서 사람이 움직일 때 안내가 필요할 수 있어요.", name: "PIR 센서 — 사람이나 동물의 움직임에 따른 적외선 변화를 감지하는 센서예요.", first: "움직임이 감지되면 LED로 환영 표시하기", instruction: "사람을 움직여 보세요.", question: "움직일 때와 멈추었을 때 표시가 어떻게 다른가요?", input: "움직임", condition: "움직임이 감지되었을 때", output: "마이크로비트 LED에 그림 보여 주기", min: 0, max: 1, start: 0, unit: "", alert: value => value === 1, state: value => value ? "움직임" : "정지", person: "출입구를 이용하는 사람", device: "움직임에 반응하는 안내 장치", test: "사람이 움직이는 모습을 시험했을 때 LED가 켜지면 성공입니다." },
  ];
  const sensorImages = {
    soil: { src: "assets/day07/soil_sensor.png", alt: "토양 습도 센서 실물 사진" },
    distance: { src: "assets/day07/ultrasonic_sensor.png", alt: "초음파 거리 센서 실물 사진" },
    light: { src: "assets/day07/light_sensor.png", alt: "아날로그 조도 센서 실물 사진" },
    temp: { src: "assets/day07/tmp36_sensor.png", alt: "TMP36 온도 센서 실물 사진" },
    pir: { src: "assets/day07/pir_sensor.png", alt: "PIR 움직임 센서 실물 사진" },
  };
  const choices = {
    direction: ["지난 시간의 아이디어를 그대로 발전시키기", "지난 시간의 아이디어를 조금 바꾸기", "오늘 살펴본 다섯 문제 중 하나를 선택하기"],
    readiness: ["지금 가진 도구로 만들어 볼 수 있을 것 같아요.", "조금 바꾸면 만들 수 있을 것 같아요.", "어떻게 만들지 아직 모르겠어요."],
    reason: ["직접 만들어 시험해 볼 수 있을 것 같아서", "내가 중요하다고 생각하는 문제라서", "사람들에게 도움이 될 것 같아서", "다른 이유가 있어서"],
    input: ["흙의 상태", "물체와의 거리", "주변의 밝기", "온도", "움직임", "버튼 누르기", "다른 입력"],
    output: ["마이크로비트 LED에 그림 보여 주기", "LED 불빛 켜기", "소리 내기", "작은 모터 움직이기", "다른 반응"],
    part: ["센서를 고정하는 받침대", "마이크로비트를 세워 두는 거치대", "LED나 센서를 담는 간단한 케이스", "내 작품에 필요한 다른 부품", "아직 잘 모르겠어요"],
    peerDecision: ["내 계획을 조금 고칠래요.", "지금 계획을 그대로 유지할래요."],
  };
  const value = (state, key) => String((state.day07 || {})[key] || "");
  const select = (key, label, state, esc, options) => `<label class="record-field"><span>${label}</span><select data-day07-field="${key}"><option value="">선택해 주세요</option>${options.map(option => `<option value="${esc(option)}"${value(state, key) === option ? " selected" : ""}>${esc(option)}</option>`).join("")}</select></label>`;
  const input = (key, label, state, esc, multiline = false) => `<label class="record-field"><span>${label}</span>${multiline ? `<textarea data-day07-field="${key}" maxlength="500" rows="3">${esc(value(state, key))}</textarea>` : `<input data-day07-field="${key}" maxlength="300" value="${esc(value(state, key))}">`}</label>`;
  const section = (n, title, body) => `<section class="lesson-section day07-section" id="day07-step-${n}"><details${n === 1 ? " open" : ""}><summary class="section-title">${title}</summary><div class="day07-section-body">${body}</div></details></section>`;
  function previous(record, status, day05) {
    if (!record) return { problem: day05?.problemDefinition || day05?.todayDecision || (status === "loading" ? "지난 연구 기록을 불러오는 중입니다." : "Day06 기록을 확인할 수 없습니다. 지난 연구의 저장 상태를 확인해 주세요."), idea: "기록을 확인할 수 없습니다.", reason: "기록을 확인할 수 없습니다." };
    let prior = {};
    try { prior = typeof record.dayStateJson === "string" ? JSON.parse(record.dayStateJson) : record.dayState || {}; } catch (_) { /* the record fields still remain readable */ }
    return { problem: record.problemDefinition || prior.problemDefinition || prior.day06ProblemSnapshot || day05?.problemDefinition || day05?.todayDecision || "지난 연구의 문제 기록을 확인할 수 없습니다.", idea: prior.day06SelectedIdeaText || record.todayDecision || "Day06 선택안 기록이 없습니다.", reason: prior.day06SelectionReason || record.changeReason || "Day06 선택 이유 기록이 없습니다." };
  }
  function sensorCard(sensor, esc) {
    const control = sensor.key === "pir" ? `<button type="button" class="secondary-button" data-day07-pir aria-pressed="false">사람 움직이기</button>` : `<input type="range" data-day07-sensor="${sensor.key}" min="${sensor.min}" max="${sensor.max}" value="${sensor.start}" aria-label="${sensor.name.split(" — ")[0]} 가상 값">`;
    const image = sensorImages[sensor.key];
    return `<article class="day07-sensor" data-day07-card="${sensor.key}"><h3>${sensor.title}</h3><div class="day07-sensor-identification"><img class="day07-sensor-image" src="${esc(image.src)}" alt="${esc(image.alt)}" loading="lazy"><p><strong>사용할 센서</strong> ${sensor.name}</p></div><p><strong>어떤 문제일까요?</strong> ${sensor.problem}</p><p><strong>만들 수 있는 첫 기능</strong> ${sensor.first}</p><details><summary>센서 체험하기</summary><p>${sensor.instruction}</p><p>${sensor.question}</p><p class="field-help">가상 체험입니다. 표시된 값과 기준은 실제 측정값이 아닙니다.${sensor.key === "pir" ? " 실제 PIR 센서의 반응 지연과 유지 시간은 이 모형에 반영되지 않습니다." : ""}</p>${control}<p class="day07-sensor-readout" aria-live="polite"></p><div class="day07-led" aria-label="LED 모형"></div></details></article>`;
  }
  function quizComplete(state, lesson) {
    return lesson.quiz.questions.every(q => q.choices.some(c => c.correct && state.quizAnswers?.[q.id] === c.text));
  }
  function updateProgress(state, lesson) {
    const d = state.day07 || {};
    const filled = field => Boolean(String(d[field] || "").trim());
    const directionValid = choices.direction.includes(d.direction);
    const recommendationValid = d.direction !== choices.direction[2] || sensors.some(sensor => sensor.title === d.recommended);
    const minimum = directionValid && recommendationValid && ["problem", "person", "device", "reason", "input", "condition", "output", "firstGoal", "successTest"].every(filled) && choices.reason.includes(d.reason) && choices.input.includes(d.input) && choices.output.includes(d.output);
    const completed = minimum && quizComplete(state, lesson);
    const extended = completed && Boolean(d.part && d.peerQuestion && d.peerDecision && d.peerReason);
    state.minimumCompleted = minimum;
    state.day07BasicReady = extended;
    state.basicCompleted = completed;
    state.dayCompleted = completed;
    state.completionLevel = completed ? "basic" : minimum ? "minimum" : "in_progress";
  }
  function render(state, day06, status, esc, lesson, day05) {
    const p = previous(day06, status, day05);
    const d = state.day07 || {};
    const selected = sensors.find(s => s.title === d.recommended);
    const quiz = lesson.quiz.questions.map((q, i) => `<fieldset class="day07-quiz"><legend><strong>문제 ${i + 1}. ${q.prompt}</strong></legend>${q.choices.map(c => `<label class="radio-option"><input type="radio" name="${q.id}" data-day07-quiz="${q.id}" value="${esc(c.text)}"${state.quizAnswers?.[q.id] === c.text ? " checked" : ""}><span>${esc(c.text)}</span></label>`).join("")}<p class="inline-feedback" data-day07-quiz-feedback="${q.id}" aria-live="polite"></p></fieldset>`).join("");
    return `<div class="day07"><section class="lesson-section"><p class="section-kicker">오늘의 연구</p><h2>내 아이디어를 진짜 발명품으로 바꾸기</h2><p>지난 시간에는 생활 속 불편을 해결할 여러 방법을 생각하고, 가장 마음에 드는 아이디어를 골랐습니다.</p><p>오늘은 그 아이디어를 <strong>실제로 만들 수 있는 발명품</strong>으로 바꿔 봅니다.</p><p>처음 생각한 방법을 그대로 사용해도 되고, 조금 바꾸거나 새로운 문제를 선택해도 됩니다.</p><p>중요한 것은 <strong>내가 직접 만들고 시험할 수 있는 첫 기능</strong>을 정하는 것입니다.</p><h3>오늘의 질문</h3><p>내 발명품이 실제로 작동하려면 무엇이 필요할까요?</p></section>
    ${section(1, "1. 지난 연구 다시 보기", `<h3>내가 해결하고 싶었던 문제</h3><p>${esc(p.problem)}</p><h3>내가 선택한 아이디어</h3><p>${esc(p.idea)}</p><h3>이 방법을 선택한 이유</h3><p>${esc(p.reason)}</p><p>이 아이디어를 실제로 만들려면 어떤 도구가 필요할까요?</p>${select("readiness", "생각해 보기", state, esc, choices.readiness)}<p>아직 잘 몰라도 괜찮아요.</p><p>센서가 어떤 일을 하는지 먼저 살펴봅시다.</p>`)}
    ${section(2, "2. 센서로 해결할 수 있는 문제 찾아보기", `<p>센서는 주변의 변화를 알아차리는 도구입니다.</p><p>마이크로비트는 센서가 보낸 정보를 확인하고 LED나 다른 장치로 반응할 수 있어요.</p><p>다음 다섯 가지 문제를 살펴보세요.</p><p>마음에 드는 문제를 골라 <strong>센서 체험하기</strong>를 눌러 보세요.</p><div class="day07-sensors">${sensors.map(s => sensorCard(s, esc)).join("")}</div>`)}
    ${section(3, "3. 내 작품 방향 결정하기", `<p>이제 내가 만들 작품의 방향을 정해 봅시다.</p>${select("direction", "어떤 방법으로 시작할까요?", state, esc, choices.direction)}<p>지난 아이디어를 유지하거나 바꾸려면 선생님과 함께 어떤 기능부터 만들 수 있는지 확인하세요.</p><p>추천 문제를 선택했다면, 그 문제를 해결하는 방법을 나만의 작품으로 바꿔 봅시다.</p><div data-day07-recommend${d.direction === choices.direction[2] ? "" : " hidden"}>${select("recommended", "오늘 살펴본 문제", state, esc, sensors.map(s => s.title))}</div>${input("person", "누구를 돕고 싶나요?", state, esc)}${input("problem", "어떤 불편을 해결하고 싶나요?", state, esc, true)}${input("device", "어떤 장치를 만들고 싶나요?", state, esc)}${select("reason", "이 방향을 선택한 이유는 무엇인가요?", state, esc, choices.reason)}${input("reasonDetail", "다른 이유 또는 덧붙일 생각", state, esc)}<p><strong>마지막 결정은 내가 합니다.</strong></p>`)}
    ${section(4, "4. 첫 번째 기능 계획하기", `<p>처음부터 모든 기능을 만들 필요는 없습니다.</p><p><strong>가장 중요한 기능 하나부터</strong> 만들어 봅시다.</p>${select("input", "① 입력 — 무엇을 알아차릴까요?", state, esc, choices.input)}${input("condition", "② 판단 — 언제 반응할까요?", state, esc)}<p>지금 정확한 숫자를 몰라도 괜찮습니다. 다음 시간에 센서를 연결해서 시험하며 정할 수 있어요.</p>${select("output", "③ 출력 — 어떻게 반응할까요?", state, esc, choices.output)}<h3>내 발명품의 작동계획</h3><p data-day07-sentence></p><p>내가 생각한 방법과 맞는지 읽어 보고 필요한 부분을 고쳐 보세요.</p>`)}
    ${section(5, "5. 내 발명품을 그림으로 보여 주기", `<p>이제 내 작품이 어떻게 작동할지 종이에 그려 봅시다.</p><p>예쁘게 그리는 것보다 <strong>다른 사람이 이해할 수 있게 표현하는 것</strong>이 중요합니다.</p><p>그림에 다음 세 가지를 나타내 보세요.</p><ul><li>센서가 있는 위치</li><li>마이크로비트나 출력 장치의 위치</li><li>사람이 사용하는 방법</li></ul>${select("part", "3D 프린터로 만들고 싶은 부품", state, esc, choices.part)}<p>부품의 정확한 크기는 나중에 측정해도 됩니다.</p><h3>친구와 함께 살펴보기</h3><p>친구에게 내 그림을 보여 주고 설명해 보세요.</p><p>“이 장치는 ○○할 때 ○○하게 작동해.”</p>${input("peerQuestion", "친구가 궁금해한 점은 무엇인가요?", state, esc)}${select("peerDecision", "친구의 의견을 듣고 어떻게 결정했나요?", state, esc, choices.peerDecision)}${input("peerReason", "짧은 이유", state, esc)}`)}
    ${section(6, "6. 다음 시간의 첫 제작 목표", `<p>다음 시간에는 내가 정한 기능을 실제 마이크로비트로 만들어 봅니다.</p>${input("firstGoal", "무엇부터 만들까요?", state, esc)}${input("successTest", "어떻게 성공했는지 확인할까요?", state, esc)}${selected ? `<p class="field-help">예: ${esc(selected.test)}</p>` : `<p class="field-help">예: 광센서를 손으로 가렸을 때 LED가 켜지면 성공입니다.</p>`}<h3>오늘의 연구 확인</h3><ul><li>내가 해결하고 싶은 문제를 정했어요.</li><li>사용할 입력·판단·출력을 정했어요.</li><li>첫 기능과 시험 방법을 정했어요.</li><li>내 제작계획을 선생님과 확인했어요.</li></ul><p class="field-help">선생님 확인은 직접 받아야 합니다. 이 화면의 저장과 퀴즈 완료는 강사 승인을 뜻하지 않습니다.</p><p data-day07-progress aria-live="polite"></p><h3>오늘의 퀴즈</h3>${quiz}<p data-day07-quiz-status aria-live="polite"></p><h3>다음 연구</h3><p><strong>Day08. 첫 시제품 만들기</strong></p><p>오늘 세운 계획을 바탕으로 센서와 마이크로비트를 연결해 봅시다.</p><div data-day07-next-access aria-live="polite"></div>`)}
    </div>`;
  }
  function sync(root, state, lesson, serverConfirmed = false) {
    const d = state.day07 || {};
    const sentence = root.querySelector("[data-day07-sentence]");
    if (sentence) sentence.textContent = `나는 ${d.person || "[도움을 줄 사람]"}을 위해 ${d.input || "[입력]"}을 사용하고, ${d.condition || "[작동 조건]"}일 때 ${d.output || "[출력]"}이 작동하도록 만들겠습니다.`;
    const progress = root.querySelector("[data-day07-progress]");
    if (progress) progress.textContent = !state.dayCompleted ? "아직 작성하지 않은 제작계획과 퀴즈를 확인해 보세요." : serverConfirmed ? "오늘의 연구를 완료했어요. 다음 시간에 만들기 전에 선생님과 제작계획을 확인하세요." : "제작계획을 작성했어요. 저장이 끝나면 다음 연구로 이동할 수 있어요.";
    const next = root.querySelector("[data-day07-next-access]");
    if (next) {
      next.replaceChildren();
      if (serverConfirmed) {
        const link = document.createElement("a");
        link.href = new URLSearchParams(window.location.search).get("test") === "1" ? "?day=8&test=1" : "?day=8";
        link.className = "primary-link";
        link.textContent = "다음 연구 준비 상태 확인하기 →";
        next.appendChild(link);
      } else {
        next.textContent = "Day08은 오늘의 계획과 퀴즈를 마치고 최신 기록이 서버에 저장된 뒤 열립니다.";
      }
    }
    lesson.quiz.questions.forEach(q => {
      const feedback = root.querySelector(`[data-day07-quiz-feedback="${q.id}"]`);
      const answer = state.quizAnswers?.[q.id];
      if (feedback) feedback.textContent = !answer ? "" : q.choices.some(c => c.correct && c.text === answer) ? "맞아요." : "다시 생각하고 고쳐 보세요.";
    });
    const quizStatus = root.querySelector("[data-day07-quiz-status]");
    if (quizStatus) quizStatus.textContent = quizComplete(state, lesson) ? "세 문제를 모두 맞혔어요." : "세 문제를 모두 맞히면 퀴즈가 완료됩니다.";
  }
  function handleInput(event, state, update, root, lesson) {
    const key = event.target.dataset.day07Field;
    if (!key) return;
    const next = event.target.value;
    const previousRecommendation = value(state, "recommended");
    update(current => {
      const d = current.day07 = current.day07 || {};
      d[key] = next;
      if (key !== "recommended" && key !== "direction" && d.suggestedValues) delete d.suggestedValues[key];
      if (key === "recommended") {
        const sensor = sensors.find(s => s.title === next);
        const previousSensor = sensors.find(s => s.title === previousRecommendation);
        if (!sensor) return;
        const suggestions = { person: sensor.person, problem: sensor.problem, device: sensor.device, input: sensor.input, condition: sensor.condition, output: sensor.output, firstGoal: sensor.first, successTest: sensor.test };
        const previousSuggestions = previousSensor && { person: previousSensor.person, problem: previousSensor.problem, device: previousSensor.device, input: previousSensor.input, condition: previousSensor.condition, output: previousSensor.output, firstGoal: previousSensor.first, successTest: previousSensor.test };
        d.suggestedValues = d.suggestedValues || {};
        Object.entries(suggestions).forEach(([field, suggestion]) => {
          const currentValue = String(d[field] || "");
          const tracked = d.suggestedValues[field];
          const legacyAuto = previousSuggestions && currentValue === previousSuggestions[field];
          if (!currentValue || tracked === currentValue || legacyAuto) {
            d[field] = suggestion;
            d.suggestedValues[field] = suggestion;
          }
        });
      }
    });
    if (key === "direction") { const panel = root.querySelector("[data-day07-recommend]"); if (panel) panel.hidden = next !== choices.direction[2]; }
    if (key === "recommended") {
      Object.keys({ person: 1, problem: 1, device: 1, input: 1, condition: 1, output: 1, firstGoal: 1, successTest: 1 }).forEach(field => {
        const control = root.querySelector(`[data-day07-field="${field}"]`);
        if (control && document.activeElement !== control) control.value = state.day07[field] || "";
      });
    }
    sync(root, state, lesson);
  }
  function click(event, root, state, update, lesson) {
    const slider = event.target.closest("[data-day07-sensor]");
    const pir = event.target.closest("[data-day07-pir]");
    if (pir) { pir.setAttribute("aria-pressed", pir.getAttribute("aria-pressed") === "true" ? "false" : "true"); showSensor(pir.closest("[data-day07-card]")); }
    if (slider) showSensor(slider.closest("[data-day07-card]"));
    const quiz = event.target.closest("[data-day07-quiz]");
    if (quiz) update(current => { current.quizAnswers = current.quizAnswers || {}; current.quizAnswers[quiz.dataset.day07Quiz] = quiz.value; });
    if (quiz) sync(root, state, lesson);
  }
  function showSensor(card) {
    if (!card) return;
    const sensor = sensors.find(s => s.key === card.dataset.day07Card);
    const control = card.querySelector("[data-day07-sensor]");
    const value = control ? Number(control.value) : card.querySelector("[data-day07-pir]").getAttribute("aria-pressed") === "true" ? 1 : 0;
    const alert = sensor.alert(value);
    card.querySelector(".day07-sensor-readout").textContent = `입력: ${sensor.state(value)} → 판단: ${sensor.condition} ${alert ? "해당" : "해당하지 않음"} → 출력: LED ${alert ? "켜짐 ●" : "꺼짐 ○"}`;
    card.querySelector(".day07-led").textContent = alert ? "●" : "○";
    card.classList.toggle("is-alert", alert);
    if (sensor.key === "light") card.style.setProperty("--day07-light", String(Math.max(0.18, value / 100)));
    if (sensor.key === "distance") card.style.setProperty("--day07-distance", `${value}%`);
    if (sensor.key === "temp") card.style.setProperty("--day07-temp", `${value * 2}%`);
  }
  function recordPayload(student, day, state, date, blockProgress, clone) {
    const d = state.day07 || {};
    return { studentId: student.studentId, workId: student.workId, dayId: day.dayId, date, blockProgress, role: "", activities: ["제작계획 세우기"], todayDecision: d.device || "", discovery: d.problem || "", difficulty: d.condition || "", changeMade: d.direction || "", changeReason: d.reasonDetail || d.reason || "", nextAction: d.firstGoal || "", targetUser: d.person || "", problemDefinition: d.problem || "", minimumCompleted: Boolean(state.minimumCompleted), completionLevel: state.completionLevel === "in_progress" ? "" : state.completionLevel, status: state.dayCompleted ? "completed" : "in_progress", studentReflection: d.peerQuestion || "", dayState: clone(state, {}) };
  }
  document.addEventListener("input", event => { if (event.target.matches("[data-day07-sensor]")) showSensor(event.target.closest("[data-day07-card]")); });
  document.addEventListener("toggle", event => { if (event.target.matches(".day07-sensor details") && event.target.open) showSensor(event.target.closest("[data-day07-card]")); }, true);
  window.Day07 = { render, sync, input: handleInput, click, updateProgress, quizComplete, recordPayload };
})();
