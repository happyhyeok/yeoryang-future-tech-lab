# Day06·Day07 이미지 실연결 E2E — 2026-10-25

## 최종 판정: PASS_WITH_LIMITATIONS

독립 TEST Apps Script·Sheet·Drive와 로컬 격리 Preview를 실제로 연결했다. 가상 학생 A/B의 Day06·Day07 이미지 등록, 교체, 서버·Sheet·Drive 재조회, Chromium 세 viewport의 새로고침·새 브라우저 세션 복원과 학생 분리가 성공했다. **Cloudflare Production 배포와 실제 학생 이미지 9장 등록은 실행하지 않았다.** 제한은 아래에 명시한다.

## 테스트 환경과 운영 분리

- 시험한 배포: 운영 프로젝트와 다른 TEST Apps Script Web App. 초기 버전 1에서 권한 승인 후 `ping` 성공, 최종 활성 배포 버전 **3**에서 `ping`과 학생 조회 성공. Script ID·배포 URL·토큰은 Git에 기록하지 않았다.
- TEST Sheet와 TEST 이미지 폴더는 운영 Sheet·원본 폴더와 각각 ID가 다르다. TEST Script Properties의 `ENVIRONMENT=TEST`와 운영 ID 비교가 일치 시 업로드를 차단한다. TEST에는 가상 학생·작품 2쌍과 Day06/07만 있다.
- 최종 TEST 원격 소스를 별도 `clasp pull`로 재조회해 매니페스트와 Apps Script 파일 총 15개만 남았음을 확인했다. 중간 테스트 배포 버전 2에 로컬 보관용 미리보기 파일이 함께 push된 오류를 발견했고, TEST 프로젝트에서 제거한 뒤 버전 3으로 다시 배포했다. 운영 프로젝트에는 push하지 않았다.
- 원본 Drive 폴더의 학생 이미지 파일명 대응은 이전 검수의 Day06 5장·Day07 4장과 같다. 남은식 Day07은 미등록 정상 상태다. 원본 이미지 파일과 운영 학생 행은 쓰지 않았다.

## 실제 시험 판정

| ID | 결과 | 근거 |
| --- | --- | --- |
| S01 Day06 최초 등록 | PASS | TEST Drive 파일 생성, Sheet Asset·DayRecord 참조, API 재조회 |
| S02 Day06 교체 | PASS | 대표 파일 ID 변경, 구파일 유지, 브라우저 새 이미지 표시 |
| S03 Day07 최초 등록 | PASS | A/B Day07 TEST 저장, Day06과 독립 |
| S04 Asset 재조회 | PASS | TEST Sheet 4행의 학생·Day·파일 ID와 API 대조 |
| S05 DayRecord 재조회 | PASS | TEST Sheet 4행의 `personalEvidenceRefs` 대조 |
| S06 저장 실패 주입 | PASS | TEST DayRecord 소유 작품값 임시 불일치 → 서버 거부·기존 Asset/파일 유지 → 값 복구 |
| S07 PNG | PASS | TEST 서버 저장·Drive MIME 확인 |
| S08 JPG | PASS | TEST 서버 저장·Drive MIME 확인 |
| S09 WEBP | PASS | TEST 서버 저장·Drive MIME 확인 |
| S10 3MB 초과 | PASS | 서버 거부·대표 파일 불변 |
| S11 위장 형식 | PASS | JPEG 내용을 PNG로 요청해 서버 거부·대표 파일 불변 |
| S12 학생 A/B | PASS | 독립 Asset/DayRecord·서로 다른 브라우저 이미지 |
| S13 자동저장 동시 실행 | PASS | 이미지 업로드+DayRecord 저장 동시 요청, 참조와 다른 기록 필드 유지; 동일 이미지 연속·동시 업로드도 대표 참조 1개 유지 |
| S14 영상 저장 회귀 | **부분 검증** | TEST 서버의 `uploadVideo` 영상 검증 분기 진입 PASS. 실제 영상 파일 업로드 NOT_RUN: 기존 `VIDEO_STORAGE`가 운영 폴더를 사용하므로 분리 원칙상 실행 금지 |
| S15 교체 중 학생 전환 | PASS | A 업로드 진행 중 B 전환 후 B 이미지 불변 |
| S16 업로드 응답 실패 | PASS | TEST 서버 쓰기 후 브라우저 응답만 차단, 재조회로 새 이미지 복원 |
| S17 새 브라우저 세션 | PASS | 독립 Chromium context에서 A/B Day06·Day07 이미지 복원 |
| S18 이미지 로딩 실패 | PASS | Drive 썸네일 요청 차단, 깨진 이미지 숨김·짧은 오류 표시 |

TEST Sheet/Drive 직접 대조는 `verification/day-image-storage-readback.md`. 서버 로그는 `verification/day-image-live-api.log`, `day-image-s06.log`, `day-image-concurrency.log`, `day-image-video-route.log`. 실제 브라우저 로그는 `day-image-live-browser.log`, `day-image-live-failures.log`이며 `verification/screenshots/`에 viewport/day/student/scenario를 포함한 PNG 21개가 있다.

## 수정과 공개 빌드

- 이미지 저장 폴더를 `IMAGE_STORAGE_FOLDER_ID` Script Property로 바꾸고 TEST 운영 ID 차단을 추가했다. `PROJECT_ID` 속성을 TEST 파일명에도 반영했다. 영상 저장 코드와 운영 설정은 건드리지 않았다.
- 이미지 조회 실패에서 `다시 시도`, 썸네일 실패에서 오류·깨진 이미지 숨김을 적용했다. 실브라우저에서 교체 후 서버 저장은 성공하지만 화면이 이전 이미지에 머무르는 오류를 발견했다. 조회 GET마다 식별자를 부여하고 화면 재렌더 뒤에는 완료 시 다시 조회하며, 업로드 응답 손실 시 서버 상태를 재확인하도록 수정했다.
- 54개 학생용 파일 허용 목록·해시 빌드 PASS. `day-image-evidence.js`가 `dist`와 HTML 로딩 순서에 포함됐다. 최종 빌드 Manifest SHA-256은 `verification/day-image-build.log`에 있다. Node 모의·합성 Chromium UI 시험 **9/9 PASS**.

## 제한·운영 반영 전 조치

1. 브라우저 시험은 **로컬 격리 Preview + 실제 TEST Apps Script/Sheet/Drive**다. Cloudflare Preview·Production은 배포·검수하지 않았다. 실제 운영 반영 가능 판정은 별도다.
2. Day06/07 기존 화면과 저장 진입은 브라우저에서 확인했고 DayRecord의 다른 필드는 동시 저장 후 유지됐다. 기존 퀴즈 전체·완료 판정·다음 연구 개방과 실제 영상 업로드 전체 회귀는 NOT_RUN이다.
3. 동일 학생의 두 브라우저가 **서로 다른 연구기록 문장을 동시에 편집**할 때의 충돌 해결은 기존 전체 레코드 저장 계약 범위에 남아 있다. 이번에는 동시 이미지 업로드·자동저장과 대표 참조의 무결성만 검증했다.
4. 학생 이름 선택은 본인 인증이 아니다. TEST 브라우저 표시를 위해 이미지 파일에 개별 `ANYONE_WITH_LINK`를 적용했다. 폴더 전체는 공개하지 않았다. 링크를 아는 사람의 열람 가능성과 성공한 교체 후 구파일 보존·정리 정책을 운영 전에 검토해야 한다.
5. TEST Web App은 가상 데이터 전용이지만 익명 접근 가능하다. 재사용할 때 접근·보존 범위를 다시 확인한다. 운영 Production의 Script Properties, Cloudflare 설정, 실제 학생 데이터는 변경하지 않았다.

## 재실행

`DAY06_DAY07_TEST_ENVIRONMENT.md`의 로컬 TEST 설정과 분리 확인을 먼저 수행한다. `node --test tests/day-image-evidence.test.cjs tests/day-image-ui.test.cjs`, `node scripts/build-student-dist.cjs`(출력 `dist`가 없는 작업 영역), 환경변수 제공 후 `tests/day-image-live-api.cjs`, `day-image-concurrency.cjs`, `day-image-live-browser.cjs`, `day-image-live-failures.cjs`를 실행한다. 최초 등록 스크립트는 빈 TEST 슬롯에서만 재실행한다. 운영 자원에 이 스크립트를 연결하지 않는다.
