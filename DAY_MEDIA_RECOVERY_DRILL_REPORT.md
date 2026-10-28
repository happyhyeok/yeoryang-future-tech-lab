# 독립 TEST 복구 연습 기록 — 2026-10-28

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
