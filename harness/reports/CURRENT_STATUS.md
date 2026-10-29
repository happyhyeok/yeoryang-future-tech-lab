# 현재 상태 — 2026-10-29 운영 Day02·재해 복구·Cloudflare 최종 준비 점검

## 2026-10-29 운영 적용 시도 최신 상태

**운영 적용 BLOCKED, Production NOT_DEPLOYED.** 사용자가 별도 운영 변경 승인과 승인된 운영 테스트 학생·작품이 없다고 확인했다. 운영 Web App v15, Sheet 10개 탭/정책 탭 없음, 이미지 폴더 미생성, PR Draft와 원격 `main` 기존 HEAD를 읽기 전용으로 확인했다. Drive 백업 26개·운영 v15 소스 13개 해시 일치, 학생용 54개 격리 후보 해시 불일치 0. 운영 폴더·Sheet·Property·Apps Script·Cloudflare Production·학생 기록 쓰기 0건, 롤백 없음. P01–P16은 `../../DAY06_DAY07_IMAGE_PRODUCTION_DEPLOYMENT_REPORT.md`에 NOT_RUN/PRODUCTION_WRITE_TEST_BLOCKED로 기록했다. 기존 학생 기능 TEST PASS는 유지하되 Production PASS로 확대하지 않는다. 아래는 이전 단계 이력이다.

## 2026-10-29 학생 이미지 최종 인수 후보

**학생 기능 PASS_WITH_LIMITATIONS, 운영 기술 준비 NOT_READY, Production NOT_DEPLOYED.** 최신 브랜치의 IndexedDB 등록·교체·복원 TEST 결과를 보존하고 `DAY06_DAY07_IMAGE_PRODUCTION_HANDOFF.md`에 운영 v15 적용 6개 파일, 필수 Property와 정책 탭, 단계별 중단·복귀를 정리했다. 새 격리 빌드 54개 해시 불일치 0, TEST URL·가상 학생·테스트 스크립트 검출 0, 기존 공개 실명 5개 필드는 개인정보 판단 대기다. 운영 Drive 26개·v15 소스 13개 백업 해시 불일치 0. 운영·Production은 미변경, Day02 404와 외부 매체 복구 미완료를 유지한다. 아래 내용은 과거 시점의 기록이다.

## 2026-10-29 Day06·Day07 IndexedDB 로컬 복원 검수

**같은 브라우저 TEST 복원 PASS, Production NOT_READY.** 미커밋 변경을 보존하고 `day-image-evidence.js`에 서버 저장 성공 후 학생·Day별 대표 1장 IndexedDB 보관을 추가했다. TEST A Day06 최초/교체/새로고침/같은 브라우저 재접속, Day07 복원, B 분리, 실패 교체 후 기존 그림 유지, 로컬 삭제 후 안내를 실제 Chromium에서 확인했다. 390×844·650×900·1440×900 가로 넘침 0, 로컬 10건 PASS, 새 격리 54파일 빌드 SHA-256 불일치 0. TEST Sheet Asset/DayRecord 참조와 TEST Drive 소유자 전용 권한을 재조회했다. 공유 PC 같은 프로필에서 이름 선택만으로 타인의 로컬 그림을 볼 수 있으며, 다른 PC에는 로컬 사본이 없다. 실제 학생 데이터·운영 권한·서버 코드·Production은 변경하지 않았다. 상세는 `../../DAY06_DAY07_IMAGE_DISPLAY_MINIMAL_REPORT.md`. 아래 기록은 이전 상태다.

## 2026-10-29 학생 이미지 최소 표시 수정

**TEST 업로드 직후 표시 PASS, 비공개 사본 재접속 표시 BLOCKED, Production NOT_READY.** `day-image-evidence.js`에서 로컬 파일 미리보기를 저장·교체 후 같은 탭에 유지하고 저장 실패 시 이전 화면을 복원하도록 했다. TEST A Day06 최초·교체, Day07 업로드를 실제 Chromium과 TEST 서버에서 검증했고 Sheet Asset/DayRecord/정책 및 Drive 소유자 전용 권한을 재조회했다. 학생 B 분리와 새로고침·새 페이지에서 비공개 승인 대기 사본이 숨겨지는 결과를 확인했다. 로컬 검사 12건 PASS, 격리 학생 빌드 54개 해시 불일치 0건. 승인 관리자 계정·링크 공개 동의가 없어 비공개 파일의 재접속 표시는 구현할 수 없다. 원본 9장·운영 자원은 변경하지 않았다. 상세는 `../../DAY06_DAY07_IMAGE_DISPLAY_MINIMAL_REPORT.md`와 `../../verification/day-image-private-preview-live.log`. 아래 기록은 이전 상태다.

## 2026-10-29 배포 직전 최신 상태

**GO/NO_GO: NO_GO.** 운영 Drive 원본 PNG 9장·WebM 루트와 독립 TEST 이미지·영상 루트는 실제 폴더 ID·상위 경로가 분리돼 있다. 운영 이미지 전용 부모 폴더는 아직 없고, 승인 관리자 계정·게시 동의·운영 관리자 실행 도구는 미확정이다. 운영 Sheet는 읽기 전용 메타데이터상 기존 10개 탭, `10_미디어정책` 없음. 격리 빌드 54개 파일의 잠금 SHA-256 불일치 0, TEST URL·가상 학생 표식 0이지만 공개 `runtime-config.js`에는 기존 학생 실명 5명이 있어 개인정보 공개 적합성 결정이 필요하다. 운영 v15 13개 백업과 브랜치/TEST v7 소스를 대조했고 관련 로컬 경계 검사 9건 PASS였다. 실제 운영 폴더·Property·Sheet·배포·학생 데이터는 변경하지 않았다. 최신 G01–G16과 상세는 `../../DAY_MEDIA_PREDEPLOY_GO_NOGO.md` 및 신규 폴더·인증·통합 감사 문서에 있다. 아래 기록은 이전 시점의 이력이다.

## 2026-10-29 최신 판정

**운영 배포 준비: NOT_READY.** Day02 운영 영상 Asset과 DayRecord/API가 Drive 조회 404인 같은 파일 ID를 참조한다. 해당 학생/Day 폴더에는 같은 이름의 다른 WebM 1개가 있지만 최종 제출본 여부와 404 원인(삭제·권한·잘못된 ID·교체 이력)은 미확정이다. 기존 운영 데이터 문제로 분류하되 학생 영상 재생 위험을 해소하기 전 자동 교정하지 않는다.

기존 DPAPI 사본을 유지하고 사용자 보안 입력 암호의 PBKDF2-SHA256/AES-256-GCM 사본을 만들었다. 생성 직후와 별도 프로세스에서 복호화가 성공하고 DPAPI 원문과 일치했다. 사용자는 별도 저장 경로가 없다고 답해 다른 장치 복호화·독립 매체 보관은 미실행이다. Cloudflare Production 설정 화면에서 Git 연결, `main` 자동 배포, 빌드 `node scripts/build-student-dist.cjs`→`dist`, 변수·비밀·바인딩 0개를 확인했다. 현재/직전 Production 정적 후보와 참조 자산은 응답했고 롤백은 미실행이다.

운영 v15와 브랜치/TEST v7의 변경 범위를 대조해 `Asset`, `DayRecord`, `Video`, `WebApi` 변경, `Image`, `MediaPolicy` 신규, 공통 서비스 동일을 확인했다. 운영 정책 탭·Property·비공개 이미지 부모 폴더·관리자 승인 계정의 적용 순서는 문서화했지만 운영에는 만들거나 입력하지 않았다. C01~C14는 `../../DAY_MEDIA_PRODUCTION_READINESS_REPORT.md`, 원인·복구안은 `../../DAY02_VIDEO_REFERENCE_AUDIT.md`, 암호화/Cloudflare 증거는 신규 보고서 2개에 있다. 아래 내용은 이전 시점의 이력이다.

## 2026-10-29 최신 근거

운영 Apps Script 프로젝트 설정에서 Script ID·Sheet 연결과 실제 Property 1개를 확인했다. 값은 승인된 비공개 폴더의 Windows DPAPI CurrentUser 파일로 암호화하고 별도 프로세스에서 복호화·키/내용 일치를 검증했다. 운영 Sheet 기존 백업 해시를 재확인하고 같은 날 새 XLSX를 읽기 전용 내보내기하여 10개 탭의 모든 비어 있지 않은 셀을 비교한 결과 차이 **0건**이었다. 기본키·학생/작품/DayRecord/QuizResult/Asset 관계와 JSON 212개 검사에서 논리 오류 **0건**이었다.

운영 Drive 원본 PNG 9개와 영상 WebM 17개를 메타데이터·권한·본문 사본으로 비공개 보존하고 각 파일 크기·형식·SHA-256을 확인했다. 다만 Sheet의 Day02 영상 Asset 참조 1개는 Drive 조회 404로 파일 존재/권한을 구분하지 못했다. Cloudflare Production 배포 25건, Git 연동, 현재·직전 배포 HEAD 200과 정적 설정 파일을 확인했다. 일반 환경변수·빌드 설정은 미확인이다. 현재 Web App v15에는 새 이미지 서비스가 없고 신규 정책 Property 및 Sheet 탭도 없다.

**백업 완결성: PASS_WITH_LIMITATIONS. 운영 배포 준비: NOT_READY.** DPAPI 단일 계정 의존, Drive 미확인 파일 1개, Cloudflare 설정 일부 미확인 및 운영 정책 미반영이 남았다. 기존 TEST 복구 연습의 제한사항은 그대로 유지한다. 상세는 `../../DAY_MEDIA_PRODUCTION_SECRETS_BACKUP_REPORT.md`, `../../DAY_MEDIA_PRODUCTION_DATA_INTEGRITY_REPORT.md`, `../../DAY_MEDIA_PRODUCTION_BACKUP_REPORT.md`. 운영 Script Properties·Sheet·Drive·Apps Script 배포·Cloudflare Production에는 쓰지 않았다. 아래 항목은 과거 이력이다.

## 2026-10-29 새 실행 근거

사용자가 승인한 로컬 `C:\Users\USER\Desktop\yeoryang-private-backup\`을 생성하고 쓰기·재읽기, 비동기화 경로 및 제한 ACL을 확인했다. 운영 Google Sheet XLSX(107,253바이트, SHA-256 `ecd26d8379a50aa06d5549cae42eef6844cc14df679eeecfe84952fdc52fd32f`)와 활성 Apps Script Web App v15의 13개 소스 파일·해시 목록, 운영 배포 목록, Cloudflare Production 배포 목록 25건을 비공개 저장했다. 운영 Sheet 10개 탭/헤더와 XLSX 구조를 대조했다. 운영 원본에는 쓰지 않았다.

독립 TEST에서 B01–B08 Sheet 영향 셀 네 곳을 실제 변경·복원하고 세 탭 전체 범위 A1:Z30의 전후 값 일치와 A/B API 재조회를 확인했다. B06의 정책 셀과 Drive 권한 복원은 각각 검증했으나 관리자 연동 경로는 미검증이다. TEST 이미지·영상 사본의 휴지통 복원, 이미지 사본의 공개 권한 철회, 별도 Apps Script 배포 v6→v7 복귀, TEST Cloudflare Preview 이전 후보→현재 후보 복귀를 실행했다. Cloudflare 현재 후보 54개 원격 파일 SHA-256 불일치 0건. 기존 `dist/`를 보존한 새 격리 빌드 54개도 잠금 해시 불일치 0건이다.

**백업: PARTIAL_BACKUP. TEST 복구: PASS_WITH_LIMITATIONS. 운영 배포 준비: NOT_READY.** Script Properties 비밀값의 암호화 백업, 운영 Drive 및 Cloudflare 설정 전수 백업, Sheet 데이터 행·참조 전수 대조는 남았다. 운영 배포·Properties 변경·학생 기록 변경·main 병합은 하지 않았다. 새 상세 근거는 `../../DAY_MEDIA_PRODUCTION_BACKUP_REPORT.md`, `../../DAY_MEDIA_RECOVERY_DRILL_REPORT.md`에 있다. 아래 2026-10-28 기록은 당시 상태의 역사적 기록이며 최신 판정이 아니다.

## 2026-10-28 운영 백업·복구 준비

**백업·복구 준비: NOT_READY (`BACKUP_LOCATION_REQUIRED`, TEST 복구 연습 NOT_RUN). 운영 배포 준비: NOT_READY.** 사용자가 승인된 비공개 백업 위치가 없다고 확인해 운영 Sheet·Apps Script Property·Drive 메타데이터 사본을 만들지 않았다. `gws`와 연결 Sheets/Drive 도구가 없어 이번 회차에 TEST B01–B08 특정 행 복구 및 Drive·Apps Script·Cloudflare 복귀를 실행하지 않았다. 운영 `clasp deployments`에서 활성 Web App v15를 재확인했고 운영 사이트 HEAD는 200이었다. 현재 배포 소스·Cloudflare 배포 ID·운영 Sheet 행/권한의 실시간 무결성 확인으로 해석하지 않는다. PR #1 기준 학생용 잠금 54개 소스는 줄바꿈 정규화 후 전부 해시가 맞지만 기존 `dist/`의 `day-image-evidence.js`는 잠금과 달라 재사용 불가다. 운영 자원 변경 없음. 상세는 `../../DAY_MEDIA_PRODUCTION_BACKUP_REPORT.md`, `../../DAY_MEDIA_RECOVERY_DRILL_REPORT.md`, `../../DAY_MEDIA_PRODUCTION_DEPLOYMENT_PLAN.md`, `../../DAY_MEDIA_PRODUCTION_ROLLBACK_PLAN.md`에 기록했다.

**정책 구현 검수: PASS_WITH_LIMITATIONS.** 2026-10-27 변경을 독립 TEST Apps Script Web App 버전 7 및 별도 Cloudflare TEST Preview에만 반영했다. 승인 대기 비공개 업로드, 관리자 승인·거부·철회에 따른 실제 Drive 권한 전환과 학생 화면, 새 사본의 승인 비승계, 영상 교체 전 파일 비휴지통·30일 보존 행, 학생 A/B 분리를 실제 TEST Drive·Sheet·Chromium에서 확인했다. 표준 관리자 DRY_RUN은 `total=10,current=4,expired=0,candidates=0`; 31일 경과 임시 경계 검사는 `expiredCandidateFound=true,total=10,candidates=1`이었다. 실행 후 TEST 정책 Sheet 10행 전체 값과 대상 날짜 복원, 대상 구파일·현재 대표 파일의 Drive 비휴지통/권한 불변을 재조회했다. 로컬 정책/복원 경계 검사 13건 통과, TEST 버전 7 관련 소스 6개가 브랜치와 일치한다. F04·F06 내부 실패 주입과 F10–F12 제외 경계는 로컬 검사에 한정된다. 상세 근거는 `../../DAY_MEDIA_POLICY_E2E_REPORT.md`, `../../verification/day-media-policy-e2e.log`, 화면은 `../../verification/final-screenshots/`에 있다. 운영 Apps Script·Sheet·Drive·Cloudflare Production과 실제 학생 원본 9장은 변경하지 않았다. Day07 원고·완료 기준에 새 결정은 필요 없다.

**운영 반영 판정: NOT_READY.** 2026-10-25 TEST 회귀의 PASS_WITH_LIMITATIONS는 그대로 유효하지만 운영 배포 완료를 의미하지 않는다. 2026-10-26 TEST Day06 문제 수정·교체 R01–R12를 실제 브라우저·서버에서 통과하고 TEST 기록을 원복했다. Drive 영상 iframe은 로드됐으나 자동 클릭 재생은 확인하지 못해 수동 확인이 필요하다. 운영 활성 Apps Script 버전 15에는 ImageService가 없고 운영 Script Properties에는 `ENVIRONMENT`, `IMAGE_STORAGE_FOLDER_ID`가 없다. 원본 이미지 9개는 소유자 전용 권한이며 변경하지 않았다. 상세 근거는 `../../DAY06_DAY07_PREPRODUCTION_AUDIT.md`, 실행 기록은 `../../verification/day06-problem-roundtrip.log`, 브라우저 증거는 `../../verification/final-screenshots/`이다. 운영 배포·설정·Sheet·Drive 쓰기 및 main 병합은 실행하지 않았다. Day07 교육 원고·완료 기준의 추가 결정은 이번 이미지 점검에서 필요하지 않다.

Day06·Day07 운영 전 최종 회귀는 **PASS_WITH_LIMITATIONS**. 기능 브랜치 `feature/day06-day07-image-evidence`에서 독립 TEST Apps Script 배포 버전 5, TEST Sheet·이미지/영상 Drive와 별도 Cloudflare TEST Pages HTTPS Preview를 사용했다. 실제 WebM Day01–03 업로드·교체, TEST Drive 파일·Sheet Asset/DayRecord, Chromium 파일 재생, 학생 UI 촬영·업로드·새로고침 iframe 복원을 확인했다. 기존 이미지 S01–S18 중 영향받는 Preview 교체/복원을 세 viewport에서 다시 확인했다.

Day06/07 연구기록·퀴즈·완료·Day08 서버 확인 게이트는 Chromium 390×844, 650×900, 1440×900과 TEST Sheet `06_퀴즈결과`·`05_학생연구기록`으로 대조했다. Day06/07 서버 저장 실패와 재시도 후 참조 유지도 확인했다. 상세 판정·로그·캡처는 `../../DAY06_DAY07_FINAL_REGRESSION_REPORT.md`와 `../../verification/final-screenshots/`.

남은 제한: Drive 내장 iframe에서 클릭 재생을 확인하지 못했으며, Day06 문제 원문을 실제 수정·교체한 후 Day05/06 왕복 저장은 미실행이다. 운영 Apps Script 배포·Script Properties 동등성, 영상 재생 권한, 기존 이미지 9장 접근 권한도 운영 변경 없이 최종 대조가 필요하다. 운영 Production·실제 학생 데이터는 변경하지 않았다. Day07 교육 원고와 완료 기준은 변경하지 않았고 새 교육 결정은 필요 없다. 운영 전에는 이미지 링크 공개 범위·구파일 보존 기간과 배포 승인을 결정해야 한다.
