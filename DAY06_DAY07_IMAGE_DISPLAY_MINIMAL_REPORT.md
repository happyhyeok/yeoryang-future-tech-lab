# Day06·Day07 학생 이미지 표시 최소 수정 — 2026-10-29

**최신 판정: 같은 브라우저 IndexedDB 복원 PASS / 다른 PC 복원 NOT_AVAILABLE / Production NOT_READY.** 학생 화면의 기존 이름 선택과 Day06·Day07 연구 활동·저장·완료 조건은 변경하지 않았다. 운영 서버·Drive·Sheet·Cloudflare Production 및 학생 원본 PNG 9장은 변경하지 않았다.

## IndexedDB 최소 완성 및 최신 TEST

`day-image-evidence.js`에 학생 ID·Day ID별 대표 이미지 1개를 보관하는 동일 출처 IndexedDB 저장소를 추가했다. 서버 업로드와 `getDayRecord` 재조회가 성공한 뒤에만 사본을 확정한다. 교체 시 기존 로컬 항목을 삭제하고 새 항목을 저장한다. 승인 대기 상태의 같은 브라우저 새로고침·새 페이지에서는 해당 학생·Day의 로컬 그림을 표시한다. 관리자 거부·철회·미등록 상태는 로컬 그림을 표시하지 않고 삭제를 시도한다. 저장 실패 시 이전 화면과 기존 로컬 대표가 유지된다. 현재 학생·Day의 `이 기기 이미지 삭제` 버튼은 해당 로컬 사본만 지우며 서버 Asset·DayRecord·Drive 파일을 건드리지 않는다.

독립 TEST Apps Script와 가상 학생 A/B를 사용한 Chromium 검수에서 A Day06 최초·교체·새로고침·같은 브라우저 새 페이지 복원, A Day07 등록·복원, B 분리, 실패한 교체 후 기존 그림의 새로고침 복원, 로컬 삭제 뒤 안내와 이미지 숨김을 확인했다. IndexedDB 키는 A Day06·Day07 2개였고 Day06 삭제 뒤 Day07 1개만 남았다. 390×844, 650×900, 1440×900 가로 넘침은 0이다. TEST Sheet에서 A Day06·Day07 Asset의 현재 파일과 DayRecord 참조가 맞고, B Asset과 개인 증거 참조는 검사 전후 같았다. B Day07의 다른 연구기록 필드 전체 불변은 이번 검사에서 입증하지 않았다. 현재 TEST 파일 두 개는 Drive에서 소유자 전용·링크 공개 없음이다. 로컬 Node/Playwright 검사 10건 PASS. 새 격리 학생 빌드 54개 해시 불일치 0건, 기존 `dist/` 보존. 최신 화면은 `verification/indexeddb-screenshots/`, 실행 요약은 `verification/day-image-private-preview-live.log`에 있다.

브라우저 프로필 데이터를 지우거나 다른 PC·브라우저를 쓰면 IndexedDB 사본은 없다. 같은 공유 PC의 같은 브라우저 프로필에서는 이름 선택에 인증이 없으므로 다른 사람이 학생 이름을 선택해 로컬 그림을 볼 수 있다. 사용 후 해당 Day의 로컬 삭제 버튼을 누르거나 브라우저의 사이트 데이터를 삭제해야 한다. 다른 기기에 비공개 Drive 이미지를 전달하는 기능은 만들지 않았다. 학교 승인 없는 링크 공개도 하지 않았다. 다른 기기 복원과 운영 적용은 현재 범위에서 불가하다.

아래 내용은 IndexedDB 추가 전의 최초 로컬 미리보기 검수 이력이다.

## 기존 코드와 실제 차단 원인

기존 `uploadVideo`의 이미지 분기는 TEST Drive에 PNG/JPG/WEBP 사본을 비공개로 만들고 기존 Asset ID와 DayRecord `personalEvidenceRefs`를 갱신한다. `getDayRecord`는 승인된 대표 이미지에만 파일 ID와 썸네일 URL을 포함한다. `PENDING_REVIEW`, `REJECTED`, `REVOKED`는 상태만 반환하고 파일 ID를 숨긴다. TEST에서 비공개 사본의 Drive 권한은 소유자 전용이었다. 학생 이름 선택은 Google Drive 인증이 아니므로 새로고침·다른 기기에서 이 사본을 `<img>`로 다시 읽을 수 없다. 이는 화면 새로고침 오류가 아니라 현행 비공개·승인 정책의 결과다.

## 최소 변경

`day-image-evidence.js`만 학생 화면 기능으로 변경했다. 파일 선택 후 로컬 `FileReader` 결과를 즉시 미리보기로 보여주고, TEST 서버 저장·재조회가 성공해도 승인 대기 중에는 같은 브라우저 탭에서 로컬 그림과 `변경하기`를 유지한다. 교체 실패 시 이전 대표 화면을 복원한다. `Asset`·`DayRecord` 스키마, 서버 승인 정책, Drive 공유 권한은 바꾸지 않았다. 새로고침 뒤 승인 대기 이미지는 기존처럼 숨기고 상태를 표시한다. 승인된 이미지의 기존 서버 조회 경로는 그대로다. 브라우저 파일 데이터를 장기 저장하거나 다른 학생에게 전달하지 않는다.

## 실제 TEST 결과

운영과 다른 TEST 설정의 로컬 54개 학생용 파일을 Chromium 390×844에서 열어 독립 TEST Apps Script에 연결했다. 가상 학생 A의 Day06에서 합성 PNG 최초 업로드와 다른 색 PNG 교체를 실행했다. 두 번 모두 화면의 로컬 그림이 교체되고 `변경하기`가 표시됐다. TEST Sheet의 A Day06 Asset 현재 파일과 DayRecord 참조가 일치하고, 정책 행은 `PENDING_REVIEW`였다. A Day07에도 합성 PNG를 업로드해 같은 결과를 확인했다. 두 현재 파일의 Drive 메타데이터는 PNG·소유자 전용·`shared=false`였다. 학생 B 화면에 A의 로컬 그림이 노출되지 않았다. 새로고침과 새 Chromium 페이지에서 A Day06·Day07 승인 대기 이미지는 다시 표시되지 않았다. 현재 사본의 관리자 승인·공개 전환은 학교 승인 없이 실행하지 않았다.

로컬 Node/Playwright 이미지·정책 검사 12건 PASS. 실패한 교체의 이전 승인 이미지 복원 검사도 포함한다. 학생용 공개 허용 목록의 잠금을 갱신하고 Git 밖 새 격리 폴더에서 54개 파일을 빌드해 SHA-256 불일치 0건을 확인했다. 기존 `dist/`는 보존했다. 실행 요약은 `verification/day-image-private-preview-live.log`, 화면은 `verification/private-preview-screenshots/`에 있다. TEST Sheet·Drive 재조회 결과는 이 보고서에 학생 ID/파일 ID 없이 기록했다.

## 당시 운영 판단 (IndexedDB 이전)

관리자 UI나 인증 시스템을 새로 만들 필요는 없다. 다만 **재접속 후 학생에게 이미지를 표시하려면** 기존 정책대로 해당 사본의 게시 동의와 승인 담당자를 확정하고, 승인된 사본에 한해 링크 열람 권한을 부여·검증해야 한다. 사용자는 현재 승인 관리자 계정이 없고 링크 공개 동의도 승인 전이라고 확인했다. 비공개 상태를 유지하면서 이름 선택만으로 다른 기기의 학생에게 이미지를 제공하는 안전한 경로는 현 구조에 없다. 공개 승인 없이 영구 재표시를 약속하거나 Drive 권한을 임의로 바꾸지 않는다. 운영 v15에는 이미지 서비스가 아직 없으므로 Production 적용 준비는 **NOT_READY**다.
