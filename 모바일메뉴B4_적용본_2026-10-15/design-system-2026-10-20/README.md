# AICA 디자인 시스템 · 현재 사이트 기준

2026-10-20 / 소스 기준 `b9fc090e03152577dbed1bbe84e7c22bc0297441`

## 열기

`index.html`이 시각적 디자인 시스템입니다. 인터넷 연결 없이 로컬 폰트와 함께 열립니다. 색상 복사는 localhost 또는 HTTPS에서 사용할 수 있으며, 브라우저가 차단하면 복사할 값을 안내합니다.

상위 실제 저장소 `/Users/cherry/aica-site-preview`에서 `npm run preview`를 실행하고 아래 경로를 엽니다.

`http://127.0.0.1:4173/모바일메뉴B4_적용본_2026-10-15/design-system-2026-10-20/index.html`

실제 사이트 iframe은 가이드에서 두 단계 위의 현재 사이트를 참조합니다. 이 디렉터리만 단독으로 전달하면 문서 본문은 독립적으로 동작하지만 실제 사이트 iframe은 연결되지 않습니다. `downloads/tokens.css`는 `../assets/fonts`를 참조하므로 CSS만 단독으로 옮기지 말고 폰트와 라이선스를 함께 유지합니다.

## 포함한 내용

- 브랜드 공통/지역 색상과 역할, HEX 복사, 계산한 색 대비
- Giants · Paperlogy · Pretendard 실제 로컬 폰트, 굵기 파일 매핑, 문구/크기 미리보기
- 공통 컨테이너, 세로 리듬, 모서리와 스티커형 그림자
- 원본 `.btn` CSS로 렌더링한 버튼, 문의 버튼과 포커스 예시, 실제 사이트 반응형 iframe
- 홈·이야기·라이프·알아보기·체크의 패턴/예외 및 주요 분기점
- 접근성 유지 지침과 원본 수정 위치, 생성물 및 Spring 공개본 연동 경계
- `downloads/tokens.json`: 공통 토큰 36개, 추가 적용값과 출처, 소스 커밋 및 SHA-256
- `downloads/tokens.css`: 원본 공통 토큰의 로컬 참조용 사본
- `source/css`: 컴포넌트 표시 및 출처 검토용 공통 CSS 스냅샷
- `source-manifest.json`: 원본 파일의 SHA-256. 사본에서는 로컬 자산 경로만 변경

## 기준과 예외

기준은 상위 저장소의 **추적 중인 최신 작업 사이트**입니다. 작업 폴더의 `사이트/`는 이전 복사본이므로 기준으로 사용하지 않았습니다. 원격 fetch 후 기존 브랜치 상태를 보존해 `codex/site-design-system`을 만들었습니다. main 기준으로 재설정하거나 기존 미추적 파일을 변경하지 않았습니다.

가이드의 레이아웃, 설명용 예시 문구, 간략화한 패턴은 문서 전용입니다. 사이트 원본·생성 HTML·메뉴·콘텐츠·API·공개 DB·Spring 내보내기·배포는 수정하지 않았습니다. 공통 의미색이 없는 상태색, 고정 8px 간격 척도, 새로운 서체 크기 토큰을 임의로 도입하지 않았습니다.

`tokens.css`의 오래된 상단 주석보다 실제 최종 선언을 기준으로 합니다. 예를 들어 현재 공통 헤더는 `#2457F5`, CTA 바탕은 흰색입니다. 헤더 문의 버튼은 파란 글자, 드로어 문의 버튼은 검정 글자입니다. 노랑은 장식·카카오 용도이며 모든 CTA의 공통 바탕이 아닙니다. 실제 지역 예외와 스타일 적용 순서는 유지합니다.

## 소스 위치

| 범위 | 기준 원본 |
| --- | --- |
| 토큰/서체/기본 크기 | `common/css/tokens.css`, `base.css`, `presentation.css` |
| 버튼/헤더/모바일 메뉴 | `common/css/site.css`, `navigation-mobile.css` |
| 좌측/가로 메뉴 | `common/css/lnb.css` 및 각 페이지 모바일 CSS |
| 이야기/라이프 배너 | `common/css/masthead.css` |
| 홈의 차콜/네온 지역색 | `home/css/home.css` |
| 메뉴 구조와 동작 | `common/js/site-layout.js`, `site.js`, `content/site.json` |
| 유지보수 경계 | `README.md`, `docs/css-ownership.md`, `docs/frontend-structure.md`, `AGENTS.md` |

현재 화면의 구현을 기록한 디자인 시스템이며 사이트 전체 접근성 적합성을 인증하지 않습니다. `--blue-bright` 등 기존 호환 별칭과 페이지에서 정의하는 추가 변수도 원본대로 보존했습니다. 앞으로 토큰이 바뀌면 사본과 manifest를 함께 갱신해야 합니다. 이 파일들을 원본 CSS 위에 추가로 덮어씌우지 않습니다.

검증 범위와 화면 캡처는 `VERIFICATION.md`를 참조하세요.
