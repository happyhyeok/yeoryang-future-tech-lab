# 현재 상태 — 2026-10-29 실제 운영 백업·TEST 복구 연습

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
