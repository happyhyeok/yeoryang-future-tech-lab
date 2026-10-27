# 이미지·영상 교체 파일 30일 보존 정책

기준: 2026-10-27. 대표 Asset 및 `DayRecord.personalEvidenceRefs` 계약은 유지한다. 교체 전 파일은 즉시 휴지통으로 보내지 않는다. 운영 원본 PNG 9장은 이 교체 보존 대상이 아니다.

## 관리 행

별도 `10_미디어정책` Sheet에는 파일마다 `fileId`, `mediaKind`, `assetId`, `studentId`, `dayId`, `reviewStatus`, `replacedAt`, `expiresAt`, `cleanupStatus`, `reviewedAt`, `reviewedBy`를 기록한다. 현재 대표 사본은 `CURRENT`, 교체 전 파일은 `RETAINED`다. 교체 성공 시각을 ISO 8601로 기록하고 정확히 30×24시간 뒤를 만료일로 계산한다. 날짜 경과는 **후보 분류 조건**일 뿐 삭제 명령이 아니다.

## 교체와 실패

서버는 새 파일 생성·Asset 갱신·DayRecord 연결·서버 재조회가 성공한 뒤 이전 파일의 보존 행을 쓴다. 영상 교체에서는 이전 파일을 휴지통 처리하지 않는다. 이미지 교체에서는 이전 승인 사본의 링크 열람을 해제하고 파일 자체를 남긴다. 실패 시 Asset을 이전 대표 파일로 되돌리고 새 파일만 정리한다. 첫 등록 실패 시에는 새 Asset 및 고아 DayRecord 참조를 제거한다. 복구에 실패하면 새 파일을 함부로 지우지 않고 오류를 남겨 수동 복구 가능성을 유지한다.

## 정리 후보 DRY_RUN

`reportMediaCleanupCandidates_()`는 관리자 측에서만 실행할 조회 함수다. `mode=DRY_RUN` 결과에 현재 대표 여부, DayRecord 참조 여부, 30일 경과, 관리 사본 여부, 후보 여부를 담고 **Drive 파일을 변경하지 않는다**. 현재 대표 파일이나 DayRecord에서 직접 파일 ID가 참조된 파일은 후보에서 제외한다. 이미지는 승인된 업로드 사본 경로에 있는 파일만 관리 대상으로 본다. 이 경로 밖의 운영 원본 9장은 후보에서 제외한다.

자동 삭제 스케줄러와 실제 삭제 함수는 이 단계에서 만들지 않는다. 이후 정리에는 비공개 후보 목록을 사람이 검토하고, 현재 대표/참조/복구 필요 여부와 원본 제외를 다시 확인하며, 별도 승인된 실행 옵션 및 복구 백업을 요구한다.

## 운영 적용

운영 Sheet 백업, 활성 Apps Script 버전 15와 Script Properties 백업, 이미지·영상 Drive 파일 메타데이터와 권한 백업을 먼저 수행한다. 롤백 시 기존 대표 Asset·DayRecord 참조, 보존 행, 승인 상태와 실제 Drive 권한을 함께 복원한다. 자세한 순서는 `DAY06_DAY07_DEPLOYMENT_RUNBOOK.md`를 따른다.
