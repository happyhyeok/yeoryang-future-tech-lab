# Day06·Day07 이미지 운영 반영 전 확인

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

2026-10-25 TEST 최종 회귀 판정은 **PASS_WITH_LIMITATIONS**였다. 2026-10-26 운영 반영 사전점검 판정은 **NOT_READY**다. 운영 버전 15에는 ImageService가 없고 필수 운영 Property가 누락되어 있다. 대표 이미지는 Day별 1장만 표시하고, 교체된 구이미지는 즉시 삭제하지 않는다. 보존 기간·공개 링크 허용 범위·Drive 영상 수동 재생을 운영 전에 확정한다. Production 배포와 실제 학생 기록·원본 이미지 9장 쓰기는 실행하지 않았다. `DAY06_DAY07_PREPRODUCTION_AUDIT.md` 참조.
