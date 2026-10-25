# TEST Google 저장소 직접 재조회 — 2026-10-25

Google Drive/Sheets 연결 도구로 독립 TEST 자원을 읽기 전용으로 재조회했다. ID와 학생 이름·실제 학생 문장은 이 기록에 적지 않는다.

- TEST Sheet `09_자료파일`: A Day06, A Day07, B Day06, B Day07의 대표 screenshot Asset 4행. 각 행의 학생·Day·MIME·storageFileId가 TEST API 재조회와 일치했다.
- TEST Sheet `05_학생연구기록`: 같은 4개의 DayRecord 행. 각 행의 `personalEvidenceRefs`가 해당 학생·Day의 Asset ID 하나를 포함한다. 동시 자동저장 후 A Day06의 합성 `todayDecision`도 유지됐다.
- TEST Drive: TEST 루트 아래 `학생이미지_업로드 / test_student_a|test_student_b / day06|day07` 경로에 PNG/JPG/WEBP 파일이 실제 생성됐다. 대표 파일 ID 4개와 Drive 파일 메타데이터를 대조했다.
- S06 오류 주입: A Day06의 TEST DayRecord 소유 작품값을 임시로 바꾼 뒤 교체 요청을 실행했다. 서버가 거부했고 이전 대표 Asset의 파일 ID와 기존 Drive 파일이 유지됐다. TEST 작품값은 즉시 원상복구하고 재조회했다. 실패한 신규 파일은 비휴지통 파일 목록에 나타나지 않았다.
- 교체 성공 시 이전 TEST 파일은 보존된다. 폴더 자체는 비공개지만 업로드 파일은 개별 `ANYONE_WITH_LINK` 공유여서 링크를 아는 사람은 볼 수 있다. 운영 원본 9장과 운영 Sheet 행은 수정하지 않았다.
