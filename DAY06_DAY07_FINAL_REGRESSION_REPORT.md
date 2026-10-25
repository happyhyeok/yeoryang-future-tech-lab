# Day06·Day07 운영 전 최종 회귀 검수 — 2026-10-25

## 최종 판정: PASS_WITH_LIMITATIONS

독립 TEST Apps Script·Sheet·Drive와 별도 Cloudflare TEST Pages의 실제 HTTPS Preview에서 영상 업로드, 이미지 교체·복원, Day06·Day07 저장과 Day08 서버 확인 게이트를 검증했다. 운영 Production 및 실제 학생 기록에는 쓰지 않았다. **운영 반영 후보이나 즉시 운영 배포 판정은 아니다.** Drive 내장 영상 iframe의 재생 버튼까지 성공한 증거와 Day06 문제 원문을 실제로 수정·교체한 뒤 복원한 증거가 부족하다.

## 환경과 격리

- 기능 소스: `feature/day06-day07-image-evidence`, 기준 `8c8f7c4`. TEST Apps Script 독립 Web App 활성 버전 **5**. 운영 Apps Script 배포는 변경하지 않았다. Script ID·API 주소·인증정보는 Git과 로그에서 제외했다.
- 별도 TEST Pages 프로젝트: `yeoryang-image-e2e-test-20261025`. 검수 Preview: <https://acf03af9.yeoryang-image-e2e-test-20261025.pages.dev/> (Preview 배포 `acf03af9-dd2e-4a70-aedc-e0d4ca6d6b39`). 운영 Pages 프로젝트의 GitHub 연결, `node scripts/build-student-dist.cjs`, `dist`, Production `main`, 당시 운영 커밋 `aabf454`를 읽기 전용 확인했다. 운영 Pages의 브랜치 Preview는 운영 API를 포함하므로 테스트 학생으로 사용하지 않았다.
- TEST 런타임은 가상 A/B와 TEST API만 제공한다. 공개 빌드 54개 파일, 합계 38,670,172바이트가 업로드 파일과 SHA-256 일치했다. `day-image-evidence.js` 포함. TEST Sheet·이미지 폴더·영상 폴더가 운영 ID와 다르고, TEST Apps Script 속성은 TEST 저장소가 운영 ID와 같으면 영상 업로드를 거부한다.
- 기존 S01–S13·S15–S18은 이전 보고서의 서버·브라우저 증거를 재사용했다. 이번 변경 영향이 있는 영상 분기와 Preview 이미지 UI는 재시험했다. 원본 학생 이미지 9장과 운영 기록은 쓰지 않았다.

## 실제 시험 결과

| 묶음 | 결과 | 실행 근거와 한계 |
| --- | --- | --- |
| V01–V04 | PASS | Day01/02/03 실제 WebM TEST 서버 업로드, Day01 교체. TEST Drive 폴더와 Sheet `09_자료파일`의 학생·Day·MIME·대표 파일을 직접 대조했다. |
| V05 | **부분 PASS** | TEST Drive의 실제 WebM(5,584바이트)을 다운로드해 Chromium HTML5 video에서 디코딩·재생 시간이 진행됨을 확인. 학생 UI 새로고침 후 Drive iframe과 Asset 참조 복원 PASS. Drive 내장 iframe의 재생 버튼 동작은 확인하지 못했다. |
| V06–V10 | PASS | A/B 별도 대표 Asset, MIME·6MB 초과 거부, DayRecord 영상 참조 자동저장, Day06 이미지 참조 불변. 학생 UI 가짜 카메라 촬영·업로드·재조회도 PASS. |
| D06-01–02 | PASS | TEST Day05 기록과 현재 문제를 브라우저에서 조회. |
| D06-03–04 | **부분 PASS** | 유지·수정/교체 진입·취소와 이전 내용 복원 PASS. 실제 Day05 원문을 변경·저장한 후 Day06으로 되돌아오는 분기는 NOT_RUN. |
| D06-05–11 | PASS | 아이디어 2개 최소, 3개 기본, 모든 입력 아이디어 비교, 최종 선택·이유, 오답 후 정답, 실제 DayRecord `minimum`→`basic`. TEST Sheet `06_퀴즈결과` A06 4/4 완료를 직접 조회. |
| D06-12–15 | PASS | 이미지 참조 유지, 새로고침 값 복원, 저장 요청 실패 주입 시 서버 기존 행 유지·재시도 성공, Day07 이전 연구 연결. |
| D07-01–07 | PASS | Day06/Day05 연결, 센서 값 조작, 방향·입력·판단·출력·첫 목표, 오답 후 정답을 Chromium에서 조작. TEST Sheet QuizResult A07/B07 각각 3/3 완료 조회. |
| D07-08–09 | PASS | 최소·기본 및 추가 작성(`day07BasicReady`) 조건을 서버 재조회. Day08은 저장된 Day07 완료 기록이 있을 때만 개방. 완료 수준 필드는 기존 설계대로 `basic` 유지. |
| D07-10–12 | PASS | `saveDayRecord` 차단 시 로컬 완료 표시에도 Day08 링크와 직접 접근 차단. 재시도 후 서버 `completed`와 링크 확인. |
| D07-13–15 | PASS | TEST 이미지 교체 후 참조 및 계획 필드 재조회, 새로고침 복원, A/B 다른 기록 확인. |
| P01–P03 | PASS | TEST Preview HTTPS, 54개 공개 파일 해시 일치, 가상 A/B 전환. |
| P04–P12 | PASS | Day06/07 수업·이미지 등록/교체/복원·퀴즈·Day08 게이트. 이미지 테스트는 390×844, 650×900, 1440×900에서 모두 PASS. |
| P13 | **부분 PASS** | 학생 UI 영상 업로드 및 새로고침 후 Drive iframe 복원. 내장 iframe 재생 조작은 미검증(V05 참조). |
| P14–P16 | PASS | 학생 분리, Day06/07 저장 실패·재시도, 세 화면 크기에서 가로 넘침 없음. 31개 캡처 중 탐색용 1개를 제거해 최종 30개 보관. |

## 직접 저장소 대조

- TEST Sheet `09_자료파일`: Day01/02/03 TEST A와 Day01 TEST B 영상 대표 Asset 4행, 각 WebM MIME 및 서로 다른 소유자/Day. 학생 UI 재업로드로 A01 대표 파일은 새 파일로 바뀌었다. TEST Drive의 `영상증거 / studentId / dayId` 하위 파일 생성, 실제 WebM EBML 헤더와 브라우저 재생 확인. 구파일은 교체 성공 후에도 보존했다.
- TEST Sheet `05_학생연구기록`: A01 영상 참조, A/B Day06·Day07 이미지 참조와 기록 필드가 공존. TEST `06_퀴즈결과`: A06 `4/4`, A07·B07 `3/3`, `completed=TRUE` 직접 조회. 자동저장과 교체 뒤 이미지 참조가 남아 있다.
- TEST Sheet `03_연구일`의 날짜가 앱 수업 날짜와 다른 초기 설정 오류를 발견해 **TEST 가상 행만** 수정했다. 당시 Day06 저장은 `INVALID_REQUEST`로 거부되었고, 날짜 보정 후 세 viewport에서 서버 저장·재조회 PASS.

## 오류 수정과 재시험

1. **TEST 영상 폴더가 운영 폴더를 가리킬 위험**: `apps-script/VideoService.gs`의 고정 루트 의존을 환경별 Script Property 조회로 보완했다. TEST는 운영 Sheet·영상 폴더 ID와 다를 때만 업로드한다. 기존 운영 폴더 이름 검사와 `student/day` 저장 구조를 유지한다. TEST 배포 버전 5에서 V01–V10 영향 범위를 재시험했다.
2. **TEST 연구일 날짜 불일치**: TEST Sheet의 가상 day01/day05/day06 날짜만 학생 앱 설정에 맞췄다. 운영 Sheet 변경 없음. D06/D07 저장 검사를 다시 통과했다.
3. **검수 스크립트의 선택자와 저장 대기 조건**: 복수 `summary`·중복 상태 문구를 특정 DOM으로 좁혔다. Day07 추가 작성 검사는 이전 기록 로드를 기다리고 필요한 필드를 명시 입력한 후 재검수했다. 학생 제품 코드 변경은 없었다.

## 미검증과 운영 전 결정

- Drive 내장 `/preview` iframe은 로드되지만 자동화된 Chromium에서 내장 플레이어 재생이 진행되지 않았다. 원본 Drive 파일 자체의 HTML5 재생은 PASS. 운영 영상 UX는 실제 학생 브라우저/권한에서 클릭 재생을 확인해야 한다.
- Day06 문제 원문을 실제 수정하거나 새 문제로 교체한 뒤 Day05/06 전체 흐름을 재검수하지 않았다. 진입·취소·기존 내용 복구만 확인했다.
- 운영 Apps Script의 실제 Script Properties 값·현재 배포 소스와 TEST 배포 버전 5의 완전 동등성, 운영 영상 폴더 권한, 기존 이미지 9장의 개별 접근 권한은 읽기 전용 범위에서 완전 확인하지 못했다. 운영 쓰기·설정 변경·Production 배포는 실행하지 않았다.
- 학생 이미지에는 Day별 대표 1장만 표시한다. 교체 성공 후 구파일은 즉시 삭제하지 말고 보존 기간을 정한다. 개별 `ANYONE_WITH_LINK`가 개인정보에 적절한지 운영 전에 결정한다. 학생 선택 화면은 본인 인증이 아니다.

## 증거와 재실행

- 로그: `verification/day-video-live-api.log`, `day-video-drive-playback.log`, `day-preview-video-browser.log`, `day-lesson-live-browser.log`, `day06-save-failure.log`, `day07-extended-browser.log`, `day-preview-failure-gates.log`, `day-preview-image-browser.log`, `day-preview-static.log`.
- 화면: `verification/final-screenshots/`의 390×844·650×900·1440×900 Day06/07 및 Day01 영상 PNG. 기존 이미지 S01–S18 자료는 `verification/screenshots/`와 이전 보고서에 있다.
- 설정과 실행법은 `DAY06_DAY07_TEST_ENVIRONMENT.md`, 운영 반영 판단은 `DAY06_DAY07_IMAGE_RELEASE_CHECKLIST.md` 참조. 외부 주소는 TEST Preview만 기록한다.
