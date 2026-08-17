# 내일을 바꾸는 미래기술 연구소 - 연구소 지도와 학생용 UI

## 프로젝트 기준소스

개발 전 다음 순서로 기준을 확인합니다.

1. [`00_PROJECT_SOURCE_INDEX.md`](00_PROJECT_SOURCE_INDEX.md)
2. [`yeoryang_grade6_future_tech_lab_base_plan.md`](yeoryang_grade6_future_tech_lab_base_plan.md)
3. 작업 기능에 해당하는 상세 기준문서
4. `README.md`
5. 실제 코드

기준문서와 코드가 충돌할 경우 임의로 코드를 기준으로 판단하지 않습니다. 현재 상태는 Day01 Apps Script Web App 배포·프론트 학생조회 연결 완료 / A/B Google Sheets E2E 검증 전입니다.

## 1. 현재 구현 범위

초등학교 6학년 학생용 정적 HTML/CSS/JS 프로토타입입니다. 기존 연구소 지도, day02 일반형, day06 장기공백형 흐름을 유지하면서 day01 `DAY_TYPE_FIRST` 학생용 학습 화면을 보완했습니다.

- 연구소 지도 진입 전 `연구원 확인/학생 식별` 화면
- 학생 이름 선택 기반 `studentId → workId` 내부 연결
- 연구소 지도와 `?day=1~15` query 기반 연구일 확인
- day01 `기술과 문제 만나기` 실제 학습 화면
- day02 `researchBridge`, block04~06, 퀴즈, 연구기록 유지
- day06 `projectReload`, 실제 기록/예시 기록 분기, block13 → block14 아이디어 연결 유지
- day05 / day08 / day14 `phaseNotice` 유지
- day15 final 연결 유지

이번 Day01 구조 동결 작업의 주요 수정 파일은 `research-days.js`, `app.js`, `styles.css`, `runtime-config.js`, `README.md`와 `apps-script/`입니다.

로그인, 비밀번호, PIN, 인증코드, 회원가입, 학생번호 직접 입력은 구현하지 않았습니다. 현재 상태는 Day01 Apps Script Web App 배포·프론트 학생조회 연결 완료 / A/B Google Sheets E2E 검증 전입니다. Script Properties의 `SPREADSHEET_ID` 설정, `setupProject()` 실행, Apps Script Web App 배포, `ping`, `getStudents` 실제 학생 5명 조회는 완료되었습니다. Day01 저장·복원 A/B Google Sheets E2E, 실제 학생환경 시험, 영상 바이너리 Drive 업로드는 아직 연결 전입니다.

## 연구원 확인/학생 식별

최초 진입 순서:

```text
사이트 접속
→ 연구원 확인/학생 식별
→ 학생 이름 선택
→ 내부 studentId / workId 확정
→ 해당 학생 기록 불러오기
→ 연구소 지도
→ 오늘의 연구
```

식별 화면에는 다음 짧은 프로젝트 취지만 표시합니다.

```text
사람과 환경의 불편을 발견하고,
생각하고 → 만들고 → 시험하고 → 다시 고치는 연구를 합니다.
그 과정은 나만의 프로젝트 북에 남습니다.
```

학생에게는 이름 선택 버튼만 보입니다. 운영환경에서는 Apps Script `getStudents`가 Google Sheets `01_학생`과 `02_작품`을 읽어 active 학생만 반환하고, 연구원 확인 화면은 이 서버 응답을 단일 기준으로 사용합니다. 실제 학생명은 `app.js`에 직접 넣지 않습니다. `window.FUTURE_LAB_STUDENTS` 또는 `FUTURE_LAB_CONFIG.students`는 Apps Script API가 없는 로컬 개발 fallback 용도입니다. 데이터 연결은 화면의 이름 텍스트가 아니라 확정된 현재 학생 컨텍스트의 `studentId`와 `workId`를 사용합니다.

이전 연구기록은 `window.STUDENT_DAY_RECORDS_BY_STUDENT[studentId]` 또는 `[workId]`를 우선 사용합니다. 공통 `window.STUDENT_DAY_RECORDS`는 `STUDENT_DAY_RECORDS_STUDENT_ID` 또는 `STUDENT_DAY_RECORDS_WORK_ID`가 현재 학생과 일치할 때만 사용합니다.

API 없는 로컬 개발용 학생 설정 예시:

```js
window.FUTURE_LAB_STUDENTS = [
  {
    studentId: "stu01",
    studentName: "실제 학생 이름",
    workId: "work_stu01",
    active: true,
  },
  {
    studentId: "stu02",
    studentName: "잠시 숨길 학생",
    workId: "work_stu02",
    active: false,
  },
];
```

`active`는 `false`일 때만 비활성입니다. `active: true` 또는 생략은 선택 가능 상태입니다. 비활성 학생은 연구원 목록에서 제외되고, 이전 `sessionStorage`에 남아 있어도 자동 입장하지 않습니다.

`studentId`와 `workId`는 중복될 수 없습니다. 중복이 발견되면 개발자 콘솔에 `Duplicate studentId: ...` 또는 `Duplicate workId: ...` 오류를 남기고, 충돌 항목은 선택 목록에서 제외합니다.

운영 공개 runtime 설정은 `runtime-config.js`에서 관리하고, `app.js`보다 먼저 로드합니다.

```html
<script src="research-days.js" defer></script>
<script src="runtime-config.js" defer></script>
<script src="app.js" defer></script>
```

`runtime-config.js`에는 공개 Apps Script `/exec` URL, `teacherMode`, `devMode`만 둡니다. 실제 학생명, `studentId`, `workId`, 비밀번호, 토큰, 인증키, Spreadsheet ID는 넣지 않습니다. 운영용 학생 기준정보는 Google Sheets `01_학생`, `02_작품`과 `getStudents` 응답으로 확인합니다.

현재 학생 컨텍스트는 다음 세 값만 `sessionStorage`에 유지합니다.

```text
currentStudentId
currentStudentName
currentWorkId
```

같은 탭 새로고침에서는 현재 연구원이 유지되고, 새 브라우저 세션에서는 다시 이름을 선택합니다. 실제 연구기록은 기존 저장 구조에서 복원합니다.

저장 키 구조는 유지합니다.

```text
futurelab2026:{studentId}:{dayId}
```

예:

```text
futurelab2026:stu03:day06
```

`workId`가 `work01`에서 `work_stu01`로 바뀌어도 localStorage key는 `studentId` 기반이므로 기존 기록을 잃지 않습니다. 기존 저장 상태 안의 예전 `workId`는 복원 뒤 다음 저장 때 현재 학생 설정의 `workId`로 정규화됩니다.

`연구원 바꾸기`는 현재 day01 입력 상태를 저장한 뒤 미디어 runtime generation을 무효화하고, 카메라 MediaStream, MediaRecorder, Blob, 로컬 object URL, DOM video `src/srcObject`를 정리합니다. 그 다음 현재 학생 세션과 렌더된 DOM을 비운 뒤 연구원 확인 화면으로 돌아갑니다. 다른 학생의 localStorage, MakeCode 링크, 영상 Asset, DayRecord는 삭제하지 않습니다.

미디어 학생 격리:

- `getUserMedia()` 요청 직전 `{ generation, studentId }` 컨텍스트를 저장합니다.
- 늦게 성공한 이전 컨텍스트의 MediaStream은 즉시 `track.stop()`으로 종료하고 DOM에 연결하지 않습니다.
- MediaRecorder도 시작 시점의 `{ generation, studentId }`와 recorder별 chunk 배열을 사용합니다.
- 늦은 `dataavailable` / `stop` 이벤트가 현재 generation 또는 학생과 다르면 Blob, object URL, DOM, 상태에 반영하지 않습니다.

`?day=6`처럼 직접 연구일 URL로 들어와도 학생이 선택되지 않았으면 먼저 연구원 확인 화면을 표시합니다. 학생 선택 후 원래 요청한 day로 이동합니다.

`?studentId=` 우회는 운영 기본 흐름에서 사용하지 않습니다. `file:`, `localhost`, `127.0.0.1`, 또는 `FUTURE_LAB_CONFIG.devMode=true`인 개발모드에서만 테스트용으로 허용합니다.

## 2. day01 구현 내용

day01은 `DAY_LESSONS.day01`에 추가되었고 `flowStartId`는 `today-research`입니다. day01 시작 시 `researchBridge`와 `projectReload`는 렌더링하지 않습니다.

화면 흐름:

```text
연구소 지도
→ 오늘의 연구
→ block01 문제 발견 / 연구 흐름 / 연구원 역할
→ block02 하드웨어·소프트웨어 / 컴퓨터와 micro:bit 관계 / MakeCode 탐색 / 연결·페어링 / 입력·처리·출력 / 버튼·흔들기
→ block03 자유 연구 / 친구 시험 / 코드 링크 / 오늘의 연구 모습 영상
→ 연구 증거함
→ 오늘의 퀴즈
→ 연구기록
→ dayCompleted 기반 마무리 화면
```

Day01 최종 흐름은 `문제 발견 → 연구 흐름 이해 → 하드웨어·소프트웨어 → 컴퓨터와 micro:bit 관계 → MakeCode 탐색 → 연결·페어링 → 입력·처리·출력 → 버튼/흔들기 → 자유 연구 → 친구 시험 → 코드/영상 → 퀴즈/연구기록`입니다.

Day02의 `researchBridge`는 Day01에서 버튼과 움직임 입력을 이미 경험한 것으로 이어집니다. 기본 용어는 `입력 → 처리 → 출력`으로 유지하고, Day02에서는 처리 단계 안에서 `조건 판단`을 사용하는 것으로 확장합니다.

day01 연구소 지도 제목은 `기술과 문제 만나기`입니다. 프로젝트 전체 제목 `내일을 바꾸는 미래기술 연구소`는 유지합니다.

## 3. day01 상태 저장

day01은 브라우저 임시저장을 기본 안전망으로 사용하고, `FUTURE_LAB_CONFIG.appsScriptApiUrl`이 설정된 경우 Apps Script 서버 저장을 함께 시도합니다.

```text
futurelab2026:{studentId}:day01
```

별도 로그인 없이 연구원 확인 화면에서 선택한 이름을 내부 `studentId`와 `workId`에 연결합니다. day01 저장·복원은 확정된 현재 학생 컨텍스트의 `studentId`만 사용하며, URL의 임의 텍스트나 화면 표시 이름으로 저장 키를 만들지 않습니다.

서버 저장 설정 예시:

```js
window.FUTURE_LAB_CONFIG = {
  appsScriptApiUrl: "https://script.google.com/macros/s/.../exec",
  teacherMode: false,
  devMode: false,
};
```

`dayDates` 같은 기본 수업값은 `app.js`의 기본 CONFIG를 사용하며, 운영 URL만 바꾸기 위해 불필요한 설정을 중복하지 않습니다.

학생 선택 후 복원은 서버 `getDayRecord`와 브라우저 임시저장을 함께 확인합니다. 평상시에는 서버 `dayStateJson`을 우선하지만, localStorage의 현재 학생·작품·연구일 기록에 `serverSyncPending=true`가 남아 있으면 해당 local 기록을 우선 복원하고 서버 재동기화를 1회 즉시 시도합니다. 서버 저장 실패 시 화면 입력은 localStorage에 유지되고 저장 상태는 `저장하지 못했어요`와 실패 복구용 `다시 저장`으로 표시됩니다.

Day01 Apps Script 코드에서 완료된 것:
- Day01 Apps Script adapter
- DayRecord 저장/복원
- QuizResult 저장
- Asset metadata 저장
- localStorage fallback
- A/B 학생 저장 격리
- 서버 저장 실패 후 localStorage에 남은 미동기화 기록 보호
- 저장 snapshot/revision으로 오래된 요청 성공이 최신 pending 상태를 해제하지 않도록 처리
- 서버/로컬 영상 복원 구분
- 서버 validation

서버 저장 요청은 `studentId:dayId` 단위로 분리됩니다. 같은 학생·같은 연구일의 빠른 자동저장은 최신 상태로 합칠 수 있지만, `stu01:day01`과 `stu02:day01`은 같은 pending slot을 공유하지 않습니다. 연구원 변경 직전 캡처된 이전 학생 payload는 학생 변경 뒤에도 서버 전송을 계속하며, 완료 결과는 현재 화면 학생이 일치할 때만 UI에 반영합니다.

서버 동기화 메타데이터:
- `serverSyncPending`: 서버에 아직 반영되지 않은 local 상태가 있을 때 `true`
- `localRevision`: 학생 상태가 localStorage에 저장될 때마다 증가
- `localUpdatedAt`: local 저장 시각
- `serverUpdatedAt`: 서버 저장 성공 시각

서버 저장 요청은 생성 시점의 `localRevision` snapshot을 보관합니다. 저장 성공 후 현재 state 또는 localStorage의 revision이 요청 snapshot과 같을 때만 `serverSyncPending=false`로 바꿉니다. 학생이 그 사이 추가 입력을 해 더 큰 revision이 생기면 오래된 요청 성공은 최신 pending 상태를 해제하지 않습니다.

영상 증거는 영구 참조와 현재 브라우저 런타임 참조를 구분합니다. 새로고침 뒤에는 `videoAssetId`, `videoFileId`, `videoStorageUrl`, `videoPlaybackUrl`, `stored`, `playback_ready` 중 하나가 있어야 영상 증거로 인정합니다. 서버에서 복원한 `captureStatus=recorded`만 있고 Blob/object URL이 없으면 `not_started`로 정규화됩니다.

Apps Script validation:
- `dayState.studentId`, `dayState.workId`, `dayState.dayId`는 서버에서 검증된 외부 payload 값으로 강제 정규화됩니다.
- 기존 Asset의 `ownerType`, `ownerId`, `dayId`, `assetType`은 변경할 수 없습니다.
- Day01 MakeCode URL Asset은 `asset_{studentId}_{dayId}_makecode` 규칙과 `https://makecode.microbit.org/...` scheme/host를 서버에서도 확인합니다.
- 자유문장, URL, title, description, 배열, `answersJson`, `dayStateJson`, POST body에 크기 제한을 둡니다.
- 학생 실제 micro:bit 활동 전에는 `todayDecision=""`, `nextAction=""`으로 저장합니다.
- `setupProject()`는 `getStudents`와 같은 학생·작품 ID 중복 무결성을 먼저 검증한 뒤 `activeStudentCount`, `validStudentWorkCount`, `studentWorkWarnings`로 active 학생과 `02_작품`의 `workId/studentId` 관계를 검수합니다.

Day02 범위:
- 이전 연구 표시의 공식 필드는 `todayDecision`입니다.
- 기존 임시 데이터 호환을 위해 `resultSummary` fallback만 유지합니다.
- 실제 Day02 Apps Script 서버 조회 연동은 후속 단계입니다.

실제 완료된 것:
1. `01_학생` / `02_작품` 실제 운영 기준데이터 입력·검수
2. Script Properties의 `SPREADSHEET_ID` 설정
3. Apps Script에서 `setupProject()` 실행
4. Apps Script Web App 배포
5. `/exec` URL 확인
6. `runtime-config.js`의 `FUTURE_LAB_CONFIG.appsScriptApiUrl` 설정
7. `getStudents`가 Google Sheets 기준 active 학생 5명을 반환하는지 확인
8. `ping` 확인
9. localhost 프론트에서 `getStudents` 학생조회 연결 확인

아직 운영 전 확인할 것:
1. `stu01`/`stu02` A/B Google Sheets end-to-end 저장·복원 시험
2. 실제 학생환경 리허설
3. Cloudflare Pages HTTPS 운영 배포

저장·복원 대상:
- 문제 발견, 사람·문제·도움 연결, 연구 순서, 역할
- MakeCode 화면 탐색 체크 `makeCodeUiCheckItems`
- micro:bit 연결·페어링 확인 `pairingChecklist`
- 버튼/흔들기 완료, 해금 도구, 조합 변경
- 자유 연구 단계, 사용 기능, 친구 시험
- MakeCode 공유 링크
- 영상 상태 `videoAssetId`, `videoFileId`, `videoPlaybackUrl`, 호환용 `videoStorageUrl`
- `supersededVideoEvidence`
- 퀴즈 답
- 연구기록 `recordValues.favoriteTool`, `recordValues.nextSensor`

기존 localStorage에 새 필드가 없어도 `createDefaultDayState()`와 `normalizeDayState()`에서 기본값으로 복원합니다.

## 4. 완료 판정 구조

`minimumCompleted`는 최소 수행 확보 여부입니다.

최소 수행:
- A 버튼 → LED 기본 작동 성공
- 조건: `buttonToolCompleted && unlockedTools.includes("LED 출력")`

학생용 표현:
- A 버튼을 눌렀을 때 LED가 반응하는 장치를 실제 micro:bit에서 작동시킨다.

기초기획안 기준 표현:
- Day01 최소 수행: A 버튼 입력 → 프로그램 처리 → LED 출력이 실제 micro:bit에서 작동하는 기본 장치 1개

`basicCompleted`는 기본 완성 여부입니다.

기본 완성:
- Block01 완료
- Block02 완료
- Block03 완료
- 코드·영상 증거
- 퀴즈
- 연구기록

기본 완성 기준 설명:
- 버튼·흔들기 입력을 경험하고, 자유 연구에서 한 가지 이상 직접 바꾸어 시험하며, 코드 링크와 연구 모습 영상을 남기고, 퀴즈와 연구기록까지 완료합니다.

자유 연구의 `바꿔보기`는 Block03 기본 완성 조건의 일부로 유지합니다.

`block02Completed`는 `IPO 개념 자기확인`, `A 버튼 실제 작동`, `흔들기 실제 작동`만 봅니다. `작은 조합 도전`은 `더 해보고 싶다면` 아래의 선택 활동으로 이동했으므로 수행하지 않아도 block02 완료가 가능합니다.

`lessonProgress`는 다음 세부 값을 가집니다.

- `block01Completed`
- `block02Completed`
- `block03Completed`
- `evidenceChecked`
- `quizCompleted`
- `recordCompleted`

`quizCompleted`는 day01 퀴즈의 모든 문항 id에 답이 있으면 true입니다. 정답 여부와 관계없이 응답 여부만 봅니다.

`recordCompleted`는 `recordValues.favoriteTool`과 공백 제거 후 `recordValues.nextSensor`가 모두 비어 있지 않을 때 true입니다.

`basicCompleted`는 다음 조건을 모두 만족해야 true입니다.

```text
block01Completed
&& block02Completed
&& block03Completed
&& evidenceChecked
&& quizCompleted
&& recordCompleted
```

완료 관계:

```text
minimumCompleted
→ 최소 수행 확보

basicCompleted
→ 기본 완성

dayCompleted
→ basicCompleted와 동일
```

`completionLevel`은 `basicCompleted=true`면 `basic`, 최소 수행만 완료하면 `minimum`, 그 외에는 `in_progress`입니다.

Day01 완료 수준:
- 최소 수행: 실제 micro:bit에서 A 버튼 → LED 기본 작동 성공
- 기본 완성: Day01의 문제 탐색, 기술 경험, 흔들기, 자유 연구, 친구 시험, 코드·영상 증거, 퀴즈·기록까지 완료
- 최소 수행을 완료했다고 해서 기본 완성 활동을 생략하는 것은 아님
- 장비·시간 문제 등으로 모든 기록을 남기지 못하더라도 실제 버튼·LED 기본 작동에 성공했다면 최소 수행 결과는 확보한 것으로 봄

## 5. 마무리 화면

`dayCompleted === true`:
- 제목: `첫 번째 연구 완료 ✓`
- `오늘 연구를 모두 마쳤습니다.`
- 얻은 도구와 다음 연구 안내 표시

`minimumCompleted === false`:
- 제목: `아직 기본 작동을 완성하지 못했어요`
- 먼저 A 버튼을 눌렀을 때 LED가 반응하도록 안내
- 부족한 항목에는 해당 활동 위치 링크 제공
- 다음 연구 안내 숨김

`minimumCompleted === true && basicCompleted === false`:
- 제목: `기본 작동 성공 ✓`
- A 버튼 → LED 작동 성공을 인정하고 남은 연구를 이어가도록 안내
- 부족한 항목에는 해당 활동 위치 링크 제공
- 부족 항목에는 최소 수행 조건뿐 아니라 `오늘의 퀴즈 완료`, `연구기록 작성`도 포함
- 다음 연구 안내 숨김

부족 항목 목록은 `자유 연구 해보기·바꿔보기·시험하기` 안에서 `바꿔보기`를 확인하므로 `내가 한 가지 이상 바꾸기`를 별도 항목으로 중복 표시하지 않습니다.

완료 화면 접근 자체는 막지 않습니다.

## 6. MakeCode 링크

Block02에는 `MakeCode 열기 ↗` 외부 링크가 있습니다.

```text
https://makecode.microbit.org/
```

이 링크는 `target="_blank"`와 `rel="noopener noreferrer"`를 사용합니다. 학생이 직접 URL을 입력하거나 검색하지 않아도 MakeCode로 이동할 수 있습니다.

Day01에서 용어는 다음처럼 구분합니다.

```text
micro:bit에 보내기
→ 현재 만든 프로그램을 실제 micro:bit에서 실행하도록 전달한다.

MakeCode 공유 링크 남기기
→ 오늘 만든 코드를 나중에 다시 확인하고 수정할 수 있게 한다.
```

- 입력값 `trim`
- `new URL()` 파싱
- hostname이 `makecode.microbit.org`인 경우에만 저장
- 잘못된 주소는 저장하지 않음
- 저장 후 새 탭 링크 제공
- 새로고침 후 복원

## 7. 영상 상태 모델

영상 대표 참조는 다음 필드로 분리합니다.

```text
videoAssetId
videoFileId
videoPlaybackUrl
videoStorageUrl   // 기존 데이터 호환용
```

연구 증거함의 `<video>`는 `videoPlaybackUrl`을 우선 사용합니다. 일반적인 Drive `/file/d/.../view` 주소는 Drive 웹페이지 주소이므로 `<video src>`로 사용하지 않습니다.

같은 브라우저 세션에서는 서버 저장 전에도 다음 우선순위로 증거함에서 replay할 수 있습니다.

```text
videoPlaybackUrl || day01RecordedUrl
```

서버 저장 전 로컬 영상은 같은 브라우저 세션에서만 재생 가능합니다. 새로고침하면 object URL은 사라지는 것이 정상입니다.

촬영 lifecycle은 다음 순서를 사용합니다.

```text
촬영
→ 확인
→ 이 영상 사용
또는
→ 다시 찍기
→ 새 촬영
```

촬영 완료 상태에서는 `촬영 시작` 버튼을 비활성화합니다. 새 촬영은 반드시 `다시 찍기`를 통해 기존 대표 영상 참조를 정리한 뒤 시작합니다. 버튼 상태뿐 아니라 `startDay01Recording()` 함수에서도 이미 대표 영상이 있으면 새 녹화를 시작하지 않습니다.

영상 저장 상태는 저장 여부와 재생 준비 여부를 분리합니다.

```text
stored          // 파일 저장 완료, playback URL 없음
playback_ready  // playback URL 있음
```

기존 localStorage의 `uploaded` 값은 복원 시 `videoPlaybackUrl`이 있으면 `playback_ready`, 없으면 `stored`로 정규화합니다.

## 8. 영상 업로드 adapter

아직 실제 Apps Script 영상 업로드 endpoint는 없습니다. 가짜 업로드 성공도 표시하지 않습니다.

준비된 경계:
- `CONFIG.videoUploadEndpoint`
- `CONFIG.videoPlaybackResolveEndpoint`
- `uploadVideoEvidence(blob, metadata)`
- `resolveVideoPlaybackUrl(fileId)`

업로드 metadata에는 `requestId`, `studentId`, `workId`, `dayId`가 포함됩니다. `requestId`는 `crypto.randomUUID()`를 우선 사용하고, 미지원 시 fallback을 사용합니다.

업로드 중복 방지:
- 런타임 `day01UploadInFlight`
- 업로드 중 `이 영상 사용` 버튼 비활성화
- 화면 상태: `영상 저장 중...`

업로드 timeout:
- 기본 12초
- `AbortController` 지원 시 요청 중단
- 실패 또는 timeout 시 `pending_teacher_upload` / `teacher_manual`
- 학생 메시지: `자동 저장을 완료하지 못했습니다. 수업은 계속 진행하세요. 영상은 강사가 확인합니다.`

영상 상태 메시지:
- `playback_ready`: `영상 저장 완료 ✓`
- `stored`: `영상은 저장되었습니다. 재생 연결을 준비하고 있습니다.`
- `pending_teacher_upload`: `자동 저장을 완료하지 못했습니다. 수업은 계속 진행하세요. 영상은 강사가 확인합니다.`
- 로컬 촬영만 완료: `영상 촬영 완료. 이 영상을 사용하거나 다시 찍을 수 있습니다.`

상단 save-state 메시지:
- `playback_ready`: `영상 저장 완료`
- `stored`: `영상 저장됨 · 재생 연결 준비 중`
- `pending_teacher_upload` / 실패: `강사 보완 필요`

증거함 영상 카드는 촬영 완료, `stored`, `playback_ready`, `videoPlaybackUrl`, 현재 브라우저 세션의 로컬 녹화 URL 중 하나가 있으면 완료 스타일을 적용합니다.

## 9. 재촬영 처리

`다시 찍기`는 현재 대표 영상 증거를 새 촬영으로 교체하려는 행동입니다.

재촬영 시:
- `videoAssetId`, `videoFileId`, `videoPlaybackUrl`, `videoStorageUrl` 초기화
- 이전 대표 영상 참조는 `supersededVideoEvidence`에 보관
- 클라이언트가 Drive 파일을 임의로 삭제하지 않음
- 이전 대표 영상은 연구 증거함에서 더 이상 현재 영상으로 표시하지 않음
- 로컬 Blob과 object URL을 제거하고, 카메라가 살아 있으면 `camera_ready`로 돌아감
- 촬영 중에는 `촬영 시작`, `이 영상 사용`, `다시 찍기`를 실행하지 않음

## 10. teacherMode

`CONFIG.teacherMode` 기본값은 `false`입니다. 기본 학생 화면에서는 강사용 보완 연결 UI를 렌더링하지 않습니다.

`teacherMode`는 강사용 보완 UI의 표시 여부만 제어하며 보안 인증 기능이 아닙니다.

학생은 별도의 로그인, 비밀번호, PIN, 인증코드 없이 연구원 이름 선택을 통해 현재 학생을 식별합니다.

강사용 기능에 별도의 접근 제한이 필요해지는 경우에는 학생 식별 기능과 분리된 운영 기능으로 별도 설계합니다.

강사용 보완 입력은 일반 Drive view URL을 video src로 쓰지 않습니다. 현재 구조는 `Drive fileId → Apps Script playback URL 해결 → videoPlaybackUrl 저장`을 위한 adapter 경계만 제공합니다.

## 11. 카드와 정렬 상호작용

UI 배치 원칙:
- 서로 종속된 입력·선택·결과는 가능한 한 같은 화면 범위에 배치
- 선택 A가 입력 B의 내용을 결정하고 결과 C를 만들면 A / B / C를 서로 멀리 떨어뜨리지 않음

학생용 UI 시각적 하이어라키:
- 큰 제목은 현재 연구 블록의 위치를 나타냄
- 얇은 구분선은 새로운 활동의 시작을 나타냄
- 행동 말머리는 학생이 지금 해야 할 일을 나타냄
- 연한 결과 영역은 학생의 선택·완성 결과를 나타냄
- 폰트 크기만으로 내용의 위계를 구분하지 않음
- 서로 종속된 입력·선택·결과는 가능한 한 같은 화면 범위에 배치

행동 말머리 기본 세트:
- `알아보기`
- `생각하기`
- `찾아보기`
- `골라보기`
- `해보기`
- `시험하기`
- `확인하기`
- 필요할 때만 `더 해보기`

Day01 순차 내비게이션 원칙:
- 하나의 연속된 세로 학습 흐름에서는 바로 아래 큰 제목과 중복되는 이전/다음 링크를 두지 않음
- 제목, 활동 구분선, 행동 말머리로 다음 활동의 위치를 알려줌
- 기능 목적이 있는 이동은 유지함

유지:
- 연구소 지도의 `오늘 연구 시작`
- `MakeCode 열기`, `MakeCode에서 다시 열기` 같은 외부 도구 이동
- `막혔나요? 도움 보기`, `MakeCode 화면 안내 보기` 같은 도움 기능
- `영상 다시 보기`, `코드 다시 열기` 같은 증거 확인 기능
- 마지막 미완료 화면의 부족 활동 복구 링크

제거:
- 바로 다음 섹션으로 이동하는 단순 이전/다음 링크
- `오늘의 연구` 아래 두 번째 `연구 시작하기` CTA

문제 발견:
- 6개 상황 카드는 PC에서 왼쪽 `2열 × 3행` 영역에 유지
- `어떤 불편인가요?`와 `내가 발견한 문제`를 오른쪽 연동 패널에 함께 배치
- 기존 select를 제거하고 상황별 `meaningOptions` 3개를 radio로 직접 비교 선택
- 상황 변경 시 새 상황에 없는 이전 meaning은 비우고 `target`과 문제 문장을 즉시 갱신

사람·문제·도움 연결:
- 각 카드에 `matchSet` 부여
- 세 그룹의 `matchSet`이 같을 때만 `연결 성공 ✓`
- 틀린 조합은 선택을 유지하고 다시 확인 안내 표시
- 기존 잘못 저장된 completed 값도 복원 시 재판정

연구 순서:
- 섞인 7개 연구 카드를 1~7 완성 슬롯에 배치
- drag-and-drop 지원
- 카드 클릭 → 슬롯 클릭 대체 조작 지원
- 슬롯의 카드를 다른 슬롯으로 옮기거나 카드가 있는 슬롯과 교환 가능
- 슬롯의 카드를 상단 카드 영역으로 되돌려 배치 취소 가능
- 모든 슬롯을 채운 뒤 `연구 순서 확인` 활성화
- 오답이어도 현재 배치 유지

코드 예상:
- 입력 A 버튼과 출력 LED 하트를 먼저 확인
- 블록 후보 3개 중 필요한 블록 2개 선택
- 선택한 블록으로 예상 코드 자동 표시
- 관계없는 블록을 스스로 제외
- 예상 확인 후 실제 MakeCode 활동으로 연결

흔들기 입력 탐색:
- 버튼 외에 움직임도 입력으로 사용할 수 있음을 경험
- MakeCode 메뉴 중 `입력`을 찾아 선택
- 입력 메뉴에서 `흔들었을 때` 블록을 실제로 찾음
- 흔들었을 때 보여 줄 LED 선택
- `흔들기 → 내가 고른 LED` 코드 흐름을 즉시 표시
- 실제 코드를 만들고 micro:bit로 보내 시험
- 중복되는 `가능/불가능` 예측과 LED 선택 완료 체크 제거

## 12. day01 이미지 자산

외부 이미지 hotlink 없이 자체 제작 SVG 6개를 사용합니다.

```text
assets/day01/dark-road.svg
assets/day01/dry-plant.svg
assets/day01/lost-things.svg
assets/day01/hard-door.svg
assets/day01/pet-waiting.svg
assets/day01/too-hot-cold.svg
```

이미지 경로와 alt는 `research-days.js`의 상황 데이터 `image`, `imageAlt`에서 렌더링합니다.

Day01 개념 학습 이미지는 `assets/day01/` 아래 의미 기반 파일명으로 둡니다.

```text
assets/day01/hardware-software.png
assets/day01/computer-microbit-flow.png
assets/day01/coding-send-test-fix.png
assets/day01/makecode-ui-guide.png
assets/day01/ipo-flow.png
assets/day01/makecode-pairing-guide.png
```

`makecode-pairing-guide.png`는 제공된 3단계 안내 이미지(`프로젝트 만들기 → micro:bit 연결 → 장치 페어링`)로 교체했습니다. 모든 Day01 학습 이미지는 `.lesson-guide-image`로 렌더링하며 `max-width: 100%`, `height: auto`, `display: block`을 적용합니다.

## 13. 검수 URL

```text
index.html?day=1
index.html?day=2
index.html?day=6
index.html?day=8
index.html?day=10
index.html?day=14
index.html?day=15
```

웹캠은 보안 컨텍스트가 필요합니다. 실제 학생 환경에서는 HTTPS 배포 주소 또는 localhost에서 확인해야 합니다.

## 14. 배포 역할 기준

운영 배포 기준은 다음과 같이 구분합니다.

```text
GitHub
→ 프로젝트 소스 저장
→ 변경 이력 / 버전관리

Cloudflare Pages
→ GitHub 저장소 연결
→ 학생용 HTTPS 운영 사이트 배포

Apps Script
→ API backend

Google Sheets
→ 학생·작품·연구기록 데이터
```

전체 흐름:

```text
Codex
↓
로컬 프로젝트
↓
GitHub
↓
Cloudflare Pages
↓
학생용 HTTPS 페이지
↓
Apps Script /exec
↓
Google Sheets
```

GitHub는 소스·버전관리 역할로 유지하고, 학생용 운영 호스팅은 Cloudflare Pages를 기준으로 합니다. GitHub 저장소 생성과 Cloudflare Pages 실제 배포는 아직 진행하지 않았습니다.

## 15. 실행한 검수

```text
node --check .\app.js
node --check .\research-days.js
node --check .\runtime-config.js
Apps Script .gs syntax check
Node VM local/server pending 복원 및 revision 회귀 검사
Node VM MakeCode URL 위조 및 setup helper 검사
Node VM Day01 Apps Script 보완 회귀 검사
Node VM Apps Script 순수 함수 보완 검사
source search: Day02 fallback, deprecated save globals, storageUrl/videoFileId, row[숫자]
Node VM Day01 렌더/상태 회귀 검사
Node VM 완료 판정 검사
Node VM 연구순서 슬롯 렌더 검사
Node VM 연구순서 상태 조작 검사
Node VM 문제 발견 좌우 연동 UI 렌더/저장 복원/A-B 분리 검사
Node VM 코드 예상 선택형 UI 렌더/판정/저장 복원/A-B 분리 검사
Node VM 흔들기 활동 3단계 UI 렌더/완료 판정/저장 복원/A-B 분리 검사
Node VM Day01 시각 하이어라키 렌더 검사
PowerShell 이미지 파일/크기 readback
```

확인한 항목:
- Day01 활동 시작에 얇은 구분선과 `day01-activity` 경계 적용
- `activity-label`, `activity-step`, `activity-result`, `activity-guide` 공통 클래스 렌더
- 문제 발견의 `찾아보기 → 골라보기 → 결과` 말머리 렌더
- 사람·문제·도움 연결의 `생각하기` 말머리 렌더
- 연구 순서의 `생각하기`, `해보기` 말머리 렌더
- 역할 선택의 `알아보기`, `골라보기` 말머리 렌더
- 버튼 코드 예상의 `생각하기 → 골라보기 → 결과 → 확인하기` 말머리 렌더
- 흔들기 활동의 `찾아보기 → 골라보기 → 결과 → 해보기 → 시험하기` 말머리 렌더
- 자유 연구, 친구 시험, 코드 링크, 영상 증거의 행동 말머리 렌더
- Day01 문제 발견이 `problem-discovery-board` 좌우 연동 활동판으로 렌더
- Day01 문제 발견 상황 카드 6개 유지
- Day01 문제 발견 초기 상태에서 오른쪽 패널에 상황 먼저 선택 안내 표시
- Day01 문제 발견에서 기존 select 미렌더
- 상황 선택 시 해당 `meaningOptions` 3개가 radio로 렌더
- 불편 선택 시 `discoveredProblem.meaning` 저장 및 문제 문장 즉시 생성
- 상황 변경 시 새 상황에 없는 이전 meaning 제거와 target 갱신
- 저장된 문제 발견 상황/불편/문장 복원
- Day01 문제 발견 기록의 stu01/stu02 분리
- Day01 연구순서 상단 섞인 카드 7개 렌더
- Day01 연구순서 1~7 고정 슬롯 렌더
- 연구순서 확인 버튼이 7칸 미완성 상태에서 disabled
- 연구순서 UI에는 현재 위치 번호와 왼쪽/오른쪽 이동 버튼 미렌더
- 코드 예상 UI에는 구형 정렬 UI, 번호, 왼쪽/오른쪽 이동 버튼, draggable 속성 미렌더
- 코드 예상 블록 후보 3개 렌더
- 코드 예상 최대 2개 선택 제한
- 코드 예상 1개 선택 시 `예상 확인` disabled
- 코드 예상 2개 선택 시 `예상 확인` enabled
- 코드 예상 정답 세트 `event-a + show-led` 순서 무관 판정
- 코드 예상 오답 후 현재 선택 유지
- 코드 예상 `codePredictionSelections` 저장·복원
- 기존 `codePredictionOrder`에서 `codePredictionSelections` 호환 복원
- 코드 예상 기록의 stu01/stu02 분리
- 흔들기 활동에서 `가능/불가능` UI 미렌더
- 흔들기 메뉴 선택지가 `기본`, `입력`, `음악`, `LED` 같은 메뉴 수준으로 렌더
- 흔들기 메뉴 `입력` 선택 시 `shakeFeatureFound=true`
- 흔들기 메뉴 오답은 현재 상태를 초기화하지 않고 재탐색 피드백 표시
- 흔들기 LED 선택 시 `shakeLedChoice` 저장 및 `흔들기 → 선택한 LED` 즉시 표시
- 흔들기 수행 체크 2개만 렌더
- 흔들기 체크 1개만으로는 `shakeToolCompleted=false`
- 흔들기 메뉴 정답, LED 선택, 체크 2개 완료 시 `shakeToolCompleted=true`
- 기존 `shakeChecklist`의 구형 세 번째 값은 새 2개 체크 기준으로 정규화
- 흔들기 기록의 stu01/stu02 분리
- 저장된 전체 `researchOrder`가 슬롯 7칸으로 복원
- 저장된 부분 `researchOrder`가 채워진 슬롯과 남은 상단 카드로 복원
- 카드 → 빈 슬롯, 슬롯 → 빈 슬롯, 슬롯 간 교환, 슬롯 → 상단 복귀 상태 반영
- 정답 확인 시 `researchOrderCompleted=true`
- 오답 확인 시 `researchOrderCompleted=false`이고 현재 배치 유지
- Day01 Block01 문제 발견 연습 안내 렌더
- 하드웨어·소프트웨어, 컴퓨터와 micro:bit 관계, MakeCode UI, 페어링, IPO, 반복 연구 이미지 경로 렌더
- `MakeCode 열기 ↗` 링크의 `target="_blank"` / `rel="noopener noreferrer"`
- MakeCode UI 탐색 checkbox 렌더와 `makeCodeUiCheckItems` 기본 복원
- micro:bit 연결·페어링 checkbox 렌더와 `pairingChecklist` 기본 복원
- `작은 조합 도전`이 `더 해보고 싶다면` 선택 활동으로 렌더
- `block02Completed`가 직접 변경 조건 없이 IPO 자기확인, A 버튼, 흔들기 성공만으로 완료
- A 버튼 → LED 실제 작동만 완료한 경우 `minimumCompleted=true`, `basicCompleted=false`, `dayCompleted=false`
- 흔들기까지 성공해도 다른 기본 활동이 남아 있으면 `basicCompleted=false`, `dayCompleted=false`
- 자유 연구 `바꿔보기`는 Block03 기본 완성 조건에는 포함되지만 `minimumCompleted` 조건에는 포함하지 않음
- 모든 기본 활동 완료 시 `basicCompleted=true`, `dayCompleted=true`
- 기본 완성 전 Day01 마무리 화면은 다음 연구 안내를 숨기고, 기본 완성 후에만 다음 연구 안내 표시
- 부족 항목 목록에서 `자유 연구 해보기·바꿔보기·시험하기`와 `내가 한 가지 이상 바꾸기` 중복 표시 제거
- 구형 sortable 정렬 코드와 `.sort-*` 스타일 제거
- Day02 `researchBridge`가 `입력 → 처리 → 출력` 용어로 렌더 데이터 유지
- Day02 `researchBridge`의 공식 이전 결과 필드는 `todayDecision`을 우선 사용하고, 기존 임시 데이터용 `resultSummary`만 fallback으로 유지
- Day02 연결 문구가 Day01의 버튼+흔들기 경험과 모순되지 않음
- day06 `projectReload`, block13 입력, block14 비교 유지
- 미선택 상태 `?day=6` 접근 시 day06을 먼저 렌더링하지 않고 연구원 확인 화면 표시
- 학생 선택 후 기존 day06 `projectReload` 렌더 유지
- day08/day14 `phaseNotice`, day15 final 유지
- 오래된 Day02 연결 문구와 정렬 버튼 설명이 현재 UI 용어로 갱신됨

이번 localhost 실연결 검수:
- `runtime-config.js`, `research-days.js`, `app.js` HTTP 200 확인
- 실제 Apps Script `/exec?action=getStudents` fetch 성공
- `ok: true`, `count: 5` 확인
- 연구원 화면 학생 카드 5개 확인
- 익명 fallback 학생 미노출 확인
- `stu01` 선택·입장, 새로고침 session 복원, `연구원 바꾸기` 확인
- API 실패 mock에서 학생 카드 0개, 오류 메시지, 입장 불가 확인

검수용 Node VM 테스트는 실제 파일을 읽어 실행했고, 테스트용 localStorage/sessionStorage와 Apps Script 서비스는 메모리 객체로만 대체했습니다. localhost 실연결은 실제 브라우저 fetch로 확인했습니다. A/B Google Sheets E2E 저장시험은 아직 진행하지 않았습니다.

## 16. A/B 학생 기록 분리 테스트 방법

1. 새 세션에서 `stu01` 학생을 선택합니다.
2. day01 연구기록 입력칸에 A 전용 값을 입력합니다.
3. `futurelab2026:stu01:day01`에 값이 저장되었는지 확인합니다.
4. `연구원 바꾸기`를 누르고 `stu02` 학생을 선택합니다.
5. A의 입력, MakeCode 링크, 영상 playback URL이 보이지 않는지 확인합니다.
6. B 전용 값을 입력하고 `futurelab2026:stu02:day01`에 저장되었는지 확인합니다.
7. A → B → A → B로 반복 선택하며 두 키가 서로 덮어쓰지 않는지 확인합니다.

## 17. 수정한 파일 목록

```text
research-days.js
app.js
styles.css
runtime-config.js
index.html
00_PROJECT_SOURCE_INDEX.md
apps_script_phase1_spec.md
README.md
apps-script/
assets/day01/hardware-software.png
assets/day01/computer-microbit-flow.png
assets/day01/coding-send-test-fix.png
assets/day01/makecode-ui-guide.png
assets/day01/ipo-flow.png
assets/day01/makecode-pairing-guide.png
```

## 18. 아직 미구현

- A/B Google Sheets E2E 저장·복원 시험
- Cloudflare Pages 학생용 운영 배포
- GitHub 저장소 생성·연결
- 실제 학생환경 시험
- Day01 DayRecord/Quiz/Asset의 A/B end-to-end 저장 확인
- Google Drive 실제 업로드 코드
- 영상 바이너리 Drive 영구 저장
- 서버 Asset과 프로젝트 북 연결
- 실제 학생 PC 5대 동시 카메라 리허설
