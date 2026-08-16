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
        "센서가 주변의 상태를 어떻게 값으로 알아보는지 관찰합니다. 처리 단계에서 기준값과 조건을 사용해 장치가 반응하게 만들어 봅니다.",
      dayType: "standard",
      phaseNotice: "",
      specialNotice: "",
    },
    {
      dayId: "day03",
      dayNo: 3,
      title: "움직이고 연결하기",
      phase: "기술 익히기",
      todayDescription:
        "장치를 움직이거나 다른 장치와 정보를 주고받는 방법을 연구합니다. 앞으로 내 작품에 필요한 움직임이나 통신 기능을 선택할 수 있는 경험을 쌓습니다.",
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
        shortTitle: "센서값 관찰하기",
        title: "센서는 무엇을 값으로 바꿀까?",
        position: {
          current: "센서값 관찰하기",
          next: "작동 기준 정하기",
        },
        explanation: [
          "센서는 빛, 소리, 기울기처럼 주변의 상태를 컴퓨터가 사용할 수 있는 값으로 바꾸어 줍니다.",
          "같은 센서라도 주변 상태가 달라지면 값도 달라질 수 있습니다. 그래서 한 번만 보고 판단하지 않고 여러 번 확인해야 합니다.",
        ],
        thinkingQuestion: "주변 상태를 바꾸면 센서값은 어떻게 달라질까요?",
        judgementCheck: {
          prompt: "센서값을 여러 번 확인하는 이유는 무엇일까요?",
          choices: [
            {
              text: "값이 항상 같다는 것을 외우기 위해서",
              correct: false,
            },
            {
              text: "상태가 달라질 때 값이 어떻게 변하는지 알기 위해서",
              correct: true,
            },
            {
              text: "화면에 더 많은 숫자를 표시하기 위해서",
              correct: false,
            },
          ],
          correctFeedback:
            "맞아요. 주변 상태가 달라질 때 센서값이 어떻게 변하는지 알아야 나중에 기준을 정할 수 있습니다.",
          incorrectFeedback:
            "다시 생각해 봅시다. 센서값은 주변 상태에 따라 달라질 수 있으므로 여러 상황의 값을 비교해야 합니다.",
        },
        taskTitle: "해보기",
        tasks: [
          "센서값이 화면에 나타나도록 확인합니다.",
          "주변 상태를 한 가지 바꾸어 봅니다.",
          "바꾼 뒤의 센서값을 다시 확인합니다.",
          "처음 값과 달라진 값을 비교합니다.",
        ],
        checkpoint: [
          "상태를 바꾸기 전과 뒤의 센서값을 비교했다.",
          "센서가 현실의 상태를 값으로 바꾼다는 것을 설명할 수 있다.",
        ],
        help: [
          "값이 거의 변하지 않는다면 상태를 조금 더 크게 바꾸어 보세요.",
          "친구와 같은 센서를 사용해도 주변 상황이 다르면 값이 다를 수 있습니다.",
        ],
      },
      {
        blockId: "block05",
        number: "05",
        shortTitle: "작동 기준 정하기",
        title: "언제 작동해야 할까?",
        position: {
          current: "작동 기준 정하기",
          next: "센서로 반응시키기",
        },
        explanation: [
          "센서값을 읽는 것만으로는 장치가 언제 움직여야 하는지 결정할 수 없습니다.",
          "그래서 장치에는 어떤 값일 때 작동할 것인지 기준이 필요합니다.",
        ],
        thinkingQuestion:
          "어느 값을 기준으로 정해야 내가 원하는 상황에서 장치가 작동할까요?",
        taskTitle: "해보기",
        tasks: [
          "센서값을 여러 번 확인합니다.",
          "서로 다른 상황의 값을 비교합니다.",
          "작동 기준이 될 값을 하나 정합니다.",
          "왜 그 값을 골랐는지 설명합니다.",
        ],
        checkpoint: [
          "기준값을 하나 정했다.",
          "그 값을 정한 이유를 설명할 수 있다.",
        ],
        help: [
          "기준값은 내가 원하는 상황과 원하지 않는 상황을 나누는 선입니다.",
          "중간값을 먼저 고른 뒤 시험하면서 조금씩 바꾸어도 됩니다.",
        ],
      },
      {
        blockId: "block06",
        number: "06",
        shortTitle: "센서로 반응시키기",
        title: "조건에 따라 어떻게 반응할까?",
        position: {
          current: "센서로 반응시키기",
          next: "오늘의 퀴즈",
        },
        explanation: [
          "센서 입력, 조건 판단, 출력이 연결되면 장치는 상황에 따라 스스로 반응할 수 있습니다.",
          "오늘은 기준값을 사용해 센서 조건 알림장치를 완성하고, 실제로 원하는 때에 작동하는지 시험합니다.",
        ],
        thinkingQuestion:
          "내가 정한 기준값을 넘거나 낮아질 때 장치는 어떤 반응을 보여야 할까요?",
        taskTitle: "해보기",
        tasks: [
          "센서 입력을 조건에 연결합니다.",
          "block05에서 정한 기준값을 조건에 넣습니다.",
          "조건이 맞을 때 나타날 출력을 정합니다.",
          "실제로 작동시켜 보고 필요하면 기준값을 수정합니다.",
        ],
        checkpoint: [
          "센서 입력, 조건 판단, 출력이 연결되었다.",
          "센서 조건 알림장치가 원하는 상황에서 반응했다.",
        ],
        help: [
          "반응이 너무 자주 일어나면 기준값을 조금 높이거나 낮추어 보세요.",
          "조건 방향이 반대로 되어 있으면 원하는 상황이 아닐 때 작동할 수 있습니다.",
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
          title: "기억하기",
          question: "지난 연구에서 장치가 반응하려면 어떤 흐름이 필요했나요?",
          choices: [
            { text: "출력 → 입력 → 장식", correct: false },
            { text: "입력 → 처리 → 출력", correct: true },
            { text: "센서 → 3D → 영상", correct: false },
          ],
          correctFeedback:
            "맞아요. 지난 연구에서는 입력을 받고, 프로그램에서 처리한 뒤, 출력으로 반응하는 흐름을 사용했습니다.",
          incorrectFeedback:
            "지난 연구에서는 입력 → 처리 → 출력의 흐름을 사용했습니다. 이 흐름을 오늘 센서 연구에 다시 가져옵니다.",
        },
        carry: {
          title: "지난번 나의 결과",
          previousDayId: "day01",
          fallbackResult:
            "버튼 A를 누르면 LED에 하트가 나타나게 만들었습니다.",
          reusableIdea: "입력 → 처리 → 출력",
        },
        connect: {
          title: "연결하기",
          question:
            "지난 연구에서는 버튼과 움직임을 입력으로 사용했습니다. 오늘은 빛이나 온도처럼 주변의 상태를 값으로 읽고 비교하는 방법을 연구합니다.",
          choices: [
            { text: "주변 상태를 값으로 읽는 센서", correct: true },
            { text: "더 큰 LED 그림", correct: false },
            { text: "항상 같은 소리를 내는 출력", correct: false },
          ],
          correctFeedback:
            "맞아요. 센서는 주변 상태를 값으로 읽을 수 있습니다.",
          incorrectFeedback:
            "장치가 스스로 알아차리려면 주변 상태를 값으로 읽는 센서가 필요합니다.",
        },
      },
      todayResearch: {
        label: "연구 02",
        title: "센서로 현실 읽기",
        coreStatement:
          "센서는 주변의 상태를 컴퓨터가 사용할 수 있는 값으로 바꾸어 줍니다.",
        question:
          "그렇다면 센서값을 보고 장치가 스스로 작동하게 하려면 무엇이 더 필요할까요?",
        blocks: [
          { number: "04", title: "센서값 관찰하기" },
          { number: "05", title: "작동 기준 정하기" },
          { number: "06", title: "조건에 따라 반응시키기" },
        ],
        outcome: "센서 조건 알림장치",
        nextConnection: "다음에는 장치의 반응을 움직임과 통신으로 넓혀 봅니다.",
      },
      lessonBlocks: LESSON_BLOCKS.day02,
      quiz: {
        title: "오늘의 퀴즈",
        description:
          "오늘 연구에서 사용한 생각을 짧게 확인합니다. 틀려도 설명을 읽고 다시 생각하면 됩니다.",
        questions: [
          {
            prompt: "센서는 어떤 역할을 하나요?",
            choices: [
              { text: "주변 상태를 컴퓨터가 사용할 수 있는 값으로 바꾼다.", correct: true },
              { text: "컴퓨터의 색깔을 정한다.", correct: false },
              { text: "완성한 작품을 자동으로 발표한다.", correct: false },
            ],
            explanation:
              "센서는 빛, 소리, 기울기 같은 현실의 상태를 컴퓨터가 사용할 수 있는 값으로 바꾸어 줍니다.",
          },
          {
            prompt: "센서값을 읽은 뒤 기준값이 필요한 이유는 무엇인가요?",
            choices: [
              { text: "언제 장치가 작동해야 하는지 판단하기 위해서", correct: true },
              { text: "센서값을 무조건 크게 만들기 위해서", correct: false },
              { text: "출력을 사용하지 않기 위해서", correct: false },
            ],
            explanation:
              "기준값은 장치가 작동할 상황과 작동하지 않을 상황을 나누는 판단 기준입니다.",
          },
          {
            prompt: "센서 조건 알림장치의 기본 흐름은 무엇인가요?",
            choices: [
              { text: "입력 → 처리(조건 판단) → 출력", correct: true },
              { text: "출력 → 꾸미기 → 저장", correct: false },
              { text: "기록 → 발표 → 삭제", correct: false },
            ],
            explanation:
              "센서가 입력을 만들고, 처리 단계에서 기준값과 조건으로 판단한 뒤, LED나 소리 같은 출력이 반응을 보여 줍니다.",
          },
          {
            prompt: "오늘 만든 센서의 반응은 다음 연구에서 어떻게 넓어질 수 있나요?",
            choices: [
              { text: "움직임이나 다른 장치와 연결할 수 있다.", correct: true },
              { text: "다음 연구에서는 다시 쓰지 않는다.", correct: false },
              { text: "센서값을 모두 지워야 한다.", correct: false },
            ],
            explanation:
              "오늘 만든 센서 반응은 다음 연구에서 움직임이나 통신으로 이어질 수 있습니다.",
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
              "센서값을 비교했다.",
              "기준값을 정했다.",
              "조건과 출력을 연결했다.",
              "작동을 시험하고 고쳤다.",
            ],
          },
          {
            id: "decision",
            label: "오늘 내가 결정한 것",
            type: "text",
            placeholder: "예: 빛 센서값이 80보다 낮을 때 알림을 내기로 했다",
          },
          {
            id: "finding",
            label: "어려웠던 점이나 새롭게 발견한 것",
            type: "textarea",
            placeholder: "센서값이 생각보다 자주 바뀌어서 기준값을 다시 골랐다",
          },
          {
            id: "next",
            label: "다음 연구에서 할 일",
            type: "text",
            placeholder: "예: 센서 반응을 움직임과 연결해 보기",
          },
        ],
      },
      complete: {
        title: "오늘 연구 정리",
        gained: "센서 조건 알림장치",
        summaryLines: [
          "센서값을 읽고,",
          "기준을 정하고,",
          "조건에 따라 반응시키는 방법을 연구했습니다.",
        ],
        nextTitle: "움직이고 연결하기",
        nextSummary:
          "오늘 만든 센서의 반응을 움직임이나 다른 장치와 연결해 봅니다.",
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
