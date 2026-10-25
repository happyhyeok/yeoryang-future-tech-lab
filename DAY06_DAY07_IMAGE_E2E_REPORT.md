# Day06·Day07 이미지 실연결 검수 — 2026-10-25

## 최종 판정: FAIL

독립 TEST Sheet·Drive 폴더·Apps Script 프로젝트와 Web App 배포 버전 1을 구성했다. TEST와 PRODUCTION의 Sheet·폴더 ID가 각각 다름을 메타데이터와 Script Properties로 대조했다. 그러나 첫 TEST `ping`이 HTTP 403이었고 Google 실행 권한 승인을 기다리고 있다. 실제 이미지 업로드, Sheet/Drive 저장 재조회, Playwright 브라우저 복원은 실행하지 않았다. 코드·빌드 PASS는 실연결 PASS가 아니다.

## 이전 FAIL 원인 추적

| 이전 원인 | 현재 상태 |
| --- | --- |
| 이미지 폴더 ID가 운영 폴더로 하드코딩 | 해결: Script Properties `IMAGE_STORAGE_FOLDER_ID` 사용. TEST에서는 운영 Sheet·폴더와 일치 시 업로드 거부 |
| 테스트 Sheet·Drive 폴더 없음 | 해결: 가상 학생 A/B와 Day06/07을 가진 독립 자원 생성·재조회 |
| 테스트 Apps Script 배포 없음 | 해결: 독립 프로젝트 버전 1 생성. Google 실행 권한과 HTTP 403 미해결 |
| 이미지 모듈이 공개 빌드에 없음 | 해결: 54개 허용 목록·해시 재검토, `dist/day-image-evidence.js` 확인 |
| 실제 서버·브라우저 E2E 없음 | 미해결: 인증 후 S01–S18 및 Chromium 실행 필요 |

## 환경·코드 검증

- 기능 브랜치와 PR #1 유지. `main`, 운영 Apps Script, 운영 Sheet, 운영 Drive 원본, Production Pages는 변경하지 않았다.
- 시험한 Apps Script는 별도 독립 프로젝트 Web App 버전 1이다. Script ID·배포 URL은 Git에 기록하지 않고 로컬 비공개 clasp 설정과 Google 콘솔에 보존한다.
- TEST Sheet 7개 탭, 가상 학생·작품 각 2개, Day06/07 2개 및 별도 Drive 폴더를 생성·재조회했다. 운영 ID와 각각 다르다. TEST 저장 행·이미지 파일 생성은 아직 0건이다.
- `ImageService.gs`는 `ENVIRONMENT`, `SPREADSHEET_ID`, `IMAGE_STORAGE_FOLDER_ID`와 TEST의 운영 ID 비교 속성을 검사한다. TEST가 운영 자원을 가리키거나 폴더에 접근할 수 없으면 파일 생성 전에 거부한다. 실제 파일 생성 권한은 첫 TEST 업로드 때 검증된다.
- 기존 `uploadVideo` image 분기는 유지했다. 영상 코드와 `VIDEO_STORAGE`는 수정하지 않았다. 실제 영상 회귀는 NOT_RUN.
- 조회 실패 시 `다시 시도`; 조회·업로드 중 버튼 비활성화. 이미지 로딩 실패 시 깨진 미리보기 대신 오류 표시. 실제 브라우저 표시 여부는 미검증이다.
- 이미지는 개별 파일 `ANYONE_WITH_LINK` 방식이다. 전체 폴더 공유는 변경하지 않았다. 비공개 이미지 표시에는 별도의 서버 중계·인증 설계가 필요하다. 이름 선택은 본인 인증이 아니므로 타인 ID 사용 가능성이 남는다.
- 교체 성공 전 이전 파일은 휴지통으로 옮기지 않는다. 성공 후에도 이전 파일을 보존한다. 실패 시 기존 Asset 메타데이터 복구를 시도한다. 동시 업로드와 첫 등록의 부분 실패 복구는 실서버 미검증이다.

## S01–S18 및 브라우저

| 시험 | 결과 | 근거·미실행 이유 |
| --- | --- | --- |
| S01–S05 등록·교체·Day07 분리·Asset/DayRecord 재조회 | BLOCKED | TEST Web App 403·권한 승인 대기 |
| S06 교체 실패 복구 | 모의 PASS / 실서버 BLOCKED | Node Sheet 쓰기 오류 주입만 통과 |
| S07–S09 PNG/JPG/WEBP | BLOCKED | 실제 업로드 0건 |
| S10–S11 용량 초과·위장 파일 | 정적 검사 / 실서버 BLOCKED | 서버 검사 존재, 실제 거부 결과 없음 |
| S12–S13 학생 분리·자동저장 동시 실행 | BLOCKED | TEST 저장 API 접근 불가 |
| S14 영상 회귀 | NOT_RUN | TEST 서버 접근 불가 |
| S15–S18 학생 전환·응답 실패·새 세션·이미지 로딩 실패 | NOT_RUN | 실제 Preview와 TEST 저장 연결 전 |
| Chromium 390×844, 650×900, 1440×900 | NOT_RUN | 실연결 Preview 미구성; 이번 검수 캡처 없음 |

Node 모의 시험 5개와 합성 Chromium UI 시험 2개, JS 문법, `git diff --check`, 54개 공개 자산 빌드 및 이미지 모듈 포함은 PASS. 로그는 `verification/day-image-node-tests.log`, `verification/day-image-build.log`. 합성 Chromium은 실연결 브라우저 시험이 아니다. 실제 Sheet Asset/DayRecord 행·Drive 파일 저장 확인은 **NOT_RUN**이다. 이전 캡처를 이번 증거로 재사용하지 않는다.

## 운영 판정

운영 배포 **불가**. TEST 승인 후 `ping`, S01–S18, Sheet/Drive 행·파일, Playwright 세 viewport 및 기존 Day06/07 수업·영상 회귀를 완료해야 한다. 서버 응답 실패와 다중 브라우저 동시 변경에서 연구기록 필드 유실 여부도 확인해야 한다. 실제 학생 이미지 9장은 등록하지 않았다.
