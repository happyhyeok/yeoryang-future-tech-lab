# Day05 구현 보정 기록 — 2026-09-22

## 보정 이유
Day05 확정 기획과 대조해 퀴즈 완료 기준, A1·A2 응답, 후보 연결, 직접 관찰 후보, 현실 확인 완료 판정을 보정했다.

## 수정 내용
- 퀴즈: 정답 여부와 무관하게 3문항 모두 응답하면 `quizCompleted=true`; score는 실제 정답 수를 유지
- A1·A2: 입력/선택 응답 필드와 UI 추가
- B 후보: `source` 기준으로 입력·복원·현실 확인을 연결하고 기존 index 배열은 호환 유지
- 직접 관찰: `direct` source 최종 후보 카드와 문제 정의문 자동 연결 추가
- 기본 완성: 현재 최종 선택 문제의 현실 확인 3항목 모두 true 조건 추가
- Day06 문구: “지난 연구에서 나는 누구의 어떤 불편을 해결하려고 했을까요?”로 수정

## 정적 검수
- JavaScript syntax check: PASS
- `git diff --check`: PASS
- 브라우저/E2E: 미검수 — 브라우저 실행 환경에서 localhost 접근 불가

## 최종 보정 — 2026-09-22
- A1/A2 선택 버튼의 data key를 실제 `day05A1SituationCompare`, `day05A2SituationChange` 상태명과 일치시켜 rerender/복원 선택 표시를 바로잡았다.
- 최종 source가 B 장면 선택 목록에 포함되고 대응 후보가 존재하는지, direct라면 직접 관찰 문제가 남아 있는지 완료 판정에서 다시 확인한다.
- 최종 선택된 B 장면 해제 시 source와 legacy index만 초기화하고 후보 기록은 보존한다. direct 입력을 비우면 direct 최종 선택만 해제한다.
- “문제와 해결 방법”에 `problem`/`solution` 실제 선택 버튼과 정오 피드백을 추가했다. 완료 조건에는 포함하지 않는다.
- 신규 `day05ProblemSolutionAnswer` 기본값/허용값 normalize 추가.
- `node --check app.js`, `node --check research-days.js`, `git diff --check`: PASS
- 브라우저/E2E: 미검수 — localhost 접근 차단
