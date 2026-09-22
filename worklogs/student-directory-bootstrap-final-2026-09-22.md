# 연구원 명부 bootstrap fallback 도입 + 최종 안정성 검수

작성일: 2026-09-22

## 1. 목적 및 기준

`getStudents` 응답이 늦거나 실패해도 학생이 명부를 보고 수업에 진입할 수 있도록 bootstrap fallback을 적용했다. 기준 프런트 커밋은 `5e75dc5`; 이전 30초 timeout 검수 기록은 `worklogs/loading-stability-final-review-2026-09-22.md`다. 기존 Apps Script 및 학생별 데이터 구조는 변경하지 않았다.

## 2. 기존 문제와 구조 변경

기존 30초 `getStudents` 전용 timeout 반복 결과는 5회 중 4회 성공, 1회 timeout이었다. 성공 응답은 Apps Script URL의 302 redirect 뒤 200 JSON `ok:true`였으며, 무응답 회차를 timeout 연장으로 감추지 않았다.

- bootstrap 위치: `runtime-config.js`의 기존 `FUTURE_LAB_CONFIG.students`
- 정적 항목: 운영 연구원 5명의 `studentId`, `studentName`, `workId`, `active`만 포함
- 표시 순서: 브라우저 directory cache가 있으면 먼저 표시, 없으면 bootstrap을 즉시 표시하고 `getStudents`를 백그라운드 요청
- authoritative source: 서버 성공 시 active 목록으로 교체하고 캐시를 갱신. inactive/제거된 현재 선택만 서버 reconcile에서 해제
- 실패 처리: 현재 bootstrap/cache/server 목록과 학생 선택을 유지하고 비차단 상태 문구 및 재시도 버튼을 표시
- timeout: `getStudents` 전용 15초. 다른 API/read/write 제한은 변경하지 않음
- `test01`: bootstrap에는 미포함, 일반 URL에서 숨김, `?test=1` 및 서버 응답에서만 표시

## 3. 파일별 수정

- `app.js`: 15초 전용 timeout, bootstrap 즉시 표시, 성공 시 authoritative 교체 및 session 복원, 실패 시 목록 유지/비차단 안내
- `runtime-config.js`: 승인된 운영 5명에 한해 bootstrap 4필드 추가
- `styles.css`: 비차단 directory 상태 문구 색상
- `README.md`: static bootstrap의 역할과 제한 필드 문서화
- `worklogs/student-directory-bootstrap-final-2026-09-22.md`: 이번 검수 기록

## 4. 새 cold-context 5회 검수

각 회차는 새 브라우저 context, 비어 있는 local/session storage, service worker 차단 및 기존 site data 없는 조건으로 실행했다. 요청 성공/실패 경로 모두 실제 Apps Script API에 연결하거나 명시적으로 실패시켰다.

| 회차 | bootstrap 즉시 표시 | `getStudents` 결과 | 선택 | 입장 |
|---|---|---|---|---|
| 1 | PASS, 서버 응답 전 5명 | redirect 302 → 200, `ok:true` | PASS | PASS |
| 2 | PASS, 5명 | 15초 timeout/abort | PASS | PASS |
| 3 | PASS, 5명 | 15초 timeout/abort | PASS | PASS |
| 4 | PASS, 5명 | 15초 timeout/abort | PASS | PASS |
| 5 | PASS, 5명 | 강제 요청 실패 | PASS | PASS |

실패/timeout에도 bootstrap 카드가 유지되고 선택·입장 버튼이 작동했다. 메시지는 `최신 연구원 정보를 확인하지 못했습니다. 현재 저장된 연구원 정보로 시작할 수 있습니다.`였다. test01은 일반 모드에서 숨겨졌으며, 서버 성공 경로에서는 테스트 모드 목록에서 확인됐다.

## 5. test01 저장 및 복원 E2E

실제 `getStudents` 응답에서 전용 `test01` 계정을 확인한 뒤에만 검수했다. 쓰기 동작은 test01 세션에서만 수행했으며 다른 학생 기록은 쓰거나 수정하지 않았다.

검수 값:

- 대상: `E2E 테스트 사용자`
- 불편: `E2E 저장 복원 확인용 불편`
- 직접 수정 문제 정의문: `E2E 테스트 사용자의 저장 복원을 확인하기 위한 문제입니다.`
- 선택 이유: `내가 직접 겪어 본 적이 있다.`

초기 입력 직후 8초 write 응답 제한이 만료되어 첫 화면에는 저장 실패 안내가 표시됐다. 이를 성공으로 간주하지 않고 별도 localhost origin(분리된 브라우저 저장 영역, 이전 해당 origin 기록 없음)에서 test01을 다시 선택해 재검수했다. 세 필드의 검수값이 서버에서 복원되고 `✓ 저장됨`이 표시됐다. 같은 탭 새로고침 뒤에도 세 값이 유지되고 저장 완료 상태가 확인됐다. 즉, 첫 응답 timeout과 별개로 서버 기록 반영/재조회 결과까지 확인했다.

## 6. Day06 연결

`?day=6&test=1`의 기존 `projectReload` 흐름에서 실제 Day05 서버 기록을 읽었다. `extractDayStateFromDayRecord` 경로를 통해 저장 상태를 복원했다. 화면에는 직접 편집한 문제 정의문과 선택 이유가 표시됐고, 기본 예시로 대체되지 않았다. Day05의 대상/불편 값도 분리 저장된 원본 필드로 복원됐으며, 기존 Day06 UI는 그 값을 별도 텍스트 항목으로 렌더하지 않고 문제 정의문/기록 메모를 표시하는 구조를 유지했다.

## 7. Viewport 및 화면 검수

Day05 및 Day06을 localhost에서 확인했다. 네 viewport 모두 가로 overflow가 없고 Day05 정의 필드 3개, 연습 카드 4개가 렌더됐다. Day06 제목과 서버의 `projectReload` 문제가 네 폭 모두에서 표시됐다.

| viewport | Day05 | Day06 서버 기록 | 가로 overflow |
|---|---|---|---|
| 1440×900 | PASS | PASS | 없음 |
| 1024×768 | PASS | PASS | 없음 |
| 768×1024 | PASS | PASS | 없음 |
| 390×844 | PASS | PASS | 없음 |

이전 cold-context viewport 계측에서 연습 카드 열 수는 1440/1024/768에서 2열, 390에서 1열이었다. 390px에서도 Day06 제목은 가로 문장으로 표시됐다. 저장 상태 UI는 viewport별로 잘리지 않았다.

느린 네트워크 도구 throttling은 별도로 적용하지 않았다. 실제 Apps Script 15초 지연/timeout 경로에서 즉시 명부 표시와 진입을 확인했다.

## 8. Console 및 정적 검사

- `node --check app.js`: PASS
- `node --check research-days.js`: PASS
- `git diff --check`: PASS
- bootstrap timeout 회차의 `student list load failed AbortError` 경고는 의도한 fallback 경로로 분류
- 첫 test01 저장 시 `day01 server save failed AbortError` 경고: write 응답 timeout. 뒤이은 분리 저장소 복원 및 Day06 서버 재조회로 기록 반영 확인
- 복원 완료한 새 저장소 탭의 page error/console error: 없음
- 실패/복원 후속 화면에서 ReferenceError/TypeError/JSON parse error: 없음

## 9. 배포 및 Git

- Apps Script: 변경 및 재배포 없음
- 구현 커밋: `8a5632f` (`perf: add bootstrap student directory fallback`)
- 구현 push: `origin/main` 성공
- Cloudflare Pages: push 뒤 공개 Production이 갱신된 앱을 제공하는 것을 확인
- Production 공개 검수: 5개 bootstrap 카드가 즉시 나타났고 15초 뒤 비차단 fallback 안내로 전환. `test01`은 일반 URL에서 표시되지 않음
- Production 앱 콘솔: `getStudents` 15초 timeout 경고 1건. bootstrap 목록은 유지됨
- 검수 기록 커밋: `e2fb36d` (`docs: record bootstrap stability verification`), `origin/main` push 완료
- Apps Script 재배포: 없음

## 10. 최종 판정 및 남은 점

**PASS — bootstrap cold-start, 성공/실패 fallback, test01 서버 저장·분리 저장소 복원·새로고침 복원, Day06 서버 기록 연결, 네 viewport, Production 반영 및 정적 검사를 확인했다.** 첫 write 응답은 timeout됐지만 분리 저장소에서 서버 재조회로 기록 반영을 확인했다. 별도 throttling 설정은 적용하지 않았다.
