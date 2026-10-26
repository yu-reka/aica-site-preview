# 인공지능사관학교 사이트 미리보기

확정된 디자인을 유지하면서 콘텐츠·화면 템플릿·화면 동작을 분리한 정적 사이트입니다. 현재 URL과 CSS 클래스/ID를 유지합니다.

## 개발 원본과 공개 반영

프론트 디자인·동작의 개발 원본은 비공개 `yu-reka/aica-site`의 `frontend/`입니다. 통합 PR에서 검토·검증·CI를 마친 공통 변경을 이 저장소의 공개용 PR로 반영합니다. 팀 공통 작업 안내는 통합본 README에서 관리하며, 이 README는 외부 공유본의 실행·빌드·더미 데이터 안내입니다.

공개 전용 더미·문서·공유 설정은 이 저장소에서 관리합니다. 공통 화면 코드를 공개 쪽에서 먼저 수정해야 하면 통합 담당과 출처·충돌·통합 반영 계획을 맞춥니다. 공개/비공개를 서로 통째 덮어쓰는 양방향 자동 동기화는 하지 않습니다.

공개도 기존 PR 검토·필요 검증·관련 CI가 끝나면 쓰기 권한이 있는 팀원이 소유자 부재 중 병합할 수 있습니다. draft·충돌·변경 요청·미해결 결함·필수 미검증·실패/대기 CI는 보류하고, 검증한 정확한 head를 병합합니다. `main` 병합은 GitHub Pages 외부 공유 화면에 반영됩니다.

## 실행

Node.js 20 이상을 사용합니다. 외부 npm 패키지를 설치할 필요는 없습니다.

```sh
npm run build       # 콘텐츠와 템플릿 → 기존 경로의 HTML 및 메뉴 설정
npm test            # 데이터 공유, 렌더링, 출력 안전성 검사
npm run check       # 생성 결과가 소스와 일치하는지 확인
npm run check:public # 공개 배포 전: 생성물 + 합성 샘플 사본 검사
npm run preview     # Python 3 로컬 서버: http://127.0.0.1:4173
```

페이지 주소는 `home/index.html`, `about/index.html`, `stories/*.html`, `life/index.html`, `check/index.html` 그대로입니다. 생성한 결과물은 기존처럼 정적 서버에 올릴 수 있습니다.

## 현재 데이터 흐름

V30 공개 화면은 정적 HTML 틀에 JavaScript가 공개 API 응답을 그립니다. 이야기·FAQ는 사본을 먼저 읽고, API가 성공하면 그 응답으로 대체합니다. GitHub Pages는 합성 샘플로 디자인을 확인하며 실제 DB에 연결하지 않습니다.

- 이야기: `stories-data.js` → `../api/public/stories.js` → `stories-render.js` → 화면 동작·`story-state.js`
- FAQ: `faq-data.js` → `../api/public/faq.js` → `faq-render.js` → `check.js`
- `common/js/public-content.js`는 API보다 먼저 로드되어 URL·HTML·SVG 출력과 이야기 API 실패 신호를 관리합니다. 홈 전광판은 `home/js/ticker-render.js`가 관리합니다.
- `scripts/backoffice-site.mjs`가 빌드 결과에 연결 줄을 넣습니다. 생성 HTML에서 스크립트 순서를 직접 고치지 않습니다.

실제 글·FAQ·라이프 내용은 백오피스 담당이 관리합니다. 프론트는 구조·스타일·상호작용을 맡고, API·마크업 계약 변경은 백엔드와 먼저 조율합니다. 현재 동기화 범위는 `frontend/`뿐이며 Spring 생성물을 만들지 않습니다. 백엔드·관리자·실제 DB·통합본 루트 scripts/·CI는 이 저장소 작업 범위가 아닙니다.

기존 HTML escape·구조화 RichText·HTML/SVG·허용 URL 검증을 유지합니다. 사용자/API 값을 검증 없이 HTML에 삽입하거나 토큰·비밀번호·실제 DB·개인 설정을 커밋하지 않습니다.

## 수정할 위치

| 목적 | 원본 위치 |
| --- | --- |
| 메뉴·외부 연결·기관 연락처 | `content/site.json` |
| 이야기 디자인 원본(실제 DB 글 편집용 아님) | `content/stories/` |
| 시설·주거·먹거리·여가 기본 시안 | `content/life/` |
| 모집 기준·프로세스·혜택·FAQ 기본 시안 | `content/check/` |
| 활동 사진·분류 | `content/about/` |
| 홈 전광판 기본 시안 | `content/home/quotes.json` |
| 공개 이야기·FAQ 샘플 생성 규칙 | `scripts/preview-data.mjs` |
| 공개 API 데이터 표시 | `stories/js/stories-render.js`, `check/js/faq-render.js`, `home/js/ticker-render.js` |
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

## 디자인 원본과 실행 데이터

`content/`와 `src/`는 기존 디자인을 생성하는 원본입니다. 이야기의 `view` 배치 정보는 `src/presentation.json`에 있고 시설 탭·주거 지도는 고정 슬롯을 사용합니다. 디자인 레코드를 추가할 때는 연결된 표시 템플릿·배치도 확인합니다.

빌드한 이야기 목록과 상세는 런타임 렌더러가 사본 또는 API 데이터로 채웁니다. 따라서 `content/stories/`를 수정하는 것은 실제 DB 글을 수정하는 방법이 아닙니다. FAQ와 라이프의 백오피스 관리 내용도 같은 경계를 따릅니다. 백오피스는 저장소가 아닌 별도 실행 사이트 사본을 갱신하므로, 실행 폴더의 목록을 프론트 원본으로 역복사하지 않습니다.

기수별 기록의 사진은 대표 이미지와 추가 `photos`를 합해 게시물당 최대 10장입니다. 같은 이미지 주소는 중복 계산하지 않습니다. 정적 콘텐츠가 제한을 넘으면 빌드가 중단되며, 실제 업로드·저장 제한은 백오피스 담당 범위입니다.

`id`·해시·선택자·`data-*`는 화면과 백엔드가 공유하는 계약입니다. 로딩 순서, 상태 안내, 주소 호환과 담당 파일은 [프론트 유지보수 구조](docs/frontend-structure.md)를 참고하세요. 이전 서버 렌더링과 `export:spring`은 [과거 연동 안내](docs/spring-integration.md)에 보존하며 현재 V30 배포 절차로 사용하지 않습니다.

## 검수 반영과 공통 UI

디자인 검수 반영 범위, PR #28 기준 보존 사항과 검증 결과는 [검수 통합 기록](docs/inspection-integration-2026-10-21.md)에 정리했습니다. 색상·타이포·선택 상태·클릭 영역·레이어·모션 규칙과 토큰 다운로드는 [디자인 시스템](docs/design-system/index.html)을 참고하세요.

## 404 안내 연결

`src/pages/404.html`을 빌드하면 루트 `404.html`이 생성됩니다. GitHub Pages는 존재하지 않는 주소에 이 문서를 404 응답으로 사용합니다. 깊은 경로에서도 스타일과 복귀 링크는 사이트 루트를 기준으로 해석하며 `/aica-site-preview/` 하위 경로와 루트 배포를 지원합니다.

`npm run preview`는 같은 문서를 사용하는 로컬 서버입니다. 사용 중인 서버를 종료하지 않고 `npm run preview -- --port 4191`처럼 다른 포트로 확인할 수 있습니다. 기존 `python3 -m http.server` 프로세스에는 이 변경이 자동 적용되지 않습니다.

500·오프라인 원본은 `src/pages/500.html`, `src/pages/offline.html`이며 루트의 정적 문서로 빌드합니다. 정상 페이지에는 연결 끊김 안내와 느린 페이지 이동의 로딩 표시가 연결되어 있습니다. 실제 서버의 HTTP 500 응답 연결은 백엔드 담당 범위입니다. 첫 방문 오프라인 캐시 지원은 포함하지 않습니다.


## 공개 프리뷰 데이터 경계

GitHub 저장소와 Pages에 올라가는 이야기·FAQ 사본은 **합성 샘플**입니다. 실명, 실제 글 본문, DB 사본, 업로드 사진을 비공개 통합본에서 복사하지 않습니다. 현재 공개 데이터는 사본을 넣기 전의 승인된 `content/stories/`·`content/check/faq.json` 디자인 더미를 API 형식으로 변환합니다. 제목·질문·전광판 문구에 `[시안]`을 표시하고, 작성자는 `김○○`처럼 가립니다. 기존 시안 문구·사진·일러스트를 재사용하며 실제 DB 글을 가져오지 않습니다. 기존 승인된 `content/` 디자인 콘텐츠 전체를 합성 데이터라고 간주하는 규칙은 아닙니다.

```sh
npm run preview:data       # 공개 origin의 checkout에서만 샘플 사본 2개 생성
npm run check:public       # 공개 PR 병합·Pages 반영 전 필수: 빌드 일치 + 샘플 전체 바이트 일치
```

기본 `build`와 `check`는 사본을 만들거나 고치지 않습니다. 비공개 통합본의 실제 사본을 보존하기 위해 공개 전용 검사를 따로 실행합니다. 생성기는 DB나 기존 사본을 읽지 않습니다. `scripts/preview-design-data.mjs`가 공개 `content/`·카드 컴포넌트만 읽어 후기 56개·인터뷰 7개·프로젝트 6개·기수 기록 17개·FAQ 21개의 디자인 더미를 만듭니다. 공개 더미 ID는 900001 이상 번호를 유지하며, API 성공 시의 응답 우선 순위와 비공개 사본 보존 규칙은 그대로입니다. 실제 API 응답이 있는 통합 환경에서는 기존 순서대로 응답이 사본을 대체합니다. 프로젝트 썸네일은 공개 일러스트 5종을 순환하며, 강조 문구도 기존 공개 디자인 제목에서만 가져옵니다. 비공개 DB에서 고른 썸네일이나 실제 업로드를 복사하지 않습니다.

통합 main에서 공개로 반영할 때 실제 이야기·FAQ 사본 두 파일은 복사하지 않습니다. 공개 전용 생성기·더미 검사·package 명령·안내를 유지하고, 공통 원본·스크립트·테스트는 필요한 변경만 맞춥니다. `content/`·자산·문서도 공개 가능성을 검토하고 공개 checkout에서 HTML과 더미를 생성합니다. 실제 실행 폴더의 라이프 목록·업로드·백엔드·DB·인증정보·비공개 Git 이력은 가져오지 않습니다. 전체 frontend tree 동일성을 요구하지 않고 공통 변경 경로·의도적 차이·출처/반영 SHA·검증을 기록합니다.

공개 원본을 만들기 위해 비공개 저장소 전체/전체 `frontend/`를 복사하거나 private branch·subtree 이력을 공개로 push하지 않습니다. 공개 main 위에 공개 가능한 파일만 새 커밋으로 반영하고, `npm run check:public`·기존 PR/CI·Pages와 실제 링크/자산 확인을 거칩니다. 이 README 변경이 상시 자동 감시나 동기화 서비스를 설정하는 것은 아닙니다.

현재 파일을 교체해도 이미 공개된 Git 커밋 이력과 외부 복사본은 제거되지 않습니다. 이력 정리는 별도 승인과 협업 조율이 필요합니다.

## Shared frontend mirror: 2026-10-23

Source: integrated frontend at `70f6266c06716341ec15222f02d4ba7b2f110b07`. Public-safe common changes cover interview layouts and twelve responsive fallback avatars, representative-image priority, posted-cohort chips and course filters, mobile spacing and back-to-top positioning, shared asset versions and masthead partials, and cancellation of repeated food-dice rolls (#72). Private snapshots, screenshots, uploads, backend files and Git history are excluded.

The public fixture generator and privacy checks remain preview-only. `content/preview/cohorts.json` preserves the design metadata already present in the previous public cohort HTML, adapted to the current data contract. Project fixture courses reuse the existing public design classification. These fixtures must never replace the integrated repository snapshots or DB. After fixture schema changes, run `npm run preview:data` and `npm run check:public` in this public checkout.

## 기수 기록 상세의 해시태그

선택 필드 `STORIES_DATA.cohorts[].tags`의 문자열은 상세 모달에서 작은 파란 태그 줄로 표시합니다(앞의 `#`은 생략 가능, 저장된 태그의 내부 공백은 유지). 기존 숫자 행사 분류는 해시태그로 표시하지 않습니다. 유효한 문자열 태그가 없을 때만 본문 마지막 문단 전체가 `#태그` 토큰인 경우 분리하고, `# 제목`·`#메모 오늘 배운 내용입니다` 같은 일반 문장과 중간 문단은 그대로 둡니다. 목록과 원본 데이터는 바꾸지 않으며 실제 사본을 공개로 가져오지 않습니다.
