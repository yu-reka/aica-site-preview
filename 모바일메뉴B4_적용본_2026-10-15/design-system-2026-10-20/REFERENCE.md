# 기존 AI-Log 디자인 시스템 참고 내역

참고 링크: [AI-Log (Copy)](https://claude.ai/artifact/Mz9hcLLMBceuHHCPh4pGht)

2026-10-20에 인앱 브라우저에서 정상 접근해 Overview 본문, 컴포넌트 목록, 색상 목록을 확인했습니다. 문서가 밝힌 기준 커밋은 `codex/preview-combined / 5e82d5c`입니다. 이번 가이드는 현재 작업 사이트 `b9fc090`을 기준으로 합니다.

## 반영한 내용

- 현재 구현을 설명할 때 기존 컴포넌트 이름을 함께 제시하고, 실제 원본·선택자를 연결했습니다.
- 글쓰기와 장식의 절제 원칙을 편집 참고 지침으로 요약했습니다. 실제 기관 정보나 선배 글은 바꾸지 않았습니다.
- 기존 로고의 밝은/어두운 배경별 용도, 심볼 크기, SVG 아이콘의 선 굵기를 현재 코드와 대조해 추가했습니다.
- 레이어 순서와 버튼·제목 띠·메뉴의 전환 시간을 현재 CSS에서 확인해 문서화했습니다. 새로운 z-index/motion 토큰은 만들지 않았습니다.
- body의 기본 Paper 값과 페이지별 Surface 콘텐츠 면을 구분하도록 설명을 보완했습니다.
- 주황 포커스 예외, 미연결 링크와 빈 결과의 현재 문구를 보존하도록 기록했습니다.

## 직접 대조한 원본

| 대상 | 현재 원본 |
| --- | --- |
| 헤더/푸터/메뉴/아이콘 | `common/js/site-layout.js`, `common/css/site.css` |
| 바탕 기본값 | `common/css/base.css`, 페이지별 CSS |
| 배너/고정 제목 | `common/css/masthead.css` |
| 모바일 고정 탭 | `stories/css/stories-m.css`, `check/css/check-m.css` |
| 후기 모달 레이어 | `stories/css/stories.css` |
| 주황 초점선 | `about/css/about.css`, `check/css/check-m.css` |
| 인터뷰/후기/프로젝트 카드 | `src/components/stories/`, `src/presentation.json` |
| FAQ | `src/components/check/faq/` |
| 기수별 기록 | `src/pages/stories/cohorts.html` |
| 실제 메뉴 경로 | `content/site.json` |
| 미연결 링크/빈 결과 | `common/js/site.js`, `stories/js/reviews-live.js`, `life/js/life-m-view.js` |

## 그대로 가져오지 않은 부분

기존 문서의 컴포넌트 런타임 `window.AILog`, `bundle.css`, `.ds-*`는 아티팩트 예시를 위한 구현입니다. 현재 사이트의 API나 CSS 선택자로 취급하지 않습니다. 새 가이드의 `ds-*` 문서 UI 클래스 역시 사이트에 설치되는 컴포넌트가 아닙니다.

문서 토큰 `m-*`와 기존 분류 경로 `/real-life`도 현재 코드의 변수나 URL로 이식하지 않았습니다. 현재 토큰·상대 경로·ID·해시를 유지합니다. 드로어 문의 버튼 글자는 현재 검정이며 헤더의 파랑과 구분합니다.

기존 문서에 모바일 확정으로 적힌 부분은 현재 AGENTS.md의 시안 검토·소유자 승인 경계를 대체하지 않습니다. 기존 상태 화면 중 제안으로 표시된 내용은 현재 배포 기능으로 설명하지 않았습니다.

전체 파일 243개를 내려받거나 모든 컴포넌트의 세부 코드·상태를 전수 검증하지 않았습니다. 실제 사이트를 수정하거나 기존 Claude 아티팩트를 편집하지 않았습니다.
