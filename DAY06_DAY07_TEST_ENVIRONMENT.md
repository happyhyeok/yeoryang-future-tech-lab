# Day06·Day07 이미지 TEST 환경

2026-10-25 생성. Script ID·배포 URL·토큰은 Git에 기록하지 않는다. 독립 프로젝트의 `.clasp.json`은 Git 밖 로컬 `C:\Users\USER\Desktop\여량초-image-e2e-test-script`에 있다.

| 자원 | TEST | 운영과 분리 |
| --- | --- | --- |
| Sheet | [가상 데이터 전용 Sheet](https://docs.google.com/spreadsheets/d/1nNXSKBjtPYe-X_knyq5YgCr5xRODQBpNmwprtdslboI/edit) | 운영 Sheet와 ID 불일치 확인 |
| 이미지 Drive | [TEST 폴더](https://drive.google.com/drive/folders/1_2QjztAWTLByDXBQ0CZSEkodcxKp5B6Y) | 운영 원본 폴더와 ID 불일치 확인 |
| 영상 Drive | [TEST 영상 루트](https://drive.google.com/drive/folders/1vCbKo4D8afz8FOWQptXtyiRe0WxWWLhs) | 운영 영상 루트와 ID·하위 파일 분리 확인 |
| Apps Script | 별도 독립 프로젝트, 최종 Web App 버전 3 | 운영 프로젝트를 push·redeploy하지 않음 |
| 학생·작품 | `test_student_a/test_work_a`, `test_student_b/test_work_b` | 실명·운영 기록 없음 |

TEST Script Properties: `ENVIRONMENT=TEST`, `SPREADSHEET_ID`, `IMAGE_STORAGE_FOLDER_ID`, `PRODUCTION_SPREADSHEET_ID`, `PRODUCTION_IMAGE_STORAGE_FOLDER_ID`, `PROJECT_ID`. 속성 값은 TEST 콘솔에서 확인한다. TEST 서버는 Sheet 또는 이미지 폴더가 운영 ID와 일치하면 업로드 전에 거부한다. 운영 배포에는 이 설정을 복사하지 않는다.

2026-10-25 최종 회귀에서 TEST 프로젝트에 `VIDEO_STORAGE_FOLDER_ID`와 `PRODUCTION_VIDEO_STORAGE_FOLDER_ID`를 추가하고, 영상 루트도 TEST/운영 ID가 같으면 거부하도록 했다. 독립 TEST Web App의 활성 배포는 **버전 5**다. 위 버전 3은 최초 이미지 검수 당시의 이력이다. 운영 Apps Script 배포·속성은 변경하지 않았다.

별도 Cloudflare TEST Pages 프로젝트의 HTTPS Preview는 <https://acf03af9.yeoryang-image-e2e-test-20261025.pages.dev/>. TEST 가상 A/B와 TEST API만 포함한 `image-test-preview/` 공개 빌드 54개를 Direct Upload로 배포했다. 운영 Pages 프로젝트와 도메인/Production을 변경하지 않았다. 브랜치 자동 Preview는 운영 API를 사용하므로 가상 데이터 시험에 사용하지 않는다.

TEST Sheet `03_연구일`의 가상 day01·day05·day06 날짜를 학생 앱 기준 날짜로 보정했다. TEST Sheet의 `05_학생연구기록`, `06_퀴즈결과`, `09_자료파일`과 TEST 영상 Drive를 직접 재조회했다.

TEST Sheet에는 학생·작품·연구일 가상 행과 DayRecord·QuizResult·Asset 헤더를 넣었다. 시간대는 Asia/Seoul이다. 실검수 후 가상 학생 A/B의 이미지 Asset·DayRecord 행이 존재한다. 메타데이터·행·Drive 파일을 Google API로 재조회했다. 최종 TEST 원격 소스는 별도 `clasp pull`로 15개 Apps Script 파일만 있음을 확인했다.

## 재개 순서

1. TEST Script Properties와 배포 버전 3을 확인한다. Google 권한 승인은 완료됐다.
2. TEST Web App `ping`, `getStudents`를 확인한다. 현재 두 가상 학생만 반환한다.
3. 코드 변경 시 TEST 프로젝트만 push·새 버전 배포한다.
4. TEST/운영 Sheet·폴더 ID를 다시 비교한다. 같으면 업로드 중단.
5. 가상 A/B만으로 S01–S18을 실행하고 TEST Sheet 행과 TEST Drive 파일을 직접 조회한다. 현재 TEST 슬롯은 비어 있지 않으므로 최초 등록 시험은 새 가상 슬롯에서 실행한다.
6. TEST API를 사용하는 격리 Preview를 구성한다. 운영 API·실제 학생 명단이 Preview에 남지 않도록 확인한다. 로컬에서는 `IMAGE_TEST_API_URL`을 TEST `/exec` 주소로 지정한 뒤 `node scripts/build-image-test-preview.cjs`와 `node tests/serve-image-preview.cjs`를 실행한다. 출력 `image-test-preview/`는 Git에 포함하지 않는다.

최종 회귀 재실행은 로컬 설정 파일 `image-test-preview/runtime-config.js`에서 TEST API를 **실행 프로세스 환경변수** `IMAGE_TEST_API_URL`로 읽고, `IMAGE_PREVIEW_URL`은 위 TEST HTTPS Preview로 지정한다. `IMAGE_TEST_SHEET_ID`와 `IMAGE_PRODUCTION_SHEET_ID`가 다름을 선확인한다. 영상은 `node tests/day-video-live-api.cjs`, `node tests/day-video-drive-playback.cjs`, `node tests/day-preview-video-browser.cjs`; Day06/07은 `node tests/day-lesson-seed.cjs`(필요할 때만), `node tests/day-lesson-live-browser.cjs`, `node tests/day06-save-failure.cjs`, `node tests/day-preview-failure-gates.cjs`, `node tests/day07-extended-browser.cjs`; Preview 파일과 이미지는 `node tests/day-preview-static.cjs`, `node tests/day-preview-image-browser.cjs`로 검사한다. 실제 서버 스크립트는 가상 TEST 행을 변경하므로 운영 URL로 연결하지 않는다. 상세 결과는 `DAY06_DAY07_FINAL_REGRESSION_REPORT.md`.

로컬 검사: `node --test tests/day-image-evidence.test.cjs tests/day-image-ui.test.cjs`, `node --check day-image-evidence.js`, 출력 `dist`가 없는 곳에서 `node scripts/build-student-dist.cjs`. 잠금 갱신은 검토한 학생용 변경에 한해 `node scripts/review-image-dist-lock.cjs`. 실서버 스크립트에는 TEST URL과 TEST/운영 Sheet·폴더 ID를 환경변수로 제공한다. 원격 주소·Script ID를 로그에 출력하지 않는다.
