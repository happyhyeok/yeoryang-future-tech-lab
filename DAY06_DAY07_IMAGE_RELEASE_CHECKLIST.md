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
- [ ] Day06 문제 원문 실제 수정·교체 후 Day05/06 왕복 저장 시험
- [ ] 실제 학생 브라우저에서 Drive 내장 영상 iframe 클릭 재생 확인
- [ ] 이미지 개별 링크 공개 범위와 교체 구파일 보존 정책 검토
- [ ] 운영 Script Properties·현재 운영 Apps Script 배포 소스와 TEST 버전 5의 동등성 확인
- [ ] 기존 학생 이미지 9장의 개별 접근 권한 확인
- [ ] 운영 반영 별도 승인

최종 회귀 판정 **PASS_WITH_LIMITATIONS**. 대표 이미지는 Day별 1장만 표시하고, 교체된 구파일은 즉시 삭제하지 않는다. 보존 기간과 개인정보가 포함된 이미지의 개별 공개 링크 허용 범위를 운영 전에 정한다. Production 배포는 별도 승인·운영 사전 점검 전 실행하지 않는다. 운영 학생 기록·원본 이미지 9장에 대한 쓰기는 실행하지 않았다. 상세 결과는 `DAY06_DAY07_FINAL_REGRESSION_REPORT.md`.
