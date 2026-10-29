# 운영 Script Properties 독립 복구 백업 — 2026-10-29

기존 `production-script-properties-20261029-133521.dpapi`의 SHA-256 `398a9f14967645db1601ac0ff99dcd30db2f7daced8b65dae685dc7f7093d2d1`를 재확인하고 그대로 보존했다. 현재 Windows 사용자로만 복구할 수 있는 한계를 보완하기 위해, 사용자가 **로컬 PowerShell 보안 입력창에 직접 입력한 암호**로 별도 사본을 만들었다. 암호는 대화·명령 인자·파일·로그에 기록하지 않았다.

| 항목 | 실제 결과 |
| --- | --- |
| 휴대 가능한 암호화 파일 | `C:\Users\USER\Desktop\yeoryang-private-backup\production-script-properties-portable-20261029-142434.aesgcm` 1개 생성; 결과 기록은 비공개 `portable-properties-backup-result-20261029-attempt2.json` |
| 방식 | 16바이트 난수 salt, PBKDF2-HMAC-SHA256 600,000회, AES-256-GCM(12바이트 nonce, 16바이트 tag). 파일 형식 `YRLABG01` + salt + nonce + tag + ciphertext |
| 파일 검증 | 183바이트, SHA-256 `89161201b88e764235f22c7516362ac521d39a14986b5913c972512e8b654552`; 파일 재읽기 및 생성 직후 복호화 값 일치 |
| 별도 프로세스 검증 | 사용자 암호 재입력 후 복호화 PASS, 기존 DPAPI 원문과 메모리 내 바이트 일치, Property 키 1개 확인, 평문 파일 0개 |
| 보안 | 파일은 승인된 로컬 비공개 폴더의 제한 ACL을 상속; 암호화 파일에서 Property 키 문자열이 평문으로 보이지 않음 |

암호화/검증 스크립트는 같은 비공개 폴더에 있다. 복구 시 PowerShell 7과 이 암호화 파일·검증 스크립트를 다른 장치에 **안전하게 복사**하고 사용자가 암호를 별도로 입력해 복호화할 수 있도록 설계했다. 스크립트는 기본적으로 값을 표시하거나 평문 파일을 만들지 않는다.

**판정: PASS_WITH_LIMITATIONS / CROSS_DEVICE_NOT_TESTED.** 생성·동일 PC 별도 프로세스 복구는 통과했다. 실제 다른 장치 복호화, 암호의 별도 보관, 암호화 파일의 별도 매체 복사는 확인하지 못했다. 사용자는 현재 승인된 외장/별도 비공개 경로가 없다고 답했다. 따라서 디스크 전체 손실에 대비한 독립 사본 확보는 **BLOCKED_STORAGE_LOCATION**이다. 현재 운영 Script Properties는 변경하지 않았다.
