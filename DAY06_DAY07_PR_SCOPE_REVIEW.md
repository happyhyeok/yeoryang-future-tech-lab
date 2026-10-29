# PR #1 운영 반영 범위 점검 — 2026-10-26

기준 `origin/main...6d8ddae`의 기존 PR은 108경로다. 이후 사전점검 문서와 TEST 회귀 증거가 기능 브랜치에 추가된다. `main` 병합 및 Production 배포는 하지 않았다.

| 분류 | 기존 108경로 | 운영 필요성 |
| --- | ---: | --- |
| 학생 화면·Apps Script 소스 | 8 | 필수: `app.js`, `index.html`, `styles.css`, `day-image-evidence.js`, `apps-script/{AssetService,DayRecordService,ImageService,VideoService}.gs` |
| 빌드·잠금 | 4 | 필수: `.gitignore`, `scripts/build-student-dist.cjs`, `scripts/student-dist-lock.json`; 잠금 검토 도구는 개발용 |
| 자동화/TEST 도구 | 20 | 검수용; `scripts/build-image-test-preview.cjs`, `tests/*`는 공개 빌드에 포함하면 안 됨 |
| 검수 문서 | 5 | 리뷰 근거; 배포 정적 파일에는 불필요 |
| 로그·화면 | 71 | 감사 증거; 배포 정적 파일에는 불필요 |

공개 빌드 잠금 파일의 54개 경로에 `runtime-config.js`와 `day-image-evidence.js`가 포함되고 `tests/`, `verification/`, TEST Preview 생성 스크립트는 없다. 현재 추적된 운영 `runtime-config.js`에는 가상 TEST 학생 ID·TEST 배포 주소가 없음을 검사했다. 별도 TEST Preview 생성 스크립트에는 가상 ID 리터럴이 있지만 Production 빌드 허용 목록 밖이다. TEST API URL은 로컬 환경변수에서 받아 생성된 무시 파일에만 있다. 이번 PR의 변경 경로에 배포 URL·토큰·비밀번호를 기록하지 않는다.

운영 `runtime-config.js`는 기존부터 공개 빌드에 포함되며 운영 Web App 주소와 실명 선택 목록을 클라이언트에 제공한다. 이는 이번 PR이 새로 도입한 TEST 유출은 아니지만, 학생 선택이 인증이 아니라는 점과 함께 개인정보 정책 검토가 필요하다. 원본 이미지 9장 실명과 개별 파일 ID의 새 대응표는 **공개 저장소에 커밋하지 않고** Git 밖 로컬 비공개 파일에 보관했다.

캡처·로그 71경로는 기존 검수 증거이므로 이번 점검에서 무단 삭제하지 않는다. PR 리뷰 부담을 줄이려면 이후 승인된 정리 단계에서 증거를 별도 감사 브랜치/비공개 보관소로 옮기고, PR 본문에는 핵심 링크·해시·대표 캡처만 남기는 방안을 제안한다. 이 정리는 증거 보존 위치가 확인된 뒤에만 수행한다.

현재 기능 브랜치 전체를 운영에 반영하려면 정적 빌드 잠금과 Apps Script 소스 배포를 **각각** 검증해야 한다. PR 병합만으로 Apps Script 운영 버전 15가 갱신되지는 않는다. 반대로 Apps Script만 갱신해도 운영 `ENVIRONMENT`·`IMAGE_STORAGE_FOLDER_ID`가 없으면 이미지 업로드는 거부된다.
