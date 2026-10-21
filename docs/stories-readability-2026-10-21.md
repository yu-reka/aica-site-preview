# 선배들의 이야기 카드·상세 가독성 개선

- 후기 목록과 All의 포스트잇은 정사각형을 유지하며, 제목과 작성자 영역을 남기고 본문 미리보기만 공간에 맞춰 말줄임표로 표시한다. 원문과 상세 내용은 바꾸지 않는다.
- 후기 모달은 화면 크기별 높이를 고정하고 내부만 스크롤한다. 분류·제목·작성자 상단은 후기 색상, 본문과 이전·다음 안내는 흰색이다. 바깥 스크롤바는 드래그, 화살표·PageUp/Down·Home/End 키로 조작한다. 휠·터치 스크롤도 유지한다.
- 프로젝트 상세는 파란 상단 선과 여백이 있는 카드로 구성한다. 본문은 프리텐다드와 단어 단위 줄바꿈을 유지한다. 명시적으로 `•`로 시작하는 일반 텍스트 목록만 번호 목록으로 표시하며, 원본 데이터·RichText는 변경하지 않는다.
- 프로젝트 목록 하단 기술 태그는 숨기고 상세 태그는 유지한다. All 대표 인터뷰 배지는 데이터와 관계없이 `선배들의 경험담`을 표시하며, All 프로젝트 배지는 목록과 같은 `subject` 반 이름을 사용한다.

## 확인한 범위

- `npm run build`, `npm test`(153개), `npm run check`, `git diff --check` 통과.
- `npm run export:spring -- --output /private/tmp/aica-stories-pr-export`로 별도 임시 폴더 내보내기 확인. 백엔드 저장소·운영 DB는 변경하지 않음.
- PC 및 360·390·430px에서 넘침·후기 비율·본문·배지를 확인. 바깥 스크롤바 드래그와 키보드, 모달 닫기·이전/다음 연결 확인.
- 후기 카드 미리보기 본문을 100배 늘린 임시 검증 화면에서도 정사각형 유지 확인.
- All 프로젝트 카드 3개가 동일 데이터로 렌더링된 상세 ID로 연결되는지 확인. 4194 미리보기에서 발생한 이동 문제는 All 실제 데이터와 정적 프로젝트 상세의 ID 불일치였다. 링크 구현은 이미 올바르며, 4195 통합 미리보기에서 확인했다.
- 캡처는 실제 데이터 HTML의 로컬 스냅샷에 현재 프론트 자산을 적용한 검토 화면이다. Spring 서버의 최신 템플릿 재배포·신규 DB 발행 후 검증은 백엔드 통합 환경에서 추가 확인해야 한다.

## 캡처

| 화면 | PC | 모바일 390px |
| --- | --- | --- |
| 후기 목록 | [캡처](screenshots/stories-readability-2026-10-21/review-cards-desktop.png) | [캡처](screenshots/stories-readability-2026-10-21/review-cards-mobile.png) |
| 후기 모달 | [캡처](screenshots/stories-readability-2026-10-21/review-modal-desktop.png) | [캡처](screenshots/stories-readability-2026-10-21/review-modal-mobile.png) |
| 프로젝트 상세 | [캡처](screenshots/stories-readability-2026-10-21/project-detail-desktop.png) | [캡처](screenshots/stories-readability-2026-10-21/project-detail-mobile.png) |

[All 프로젝트 반 이름 배지](screenshots/stories-readability-2026-10-21/all-project-badges-desktop.png)
