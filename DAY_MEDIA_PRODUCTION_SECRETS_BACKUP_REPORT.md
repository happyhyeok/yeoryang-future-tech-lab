# 운영 설정·비밀값 백업 — 2026-10-29

## Apps Script 프로젝트와 배포

- 운영 저장소의 `.clasp.json`, `clasp deployments`, 편집기 프로젝트 설정의 Script ID가 일치했다. 편집기에는 실제 운영 Sheet와 연결된 **Script Property 1개**만 표시됐다. 활성 Web App은 버전 15이며 편집기 HEAD와 구분했다.
- 기존 Property는 `SPREADSHEET_ID` 한 개다. 편집기에 표시된 값이 읽기 전용 운영 Sheet 메타데이터의 ID와 일치함을 확인했다. `PROJECT_ID`, `ENVIRONMENT`, `IMAGE_STORAGE_FOLDER_ID`, `VIDEO_STORAGE_FOLDER_ID`, `MEDIA_REVIEWER_EMAIL`은 화면에 없었다. 없는 키는 생성하거나 변경하지 않았다.
- 값은 Git 밖의 `C:\Users\USER\Desktop\yeoryang-private-backup\production-script-properties-20261029-133521.dpapi`에 **Windows DPAPI CurrentUser**로 암호화해 저장했다. 358바이트, SHA-256 `398a9f14967645db1601ac0ff99dcd30db2f7daced8b65dae685dc7f7093d2d1`.
- 암호화 전 평문 파일을 만들지 않았다. 생성 프로세스에서 바이트 단위 복호화 일치를 확인했고, 별도 PowerShell 프로세스에서도 파일 열기·복호화·키 1개·값 길이 44를 다시 확인했다. 파일 ACL은 제한된 백업 폴더의 사용자·SYSTEM·Administrators 3개 항목만 상속한다. 운영 Property는 읽기 외에 변경하지 않았다.

**암호화·동일 Windows 사용자 복원: PASS_WITH_LIMITATIONS.** DPAPI CurrentUser 사본은 다른 Windows 계정 또는 컴퓨터에서 바로 복호화할 수 없다. 계정·DPAPI 마스터 키를 잃는 재해에 대비한 별도 보안 키 관리 사본은 없다. 이번 사본을 독립 장치 복구 완료로 해석하지 않는다. 브라우저 제어는 설정 확인 후 URL 안전성 판별 문제로 중단돼 설정 화면의 사후 재조회는 못 했지만, 운영 설정 쓰기는 수행하지 않았다.

## Cloudflare Pages

- 대상 프로젝트 `yeoryang-future-tech-lab`만 `production-cloudflare-project-summary-20261029.json`에 저장했다. Wrangler 프로젝트 목록에는 Git Provider `Yes`; Production 배포 목록 25건은 `production-cloudflare-deployments-live-20261029.json`에 저장했다. 두 배포 목록 백업의 SHA-256은 `3987d1df40430072e7f0d1274c47057b2d69d25eefe27a343a4a2826a5dbe297`로 일치한다.
- 현재 Production 소스 `aabf454`, 직전 후보 `55a3e9d`의 고유 배포 URL을 각각 HEAD 200으로 확인했다. 양쪽의 `index.html`과 `runtime-config.js`를 `cloudflare-rollback-targets-20261029/`에 별도 저장했다. 두 설정 파일은 동일하고 운영 Web App v15를 가리킨다. 두 HTML 모두 이미지 기능 스크립트를 로드하지 않아 **기존 v15로 되돌릴 정적 후보**로 해석할 수 있다. 실제 Production 롤백은 실행하지 않았다.
- `wrangler pages secret list`에서 Production 환경에 접근 가능한 비밀값 목록의 제목만 표시되고 키 행은 없었다. 출력은 `production-cloudflare-secret-keys-20261029.txt`에 보관했다. 일반 환경변수 값, 대시보드 빌드 명령·출력 디렉터리의 실시간 설정은 Wrangler 목록 명령으로 조회되지 않아 **NOT_VERIFIED**다. 비밀값을 강제로 추출하거나 설정을 변경하지 않았다.

비밀값과 학생 개인정보는 이 문서나 PR에 포함하지 않았다. 백업 폴더는 로컬 NTFS 경로이며 사용자·SYSTEM·Administrators만 접근한다.
