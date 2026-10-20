# Spring·백오피스 연동을 위한 분리 경계

## 프로젝트 기수·교과목 필터

Spring 프로젝트 공개본은 `story_json.cohort`(선택, 1~99)와 `story_json.subject`(선택, 최대 60자)를 사용합니다. 기존 `type`은 기업연계·실증·창업 등 프로젝트 유형으로 유지하며 교과목으로 해석하지 않습니다. 화면의 카드 `data-cohort`·`data-subject`를 서버가 escape하여 렌더링하고, 공통 `projects-filter.js`가 **발행된 카드에 실제 존재하는 값만** 옵션으로 만듭니다. 새 기수나 교과목을 코드의 고정 목록에 추가할 필요가 없습니다.

기수·교과목 교집합, 6개씩 페이지 이동, 모바일 아코디언, 상세 이전·다음 글은 같은 공개 카드 목록을 사용합니다. 값이 없는 기존 글도 전체 목록에 남고 카드에는 기존 유형을 표시합니다. Spring은 정적 시안의 7기 준비 중 안내를 사용하지 않습니다. 정적 공유본의 기존 옵션과 디자인은 유지합니다.

상세 정보의 과정도 같은 공개 `subject`를 사용하고 비어 있으면 기존 `type`으로 표시합니다. 기수가 있는 글은 확인된 `cohort`만 표시하며, 미분류 기존 글은 `duration`을 유지합니다. 정적 시안의 `cohortClass`는 Spring 저장·공개 계약에 포함하지 않습니다.

두 값도 기존 작업본/발행본 규칙을 따릅니다. 임시저장과 버전 복원은 공개 필터를 바꾸지 않으며 명시적 발행 때만 바뀝니다. 이 연결은 DB 컬럼·migration을 추가하거나 실제 DB를 갱신하지 않습니다. 새 개발 DB의 명시적 시드 가져오기에만 시안의 분류가 포함되고, 이미 가져온 DB를 시드로 덮어쓰지 않습니다.

관리자 입력 UI는 이번 범위에서 변경하지 않습니다. 백오피스 팀이 기존 `storyJson` 전송 값에 `cohort`와 `subject` 입력을 연결하면 됩니다. 기존 편집기의 JSON 왕복은 화면에 없는 값도 보존합니다. 저장 규격과 공개 조회가 두 필드를 지원하는 Spring 버전과 함께 내보내야 하며, 이전 Spring에 새 템플릿만 덮어쓰지 않습니다.

## 현재 책임

정적 미리보기에서 `content/`는 콘텐츠, `src/pages/`와 `src/components/`는 화면 구조, `src/presentation.json`은 현재 디자인을 재현하는 표시 정보입니다. `scripts/build.mjs`가 이 소스를 조합해 기존 경로에 정적 HTML을 생성합니다. 브라우저에서 콘텐츠를 fetch하는 단계가 없으므로 기존 렌더링 순서와 주소가 유지됩니다.

공통 영역은 `common/js/site-layout.js`가 그리며 `common/js/site.js`가 이벤트를 붙입니다. Spring이 헤더·드로어·푸터·LNB를 같은 구조로 미리 그려 보내면 비어 있는 영역만 생성하는 기존 가드를 활용할 수 있습니다. 그 경우에도 초기 전환 중에는 `menu.js`와 `site-layout.js`를 유지하면 현재 `Site.href()`·메뉴 모델 호출과 호환됩니다. 실제 서버 전환 때 불필요한 의존성을 제거합니다.

## 관리 대상 초안

후기는 아래 ‘구현된 후기 연결’에 따라 Spring DB가 운영 원본이다. 나머지는 현재 코드에서 추출한 관리 경계 후보이다.

| 데이터 원본 | 주요 내용 | 관리 도메인 후보 |
| --- | --- | --- |
| `content/site.json` | 메뉴, 외부 링크, 기관 연락처 | 사이트 설정 |
| `content/stories/reviews.json` | 제목, 요약, 작성자 표시명, 기수, 트랙, 태그, 본문 | 후기 |
| `content/stories/interviews.json` | 제목, 작성자, 사진, Q&A, 영상 정보 | 인터뷰 |
| `content/stories/projects.json` | 프로젝트명, 설명, 팀, 유형, 태그, 기간 | 프로젝트 |
| `content/stories/cohorts.json` | 기수, 날짜, 제목, 사진·영상, 요약 | 기수별 기록 |
| `content/life/facilities.json` | 층/공간 키, 이름, 안내, 사진 설명 | 시설 |
| `content/life/housing.json` | 지역, 밀집도, 형태, 주거비 정보 | 주거 정보 |
| `content/life/food.json` | 종류, 식사 인원 분류, 도보 시간, 사진, 메뉴, 후기 | 먹거리 |
| `content/life/leisure.json` | 장소, 거리, 요금, 설명 | 문화·여가 |
| `content/check/` | 모집 기준, 체크리스트, 프로세스, 혜택, FAQ | 모집 안내 |
| `content/about/gallery.json` | 활동 분류, 사진, 대체 텍스트, 설명 | 활동 사진 |
| `content/home/quotes.json` | 전광판 작성자·기수·한 줄 문구 | 홈 편집 |

고정된 소개 섹션, 일부 주거 지도 도형, 공간별 배치, SVG 일러스트는 템플릿에 남아 있습니다. 모든 텍스트를 관리 대상으로 삼거나 실제 관리자 기능을 추가한 상태는 아닙니다. 기존 프로젝트의 본문 자리 표시·미확정 연결처도 원본 그대로 보존했습니다.

## 두 가지 연동 경로

- 서버 렌더링을 선택하면 `src/components/`의 마크업을 Thymeleaf fragment로 옮기고 JSON 레코드 자리에 DTO를 전달합니다. 현재의 `{{...}}` 표기는 이 저장소의 빌드용 문법이므로 Thymeleaf에 그대로 복사해 실행할 수는 없습니다.
- REST API를 선택하면 데이터 로딩 계층이 DTO를 받아 같은 카드·상세 마크업을 생성하도록 연결합니다. 화면 이벤트를 초기화하기 전에 콘텐츠 렌더링이 완료되어야 합니다. 현재 빌드 스크립트는 API 클라이언트가 아닙니다.

후기는 서버 렌더링 경로를 구현했다. 나머지 관리 도메인은 이를 기준으로 단계적으로 넓힐 수 있다. CSS·인터랙션 파일은 현재 마크업 계약을 전제로 재사용할 수 있습니다.

## 유지해야 하는 계약

- 후기 `r-*`, 인터뷰 `iv-*`·`q-*`, 프로젝트 `pj-*`, 섹션 `p-*` ID와 해시 주소는 공개 링크입니다. DB PK를 추가할 때 기존 slug와 구분합니다.
- 후기의 `.cat-*`, `.coh*`, `.fld*`, `.tg*`, `.pg*`와 `#pgn1..5`는 현 CSS 필터·페이지네이션에 쓰입니다. 현재 표시 메타데이터를 그대로 유지했습니다. 콘텐츠 수·분류가 늘어날 때 서버 페이지네이션 또는 필터 구조를 별도로 바꿔야 합니다.
- 인터뷰 전체 목록은 `.iv` 카드 DOM에서 파생됩니다. 카드의 `.ph`, `h3`, `.tb p`, `.by`를 유지합니다.
- 시설의 floor/space 키, 사진·썸네일 순서, `aria-controls` 연결과 주거 탭·지도·패널의 `data-i`는 함께 유지합니다.
- 기존 사진은 CSS의 `.im-*`와 자르기 값에도 연결되어 있습니다. 파일 업로드를 붙일 때 이미지 URL·대체 텍스트·자르기 정보를 새 모델로 매핑합니다.

## 템플릿과 콘텐츠 출력

빌드 문법은 의도적으로 작습니다.

```html
<h3>{{title}}</h3>
{{#each stories.reviews}}{{> @view.card.template}}{{/each}}
{{{bodyHtml}}}
```

일반 값은 HTML escape 처리됩니다. `*RichText`는 문자열과 `{tag, attrs, children}`로 된 구조화 문서이며, 허용된 태그·속성만 렌더링합니다. `*Html` 문자열을 JSON에 직접 넣는 것은 금지하고 빌드가 거부합니다. 외부 API·에디터가 제공하는 HTML을 이 경계로 그대로 넘기지 말고 서버에서 검증한 구조화 콘텐츠로 변환해야 합니다.

사이트 설정도 빌드로 `menu.js`에 반영됩니다. `npm run check`는 소스와 생성물이 달라졌을 때 실패합니다. 배포 전에 `npm run build`, `npm test`, `npm run check`를 실행합니다.

## 구현된 후기 연결

후기부터 `posts` 공개본과 `post_drafts` 작업본을 분리했다. 정적 프론트 원본을 유지하고 `npm run export:spring -- --output /absolute/server/src/main/resources`로 Spring용 후기·이야기 한눈에 보기 템플릿과 opt-in 최초 가져오기 데이터를 생성한다. 반복 렌더링 위치만 DB 공개 DTO로 바꾸며, 기존 카드·리스트·상세 HTML과 CSS를 재사용한다.

Spring `connected` 프로필에서 공개 사이트와 관리자 화면을 같은 서버로 연다. 후기 공개 경로는 `/stories/reviews.html`, 공개 데이터 계약은 `/api/public/reviews`다. `4173`의 정적 프리뷰는 계속 디자인 확인용이다. DB 모드의 필터와 페이지 이동은 `stories/js/reviews-live.js`가 처리한다.

임시저장(`SAVE_DRAFT`)은 공개본을 바꾸지 않으며 관리자 이상의 명시적 발행(`PUBLISH`)만 공개한다. 후기 버전 복원도 작업본에 적용한다. 구현/실행/DB 마이그레이션 정책은 백오피스 저장소의 `백오피스/docs/review-publishing.md`에 기록했다. 그 외 콘텐츠는 이번 후기 연결 범위에 포함하지 않았다.

## 인터뷰·프로젝트·기수 기록 확장

후기의 `post_drafts`·명시적 발행 정책을 네 종류가 공통으로 사용한다. Spring `connected`에서는 `stories/interviews.html`, `projects.html`, `cohorts.html` 및 허브의 해당 영역도 DB 공개본을 읽는다. 실제 저장·발행·복원 경계는 `StoryDraftService`, 추가 공개 화면 DTO는 `StoryReadService`가 담당한다. 역할별로 DB를 나누지 않으며 서로 다른 관리자 계정의 작업본 공유도 검증한다.

내보내기에는 `scripts/spring-stories.mjs`가 추가되어 기존 카드·상세의 일러스트와 마크업 변형을 소스에서 생성한다. 질문·태그·본문 섹션과 이전/다음 링크는 공개 데이터로 채운다. 기수 필터와 빈 목록·영상·사진 처리를 동적 데이터에 맞췄다. 최초 전체 가져오기는 `BACKOFFICE_IMPORT_STORIES=true`로 명시하며 이후 끈다. 기존 후기 데이터는 Flyway V14의 `story_origins`로 보존된다.

현재 검증 DB는 로컬 H2 파일이다. 배포 시 프론트와 최상위관리자·서포터즈가 서버의 공용 DB를 함께 보도록 구성한다. 상세 운영 경계와 실행 방법은 백오피스 `백오피스/docs/story-publishing.md`를 참고한다.


## 공개 목록의 빈 상태와 조회 실패

네 목록 템플릿은 공통 상태 UI를 내보냅니다. 정상 빈 목록은 각 컬렉션 모델(`reviews`, `interviews`, `projects`, `cohorts`)의 0건으로 판단합니다. 조회 실패는 별도 모델 `publicContentUnavailable=true`를 `data-public-content-unavailable`로 전달하여 구분합니다. 플래그가 없거나 false이면 정상 동작을 유지합니다.

이 플래그는 공개 목록 컨트롤러의 DB 접근 실패 시 HTTP 503과 함께 제공하는 표시 계약입니다. 예외 원문이나 DB 접속 정보는 템플릿으로 전달하지 않습니다. 공유용 정적 페이지나 공개 seed를 운영 DB의 fallback으로 사용하지 않습니다. 출력 파일은 기존 9개로 유지하며, backend 컨트롤러의 실패 처리는 백엔드 담당이 별도로 관리합니다.
