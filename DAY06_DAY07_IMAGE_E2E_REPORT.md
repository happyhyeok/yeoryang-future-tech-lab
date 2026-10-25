# Day06·Day07 이미지 실연결 검수 — 2026-10-25

## 최종 판정: FAIL

실제 서버 저장, Sheets/Drive 재조회, Playwright Chromium의 등록·변경·새로고침 복원을 검증하지 못했다. 코드와 모의 단위 시험 통과를 실연결 PASS로 취급하지 않는다. 운영 데이터와 분리된 테스트 Apps Script 배포, Sheet, Drive 폴더, 학생 A/B가 확인되기 전이므로 업로드를 실행하지 않았다.

## 환경과 식별 정보

- Git: `feature/day06-day07-image-evidence`, 시작 HEAD `226742a`; 기존 PR #1 유지. 원본 `main`의 미커밋 변경은 별도 worktree로 보호했다.
- 운영 학생 페이지: `https://yeoryang-future-tech-lab.pages.dev/`. 이번 브랜치의 이미지 코드는 Production에 배포하지 않았다.
- Apps Script: 저장소에 `.clasp.json`이 없어서 이 브랜치에 연결된 script ID, 테스트 배포 ID, Script Properties, OAuth 권한을 확인하지 못했다. 시험한 배포 **없음**.
- Google Drive: 제공된 원본 폴더 ID `1YbBCSQCA_aAeyyU2UwmD0wvTkOYlC9yi`의 PNG 메타데이터를 읽기 전용으로 확인했다. Day06 5장, Day07 4장. 남은식 Day07 파일은 없으며 정상 미등록이다. 실제 학생 이미지 등록 0건.
- Google Sheets: 원본 폴더에 운영 Sheet와 기존 사본이 있으나, 사본이 격리 테스트용인지와 연결된 Apps Script 속성은 확인되지 않았다. Asset/DayRecord 행 쓰기·재조회 0건.
- `gws auth status`: `gws` 명령이 설치되어 있지 않아 확인 불가. `clasp login --status`는 현 CLI가 지원하지 않는 옵션이었다. 인증 정보나 API 주소는 로그에 남기지 않았다.

## 코드 점검과 수정

- `WebApi.gs → VideoService.gs`의 `uploadVideo`는 `mediaKind=image`를 `uploadDayImage_`로 보낸다. 다른 요청은 기존 영상 경로로 간다. 실제 배포에 이 버전이 올라갔는지는 미확인이다.
- `ImageService.gs`는 학생·작품·연구일·MIME·3MB·파일 서명을 검사하고, Drive 파일과 screenshot Asset을 만든 뒤 DayRecord 참조를 연결하고 다시 조회한다. 실패 시 이전 Asset 메타데이터 복구를 시도한다. 성공한 교체에서 이전 파일은 휴지통으로 옮기지 않아 기존 이미지 손실 위험은 낮지만, 이전 파일 정리 정책은 미정이다.
- `DayRecordService.gs`는 Day06/07 자동저장 때 기존 이미지 참조를 유지한다. 동시 저장과 실제 Sheet 결과는 미검증이다.
- 발견·수정: 최초 `getDayRecord` 실패 시에도 `등록` 버튼이 활성화되어 미등록으로 오해할 수 있었다. `day-image-evidence.js`에서 조회 중 버튼을 비활성화하고 실패 시 `다시 시도`와 오류를 표시하게 했다. 기존 이미지가 화면에 있다면 저장 실패 시 화면을 유지한다.
- 공개 빌드 `scripts/student-dist-lock.json`의 53개 허용 목록에는 `day-image-evidence.js`가 없다. 이 브랜치를 그대로 Production 빌드에 적용할 수 없다. Production 배포는 실행하지 않았다.

## 시험 결과

| 항목 | 결과 | 근거 |
| --- | --- | --- |
| Node 이미지 모의 시험 4개, JS 문법, `git diff --check` | PASS | `tests/day-image-evidence.test.cjs`; 아래 재현 명령 |
| S01–S05 최초 등록·교체·Day07 분리·서버 Asset/DayRecord | BLOCKED | 격리 테스트 배포/Sheet/Drive 미확인 |
| S06 교체 오류와 이전 이미지 유지 | 모의 PASS, 실서버 BLOCKED | 모의 Sheet 쓰기 실패만 검증 |
| S07–S09 PNG/JPG/WEBP | BLOCKED | 실서버 업로드 없음 |
| S10–S11 용량·형식 거부 | 정적 코드 확인, 실브라우저 NOT_RUN | 테스트 배포 없음 |
| S12–S13 학생 A/B 분리·자동저장 | BLOCKED | 실서버 쓰기 금지 |
| S14 기존 영상 업로드 | NOT_RUN | 격리 서버 미준비 |
| Chromium 390×844, 650×900, 1440×900 | NOT_RUN | 실연결 페이지가 없어 캡처를 생성하지 않음 |

테스트 실행 명령: `node --test tests/day-image-evidence.test.cjs`, `node --check day-image-evidence.js`, `git diff --check`. Node 실행 로그: `verification/day-image-node-tests.log`. 실제 브라우저 캡처는 없으며, 과거 캡처를 이번 검수 증거로 재사용하지 않는다.

## 운영 반영 전 체크리스트

1. 테스트 전용 Apps Script 프로젝트/배포 ID와 `SPREADSHEET_ID`를 확인하고 운영 Sheet와 다른지 대조한다.
2. 이미지 저장 폴더를 Script Properties 등으로 분리해 테스트 Drive 폴더를 지정한다. 현재 `ImageService.gs`의 고정 ID는 운영 원본 폴더다.
3. 테스트 학생 A/B와 작품 관계를 테스트 Sheet에 만들고 운영 학생 5명의 기록과 무관함을 확인한다.
4. 테스트 배포에 `ImageService.gs`, `VideoService.gs`, `AssetService.gs`, `DayRecordService.gs`, `WebApi.gs`가 같은 버전으로 포함됐는지 확인한다.
5. 격리 테스트 사이트에 이미지 스크립트를 포함한 빌드 허용 목록을 새로 검토한다. Production은 배포하지 않는다.
6. S01–S14를 실제 Sheet 행·Drive 파일 ID·서버 GET·새 브라우저 세션으로 검증하고 세 viewport를 캡처한다.
7. 교체 성공 후 이전 파일의 보존·정리 기간을 결정한다. 실패 시 이전 파일 복원은 실제 서버에서 강제 오류로 검증한다.

## 변경 파일

`day-image-evidence.js`, `DAY06_DAY07_IMAGE_E2E_REPORT.md`, `harness/reports/CURRENT_STATUS.md`, `verification/day-image-node-tests.log`.
