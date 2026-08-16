# 여량초 미래기술 연구소 기준소스 인덱스

정리일: 2026-08-16

이 문서는 `내일을 바꾸는 미래기술 연구소` 프로젝트의 기준소스 진입점이다. 새 기능을 개발하기 전에는 이 문서에서 기준문서의 우선순위와 현재 개발 상태를 먼저 확인한다.

## 1. 기준소스 우선순위

1. 최상위 교육·운영 기준
   - `yeoryang_grade6_future_tech_lab_base_plan.md`

2. 기능별 상세 기준
   - `apps_script_phase1_spec.md`
   - 학생 공동 기록 설계
   - 학생 인증 페이지 설계
   - 학생용 HTML 구조 설계
   - 기타 기능별 확정 설계

3. 실제 구현
   - `app.js`
   - `research-days.js`
   - `runtime-config.js`
   - `apps-script/*`
   - `styles.css`
   - `index.html`

4. 현재 개발상태 및 실행 방법
   - `README.md`

코드가 기준문서와 다르다고 해서 자동으로 코드가 새로운 기준이 되지는 않는다. 의도된 변경인지 확인한 뒤 기준문서를 업데이트한다.

## 2. 문서별 역할

### `yeoryang_grade6_future_tech_lab_base_plan.md`

최상위 교육·운영 기준문서이다. 프로젝트 목적, 15개 ResearchDay, 32개 LessonBlock, 교육 목표, 기술 구성, 개인/공동 활동 원칙, 최소 수행, 기본 완성, 연구기록, 프로젝트 북, 학생 운영 원칙, 기술별 전체 흐름을 담당한다.

Apps Script의 함수 구현이나 API 세부 코드는 이 문서에 중복하지 않는다.

### `apps_script_phase1_spec.md`

Day01 Apps Script의 개발·데이터 계약 기준문서이다. DayRecord, QuizResult, Asset, `dayStateJson`, API action, 학생/작품 검증, ID 기반 upsert, localStorage/server 저장 관계, A/B 학생 분리, Asset 무결성, Apps Script 책임 범위, E2E 완료 기준을 담당한다.

교육적 완료조건 자체를 새로 정의하지 않고, 상위 기획안의 교육 기준과 프론트엔드 판정값을 저장한다.

### `README.md`

현재 구현 범위, 실행·검수 방법, 미구현 상태, 운영 전 준비사항을 설명한다. README는 기준문서의 진입점이 아니라 현재 상태 안내 문서이다.

## 3. 충돌 발생 시 원칙

문서와 코드가 충돌하면 임의로 한쪽을 수정하지 않는다.

- A. 코드가 오래됨: 기준문서를 따라 코드 수정 필요
- B. 코드 변경이 최신 확정사항인데 문서 반영이 안 됨: 기준문서 업데이트 필요
- C. 어느 쪽이 최신인지 판단 불가: 수정하지 않고 보고

이번 기준소스 정리에서는 C에 해당하는 내용을 임의로 결정하지 않는다.

## 4. 현재 확정된 핵심 기준

### 프로젝트 단위

- 전체 흐름은 15개 `ResearchDay` 기준이다.
- 32개 `LessonBlock`은 연구일 내부 진행상태이다.
- 학생 연구기록의 중심 단위는 `DayRecord`이다.

### 학생 식별

학생 식별 흐름은 다음 순서이다.

```text
studentId
→ workId
→ dayId
→ DayRecord
```

학생은 이름 선택 방식으로 식별한다. 로그인, 비밀번호, PIN, 인증코드, 학생번호 직접 입력은 사용하지 않는다. `teacherMode`는 보안 인증이 아니라 강사용 보완 UI 표시 여부이다.

### Day01 최소 수행

Day01 최소 수행 기준은 다음으로 확정한다.

```text
A 버튼 → LED 기본 작동 성공
```

코드 기준은 다음과 같다.

```javascript
buttonToolCompleted &&
unlockedTools.includes("LED 출력")
```

흔들기, 자유 연구, 직접 변경, MakeCode 링크, 영상, 퀴즈, 연구기록은 기본 완성에 포함될 수 있지만 최소 수행 조건으로 강제하지 않는다.

### Day01 역할

`selectedRoles`는 실제 맡은 역할이 아니라 학생이 해보고 싶은 역할이다.

```text
05_학생연구기록.role = ""
dayStateJson.selectedRoles = 선택 역할
```

### `todayDecision` / `nextAction`

`todayDecision`은 별도 입력란을 추가하지 않고 실제 Day01 활동 결과로 자동 생성한다. 실제 micro:bit 입력·출력 활동이 없으면 빈 값으로 저장한다.

`nextAction`은 `recordValues.nextSensor`가 있을 때만 생성한다. 없으면 빈 값으로 저장한다.

### 3D 설계

3D 단계의 기준 흐름은 다음과 같다.

```text
3D 부품 설계하기
→ 실제 치수 확인
→ Tinkercad 모델링
→ STL
```

종이 모델링을 필수 과정으로 다시 넣지 않는다.

## 5. Apps Script 기준 상태

현재 Apps Script 1차 범위는 다음 action이다.

```text
ping
getStudents
getDayRecord
saveDayRecord
saveQuizResult
upsertAsset
```

저장 대상은 다음 시트이다.

```text
05_학생연구기록
06_퀴즈결과
09_자료파일
```

Apps Script는 저장, 조회, 검증, upsert, 시간관리, 데이터 무결성을 담당한다. Day01의 교육적 완료조건은 Apps Script에서 다시 계산하지 않는다.

## 6. localStorage / 서버 충돌 보호

확정 요구사항은 다음 필드를 사용해 서버 저장 실패 후 최신 localStorage 기록이 오래된 서버 기록에 덮어써지는 것을 방지하는 것이다.

```text
serverSyncPending
localRevision
localUpdatedAt
serverUpdatedAt
```

현재 코드에는 이 구조가 반영되어 있다. `serverSyncPending=true`인 현재 학생·작품·연구일 local 기록은 서버 기록보다 우선 복원되고, 요청 snapshot의 `localRevision`이 현재 revision과 일치할 때만 pending 상태를 해제한다.

## 7. 현재 프로젝트 상태

현재 상태는 다음이다.

```text
Day01 Apps Script Web App 배포·프론트 학생조회 연결 완료
/ A/B Google Sheets E2E 검증 전
```

완료로 표현하지 않는 항목:

- Apps Script 연동 완료
- 실서비스 완료
- Day01 완전 완료

실제 학생·작품 기준데이터 상태:

```text
01_학생 / 02_작품 실제 운영 기준데이터 입력·검수 완료
학생 5명 / active 5명
studentId 중복 없음
workId 중복 없음
학생 ↔ 작품 1:1 연결 정상
```

실제 완료된 항목:

```text
01_학생 / 02_작품 실제 운영 기준데이터 입력·검수 완료
→ ping
→ getStudents 실데이터 확인
→ runtime-config.js를 통한 프론트 학생조회 연결
```

아직 남은 주요 작업:

```text
A/B Google Sheets E2E
→ Git 초기화
→ GitHub 저장소 생성·연결
→ Cloudflare Pages 최초 배포 준비
```

## 8. 배포 역할 기준

운영 배포 기준은 다음과 같이 구분한다.

```text
GitHub
→ 프로젝트 소스 저장
→ 변경 이력 / 버전관리

Cloudflare Pages
→ GitHub 저장소 연결
→ 학생용 HTTPS 운영 사이트 배포

Apps Script
→ API backend

Google Sheets
→ 학생·작품·연구기록 데이터
```

전체 흐름:

```text
Codex
↓
로컬 프로젝트
↓
GitHub
↓
Cloudflare Pages
↓
학생용 HTTPS 페이지
↓
Apps Script /exec
↓
Google Sheets
```

GitHub는 제거하지 않고 소스·버전관리 역할로 유지한다. 학생용 운영 호스팅은 GitHub Pages가 아니라 Cloudflare Pages를 기준으로 한다.

## 9. 보조문서 처리

기존 또는 향후 보조문서는 삭제하지 않는다. `기초기획안 준비 사항`, `학생 공동 기록 설계`, `학생용 HTML 구조 설계`, `학생 인증 페이지 설계`, `추가적인 고민사항`과 유사한 문서는 기능별 상세 기준 또는 설계 이력/참고로 유지한다.

단, 보조문서를 최상위 교육·운영 기준과 같은 권한처럼 표현하지 않는다.
