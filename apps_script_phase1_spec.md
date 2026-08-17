# Day01 Apps Script 1차 개발·데이터 계약 명세

버전: v1.1.0  
문서 역할: Day01 Apps Script 개발·데이터 계약 기준

## 1. 목적

학생용 웹페이지의 Day01 연구 데이터를 Google Sheets에 영구 저장하고, 같은 학생이 다시 접속했을 때 자신의 기록을 정확하게 복원할 수 있도록 Apps Script 백엔드를 구축한다.

1차 개발 범위:

```text
학생 선택
→ Day01 활동
→ 저장
→ 새로고침/재접속
→ 동일 학생 기록 복원
```

저장 대상:

- `05_학생연구기록`: DayRecord
- `06_퀴즈결과`: QuizResult
- `09_자료파일`: MakeCode 링크 및 자료 메타데이터

프로젝트 기록의 중심 단위는 15개 `ResearchDay`의 `DayRecord`이며, 32개 `LessonBlock`은 DayRecord 내부 진행상태이다.

## 2. 고정 원칙

학생 식별:

```text
studentId
→ workId
→ dayId
→ DayRecord
```

- 학생은 이름 선택 방식으로 식별한다.
- 로그인, 비밀번호, PIN, 인증코드, 학생번호 직접 입력은 사용하지 않는다.
- 실제 데이터 연결 기준은 화면의 이름 텍스트가 아니라 `studentId`이다.
- `01_학생.active`가 `false`인 학생은 유효한 학생으로 인정하지 않는다.
- `02_작품.workId`는 해당 `studentId`와 연결되어야 한다.

## 3. Apps Script 책임 범위

Apps Script가 담당하는 것:

- 요청값 검증
- 학생·작품·연구일 관계 검증
- 데이터 저장
- 기존 행 ID 기반 upsert
- 데이터 조회
- 저장 시각 관리
- JSON 응답
- 중복 행 방지
- 데이터 무결성 보장

Apps Script가 담당하지 않는 것:

- Day01 최소 수행 조건 계산
- Day01 기본 완성 조건 계산
- 연구 단계 잠금 해제 판단
- 퀴즈 교육 내용 판단
- Day01 UI 상태 해석

교육적 판정은 `app.js`와 `research-days.js`에서 수행하고, Apps Script는 전달받은 판정값과 상태를 검증·저장한다.

## 4. API action

1차 범위의 action:

```text
ping
getStudents
getDayRecord
saveDayRecord
saveQuizResult
upsertAsset
```

Day02~Day15 Apps Script 연동과 프로젝트 북 연결은 1차 범위가 아니다. Day01 영상은 `uploadVideo` action으로 Google Drive 파일, `09_자료파일` video Asset, `05_학생연구기록.personalEvidenceRefs`를 연결한다.

## 4-1. `getStudents` 계약

`getStudents`는 Google Sheets `01_학생`, `02_작품`을 학생 기준데이터의 단일 출처로 사용해 연구원 확인 화면에 표시할 active 학생 목록을 반환한다.

생성 기준:

- `01_학생`을 읽는다.
- `studentId`가 빈 행은 무시한다.
- `studentId`가 있는 전체 기준데이터에서 `studentId` 중복을 먼저 검증한다.
- `studentId`가 있는 전체 기준데이터에서 `workId`가 있으면 `workId` 중복을 먼저 검증한다.
- 그 후 `active=TRUE`인 학생만 반환 후보로 삼는다.
- `studentId`, `studentName`, `workId`가 모두 있어야 한다.
- `02_작품`에서 같은 `workId`가 존재해야 한다.
- `02_작품.studentId`가 `01_학생.studentId`와 일치해야 한다.
- `02_작품`의 `workId` 중복을 허용하지 않는다.
- 학생 1명 ↔ 작품 1개 기준이므로 `02_작품`에서 같은 `studentId`가 여러 `workId`에 연결되는 것을 허용하지 않는다.
- Google Sheet의 기존 학생 행 순서를 유지한다.

응답 필드는 다음 3개만 사용한다.

```text
studentId
studentName
workId
```

열 번호 위치가 아니라 Header Map / SheetRepository 방식으로 읽는다. 학생-작품 관계가 잘못되어 있으면 잘못된 관계를 프론트에 보내지 않고 validation 오류로 처리한다.

## 5. DayRecord 계약

`05_학생연구기록`의 핵심 열:

```text
dayRecordId
studentId
workId
dayId
date
blockProgress
role
activities
todayDecision
discovery
difficulty
changeMade
changeReason
nextAction
personalEvidenceRefs
commonEvidenceRefs
minimumCompleted
completionLevel
status
studentReflection
dayStateJson
createdAt
updatedAt
```

Day01 저장 매핑:

| DayRecord 열 | 기준 |
| --- | --- |
| `dayRecordId` | `dayrec_{studentId}_{dayId}` 서버 생성 |
| `studentId` | 현재 학생, 필수 |
| `workId` | 현재 학생 작품 ID, 필수 |
| `dayId` | `day01` |
| `date` | `FUTURE_LAB_CONFIG.dayDates.day01` 또는 연구일 기준 |
| `blockProgress` | block01~03 진행상태 JSON |
| `role` | Day01에서는 빈 값 |
| `activities` | 완료 주요 활동 JSON 배열 |
| `todayDecision` | 실제 micro:bit 입력·출력 활동 후 자동 생성 |
| `discovery` | 발견 문제 자동 요약 |
| `changeMade` | 직접 변경 내용이 있으면 저장 |
| `nextAction` | `recordValues.nextSensor`가 있을 때만 자동 생성 |
| `personalEvidenceRefs` | Asset ID 배열 |
| `commonEvidenceRefs` | `[]` |
| `minimumCompleted` | 프론트엔드 판정 Boolean |
| `completionLevel` | `""`, `minimum`, `basic`, `advanced` |
| `status` | `not_started`, `in_progress`, `completed`, `needs_review` |
| `dayStateJson` | Day01 전체 UI 상태 JSON |
| `createdAt` | 최초 생성 시 서버 시각 |
| `updatedAt` | 저장 때마다 서버 시각 |

Apps Script는 `dayStateJson` 내부의 `studentId`, `workId`, `dayId`를 외부 payload에서 검증된 값으로 강제 정규화한다.

## 6. Day01 완료값 저장 원칙

Day01 최소 수행:

```text
A 버튼 → LED 기본 작동 성공
```

프론트엔드 코드 기준:

```javascript
buttonToolCompleted &&
unlockedTools.includes("LED 출력")
```

`minimumCompleted`는 프론트엔드에서 계산된 Boolean을 저장한다. Apps Script에서 다시 계산하지 않는다.

`basicCompleted`는 Day01의 전체 활동·증거·퀴즈·연구기록 기준을 만족할 때 프론트엔드에서 계산한다. 서버 저장 성공, Google Sheets 저장 성공, Asset API 성공 여부를 교육 완료조건으로 새로 넣지 않는다.

`completionLevel` 저장값:

```text
""
minimum
basic
advanced
```

진행 상태는 `status`가 담당하며, `in_progress`를 `completionLevel`에 저장하지 않는다.

## 7. `selectedRoles`

`selectedRoles`는 실제 맡은 역할이 아니라 학생이 해보고 싶은 역할이다.

```text
05_학생연구기록.role = ""
dayStateJson.selectedRoles = 선택 역할
```

Apps Script는 `selectedRoles`를 `role` 열에 넣지 않는다.

## 8. `todayDecision` / `nextAction`

`todayDecision`은 학생에게 별도 입력란을 추가하지 않고 실제 Day01 활동 결과로 자동 생성한다.

- 실제 micro:bit 입력·출력 활동이 없으면 `todayDecision=""`
- A 버튼 완료 후에는 A 버튼 입력과 LED 출력 활동을 반영한다.
- 흔들기까지 완료하면 실제 사용한 기능을 반영한다.

`nextAction`은 `recordValues.nextSensor`가 있을 때만 생성한다.

- `recordValues.nextSensor` 없음: `nextAction=""`
- 입력 있음: 다음에 알아볼 상태를 자동 문장으로 저장

UI 안내용 fallback 문구와 학생 기록 데이터는 분리한다.

## 9. `dayStateJson`

`dayStateJson`은 Day01 화면을 복원하기 위한 원본 상태이다. 예시 필드:

```text
selectedRoles
discoveredProblem
problemHelpMatch
researchOrder
ipoConceptChecked
makeCodeUiCheckItems
pairingChecklist
codePredictionSelections
buttonChecklist
buttonToolCompleted
shakeFeatureFound
shakeLedChoice
shakeChecklist
shakeToolCompleted
freeResearchSteps
usedFeatures
peerTestResult
makeCodeShareUrl
quizAnswers
recordValues
videoAssetId
videoFileId
videoStorageFileId
videoPlaybackUrl
videoStorageUrl
videoFileName
videoMimeType
videoCapturedAt
videoPersisted
videoRetakeInProgress
supersededVideoEvidence
serverSyncPending
localRevision
localUpdatedAt
serverUpdatedAt
```

기존 localStorage에 새 필드가 없어도 `createDefaultDayState()`와 `normalizeDayState()`에서 기본값을 제공해야 한다.

## 10. localStorage / 서버 저장 관계

기본 흐름:

```text
학생 입력
→ localStorage 즉시 저장
→ Apps Script 서버 저장 시도
```

서버 저장 실패 시 학생 입력은 localStorage에 유지하고, 화면에는 `저장하지 못했어요`와 실패 복구용 `다시 저장`을 표시한다.

확정된 충돌 보호 필드:

```text
serverSyncPending
localRevision
localUpdatedAt
serverUpdatedAt
```

복원 기준:

- `serverSyncPending !== true`: 기존처럼 서버 기록 우선
- `serverSyncPending === true`: 현재 학생·작품·연구일과 일치하는 localStorage 기록 우선

local pending 기록을 우선 복원한 뒤에는 서버 재동기화를 1회 시도할 수 있다. 반복 `setInterval` 방식 retry는 만들지 않는다.

서버 저장 요청은 생성 시점의 `localRevision` snapshot을 보관한다. 저장 성공 후 현재 state 또는 localStorage의 revision이 요청 snapshot과 같을 때만 `serverSyncPending=false`로 바꾼다. 그 사이 더 큰 revision이 생기면 최신 입력이 아직 pending인 것이므로 true를 유지한다.

현재 코드 상태: `serverSyncPending`, `localRevision`, `localUpdatedAt`, `serverUpdatedAt` 기반 충돌 보호는 `app.js`에 반영되어 있다.

## 11. A/B 학생 분리

서버 저장 debounce/coalesce 단위는 최소 `studentId:dayId`이다.

```text
stu01:day01
stu02:day01
```

두 학생은 같은 pending slot을 공유하지 않는다. 같은 학생·같은 day의 빠른 자동저장만 최신 상태로 합칠 수 있다.

연구원 변경 직전 캡처한 이전 학생 payload는 학생 변경 후에도 서버 전송을 계속할 수 있다. 단, 완료 결과는 현재 화면 학생이 일치할 때만 UI에 반영한다.

검수 대상:

- selectedRoles
- 문제 선택
- 연구순서
- 체크상태
- MakeCode URL
- 퀴즈
- 연구기록
- completionLevel
- Asset

하나라도 A/B 사이에 섞이면 1차 개발 완료로 판단하지 않는다.

## 12. Asset 계약

`09_자료파일`은 MakeCode 링크와 영상 파일 메타데이터를 저장한다.

Day01 MakeCode Asset ID 기준:

```text
asset_{studentId}_{dayId}_makecode
```

Day01 video Asset ID 기준:

```text
asset_{studentId}_day01_video
```

Day01 video Asset은 `storageFileId`와 Drive preview URL을 함께 가져야 한다.

```text
storageFileId = 실제 Google Drive file ID
storageUrl = https://drive.google.com/file/d/{storageFileId}/preview
mimeType = video/webm 또는 video/mp4
```

MediaRecorder 녹화 MIME은 `video/webm;codecs=vp9`처럼 codec parameter를 포함할 수 있다. Apps Script `uploadVideo`, Drive Blob 생성, Asset 저장 단계에서는 `video/webm` 또는 `video/mp4` base MIME으로 정규화한다.

Day01 Drive 영상 저장 Apps Script manifest에는 `spreadsheets`, `drive`, `userinfo.email` OAuth scope가 필요하다. 운영 전 `verifyVideoStorage()`로 root folder 접근, 쓰기, 링크 공유, probe 파일 휴지통 처리를 확인한다.

Day01 MakeCode URL은 다음만 허용한다.

```text
https://makecode.microbit.org/...
```

`https://evil.example/?makecode.microbit.org`처럼 문자열만 포함한 주소는 허용하지 않는다.

기존 Asset 갱신 시 불변조건:

```text
existing.ownerType === incoming.ownerType
existing.ownerId === incoming.ownerId
existing.dayId === incoming.dayId
existing.assetType === incoming.assetType
```

불일치하면 갱신하지 않고 오류를 반환한다. MakeCode와 video는 각각의 Day01 Asset ID 규칙을 서버에서 검증한다.

## 13. QuizResult 계약

`saveQuizResult`는 Day01 퀴즈 응답을 저장한다.

- `studentId`는 유효한 active 학생이어야 한다.
- `dayId`는 유효한 연구일이어야 한다.
- `quizType`과 `answersJson`은 정해진 크기 제한 안에서 저장한다.
- 정답 여부와 별개로 Day01 프론트엔드의 퀴즈 완료 판정은 모든 문항 응답 여부를 기준으로 한다.

## 14. 입력 제한과 검증

익명 Web App 구조이므로 payload 크기와 필드 길이를 제한한다.

제한 대상:

- 일반 자유문장
- URL
- title
- description
- 배열
- `answersJson`
- `dayStateJson`
- POST body

오류 예:

```text
PAYLOAD_TOO_LARGE
FIELD_TOO_LONG
INVALID_ASSET_URL
ASSET_OWNER_MISMATCH
ASSET_ID_CONFLICT
STUDENT_NOT_FOUND
WORK_NOT_FOUND
```

학생이 작성한 텍스트를 Google Sheets 수식으로 실행하지 않도록 방어한다.

## 15. `setupProject()` 운영 검수

`setupProject()`는 기존 데이터를 삭제하거나 초기화하지 않는다.

검수 항목:

- 필수 시트 존재
- 필수 헤더 존재
- `dayStateJson` 존재
- `09_자료파일.updatedAt` 존재
- Apps Script timezone = `Asia/Seoul`
- Spreadsheet timezone = `Asia/Seoul`
- `day01` 존재
- `activeStudentCount`
- `validStudentWorkCount`
- `studentWorkWarnings`

`setupProject()`는 학생·작품 기준데이터를 읽은 직후 `getStudents`와 같은 무결성 검사를 수행한다. `01_학생` 전체 기준데이터의 `studentId` 중복, `01_학생` 전체 기준데이터의 `workId` 중복, `02_작품.workId` 중복, `02_작품.studentId` 중복은 setup 실패로 처리한다.

실제 운영 전 `01_학생`과 `02_작품`은 같은 ID 체계를 사용해야 한다.

```text
01_학생: studentId, studentName, workId, active
02_작품: workId, studentId
```

## 16. 1차 저장 E2E 완료 기준

다음은 source/static 수준이 아니라 실제 Apps Script Web App과 Google Sheets에서 확인해야 하는 E2E 완료 기준이다. `ping`과 `getStudents` 실데이터 조회는 완료되었지만, Day01 저장·복원 A/B E2E는 아직 남아 있다.

- `ping` 정상
- Day01 신규 저장
- 동일 DayRecord upsert
- `dayStateJson` 완전 복원
- `todayDecision` 자동 저장
- `selectedRoles`가 `role`에 들어가지 않음
- Day01 QuizResult 저장
- MakeCode Asset 저장
- personalEvidenceRefs 연결
- createdAt 유지
- updatedAt 갱신
- 학생·작품 관계 검증
- A/B 학생 기록 완전 분리
- 새로고침 후 복원
- 브라우저 임시저장 유지
- 저장 실패 시 학생 입력 손실 없음
- Apps Script·Spreadsheet 시간대 `Asia/Seoul`
- 기존 Day01 UI·완료조건 변경 없음

## 17. 현재 상태와 제외 범위

현재 상태:

```text
Day01 Apps Script Web App 배포·프론트 학생조회 연결 완료
/ A/B Google Sheets E2E 검증 전
```

실제 완료된 항목:

- Script Properties `SPREADSHEET_ID` 설정
- `setupProject()` 실행
- Apps Script Web App 배포
- `/exec` URL 확보
- `ping` 성공
- `getStudents` 실제 학생 5명 확인
- localhost 프론트 학생조회 연결 확인

이번 1차 기준에서 아직 하지 않는 작업:

- Day02~Day15 Apps Script 연동
- 실제 학생환경 Day01 영상 Drive 업로드 E2E 검증
- 새 인증 시스템 구현
