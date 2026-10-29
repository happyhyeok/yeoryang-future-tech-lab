# Day06·Day07 이미지 정책 배포 직전 판정 — 2026-10-29

**최종 판정: NO_GO.** 운영 자원은 이번에 변경하지 않았다. 사용자는 학교 승인 관리자 계정이 없고 링크 공개 동의도 승인 전이라고 확인했다. 운영 폴더·관리 도구도 준비되지 않았으며 기존 공개 설정 파일에 학생 실명이 포함돼 있다. 아래 PASS는 Production 동작 완료를 뜻하지 않는다.

| ID | 판정 | 현재 근거와 남은 조건 |
| --- | --- | --- |
| G01 운영·TEST 폴더 분리 | PASS | 원본/운영 영상 루트와 TEST 이미지/영상 루트의 ID·상위 경로가 다름 |
| G02 운영 이미지 부모 위치 | APPROVAL_REQUIRED | 운영 프로젝트 루트의 새 전용 하위 폴더 권장, 미생성 |
| G03 소유자·권한 | APPROVAL_REQUIRED | 기존 루트 소유자·비공개 확인; 신규 폴더·Apps Script 실행 주체 미확인 |
| G04 운영 관리자 계정 | APPROVAL_REQUIRED | 사용자가 학교 승인 계정은 아직 없다고 확인 |
| G05 관리자 인증 | BLOCKED | 코드의 이메일 검사·공개 API 차단 확인; 비관리자 실계정 거부와 운영용 호출 도구 미검증 |
| G06 Script Properties | APPROVAL_REQUIRED | 기존 `SPREADSHEET_ID` 유지, 신규 4개 값/권한 미확정 |
| G07 정책 Sheet | PASS_WITH_LIMITATIONS | 운영 10개 탭, 정책 탭 없음; 11개 헤더와 생성·검증 순서 확정, 실제 생성 금지 |
| G08 v15 통합 호환 | PASS_WITH_LIMITATIONS | 공통 8개 동일, 변경 4개·신규 2개는 TEST v7과 일치; 운영 미배포 |
| G09 영상·30일 보존 | PASS_WITH_LIMITATIONS | TEST·로컬 정상 교체 확인; 내부 실서버 오류 경로 제한 |
| G10 Day02 기존 오류 | PASS_WITH_LIMITATIONS | 새 코드에 자동 교정·삭제 없음; 기존 404 원인·실제 재생 미해결 |
| G11 학생용 54개 파일 | PASS | 새 격리 빌드 54개, 잠금 SHA-256 불일치 0, 기존 `dist/` 보존 |
| G12 TEST·개인정보 | BLOCKED | TEST URL·가상 학생 0; 기존 공개 설정에 실학생 이름 5명과 운영 API 주소 포함, 공개 적합성 결정 필요 |
| G13 백업·복구 | PASS_WITH_LIMITATIONS | Sheet·v15·Drive·Cloudflare·암호화 Property 백업과 TEST 복구 증거 보유; 별도 매체·타 장치 미검증 |
| G14 Cloudflare 자동 배포 | PASS | PR #1 Draft·기능 브랜치 유지, `main` 자동 배포 확인; 병합·Production 배포 금지 |
| G15 이미지 공개·철회 정책 | APPROVAL_REQUIRED | TEST 권한 전환 검증, 사용자가 운영 게시 동의는 승인 전이라고 확인; 담당자·긴급 철회 절차 필요 |
| G16 중단·롤백 | PASS_WITH_LIMITATIONS | v15·직전 정적 배포·특정 행·Drive 권한별 복귀 절차 보유; 운영 롤백 미실행 |

격리 빌드 경로는 Git 밖 승인된 비공개 폴더의 `student-predeploy-20261029-78c56af/dist/`다. 공개 허용 목록 54개 파일만 있고 TEST URL·`test_student_a/b` 표식은 0건이다. 비공개 빌드 검사 기록 `student-predeploy-build-audit-20261029.json`의 SHA-256은 `2c8c46763ba8dcdebac3c66a5d2861d2c5671308aea8cf627ada9acd52bdba48`이다. 그러나 `runtime-config.js`에 기존 실명 5명과 운영 API 주소가 있어 개인정보 공개 적합성 판단이 필요하다. API 주소 자체를 비밀 인증정보로 취급하지 않지만, 학생 이름 선택 API 역시 별도 인증이 없으므로 **설정 파일만 고쳐서 학생 명단 노출 문제가 해결된다고 판단하지 않는다**.

`GO_FOR_APPROVAL` 재판정 조건: 학교가 게시 동의 범위와 공개 학생 명단 정책을 승인하거나 필요한 최소 수정·재검수를 완료하고, 승인 관리자 계정·편집 권한·비관리자 거부를 확인하며, 운영용 관리자 호출 도구를 TEST에서 검증한다. 새 이미지 폴더 생성 승인, 운영 Property 값과 탭 생성 계획, 별도 매체 백업·Day02 복구 판단을 변경 창 책임자가 확인한다. 그 뒤에도 실제 운영 설정·배포는 별도 승인이 필요하다.
