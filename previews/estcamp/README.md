# ESTcamp × 인사교 UI — 4페이지 디자인 시안

2026-10-22 확인한 ESTcamp 콘텐츠·브랜드를 인사교 레이아웃에 적용한 **독립 4페이지 시안**입니다. 브랜치 `codex/estcamp-aica-concept`에서 관리합니다. 기존 PR #42가 닫혀 있는 것을 확인해 재개하거나 새 PR을 만들지 않았습니다. 인사교 원본·ESTcamp 운영 사이트·main·공개 배포·API·DB·Spring 파일은 변경하지 않습니다.

## 확인

저장소 루트에서 `npm run preview -- --port 4197` 실행:

- 홈: http://127.0.0.1:4197/previews/estcamp/
- 모집과정: http://127.0.0.1:4197/previews/estcamp/courses.html
- 이야기: http://127.0.0.1:4197/previews/estcamp/stories.html
- 지원 전 체크: http://127.0.0.1:4197/previews/estcamp/check.html
- 크기별 검토: http://127.0.0.1:4197/previews/estcamp/review.html

위 주소는 현재 컴퓨터에서만 접근하는 로컬 미리보기입니다. 이 폴더만 전달받은 경우 폴더 안에서 `npm run preview`로 실행합니다.

## 페이지별 구성과 원본 활용

| 페이지 | 콘텐츠 | 활용한 인사교 레이아웃 |
| --- | --- | --- |
| 홈 | 세 페이지 진입·교육 바로가기 | ARCHIVE 12열 모눈, 사진 타일, 겹친 모듈, 번호 색인, 체크 메모, 순서형 링크 |
| 모집과정 | 부트캠프 5개·AI 챌린저스·인공지능사관학교·상담 | 공통 제목 배너, 모서리 탭, 옆 목차, 큰 가로 대표 카드, 2열 카드, 프로그램 패널, 상담 띠, 다음 페이지 안내 |
| 이야기 | 원본 콘텐츠 5개·인터뷰 인용 | 모눈 메모 배너, 기사형 대표 카드, 사진형 카드, 가로 편집 목록, 인용문 패널, 분류 필터 |
| 지원 전 체크 | 지원 조건 4개·추천 대상 3개·카드 자격 확인·상담 | 조건 목록과 병렬 결과 패널, 번호형 추천 행, 접힌 안내, 상담 박스, 다음 페이지 안내 |

모바일은 옆 목차가 가로 알약 목차로 전환됩니다. 작은 화면에서 배너 장식은 제목과 겹치지 않게 숨깁니다. 헤더·현재 페이지 표시·모바일 메뉴·푸터는 공통으로 생성합니다. 기존 홈 #courses / #programs / #stories / #check / #contact 주소도 새 페이지로 이동합니다.

활용 기준은 `home/css/home.css`, `common/css/masthead.css`, `common/css/lnb.css`, `stories/css/projects-grid.css`, `check/css/check.css`, `common/css/site.css`이며 `pages.css` 상단에 선택자를 적었습니다. **원본 인사교 CSS는 수정하지 않고 시안 범위에서 구조와 규칙을 적용했습니다.**

## 콘텐츠·브랜드 경계

- 원본: https://estbootcamp.co.kr/ (2026-10-22 화면)
- 브랜드: https://estsoft-kdt-design.netlify.app/#top (ESTcamp BI V1.0)
- EST Blue #0047FF, Mint #00E2E6, Black, White / Paperlogy 제목·Pretendard 본문. 민트는 면에만 사용합니다. 과정 이미지의 고유 팔레트는 원본 그대로입니다.
- 원본의 모집 과정·상태·기간, 기관 정보·연락처, 인터뷰 제목·설명, 교육 조건을 유지합니다. 홈 제목·탐색 설명은 시안용 편집 문구이며 수치·혜택·후기·모집 조건을 만들지 않았습니다.
- 원본 AI 휴먼 마감일 `~11.30 (화)`를 그대로 보존했습니다. 날짜·요일 정합성과 최신 모집 조건은 운영 담당자 최종 확인 대상입니다.
- 과정 상세·알림·상담·인터뷰는 원본 주소로 연결합니다. 이 시안은 신청 제출·알림 등록·상담 접수를 수행하지 않습니다.
- 개인정보처리방침은 원본의 사이트 내부 동작이므로 원본 사이트로 안내합니다.
- 공개 이미지 출처는 `assets/sources.json`, 폰트 라이선스는 `assets/fonts/`에 있습니다. 사내 드라이브 비공개 파일은 가져오지 않았습니다.
- Spring/API/DB 연동 변경 없음. 실제 서버·DB 연결 테스트 없음.

## 수정·빌드

- 공통 문서: `src/page.html`, `src/header.html`, `src/footer.html`
- 페이지 원본: `src/home.html`, `src/courses.html`, `src/programs.html`, `src/stories.html`, `src/check.html`
- 과정·이야기 데이터: `src/content.json`
- 기존 공통 컴포넌트: `style.css` / 페이지 배치·변형: `pages.css` / 동작: `app.js`
- `npm run build --prefix previews/estcamp`: 네 HTML 생성. 생성물은 직접 고치지 않습니다.
- `npm run check --prefix previews/estcamp`: 네 생성물 일치·상대 파일·해시·중복 ID 검사.

## 검증

- 저장소 build / test 89개 / check 통과. 시안 build / check / JS 구문 검사 통과.
- 실제 인앱 브라우저에서 네 페이지 × 360·390·430·1440px(총 16조합) 확인: 본문 clientWidth와 scrollWidth 일치, h1 한 개, 깨진 이미지 없음. `evidence/multipage/viewport-results.json`에 수치를 기록했습니다.
- 지원 전 체크 배너의 장식 선택자 충돌 수정 후 네 크기 재검수·캡처 갱신.
- 모바일 메뉴 열기·Escape 닫기·모집과정 이동, 온라인 과정 필터 3개, 인터뷰 필터 3개·전체 복원, 체크리스트 2/4 집계, 재학생 안내 펼치기, 기존 index.html#stories → stories.html 이동 확인.
- 감소된 모션은 CSS·JS에서 시스템 설정을 따릅니다. OS 설정 전환·실제 터치 기기 스와이프는 미검증입니다. 사진 캐러셀은 네 페이지 구조에서 전체 기사 목록으로 대체되어 별도 넘김 동작이 없습니다.
- 새 캡처: `evidence/multipage/{index,courses,stories,check}-{360,390,430,1440}.jpg`. 브라우저 JPEG 출력을 그대로 보존합니다. 촬영본은 브라우저 출력 배율에 따라 CSS 뷰포트와 픽셀 수가 다릅니다. QA 너비는 JSON의 실제 innerWidth 기준입니다.
- 기존 evidence 최상단 캡처는 이전 원페이지 시안 이력입니다. 최신 결과와 구분합니다.
