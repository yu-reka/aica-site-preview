# CSS 관리 기준

확정된 데스크톱 디자인과 현재 모바일 화면을 유지하면서 수정 범위를 구분합니다. 기존 `unify.css`의 선언은 페이지별로 분리되어 있습니다. 같은 선택자가 여러 번 나오는 구간은 적용 순서를 보존했으며, 선언 병합이나 디자인 재정의는 별도 변경으로 검토합니다.

## 수정 위치

| 범위 | 파일 | 담당 내용 |
| --- | --- | --- |
| 공통 기반 | `common/css/tokens.css`, `base.css` | 브랜드 변수·모든 `@font-face`(로컬 글꼴만, 외부 웹폰트 없음), 기본 요소 |
| 공통 구조 | `common/css/site.css`, `lnb.css` | 헤더·드로어·푸터, 데스크톱 좌측 메뉴 |
| 이야기·라이프 배너 | `common/css/masthead.css` | 마스트헤드 구조·페이지 변형·반응형 규칙 |
| 공통 표현 | `common/css/presentation.css` | 콘텐츠 페이지의 공통 팔레트·입력 폰트 상속·푸터 색상 |
| 모바일 메뉴 | `common/css/navigation-mobile.css` | 1080px 이하 헤더·햄버거·드로어의 공통 기준 |
| 알아보기 | `about/css/about.css`, `presentation.css`, `about-m.css` | 알아보기 본문과 600px 이하 모바일 화면 |
| 지원 전 체크 | `check/css/check.css`, `presentation.css`, `check-m.css` | 체크 본문과 600px 이하 모바일 화면 |
| 라이프 | `life/css/life.css`, `presentation.css`, `life-m.css` | 시설·주거·먹거리·여가·오시는 길 |
| 선배들의 이야기 | `stories/css/stories.css`, `stories-sections.css`, `presentation.css`, 세부 페이지 CSS | 허브·인터뷰·후기·프로젝트·기수별 기록 |
| 이야기 모바일 | `stories/css/stories-m.css` | 600px 이하 이야기 본문 |
| V30 이야기 렌더링 | `stories/css/stories-render.css`, `story-state.css` | API·사본으로 그린 목록·상세·상태 안내 |
| 과거 Spring 공개 화면 | `stories/css/*-live.css` | 이전 서버 렌더링 템플릿 호환 |

랜딩은 기존 `home/css/` 구조를 사용하며 콘텐츠 페이지의 `presentation.css`를 불러오지 않습니다. 페이지의 색·서체·여백을 바꾸기 위해 공통 토큰이나 헤더 스타일을 덮어쓰지 않습니다.

## 적용 순서

`src/pages/`와 공유 head 부분 템플릿의 스타일 링크 순서를 기준으로 합니다. V30 빌드가 추가하는 `stories-render.css`의 최종 위치는 생성 HTML에서도 확인합니다.

1. 공통 토큰·기본 요소·사이트 구조
2. 페이지 기본 CSS
3. `common/css/presentation.css`
4. 해당 페이지의 `css/presentation.css`
5. 좌측 메뉴·마스트헤드·세부 페이지 CSS 등 기존 후속 스타일
6. 페이지 모바일 CSS가 있으면 해당 파일
7. `common/css/components.css`
8. `common/css/navigation-mobile.css`

기존 후속 파일 사이의 순서도 유지합니다. 예를 들어 이야기 허브는 별도 `hub.css`를 사용하므로 다른 이야기 페이지와 링크 목록이 완전히 같지는 않습니다. 파일을 단순히 합치거나 순서를 바꾸면 같은 선택자의 최종 값이 달라질 수 있습니다.

CSS 링크를 추가하거나 바꿀 때는 `src/pages/`에서 수정하고 빌드합니다. 생성 HTML만 수정하지 않습니다. 배포 캐시 갱신이 필요하면 변경한 링크의 버전도 갱신합니다. 새 CSS의 `url()`은 **그 CSS 파일 위치**를 기준으로 하므로 이동 시 이미지·폰트 경로를 함께 확인합니다.

이전 Spring 이야기 템플릿이 참조하는 `common/css/unify.css`는 공통·이야기 `presentation.css`를 불러오는 호환 진입 파일로 남깁니다. 디자인 규칙을 복사하거나 이 파일에 새 규칙을 작성하지 않습니다. 새 정적 페이지와 새 내보내기 결과는 이 파일을 사용하지 않습니다. 모든 Spring 템플릿을 최신 내보내기 결과로 교체했는지 확인하기 전에는 호환 경로를 삭제하지 않습니다.

이야기와 라이프가 함께 사용하던 `stories/css/mast.css`의 선언은 순서 그대로 `common/css/masthead.css`로 이동했습니다. 두 페이지의 배너 변형도 이 컴포넌트 안에서 기존 선택자로 관리합니다. 페이지 본문·폰트 규칙을 추가하는 파일은 아닙니다. 이전 `stories/css/mast.css` URL은 새 파일을 import하는 호환 경로로 유지합니다. 신규 페이지에서는 새 공통 파일만 직접 불러오고 두 파일을 중복해서 연결하지 않습니다.

## 다음 이야기·라이프 모바일 PR

- 최신 `origin/main`에서 시작합니다. `unify.css`에 페이지 규칙을 다시 모으거나 이전 파일을 통째로 복사하지 않습니다.
- 이야기 본문 모바일 변경은 `stories/css/stories-m.css`에 둡니다. `.stories-page` 또는 `.stories-hub` 아래로 범위를 제한하고 `@media (max-width:600px)` 안에서 작성합니다.
- 라이프는 기존 두 파일의 미디어 규칙을 확인합니다. 별도 모바일 파일이 필요하면 `life/css/life-m.css`로 만들고 원본 페이지에서 `navigation-mobile.css` 직전에 불러옵니다. `.life-page` 아래로 범위를 제한합니다.
- 모바일 본문에서 전역 `body`, `h1`, `button`, `:root` 또는 공통 `.wrap`의 색상·폰트를 바꾸지 않습니다. 공통 헤더·드로어 크기는 `navigation-mobile.css` 한곳에서 관리합니다.
- 이야기의 `r-*`, `iv-*`, `q-*`, `pj-*`와 `data-*`, 라이프의 시설·지도 탭 ID 및 연결을 유지합니다. JS 동작을 바꾸면 모바일 전용 동작과 데스크톱 동작의 조건을 구분합니다.
- `scripts/export-spring.mjs`, `scripts/spring-stories.mjs`, `*-live.js/css` 및 작업본·발행본 정책을 유지합니다. 정적 미리보기 데이터는 운영 DB가 아닙니다.
- PR에 수정 파일·적용 폭·360/390/430px 캡처·1280/1440px 데스크톱 비교·관련 메뉴/탭/필터/상세 동작·Spring 검증 범위를 기록합니다. 기존부터 있던 현상과 이번 변경으로 생긴 문제를 구분합니다.

## 검증

`npm run build`, `npm test`, `npm run check`를 실행합니다. 스타일 테스트는 원본·생성물의 CSS 링크, 적용 순서, 이동한 자산 경로와 Spring 내보내기 링크를 확인합니다. 실제 디자인·선택자 우선순위·상호작용은 브라우저 비교가 필요합니다.

내부 링크·폰트·이미지는 `/aica-site-preview/` 하위 경로에서도 확인합니다. 현재 V30 통합은 `frontend/`만 동기화하며 Spring 생성물을 내보내지 않습니다. 과거 exporter를 확인해야 할 때만 임시 경로를 사용하고 실제 서버·DB에는 쓰지 않습니다.

## 공통 선택 컨트롤과 레일

`common/css/components.css`는 600px 이하 세그먼트·밑줄 필터·44px 클릭 영역·포커스 표시를 관리합니다. 각 페이지의 콘텐츠·여백·선택 이벤트와 시각적 변형은 페이지에서 유지합니다. 이 파일은 페이지별 모바일 CSS 뒤, `navigation-mobile.css` 앞에 로드합니다. `common/js/ui.js`가 동적 필터에도 공통 클래스를 붙입니다.
