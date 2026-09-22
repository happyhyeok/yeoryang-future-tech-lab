# 로딩 성능 개선 후 최종 안정성 검수

작성일: 2026-09-22

## 1. 작업 목적 및 기준

Production 첫 접속에서 확인된 `getStudents` redirect 후속 요청 취소를 보정하고, 첫 진입 안정성을 반복 검수했다. 기준 프런트 커밋 `5e75dc5`, 직전 기록 `098744d`다. 최초 Git 상태는 `main`, `origin/main` 동기화 및 clean이었다.

## 2. 첫 접속 반복검수

실제 Production 프런트는 수정 전 코드였으므로, 수정한 프런트를 localhost HTTP에서 제공하고 기존 Production Apps Script API에 연결해 독립 browser context로 검수했다. 매 회차 새 context를 만들었고 localStorage/sessionStorage는 0, service worker는 차단됐다. `file://`는 사용하지 않았다. 응답 본문은 학생 정보를 출력하지 않고 `ok`만 확인했다.

최종 30초 제한에서 얻은 결과:

| 회차 | 새 context | Apps Script redirect 체인 | 총 시간 | 결과 |
|---|---|---|---:|---|
| 1 | yes, 저장소 0 | 302 → 200, `ok:true` | 1,804ms | PASS |
| 2 | yes, 저장소 0 | 302 → 200, `ok:true` | 10,679ms | PASS |
| 3 | yes, 저장소 0 | 첫 요청 30초 동안 응답 없음, `net::ERR_ABORTED` | 30,040ms | FAIL |
| 4 | yes, 저장소 0 | 302 → 200, `ok:true` | 3,362ms | PASS |
| 5 | yes, 저장소 0 | 302 → 200, `ok:true` | 11,746ms | PASS |

완료 4/5, 성공률 80%. 성공 요청 시간 평균 6,898ms, 중앙값 7,021ms, 최소 1,804ms, 최대 11,746ms. 실패 1회는 30초 제한 시점까지 Apps Script 첫 URL이 HTTP 응답을 주지 않아 브라우저가 `net::ERR_ABORTED` 처리했고, Console에 `student list load failed AbortError: signal is aborted without reason`가 남았다. 브라우저가 HTTP 응답을 받기 전 취소되어 해당 회차의 HTTP status/response body는 없다.

성공 회차의 요청 체인은 `script.google.com/.../exec?action=getStudents`의 HTTP 302에서 `script.googleusercontent.com/macros/echo`로 이동해 HTTP 200, JSON `ok:true`였다. 이 성공 회차에서는 redirect 이후 취소가 없었다. 실패 분류는 Apps Script 응답 지연/무응답에 대한 전용 timeout 만료이며, redirect 자체의 302는 정상이다. 5회 연속 성공 기준은 미달이다.

## 3. 최소 수정 및 재검수

수정 파일: `app.js`.

- 기존 `READ_TIMEOUT_MS = 8000`은 그대로 유지.
- `STUDENT_DIRECTORY_TIMEOUT_MS = 30000`을 추가하고 `getStudents` 호출에만 적용.
- 다른 GET, 저장, 업로드 제한시간은 변경하지 않았다.
- 20초 임시 측정에서 4/5가 완료됐지만 한 요청이 제한시간까지 무응답이었고 한 redirect 체인이 17초 이상 걸렸다. 따라서 `getStudents`에만 30초를 설정했다. 최종 30초 검수에서도 1회가 30초까지 무응답으로 끝나므로 timeout을 더 늘려 실패를 가리지 않았다.
- 최종 수정본 5회 반복 결과: 4/5 PASS, 1/5 FAIL. 추가 재검수 PASS가 아니므로 Production에 배포하지 않았다.

## 4. test01 저장 및 Day06 E2E

첫 접속 5회 안정성 기준 미달로 이 단계는 진행하지 않았다. test01 존재를 확정하는 명부 확인/선택이나 학생 기록 쓰기는 하지 않았고, 실제 학생 데이터에는 접근·수정하지 않았다.

- `saveDayRecord`, 저장 후 새로고침: 미실행.
- 새 context의 server-only 복원: 미실행.
- Day06 기록 연결: 미실행.

## 5. 반응형 및 느린 네트워크

이번 보정은 `getStudents` timeout 경계에 한정했고, 5회 안정성 게이트가 통과되지 않아 별도의 화면 회귀/느린 네트워크 검수를 진행하지 않았다.

| viewport | 가로 overflow | Day05 | Day06 | 결과 |
|---|---|---|---|---|
| 1440×900 | 미검수 | 미검수 | 미검수 | 미검수 |
| 1024×768 | 미검수 | 미검수 | 미검수 | 미검수 |
| 768×1024 | 미검수 | 미검수 | 미검수 | 미검수 |
| 390×844 | 미검수 | 미검수 | 미검수 | 미검수 |

느린 네트워크 throttling: 미검수.

## 6. 콘솔 및 정적 검사

- 성공 4회: 앱 `warning`/`error`, page error 없음.
- 실패 1회: `student list load failed AbortError: signal is aborted without reason` (30초 제한 만료).
- 이전 20초 계측 시험에서 관찰된 로컬 favicon 404는 테스트 harness 요청이며 앱 API 오류로 분류하지 않았다.
- `node --check app.js`: PASS.
- `node --check research-days.js`: PASS.
- `git diff --check`: PASS (최종 확인 필요).

## 7. 배포 및 Git

- 프런트 수정: 있음, 아직 미커밋.
- Apps Script 수정: 없음.
- Production Cloudflare Pages 배포 및 확인: 하지 않음. 안정성 검수 기준 미달로 보류.
- 이 기록도 미커밋이다. 이전 시도에서 `.git/index.lock` 생성이 권한 거부됐으며, 이번에는 PASS 조건 미달이라 커밋/배포를 진행하지 않았다.

## 8. 최종 판정

**PARTIAL — 30초 `getStudents` 전용 timeout 적용은 확인됐으나 첫 접속 반복검수에서 4/5만 성공했다.**

## 9. 남은 문제

- `getStudents` 요청이 30초간 응답하지 않은 원인은 브라우저 측 데이터로 더 분해되지 않았다. 이 상태를 단순히 timeout 증가로 가리지 않았다.
- 5회 연속 첫 접속 성공을 확인한 뒤 test01 저장·복원·Day06 E2E와 4개 viewport 검수를 수행해야 한다.
- 전체 검수 통과 후에만 변경분 커밋/push 및 Cloudflare Pages 배포를 진행한다.
