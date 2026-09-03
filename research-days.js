(function () {
  "use strict";

  const RESEARCH_DAYS = [
    {
      dayId: "day01",
      dayNo: 1,
      title: "기술과 문제 만나기",
      phase: "기술 익히기",
      todayDescription:
        "우리 주변의 불편을 찾아보고, 컴퓨터에서 만든 코드를 micro:bit로 보내 실제 장치를 움직여 봅니다. 오늘은 내가 원하는 방식으로 작은 장치를 바꾸어 만들어 봅니다.",
      dayType: "first",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day02",
      dayNo: 2,
      title: "센서로 현실 읽기",
      phase: "기술 익히기",
      todayDescription:
        "micro:bit가 주변 밝기를 0~255 숫자로 읽는 모습을 관찰합니다. 내가 정한 기준값으로 밝음과 어두움을 나누고 스스로 반응하게 만들어 봅니다.",
      dayType: "standard",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day03",
      dayNo: 3,
      title: "움직이는 장치 만들기",
      phase: "기술 익히기",
      todayDescription:
        "외부 조도센서의 조건에 따라 서보모터가 서로 다른 위치로 움직이는 장치",
      dayType: "standard",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day04",
      dayNo: 4,
      title: "AI는 어떻게 배우는가",
      phase: "기술 익히기",
      todayDescription:
        "AI가 정보를 분류하고 결과를 만드는 과정을 살펴봅니다. AI도 틀릴 수 있다는 것을 확인하며 결과를 사람이 검토해야 하는 이유를 알아봅니다.",
      dayType: "standard",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day05",
      dayNo: 5,
      title: "불편 발견하기",
      phase: "문제 찾고 계획하기",
      todayDescription:
        "지금까지 경험한 기술을 어디에 사용할 수 있을지 주변의 불편을 찾아봅니다. 내가 도움을 주고 싶은 사람과 해결할 문제를 하나 정합니다.",
      dayType: "standard",
      phaseNotice: "이제 배운 기술을 사용하여 해결할 문제를 찾아봅니다.",
      specialNotice: "",
    },
    {
      dayId: "day06",
      dayNo: 6,
      title: "아이디어 비교하기",
      phase: "문제 찾고 계획하기",
      todayDescription:
        "내가 정한 문제를 해결할 여러 방법을 생각해 봅니다. 세 가지 아이디어를 비교하고, 실제로 만들어 볼 한 가지를 이유와 함께 선택합니다.",
      dayType: "reload",
      phaseNotice: "",
      specialNotice:
        "연구를 다시 이어갑니다. 지난번에 정한 나의 문제와 기록을 먼저 되찾은 뒤 오늘 연구를 시작합니다.",
    },
    {
      dayId: "day07",
      dayNo: 7,
      title: "제작계획 세우기",
      phase: "문제 찾고 계획하기",
      todayDescription:
        "선택한 아이디어가 실제로 작동하려면 무엇이 필요한지 구체적으로 설계합니다. 입력·조건·출력과 성공 기준을 정해 제작할 준비를 마칩니다.",
      dayType: "standard",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day08",
      dayNo: 8,
      title: "실제 시제품 만들기",
      phase: "만들고 시험하기",
      todayDescription:
        "지금까지 세운 계획을 실제 마이크로비트 장치로 만들기 시작합니다. 입력과 출력을 연결해 내 아이디어의 첫 번째 작동 모습을 완성합니다.",
      dayType: "standard",
      phaseNotice: "이제 계획을 실제 장치로 만들기 시작합니다.",
      specialNotice: "",
    },
    {
      dayId: "day09",
      dayNo: 9,
      title: "조건 적용하고 시험하기",
      phase: "만들고 시험하기",
      todayDescription:
        "장치가 상황에 맞게 판단하고 작동하도록 조건을 적용합니다. 직접 시험해 보고 예상과 다른 부분을 찾아 수정합니다.",
      dayType: "standard",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day10",
      dayNo: 10,
      title: "3D 부품 설계하기",
      phase: "만들고 시험하기",
      todayDescription:
        "내 실제 장치에 필요한 부품을 정하고 크기를 직접 측정합니다. 측정한 값을 바탕으로 Tinkercad에서 실제로 사용할 3D 부품을 설계합니다.",
      dayType: "standard",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day11",
      dayNo: 11,
      title: "가상 장치 만들기",
      phase: "만들고 시험하기",
      todayDescription:
        "지금까지 만든 실제 장치를 가상공간에 다시 만들어 봅니다. 실제 장치의 모습과 작동을 가상 장면에서 어떻게 표현할지 생각합니다.",
      dayType: "standard",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day12",
      dayNo: 12,
      title: "AR·VR로 시험하기",
      phase: "만들고 시험하기",
      todayDescription:
        "내 가상 장치를 실제 공간과 사용자 입장에서 시험해 봅니다. 사용하면서 발견한 불편이나 문제를 찾아 작품을 더 나아지게 할 방법을 기록합니다.",
      dayType: "standard",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day13",
      dayNo: 13,
      title: "AI 작품 안내 만들기",
      phase: "만들고 시험하기",
      todayDescription:
        "내 작품을 다른 사람이 이해할 수 있는 안내 페이지를 AI와 함께 만듭니다. 원하는 결과를 설명하고, 만들어진 내용을 직접 검토하고 수정합니다.",
      dayType: "standard",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day14",
      dayNo: 14,
      title: "기록·영상·최종 개선",
      phase: "완성하고 공유하기",
      todayDescription:
        "지금까지 만든 실제 장치·3D 부품·가상 장치와 연구 기록을 다시 점검합니다. 필요한 부분을 마지막으로 고치고 내 연구 과정을 소개하는 영상을 완성합니다.",
      dayType: "standard",
      phaseNotice: "지금까지의 결과를 하나의 작품으로 정리합니다.",
      specialNotice: "",
    },
    {
      dayId: "day15",
      dayNo: 15,
      title: "미래기술 연구원 발표회",
      phase: "완성하고 공유하기",
      todayDescription:
        "완성한 작품과 그동안의 연구 과정을 다른 사람에게 보여줍니다. 친구들의 작품도 살펴보며 내가 배운 것과 다시 개선하고 싶은 점을 돌아봅니다.",
      dayType: "final",
      phaseNotice: "",
      specialNotice: "",
    },
  ];

  const LESSON_BLOCKS = {
    day01: [
      {
        blockId: "block01",
        number: "01",
        shortTitle: "문제를 찾아라",
        title: "문제를 찾아라",
        position: {
          current: "문제 발견하기",
          next: "마이크로비트 움직이기",
        },
        explanation: [
          "기술은 불편하거나 도움이 필요한 일을 해결하는 데 사용할 수 있습니다.",
          "먼저 주변 상황을 살펴보고 어떤 문제가 있는지 직접 찾아봅니다.",
        ],
        thinkingQuestion: "기술은 어떤 문제를 해결할 수 있을까요?",
        activity: {
          type: "activity-sequence",
          items: [
            {
              type: "problem-hotspot",
              title: "누가 무엇 때문에 불편할까요?",
              prompt: "상황을 하나 고르고, 누가 어떤 불편을 겪는지 찾아보세요.",
              successFeedback:
                "첫 문제 발견! 연구는 누가 무엇 때문에 불편한지 알아차리는 것부터 시작합니다.",
              situations: [
                {
                  id: "dark-road",
                  title: "집에 가는 길",
                  description: "해가 진 뒤 집으로 돌아가는 상황",
                  target: "집에 가는 사람이",
                  image: "assets/day01/dark-road.svg",
                  imageAlt: "가로등이 적어 어두운 길을 사람이 걸어가는 장면",
                  meaningOptions: [
                    "어두워서 앞을 보기 어렵습니다.",
                    "길 주변 상태를 확인하기 어렵습니다.",
                    "발을 헛디딜까 걱정됩니다.",
                  ],
                },
                {
                  id: "dry-plant",
                  title: "교실의 화분",
                  description: "교실 한쪽에 화분이 놓여 있는 상황",
                  target: "식물을 키우는 사람이",
                  image: "assets/day01/dry-plant.svg",
                  imageAlt: "마른 흙이 담긴 화분에서 잎이 처진 식물",
                  meaningOptions: [
                    "물 줄 때를 놓치기 쉽습니다.",
                    "흙이 마른 때를 계속 확인하기 어렵습니다.",
                    "식물 상태를 바로 알아차리기 어렵습니다.",
                  ],
                },
                {
                  id: "lost-things",
                  title: "책상 위 물건",
                  description: "수업 준비물이 여러 곳에 놓인 상황",
                  target: "물건을 자주 찾는 학생이",
                  image: "assets/day01/lost-things.svg",
                  imageAlt: "책상 주변에 흩어진 열쇠와 가방을 찾는 장면",
                  meaningOptions: [
                    "물건을 어디에 두었는지 찾기 어렵습니다.",
                    "필요한 물건을 찾는 데 시간이 오래 걸립니다.",
                    "정리한 위치를 기억하기 어렵습니다.",
                  ],
                },
                {
                  id: "hard-door",
                  title: "문 앞의 사람",
                  description: "문 앞에서 손이 자유롭지 않은 상황",
                  target: "손을 사용하기 어려운 사람이",
                  image: "assets/day01/hard-door.svg",
                  imageAlt: "짐을 든 사람이 문 앞에서 도움을 기다리는 장면",
                  meaningOptions: [
                    "손을 사용하기 어려워 문을 열기 힘듭니다.",
                    "문 앞에서 도움을 요청하기 어렵습니다.",
                    "짐 때문에 문손잡이를 잡기 어렵습니다.",
                  ],
                },
                {
                  id: "pet-waiting",
                  title: "혼자 있는 방",
                  description: "사람이 잠시 자리를 비운 방 안의 상황",
                  target: "반려동물을 돌보는 사람이",
                  image: "assets/day01/pet-waiting.svg",
                  imageAlt: "빈 방에서 반려동물이 문 쪽을 바라보는 장면",
                  meaningOptions: [
                    "방 안의 상태를 바로 알기 어렵습니다.",
                    "반려동물이 잘 지내는지 확인하기 어렵습니다.",
                    "혼자 있는 시간이 길어 걱정됩니다.",
                  ],
                },
                {
                  id: "too-hot-cold",
                  title: "교실 한쪽 자리",
                  description: "교실 안쪽과 창가의 느낌이 서로 다른 상황",
                  target: "교실에 있는 사람이",
                  image: "assets/day01/too-hot-cold.svg",
                  imageAlt: "한쪽은 덥고 한쪽은 추운 실내 공간",
                  meaningOptions: [
                    "공간의 상태 변화를 알아차리기 어렵습니다.",
                    "덥거나 추운 때를 바로 알기 어렵습니다.",
                    "어느 자리가 불편한지 비교하기 어렵습니다.",
                  ],
                },
              ],
            },
            {
              type: "notice",
              title: "오늘 찾은 문제는 연습입니다",
              paragraphs: [
                "오늘 찾은 문제는 문제를 발견하는 연습입니다.",
                "앞으로 여러 기술을 경험한 뒤, 내가 실제 프로젝트에서 해결할 문제는 다시 정하게 됩니다.",
              ],
            },
            {
              type: "card-match",
              title: "사람·문제·도움 연결",
              intro:
                "문제를 찾았습니다. 그렇다면 기술은 이 문제를 어떻게 도울 수 있을까요?",
              prompt: "사람이나 상황, 문제, 도움 방법을 하나씩 골라 연결하세요.",
              successFeedback: "문제와 도움 연결 완료 ✓",
              groups: [
                {
                  id: "person",
                  title: "사람/상황",
                  cards: [
                    { id: "plant-owner", text: "식물을 키우는 사람", matchSet: "plant" },
                    { id: "night-walker", text: "어두운 길을 걷는 사람", matchSet: "night" },
                    { id: "busy-student", text: "물건을 자주 찾는 학생", matchSet: "lost" },
                    { id: "door-helper", text: "손을 사용하기 어려운 사람", matchSet: "door" },
                  ],
                },
                {
                  id: "problem",
                  title: "문제",
                  cards: [
                    {
                      id: "soil-check",
                      text: "흙이 마른 때를 계속 확인하기 어렵다.",
                      matchSet: "plant",
                    },
                    { id: "dark-risk", text: "주변을 잘 보기 어렵다.", matchSet: "night" },
                    {
                      id: "location-missing",
                      text: "물건을 어디에 두었는지 찾기 어렵다.",
                      matchSet: "lost",
                    },
                    {
                      id: "door-request",
                      text: "문을 열거나 도움을 요청하기 어렵다.",
                      matchSet: "door",
                    },
                  ],
                },
                {
                  id: "help",
                  title: "도움 방법",
                  cards: [
                    { id: "notify-soil", text: "흙 상태를 알아보고 알려준다.", matchSet: "plant" },
                    {
                      id: "light-signal",
                      text: "어두운 상태를 알아차리고 빛으로 돕는다.",
                      matchSet: "night",
                    },
                    { id: "find-signal", text: "신호로 물건 위치를 알려준다.", matchSet: "lost" },
                    {
                      id: "simple-request",
                      text: "간단한 입력으로 도움을 요청하게 한다.",
                      matchSet: "door",
                    },
                  ],
                },
              ],
              wrongFeedback:
                "이 사람의 문제와 도움 방법이 서로 잘 이어지는지 다시 확인해 보세요.",
            },
            {
              type: "sequence-sort",
              title: "연구 순서를 완성하라",
              prompt: "섞인 카드를 가로 순서 칸에 놓아 연구 흐름을 완성하세요.",
              checkLabel: "연구 순서 확인",
              successFeedback: "연구 과정 완성! 앞으로 이 과정을 직접 경험합니다.",
              retryFeedback: "조금 더 바꾸어 볼까요? 문제를 찾은 뒤 만들고 시험합니다.",
              steps: [
                { id: "find-problem", text: "문제 찾기" },
                { id: "think-method", text: "방법 생각하기" },
                { id: "plan", text: "계획하기" },
                { id: "make", text: "만들기" },
                { id: "test", text: "시험하기" },
                { id: "fix", text: "고치기" },
                { id: "share", text: "소개하기" },
              ],
              initialOrder: ["make", "find-problem", "test", "think-method", "share", "plan", "fix"],
              correctOrder: ["find-problem", "think-method", "plan", "make", "test", "fix", "share"],
            },
            {
              type: "role-pick",
              title: "연구원의 역할 살펴보기",
              prompt: "나와 잘 맞거나 한번 해보고 싶은 역할을 최대 2개 골라보세요.",
              note: "오늘 고른 역할로 계속 활동하는 것은 아닙니다. 연구를 하면서 여러 역할을 돌아가며 경험합니다.",
              max: 2,
              successFeedback: "역할 선택 저장 완료 ✓",
              roles: [
                {
                  name: "연구 진행자",
                  description: "우리가 어떤 순서로 연구하고 있는지 확인해요.",
                },
                {
                  name: "문제 관찰자",
                  description: "누구에게 어떤 불편이 있는지 자세히 살펴봐요.",
                },
                {
                  name: "기술 점검자",
                  description: "장치와 부품이 제대로 작동하는지 확인해요.",
                },
                {
                  name: "질문 연구원",
                  description: "계획에서 빠뜨린 것은 없는지 질문해요.",
                },
                {
                  name: "사용자 연구원",
                  description: "친구의 작품을 직접 사용해 보고 살펴봐요.",
                },
                {
                  name: "시험 기록자",
                  description: "예상과 실제 결과, 바꾼 내용을 기록해요.",
                },
              ],
            },
          ],
        },
        checkpoint: [
          "누가 무엇 때문에 불편한지 하나 발견했다.",
          "사람·문제·도움 방법을 연결했다.",
          "연구 과정을 순서대로 배열했다.",
          "오늘 해보고 싶은 역할을 2개까지 골랐다.",
        ],
        help: [
          "정답을 찾는 활동이 아닙니다. 불편하거나 도움이 필요한 지점을 먼저 고르세요.",
          "연결이 어렵다면 한 사람에게 어떤 문제가 있는지부터 생각해 보세요.",
        ],
      },
      {
        blockId: "block02",
        number: "02",
        shortTitle: "마이크로비트 움직이기",
        title: "마이크로비트를 움직여 보자",
        position: {
          current: "기술 도구 얻기",
          next: "자유 연구실",
        },
        explanation: [
          "실제 장치와 프로그램이 함께 있어야 마이크로비트를 움직일 수 있습니다.",
          "컴퓨터에서 코딩하고, micro:bit로 보내고, 실제 장치에서 시험해 봅니다.",
        ],
        thinkingQuestion: "컴퓨터에서 만든 코드가 실제 micro:bit를 바꾸려면 무엇을 해야 할까요?",
        activity: {
          type: "activity-sequence",
          items: [
            {
              type: "guide-image",
              title: "마이크로비트를 움직이려면 무엇이 필요할까요?",
              image: "assets/day01/hardware-software.png",
              imageAlt: "micro:bit 하드웨어와 MakeCode 소프트웨어를 비교한 그림",
              caption:
                "micro:bit는 실제 장치인 하드웨어이고, MakeCode로 만든 프로그램은 장치를 움직이게 하는 소프트웨어입니다.",
            },
            {
              type: "guide-image",
              title: "컴퓨터와 micro:bit는 어떻게 함께 일할까요?",
              image: "assets/day01/computer-microbit-flow.png",
              imageAlt:
                "컴퓨터에서 만든 코드를 micro:bit로 보내고 micro:bit가 스스로 실행하는 과정을 설명한 그림",
              summaryLines: [
                "컴퓨터는 MakeCode로 프로그램을 만들고, micro:bit는 전달받은 프로그램을 저장하고 실행합니다.",
                "중요! 컴퓨터에서 코드를 바꾸기만 해서는 실제 micro:bit의 동작이 바로 바뀌지 않습니다. 바꾼 코드를 다시 micro:bit로 보내야 합니다.",
              ],
            },
            {
              type: "makecode-start",
              title: "MakeCode 열기와 새 프로젝트",
              prompt: "버튼을 눌러 MakeCode를 열고 새 프로젝트를 만듭니다.",
              url: "https://makecode.microbit.org/",
              linkLabel: "MakeCode 열기 ↗",
              steps: [
                "MakeCode를 엽니다.",
                "새 프로젝트를 만듭니다.",
                "프로젝트 이름을 정합니다.",
              ],
              examples: ["day1_이름", "나의첫마이크로비트", "연구원배지"],
            },
            {
              type: "makecode-ui-check",
              title: "MakeCode 화면 스스로 찾아보기",
              prompt: "MakeCode 화면에서 직접 찾아보세요.",
              helpSummary: "찾기 어렵나요? MakeCode 화면 안내 보기",
              image: "assets/day01/makecode-ui-guide.png",
              imageAlt: "MakeCode 화면에서 시뮬레이터, 블록 메뉴, 코딩하는 곳, 다운로드, 프로젝트 이름 위치를 안내한 그림",
              items: [
                "가상 micro:bit가 보이는 곳",
                "필요한 블록을 고르는 곳",
                "블록을 끌어다 놓아 코딩하는 곳",
                "완성한 코드를 micro:bit로 보내는 곳",
                "내 프로젝트 이름이 보이는 곳",
              ],
            },
            {
              type: "guide-image",
              title: "장치는 입력을 받고, 처리한 뒤, 출력합니다.",
              image: "assets/day01/ipo-flow.png",
              imageAlt: "A 버튼 입력, 프로그램 처리, LED 하트 출력의 흐름을 보여주는 그림",
              caption:
                "오늘은 A 버튼을 입력으로 사용하고, 프로그램의 규칙을 거쳐 LED로 출력해 봅니다.",
            },
            {
              type: "code-prediction",
              title: "버튼 → LED 먼저 예상하기",
              prompt:
                "A 버튼을 누르면 LED에 하트가 나오게 하려면 어떤 블록이 필요할까요? 필요한 블록 2개를 골라보세요.",
              ipoFlow: {
                input: "A 버튼을 누른다.",
                process: "어떤 프로그램 블록이 필요할까요?",
                output: "LED에 하트가 나타난다.",
              },
              checkLabel: "예상 확인",
              successFeedback:
                "좋아요!\n\nA 버튼을 눌렀을 때\n→ 하트를 보여주도록 프로그램을 만들면 됩니다.\n\n이제 MakeCode에서 실제로 만들어 봅니다.\n내가 예상한 코드와 실제 MakeCode 블록을 비교해 보세요.",
              retryFeedback:
                "다시 살펴보세요.\n\n우리가 원하는 결과는\n'A 버튼을 누르면 LED에 하트가 나타나는 것'입니다.\n\n어떤 블록이 꼭 필요한지 다시 골라보세요.",
              blocks: [
                { id: "event-a", text: "A 버튼을 눌렀을 때" },
                { id: "show-led", text: "하트 표시" },
                { id: "extra", text: "소리 내기" },
              ],
              maxSelections: 2,
              correctSelections: ["event-a", "show-led"],
              correctOrder: ["event-a", "show-led"],
            },
            {
              type: "saved-checklist",
              stateListKey: "pairingChecklist",
              title: "처음 한 번, micro:bit를 연결합니다",
              prompt: "아래 그림을 보면서 USB 연결 → 장치 연결 → 페어링 순서를 진행하세요.",
              note: "이미 연결되어 있다면 이 단계는 확인만 하고 넘어가세요.",
              image: "assets/day01/makecode-pairing-guide.png",
              imageAlt: "MakeCode에서 프로젝트를 만들고 micro:bit를 연결한 뒤 장치 페어링을 진행하는 3단계 안내 그림",
              items: [
                "USB로 micro:bit를 연결했다.",
                "장치 연결을 눌렀다.",
                "내 micro:bit를 선택해 페어링했다.",
              ],
            },
            {
              type: "makecode-checklist",
              title: "실제 MakeCode 코딩과 보내기",
              prompt:
                "저장이 아니라 micro:bit에 보내기입니다. 현재 만든 프로그램을 실제 장치에서 실행하도록 전달합니다.",
              ipoFlow: {
                input: "A 버튼을 누른다.",
                process: "프로그램에 정한 규칙대로 하트를 보여줄지 정한다.",
                output: "LED에 하트가 나타난다.",
              },
              stateKey: "buttonToolCompleted",
              successFeedback: "내 코드가 실제 장치에서 움직였습니다!",
              unlockTools: ["버튼 입력", "LED 출력"],
              steps: [
                "MakeCode에서 A 버튼 코드를 만들었다.",
                "micro:bit 연결을 준비했다.",
                "코드를 micro:bit로 보냈다.",
                "실제 A 버튼을 눌러 LED 하트를 확인했다.",
              ],
            },
            {
              type: "feature-find",
              title: "버튼 대신 흔들기를 입력으로 써보자",
              prompt:
                "아까는 A 버튼을 입력으로 사용했습니다. 이번에는 입력만 '흔들기'로 바꾸어 봅니다.",
              ipoFlow: {
                input: "마이크로비트를 흔든다.",
                process: "흔들었을 때 내가 고른 LED 표시를 보여주도록 정한다.",
                output: "LED에 내가 고른 표시가 나타난다.",
              },
              successFeedback:
                "새 입력 발견 ✓\n\n버튼뿐 아니라 움직임도 입력으로 사용할 수 있습니다.",
              stateKey: "shakeToolCompleted",
              unlockTools: ["흔들기 입력"],
              menuPrompt: "MakeCode에서 '흔들었을 때' 블록은 어느 메뉴에 있을까요?",
              menuItems: [
                { id: "basic", text: "기본" },
                { id: "input", text: "입력", correct: true },
                { id: "music", text: "음악" },
                { id: "led", text: "LED" },
              ],
              ledChoices: ["별", "웃는 얼굴", "직접 그린 표시"],
              steps: [
                "'흔들었을 때 → 내가 고른 LED' 코드를 만들었다.",
                "micro:bit로 보내고 실제로 흔들어 작동을 확인했다.",
              ],
            },
            {
              type: "combination-challenge",
              title: "작은 조합 도전",
              optional: true,
              summary: "더 해보고 싶다면",
              prompt: "한 가지 이상 직접 바꿔 보세요.",
              ipoFlow: {
                input: "내가 고른 입력을 사용한다.",
                process: "프로그램에 정한 규칙대로 무엇을 할지 정한다.",
                output: "LED가 내가 정한 모양으로 반응한다.",
              },
              successFeedback: "기술 도구 획득 ✓",
              options: [
                "A 버튼 표시 변경",
                "흔들기 표시 변경",
                "B 버튼 추가",
                "A+B 추가",
                "LED 직접 그리기",
              ],
            },
          ],
        },
        checkpoint: [
          "입력 → 처리 → 출력 흐름을 말할 수 있다.",
          "A 버튼을 눌렀을 때 LED가 반응했다.",
          "흔들었을 때 LED가 반응했다.",
          "바꾼 코드는 다시 micro:bit로 보내야 한다는 것을 알았다.",
        ],
        help: [
          "전송이 잘 안 되면 케이블 연결과 장치 선택을 다시 확인하세요.",
          "흔들기 기능은 입력 메뉴에서 찾을 수 있습니다.",
        ],
      },
      {
        blockId: "block03",
        number: "03",
        shortTitle: "자유 연구실",
        title: "자유 연구실",
        position: {
          current: "내 장치 만들기",
          next: "연구 증거함",
        },
        explanation: [
          "오늘 배운 기능을 이용해 내가 원하는 마이크로비트 장치를 만들어 보세요.",
          "정해진 정답은 없습니다. 바꾸고, 시험하고, 마음에 들지 않으면 다시 고쳐도 됩니다.",
        ],
        thinkingQuestion: "입력 1개 이상과 내가 정한 반응 1개 이상을 어떻게 연결할까요?",
        activity: {
          type: "activity-sequence",
          items: [
            {
              type: "guide-image",
              title: "앞으로 계속 반복할 연구 방법",
              image: "assets/day01/coding-send-test-fix.png",
              imageAlt: "코딩, 전송, 실제 작동, 시험, 수정의 반복 연구 과정을 보여주는 그림",
              caption:
                "잘 안 되어도 실패가 아닙니다. 시험하고 다시 고치는 것도 연구입니다.",
            },
            {
              type: "free-lab",
              title: "나의 장치 만들기",
              prompt: "해보기, 바꿔보기, 시험하기를 차례로 진행합니다.",
              successFeedback: "나의 첫 자유 연구 완료 ✓",
              toolbox: ["A 버튼", "B 버튼", "A+B", "흔들기", "아이콘", "LED 직접 그리기", "여러 표시"],
              steps: ["해보기", "바꿔보기", "시험하기"],
              usedFeatures: ["A 버튼", "B 버튼", "A+B", "흔들기", "아이콘", "LED 직접 그리기", "여러 표시"],
              ideas: [
                "A를 누르면 기분을 표시해 보세요.",
                "흔들면 비밀 표시가 나오게 해보세요.",
                "A와 B에 서로 다른 의미를 넣어보세요.",
                "LED를 직접 그려 나만의 표시를 만들어 보세요.",
                "표시 두 개가 차례로 나오게 만들어 보세요.",
              ],
            },
            {
              type: "peer-test",
              title: "친구 시험",
              prompt: "친구 장치를 직접 작동해 보고 하나를 고르세요.",
              successFeedback: "친구 시험 완료 ✓",
              options: ["잘 작동했어요.", "재미있는 부분이 있었어요.", "한 번 더 고치면 좋겠어요."],
            },
            {
              type: "makecode-link",
              title: "MakeCode 공유 링크",
              prompt: "오늘 완성한 코드를 다시 열 수 있도록 공유 주소를 남겨주세요.",
              successFeedback: "코드 연결 완료 ✓",
            },
            {
              type: "webcam-evidence",
              title: "오늘의 연구 모습 영상으로 남기기",
              prompt:
                "오늘 만든 연구원 배지 또는 자유 작품이 실제로 작동하는 모습이 잘 보이도록 촬영하세요.",
            },
          ],
        },
        checkpoint: [
          "입력 1개 이상과 반응 1개 이상을 연결했다.",
          "예제에서 한 가지 이상 직접 변경했다.",
          "친구에게 장치를 시험받았다.",
          "코드 링크와 오늘의 연구 모습 영상을 증거로 남겼다.",
        ],
        help: [
          "막히면 아이디어를 하나 뽑아 작은 변경부터 해 보세요.",
          "영상 저장이 연결되지 않아도 촬영과 즉시 재생으로 작동 확인은 계속할 수 있습니다.",
        ],
      },
    ],
    day02: [
      {
        blockId: "block04",
        number: "04",
        shortTitle: "빛을 숫자로 읽기",
        title: "빛을 숫자로 읽기",
        position: {
          current: "micro:bit 빛의 세기 관찰하기",
          next: "내 기준값 정하기",
        },
        explanation: [
          "micro:bit에는 주변 밝기를 알아차리는 기능이 있습니다.",
          "이처럼 주변 상태를 알아차리는 기능을 센서라고 부릅니다.",
          "빛의 세기는 0부터 255까지 숫자로 나타납니다. 0에 가까울수록 어둡고, 255에 가까울수록 밝습니다.",
        ],
        thinkingQuestion: "빛이 달라지면 숫자는 어떻게 달라질까요?",
        activity: {
          type: "sensor-observation",
          title: "빛의 세기 관찰",
          connection: {
            title: "먼저 micro:bit를 연결해요",
            summary: "USB 연결 → MakeCode → 장치 연결 확인",
            stepsBeforeImage: [
              "USB 케이블로 micro:bit와 컴퓨터를 연결합니다.",
              "MakeCode를 엽니다.",
            ],
            quickLink: {
              url: "https://makecode.microbit.org/",
              label: "MakeCode 바로가기 ↗",
            },
            figure: {
              title: "micro:bit 연결 순서 복습",
              image: "assets/day01/makecode-pairing-guide.png",
              imageRole: "pairing-guide",
              imageAlt: "MakeCode에서 micro:bit를 연결하고 장치를 선택하는 순서 안내",
              caption: "처음 연결하거나 연결이 끊겼다면 이 순서대로 다시 연결해 보세요.",
            },
            stepsAfterImage: [
              "필요하면 장치 연결에서 내 micro:bit를 선택합니다.",
              "코드를 만든 뒤 micro:bit로 보냅니다.",
            ],
            detail: "이미 연결되어 있다면 연결 상태만 확인하고 바로 빛의 세기 블록을 찾습니다.",
          },
          blockGuideSteps: [
            "입력 메뉴에서 빛의 세기 블록을 찾습니다.",
            "기본 메뉴에서 숫자 출력 블록을 찾습니다.",
            "계속 반복하기 안에 숫자 출력과 빛의 세기를 넣어 값을 봅니다.",
          ],
          blockGuides: [
            {
              title: "입력 메뉴에서 빛의 세기 찾기",
              image: "assets/day02/makecode-input-light-level.png",
              imageRole: "locator",
              imageAlt: "MakeCode 입력 메뉴에서 빛 밝기 블록이 강조된 화면",
              caption: "입력 메뉴에서 micro:bit가 읽은 빛의 세기 값을 가져오는 블록을 찾습니다.",
            },
            {
              title: "기본 메뉴에서 숫자 출력 찾기",
              image: "assets/day02/makecode-basic-show-number.png",
              imageRole: "locator",
              imageAlt: "MakeCode 기본 메뉴에서 숫자 출력 블록이 강조된 화면",
              caption: "기본 메뉴에서 숫자 출력 블록을 찾습니다.",
            },
            {
              title: "빛의 세기 숫자 보기",
              image: "assets/day02/makecode-light-forever-number.png",
              imageRole: "code-example",
              imageAlt: "무한반복 안에 숫자 출력과 빛 밝기 블록을 넣은 코드",
              caption: "무한반복 안에 숫자 출력과 빛 밝기를 넣어 밝기가 숫자로 바뀌는 모습을 봅니다.",
            },
          ],
          prompt:
            "micro:bit LED 화면을 그대로 두거나 손, 종이, 책으로 살짝 덮어 보며 값을 비교합니다.",
          steps: [
            "micro:bit를 연결합니다.",
            "밝은 곳에서 빛의 세기 숫자를 확인합니다.",
            "손, 종이, 책 등으로 LED 화면을 덮습니다.",
            "조금 열어 봅니다.",
            "다시 밝게 합니다.",
            "값이 어떻게 변하는지 관찰합니다.",
          ],
          questions: [
            "숫자가 항상 같은가요?",
            "0에 가까운 값은 언제 나오나요?",
            "255에 가까운 값은 언제 나오나요?",
          ],
          fieldStudy: {
            title: "작은 연구 · 교실의 빛을 숫자로 조사하기",
            lead: [
              "한 곳에서만 확인하면 센서가 어떻게 달라지는지 알기 어렵습니다.",
              "이번에는 micro:bit를 들고 위치를 바꾸어 보면서 주변의 빛이 숫자로 어떻게 달라지는지 직접 조사해 봅시다.",
              "먼저 숫자를 예상한 뒤 실제로 측정해 보세요.",
            ],
            prediction: {
              label: "① 창가 또는 밝은 곳",
              prompt: "여기에서는 숫자가 높게 나올까요, 낮게 나올까요?",
              options: ["높을 것 같다", "낮을 것 같다"],
            },
            measurements: [
              { key: "brightPlace", label: "① 창가 또는 밝은 곳" },
              { key: "seat", label: "② 내 자리" },
              { key: "shade", label: "③ 책상 아래 또는 그늘진 곳" },
              { key: "covered", label: "④ micro:bit LED 화면을 손이나 종이로 가렸을 때" },
            ],
            discovery: {
              title: "내가 발견한 것",
              brightestLabel: "가장 밝았던 곳은 어디였나요?",
              darkestLabel: "가장 어두웠던 곳은 어디였나요?",
            },
            reflection: {
              title: "생각해 보기",
              prompt: "장소가 달라지자 센서의 숫자도 달라졌나요?",
              options: ["네", "거의 비슷했어요"],
              feedback: [
                "센서는 우리가 그냥 “밝다”, “어둡다”라고 느끼는 주변 상태를 컴퓨터가 사용할 수 있는 숫자로 바꾸어 줍니다.",
              ],
              emphasis: "현실의 상태 → 센서 → 숫자",
            },
          },
        },
        checkpoint: [],
        help: [
          "값이 거의 변하지 않는다면 LED 화면을 더 확실히 덮거나 다시 밝게 해 보세요.",
          "친구와 값이 달라도 괜찮습니다. 오늘은 내 자리의 밝고 어두운 값을 비교합니다.",
        ],
      },
      {
        blockId: "block05",
        number: "05",
        shortTitle: "내 기준값 정하기",
        title: "내 기준값 정하기",
        position: {
          current: "밝음과 어두움을 나눌 경계 생각하기",
          next: "스스로 반응하게 만들기",
        },
        explanation: [
          "앞에서 밝을 때와 어두울 때 서로 다른 숫자가 나오는 것을 확인했습니다.",
          "하지만 micro:bit는 숫자만 보고 스스로 \"지금은 어둡다\"라고 판단하지 못합니다.",
          "그래서 어느 숫자보다 작으면 어둡다고 볼지 경계를 하나 정해야 합니다.",
          "이때 밝음과 어두움을 나누기 위해 정한 숫자를 기준값이라고 합니다.",
        ],
        thinkingQuestion:
          "밝을 때 나온 값과 어두울 때 나온 값 사이에서 어디를 경계로 나누면 좋을까요?",
        activity: {
          type: "threshold-setting",
          title: "내 기준값 정하기",
          prompt:
            "내가 관찰한 밝은 값과 어두운 값 사이에서 기준값을 하나 정해 보세요.",
          conceptLines: [
            "밝을 때 약 180, 어두울 때 약 40이 나왔다면 그 사이의 100을 기준값으로 정해볼 수 있습니다.",
            "정답은 하나가 아닙니다. 내 자리에서 관찰한 값에 맞게 고르면 됩니다.",
          ],
          fieldLabel: "내 기준값",
          placeholder: "예: 100",
          ruleIntro: "이제 이 숫자를 micro:bit의 판단 기준으로 사용합니다.",
          relationLines: [
            "빛의 세기 < 내가 정한 기준값 → 어두움",
            "그렇지 않으면 → 밝음",
          ],
          observationReview: {
            title: "내 측정값 다시 보기",
            lead: "아까 내가 측정한 값을 비교해 봅시다.",
            brightestLabel: "가장 밝게 측정한 값",
            darkestLabel: "가장 어둡게 측정한 값",
          },
          thresholdDecision: {
            title: "어디부터 ‘어둡다’고 할까요?",
            lines: [
              "센서는 숫자만 알려줍니다.",
              "하지만",
              "“이 정도면 어둡다.”",
              "라고 결정하는 것은 사람이 해야 합니다.",
              "밝을 때 나온 숫자와 어두울 때 나온 숫자 사이에서 내 장치가 사용할 기준을 하나 정해 보세요.",
            ],
          },
          reason: {
            title: "왜 이 숫자를 골랐나요?",
            prompt: "아래 중 하나를 선택하세요.",
            options: [
              "밝을 때와 어두울 때의 중간쯤이라서",
              "내 자리에서 시험해 보니 잘 구분되어서",
              "몇 번 시험하면서 찾은 값이라서",
              "다른 이유",
            ],
            otherLabel: "다른 이유",
            otherPlaceholder: "이유를 짧게 적기",
          },
          ruleNote:
            "기준값이 달라지면 같은 장소에서도 장치의 판단이 달라질 수 있습니다.",
          logicGuide: {
            title: "조건 블록 생각하기",
            guides: [
              {
                title: "논리 메뉴에서 비교 블록 찾기",
                image: "assets/day02/makecode-logic-comparison-operator.png",
                imageRole: "locator",
                imageAlt: "MakeCode 논리 메뉴에서 비교 연산 블록이 강조된 화면",
                caption: "논리 메뉴에서 빛의 세기와 기준값을 비교하는 블록을 찾습니다.",
              },
              {
                title: "논리 메뉴에서 조건 블록 찾기",
                image: "assets/day02/makecode-logic-if-block.png",
                imageRole: "locator",
                imageAlt: "MakeCode 논리 메뉴에서 만약 참이면 블록이 강조된 화면",
                caption: "논리 메뉴에서 만약 / 아니면 블록을 찾습니다.",
              },
            ],
            steps: [
              "논리 메뉴에서 비교 블록 < 를 찾습니다.",
              "논리 메뉴에서 만약 / 아니면 블록을 찾습니다.",
              "빛의 세기 < 내가 정한 기준값 이라면 어두운 쪽 반응을 실행합니다.",
            ],
          },
          makeCodeGuide:
            "MakeCode에서는 입력의 빛의 세기, 논리의 비교와 만약 / 아니면, 기본의 LED 표시 블록을 함께 사용합니다.",
          thresholdExperiment: {
            title: "잠깐 실험 · 기준값을 바꾸면 어떻게 될까요?",
            lines: [
              "현재 기준값으로 장치를 한 번 실행해 보세요.",
              "그다음 기준값을 조금 높이거나 낮추어 다시 실행해 봅니다.",
            ],
            prompt: "기준값이 바뀌자 장치가 ‘어둡다’고 판단하는 순간도 달라졌나요?",
            options: ["네", "잘 모르겠어요"],
            feedback:
              "센서가 측정한 값은 같아도, 사람이 어떤 기준을 정했는지에 따라 장치의 판단은 달라질 수 있습니다.",
          },
        },
        checkpoint: [],
        help: [
          "정해진 정답 기준값은 없습니다.",
          "처음 고른 값이 잘 맞지 않으면 시험하면서 바꾸어도 됩니다.",
        ],
      },
      {
        blockId: "block06",
        number: "06",
        shortTitle: "스스로 반응하게 만들기",
        title: "빛에 따라 스스로 반응하게 만들기",
        position: {
          current: "빛에 따라 스스로 반응하게 만들기",
          next: "마음대로 바꾸기",
        },
        explanation: [
          "이제 사람이 버튼을 누르지 않아도 micro:bit가 빛의 세기를 읽고 스스로 반응하게 만듭니다.",
          "오늘의 최소 결과물은 밝은 상태와 어두운 상태에서 LED 화면이 서로 다르게 보이는 micro:bit입니다.",
        ],
        thinkingQuestion:
          "어두울 때와 밝을 때 LED가 어떻게 다르게 보이면 좋을까요?",
        activity: {
          type: "sensor-device",
          title: "두 상황에서 시험하기",
          prompt:
            "micro:bit LED 화면을 밝게 둔 상태와 손이나 종이로 덮은 상태에서 반응이 서로 다른지 확인합니다.",
          flow: [
            "빛의 세기를 계속 읽습니다.",
            "내 기준값과 비교합니다.",
            "어두우면 LED 그림 A를 보여 줍니다.",
            "그렇지 않으면 LED 그림 B를 보여 줍니다.",
          ],
          pseudoCodeTitle: "기본 코드 흐름",
          pseudoCodeImage: {
            title: "빛의 세기 조건 코드",
            image: "assets/day02/makecode-light-condition-code.png",
            imageRole: "code-example",
            imageAlt: "무한반복 안에 빛 밝기 조건 블록을 넣은 MakeCode 코드",
            caption:
              "사진 속 = 0은 예시입니다. 실제로는 내가 정한 기준값과 < 비교를 사용합니다.",
          },
          pseudoCode: [
            "계속 반복하기",
            "",
            "    만약 빛의 세기 < 내 기준값 이라면",
            "        어두울 때 그림 보여주기",
            "    아니면",
            "        밝을 때 그림 보여주기",
          ],
          makeCodeGuide:
            "필요한 블록 위치만 확인하고, LED 그림은 원하는 모양으로 바꾸어도 됩니다.",
          confirmLabel: "두 상황 모두 작동했어요",
          confirmationGuide: [
            "밝은 상태와 어두운 상태를 실제 micro:bit에서 모두 확인해 보세요.",
            "두 상태에서 서로 다른 반응이 나타났다면 아래 버튼을 누릅니다.",
          ],
          testLab: {
            title: "연구원 시험실 · 정말 잘 판단할까요?",
            lead: [
              "한 번 작동했다고 연구가 끝난 것은 아닙니다.",
              "서로 다른 상황에서도 내가 예상한 대로 작동하는지 시험해 봅시다.",
            ],
            tests: [
              {
                key: "seat",
                title: "시험 1 · 내 자리",
                guide: "micro:bit를 평소처럼 책상 위에 놓습니다.",
                prompt: "내 예상대로 작동했나요?",
                options: ["잘 작동했어요", "생각과 달랐어요"],
              },
              {
                key: "dark",
                title: "시험 2 · 어둡게 만들기",
                guide: "손이나 종이로 micro:bit의 LED 화면을 살짝 가려 봅니다.",
                prompt: "반응이 달라졌나요?",
                options: ["네", "아니요"],
              },
              {
                key: "other",
                title: "시험 3 · 다른 장소",
                guide:
                  "조금 더 밝거나 어두운 곳으로 micro:bit를 옮겨 봅니다. 가능하면 친구에게 장소를 하나 골라 달라고 해도 좋습니다.",
                prompt: "그곳에서도 내가 예상한 대로 작동했나요?",
                options: ["잘 작동했어요", "생각과 달랐어요"],
              },
            ],
            summaryPrompt: "세 번의 시험 결과는 어땠나요?",
            summaryOptions: ["모두 잘 작동했어요", "어떤 곳에서는 잘 작동하지 않았어요"],
            revise: {
              title: "괜찮습니다. 기준을 다시 고쳐 봅시다.",
              lines: [
                "센서가 고장 난 것이 아니라 내가 정한 기준값이 그 장소와 잘 맞지 않았을 수도 있습니다.",
                "먼저 그 장소에서 빛의 숫자를 다시 확인하세요.",
                "그리고 생각해 봅니다.",
                "기준값을 조금 높여야 할까요?",
                "아니면 조금 낮춰야 할까요?",
              ],
              currentLabel: "현재 기준값",
              nextLabel: "새 기준값",
              buttonLabel: "새 기준으로 다시 시험하기",
            },
            success: {
              title: "연구 성공!",
              lines: [
                "센서가 주변의 빛을 숫자로 읽고,",
                "내가 정한 기준과 비교한 뒤,",
                "밝을 때와 어두울 때 서로 다르게 반응합니다.",
              ],
              emphasis: "센서 → 숫자 → 기준과 비교 → 판단 → LED 반응",
              next:
                "이 구조는 앞으로 여러분이 만드는 미래기술 장치에서도 다시 사용하게 됩니다.",
            },
          },
        },
        checkpoint: [],
        help: [
          "반응이 너무 자주 일어나면 기준값을 조금 높이거나 낮추어 보세요.",
          "조건 방향이 반대로 되어 있으면 원하는 상황이 아닐 때 작동할 수 있습니다.",
          "다시 시험하려면 실제 micro:bit에서 밝은 상태와 어두운 상태를 다시 확인하세요.",
        ],
      },
    ],
    day03: [
      {
        blockId: "block07",
        number: "07",
        shortTitle: "서보모터 연결하기",
        title: "외부 장치를 연결하고 서보모터 움직이기",
        position: {
          current: "Sensor:Edge와 서보모터 연결하기",
          next: "외부 조도센서 값으로 움직이기",
        },
        explanation: [
          "Day02에서는 micro:bit의 내장 조도센서가 주변 밝기를 0~255 숫자로 읽었습니다.",
          "Day03에서는 Sensor:Edge의 P1에 연결한 외부 조도센서가 빛을 0~1023 범위의 아날로그 입력값으로 읽습니다.",
          "오늘은 외부 조도센서의 값에 따라 P2에 연결한 서보모터의 각도가 달라지게 만듭니다.",
        ],
        thinkingQuestion:
          "빛이 밝을 때와 어두울 때 서보모터가 어느 각도로 움직이면 좋을까요?",
        activity: {
          type: "day03-servo-setup",
          title: "Sensor:Edge와 서보모터 연결",
          motorFigure: {
            title: "일반 모터와 서보모터 비교",
            image: "assets/day03/day03-motor-vs-servo.png",
            imageRole: "wide",
            imageAlt: "일반 모터의 연속 회전과 서보모터의 각도 이동을 비교한 그림",
            caption:
              "일반 모터는 계속 돌아가고, 서보모터는 정한 각도로 움직였다가 멈출 수 있습니다.",
          },
          sensorEdge: {
            title: "Sensor:Edge와 S·V·G",
            lines: [
              "Sensor:Edge는 여러 센서와 모터를 포트에 꽂아 사용할 수 있게 도와주는 보드입니다.",
              "포트의 S는 신호, V는 전원, G는 전원의 기준선입니다.",
              "센서와 모터를 연결할 때는 S·V·G 표시가 서로 맞는지 먼저 확인합니다.",
            ],
          },
          wiring: {
            title: "P1과 P2 연결 확인",
            lines: [
              "Sensor:Edge P1에는 외부 조도센서를 연결합니다.",
              "P1 외부 조도센서는 센서와 포트의 S·V·G 표시를 맞춰 연결합니다.",
              "Sensor:Edge P2에는 서보모터를 연결합니다.",
              "P2 서보모터는 노랑→S, 빨강→V, 갈색→G 순서로 맞춥니다.",
            ],
            figure: {
              title: "Sensor:Edge 배선 안내",
              image: "assets/day03/day03-sensor-edge-wiring.png",
              imageRole: "wide",
              imageAlt: "외부 조도센서 P1, 서보모터 P2, S·V·G 연결 안내 그림",
              caption:
                "외부 조도센서는 P1, 서보모터는 P2에 연결하고 S·V·G 표시를 맞춥니다.",
            },
          },
          servoBlockHelp: {
            summary: "블록 도움말 펼치기",
            title: "서보 출력 블록 찾기",
            lines: [
              "MakeCode에서 고급 메뉴를 펼친 뒤 핀 메뉴를 엽니다.",
              "서보 출력 블록을 찾아 P2 서보모터를 움직이는 코드에 사용합니다.",
            ],
            figure: {
              title: "서보 출력 블록 위치",
              image: "assets/day03/day03-servo-block-location.png",
              imageRole: "locator",
              imageAlt: "MakeCode 고급·핀 메뉴에서 서보 출력 블록을 찾는 화면",
              caption:
                "고급 메뉴의 핀에서 서보 출력 블록을 찾습니다.",
            },
          },
          angleTest: {
            title: "서보모터 각도 시험",
            lines: [
              "먼저 서보모터만 움직여 봅니다.",
              "30° → 90° → 150°처럼 서로 다른 각도로 움직이는지 확인합니다.",
              "아래에는 내 장치에서 사용할 두 각도를 적습니다.",
            ],
            figure: {
              title: "서보모터 각도 시험 코드",
              image: "assets/day03/day03-servo-angle-test.png",
              imageRole: "code-example",
              imageAlt: "P2 서보모터를 30도·90도·150도로 움직이는 코드",
              caption:
                "P2 서보모터가 30°, 90°, 150°로 움직이는지 먼저 시험합니다.",
            },
            fields: [
              {
                key: "servoAngleOne",
                label: "첫 번째 서보 각도",
                placeholder: "예: 30",
              },
              {
                key: "servoAngleTwo",
                label: "두 번째 서보 각도",
                placeholder: "예: 150",
              },
            ],
          },
        },
        checkpoint: [
          "Sensor:Edge P1에 외부 조도센서를 연결했다.",
          "Sensor:Edge P2에 서보모터를 연결했다.",
          "서보모터가 서로 다른 각도로 움직이는지 시험했다.",
        ],
        help: [
          "서보모터가 움직이지 않으면 P2에 꽂았는지 확인하세요.",
          "서보모터 선 색깔이 노랑→S, 빨강→V, 갈색→G로 맞는지 확인하세요.",
          "외부 조도센서는 P1에 꽂고 S·V·G 표시를 맞춰 연결하세요.",
        ],
      },
      {
        blockId: "block08",
        number: "08",
        shortTitle: "빛으로 움직이기",
        title: "외부 조도센서 값으로 서보모터 움직이기",
        position: {
          current: "외부 조도센서 측정과 기준 정하기",
          next: "오늘의 퀴즈",
        },
        explanation: [
          "Day02에서 사용한 측정 → 기준 설정 → 조건 판단 방법을 다시 사용합니다.",
          "하지만 오늘은 micro:bit의 내장 조도센서가 아니라 Sensor:Edge P1에 연결한 외부 조도센서를 사용합니다.",
          "외부 조도센서는 센서 모듈에 따라 밝을 때 숫자가 커지는 방향이 다를 수 있습니다. 그래서 실제로 밝을 때 값과 어두울 때 값을 측정한 뒤 조건을 정합니다.",
        ],
        thinkingQuestion:
          "내 외부 조도센서에서는 밝을 때와 어두울 때 숫자가 어느 쪽으로 달라질까요?",
        activity: {
          type: "day03-light-servo",
          title: "P1 값으로 P2 서보모터 움직이기",
          makeCode: {
            title: "MakeCode 바로가기",
            prompt: "오늘 사용할 프로젝트를 열거나 새 프로젝트를 시작합니다.",
            url: "https://makecode.microbit.org/",
            label: "🚀 MakeCode 열기 ↗",
          },
          analogBlockHelp: {
            summary: "P1의 아날로그 값을 읽는 블록 도움말 펼치기",
            title: "아날로그 입력 블록 찾기",
            lines: [
              "MakeCode에서 고급 메뉴를 펼친 뒤 핀 메뉴를 엽니다.",
              "아날로그 입력값을 읽는 블록을 찾습니다.",
            ],
            figure: {
              title: "아날로그 입력 블록 위치",
              image: "assets/day03/day03-analog-block-location.png",
              imageRole: "locator",
              imageAlt: "MakeCode 고급·핀 메뉴에서 아날로그 입력 블록을 찾는 화면",
              caption:
                "고급 메뉴의 핀에서 아날로그 입력값을 읽는 블록을 찾습니다.",
            },
          },
          p1Reading: {
            title: "P1 값 계속 표시하기",
            lines: [
              "아날로그 입력 핀을 P1으로 바꿉니다.",
              "계속 반복하기 안에서 P1의 아날로그 입력값을 숫자로 표시합니다.",
              "외부 조도센서를 손으로 가리거나 밝은 곳에 두고 숫자가 어떻게 달라지는지 봅니다.",
            ],
            figure: {
              title: "P1 아날로그 입력값 표시 코드",
              image: "assets/day03/day03-p1-light-reading.png",
              imageRole: "code-example",
              imageAlt: "P1 아날로그 입력값을 계속 표시하는 코드",
              caption:
                "핀을 P1으로 바꾸어 외부 조도센서 값을 계속 표시합니다.",
            },
          },
          measurements: [
            {
              key: "externalLightDarkValue",
              label: "외부 조도센서의 어두울 때 측정값",
              placeholder: "0~1023",
            },
            {
              key: "externalLightBrightValue",
              label: "외부 조도센서의 밝을 때 측정값",
              placeholder: "0~1023",
            },
          ],
          threshold: {
            key: "day03ThresholdValue",
            label: "Day03에서 새로 정한 기준값",
            placeholder: "예: 두 값 사이의 숫자",
          },
          direction: {
            title: "조건 방향 정하기",
            prompt: "내 외부 조도센서에서는 어느 쪽에서 숫자가 더 커졌나요?",
            options: [
              "밝을 때 숫자가 더 컸습니다.",
              "어두울 때 숫자가 더 컸습니다.",
            ],
            note:
              "센서 모듈에 따라 방향이 다를 수 있으므로 내가 직접 측정한 값으로 정합니다.",
          },
          finalCode: {
            title: "조건과 서보 각도 결합",
            lines: [
              "P1 값이 내가 정한 기준보다 큰지 또는 작은지 비교합니다.",
              "조건이 맞으면 P2 서보모터를 첫 번째 각도로 움직입니다.",
              "그렇지 않으면 P2 서보모터를 두 번째 각도로 움직입니다.",
            ],
            figure: {
              title: "외부 조도센서와 서보모터 조건 코드",
              image: "assets/day03/day03-light-servo-condition.png",
              imageRole: "code-example",
              imageAlt:
                "P1 값이 기준보다 클 때 P2를 30도, 아니면 150도로 움직이는 코드",
              caption:
                "P1 값을 기준과 비교해 P2 서보모터가 서로 다른 각도로 움직이게 합니다.",
            },
          },
          tests: [
            {
              key: "dark",
              title: "어두운 상태 시험",
              guide: "외부 조도센서를 손이나 종이로 가리고 P2 서보모터 위치를 확인합니다.",
              prompt: "어두운 상태에서 내가 예상한 각도로 움직였나요?",
              options: [
                "네, 예상한 대로 움직였습니다.",
                "움직였지만 예상과 달랐습니다.",
                "움직이지 않았습니다.",
              ],
            },
            {
              key: "bright",
              title: "밝은 상태 시험",
              guide: "외부 조도센서를 밝은 곳에 두고 P2 서보모터 위치를 확인합니다.",
              prompt: "밝은 상태에서 내가 예상한 각도로 움직였나요?",
              options: [
                "네, 예상한 대로 움직였습니다.",
                "움직였지만 예상과 달랐습니다.",
                "움직이지 않았습니다.",
              ],
            },
          ],
          confirmLabel: "P1 조건 변화로 P2 위치가 달라졌어요",
          confirmationGuide: [
            "어두운 상태와 밝은 상태에서 P1 값이 달라지는지 확인합니다.",
            "그 차이 때문에 P2 서보모터 위치가 한 번 이상 달라졌다면 아래 버튼을 누릅니다.",
          ],
          revise: {
            title: "오류 수정하기",
            lines: [
              "원하는 각도로 움직이지 않으면 P1 값, 기준값, 조건 방향, P2 연결을 다시 확인합니다.",
              "조건 방향이 반대로 되어 있으면 밝을 때와 어두울 때 움직임이 서로 바뀔 수 있습니다.",
            ],
          },
          changeOptions: [
            "기준값을 바꾸었다",
            "서보 각도를 바꾸었다",
            "조건 방향을 바꾸었다",
            "센서 위치를 바꾸었다",
            "기타",
          ],
          changeOtherPlaceholder: "직접 바꾼 내용을 짧게 적기",
        },
        checkpoint: [
          "외부 조도센서의 어두울 때 값과 밝을 때 값을 측정했다.",
          "두 값 사이에서 Day03의 새 기준값을 정했다.",
          "조건에 따라 P2 서보모터 위치가 달라지는지 시험했다.",
        ],
        help: [
          "P1 값이 0~1023 범위를 벗어나면 다시 측정해 보세요.",
          "기준값은 밝을 때 값과 어두울 때 값 사이에서 정해 보세요.",
          "밝을 때와 어두울 때 움직임이 반대로 보이면 조건의 크다/작다 방향을 바꾸어 보세요.",
        ],
      },
    ],
    day06: [
      {
        blockId: "block13",
        number: "13",
        shortTitle: "해결방법 3개 펼치기",
        title: "같은 문제를 어떻게 다르게 해결할까?",
        position: {
          current: "해결방법 3개 펼치기",
          next: "무엇을 만들 것인가?",
        },
        explanation: [
          "하나의 문제에도 해결방법은 여러 가지가 있을 수 있습니다.",
          "처음 떠오른 생각만 바로 선택하면 더 좋은 방법을 놓칠 수 있습니다.",
          "그래서 오늘은 같은 문제를 해결하는 서로 다른 방법을 세 가지 생각해 봅니다.",
        ],
        thinkingQuestion:
          "같은 사람의 같은 불편을 서로 다른 방법으로 도울 수 있을까요?",
        activity: {
          type: "idea-list",
          title: "해결 아이디어 적기",
          fields: [
            {
              id: "idea-1",
              label: "아이디어 1",
              placeholder: "예: 위험한 상황을 감지하면 소리로 알려주는 장치",
            },
            {
              id: "idea-2",
              label: "아이디어 2",
              placeholder: "예: 버튼을 누르면 가족에게 신호를 보내는 장치",
            },
            {
              id: "idea-3",
              label: "아이디어 3",
              placeholder: "예: 움직임이 없을 때 LED로 상태를 알려주는 장치",
            },
          ],
        },
        checkpoint: [
          "같은 문제를 해결하는 아이디어를 3개 만들었다.",
          "세 아이디어가 완전히 같은 방법은 아니다.",
          "각 아이디어가 누구의 어떤 불편을 돕는지 설명할 수 있다.",
        ],
        helpSummary: "아이디어가 잘 떠오르지 않나요?",
        help: [
          "센서로 알아차리게 할 수 있을까?",
          "빛이나 소리로 알려줄 수 있을까?",
          "움직임을 사용할 수 있을까?",
          "다른 장치에 정보를 보낼 수 있을까?",
          "지금까지 배운 기술 중 사용할 것이 있을까?",
        ],
      },
      {
        blockId: "block14",
        number: "14",
        shortTitle: "무엇을 만들 것인가?",
        title: "어떤 아이디어를 실제로 만들까?",
        position: {
          current: "무엇을 만들 것인가?",
          next: "오늘의 퀴즈",
        },
        explanation: [
          "아이디어가 많다고 모두 만들 수 있는 것은 아닙니다.",
          "어떤 방법이 문제를 더 잘 해결하는지, 내가 실제로 만들어 시험할 수 있는지 비교해 보아야 합니다.",
        ],
        thinkingQuestion:
          "문제를 잘 해결하면서 실제로 만들어 볼 수 있는 아이디어는 무엇일까요?",
        activity: {
          type: "idea-comparison",
          title: "아이디어 비교하기",
          ideas: ["아이디어 1", "아이디어 2", "아이디어 3"],
          criteria: [
            {
              id: "help",
              title: "도움 정도",
              question: "이 아이디어가 문제를 얼마나 잘 해결할까?",
              options: ["잘 돕는다", "조금 돕는다", "다시 생각해 봐야 한다"],
            },
            {
              id: "possible",
              title: "제작 가능성",
              question: "지금 배우고 사용할 수 있는 기술로 만들 수 있을까?",
              options: ["만들 수 있을 것 같다", "도움이 필요하다", "지금은 만들기 어렵다"],
            },
          ],
          finalChoice: {
            label: "내가 실제로 만들어 볼 아이디어",
            options: ["아이디어 1", "아이디어 2", "아이디어 3"],
            reasonLabel: "이 아이디어를 선택한 가장 중요한 이유",
            reasonPlaceholder:
              "예: 실제로 만들 수 있고, 도움이 필요한 상황을 잘 알려줄 수 있기 때문이다",
          },
        },
        checkpoint: [
          "세 아이디어를 비교했다.",
          "실제로 만들어 볼 하나를 선택했다.",
          "선택한 이유를 설명할 수 있다.",
        ],
        helpSummary: "비교가 어렵나요?",
        help: [
          "가장 재미있는 아이디어만 고르기보다 문제를 잘 해결하는지 먼저 살펴보세요.",
          "지금 배운 기술로 시험해 볼 수 있는지도 함께 생각해 보세요.",
        ],
      },
    ],
  };

  const DAY_LESSONS = {
    day01: {
      dayId: "day01",
      dayType: "first",
      flowStartId: "today-research",
      todayResearch: {
        label: "연구 01",
        title: "첫 번째 연구를 시작합니다",
        coreStatement: "기술은 어떤 문제를 해결할 수 있을까요?",
        question:
          "문제를 찾아보고, MakeCode로 코딩한 뒤 micro:bit로 보내 실제 장치를 움직여 봅니다.",
        blocks: [
          { number: "①", title: "문제 발견하기", challengeId: "problem" },
          { number: "②", title: "기술 도구 얻기", challengeId: "tools" },
          { number: "③", title: "내 장치 만들기", challengeId: "device" },
        ],
        outcome: "코드 링크와 오늘의 연구 모습 영상이 담긴 첫 연구 증거",
        nextConnection:
          "다음에는 빛이나 온도처럼 주변의 상태를 장치가 어떻게 알아차리는지 연구합니다.",
      },
      lessonBlocks: LESSON_BLOCKS.day01,
      evidence: {
        title: "연구 증거함",
        description:
          "오늘 활동 중 남긴 증거가 자동으로 모입니다. 가짜 업로드 완료 표시는 하지 않습니다.",
      },
      quiz: {
        title: "오늘의 퀴즈",
        description:
          "오늘 연구에서 사용한 생각을 짧게 확인합니다. 틀려도 다음 화면으로 이동할 수 있습니다.",
        questions: [
          {
            id: "technology-purpose",
            type: "choice",
            prompt: "기술은 무엇을 위해 사용할까요?",
            choices: [
              { text: "문제를 해결하기 위해", correct: true },
              { text: "어려운 말을 외우기 위해", correct: false },
              { text: "화면을 꾸미기 위해", correct: false },
            ],
            explanation: "기술은 사람이나 환경의 문제를 해결하는 데 사용할 수 있습니다.",
          },
          {
            id: "input-process-output",
            type: "matching",
            prompt: "입력·처리·출력의 흐름을 연결해 보세요.",
            options: ["입력", "처리", "출력"],
            pairs: [
              { id: "button", text: "A 버튼 누르기", answer: "입력" },
              { id: "program", text: "프로그램에 정한 규칙", answer: "처리" },
              { id: "led", text: "LED 표시", answer: "출력" },
            ],
            explanation:
              "장치는 입력을 받고, 프로그램에 정한 규칙대로 처리한 뒤, 출력으로 반응을 보여 줍니다.",
          },
          {
            id: "shake-input",
            type: "choice",
            prompt: "버튼을 누르지 않아도 마이크로비트가 흔들린 것을 알아차릴 수 있을까요?",
            choices: [
              { text: "있다", correct: true },
              { text: "없다", correct: false },
            ],
            explanation: "흔들기도 마이크로비트가 알아차릴 수 있는 입력입니다.",
          },
          {
            id: "resend-updated-code",
            type: "choice",
            prompt:
              "MakeCode에서 코드를 고친 뒤, 실제 micro:bit도 바뀐 코드로 작동하게 하려면 무엇을 해야 할까요?",
            choices: [
              { text: "바꾼 코드를 다시 micro:bit로 보낸다.", correct: true },
              { text: "컴퓨터 화면을 닫는다.", correct: false },
              { text: "잠시 기다리면 자동으로 바뀐다.", correct: false },
              { text: "프로젝트 이름을 바꾼다.", correct: false },
            ],
            explanation:
              "컴퓨터에서 코드를 바꾸기만 하면 실제 micro:bit는 바로 바뀌지 않습니다. 바꾼 코드를 다시 micro:bit로 보내야 합니다.",
          },
        ],
      },
      record: {
        title: "연구기록",
        fields: [
          {
            id: "favorite-tool",
            label: "오늘 가장 많이 사용한 도구",
            type: "select",
            options: ["버튼 입력", "흔들기 입력", "LED 출력", "LED 직접 그리기"],
          },
          {
            id: "next-sensor",
            label: "다음 연구에서 알아보고 싶은 주변 상태",
            type: "text",
            placeholder: "예: 빛, 온도, 움직임",
          },
        ],
      },
      complete: {
        title: "첫 번째 연구 완료",
        gained: "버튼 입력 · 흔들기 입력 · LED 출력",
        summaryLines: [
          "문제를 발견했습니다.",
          "장치가 입력을 받아 반응하게 만들었습니다.",
          "버튼과 흔들기를 사용했습니다.",
          "내가 원하는 방식으로 코드를 바꾸고 시험했습니다.",
          "코드와 오늘의 연구 모습 영상을 연구 증거로 남겼습니다.",
        ],
        nextTitle: "센서로 현실 읽기",
        nextSummary:
          "다음에는 빛이나 온도처럼 주변의 상태를 장치가 어떻게 알아차리는지 연구합니다.",
      },
    },
    day02: {
      dayId: "day02",
      dayType: "standard",
      flowStartId: "research-bridge",
      bridge: {
        recall: {
          title: "지난 연구에서는",
          lines: [
            "지난 연구에서는 사람이 버튼을 누르면 micro:bit가 반응했습니다.",
            "사람이 누르지 않아도 주변 상황을 알아차릴 수 있을까요?",
          ],
        },
        carry: {
          title: "지난 연구에서 나는",
          previousDayId: "day01",
          fallbackResult:
            "버튼을 누르면 LED가 다르게 반응하는 장치를 만들었습니다.",
          reusableIdea: "장치가 알아차린 신호에 맞춰 LED 반응을 바꾸기",
        },
        connect: {
          title: "연결하기",
          todayTitle: "오늘의 연구: 센서로 현실 읽기",
          lines: [
            "오늘은 micro:bit가 주변 밝기를 숫자로 읽어 봅니다.",
            "빛의 세기는 0부터 255까지이고, 0에 가까울수록 어둡고 255에 가까울수록 밝습니다.",
            "그리고 내가 정한 기준값과 비교해 밝을 때와 어두울 때 스스로 다르게 반응하게 만듭니다.",
          ],
        },
      },
      todayResearch: {
        label: "연구 02",
        title: "센서로 현실 읽기",
        coreStatement:
          "micro:bit는 주변 밝기를 0부터 255까지의 숫자로 읽을 수 있습니다.",
        question:
          "빛의 세기를 보고 장치가 스스로 작동하게 하려면 어떤 기준이 필요할까요?",
        blocks: [
          { number: "04", title: "빛을 숫자로 읽기" },
          { number: "05", title: "내 기준값 정하기" },
          { number: "06", title: "스스로 반응하게 만들기" },
        ],
        outcome: "빛에 따라 스스로 반응하는 micro:bit",
        nextConnection: "다음에는 장치의 반응을 움직임과 통신으로 넓혀 봅니다.",
      },
      lessonBlocks: LESSON_BLOCKS.day02,
      freeChange: {
        title: "마음대로 바꾸기",
        description:
          "기본 작동에 성공했다면 이제 내 방식으로 바꾸어 보세요.",
        lead: [
          "기본 연구를 끝냈다면",
          "이제 내 장치를 원하는 방식으로 바꾸어 보세요.",
          "정답은 없습니다.",
          "한 가지를 바꾸고 → 실행하고 → 결과를 확인해 보세요.",
        ],
        options: [
          "기준값 바꾸기",
          "어두울 때 그림 바꾸기",
          "밝을 때 그림 바꾸기",
          "그림 대신 숫자나 글자 표시하기",
          "반응을 반대로 만들기",
          "기타",
        ],
        otherPlaceholder: "바꾼 내용을 짧게 적기",
        advancedPrompt: "더 해보고 싶다면 어두움 / 보통 / 밝음 3단계 조건을 시험해 보세요.",
        peerCompare: {
          title: "발전 연구 · 친구의 기준과 비교하기",
          prompt: "친구와 서로의 기준값을 확인해 보세요.",
          compareQuestion: "같은 교실인데도 기준값이 같았나요?",
          compareOptions: ["같았어요", "달랐어요"],
          reasonQuestion: "왜 다를 수 있을까요?",
          reasonOptions: [
            "측정한 장소와 빛이 달랐기 때문에",
            "모든 micro:bit는 반드시 같은 기준을 사용해야 하기 때문에",
          ],
          correctReason: "측정한 장소와 빛이 달랐기 때문에",
          feedback:
            "주변 환경과 사용 목적이 다르면 필요한 기준도 달라질 수 있습니다. 그래서 실제 장치를 만들 때도 측정하고 → 기준을 정하고 → 시험하는 과정이 중요합니다.",
        },
      },
      makeCodeEvidence: {
        title: "MakeCode 작품 링크 남기기",
        prompt:
          "내가 만든 MakeCode 작품의 공유 주소를 남기면 나중에 다시 열어 볼 수 있습니다.",
        successFeedback: "MakeCode 작품 링크 저장 완료 ✓",
      },
      videoEvidence: {
        type: "webcam-evidence",
        blockId: "block06",
        title: "연구 모습 영상 남기기",
        prompt:
          "micro:bit를 밝게 둔 모습과 LED 화면을 손이나 종이로 덮은 모습을 모두 보여주세요. 두 상태에서 반응이 다르게 보이면 됩니다. 권장 20~30초, 최대 30초입니다.",
      },
      quiz: {
        title: "오늘의 퀴즈",
        description:
          "오늘 연구에서 사용한 생각을 짧게 확인합니다. 틀려도 설명을 읽고 다시 생각하면 됩니다.",
        questions: [
          {
            id: "sensor-role",
            prompt: "센서가 하는 일은 무엇일까요?",
            choices: [
              { text: "LED를 예쁘게 꾸민다.", correct: false },
              { text: "현실의 상태를 컴퓨터가 사용할 수 있는 값으로 바꾼다.", correct: true },
              { text: "컴퓨터의 전원을 켠다.", correct: false },
              { text: "프로그램을 자동으로 만든다.", correct: false },
            ],
            explanation:
              "오늘은 micro:bit가 주변 밝기를 숫자로 읽었습니다.",
          },
          {
            id: "threshold-purpose",
            prompt: "기준값이 필요한 이유는 무엇일까요?",
            choices: [
              { text: "LED 색깔을 정하기 위해", correct: false },
              { text: "어느 상태에서 다르게 반응할지 판단하기 위해", correct: true },
              { text: "micro:bit를 충전하기 위해", correct: false },
              { text: "LED 개수를 세기 위해", correct: false },
            ],
            explanation:
              "기준값은 밝음과 어두움처럼 다르게 반응할 상태를 나누는 판단 기준입니다.",
          },
          {
            id: "sensor-device-flow",
            prompt: "오늘 만든 장치의 흐름에 가장 가까운 것은?",
            choices: [
              { text: "LED → 빛 → 버튼", correct: false },
              { text: "빛의 세기 → 기준값과 비교 → LED", correct: true },
              { text: "USB → 마우스 → LED", correct: false },
              { text: "버튼 → 인터넷 → LED", correct: false },
            ],
            explanation:
              "빛의 세기를 기준값과 비교한 뒤 LED 출력이 달라집니다.",
          },
          {
            id: "sensor-future-use",
            prompt: "오늘 배운 센서는 나중에 왜 필요할까요?",
            choices: [
              { text: "장치가 주변 상황을 스스로 알아차리는 데 사용할 수 있어서", correct: true },
              { text: "모든 작품에 반드시 밝기 기능만 써야 해서", correct: false },
              { text: "컴퓨터 없이 코딩할 수 있어서", correct: false },
              { text: "3D 프린터를 움직여서", correct: false },
            ],
            explanation:
              "센서는 장치가 주변 상황을 스스로 알아차리도록 도와줍니다.",
          },
          {
            id: "sensor-retest",
            prompt:
              "센서 장치가 어떤 장소에서는 예상과 다르게 작동했습니다. 가장 좋은 다음 행동은 무엇일까요?",
            choices: [
              { text: "micro:bit를 바로 고장 난 것으로 생각한다.", correct: false },
              { text: "센서값을 다시 확인하고 기준값을 조절한 뒤 다시 시험한다.", correct: true },
              { text: "항상 같은 숫자가 나오도록 센서를 가린다.", correct: false },
              { text: "조건 블록을 모두 삭제한다.", correct: false },
            ],
            explanation:
              "센서값은 주변 환경에 따라 달라집니다. 예상과 다르게 작동하면 값을 다시 확인하고 → 기준을 고치고 → 다시 시험할 수 있습니다.",
          },
        ],
      },
      record: {
        title: "간단 연구기록 / 다음 연구 안내",
        fields: [],
      },
      complete: {
        title: "오늘의 연구 결과",
        gained: "빛에 따라 스스로 반응하는 micro:bit",
        summaryLines: [
          "micro:bit가 빛의 세기를 숫자로 읽는 것을 관찰했습니다.",
          "내 기준값으로 밝음과 어두움을 나누었습니다.",
          "밝은 상태와 어두운 상태에서 LED 화면이 다르게 반응하도록 만들었습니다.",
        ],
        nextTitle: "움직이고 연결하기",
        nextSummary:
          "오늘 만든 센서의 반응을 움직임이나 다른 장치와 연결해 봅니다.",
      },
    },
    day03: {
      dayId: "day03",
      dayType: "standard",
      flowStartId: "research-bridge",
      bridge: {
        recall: {
          title: "지난 연구에서는",
          question: "Day02에서 micro:bit가 읽은 빛의 세기는 어떤 센서였나요?",
          choices: [
            { text: "micro:bit의 내장 조도센서", correct: true },
            { text: "Sensor:Edge P1의 외부 조도센서", correct: false },
            { text: "P2에 연결한 서보모터", correct: false },
          ],
          correctFeedback:
            "맞아요. Day02에서는 micro:bit의 내장 조도센서로 0~255 범위의 값을 읽었습니다.",
          incorrectFeedback:
            "다시 생각해 보세요. Day02에서는 micro:bit 안에 있는 내장 조도센서를 사용했습니다.",
        },
        carry: {
          title: "지난 연구에서 나는",
          previousDayId: "day02",
          fallbackResult:
            "micro:bit의 내장 조도센서 값을 기준값과 비교해 밝을 때와 어두울 때 LED가 다르게 반응하도록 만들었습니다.",
          reusableIdea: "측정 → 기준 설정 → 조건 판단",
        },
        connect: {
          question: "Day03에서 새로 정하는 것은 무엇일까요?",
          choices: [
            { text: "외부 조도센서의 값과 새 기준값", correct: true },
            { text: "Day02에서 쓰던 기준값", correct: false },
            { text: "micro:bit 내장 조도센서의 위치", correct: false },
          ],
          correctFeedback:
            "맞아요. 오늘은 P1 외부 조도센서의 어두울 때 값, 밝을 때 값, 새 기준값을 직접 정합니다.",
          incorrectFeedback:
            "다시 생각해 보세요. 오늘은 외부 조도센서를 새로 측정하고 Day03 기준값을 정합니다.",
        },
      },
      todayResearch: {
        label: "연구 03",
        title: "움직이고 연결하기",
        coreStatement:
          "Sensor:Edge P1 외부 조도센서 값을 기준과 비교해 P2 서보모터가 서로 다른 각도로 움직이게 만듭니다.",
        question:
          "외부 조도센서의 밝음·어두움 값을 어떻게 기준으로 나누고 움직임으로 연결할 수 있을까요?",
        blocks: [
          { number: "07", title: "외부 장치를 연결하고 서보모터 움직이기" },
          { number: "08", title: "외부 조도센서 값으로 서보모터 움직이기" },
        ],
        outcome: "빛의 변화에 따라 움직이는 서보모터 장치",
        nextConnection:
          "다음에는 AI가 정보를 분류하고 결과를 만드는 과정을 살펴봅니다.",
      },
      lessonBlocks: [],
      makeCodeEvidence: {
        title: "MakeCode 작품 링크 남기기",
        prompt: "",
        successFeedback: "MakeCode 작품 링크 저장 완료 ✓",
      },
      videoEvidence: {
        type: "webcam-evidence",
        blockId: "block08",
        title: "연구 모습 영상 남기기",
        prompt:
          "외부 조도센서를 밝게 둔 모습과 어둡게 만든 모습을 모두 보여주세요. 두 상태에서 P2 서보모터 위치가 달라지면 됩니다. 권장 20~30초, 최대 30초입니다.",
      },
      quiz: {
        title: "오늘의 퀴즈",
        description: "",
        questions: [
          {
            id: "day03-sensor-difference",
            prompt: "지난 시간과 오늘 사용한 조도센서의 차이로 알맞은 것은?",
            choices: [
              {
                text: "① 지난 시간은 내장 조도센서, 오늘은 P1에 연결한 외부 조도센서를 사용한다.",
                correct: true,
              },
              { text: "② 두 시간 모두 P1 외부 조도센서만 사용한다.", correct: false },
              { text: "③ 오늘은 조도센서를 사용하지 않는다.", correct: false },
            ],
            explanation: "정답: ①",
            correctFeedback: "정답: ①",
            incorrectFeedback: "정답: ①",
          },
          {
            id: "day03-p1-connect-check",
            prompt: "외부 조도센서를 P1에 연결할 때 확인할 것은 무엇인가요?",
            choices: [
              { text: "① S·V·G가 같은 표시와 연결되었는지 확인한다.", correct: true },
              { text: "② 선의 길이만 확인한다.", correct: false },
              { text: "③ P1과 P2에 동시에 연결한다.", correct: false },
            ],
            explanation: "정답: ①",
            correctFeedback: "정답: ①",
            incorrectFeedback: "정답: ①",
          },
          {
            id: "day03-day02-threshold",
            prompt: "Day02의 기준값을 오늘 그대로 사용하지 않는 이유는 무엇인가요?",
            choices: [
              {
                text: "① 센서의 종류와 값의 범위가 달라서 오늘 다시 측정해야 하기 때문이다.",
                correct: true,
              },
              { text: "② 서보모터에는 숫자가 필요 없기 때문이다.", correct: false },
              { text: "③ 지난 연구는 오늘 연구와 관계가 없기 때문이다.", correct: false },
            ],
            explanation: "정답: ①",
            correctFeedback: "정답: ①",
            incorrectFeedback: "정답: ①",
          },
          {
            id: "day03-servo-s-wire",
            prompt: "서보모터의 S선은 어떤 역할을 하나요?",
            choices: [
              { text: "① 어느 위치로 움직일지 명령 신호를 전달한다.", correct: true },
              { text: "② 빛을 측정한다.", correct: false },
              { text: "③ 사진을 저장한다.", correct: false },
            ],
            explanation: "정답: ①",
            correctFeedback: "정답: ①",
            incorrectFeedback: "정답: ①",
          },
          {
            id: "day03-retest-method",
            prompt: "예상한 것과 실제 움직임이 다르다면 가장 알맞은 연구 방법은?",
            choices: [
              { text: "① 모두 지우고 처음부터 다시 만든다.", correct: false },
              {
                text: "② 연결·센서값·조건·각도를 확인하고 필요한 부분을 고쳐 다시 시험한다.",
                correct: true,
              },
              { text: "③ 작동했다고 기록하고 넘어간다.", correct: false },
            ],
            explanation: "정답: ②",
            correctFeedback: "정답: ②",
            incorrectFeedback: "정답: ②",
          },
        ],
      },
      record: {
        title: "오늘의 연구기록",
        fields: [
          {
            id: "day03-finding",
            key: "day03Finding",
            label: "오늘 확인한 작동 결과",
            type: "textarea",
            placeholder:
              "예: 어두울 때는 30도, 밝을 때는 150도로 움직이도록 만들었다.",
          },
          {
            id: "day03-next-use",
            key: "day03NextUse",
            label: "다음에 활용할 생각",
            type: "text",
            placeholder:
              "예: 빛이 달라지면 문이 열리거나 알림판이 움직이는 장치",
          },
        ],
      },
      complete: {
        title: "오늘 연구 정리",
        gained: "외부 조도센서 · 기준값 · 서보모터 움직임",
        summaryLines: [
          "Day02의 측정 → 기준 설정 → 조건 판단 방법을 다시 사용했습니다.",
          "P1 외부 조도센서의 밝음·어두움 값을 측정하고 Day03 기준값을 정했습니다.",
          "조건에 따라 P2 서보모터가 서로 다른 각도로 움직이도록 만들었습니다.",
        ],
        nextTitle: "AI는 어떻게 배우는가",
        nextSummary:
          "다음 연구에서는 AI가 정보를 분류하고 결과를 만드는 과정을 살펴봅니다.",
      },
    },
    day06: {
      dayId: "day06",
      dayType: "reload",
      flowStartId: "project-reload",
      projectReload: {
        recall: {
          title: "나의 프로젝트 다시 불러오기",
          lead: [
            "약 한 달 전,",
            "나는 누구의 어떤 불편을 해결하려고 했을까요?",
          ],
          fields: [
            {
              id: "helper",
              label: "내가 돕고 싶었던 사람",
              placeholder: "예: 혼자 계신 할머니",
            },
            {
              id: "difficulty",
              label: "그 사람이 겪는 불편",
              placeholder: "예: 위험할 때 도움을 요청하기 어렵다",
            },
          ],
          actionLabel: "내 기록 확인하기 →",
        },
        previousRecord: {
          title: "지난 연구에서 내가 정한 문제",
          previousDayId: "day05",
          problemDefinitionField: "problemDefinition",
          nextActionField: "nextAction",
          fallbackProblemDefinition:
            "나는 할머니가 혼자 계실 때 위험한 상황에서 도움을 요청하기 어려운 불편을 해결하고 싶습니다.",
          fallbackNextAction: "해결방법을 여러 개 생각해 보기",
        },
        evidence: {
          title: "왜 이 문제를 골랐을까요?",
          memoLabel: "그때 남긴 메모",
          memoField: "selectionReason",
          fallbackMemo:
            "위험할 때 바로 도움을 요청하기 어려울 수 있다고 생각했다.",
          materialsSummary: "당시 자료 보기",
          materials: [
            "개인 관찰 기록: 혼자 있을 때 바로 도움을 부르기 어려운 상황",
            "관심 기술: 버튼 입력, 센서값, LED나 소리 알림",
            "다음 연구 메모: 여러 해결방법을 비교해 보기",
          ],
        },
        explain: {
          title: "친구에게 설명하기",
          lead: "이제 친구에게 내 프로젝트를 설명해 보세요.",
          guide: "30초 동안 세 가지만 말합니다.",
          points: [
            "누구를 돕고 싶은가?",
            "어떤 불편을 해결하려는가?",
            "왜 이 문제를 선택했는가?",
          ],
          checkboxLabel: "친구에게 설명했습니다.",
        },
        connect: {
          title: "오늘 연구로 연결",
          lead: "내가 해결하려던 문제를 다시 찾았습니다.",
          paragraphs: [
            "하지만 같은 문제도 여러 가지 방법으로 해결할 수 있습니다.",
            "처음 떠오른 방법 하나를 바로 만들기보다 여러 해결방법을 비교해 보는 것이 필요합니다.",
          ],
          todayTitle: "아이디어 비교하기",
          blocks: [
            "13 해결방법 3개 펼치기",
            "14 무엇을 만들 것인가?",
          ],
          nextConnection:
            "다음 연구에서는 선택한 아이디어를 실제로 작동하게 만들 제작계획을 세웁니다.",
          actionLabel: "오늘 연구 확인하기 →",
        },
      },
      todayResearch: {
        label: "연구 06",
        title: "아이디어 비교하기",
        coreStatement:
          "같은 문제도 여러 가지 방법으로 해결할 수 있습니다.",
        question:
          "그렇다면 어떤 아이디어를 실제로 만들어 볼지 어떻게 정해야 할까요?",
        blocks: [
          { number: "13", title: "해결방법 3개 펼치기" },
          { number: "14", title: "무엇을 만들 것인가?" },
        ],
        outcome: "최종 선택안 + 선택 이유",
        nextConnection:
          "다음에는 선택한 아이디어를 입력·조건·출력 구조의 제작계획으로 바꿉니다.",
      },
      lessonBlocks: LESSON_BLOCKS.day06,
      quiz: {
        title: "오늘의 퀴즈",
        description:
          "오늘 연구에서 비교하고 선택한 생각을 짧게 확인합니다. 틀려도 설명을 읽고 다시 생각하면 됩니다.",
        questions: [
          {
            prompt: "같은 문제를 해결할 때 왜 여러 아이디어를 떠올려 보아야 하나요?",
            choices: [
              { text: "더 좋은 해결방법을 놓치지 않기 위해서", correct: true },
              { text: "기록할 칸을 모두 채우기 위해서", correct: false },
              { text: "처음 생각한 아이디어를 지우기 위해서", correct: false },
            ],
            explanation:
              "처음 떠오른 방법만 바로 선택하면 문제를 더 잘 해결할 수 있는 다른 방법을 놓칠 수 있습니다.",
          },
          {
            prompt: "처음 떠오른 아이디어를 바로 선택하지 않고 비교하는 이유는 무엇인가요?",
            choices: [
              { text: "도움 정도와 제작 가능성을 함께 보기 위해서", correct: true },
              { text: "가장 신기한 아이디어만 고르기 위해서", correct: false },
              { text: "다음 연구를 하지 않기 위해서", correct: false },
            ],
            explanation:
              "좋은 아이디어는 문제를 잘 해결하면서 실제로 만들어 시험해 볼 수 있어야 합니다.",
          },
          {
            prompt: "아이디어를 비교할 때 도움 정도와 제작 가능성을 함께 보는 까닭은 무엇인가요?",
            choices: [
              { text: "잘 돕지만 만들기 어려운 방법과 만들 수 있지만 도움이 적은 방법을 구분하기 위해서", correct: true },
              { text: "점수를 많이 얻기 위해서", correct: false },
              { text: "아이디어를 하나도 선택하지 않기 위해서", correct: false },
            ],
            explanation:
              "문제를 얼마나 잘 해결하는지와 지금 만들 수 있는지를 함께 보아야 실제 프로젝트로 이어질 수 있습니다.",
          },
          {
            prompt: "오늘 선택한 아이디어는 다음 연구에서 어떻게 사용되나요?",
            choices: [
              { text: "입력·조건·출력 구조의 제작계획으로 바꾼다.", correct: true },
              { text: "다음 연구에서 사용하지 않는다.", correct: false },
              { text: "발표회 제목으로만 사용한다.", correct: false },
            ],
            explanation:
              "다음 연구에서는 선택한 아이디어가 실제로 작동하도록 입력, 조건, 출력을 구체적으로 정합니다.",
          },
        ],
      },
      record: {
        title: "오늘의 연구기록",
        fields: [
          {
            id: "role",
            label: "오늘 맡은 역할",
            type: "select",
            options: [
              "연구 진행자",
              "문제 관찰자",
              "기술 점검자",
              "질문 연구원",
              "사용자 연구원",
              "시험 기록자",
            ],
          },
          {
            id: "work",
            label: "오늘 내가 한 일",
            type: "checkbox-group",
            options: [
              "지난 문제를 다시 확인했다.",
              "해결 아이디어를 3개 만들었다.",
              "아이디어를 비교했다.",
              "최종 아이디어를 선택했다.",
              "선택 이유를 설명했다.",
            ],
          },
          {
            id: "decision",
            label: "최종 선택한 아이디어",
            type: "text",
            placeholder: "예: 위험 상황을 감지하면 소리와 빛으로 알려주는 장치",
            readonly: true,
            source: "finalIdea",
            helpText: "block14에서 선택한 아이디어가 자동으로 들어갑니다.",
          },
          {
            id: "finding",
            label: "어려웠던 점이나 새롭게 발견한 것",
            type: "textarea",
            placeholder:
              "예: 처음 생각한 아이디어보다 두 번째 아이디어가 실제로 만들기 쉬웠다.",
          },
          {
            id: "next",
            label: "다음 연구에서 할 일",
            type: "text",
            placeholder: "선택한 아이디어의 입력·조건·출력을 정하기",
          },
        ],
      },
      complete: {
        title: "오늘 연구 정리",
        gained: "최종 선택안과 선택 이유",
        summaryLines: [
          "한 가지 문제를 여러 방법으로 생각하고,",
          "도움 정도와 제작 가능성을 비교해",
          "실제로 만들어 볼 아이디어를 선택했습니다.",
        ],
        nextTitle: "제작계획 세우기",
        nextSummary:
          "선택한 아이디어를 입력 → 조건 → 출력 구조로 설계합니다.",
      },
    },
  };

  window.RESEARCH_DAYS = RESEARCH_DAYS;
  window.LESSON_BLOCKS = LESSON_BLOCKS;
  window.DAY_LESSONS = DAY_LESSONS;
})();
