# 프론트 유지보수 구조

확정된 디자인과 URL을 유지하며, 반복 선언·화면 생성·화면 제어의 수정 위치를 구분합니다. 프레임워크와 외부 npm 의존성을 추가하지 않습니다.

## 원본과 생성물

`content/`는 콘텐츠, `src/pages/`는 페이지 구성, `src/components/`는 재사용 마크업입니다. 공개 경로의 HTML은 `npm run build`로 생성합니다. 원본과 생성물을 함께 변경하며 생성 HTML만 직접 수정하지 않습니다.

인터뷰·후기·프로젝트·기수별 기록 페이지는 `src/components/stories/head-base.html`, `head-presentation.html`, `head-scripts.html`을 공유합니다. 페이지 전용 CSS·JS의 기존 로딩 위치를 사이에 유지합니다. 별도 구성을 쓰는 이야기 허브까지 같은 head 순서로 강제하지 않습니다.

## CSS 경계

- 공통 헤더·드로어·모바일 메뉴: `common/css/site.css`, `navigation-mobile.css`
- 공통 표현: `common/css/presentation.css`
- 이야기·라이프 배너: `common/css/masthead.css`
- 본문·페이지 변형·모바일 화면: 각 페이지 `css/`의 해당 파일

공통 배너로 옮긴 선언의 값과 적용 순서는 유지합니다. `common/css/unify.css`와 `stories/css/mast.css`는 이전 Spring 템플릿용 호환 진입점입니다. 새 규칙을 복제하지 않습니다. 상세한 순서는 [CSS 관리 기준](css-ownership.md)을 따릅니다.

## 라이프 모바일

| 파일 | 책임 |
| --- | --- |
| `life/js/life.js` | 기존 데스크톱 화면·라우팅 |
| `life/js/life-m-view.js` | 원본 DOM에서 콘텐츠 읽기, 지도 복제 정리, 화면·카드 마크업 생성 |
| `life/js/life-m.js` | 모바일 상태, 해시 전환, 이벤트, 필터·페이지·갤러리·지도 선택 |

컨트롤러의 `state` 한곳에서 선택된 층·공간·주거·예산·먹거리·여가·출발지를 관리합니다. `LifeMobileView.create(source, state)`는 같은 상태를 읽어 렌더러를 제공하며 상태를 변경하지 않습니다. 렌더링 후 이벤트를 연결하고 이전 화면의 ResizeObserver를 해제합니다.

화면 템플릿의 문자열 내부 공백도 결과 HTML의 일부입니다. 코드 정리만을 위해 템플릿 안에 줄바꿈을 추가하지 않습니다. 기존 ID·`data-*`·해시와 지도 복제 시 ID/ARIA 정리, HTML escape를 보존합니다.

원본 페이지의 defer 순서는 공통 스크립트 → `life.js` → `life-m-view.js` → `life-m.js`입니다. 모바일 진입점보다 뷰 팩토리가 먼저 실행되어야 합니다.

## 후기 모바일

`stories/js/stories-m-reviews.js`의 `StoriesMobileReviews.init()`이 후기 카테고리·기수·태그·10개 단위 페이지를 담당합니다. 정규 `#r-*` 링크를 생성하며 기존 상세창과 공통 포커스 제어를 재사용합니다.

`stories-m.js`는 이야기 공통 진입점과 나머지 모바일 화면을 담당합니다. 신규 후기 페이지는 후기 팩토리 → 공통 진입점 순서로 defer 로드합니다. 팩토리 자체에서는 자동 초기화하지 않으며 중복 생성 방지 조건을 유지합니다.

이전 Spring 템플릿은 공통 진입점만 참조할 수 있습니다. 이때 공통 진입점이 후기 페이지인지 확인하고 자기 스크립트 URL을 기준으로 후기 팩토리를 한 번 로드합니다. 다른 이야기 페이지에는 후기 전용 파일을 추가로 요청하지 않습니다.

## Spring 반영

`npm run export:spring -- --output /absolute/temporary/resources`로 템플릿·초기 데이터만 내보냅니다. 정적 자산은 프론트 루트에서도 함께 서빙하거나 기존 배포 절차로 동기화해야 합니다. 신규 `common/css/masthead.css`, `life/js/life-m-view.js`, `stories/js/stories-m-reviews.js`를 빠뜨리지 않습니다.

공개 화면은 Spring이 읽는 발행본을 사용합니다. 이 정리는 작업본·발행본 정책, 권한, DB 구조, `*-live.js/css` 또는 내보내기 계약을 변경하지 않습니다. 정적 `content/stories/`를 운영 DB로 취급하지 않습니다. [Spring 연동 안내](spring-integration.md)를 함께 확인합니다.

## 주소와 대화상자

페이지 스크립트에서 해시를 디코딩할 때는 먼저 로드된 `Site.decodeHash()`를 사용합니다. 잘린 퍼센트 인코딩은 빈 값으로 처리해 기본 화면과 나머지 이벤트 초기화를 유지합니다. 공통 스크립트보다 먼저 실행되는 이야기 허브의 `old-hash.js`만 같은 예외를 자체 처리합니다. 공통 함수에 의존하는 소비자를 갱신할 때는 공통 스크립트 URL 버전도 확인합니다.

기수 기록의 상세창·사진 확대창은 `cohort-v3.js`가 관리합니다. 활성 창에서 body까지 이어지는 경로의 형제 요소를 `inert`로 격리하고, 창 전환·닫기 때 각 요소의 기존 상태를 복원합니다. Tab·Shift+Tab은 가장 위의 창 안에서 순환하며, 이전·다음 이동으로 포커스된 버튼이 비활성화되는 경우도 처리합니다. 확대창을 닫으면 상세창으로, 상세창을 닫으면 연 카드로 초점을 돌려줍니다.

## 변경 후 검증

`npm run build`, `npm test`, `npm run check`를 실행합니다. 테스트는 필터·페이지·정규 앵커, 뷰의 escape·지도 복제, 호환 로더, CSS·Spring 링크와 생성물 일치를 검사합니다.

브라우저에서는 360·390·430px와 1280·1440px에서 변경 화면을 비교하고 관련 메뉴·탭·필터·상세·사진·지도 조작을 확인합니다. `/aica-site-preview/` 하위 경로도 확인합니다. 전환 중인 메뉴 색상·스크롤 위치는 동일한 상태에서 비교하며, 로컬 화면 확인을 실제 운영 DB 검증으로 보고하지 않습니다.


## 이야기 목록 상태

`stories/js/story-state.js`와 `stories/css/story-state.css`가 후기·인터뷰·프로젝트·기수 기록의 상태 안내를 함께 관리합니다. 기존 정상 목록과 특정 기수의 준비 중 시안은 유지합니다.

- 게시물 전체가 없을 때는 목록 제목 아래에 공통 빈 상태와 이야기 전체 보기 링크를 표시합니다. 빈 목록에서 필터와 페이지 조작은 숨기며 후기의 숨은 라디오도 비활성화합니다.
- 필터 결과가 없을 때는 필터 초기화 버튼으로 실제 조건과 첫 페이지를 복원합니다. 후기의 정적 CSS 라디오·모바일 상태·Spring 필터는 `StoryState.resetReviews()`의 실제 `change` 및 `reviews:reset` 이벤트로 함께 초기화합니다.
- 서버가 `publicContentUnavailable=true`를 제공하면 빈 게시물 안내 대신 조회 실패와 다시 시도 버튼을 표시합니다. 다시 시도는 현재 URL을 새로 요청하며, 정상 응답으로 복구되면 기존 목록을 표시합니다.

공유용 정적 시안은 DB를 조회하지 않으므로 서버 장애를 스스로 판별하지 않습니다. 운영 Spring 컨트롤러가 실패 모델과 HTTP 503을 제공해야 하며, 오류를 빈 배열의 정상 응답으로 바꾸거나 정적 시안 데이터로 대체하지 않습니다. 실제 DB 데이터·임시저장·발행 규칙에는 영향을 주지 않습니다.

## 공유 상호작용 계약

`common/js/ui.js`의 `SiteUI`가 모달 초점 순환과 기존 inert 상태 복원, 유한 레일의 시작·끝 상태 및 키보드 보조 동작을 공유합니다. ui.js는 site.js·cohort-v3.js·stories.js·stories-m.js·life-m.js·about-m.js보다 먼저 로드해야 합니다. 기수 필터는 group/aria-pressed를 사용하고, 빈 결과 초기화에서도 같은 선택자를 사용합니다.

후기 detail-2/detail-3은 공통 detail 템플릿을 호출하며 태그는 반복 부분 템플릿으로 생성합니다. Spring 내보내기는 공개 태그 반복과 HTML escape를 유지합니다. 새로운 공유 파일이 필요하므로 Spring 반영 시 모든 템플릿과 정적 UI 자산을 함께 배포해야 합니다.
