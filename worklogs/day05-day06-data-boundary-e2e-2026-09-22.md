# Day05–Day06 데이터 경계 보정 및 E2E 검수 — 2026-09-22

## 1. 작업 목적
- Day05 UX를 재설계하지 않고 확인된 완료 판정, 저장 날짜, Day06 복원, 모바일 지도 및 피드백 경계만 보정했다.
- 기존 Apps Script·DayRecord 구조를 유지하고 test01만 실제 저장 검수에 사용했다.

## 2. 확인된 문제
- `getProjectReloadRecord()`가 `dayStateJson` 문자열을 직접 객체처럼 읽었다.
- 직접 수정한 문제 정의문이 정해진 끝말로 끝나지 않으면 Day05 완료 판정에서 제외됐고 Day06 레거시 fallback으로 다시 만들어질 수 있었다.
- 420px 이하에서 `.research-day__line` 첫 grid 열이 링크가 아니라 숫자 폭(36px)으로 잡혀 Day06 제목이 세로로 쪼개졌다.
- Day05 연구 이어보기 오답 피드백에도 `inline-feedback--correct`가 고정 적용됐다.
- Production Day05 저장은 클라이언트 `2026-09-23`, 서버 `03_연구일`의 Day05 행 `2026-09-18` 불일치로 `INVALID_REQUEST` 거부됐다.

## 3. 수정 파일 및 커밋
- `app.js`: 완료 판정, 공통 dayState 추출 재사용, 수동 문장 보존, 오답 피드백, 서버와 일치하는 Day05 날짜
- `styles.css`: 420px 이하 연구지도 행 grid 최소 수정
- `worklogs/day05-day06-data-boundary-e2e-2026-09-22.md`: 본 검수 기록
- 구현 커밋 `cd6a48e fix: harden day05 records and day06 restore`
- 저장 날짜 정합성 커밋 `76f60c5 fix: align day05 date with server record`

## 4. 실제 변경
- Day06은 `extractDayStateFromDayRecord(previousRecord)`를 재사용해 객체형·JSON 문자열형 `dayStateJson`을 읽는다.
- `problemDefinitionEdited === true`인 비어 있지 않은 문장은 Day06에서 템플릿 판정과 무관하게 우선 보존한다. 다른 레거시 기록은 이전 fallback을 유지한다.
- Day05 신규 최소 완료는 `targetUser`, 유효한 `inconvenience`, 비어 있지 않은 `problemDefinition`을 확인한다. 레거시 불편값 구분용 `isDay05CompleteProblemDefinition()`은 호환 목적으로 남겼다.
- 모바일 `.research-day__line`은 `minmax(0, 1fr) auto`로 바꿔 링크가 제목 공간을 받게 했다.
- 이어보기의 정답 피드백만 정답 클래스를 받고 오답은 일반 피드백 클래스를 사용한다.
- `app.js`의 Day05 날짜를 서버 기준 `2026-09-18`로 맞췄다. 서버 시트 및 기존 학생 데이터는 수정하지 않았다.

## 5. 정적·순수 JS 검수
- `node --check app.js`: PASS
- `node --check research-days.js`: PASS
- `git diff --check`: PASS
- `node --check runtime-config.js`: PASS; 로컬 검수 중 임시 설정은 원복했다.
- 순수 JS helper: dayState object/string 모두 수동 정의문·이유·현실 확인 필드 복원 PASS. 레거시 fallback PASS 및 원본 객체 불변 PASS.
- 직접 수정 문장 보존: 대상·불편을 바꾸어도 자동 덮어쓰기 없음, 새로고침 후 최소 완료 판정 PASS.
- 연구 이어보기 피드백: 오답 `inline-feedback` / 정답 `inline-feedback inline-feedback--correct` PASS.

## 6. 브라우저·반응형 검수
- 로컬 Playwright Chromium에서 A1/A2 각 질문 1회, A1–A4 코드 비노출, 연습/독립 관찰 구획 PASS.
- 자동 문제 정의문 생성, 직접 수정 후 대상·불편 변경에도 보존, 새로고침 복원 및 완료 문구 PASS.
- viewport 결과:

| viewport | 문서 폭 / overflow | 연습 카드 | Day06 제목 높이 |
| --- | --- | --- | --- |
| 1440×900 | 1440 / 없음 | 2열 | 29px |
| 1024×768 | 1024 / 없음 | 2열 | 29px |
| 768×1024 | 768 / 없음 | 2열 | 29px |
| 390×844 | 390 / 없음 | 1열 | 29px |

- 390px 지도 스크린샷 육안 확인: `06 아이디어 비교하기` 한 줄 표시, 세로 글자 쪼개짐 없음.
- 390px Day05 스크린샷 육안 확인: 응답 카드 단일 열, 가로 넘침 없음.

## 7. Apps Script 저장·복원 E2E
- `getStudents`에서 `test01` 활성 항목 및 연결된 `workId`를 확인하고, Production 화면에서도 이름 `테스트`로 표시되는 전용 테스트 계정임을 확인했다.
- 최초 저장 거부 원인은 `INVALID_REQUEST`: 클라이언트 `2026-09-23`과 서버 연구일 시트의 날짜 `2026-09-18` 불일치였다. 서버 자료는 바꾸지 않고 클라이언트 값을 정합화했다.
- 정합성 배포 뒤 test01에서 지정된 E2E 값으로 저장했고 앱의 `✓ 저장됨` 상태를 확인했다.
- 같은 탭 새로고침 및 localStorage 없는 새 브라우저 컨텍스트에서 `targetUser`, `inconvenience`, 직접 수정 `problemDefinition` 복원을 확인했다.
- Google Sheets의 정확한 `05_학생연구기록` 행 `dayrec_test01_day05`를 읽어 서버 영속값도 대조했다. test01 E2E 문장, `problemDefinitionEdited: true`, 이유, `direct[0]: true`, Day05 날짜 `2026-09-18` 확인.
- test01 외 학생 데이터는 수정하지 않았다. test01 Day05 행은 E2E 테스트 값으로 남아 있으며 삭제하지 않았다.

## 8. Day06 연결
- `extractDayStateFromDayRecord()`와 `getProjectReloadRecord()` 순수 함수의 object/string 입력 모두에서 문제 정의문·선택 이유 복원 PASS.
- Production clean-session에서 Day06으로 이동해 실제 화면에 표시되는지 확인하려 했으나 테스트 자동화의 Day06 링크 선택자가 지도 내 중복 링크 2개와 일치해 최종 표시 확인 전에 중단됐다. 이후 Apps Script 학생 목록 응답이 간헐적으로 앱의 8초 제한을 넘어 identity gate가 실패했다.
- 따라서 Day06 Production 화면의 실데이터 표시는 `미검수`; helper/서버 기록 검증을 화면 E2E PASS로 간주하지 않는다.

## 9. 콘솔 및 배포
- 로컬 브라우저에서 ReferenceError/TypeError는 관찰되지 않았다. 로컬 정적 테스트에서 앱 코드 예외가 아닌 정적 리소스 404 1건이 기록됐다.
- Production 페이지 오류 추적에서 앱 ReferenceError/TypeError는 확인되지 않았다. 일부 `getStudents` 지연은 앱의 기존 8초 제한으로 `연구원 정보를 불러오지 못했습니다.`를 표시했다. 이 공통 타임아웃은 범위 밖이라 수정하지 않았다.
- Cloudflare Pages: `cd6a48e` check `106597405415` success; `76f60c5` check `106599385275` success.
- 공개 `app.js`, `styles.css` HTTP 200 및 완료 판정·수동 문장 보존·서버 날짜·모바일 grid 마커 확인.

## 10. 남은 문제
- Apps Script 최초 `getStudents` 간헐 지연은 남아 있다.
- Day06 Production 화면에서 test01 실데이터가 보이는지 최종 UI 검증은 미검수다.
