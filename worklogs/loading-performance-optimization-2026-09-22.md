# 프런트엔드 + Google Apps Script 로딩 성능 구조 개선

작성일: 2026-09-22

## 1. 작업 목적과 기존 구조

학생 목록, 날짜별 기록, 이전 연구 기록을 읽는 동안 화면 전체가 기다리던 구간을 줄이고, Apps Script의 Spreadsheet 조회를 한 요청 안에서 재사용한다. 시트 구조와 저장 데이터 구조는 변경하지 않았다. 실제 학생 데이터는 사용하지 않았고, Production 검수는 서버 목록에서 확인된 `test01`만 선택해 읽기 전용으로 수행했다.

초기 Git 상태는 `main`, `2d72c5f` 기준 clean이었다. Production Apps Script 배포는 버전 13이었고 로컬 추적 소스와 원격 버전 13의 차이는 이번 변경 대상 4개 파일뿐임을 확인했다.

## 2. 개선 전 측정값과 병목

Production의 Apps Script `getStudents`는 다섯 번 측정해 4,571 / 2,723 / 2,250 / 2,730 / 2,603ms였다(평균 2,975ms, 중앙값 2,723ms, 최소 2,250ms, 최대 4,571ms). 모두 `ok:true`, 6명 응답이었다. 브라우저에서 이름 목록이 나타나는 시점은 별도의 대략 측정으로 약 6초였다.

test01의 기존 `getDayRecord(day05)`는 4,249ms, 기록 있음이었다. `getDayRecord(day04)`는 기록 없음 응답까지 10,199ms였다. 별도 응답시간은 브라우저 네트워크 왕복 기준이며 Apps Script 내부 시간과 혼동하지 않는다.

소스에서 확인한 병목은 다음과 같다.

- `getStudents`가 매 요청마다 학생/작품 시트를 다시 읽고, 헤더와 데이터에 별도 `getValues`를 사용했다.
- `getDayRecord` 경로의 학생/작품/연구일/기록/Asset 검증 및 조회가 같은 요청 안에서도 테이블과 Spreadsheet를 다시 열어 스캔할 수 있었다.
- 프런트는 초기 학생 목록이 오기 전 선택 UI를 확정하지 않았고, 학생 선택 뒤 서버 복원이 끝나야 본문을 그렸다.
- `renderPage`의 초기화 렌더에서 Day01 무작위 상태를 서버 복원보다 먼저 저장할 수 있는 경쟁 경로를 발견해 수정했다.
- Day06은 저장 대상 Day 목록에 포함되지 않아 현재 Day06 기록은 조회하지 않는다. 기존 구조상 Day06 진입에는 이전 Day05 기록을 읽는 한 요청만 필요했다. 따라서 2→1 요청 감소로 기록하지 않는다.

## 3. Apps Script 변경

수정 파일: `apps-script/WebApi.gs`, `apps-script/SheetRepository.gs`, `apps-script/StudentService.gs`, `apps-script/DayRecordService.gs`.

- `getStudents_`에 ScriptCache 캐시를 적용했다. 키 `futurelab2026:student-directory:v1`, TTL 300초(5분). miss, 캐시 파싱 오류, 쓰기 오류는 기존 Spreadsheet 조회로 fallback한다.
- 요청 단위로 Spreadsheet/시트/읽은 테이블을 재사용한다. 테이블 헤더와 데이터를 단일 범위 `getValues()`로 읽고, 쓰기 시 해당 테이블 캐시를 무효화한다.
- 읽기 API(`getStudents`, `getDayRecord`, `getLessonContext`)의 내부 계측 로그에 Spreadsheet open, sheet lookup, `getValues`, 검색, 응답 구성, 전체 시간을 기록하도록 했다. 로그에는 학생 ID나 기록 내용을 넣지 않는다.
- `getLessonContext`를 추가하고 기존 `getDayRecord`를 유지했다. 현재 기록은 필요한 경우에만 Asset을 반환하며, 이전 기록은 Asset을 읽지 않는다. Day06 프런트 경로는 `includeCurrent=false`로 이전 Day05만 요청한다.
- 모의 Apps Script 테스트에서 명부 캐시 hit의 시트 재조회 없음, 요청 내 테이블 재사용, 이전 Day05 기록과 JSON 문자열 `dayStateJson` 반환, 현재 Asset 미조회(0개)를 확인했다.

## 4. 프런트엔드 변경

수정 파일: `app.js`.

- API 호출과 병렬 처리: 신규 `getLessonContext`를 우선 사용한다. 구버전 배포에서 `INVALID_ACTION`이면 기존 `getDayRecord` 호출을 `Promise.allSettled`로 병렬 실행하는 호환 경로를 유지한다.
- 즉시 렌더링: 선택 후 localStorage(있으면) 또는 기본 상태를 먼저 화면에 그리고, 서버 복원은 백그라운드에서 적용한다. 학생 목록도 브라우저 캐시가 있으면 즉시 표시하고 서버에서 갱신한다.
- 브라우저 명부 캐시: `futurelab2026:student-directory`, `students`와 `fetchedAt`, 최대 7일. 캐시는 임시 표시용이며 서버 성공 응답이 권위 있는 목록이다. 서버에서 비활성/변경 학생이 확인되면 세션을 해제하지만 로컬 기록은 일괄 삭제하지 않는다.
- 로컬/서버 충돌: `serverSyncPending` 로컬 기록을 계속 우선하며, `localRevision`이 동기화 중 바뀌면 늦게 온 서버 상태로 덮지 않는다.
- 서버 기록 없음과 요청 실패를 구분한다. 이전 기록 조회 실패 시 예시 기록을 실제 기록 없음처럼 표시하지 않고 재시도 UI를 제공한다.
- 읽기/저장 timeout은 각 8초로 역할 이름을 분리했다. 영상 업로드 timeout/흐름은 변경하지 않았다.
- Day01 초기 랜덤 상태 자동 저장은 서버 복원 성공 또는 서버 기록 없음 확인 뒤에만 허용한다. 네트워크 오류/기록 학생 불일치 때 빈 기본값이 기존 서버 기록을 덮지 않도록 했다.
- `?perf=1`에서 내용이나 신원을 노출하지 않고 요청 action 및 화면 가용 시점만 브라우저 콘솔에 계측한다.

## 5. 개선 후 측정값

| 항목 | 개선 전 | 개선 후 | 비고 |
|---|---:|---:|---|
| Production `getStudents` 왕복 | 평균 2,975ms (5회) | 평균 1,567ms, 중앙값 1,353ms, 최소 1,182ms, 최대 2,991ms (6회) | 모두 `ok:true`, 응답 count 6; 약 47% 낮은 평균이나 표본/캐시 상태가 달라 참고치 |
| test01 Day05 기존 조회 | 4,249ms | 통합 `getLessonContext`의 Day05 이전 기록 요청 3,369ms | 별도 호출, 단일 측정; 약 21% 낮음 |
| 첫 브라우저 목록 표시 | 약 6초(대략) | 첫 시도는 실패 상태, 수동 재시도 후 목록 표시 | 첫 로드 개선 PASS가 아닌 불안정/미검수 |
| 캐시된 재진입의 Day06 기본 화면 | 서버 응답 대기 | 브라우저 reload 후 약 0.84초 내 본문 확인 | CUA 액션 왕복 포함 관찰값 |
| Day06의 이전 기록 요청 수 | 기존 이전 Day05 1회 | 통합 API 1회, 이전 Asset 조회 0회 | 요청 수는 기존 구조와 동일; 자산/중복 검증 조회 절감 목적 |

`getLessonContext` 실 Production API는 HTTP 200, `ok:true`, previous record와 state JSON 있음, currentAssets 0개를 반환했다. test01 데이터에서 대상/불편/선택 이유/직접 편집 여부를 확인했고 문제 정의문은 기대 문구와 일치했다.

## 6. 브라우저 E2E 결과

- 첫 진입: Chrome Production에서 첫 `getStudents` 요청은 로딩 후 실패 UI로 전환했다. 재시도 버튼으로 목록을 다시 읽어 표시했으며 목록에 test01 전용 테스트 계정이 있음을 확인했다. 최초 진입의 안정적인 캐시/네트워크 결과는 PASS로 볼 수 없다.
- test01 Day05: `?day=5&test=1&perf=1`로 직접 진입했다. 서버 복원 후 `✓ 저장됨`, 대상, 불편, 직접 수정 문제 정의문, Day05 선택 이유가 기존 서버 값으로 표시됐다. 입력/선택/저장 동작은 하지 않았다.
- test01 Day06: `?day=6&test=1&perf=1`로 진입했다. “내 기록 확인하기”에서 Day05의 직접 수정 문제 정의문, 다음 연구, 선택 이유 메모가 표시됐다. 기준 예시로 대체되지 않았다.
- 같은 탭 reload 후 세션 복원: 선택 학생으로 Day06 기본 화면이 약 0.84초 내 다시 나타났고, 재확인 시 이전 서버 기록이 동일하게 표시됐다. 이는 새 브라우저 세션/저장소 제거 검수와는 구분한다.
- Apps Script에 저장 요청을 보내지 않았으므로 “저장→새로고침” 신규 쓰기 E2E는 실행하지 않았다. 기존 test01 서버 데이터를 읽어 복원만 검수했다.
- 첫 요청 실패 후 재시도 때 목록이 나타났으나 브라우저 개발자 콘솔 접근 도구가 없어서 콘솔 오류 상세는 미검수다. Apps Script `clasp logs`는 GCP project ID 미설정으로 열 수 없었고, Apps Script 실행 기록 화면에서 현재 프로젝트 이름 필터로는 실행이 조회되지 않았다.
- `agent-browser` 스킬 사용 가능성 확인 결과 CLI 실행 파일은 설치되어 있지 않았다. 로컬 `file://` harness 접근은 브라우저 정책상 금지되어 재시도하지 않았다.
- 정확한 viewport 1440×900, 1024×768, 768×1024, 390×844 및 slow-network 시뮬레이션은 현재 브라우저 조작 API에서 viewport/network 제한 설정을 제공하지 않아 미검수다. 브라우저 기본 화면에서만 E2E를 확인했다.

## 7. 정적 검사와 배포

- `node --check app.js`: PASS
- `node --check research-days.js`: PASS
- 모든 `apps-script/*.gs`를 Node 구문 검사에 입력: PASS
- `git diff --check`: PASS
- 순수 JS/Apps Script 모의 테스트: PASS (임시 테스트 파일은 제거)
- Apps Script: 기존 Production 배포 ID 유지, 버전 13→14 업데이트 완료. 신규 deployment를 만들지 않았다.
- 프런트 구현 커밋: `5e75dc5 perf: reduce blocking server reads`
- Push: `origin/main` 성공
- Cloudflare Pages/Production: 공개 HTML 및 `app.js` HTTP 200 확인. 배포된 `app.js`에서 화면 가용 계측 및 `getLessonContext` 코드 확인.
- 작업 기록은 구현과 별도 커밋으로 추가한다.

## 8. 남은 문제

- 첫 Chrome `getStudents` 요청이 실패하고 수동 재시도가 필요했던 현상은 Production에서 관찰됐다. 서버 API 직접 호출은 성공했지만 브라우저 콘솔/네트워크 오류 원인을 확정하지 못했다.
- Apps Script 내부 성능 로그를 읽을 GCP project 설정/로그 접근은 확보되지 않았다. 내부 계측 코드는 배포했으나 Spreadsheet/getValues 세부 실제 수치는 미검수다.
- 신규 쓰기 E2E는 데이터 무결성을 위해 실행하지 않았다. 테스트 계정의 기존 서버 기록 복원 및 Day06 연결만 읽기 전용으로 검증했다.
- 정확한 네 viewport 및 느린 네트워크 검수는 미완료다.
