# Day06·Day07 이미지 승인 및 이미지·영상 보존 TEST 검수

검수일: 2026-10-27. **판정: NOT_READY — 실제 30일 경과 후보 경계 검사 대기.** 기존 2026-10-25 이미지/영상 및 2026-10-26 Day06 왕복 PASS는 이전 버전 증거이며 이 정책 변경의 PASS로 대체하지 않는다.

## 환경과 범위

- 독립 TEST Apps Script Web App 버전 6에서 시작해 후속 안전 수정 후 **활성 버전 7**로 갱신했다. 가상 학생 A/B 전용 Sheet·이미지/영상 Drive, 별도 Cloudflare TEST Pages Preview의 새 배포를 사용했다. 운영 Apps Script 버전 15, 운영 Sheet·Drive·Pages는 변경하지 않았다.
- TEST 버전 7을 별도 폴더에 pull한 뒤 정책 관련 6개 Apps Script 파일과 로컬 소스의 줄바꿈 정규화 내용을 대조해 일치했다. TEST Preview의 `index.html`, `runtime-config.js`, `day-image-evidence.js`는 배포 응답과 로컬 후보의 SHA-256이 일치했고, 가상 학생 A/B만 들어 있다.
- 버전 7은 업로드 파일의 비공개 권한 확인, 승인 대상의 관리 사본 경로 확인, 승인 조회 시 실제 Drive 공유 상태 확인, 실패 시 고아 참조 정리, 공개 API의 영상 Asset 파일 ID 변경 거부를 포함한다. TEST 학생 B Day07 신규 사본은 버전 7에서 실제 비공개 업로드와 Drive 소유자 전용 권한을 확인했다.
- Script ID, 배포 주소, 학생 실명과 파일 ID는 공개 보고서·로그에 기록하지 않는다. TEST 파일 ID는 Git 밖 비공개 검수 폴더에서만 취급한다.

## 승인 A01–A12

| ID | 결과 | 실제 확인한 근거 / 남은 작업 |
| --- | --- | --- |
| A01 새 이미지 업로드 | PASS | TEST A Day06·Day07(v6), TEST B Day07(v7) PNG 실제 업로드, Asset·정책 행 생성 |
| A02 승인 전 공유 권한 | PASS | TEST A Day06 새 파일 Drive 권한 소유자 1건, `anyone` 없음 |
| A03 승인 대기 조회 | PASS | 공개 API `PENDING_REVIEW`, 파일 ID/URL/Asset 미반환; 브라우저 `승인 대기` |
| A04 관리자 승인 | PASS (v6) | TEST 편집기에서 사용자 직접 실행, 정책 행 `APPROVED` 및 해당 사본 Drive `anyone:reader` 재조회 |
| A05 승인 후 학생 화면 | PASS (v6) | Chromium 390×844 미리보기·새로고침 복원, TEST B 분리 |
| A06 이미지 교체 | PASS | TEST A Day06 새 사본으로 교체, 이전 사본 비휴지통 `RETAINED` |
| A07 승인 자동 승계 방지 | PASS | 새 사본 `PENDING_REVIEW`·소유자 전용, 이전 철회 사본은 별도 보존 |
| A08 승인 거부 | PASS | TEST 편집기 `mediaPolicyTestRejectA07` 실행 완료, 정책 `REJECTED`, Drive 소유자 전용, 브라우저 미리보기 없음 |
| A09 승인 철회 | PASS | TEST 편집기 `mediaPolicyTestRevokeA06` 실행 완료, 정책 `REVOKED`, Drive `anyone` 제거; 익명 썸네일 요청이 이미지 대신 HTML 반환 |
| A10 학생 API 승인 차단 | PASS | 임의 `approveDayImage` → `INVALID_ACTION`; 스크린샷 `upsertAsset` → `REVIEW_FORBIDDEN` |
| A11 학생 A/B 분리 | PASS | TEST B DayRecord 불변, 브라우저 TEST A 이미지 미노출 |
| A12 새로고침·세션 일관성 | PASS | 승인 대기·승인·거부·철회 후 Chromium 새로고침, TEST B 분리 |

## 보존 F01–F14

| ID | 결과 | 실제 확인한 근거 / 남은 작업 |
| --- | --- | --- |
| F01 영상 최초 업로드 | PASS | 실제 TEST WebM Day02 서버·DayRecord 저장 |
| F02 영상 교체 | PASS | 새 Asset 파일 ID 재조회, `previousFileTrashed=false` |
| F03 구영상 파일 | PASS | Drive에서 교체 전/후 두 파일 모두 `trashed=false` |
| F04 영상 교체 실패 | PASS_WITH_LIMITATIONS | 실제 TEST 잘못된 MIME 요청 거부 및 대표 유지; Asset 갱신 뒤 보존 기록 실패는 로컬 보상 쓰기 검사 PASS |
| F05 이미지 교체 | PASS | TEST 이미지 구파일 정책 `RETAINED`, Drive 소유자 권한·비휴지통 확인 |
| F06 이미지 교체 실패 | PASS_WITH_LIMITATIONS | 실제 TEST 잘못된 MIME 요청 거부 후 대표·DayRecord 불변; 로컬 링크 실패 보상 검사 PASS. 파일 생성 후 오류 주입 실연결은 미실행 |
| F07 30일 만료 계산 | PASS | TEST 정책 행에서 교체·만료 ISO 시각 차이 정확히 30일 |
| F08 미만료 제외 | PASS_LOCAL | DRY_RUN 단위 경계 검사, TEST 서버 함수 직접 실행 대기 |
| F09 만료 후보 | PASS_LOCAL | 31일 경과 모의 행은 후보 분류만; TEST 서버 함수 직접 실행 대기 |
| F10 현재 대표 제외 | PASS_LOCAL | 모의 현재 행은 만료돼도 후보 제외 |
| F11 DayRecord 참조 제외 | PASS_LOCAL | 파일 ID가 DayRecord에 남은 모의 행 후보 제외 |
| F12 원본 9장 제외 | PASS_LOCAL | 관리 업로드 경로 밖 모의 원본 제외; 실제 운영 원본 9장은 비공개·변경 없음 |
| F13 DRY_RUN 무변경 | PASS | TEST 편집기 실행 로그 `mode=DRY_RUN,total=10,current=4,expired=0,candidates=0`; 이후 Sheet 10행 및 표본 Drive 파일·권한 불변 |
| F14 학생 A/B 분리 | PASS | 영상 TEST B 기록 ID 불변, 이미지 TEST B 기록 불변 |

## 브라우저·회귀 및 남은 게이트

Chromium 390×844에서 TEST A Day06 승인 대기 및 승인 후 표시·새로고침, 철회, 새 사본 교체 후 승인 대기, TEST A Day07 게시 거부, TEST B 미노출을 확인했다. Day06·Day07 수업 활동 화면과 Day02 저장 영상 iframe도 표시됐고 화면 이동 후 TEST A의 두 연구기록은 서버에서 불변이었다. 캡처는 `verification/final-screenshots/390x844-media-*.png`, `390x844-media-policy-day06-lesson.png`, `390x844-media-policy-day07-lesson.png`다. 로컬 이미지/UI/정책/영상 보상 검사 **13건 PASS**. 퀴즈·Day08 접근 조건은 이전 버전의 PASS이며 정책 버전에서 재시험하지 않았다.

`clasp run`은 권한 오류로 관리자 함수를 자동 호출하지 못했다. [Google 공식 실행 요건](https://developers.google.com/apps-script/api/how-tos/execute)에 따르면 `scripts.run`에는 API 실행 배포, 적절한 OAuth 범위, 공통 표준 Cloud 프로젝트가 필요하다. TEST Web App 배포만으로 충족되지 않아 TEST 프로젝트 편집기에서 실제 관리자 계정으로 함수를 실행했다. 운영 관리자 실행과 Production 배포는 하지 않았다.

실제 만료일을 31일 경과로 가정한 TEST 전용 후보 조회가 끝나면 F09를 마무리한다. 표준 DRY_RUN은 TEST에서 실행해 통과했으며 실제 만료 파일이 0개라 후보 발생 경계는 아직 로컬 검사 결과다. 실행 요약은 `verification/day-media-policy-e2e.log`에 있으며 파일 ID는 Git 밖 비공개 기록에 있다. 사용자 제공 실행 화면에는 TEST 프로젝트 ID가 주소창에 있으므로 공개 Git에 복사하지 않았다.
