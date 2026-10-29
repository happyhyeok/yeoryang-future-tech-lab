# 운영 v15와 이미지 정책 소스 통합 검토 — 2026-10-29

**판정: PASS_WITH_LIMITATIONS / 배포 전 관리자 도구 차단.** 백업한 운영 v15의 13개 파일을 브랜치와 줄바꿈 정규화해 대조했다. `Config`, `SheetRepository`, `StudentService`, `Validation`, `Response`, `Setup`, `QuizService`, `Utils`는 동일하다. `AssetService`, `DayRecordService`, `VideoService`, `WebApi`는 변경됐고 `ImageService`, `MediaPolicyService`는 신규다. 이 14개 브랜치 파일은 독립 TEST v7 소스와 일치한다. TEST 전용 Runner·Bootstrap은 운영 대상이 아니다.

학생 API는 기존 `uploadVideo`의 `mediaKind=image` 분기를 통해 Day06·Day07 이미지를 등록한다. `getDayRecord`에 `imageReviewStatus`를 추가하고 승인되지 않은 이미지 Asset 공개를 막는다. `saveDayRecord`는 서버가 보유한 이미지·영상 참조를 자동저장 중 유지한다. `upsertAsset` 공개 경로는 이미지 변경과 영상 파일 ID 교체를 거부한다. 기존 TEST의 이미지 승인·학생 A/B 분리·영상 교체 결과는 재사용했고, 이번 로컬 정책·영상·이미지 경계 검사 9건이 통과했다. 운영 서버에 적용한 검사는 아니다.

새 영상은 파일 생성 → 정책 행 → Asset → DayRecord 확인 뒤 이전 영상에 30일 보존 행을 기록한다. 정상 교체는 구파일을 휴지통으로 옮기지 않는다. 이미지도 새 사본을 비공개로 만든 뒤 Asset·DayRecord를 확인하고 이전 사본의 공개 권한을 제거한다. Asset 갱신 이후 오류 시 대표 Asset을 복구하고 새 사본을 정리하는 보상 경로가 있다. 파일 생성 뒤 내부 오류 주입과 동시 업로드의 모든 충돌은 실서버에서 검증되지 않았다. 영상은 기존대로 새 파일을 링크 열람으로 생성하므로 저장 실패 중 잠깐 생성된 파일의 접근 가능성도 운영 검수 대상이다.

`10_미디어정책`이 없으면 정책 조회·쓰기 경로가 탭을 자동 생성한다. 따라서 기존 10개 탭과 11개 헤더를 백업·대조한 후 별도 변경 창에서 먼저 빈 탭을 만들어야 한다. 오늘 운영 Sheet 메타데이터에는 기존 10개 탭만 있고 정책 탭은 없었다. 운영 Property `ENVIRONMENT`, `IMAGE_STORAGE_FOLDER_ID`, `VIDEO_STORAGE_FOLDER_ID`, `MEDIA_REVIEWER_EMAIL`도 아직 적용하지 않았다. `SPREADSHEET_ID`는 기존 값을 유지한다. `PROJECT_ID`·`API_VERSION`은 코드 기본값을 사용하며 별도 변경 근거가 없다.

Day02의 조회 불가 영상 참조는 새 서버가 읽어도 자동 교정·삭제하지 않는다. 그 Day02 영상의 다음 업로드가 발생하면 기존 Asset ID 형식만 검사하고 새 파일로 교체한 뒤 누락된 이전 ID를 보존 정책 행에 기록할 수 있다. 이 행은 실제 Drive 파일의 복구 증거가 아니다. Day02 기존 오류는 별도 복구 판단을 유지하고, 운영 검수 때 기존 참조가 타 학생이나 다른 Day에 전파되지 않는지 확인한다.
