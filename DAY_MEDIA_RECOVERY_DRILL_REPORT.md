# 독립 TEST 복구 연습 기록 — 2026-10-29

## 2026-10-29 실제 실행

운영과 별도인 TEST Sheet, TEST Drive 폴더, TEST Apps Script, TEST Cloudflare Pages 프로젝트만 변경했다. TEST 학생 A/B의 합성 데이터만 사용했다. 운영 Sheet·Drive·Apps Script·Pages는 읽기 외에 변경하지 않았다.

| ID | 결과 | 실제 확인 |
| --- | --- | --- |
| B01 | PASS | TEST Sheet 전체를 `test-sheet-before-recovery-2026-10-29.xlsx`에 내보냄. 23,970바이트, SHA-256 `08ad7c04cd6193ebd1bafe1fb480381b24f55f18b99817ef31220b70e57e0cfc`. 영향 3개 탭의 A1:Z30 원본 값을 별도로 기록. |
| B02 | PASS | TEST A Day06 연구기록 T2와 Asset J2를 임시 표식으로, 정책 F11과 H3을 임시값으로 변경해 재조회. |
| B03 | PASS | 네 셀을 각각 기존 값으로 복원. 빈 T2도 빈 값으로 복원. 세 탭의 A1:Z30 전체가 변경 전 값과 정확히 일치. |
| B04 | PASS | TEST B Day06 행을 포함한 세 탭의 전후 값 전체 일치. |
| B05 | PASS | TEST API의 A/B Day06 `getDayRecord`가 이미지 Asset 참조를 반환. Sheet Asset 참조와 재대조. |
| B06 | PASS_WITH_LIMITATIONS | 정책 F11을 일시 거부 상태로 바꿨다가 `PENDING_REVIEW`로 복원하고 정책 행 전체 일치를 확인. Drive 권한 전환·복귀는 별도 합성 사본에서 확인했으며 해당 정책 행과 연동된 관리자 승인 경로 자체를 실행한 시험은 아니다. |
| B07 | PASS | 보존일 H3 원래 값으로 복원하고 정책 탭 전체 값 일치 확인. |
| B08 | PASS | TEST 배포에서 `getStudents`는 A/B만, `getDayRecord`는 A/B Day06 모두 성공. 두 이미지 승인 상태는 `PENDING_REVIEW`. |

TEST Drive에서는 기존 RETAINED 행을 출처로 구이미지와 구영상의 **사본**을 TEST 전용 폴더에 만들었다. 각 사본을 휴지통으로 이동한 후 복원해 같은 파일 ID·크기·소유자 전용 권한·부모 폴더를 재조회했다. 이미지 사본은 링크 열람 권한을 임시 부여한 뒤 Restricted로 되돌려 권한이 `user:owner`만 남은 것을 재조회했다. 현재 대표 파일과 원본 Asset 참조는 변경하지 않았다.

TEST Apps Script에서는 원래 버전 7 배포를 건드리지 않고 별도 임시 Web App 배포를 버전 6으로 만들었다. `ping`과 합성 A/B 조회를 확인한 뒤 **같은 임시 배포**를 버전 7로 갱신하고 `ping`·A/B 조회·A Day06 조회를 확인했다. 배포 식별자는 비공개 백업 폴더에만 저장했다.

TEST Cloudflare Pages에서는 별도 `recovery-drill-20261029` Preview 브랜치에 이전 보관 후보 54개를 직접 올려 원격 HTML/JS/TEST API 설정의 해시를 확인했다. 같은 브랜치에 현재 TEST 후보를 다시 올려 54개 파일의 원격 SHA-256을 모두 비교했고 불일치 0건이었다. Production 배포는 실행하지 않았다.

기존 `dist/`는 보존했다. 비공개 폴더의 `student-build-2026-10-29/`에서 잠금 소스 54개만으로 다시 빌드했고 54개 해시 불일치 0건, 잠금 매니페스트 SHA-256 `77907148cb0215839f0d09cec46f235f01cf46bedb1f5b48083e2539dd3dbcc4`, TEST 표식 검출 0건이다. 이 빌드는 배포하지 않았다.

## 이전 준비 기록 — 2026-10-28

**판정: NOT_RUN.** 이번 회차에는 Google Sheets·Drive 쓰기 연결과 Apps Script 관리자 자동 실행 경로가 확인되지 않았다. `gws`는 설치되어 있지 않고 연결된 Sheets/Drive 도구도 제공되지 않았다. 복구 결과를 생성하지 않았으며 운영 자원에는 쓰지 않았다. 이전 TEST R13 원복과 31일 DRY_RUN의 날짜 복원은 별도 검수 증거이고 아래 B01–B08 복구 연습의 PASS로 대체하지 않는다.

| ID | 결과 | 실행 시 검증할 내용 |
| --- | --- | --- |
| B01 TEST Sheet 백업 | NOT_RUN | 가상 A/B만의 영향 행과 헤더를 비공개 사본으로 저장, 원본과 해시/행 수 대조 |
| B02 연구기록 1행 변경 | NOT_RUN | 격리 TEST의 선택 행만 변경, 변경 전 값 보존 |
| B03 선택 행 복구 | NOT_RUN | 백업에서 그 행만 복원, 전체 Sheet 덮어쓰기 금지 |
| B04 다른 학생 불변 | NOT_RUN | TEST B 행의 전후 값/해시 일치 |
| B05 Asset 참조 | NOT_RUN | 복구한 DayRecord 참조와 실제 Asset 파일 ID 일치 |
| B06 승인 상태 | NOT_RUN | 정책 행 및 Drive 권한 함께 복구·재조회 |
| B07 보존 날짜 | NOT_RUN | `replacedAt`·`expiresAt` 원래 값 유지 |
| B08 서버 재조회 | NOT_RUN | TEST API에서 Day06/07·Asset·승인 상태 재조회 |

| 복구 대상 | 결과 | 안전한 연습 절차 |
| --- | --- | --- |
| TEST Drive 구이미지·구영상 | NOT_RUN | 별도 가상 파일로 휴지통↔복원과 권한 원복을 시험하고 대표 Asset/DayRecord를 전후 대조 |
| TEST Apps Script | NOT_RUN | 다른 진행 중인 검수와 분리된 배포에서 이전 버전 복귀, `ping`·학생 조회·Sheet/Drive 경로 확인 |
| TEST Cloudflare Pages | NOT_RUN | 별도 TEST 배포를 만들고 이전 정상 배포로 복귀, HTML/JS/CSS 해시와 TEST API 연결 확인 |

재개 전 TEST/운영 프로젝트·Sheet·Drive ID 불일치, TEST 가상 학생만 존재, TEST 배포의 현재 버전과 백업 대상 행을 다시 확인한다. 복구 직후 다른 학생/Day 불변과 파일 권한·휴지통 상태를 재조회한다. 실제 운영 백업을 TEST Sheet로 가져오지 않는다.
