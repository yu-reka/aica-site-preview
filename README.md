# 인공지능사관학교 사이트 미리보기

확정된 디자인을 유지하면서 콘텐츠·화면 템플릿·화면 동작을 분리한 정적 사이트입니다. 현재 URL과 CSS 클래스/ID를 유지합니다.

## 에이전트·팀원 협업

작업 전에 [AGENTS.md](AGENTS.md)를 읽어 주세요. 모바일은 현재 시안 검토 단계이며, 최신 `origin/main`에서 별도 브랜치를 만들어 작업하고 PR로 검토합니다. `main`은 외부 공유 페이지와 연결되어 있으므로 소유자의 승인 없이 직접 푸시하거나 병합하지 않습니다. HTML 원본 위치, Spring 연동 경계와 검증 방법도 해당 문서에 정리했습니다.

## 실행

Node.js 20 이상을 사용합니다. 외부 npm 패키지를 설치할 필요는 없습니다.

```sh
npm run build       # 콘텐츠와 템플릿 → 기존 경로의 HTML 및 메뉴 설정
npm test            # 데이터 공유, 렌더링, 출력 안전성 검사
npm run check       # 생성 결과가 소스와 일치하는지 확인
npm run preview     # Python 3 로컬 서버: http://127.0.0.1:4173
```

페이지 주소는 `home/index.html`, `about/index.html`, `stories/*.html`, `life/index.html`, `check/index.html` 그대로입니다. 생성한 결과물은 기존처럼 정적 서버에 올릴 수 있습니다.

## 수정할 위치

| 목적 | 원본 위치 |
| --- | --- |
| 메뉴·외부 연결·기관 연락처 | `content/site.json` |
| 후기·인터뷰·프로젝트·기수별 기록 | `content/stories/` |
| 시설·주거·먹거리·여가 | `content/life/` |
| 모집 기준·체크리스트·프로세스·혜택·FAQ | `content/check/` |
| 활동 사진·분류 | `content/about/` |
| 홈 전광판 문구 | `content/home/quotes.json` |
| 페이지 구성·고정 소개 문구 | `src/pages/` |
| 반복 카드·상세·공통 제목 줄 | `src/components/` |
| 기존 배치·색상·필터 클래스·템플릿 변형 | `src/presentation.json` |
| 시설 탭·주거 지도와 연결된 고정 슬롯 | `src/slots.json` |
| 공통 헤더·메뉴·푸터 마크업 | `common/js/site-layout.js` |
| 공통 메뉴 이벤트·상태·키보드 동작 | `common/js/site.js` |
| 페이지별 인터랙션 | 각 페이지의 `js/` |
| 디자인 | 기존 `common/css/`, 각 페이지의 `css/`, `assets/` |

모바일 헤더·햄버거·카테고리는 지원 전 체크 기준으로 공통 관리합니다. `common/css/navigation-mobile.css`를 각 페이지 CSS 뒤에 불러오며, 1080px 이하의 `.site-header`·`.drawer`에만 적용합니다. 페이지별 CSS에서 모바일 로고·메뉴 크기를 다시 지정하지 않고, 본문 폰트·색상은 본문 범위에서 관리합니다.

기존 `common/css/unify.css`의 페이지별 규칙은 `about/`, `check/`, `life/`, `stories/`의 `css/presentation.css`로 나눴습니다. 공통 팔레트·폰트·푸터 규칙만 `common/css/presentation.css`에 둡니다. 이야기·라이프 모바일 PR의 수정 위치와 CSS 적용 순서는 [CSS 관리 기준](docs/css-ownership.md)을 참고하세요.

이야기·라이프 공통 배너는 `common/css/masthead.css`가 관리합니다. 이야기 세부 페이지의 반복된 head 선언은 `src/components/stories/head-*.html`로 공유합니다. 라이프 모바일은 `life-m-view.js`가 데이터 읽기·마크업을, `life-m.js`가 상태·이벤트를 맡습니다. 후기 모바일 목록은 `stories-m-reviews.js`로 분리했습니다. 로딩 순서와 이전 Spring 템플릿 호환 방식은 [프론트 유지보수 구조](docs/frontend-structure.md)에 정리했습니다.

루트의 HTML과 `common/js/menu.js`는 **생성 결과물**입니다. 직접 수정하면 다음 빌드에서 덮어씁니다. 원본을 수정하고 `npm run build`를 실행하세요. CSS 분리는 기존 선언과 페이지 내 적용 순서를 보존하며, 이미지·폰트 파일은 변경하지 않았습니다.

## 데이터와 화면의 관계

후기는 한 레코드가 카드·목록·상세창을 생성합니다. 이야기 허브에서 재사용하는 후기·인터뷰·프로젝트 문구도 같은 레코드를 참조합니다. 허브용으로 문구가 달랐던 곳은 `hub*` 필드로 보존했습니다. 홈 전광판은 기존 실명 표기와 문구를 유지한 별도 편집 컬렉션입니다.

기수별 기록의 사진은 대표 이미지와 추가 `photos`를 합해 게시물당 최대 10장입니다. 같은 이미지 주소는 중복 계산하지 않습니다. 정적 콘텐츠가 제한을 넘으면 빌드가 중단되고, 공개 피드·상세·확대 보기에서는 최대 10장만 표시합니다. 실제 업로드 저장 제한은 백오피스에서도 별도로 적용해야 합니다.

`id`는 기존 상세 주소와 연결됩니다. `view`에 해당하는 배치 정보는 콘텐츠와 별도로 `src/presentation.json`에 있습니다. 기존 디자인의 개별 일러스트와 일부 위치별 변형을 보존하므로, **새 레코드를 추가할 때는 해당 레코드의 표시 템플릿·배치도 지정**해야 합니다. 텍스트 수정에는 화면 코드를 수정할 필요가 없습니다.

시설 공간 탭과 주거 지도는 현재 디자인의 고정 슬롯입니다. 정적 미리보기의 후기 페이지도 고정 슬롯을 유지하지만, Spring 연결 화면은 DB의 기수와 글 수에 따라 필터·페이지를 생성합니다. 운영 중인 후기는 백오피스에서 관리하며 `content/stories/reviews.json`은 최초 가져오기와 디자인 미리보기의 기준 데이터입니다.

후기용 Spring 연결은 별도 `AICA-BACKOFFICE/main-project` 저장소에 구현되어 있습니다. 임시저장과 공개본을 분리하고 발행할 때만 공개합니다. `npm run export:spring -- --output /absolute/server/src/main/resources`로 디자인을 내보내며, 실행과 경계는 [연동 안내](docs/spring-integration.md)를 참고하세요. 프론트 단독 `4173` 서버는 정적 미리보기이고, 연결된 후기는 Spring 서버의 `/stories/reviews.html`에서 확인합니다.

인터뷰·프로젝트·기수별 기록도 후기와 같은 Spring 공용 DB와 작업본·발행 정책으로 연결했습니다. `scripts/spring-stories.mjs`가 승인된 디자인 변형과 일러스트를 함께 내보냅니다. 공개 프론트와 관리자 계정들은 같은 DB를 사용하고 역할별 권한을 구분합니다. 최초 전체 시안 데이터 가져오기는 `BACKOFFICE_IMPORT_STORIES=true`로 명시합니다. 자세한 내용은 [연동 안내](docs/spring-integration.md)를 참고하세요.

## 검수 반영과 공통 UI

디자인 검수 반영 범위, PR #28 기준 보존 사항과 검증 결과는 [검수 통합 기록](docs/inspection-integration-2026-10-21.md)에 정리했습니다. 색상·타이포·선택 상태·클릭 영역·레이어·모션 규칙과 토큰 다운로드는 [디자인 시스템](docs/design-system/index.html)을 참고하세요.

## 404 안내 연결

`src/pages/404.html`을 빌드하면 루트 `404.html`이 생성됩니다. GitHub Pages는 존재하지 않는 주소에 이 문서를 404 응답으로 사용합니다. 깊은 경로에서도 스타일과 복귀 링크는 사이트 루트를 기준으로 해석하며 `/aica-site-preview/` 하위 경로와 루트 배포를 지원합니다.

`npm run preview`는 같은 문서를 사용하는 로컬 서버입니다. 사용 중인 서버를 종료하지 않고 `npm run preview -- --port 4191`처럼 다른 포트로 확인할 수 있습니다. 기존 `python3 -m http.server` 프로세스에는 이 변경이 자동 적용되지 않습니다.

500 오류 원본은 `src/pages/500.html`이며 Spring 내보내기에 `templates/error/500.html`로 포함됩니다. 오프라인 원본은 `src/pages/offline.html`입니다. 정상 페이지에는 연결 끊김 안내와 느린 페이지 이동의 로딩 표시가 연결되어 있습니다. 실제 Spring 500 응답 연결은 통합 환경에서 별도로 확인하며, 첫 방문 오프라인 캐시 지원은 포함하지 않습니다. 자세한 동작은 `docs/spring-integration.md`를 참고하세요.


## 2026-10-21 V30 공개 API 연결

최신 사용자 전환 지시에 따라 공개 화면은 사본 → 공개 API → 클라이언트 렌더러 순서로 내용을 표시합니다. 이전 Spring 내보내기 안내는 과거 호환성 참고이며, 통합 동기화는 `frontend/` subtree만 반영하고 Spring 생성물을 만들지 않습니다.

- `scripts/backoffice-site.mjs`는 Claude가 준비한 연결 빌드 단계입니다. `npm run build` / `npm run check`가 API 연결 줄을 보존합니다. `src/` 디자인 원본과 데이터 사본의 역할을 구분합니다.
- 공개 프리뷰의 `stories/js/stories-data.js`, `check/js/faq-data.js`는 아래 공개 샘플 규칙을 따릅니다. 비공개 통합본의 DB 사본 두 파일과 백오피스가 게시하는 `life/index.html` 목록은 보존하며 손으로 편집하지 않습니다.
- `common/js/public-content.js`는 API 스크립트보다 먼저 로드되어 실패를 기록하고, 허용된 HTML/SVG와 URL만 렌더링하도록 돕습니다. API 성공 빈 배열·실패 후 사본·실패 후 사본 없음은 서로 다른 상태입니다.
- 백엔드·관리자·DB·통합본 루트 scripts/·CI는 담당 Claude의 범위입니다. 실제 DB/기존 서버를 연결 테스트에 사용하지 않습니다.

## 공개 프리뷰 데이터 경계

GitHub 저장소와 Pages에 올라가는 이야기·FAQ 사본은 **합성 샘플**입니다. 실명, 실제 글 본문, DB 사본, 업로드 사진을 비공개 통합본에서 복사하지 않습니다. 샘플 작성자·제목에는 `샘플`을 표시하고 실제 경험·모집 조건으로 읽히지 않도록 안내합니다. 기존 승인된 `content/` 디자인 콘텐츠 전체를 합성 데이터라고 간주하는 규칙은 아닙니다.

```sh
npm run preview:data       # 공개 origin의 checkout에서만 샘플 사본 2개 생성
npm run check:public       # 공개 PR 병합·Pages 반영 전 필수: 빌드 일치 + 샘플 전체 바이트 일치
```

기본 `build`와 `check`는 사본을 만들거나 고치지 않습니다. 비공개 통합본의 실제 사본을 보존하기 위해 공개 전용 검사를 따로 실행합니다. 생성기는 DB나 기존 사본을 읽지 않고 고정된 예시만 사용합니다. 실제 API 응답이 있는 통합 환경에서는 기존 순서대로 응답이 사본을 대체합니다.

통합본에 화면 코드를 반영할 때는 `frontend/stories/js/stories-data.js`, `frontend/check/js/faq-data.js` 두 경로의 기존 바이트를 보존합니다. 두 파일은 의도적으로 달라지므로 전체 frontend tree 일치를 성공 조건으로 쓰지 않습니다. 이 두 경로를 제외한 코드 일치와 두 사본의 변경 없음, 통합 검증 결과를 각각 기록합니다. 다른 파일을 임의로 동기화 예외에 추가하지 않습니다. 백엔드·관리자·DB·통합본 루트 scripts/·CI는 변경하지 않습니다.

현재 파일을 교체해도 이미 공개된 Git 커밋 이력과 외부 복사본은 제거되지 않습니다. 이력 정리는 별도 승인과 협업 조율이 필요합니다.
