# Day06·Day07 이미지 정책 운영 배포 계획 — 2026-10-28

## 2026-10-29 학생 이미지 최종 후보

**학생 기능 PASS_WITH_LIMITATIONS · 운영 기술 준비 NOT_READY · Production NOT_DEPLOYED.** 최신 서버 적용 6개 파일, 필수/선택 Property, 11열 정책 탭, 54개 공개 파일 검수 및 순서별 중단·복귀 기준은 `DAY06_DAY07_IMAGE_PRODUCTION_HANDOFF.md`를 따른다. 같은 브라우저의 비공개 이미지 복원은 학생 화면 IndexedDB에서 처리하며 관리자 이메일 Property는 학생 업로드의 필수값이 아니다. 기존 `main` 자동 배포와 공개 학생 실명 설정의 개인정보 검토가 남아 있다. 아래 NO_GO는 관리자 공개 승인 기능까지 포함한 당시 정책 검수 결과다.

## 2026-10-29 배포 직전 최신 판정

**NO_GO.** `DAY_MEDIA_PREDEPLOY_GO_NOGO.md`의 G01–G16이 최신 게이트다. 새 운영 이미지 폴더는 아직 없고, 학교 승인 관리자 계정·게시 동의 범위·운영 관리자 호출 도구가 미확정이다. 공개 `runtime-config.js`에 기존 학생 실명 5명이 포함된 문제도 판단해야 한다. 운영 Sheet는 오늘 읽기 전용 메타데이터에서 기존 10개 탭만 확인했고 정책 탭은 없다. 54개 파일의 새 격리 빌드 해시는 모두 일치했다. 아래 이전 계획의 미확인 상태보다 이번 실측 결과를 우선한다. 실제 폴더·Property·탭·배포 변경은 수행하지 않았다.

## 2026-10-29 최종 준비 게이트

**운영 배포 준비: NOT_READY, Production 변경 미실행.** C01 Day02 영상 참조 원인과 C06 독립 매체 백업이 미해결이다. 이는 활성 v15에 이미지 코드가 없다는 사실만으로 내린 판정이 아니다. 최신 C01~C14 판단은 `DAY_MEDIA_PRODUCTION_READINESS_REPORT.md`, Drive 증거는 `DAY02_VIDEO_REFERENCE_AUDIT.md`, 암호화 사본은 `DAY_MEDIA_DISASTER_RECOVERY_BACKUP_REPORT.md`, Cloudflare 실제 설정은 `DAY_MEDIA_CLOUDFLARE_CONFIGURATION_AUDIT.md`를 따른다. 아래 과거 계획의 백업 위치·Cloudflare 설정 미확인 문장은 당시 기록이다.

실제 Cloudflare Production 설정은 Git 연결, `main` 자동 배포, 빌드 명령 `node scripts/build-student-dist.cjs`, 출력 `dist`, 저장소 루트, 변수·비밀값·바인딩 0개다. 현재/직전 정적 후보가 모두 응답한다. 운영 필수 Property 값·관리자 승인 계정·새 비공개 이미지 부모 폴더는 아직 확정되지 않았다. `IMAGE_STORAGE_FOLDER_ID`는 **원본 9장 폴더가 아니라** 신규 부모 폴더의 ID를 가리키며 코드가 그 아래 `학생이미지_업로드/학생/Day`를 만든다. `10_미디어정책` 탭은 배포 후 첫 조회가 자동 생성할 수 있으므로, 별도 승인 변경 창에서 기존 탭 부재·백업을 확인한 뒤 정확한 헤더로 먼저 생성·검증한다.

## 2026-10-29 백업·무결성 점검 후 상태

기존 2026-10-28의 백업 위치 미확보·TEST 복구 미실행 문장은 당시 계획의 이력이다. 승인된 로컬 백업 폴더에 운영 Sheet 두 시점 XLSX, 활성 Apps Script v15 소스·배포 목록, 기존 Script Property 1개 DPAPI 암호화 사본, 원본 PNG 9개·영상 WebM 17개 본문과 메타데이터, Cloudflare Production 배포 목록 및 현재/직전 정적 설정 사본을 보존했다. Sheet 10개 탭 셀 차이·논리 참조 오류는 0건이다. TEST 복구 B01–B08과 Drive·Apps Script·Cloudflare 복귀는 앞선 연습 결과를 재사용한다.

**계획 상태는 계속 NOT_READY.** Day02 영상 Asset 1개의 Drive 파일 조회 404, DPAPI의 단일 Windows 계정 의존, Cloudflare 일반 환경변수/빌드 설정 미확인, 운영 `10_미디어정책` 탭과 신규 이미지 정책 Property 부재, 활성 Web App v15의 이미지 서비스 부재가 남았다. 운영 데이터는 자동 수정하지 않는다. 실제 운영 변경 창이나 배포는 이번 작업에서 실행하지 않았다. 신규 증거는 `DAY_MEDIA_PRODUCTION_SECRETS_BACKUP_REPORT.md`, `DAY_MEDIA_PRODUCTION_DATA_INTEGRITY_REPORT.md`를 따른다.

**계획 상태: NOT_READY. 이 문서는 실행 승인이 아니다.** 기능 브랜치 `feature/day06-day07-image-evidence`의 PR #1을 유지하고 `main`, 운영 Apps Script, 운영 Cloudflare Pages, 학생 데이터는 변경하지 않는다.

## 반영 범위와 빌드

- 학생 화면: `app.js`, `index.html`, `styles.css`, `day-image-evidence.js`; 공개 빌드에는 잠금 파일의 기존 학생용 자산과 `runtime-config.js`를 포함한 정확히 54경로만 허용한다.
- 서버: `AssetService.gs`, `DayRecordService.gs`, `ImageService.gs`, `MediaPolicyService.gs`, `VideoService.gs`, `WebApi.gs`와 운영 `Config.gs` 및 기존 공통 서비스. 운영 활성 v15 소스를 기준으로 차이를 검토해 통합한다. `MediaPolicyTestRunner.gs`와 TEST 학생/설정은 제외한다.
- 빌드: `scripts/build-student-dist.cjs`와 `scripts/student-dist-lock.json`. 테스트·검수 보고서·캡처·로그는 Git 감사 근거로만 보존하고 정적 출력에 넣지 않는다.
- 현재 잠금 54개 **소스**는 원본 또는 줄바꿈 정규화 후 SHA-256이 모두 맞는다. 현재 남아 있는 `dist/` 54개 중 `day-image-evidence.js` 1개는 잠금과 달라 배포 후보가 아니다. 빈 격리 작업 폴더에서 새 빌드·54/54 해시 확인이 필요하다. 기존 `dist/`는 보존했다.
- 기준 커밋 `4877dbc`의 PR은 143경로(학생 화면 4, Apps Script 6, 빌드 핵심 2, 테스트 29, 검증 자료 87 및 문서/기타)였다. 이번 문서 추가 후 최종 PR 범위를 다시 확인한다. 공개 빌드 허용 목록은 TEST 전용 스크립트와 로그를 제외한다. 추적된 운영 `runtime-config.js`에는 기존 운영 API 주소와 실명 선택 목록이 있어 개인정보 정책 검토가 필요하다. TEST 주소·가상 학생·비밀값이 새 Production 출력에 없는지 빌드 후 별도 검색한다.

## 운영 설정·Sheet 계획

| 항목 | 계획 및 중단 조건 |
| --- | --- |
| `ENVIRONMENT` | 운영 `PRODUCTION` 지정. TEST 값이거나 공란이면 중단 |
| `SPREADSHEET_ID` | 기존 운영 값을 보존하고 TEST Sheet와 불일치 확인 |
| `IMAGE_STORAGE_FOLDER_ID` | 승인된 운영 업로드 사본 루트 지정. 원본 9장 폴더와 분리 확인 |
| `VIDEO_STORAGE_FOLDER_ID` | 기존 운영 영상 루트와 동일할 때만 명시; 구파일·권한 불변 확인 |
| `MEDIA_REVIEWER_EMAIL` | 승인된 실제 관리자 계정만 지정, 편집기 세션 인증 확인 |
| `PROJECT_ID`, `API_VERSION` | 기존 서버 계약·기본값과 대조; 불필요한 변경 금지 |
| TEST 보호 Property | 운영 값으로 복사하지 않음; 운영/TEST ID 교차 여부 검사 |

운영 Sheet에는 `10_미디어정책` 탭이 필요하다. 헤더 순서는 `fileId, mediaKind, assetId, studentId, dayId, reviewStatus, replacedAt, expiresAt, cleanupStatus, reviewedAt, reviewedBy`다. 현재 코드는 탭이 없으면 자동 생성하므로 **완전한 운영 백업 후** 생성 시점·권한·중복 방지를 확인한다. 기존 `05_학생연구기록`, `09_자료파일`의 행·열 구조는 유지한다. 스키마 오류 시 전체 Sheet 복원 대신 새 탭의 쓰기 중단과 특정 행 점검을 우선한다.

## 별도 승인된 변경 창의 순서

| 순서 | 실행 | 통과·중단 조건 |
| ---: | --- | --- |
| 1 | 승인된 비공개 위치에 운영 Sheet·활성 v15 소스·Property·배포 설정·Drive 메타데이터 백업 | 사본 열기, 행 수/헤더/해시 대조 실패 시 중단 |
| 2 | TEST 복구 연습 B01–B08 및 Drive·Apps Script·Cloudflare 복귀 | 특정 행·권한·배포 복귀 실패 시 중단 |
| 3 | 운영 정책·개인정보 승인 범위, 관리자, 폴더·Property 값 확정 | TEST/운영 ID 혼재 또는 권한 불명확 시 중단 |
| 4 | 운영 Property 설정과 `10_미디어정책` 스키마 준비 | 기존 값/행 변경, 중복 탭, 예상 밖 공유 발생 시 중단 |
| 5 | 운영 Apps Script 새 버전으로 **기존 Web App 배포** 업데이트 | 기존 URL의 `ping`·학생 GET·연구기록 GET 실패 시 이전 버전 복귀 |
| 6 | 새로 빌드한 54개 해시와 비밀/TEST 값 검수 후 Cloudflare Production 반영 | 배포 ID·Git SHA·파일 해시가 예상과 다르면 직전 정상 배포 복귀 |
| 7 | 승인된 운영 테스트 계정에서 이미지 업로드→관리자 승인→교체→철회, 영상·연구기록 회귀 | Sheet Asset/DayRecord/정책, Drive 권한·휴지통, 브라우저 새로고침을 대조 |
| 8 | 실학생 원본 9장 중 승인된 별도 사본만 별도 승인으로 등록 | 승인 기록 없는 원본은 비공개 유지 |

각 단계의 담당자·시각·전후 식별자는 비공개 변경 기록에 적는다. 5–6 사이 호환성이 불확실하면 학생 쓰기를 멈추는 변경 창을 확보한다. 현재 운영 백업 위치·복구 연습·Property·스키마가 미완료이므로 4단계 이후는 실행 금지다.
