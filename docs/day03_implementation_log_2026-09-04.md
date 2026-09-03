# Day03 작업 종료 로그

작업일자: 2026-09-04

## 작업 목적

중단된 Day03 구현을 복구하고, 학생용 확정 원고에 맞춘 `움직이고 연결하기` 수업 흐름과 저장·복원·영상 증거 기능을 완성했다.

## 구현 내용

- 외부 조도센서 → Sensor:Edge P1
- 서보모터 → Sensor:Edge P2
- Sensor:Edge S/V/G 핀 연결 안내
- 외부 조도센서 값 측정, 새 기준값 설정, 방향 선택, 두 서보 각도 시험
- 확정 학생용 콘텐츠 `day03_student_content_external_light_sensor_revised.md` 반영
- `assets/day03/` 이미지 7개를 원고 순서에 맞게 배치
- MakeCode URL 저장·복원
- `day03Finding`, `day03NextUse` 연구기록 저장·복원
- 영상 촬영 → Google Drive 영구저장 → 새로고침 복원
- 학생별 Drive 경로 `stuXX/dayXX`

## 영상 저장 오류와 수정

초기 `VideoService.gs`가 영상 업로드 허용 연구일을 `day01`, `day02`로만 제한해 Day03 요청을 `DAY_NOT_FOUND`로 거부했다. 활성 `ResearchDay`를 먼저 검증하고, 유효한 `day01`~`day15` 형식만 허용하도록 일반화했다. Day03은 `block08`과 Day03 영상 라벨을 사용하며 Day01/Day02 기존 저장 호환성을 유지한다.

## 배포 및 검수

- Apps Script version 13 생성
- 기존 production deployment 갱신
- 학생 선택, 입력 저장·복원, 학생 A/B 분리, MakeCode URL, 이미지 7개, 전체 진행 기능 브라우저 검수
- 영상 촬영·즉시 재생·Drive preview 및 새로고침 복원 검수
- Drive에서 학생별 `day03` 폴더와 영상 파일 구조 확인

## 주요 커밋

- `2a3b44e` chore: checkpoint interrupted day03 implementation
- `6a78a95` fix: allow video uploads for active research days
- `635c497` feat: complete day03 moving device lesson

## 남은 작업

- 운영 사이트 배포 및 최종 공개 URL 확인
- Day04 제작 시작
