# Day06·Day07 이미지 운영 반영 전 확인

## 2026-10-29 최신 배포 직전 게이트

**NO_GO.** G01–G16 상세는 `DAY_MEDIA_PREDEPLOY_GO_NOGO.md`. 운영 이미지 폴더 미생성, 승인 관리자·공개 동의 미확정, 운영 관리자 호출 도구 미검증, 기존 공개 설정의 실학생 명단 정책 미확정이 차단 조건이다. 운영 Sheet 정책 탭은 아직 없고 운영 Property·배포도 미변경이다. 격리 학생 빌드 54개는 해시가 일치하나 실제 Production 배포 승인을 뜻하지 않는다. Day07 교육 원고·완료 기준은 이번 정책 검수에서 변경하지 않았다.

## 2026-10-29 최종 차단 조건 점검

- [x] 운영 Day02 Asset/DayRecord/API 참조, 같은 학생·Day 폴더의 다른 WebM, v15 교체 코드 조사; 원인은 `UNRESOLVED`
- [x] 기존 DPAPI 사본 유지, 사용자 보안 입력으로 휴대용 AES-GCM 사본 생성·별도 프로세스 복호화 일치
- [x] Cloudflare Production 빌드 명령·출력·자동 배포·변수/비밀 0개와 현재/직전 정적 배포 확인
- [x] 운영 v15와 TEST 검증 소스 차이 및 정책 Sheet·Property·폴더 적용 순서 확정
- [ ] Day02 조회 불가 파일의 소유자 활동/삭제·권한 이력과 최종 영상 확인 후 승인된 복구
- [ ] 암호화 사본의 별도 매체 보관 및 실제 다른 장치 복호화 시험 (현재 승인된 별도 위치 없음)
- [ ] 신규 비공개 이미지 부모 폴더, 실제 관리자 계정, 공개·보존 정책 승인
- [ ] 별도 운영 변경 승인 후 정책 탭·Property·서버/학생 페이지 적용 및 실사용 검수

**운영 배포 준비: NOT_READY.** 원인은 기존 Day02 참조 위험과 독립 매체 백업·운영 설정 승인 미완료다. 기존 TEST 정책 판정 `PASS_WITH_LIMITATIONS`는 유지한다. 상세 C01~C14는 `DAY_MEDIA_PRODUCTION_READINESS_REPORT.md`에 있다. 아래 항목은 이전 시점의 이력이다.

## 2026-10-29 운영 백업 추가 검수

- [x] 실제 운영 Script Property 1개 확인·DPAPI 암호화·별도 프로세스 복호화 일치
- [x] 기존 운영 Sheet 백업 해시 재확인, 새 시점 XLSX 내보내기 및 10개 탭 전 셀 차이 0건
- [x] 학생·작품·DayRecord·QuizResult·Asset 기본키/참조 및 JSON 212개 검사: 논리 오류 0건
- [x] 운영 원본 PNG 9장·영상 WebM 17개 메타데이터·본문 비공개 사본, 크기·형식·SHA-256 확인
- [x] Cloudflare 현재/직전 Production 배포 URL 접근 및 두 정적 설정 파일 보관; 운영 롤백은 미실행
- [ ] Day02 영상 Asset 1개의 Drive 404 원인·본문 복구 확인
- [ ] DPAPI CurrentUser 외 독립 장치 복구 가능한 보안 키 관리 수단 확보
- [ ] Cloudflare 일반 환경변수·빌드 설정과 Drive 휴지통 상태·원본 체크섬 확인
- [ ] 운영 이미지 정책 Property/폴더/관리자·`10_미디어정책` 탭 준비 및 v15 서버 코드 통합 (별도 변경 승인 필요)

백업 완결성은 **PASS_WITH_LIMITATIONS**, 운영 배포 준비는 **NOT_READY**다. 아래 2026-10-29 및 2026-10-28 항목은 당시 시점의 기록이며 이번 확인으로 갱신된 항목을 다시 미실행으로 보지 않는다.

## 2026-10-29 백업·복구 실행 결과

- [x] 승인된 로컬 비공개 폴더 생성·쓰기 시험·동기화 경로/프로세스·ACL 확인
- [x] 운영 Sheet XLSX 및 활성 Apps Script v15 소스·배포 목록의 실제 사본과 SHA-256 저장
- [x] TEST Sheet B01–B05·B07–B08 실제 변경·복원·재조회
- [x] TEST B06 정책 셀과 별도 Drive 사본 권한을 각각 변경·복원 (연동 관리자 경로는 제한사항)
- [x] TEST Drive 휴지통·권한, 별도 Apps Script v6→v7, Cloudflare TEST Preview 이전본→현재본 복귀
- [x] 기존 `dist/`를 보존하고 새 격리 폴더에서 54개 파일 재빌드·해시 일치
- [ ] 운영 Script Properties 비밀값을 별도 암호화 사본으로 저장
- [ ] 운영 Drive 원본·영상 메타데이터/본문 및 Cloudflare 환경 설정 전수 백업
- [ ] 운영 Sheet 모든 데이터 행·참조값 전수 대조

위 결과는 아래 2026-10-28 준비 기록을 갱신한다. 백업은 **PARTIAL_BACKUP**, 운영 배포 준비는 계속 **NOT_READY**다. 실제 경로와 제한은 `DAY_MEDIA_PRODUCTION_BACKUP_REPORT.md`, `DAY_MEDIA_RECOVERY_DRILL_REPORT.md`에 기록했다.

2026-10-27 정책 구현 검수는 **PASS_WITH_LIMITATIONS**, 운영 배포 준비는 **NOT_READY**다. 아래 2026-10-25/26 PASS는 당시 TEST 소스에 한정한다. 새 승인·보존 정책은 `DAY_MEDIA_POLICY_E2E_REPORT.md`로 별도 판정한다.

2026-10-28 백업·복구 준비 점검: 사용자가 승인된 비공개 백업 위치가 없다고 확인해 운영 백업은 `BACKUP_LOCATION_REQUIRED`다. TEST B01–B08 및 Drive·Apps Script·Cloudflare 복구 연습은 NOT_RUN. 운영 Web App v15를 배포 목록에서 재확인했다. 54개 잠금 소스는 줄바꿈 정규화까지 포함해 일치하지만 기존 `dist/`의 이미지 스크립트 1개가 잠금과 달라 새 격리 빌드가 필요하다. 상세는 `DAY_MEDIA_PRODUCTION_BACKUP_REPORT.md`, `DAY_MEDIA_RECOVERY_DRILL_REPORT.md`, `DAY_MEDIA_PRODUCTION_DEPLOYMENT_PLAN.md`를 따른다.

- [ ] 승인된 비공개 위치에 운영 Sheet·Apps Script 활성 버전/Property·Drive 메타데이터 백업 및 무결성 확인
- [ ] 독립 TEST 특정 행·파일·배포 복구 연습 B01–B08 및 복귀 검증
- [ ] 기존 `dist/`와 분리한 새 54개 정적 빌드 해시·TEST 값·운영 개인정보 검토
- [ ] 운영 Production 배포 ID·Git SHA·설정 및 직전 정상 배포 재확인

- [x] 이미지 새 업로드는 비공개 `PENDING_REVIEW`; TEST Drive 소유자 전용 권한 확인
- [x] TEST 관리자 승인 사본만 링크 열람, Sheet 정책 행·Drive 권한·학생 브라우저 대조 (버전 6)
- [x] TEST 관리자 거부·철회 후 Drive 링크 권한 제거 및 새로고침 확인
- [x] 승인된 이미지 교체 후 새 사본 승인 대기·기존 승인 비승계 확인
- [x] 영상 TEST 교체 후 구파일 비휴지통·30일 만료 기록 확인
- [x] 최종 TEST 소스 재배포 완료(v7), 표준 DRY_RUN 실서버 실행·파일 불변 및 영향 범위 브라우저 확인
- [x] 실제 30일 경과를 가정한 TEST 만료 후보 경계 검사: 후보 1건, Sheet 임시 날짜 복원·Drive 비휴지통/권한 불변
- [ ] 운영 `10_미디어정책` 탭/관리자 Property와 백업·롤백 실제 준비

- [x] 운영 자원과 다른 TEST Sheet·Drive 폴더·Apps Script 프로젝트 구성
- [x] 이미지 폴더 Script Properties 전환 및 TEST 운영 ID 차단
- [x] 학생용 54개 파일 허용 목록·해시 빌드 통과
- [x] Google TEST 실행 권한 승인 및 Web App 응답 403 해결
- [x] S01–S13·S15–S18 실제 TEST API·Sheet·Drive 및 브라우저 검증
- [x] Chromium 세 viewport 등록·교체·새로고침·A/B 분리 캡처
- [x] S14/V01–V10 기존 영상 실제 WebM 업로드·TEST 폴더/Sheet/브라우저 재조회 (Drive 내장 iframe 클릭 재생만 별도 확인 필요)
- [x] Day06·Day07 퀴즈·최소/기본/추가 작성·서버 게이트 회귀, TEST QuizResult 행 대조
- [x] 별도 Cloudflare TEST Pages HTTPS Preview, 공개 파일 54개 SHA-256 및 세 viewport Playwright
- [x] TEST 영상 폴더 Script Properties 분리 및 TEST→운영 ID 일치 차단
- [x] TEST Day06 문제 원문 실제 수정·교체 후 Day05/06 왕복 저장 시험 (R01–R12 PASS, R13 원복)
- [ ] Drive 내장 영상 iframe 클릭 재생 확인 (자동 클릭 실패, 수동 확인 필요)
- [x] 이미지 개별 링크 공개 범위와 교체 구파일 보존 방식 분석 (운영 정책 결정 필요)
- [x] 운영 Script Properties·활성 배포 버전 15와 TEST 버전 5 대조 (필수 Property·ImageService 부재 발견)
- [x] 기존 학생 이미지 9장의 개별 접근 권한 확인 (모두 소유자 전용, 변경 없음)
- [ ] 개인정보 공유 정책·보존 기간 확정, 운영 백업·롤백 연습
- [ ] 운영 반영 별도 승인

2026-10-25 TEST 최종 회귀 판정은 **PASS_WITH_LIMITATIONS**였다. 정책의 F04·F06 내부 실패 주입과 F10–F12 제외 경계는 로컬 검사에 한정한다. 운영 버전 15에는 ImageService가 없고 필수 운영 Property가 누락되어 있다. 운영 정책 설정, 백업·롤백 준비와 Drive 영상 수동 재생 확인이 남았다. 대표 이미지는 Day별 1장만 표시하고 교체된 구이미지는 즉시 삭제하지 않는다. Production 배포와 실제 학생 기록·원본 이미지 9장 쓰기는 실행하지 않았다. `DAY06_DAY07_PREPRODUCTION_AUDIT.md` 참조.
