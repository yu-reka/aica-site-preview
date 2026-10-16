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

루트의 HTML과 `common/js/menu.js`는 **생성 결과물**입니다. 직접 수정하면 다음 빌드에서 덮어씁니다. 원본을 수정하고 `npm run build`를 실행하세요. 코드 분리 중 기존 CSS와 이미지·폰트 파일은 변경하지 않았습니다.

## 데이터와 화면의 관계

후기는 한 레코드가 카드·목록·상세창을 생성합니다. 이야기 허브에서 재사용하는 후기·인터뷰·프로젝트 문구도 같은 레코드를 참조합니다. 허브용으로 문구가 달랐던 곳은 `hub*` 필드로 보존했습니다. 홈 전광판은 기존 실명 표기와 문구를 유지한 별도 편집 컬렉션입니다.

`id`는 기존 상세 주소와 연결됩니다. `view`에 해당하는 배치 정보는 콘텐츠와 별도로 `src/presentation.json`에 있습니다. 기존 디자인의 개별 일러스트와 일부 위치별 변형을 보존하므로, **새 레코드를 추가할 때는 해당 레코드의 표시 템플릿·배치도 지정**해야 합니다. 텍스트 수정에는 화면 코드를 수정할 필요가 없습니다.

시설 공간 탭과 주거 지도는 현재 디자인의 고정 슬롯입니다. 정적 미리보기의 후기 페이지도 고정 슬롯을 유지하지만, Spring 연결 화면은 DB의 기수와 글 수에 따라 필터·페이지를 생성합니다. 운영 중인 후기는 백오피스에서 관리하며 `content/stories/reviews.json`은 최초 가져오기와 디자인 미리보기의 기준 데이터입니다.

후기용 Spring 연결은 별도 `AICA-BACKOFFICE/main-project` 저장소에 구현되어 있습니다. 임시저장과 공개본을 분리하고 발행할 때만 공개합니다. `npm run export:spring -- --output /absolute/server/src/main/resources`로 디자인을 내보내며, 실행과 경계는 [연동 안내](docs/spring-integration.md)를 참고하세요. 프론트 단독 `4173` 서버는 정적 미리보기이고, 연결된 후기는 Spring 서버의 `/stories/reviews.html`에서 확인합니다.

인터뷰·프로젝트·기수별 기록도 후기와 같은 Spring 공용 DB와 작업본·발행 정책으로 연결했습니다. `scripts/spring-stories.mjs`가 승인된 디자인 변형과 일러스트를 함께 내보냅니다. 공개 프론트와 관리자 계정들은 같은 DB를 사용하고 역할별 권한을 구분합니다. 최초 전체 시안 데이터 가져오기는 `BACKOFFICE_IMPORT_STORIES=true`로 명시합니다. 자세한 내용은 [연동 안내](docs/spring-integration.md)를 참고하세요.
