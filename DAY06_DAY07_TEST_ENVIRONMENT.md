# Day06·Day07 이미지 TEST 환경

2026-10-25 생성. Script ID·배포 URL·토큰은 Git에 기록하지 않는다. 독립 프로젝트의 `.clasp.json`은 Git 밖 로컬 `C:\Users\USER\Desktop\여량초-image-e2e-test-script`에 있다.

| 자원 | TEST | 운영과 분리 |
| --- | --- | --- |
| Sheet | [가상 데이터 전용 Sheet](https://docs.google.com/spreadsheets/d/1nNXSKBjtPYe-X_knyq5YgCr5xRODQBpNmwprtdslboI/edit) | 운영 Sheet와 ID 불일치 확인 |
| 이미지 Drive | [TEST 폴더](https://drive.google.com/drive/folders/1_2QjztAWTLByDXBQ0CZSEkodcxKp5B6Y) | 운영 원본 폴더와 ID 불일치 확인 |
| Apps Script | 별도 독립 프로젝트, Web App 버전 1 | 운영 프로젝트를 push·redeploy하지 않음 |
| 학생·작품 | `test_student_a/test_work_a`, `test_student_b/test_work_b` | 실명·운영 기록 없음 |

TEST Script Properties: `ENVIRONMENT=TEST`, `SPREADSHEET_ID`, `IMAGE_STORAGE_FOLDER_ID`, `PRODUCTION_SPREADSHEET_ID`, `PRODUCTION_IMAGE_STORAGE_FOLDER_ID`, `PROJECT_ID`. 속성 값은 TEST 콘솔에서 확인한다. TEST 서버는 Sheet 또는 이미지 폴더가 운영 ID와 일치하면 업로드 전에 거부한다. 운영 배포에는 이 설정을 복사하지 않는다.

TEST Sheet에는 학생·작품·연구일 가상 행과 DayRecord·QuizResult·Asset 헤더를 넣었다. 시간대는 Asia/Seoul이다. 메타데이터와 가상 행을 Google API로 재조회했다.

## 재개 순서

1. 열린 Chrome TEST Apps Script 프로젝트에서 Google 권한 검토·승인을 완료한다.
2. TEST Web App `ping`, `getStudents`를 확인한다. 403이 지속되면 배포 접근과 실행자 권한을 조사한다.
3. 코드 변경 시 TEST 프로젝트만 push·새 버전 배포한다.
4. TEST/운영 Sheet·폴더 ID를 다시 비교한다. 같으면 업로드 중단.
5. 가상 A/B만으로 S01–S18을 실행하고 TEST Sheet 행과 TEST Drive 파일을 직접 조회한다.
6. TEST API를 사용하는 격리 Preview를 구성한다. 운영 API·실제 학생 명단이 Preview에 남지 않도록 확인한다. 로컬에서는 `IMAGE_TEST_API_URL`을 TEST `/exec` 주소로 지정한 뒤 `node scripts/build-image-test-preview.cjs`를 실행한다. 출력 `image-test-preview/`는 Git에 포함하지 않는다.

로컬 검사: `node --test tests/day-image-evidence.test.cjs`, `node --check day-image-evidence.js`, 출력 `dist`가 없는 곳에서 `node scripts/build-student-dist.cjs`. 잠금 갱신은 검토한 학생용 변경에 한해 `node scripts/review-image-dist-lock.cjs`.
