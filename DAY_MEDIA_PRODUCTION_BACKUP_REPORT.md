# 이미지·영상 운영 백업 준비 기록 — 2026-10-28

**백업 판정: BACKUP_LOCATION_REQUIRED / NOT_RUN.** 사용자가 현재 승인된 비공개 백업 위치가 없다고 확인했다. 학생 개인정보와 Script Properties 값을 임의의 개인 폴더·Git·공개 배포 폴더에 복사하지 않았다. 운영 원본에는 읽기 외의 작업을 하지 않았다.

| 대상 | 현재 확인 | 백업·무결성 |
| --- | --- | --- |
| 운영 Google Sheets 전체 | 이전 사전점검에서 연구기록·퀴즈·Asset 헤더 대조; 이번 회차 실시간 탭/행 수·소유자·권한 조회 불가 | `BACKUP_LOCATION_REQUIRED`; 사본·탭별 행 수·참조 대조 NOT_RUN |
| 운영 Apps Script | 운영 프로젝트 `clasp deployments`에서 Web App 버전 15 재확인; 이전 감사에서 ImageService 부재와 Property `SPREADSHEET_ID`만 확인 | 실제 배포 v15 소스·Property 값·배포 설정의 비공개 백업 NOT_RUN |
| 운영 이미지 원본·영상 Drive | 이전 감사에서 원본 PNG 9장 소유자 전용 및 운영/TEST 폴더 분리 확인 | 최신 파일 목록·권한·휴지통 상태 수집 및 사본 생성 NOT_RUN |
| Cloudflare Pages | 운영 공개 주소 HEAD 200 확인 | Production 배포 ID·Git SHA·환경 설정·되돌리기 대상의 대시보드 재확인 NOT_RUN |

이전 감사 결과는 2026-10-26 당시 증거다. 이번 회차의 실시간 운영 Sheet/Drive/Property 확인이나 완전한 백업으로 승격하지 않는다. 식별자·학생명·설정 값은 공개 문서에 남기지 않는다.

## 승인된 위치가 마련되면 실행할 원본 불변 백업

1. 백업 저장 위치의 소유자, 접근자, 외부 공유 금지, 보존 기간을 확인하고 비공개 운영 기록에 위치를 남긴다.
2. 운영 Spreadsheet 전체 사본을 만들고 원본/사본의 탭 목록, 헤더, 데이터 행 수, `studentId → workId → dayId → DayRecord` 및 Asset 참조를 비교한다. 사본 열기 권한도 확인한다.
3. **활성 Web App 버전**의 Apps Script 소스와 배포 설정을 백업한다. 편집기 HEAD와 혼동하지 않는다. Script Properties의 키와 값은 별도 접근 제한 파일에 저장하며 공개 로그에는 키 목록만 기록한다.
4. Drive 이미지·영상의 파일 ID·이름·부모·소유자·권한·휴지통 상태를 비공개 목록에 저장한다. 파일 본문 복제는 원본 보존·복구 필요성을 판단한 뒤 결정한다.
5. Cloudflare Production 배포 ID, Git SHA, 빌드 명령·출력 폴더·환경 설정과 직전 정상 배포 식별자를 비공개로 기록한다.
6. 각 백업의 생성 시각, 바이트 수, SHA-256(가능한 파일), 원본/사본 식별자, 열기·재조회 결과를 비공개 무결성 표에 남긴다. 모든 항목이 통과하기 전 배포를 중단한다.
