# Day06·Day07 이미지 운영 반영 사전점검 — 2026-10-26

**판정: NOT_READY.** 독립 TEST의 이미지·연구기록·문제 수정 왕복은 검증했지만, 현재 운영 Apps Script 배포 버전 15에는 `ImageService`가 없고 운영 Script Properties에는 필수 `ENVIRONMENT`, `IMAGE_STORAGE_FOLDER_ID`가 없다. 운영 변경 없이 읽기 전용으로 확인했다. 현재 상태에서 이미지 기능 운영 반영을 승인할 수 없다.

## 근거와 환경

- 기능 브랜치 `feature/day06-day07-image-evidence`, 기존 PR #1. 운영 정적 사이트, Apps Script, Sheet, Drive에는 쓰지 않았다.
- TEST Apps Script 활성 Web App 버전 5의 `WebApi`, `Config`, `VideoService`, `AssetService`, `DayRecordService`, `ImageService`는 브랜치 소스와 줄바꿈 정규화 SHA-256이 일치했다. 독립 TEST Sheet·이미지/영상 Drive와 별도 HTTPS Preview를 사용했다.
- 운영 활성 Web App 버전 15는 별도 pull로 대조했다. `ImageService` 부재, 영상/Asset/DayRecord 서비스가 브랜치와 다름. 운영 Property는 `SPREADSHEET_ID`만 확인됐다. Web App은 소유자 권한 실행, 접근 대상은 모든 사용자로 설정돼 있다. ID와 URL은 이 공개 보고서에 기록하지 않는다.
- 운영/TEST Sheet의 `05_학생연구기록`, `06_퀴즈결과` 헤더는 일치한다. `09_Asset`는 필드명은 일치하지만 열 순서가 다르며 구현은 헤더명으로 읽는다. 원본 9 PNG는 지정 원본 폴더에 있고 각각 소유자만 접근 가능하다. 대응표는 Git 밖 비공개 파일에 있다.

## 게이트 G01–G14

| 게이트 | 결과 | 근거 / 남은 조치 |
| --- | --- | --- |
| G01 독립 TEST 자원 | PASS | 독립 배포·Sheet·Drive, TEST/운영 ID 분리 확인 |
| G02 이미지 등록·변경·복원 | PASS | TEST API/Sheet/Drive와 3 viewport Chromium; 기존 E2E 보고서 |
| G03 이미지 오류 복원·형식·크기 | PASS | S06–S11, TEST 자원 실제 재조회 |
| G04 학생 A/B·Day 분리 | PASS | S12–S13 및 이번 R12 |
| G05 Day06 문제 수정 왕복 | PASS | R01–R12, 로그·캡처; TEST 데이터 원복 R13 |
| G06 Day07 연구기록·퀴즈 회귀 | PASS | 이전 최종 회귀와 이번 TEST QuizResult 재조회 |
| G07 영상 업로드 회귀 | PASS | V01–V10 실제 TEST WebM·Asset·DayRecord·브라우저 재조회 |
| G08 Drive 내장 iframe 클릭 재생 | MANUAL_REQUIRED | iframe 및 재생 문구는 표시. 자동 클릭은 타임아웃, 재생 진행은 미확인 |
| G09 운영 배포 소스 동등성 | FAIL | 운영 버전 15에 `ImageService` 없음 |
| G10 운영 Script Properties | FAIL | `ENVIRONMENT`, `IMAGE_STORAGE_FOLDER_ID` 부재 |
| G11 기존 9장 접근·개인정보 | DECISION_REQUIRED | 9 PNG 소유자 전용; 학생 표시를 위한 권한 모델 미확정 |
| G12 교체 구파일 보존 정책 | DECISION_REQUIRED | 이미지는 보존, 영상은 업로드 성공 직후 구파일 휴지통 처리; 기간·복구 절차 확정 필요 |
| G13 공개 빌드·PR 범위 | PASS_WITH_LIMITATIONS | 54개 파일 잠금, TEST 비밀값 미포함; PR 증거 71경로와 기존 실명 목록은 리뷰 필요 |
| G14 백업·롤백·배포 승인 | NOT_RUN | 운영 백업/복원 연습과 배포 변경은 별도 승인 후 실행 |

## R01–R12 실제 재검수

TEST A의 Day05/06 원본을 Git 밖으로 백업한 뒤 Chromium에서 Day06 문제 표시→Day05 수정 이동→저장·왕복·새로고침→수정 취소→새 문제로 교체→아이디어 초안 보존 및 이미지 참조 유지→저장 실패/재시도→TEST B 불변을 확인했다. 전 항목 PASS. R13에서 TEST A 원본을 API로 복구하고 재조회했다. `verification/day06-problem-roundtrip.log`, `verification/final-screenshots/390x844-day06-problem-roundtrip.png`, `390x844-day06-problem-save-failed.png` 참조. 테스트 중 초기 자동화 선택자 오류는 harness를 고쳐 다시 실행했으며 제품 결함으로 기록하지 않았다.

## Drive 플레이어 제한

TEST Day01 기존 영상의 Drive iframe 로드와 파일명/재생 UI는 확인했다. 자동화의 접근 가능한 재생 버튼 클릭이 타임아웃되어 실제 재생·일시정지는 검증되지 않았다. `verification/day-drive-iframe-audit.json`과 전후 캡처 참조. 교사가 Chrome에서 TEST Preview를 열어 TEST A Day01의 저장된 영상 재생 버튼을 직접 클릭하고 재생 시간 증가·일시정지·새로고침 후 재재생을 기록해야 한다. 성공 전 G08 PASS 금지.

## 운영 반영 차단 및 미검증

운영 데이터에 대한 이미지 등록, 실제 9장 등록, 운영 브라우저 저장 시험, 운영 백업·복원, 배포 후 확인은 **NOT_RUN**. 테스트 결과를 운영 PASS로 전용하지 않는다. 운영 Web App 버전과 필수 Property를 별도 승인된 변경 절차로 준비하고, 개인정보 권한·보존 정책과 수동 영상 재생을 결정한 뒤 재검수해야 한다. 상세 범위·접근·실행 계획은 `DAY06_DAY07_PR_SCOPE_REVIEW.md`, `DAY06_DAY07_IMAGE_ACCESS_AUDIT.md`, `DAY06_DAY07_DEPLOYMENT_RUNBOOK.md`에 있다.
