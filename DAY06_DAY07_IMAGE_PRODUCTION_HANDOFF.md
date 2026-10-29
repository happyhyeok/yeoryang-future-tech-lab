# Day06·Day07 이미지 기능 운영 인수 — 2026-10-29

**학생 기능: PASS_WITH_LIMITATIONS · 운영 기술 준비: NOT_READY · Production: NOT_DEPLOYED.** 기능 브랜치의 학생 화면은 등록·교체·서버 저장 확인·같은 브라우저 IndexedDB 복원을 TEST에서 통과했다. 다른 PC 복원과 공유 PC의 학생별 비밀 보장은 현재 이름 선택 방식으로 제공하지 않는다. 운영 설정과 배포는 실행하지 않았다.

## 확정된 학생 동작과 변경 파일

- Day06·Day07 각각 대표 이미지 1장. PNG·JPG·WEBP, 3MB 이하.
- `day-image-evidence.js`가 파일 선택 직후 로컬 미리보기를 표시하고 기존 `uploadVideo` 이미지 분기로 업로드한다. 서버 재조회가 성공한 이미지에 한해 학생 ID·Day ID별 IndexedDB 항목 1개를 확정한다. 교체는 같은 항목을 갱신하고 실패 시 기존 그림을 유지한다.
- 같은 브라우저 프로필의 새로고침·재접속에서 비공개 승인 대기 사본을 로컬에서 보여 준다. `이 기기 이미지 삭제`는 해당 학생·Day의 로컬 사본만 지운다. 서버 Asset·DayRecord·Drive 파일은 유지한다.
- 관련 테스트 `tests/day-image-ui.test.cjs`, `tests/day-image-private-preview-live.cjs`, 로컬 TEST 서버 경로 인자를 위한 `tests/serve-image-preview.cjs`, 공개 파일 잠금 `scripts/student-dist-lock.json`을 갱신했다. Day06·Day07 교육 내용, 영상 코드, 서버 스키마는 이번 수정에서 바꾸지 않았다.

## 운영 Apps Script 적용 소스와 설정

활성 운영 v15 백업의 13개 파일과 브랜치를 대조했다. `AssetService.gs`, `DayRecordService.gs`, `VideoService.gs`, `WebApi.gs`는 v15와 다르며 `ImageService.gs`, `MediaPolicyService.gs`는 신규다. **운영 적용 검토 대상은 이 6개 파일**이다. `Config.gs`, `SheetRepository.gs`, `StudentService.gs`, `Validation.gs`, `Response.gs`, `Setup.gs`, `QuizService.gs`, `Utils.gs`는 백업과 줄바꿈 정규화 후 동일하여 유지한다. 이 14개 브랜치 파일은 독립 TEST v7 소스와 일치했다. TEST 전용 `MediaPolicyTestRunner.gs`·`TestBootstrap.gs`는 운영에 넣지 않는다.

| Property | 학생 이미지 업로드에 필요한가 | 운영 변경 창의 조치 |
| --- | --- | --- |
| `SPREADSHEET_ID` | 예, 기존 값 | 변경하지 않고 백업과 대조 |
| `ENVIRONMENT` | 예 | `PRODUCTION` 설정 |
| `IMAGE_STORAGE_FOLDER_ID` | 예 | 원본 PNG 9장·TEST와 분리된 새 비공개 업로드 부모 폴더의 승인된 ID |
| `VIDEO_STORAGE_FOLDER_ID` | 아니요, 운영 Config의 기존 영상 루트로 대체 가능 | 기존 루트를 유지하려면 같은 ID로만 명시, 값 대조 |
| `MEDIA_REVIEWER_EMAIL` | 학생 업로드·로컬 복원에는 불필요 | 관리자 승인·거부·철회를 사용할 때만 승인된 계정으로 설정. 임의 이메일 금지 |
| `PRODUCTION_*` TEST 격리 설정 | 운영에는 불필요 | TEST 값 복사 금지 |

`10_미디어정책` 탭은 학생 업로드, 이미지 상태 조회, 영상 보존 행에 필요하다. 운영 Sheet에는 아직 없으므로 변경 창에서 기존 백업과 10개 탭을 재확인한 뒤 `fileId, mediaKind, assetId, studentId, dayId, reviewStatus, replacedAt, expiresAt, cleanupStatus, reviewedAt, reviewedBy`의 11개 헤더로 빈 탭을 먼저 생성한다. 현재 코드는 탭이 없을 때 읽기 경로에서도 자동 생성할 수 있어 사전 준비가 필요하다.

## TEST 근거와 공개 파일

독립 TEST Apps Script·Sheet·Drive와 가상 학생 A/B, Chromium에서 A Day06 최초·교체·새로고침·동일 브라우저 재접속, A Day07 등록·복원, B 분리, 실패 교체 후 기존 그림 유지, 로컬 삭제를 검증했다. TEST Sheet의 A Asset/DayRecord 참조가 맞고 B Asset과 개인 증거 참조는 유지됐다. TEST Drive 현재 파일은 소유자 전용이며 링크 공개 없음. 390×844, 650×900, 1440×900에서 가로 넘침 0. 직접 영향 로컬 검사 10건 PASS. 기존 영상 교체·30일 보존 TEST 결과는 같은 서버 소스의 이전 검수 증거를 재사용하며 이번 브라우저 회귀를 새로 실행한 것으로 보지 않는다.

새 격리 빌드는 **54개 파일, SHA-256 불일치 0건**이며 이미지 스크립트가 갱신된 잠금 해시와 일치한다. TEST URL·가상 학생 표식·테스트 전용 스크립트·문자열 형태의 비밀 설정값 검출 0건. 기존 `dist/`는 보존했다. 공개 `runtime-config.js`에는 기존 학생 실명 5개 필드와 운영 API 주소가 있다. 학생 이름 선택은 인증이 아니고 공유 브라우저 프로필의 로컬 그림은 다른 사람이 해당 이름을 고르면 볼 수 있다. 다른 PC·브라우저 데이터 삭제 후에는 IndexedDB 사본을 복원할 수 없다. 학교의 개인정보 공개 적합성 판단은 완료되지 않았다.

## 운영 백업·적용·롤백

승인된 Git 밖 비공개 폴더의 운영 Sheet 두 시점 XLSX, v15 소스 13개, Drive PNG 9장·WebM 17개, Script Properties DPAPI·휴대용 AES-GCM 파일, Cloudflare 배포 기록은 존재한다. Drive 26개와 v15 소스 13개는 보관 목록 SHA-256 불일치 0건이었다. 운영 Sheet 첫 XLSX·암호화 파일의 기존 기록 해시도 재확인했다. 다른 장치에 암호화 사본을 보관·복호화한 시험은 미실행이고 Day02 영상 파일 참조 404는 별도 미해결이다.

**별도 승인된 운영 변경 창의 순서:** (1) 최신 운영 백업과 학생 쓰기 중지 계획 확인 → (2) 전용 비공개 이미지 부모 폴더 생성·소유/권한 확인 → (3) 정책 탭 빈 스키마 준비 및 기존 10개 탭 불변 확인 → (4) 필수 Property 설정과 기존 영상 루트 보존 → (5) 위 6개 Apps Script 파일을 기존 Web App의 새 버전에 반영 → (6) 학생 조회·DayRecord 자동저장·기존 영상 API 회귀 → (7) `main` 자동 배포 영향과 공개 파일을 확인한 후 Cloudflare Production 반영 → (8) 승인된 운영 테스트 데이터로 이미지 등록·교체·같은 브라우저 복원 및 Sheet/Drive 재조회 → (9) 운영 원본 9장·영상·학생 기록 불변 확인.

폴더/탭/Property가 예상과 다르거나 학생·영상 API가 실패하면 업로드를 중단하고 기존 v15 Web App 배포를 복원한다. 정적 화면 오류는 확인된 직전 Cloudflare 배포로 복귀한다. 전체 Sheet를 과거 사본으로 덮지 않고 영향받은 행과 Drive 파일·권한만 대조해 복원한다. 현재 정책의 관리자 승인·공개 기능은 학교 승인 계정과 링크 공개 동의가 없으므로 사용하지 않는다. Production 롤백은 이번에 실행하지 않았다. PR #1은 Draft로 유지하고 `main`을 병합하지 않는다.
