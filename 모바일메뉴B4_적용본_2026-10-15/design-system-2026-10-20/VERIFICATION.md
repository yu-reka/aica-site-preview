# 검증 기록

2026-10-20 / 디자인 시스템 가이드 / 추출 소스 b9fc090

## 결과

- 현재 작업 사이트에서 `npm run build`: 11개 생성 결과 빌드 통과. 추적 중인 원본·생성물에 추가 차이 없음.
- 같은 사이트에서 `npm test`: 58개 통과.
- 같은 사이트에서 `npm run check`: 11개 생성 결과 일치.
- origin/main 기반 검토 작업 폴더에서도 build / test / check 통과: 11개 생성물, 49개 테스트. 기존 이야기 브랜치의 추가 테스트 9개가 포함되지 않아 현재 작업 사이트의 58개와 수가 다릅니다.
- `npm run preview`: 기본 4173 서버를 확인해 재사용. 사이트는 로컬 주소이며 외부 공개 주소가 아님.
- `node --check guide.js`: 통과.
- HTML 중복 ID, 앵커 목적지, 상대 링크, CSS의 로컬 폰트·이미지 경로, JSON 토큰 수(36개): 확인.
- 브라우저 콘솔 error/warn: 확인 시 없음.

## 실제 브라우저

Codex 인앱 브라우저에서 CSS viewport 360·390·430px와 1440px로 확인했습니다. 브라우저 배율을 고려해 `innerWidth` 실측값을 확인했습니다. 검증 후 임시 viewport override는 해제했습니다.

| 가이드 뷰포트 | document clientWidth | scrollWidth | 결과 |
| --- | --- | --- | --- |
| 360 | 346 | 346 | 전체 가로 넘침 없음 |
| 390 | 376 | 376 | 전체 가로 넘침 없음 |
| 430 | 416 | 416 | 전체 가로 넘침 없음 |
| 1440 | 1426 | 1426 | 전체 가로 넘침 없음 |

clientWidth는 세로 스크롤바 영역을 제외한 값입니다. 가이드 내 표와 1280px 원본 미리보기는 의도적으로 내부 가로 스크롤을 사용합니다.

확인한 동작:

- 색상 카드 클릭 → 클립보드 `#2457F5` 확인, 복사 완료 토스트 표시.
- 입력 문구를 `함께 만드는 AI의 내일`로 변경 → 출력 일치.
- 서체 Paperlogy / 크기 32px 선택 → computed style 및 문구 갱신 확인.
- 모바일 목차 열기 → 항목 이동 후 닫힘, Escape 닫힘 확인.
- 버튼 예시 기본/Outline/Small/disabled 시각 확인, 문의 버튼의 실제 40/44px 높이 확인.
- `마크업 보기` details 펼침 확인.
- 원본 미리보기의 430px 버튼 → 프레임 폭·표시값 변경 확인.
- 원본 iframe의 햄버거 → `aria-expanded=true`, Escape → false 확인.
- 데스크톱과 모바일에서 서체 로딩 및 주요 텍스트·스티커 배치 확인.

## 캡처

- [가이드 데스크톱 1440](captures/desktop-1440.png)
- [가이드 모바일 360](captures/mobile-360.png)
- [가이드 모바일 390](captures/mobile-390.png)
- [가이드 모바일 430](captures/mobile-430.png)
- [가이드 컴포넌트](captures/components-desktop.png)
- [현재 원본 사이트 데스크톱](captures/source-desktop-1440.png)
- [현재 원본 사이트 모바일](captures/source-mobile-430.png)

원본 사이트는 수정하지 않았으므로 원본 캡처는 변경 전/후 비교가 아닌 디자인 기준 자료입니다.

## 검증 범위

이 PR은 독립된 디자인 시스템 가이드와 참조 스냅샷만 추가합니다. 공용 CSS·JS·생성 HTML·Spring 내보내기와 DB 계약에는 변경이 없습니다. 기존 테스트의 Spring 내보내기 검사는 통과했지만 Spring 서버 구동, 실제 공개 DB 화면, 전체 페이지의 스크린리더와 모든 터치 제스처에 대한 별도 검증은 하지 않았습니다. 모션 감소 대응은 가이드 CSS와 원본의 관련 선언 보존을 확인했으며 OS 설정을 전환한 실기 검증은 하지 않았습니다.

PR은 기존 이야기 기능 커밋을 섞지 않도록 별도 origin/main 기반 `codex/site-design-system-review` 브랜치에서 문서 디렉터리만 추가합니다. 추출 기준 작업 브랜치 `codex/site-design-system`과 별개이며, main 병합·공개 배포는 수행하지 않습니다.
