# 운영 Cloudflare Pages 설정·롤백 조사 — 2026-10-29

대상 프로젝트 `yeoryang-future-tech-lab`의 **Production 설정 화면**과 Wrangler 배포 목록을 읽기 전용으로 대조했다. 비공개 설정 요약은 `C:\Users\USER\Desktop\yeoryang-private-backup\production-cloudflare-settings-ui-20261029.json`에 저장했고 SHA-256은 `6d8383d11aa86aaec1154c735de16795706825c60dd30454aaa76cd9605c8ba`다.

| 설정 | 현재 확인값 |
| --- | --- |
| Git 연결 | `happyhyeok/yeoryang-future-tech-lab` |
| Production 브랜치 | `main`, 자동 배포 사용 |
| 빌드 명령 | `node scripts/build-student-dist.cjs` |
| 출력 폴더 / 루트 | `dist` / 저장소 루트 |
| 빌드 캐시 / 시스템 | 사용 안 함 / 버전 3 |
| 감시 경로 | `*` |
| Production 변수·비밀 | 설정 표에 행 0개, Wrangler 비밀 목록에도 키 0개 |
| 바인딩 / 배포 후크 | 0개 / 0개 |
| Functions/Workers | 현재 Production 커밋의 소스 트리에 `functions/`·`_worker.js` 없음. 정적 `runtime-config.js`가 운영 API를 제공 |

현재 Production은 `main` 소스 `aabf454`, 직전 정상 후보는 `55a3e9d`다. 두 고유 배포 주소 모두 HEAD 200이며 각각의 `index.html`과 `runtime-config.js`를 비공개 폴더에 백업했다. HTML이 참조하는 JS/CSS는 현재 5/5, 직전 4/4가 응답했다. 두 설정 파일은 동일하고 활성 Apps Script Web App v15를 가리키며 이미지 스크립트를 로드하지 않는다. 따라서 직전 후보는 **v15와 호환되는 정적 롤백 후보**다. Production 롤백 실행과 실제 사용자 기록 복원 시험은 하지 않았다. 기능 브랜치의 새 커밋은 Preview에만 배포됐고 Production은 위 `main` 배포를 유지한다.

**설정 읽기: PASS. 롤백 후보 접근: PASS_WITH_LIMITATIONS.** 운영 자동 배포를 끄거나 변수·빌드 설정을 변경하지 않았다. 새로운 이미지 정책은 Apps Script/Sheet/Drive 설정 변경 창에서 별도로 적용해야 하며, Cloudflare Production 배포는 이번 작업 범위 밖이다.
