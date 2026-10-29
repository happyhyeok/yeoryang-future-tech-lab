# 이미지·영상 운영 백업 기록 — 2026-10-29

## 2026-10-29 추가 실행 — 최신 판정

**백업 완결성: PASS_WITH_LIMITATIONS. 운영 배포 준비: NOT_READY.** 앞선 부분 백업을 보존한 채 실제 누락 항목을 보강했다. 운영 Script Property 1개를 사용자 DPAPI 파일로 암호화해 별도 프로세스에서 복호화·일치 확인했다. 운영 Sheet를 새로 내보내 기존 사본과 10개 탭의 모든 비어 있지 않은 셀을 비교했으며 차이 0건, 기본키/참조/JSON 오류 0건이었다. 운영 원본 이미지 9장과 영상 17장의 메타데이터 및 본문 26개를 비공개 폴더에 보존하고 크기·형식·SHA-256을 확인했다. Cloudflare Production 배포 목록·Git 연동·현재/직전 배포 접근 및 정적 설정 파일을 확인했다. 상세는 `DAY_MEDIA_PRODUCTION_SECRETS_BACKUP_REPORT.md`와 `DAY_MEDIA_PRODUCTION_DATA_INTEGRITY_REPORT.md`.

제한: Asset이 참조하는 별도 Day02 영상 1개는 Drive 조회 404로 본문을 확보하지 못했다. DPAPI 사본은 현재 Windows 사용자 계정에서만 직접 복호화된다. Drive 휴지통 상태·제공 체크섬과 Cloudflare 일반 환경변수/빌드 설정은 조회되지 않았다. 따라서 독립 장치의 완전 복구와 운영 변경 창 개시는 아직 검증되지 않았다. 운영 원본과 Production 배포에는 쓰지 않았다.

## 이전 백업 실행 — 2026-10-29

## 2026-10-29 실제 백업 실행

**판정: PARTIAL_BACKUP.** 사용자가 승인한 `C:\Users\USER\Desktop\yeoryang-private-backup\`에 운영 원본을 수정하지 않고 사본을 생성했다. 폴더는 로컬 NTFS 고정 디스크 C:에 새로 만들었고 재분석 지점이 아니며 읽기·쓰기·삭제 시험을 통과했다. Desktop 레지스트리 경로가 이 위치를 가리키고 OneDrive 경로와 다르다. Google Drive/OneDrive 동기화 프로세스는 실행 중이지 않았다. 상속 ACL을 제거해 현재 사용자, SYSTEM, Administrators에만 전체 권한을 부여했다. 제3자 백업 프로그램까지 조사한 결과는 아니다.

| 대상 | 실제 결과 |
| --- | --- |
| 운영 Sheet | `production-sheet-2026-10-29.xlsx` 내보내기 완료. 107,253바이트, SHA-256 `ecd26d8379a50aa06d5549cae42eef6844cc14df679eeecfe84952fdc52fd32f`. ZIP 구조를 다시 열었고 원본과 사본의 10개 탭 이름·헤더가 일치했다. 데이터 행 수와 모든 참조값의 전수 비교는 미실행. |
| 활성 Apps Script | 실제 Web App 버전 15를 `clasp pull --versionNumber 15`로 `production-apps-script-v15/`에 저장. 13개 파일, 총 65,116바이트. 개별 SHA-256은 `production-apps-script-v15-manifest.json`, 활성 배포 목록은 `production-deployments-2026-10-29.txt`에 저장. 편집기 HEAD가 아닌 활성 버전이며 ImageService/MediaPolicyService는 포함되지 않는다. |
| Cloudflare 배포 이력 | Production 배포 목록 25건을 `production-cloudflare-deployments-2026-10-29.json`에 저장. 9,984바이트, SHA-256 `3987d1df40430072e7f0d1274c47057b2d69d25eefe27a343a4a2826a5dbe297`. 프로젝트 환경변수/비밀값 및 대시보드 설정의 전수 백업은 미실행. |
| Script Properties 비밀값 | **NOT_BACKED_UP.** `clasp`와 Apps Script API에 기존 Property를 읽는 지원 명령이 없어 값 추출·DPAPI 암호화 파일 생성을 완료하지 못했다. 화면에서 프로젝트/계정 식별을 안정적으로 확인하지 못했으므로 값의 임의 복사나 설정 변경을 하지 않았다. |
| Drive 원본·영상 | 이번 실행에서 운영 파일 본문/메타데이터 전체 사본은 만들지 않았다. TEST 복구 연습과 구분한다. |

이 경로는 Git 저장소 밖이며 위 개인 데이터 사본은 PR에 포함하지 않는다. 운영 백업 완결 및 배포 준비는 **NOT_READY**다. 다음에는 인증된 운영 Apps Script 편집기의 프로젝트 설정에서 Script Properties를 읽어 Windows 사용자 DPAPI로 암호화해 같은 폴더에 저장하고, Cloudflare 설정과 Sheet 데이터 행·참조를 전수 대조해야 한다.

## 이전 준비 기록 — 2026-10-28

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
