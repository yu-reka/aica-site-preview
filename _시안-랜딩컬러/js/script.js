/* =========================================================
   A. DATA
   ========================================================= */

/* 이미지 매니페스트 — 실제 사진이 준비되면 slot id에 경로만 넣으면 됩니다.
   예) 'about.hero': '/images/about/hero.jpg'  (비워두면 촬영 가이드 placeholder 노출) */
const IMAGES = {
  'about.hero':'', 'about.hero.inset':'',
  'intro.a':'', 'intro.b':'', 'intro.c':'', 'intro.fit':'',
  'learn.day.1':'', 'learn.day.2':'', 'learn.day.3':'', 'learn.day.4':'', 'learn.day.5':'',
  'act.project':'', 'act.lecture':'', 'act.field':'', 'act.fair':'', 'act.graduation':'',
  'career.lounge':'', 'next.stories':'', 'next.check':''
};

/* GNB — IA_v3 01.메뉴요약 기준. type: anchor = 원페이지+앵커 / tab = 개별 페이지 */
const NAV = [
  { id:'about',   label:'인사교 알아보기', title:'인사교 A to Z', type:'anchor', children:[
    {id:'overview',label:'인사교 A to Z'},{id:'intro',label:'인사교 소개'},{id:'learn',label:'무엇을 배우나요?'},
    {id:'activity',label:'어떤 활동을 하나요?'},{id:'career',label:'취업·창업 지원'} ]},
  { id:'stories', label:'선배들의 이야기', title:'먼저 다녀온 선배들의 SSUL', type:'tab', children:[
    {id:'reviews',label:'선배 후기'},{id:'interviews',label:'선배 인터뷰'},{id:'cohorts',label:'기수별 이모저모'} ]},
  { id:'life',    label:'인사교 라이프', title:'인사교 Real Life', type:'tab', children:[
    {id:'facilities',label:'시설 둘러보기'},{id:'tips',label:'생활 꿀팁'},{id:'directions',label:'오시는 길'} ]},
  { id:'check',   label:'지원 전 체크', title:'지원 전 Check', type:'anchor', children:[
    {id:'overview',label:'지원 전 Check'},{id:'eligibility',label:'지원 자격'},{id:'schedule',label:'모집 프로세스'},
    {id:'benefits',label:'지원 혜택'},{id:'faq',label:'자주 묻는 질문'} ]}
];

/* =========================================================
   B. COMPONENTS (문자열 템플릿)
   ========================================================= */
const ICON = {
  cam:'<svg viewBox="0 0 24 24"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  out:'<svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  arrow:'<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  chev:'<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>'
};

/** 이미지 슬롯: 비율·촬영 가이드를 명시한 placeholder, src가 있으면 실제 이미지 */
function Photo({slot, ratio='4/3', guide='', alt='', caption='', tone='', reveal=true, zoom=true, radius}){
  const src = IMAGES[slot];
  const style = `--r:${ratio}${radius?`;--radius:${radius}`:''}`;
  const media = src
    ? `<img src="${src}" alt="${alt}" loading="lazy">`
    : `<div class="ph-fill" role="img" aria-label="${alt} (사진 준비 중)"></div>
       <div class="ph-label" aria-hidden="true"><b>${ICON.cam}${ratio.replace('/',':')} · ${slot}</b>${guide?`<span>${guide}</span>`:''}</div>`;
  return `<figure class="ph${zoom?' zoom':''}${reveal?' rv-img':''}" data-slot="${slot}"${tone?` data-tone="${tone}"`:''}>
    <div class="ph-media" style="${style}">${media}</div>
    ${caption?`<figcaption>${caption}</figcaption>`:''}
  </figure>`;
}

function ChapterHead({word, title, desc}){
  return `<div class="chapter-head">
    <span class="chapter-word rv" aria-hidden="true">${word}</span>
    <div class="rv"><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div>
  </div>`;
}

const TBD = (t='확인 필요') => `<span class="tbd">${t}</span>`;

/* =========================================================
   C. PAGES
   ========================================================= */
const Pages = {};

/* ---------- 1. 인사교 알아보기 (원페이지 + 앵커) ---------- */
Pages.about = () => `
<section id="overview" class="p-hero" aria-labelledby="pageTitle">
  <div class="wrap">
    <div class="p-hero-grid">
      <div>
        <p class="crumb rv">인사교 알아보기</p>
        <h1 id="pageTitle" class="rv">인사교<br>A to Z</h1>
      </div>
      <p class="lead rv">약 6개월, 1,300시간. 쉽게 내릴 결정이 아니니까요. 여기서 뭘 배우고, 하루를 어떻게 보내고, 끝나고 어디로 이어지는지 처음부터 차근차근 풀어볼게요.</p>
    </div>
    <div class="hero-collage">
      <div class="main">${Photo({slot:'about.hero',ratio:'16/9',guide:'오후 자연광이 드는 강의실. 교육생들이 모니터를 보며 이야기 나누는 순간, 카메라를 의식하지 않은 뒷모습·옆모습 위주',alt:'강의실에서 함께 코드를 보는 교육생들',reveal:true})}</div>
      <p class="hero-note rv"><strong>7기부터는 모든 수업이 오프라인이에요.</strong>매일 같은 공간에서 만나 배우고, 막히면 옆자리에 바로 물어볼 수 있어요.</p>
      <div class="inset">${Photo({slot:'about.hero.inset',ratio:'4/5',guide:'노트북 위 손과 메모, 클로즈업',alt:'노트북과 메모를 정리하는 손',tone:'warm'})}</div>
    </div>
  </div>
</section>

<!-- 1.1 인사교 소개 -->
<section id="intro" class="chapter" aria-labelledby="h-intro">
  <div class="wrap">
    ${ChapterHead({word:'About',title:'<span id="h-intro">인사교 소개</span>',desc:'공식 소개서보다 조금 더 솔직하게, 이 과정이 어떤 곳인지부터 이야기할게요.'})}

    <div class="block">
      <h3 class="sr-only">교육 목적</h3>
      <div class="purpose">
        <p class="purpose-statement rv">AI 기초부터 실무 프로젝트, 취업과 창업 준비까지. 광주에서 AI 실무인재로 성장하는 6개월 과정이에요.</p>
        <div class="purpose-body rv">
          <p>인공지능사관학교는 AI를 도입하려는 기업이 실제로 필요로 하는 사람을 키우는 곳이에요. 이론만 듣고 끝나지 않고, 팀을 꾸려 기능을 만들고 서비스를 완성해 보는 경험을 과정 전체에 걸쳐 쌓아가요.</p>
          <p class="muted">교육비는 전액 국비로 지원돼요. 자세한 지원 내용과 기준은 <a href="#/check/benefits" style="color:var(--blue)">지원 혜택</a>에서 확인할 수 있어요.</p>
        </div>
      </div>
      <div class="collage3">
        <div class="a">${Photo({slot:'intro.a',ratio:'4/5',guide:'팀 회의 중 화이트보드 앞, 웃음이 터진 순간',alt:'화이트보드 앞에서 회의하는 팀',caption:'팀 프로젝트 회의'})}</div>
        <div class="b">${Photo({slot:'intro.b',ratio:'3/4',guide:'복도·창가에서 쉬는 시간, 자연스러운 대화',alt:'쉬는 시간 창가에서 대화하는 교육생',tone:'warm',caption:'쉬는 시간'})}</div>
        <div class="c">${Photo({slot:'intro.c',ratio:'1/1',guide:'모니터 화면과 키보드, 작업 중 디테일',alt:'코드가 띄워진 모니터',tone:'cool',caption:'실습 중'})}</div>
      </div>
    </div>

    <div class="block">
      <h3 class="block-title rv">함께 만드는 기관들</h3>
      <div class="orgs rv">
        <div class="org"><div class="org-logo"><span class="logo-slot">로고 영역</span></div><p class="org-role">주관</p><h4>인공지능산업융합사업단(AICA)</h4><p>과정을 기획하고 전체 운영을 총괄해요.</p></div>
        <div class="org"><div class="org-logo"><span class="logo-slot">로고 영역</span></div><p class="org-role">운영</p><h4>이스트소프트</h4><p>수업 운영과 교육생 관리를 맡고 있어요.</p></div>
        <div class="org"><div class="org-logo"><span class="logo-slot">로고 영역</span></div><p class="org-role">협력 ${TBD()}</p><h4>[협력기관명]</h4><p>관계(교육 협력·프로젝트 참여)를 확인한 뒤 소개해요. 로고 사용 동의 전에는 기관명만 표기해요.</p></div>
      </div>
    </div>

    <div class="block">
      <div class="fit">
        <div class="fit-aside rv">
          <h3 class="block-title">이런 분들이 많이 와요</h3>
          ${Photo({slot:'intro.fit',ratio:'4/5',guide:'OT 첫날, 조금은 어색한 표정으로 자기소개하는 모습',alt:'OT에서 자기소개하는 교육생',tone:'warm'})}
          <p class="fit-note">여기는 ‘이런 분께 잘 맞아요’라는 안내예요. 실제 지원 가능 여부는 <a href="#/check/eligibility">지원 자격</a>에서 확인해 주세요.</p>
        </div>
        <ul class="fit-list">
          <li class="rv"><span class="q" aria-hidden="true">“</span><div><h4>비전공자인데 AI를 제대로 배워보고 싶어요</h4><p>기초 역량부터 시작해요. 처음엔 낯설어도 따라가는 사람이 많아요.</p></div></li>
          <li class="rv"><span class="q" aria-hidden="true">“</span><div><h4>혼자 공부하다 자꾸 멈추게 돼요</h4><p>매일 같은 시간, 같은 공간에서 동기들과 같이 달리는 구조예요.</p></div></li>
          <li class="rv"><span class="q" aria-hidden="true">“</span><div><h4>배운 걸 실제로 써먹어 보고 싶어요</h4><p>팀 프로젝트가 과정의 중심이에요. 기획부터 개발, 발표까지 해봐요.</p></div></li>
          <li class="rv"><span class="q" aria-hidden="true">“</span><div><h4>광주에서 커리어를 시작해 보려고요</h4><p>교육생 절반가량이 다른 지역에서 와요. 정착 정보는 <a href="#/life/tips" style="color:var(--blue)">생활 꿀팁</a>에 모아뒀어요.</p></div></li>
        </ul>
      </div>
    </div>

    <div class="block chapter-end">
      <div class="why">
        <div class="why-intro rv">
          <h3 class="block-title">왜 인사교일까요</h3>
          <p class="muted">비슷한 국비 과정이 많은데, 여기가 다른 점을 정리했어요. 각 항목의 실제 경험은 선배 후기에서 더 볼 수 있어요.</p>
        </div>
        <ul class="why-list">
          <li class="rv"><h4>AI 직무 기준으로 짠 과정</h4><p>산업 현장에서 필요한 역할을 기준으로 배울 내용을 구성해요.</p></li>
          <li class="rv"><h4>수준에 맞춰 배우는 방식</h4><p>교육생 수준과 목표에 따라 학습 방식을 조정해요. 토론, 팀 실습, 발표를 섞어 진행해요.</p></li>
          <li class="rv"><h4>프로젝트 중심(PBL)</h4><p>팀 기반 실무 프로젝트를 집중적으로 운영해요. 동료 학습과 자율 프로젝트도 함께해요.</p></li>
          <li class="rv"><h4>단계별 취·창업 지원</h4><p>1:1 컨설팅, 모의 면접, 채용 박람회까지 과정 중에 꾸준히 이어져요.</p></li>
          <li class="rv"><h4>실습용 컴퓨팅 자원</h4><p>AI 집적단지 데이터센터의 멀티 GPU로 실습해요. 개인 노트북으로는 어려운 학습도 가능해요.</p></li>
        </ul>
      </div>
      <figure class="quote rv">
        <blockquote>“처음 두 달은 솔직히 매일이 벅찼어요. 그런데 팀원들이랑 같이 막히고 같이 풀다 보니, 어느 순간 제가 코드를 설명하고 있더라고요.”</blockquote>
        <figcaption><b>7기 교육생</b>비전공(인문계열) ${TBD('예시 문구')}</figcaption>
      </figure>
    </div>
  </div>
</section>

<!-- 1.2 무엇을 배우나요? -->
<section id="learn" class="chapter tint" aria-labelledby="h-learn">
  <div class="wrap">
    ${ChapterHead({word:'Learn',title:'<span id="h-learn">무엇을 배우나요?</span>',desc:'6개월 동안 무엇을 어떤 순서로 배우는지, 하루는 어떻게 흘러가는지 보여드릴게요.'})}

    <div class="block">
      <h3 class="block-title rv">과정은 이렇게 흘러가요</h3>
      <ol class="track rv">
        <li><h4>AI 기초 역량</h4><p>프로그래밍과 데이터 다루기 등 AI 학습의 바탕을 다져요.</p></li>
        <li><h4>직군별 실무 교육</h4><p>진로 방향에 맞춘 직군별 실무 역량을 익혀요.</p></li>
        <li><h4>산업 도메인 학습</h4><p>AI가 쓰이는 산업 분야를 이해하고 문제를 정의해요.</p></li>
        <li><h4>프로젝트</h4><p>기업연계·실증·창업 프로젝트로 실제 서비스를 만들어요.</p></li>
        <li><h4>취·창업 준비</h4><p>포트폴리오를 정리하고 다음 단계를 준비해요.</p></li>
      </ol>
      <div class="track-foot rv">
        <span class="basis">2026년 7기 기준. 세부 과목명은 공개 범위를 확인한 뒤 게재해요. ${TBD()}</span>
      </div>
    </div>

    <div class="block">
      <div class="hours">
        <p class="hours-line rv">총 교육 시간은 <em>약 1,300시간</em>. 주 5일, 약 6개월 동안 매일 출석하는 과정이에요.</p>
        <dl class="hours-facts rv">
          <dt>교육 기간</dt><dd>약 6개월</dd>
          <dt>수업 방식</dt><dd>100% 오프라인 (7기부터)</dd>
          <dt>장소</dt><dd>광주광역시 동구 제봉로 92</dd>
          <dt>교육비</dt><dd>전액 국비 지원</dd>
        </dl>
      </div>
    </div>

    <div class="block">
      <h3 class="block-title rv">인사교의 하루</h3>
      <p class="basis rv" style="margin:-8px 0 36px">시간은 확정 전 예시예요. 운영 시간이 확인되면 기준 기수와 함께 업데이트해요.</p>
      <div class="day" id="day">
        <div class="day-visual" aria-hidden="true">
          <div class="day-clock" id="dayClock">09:00</div>
          <div class="day-stack">
            ${Photo({slot:'learn.day.1',ratio:'4/5',guide:'아침 등교, 건물 입구로 들어오는 교육생들',reveal:false,zoom:false,alt:'아침 등교하는 교육생'})}
            ${Photo({slot:'learn.day.2',ratio:'4/5',guide:'오전 수업, 강사 설명에 집중하는 강의실',reveal:false,zoom:false,tone:'cool',alt:'오전 수업 중인 강의실'})}
            ${Photo({slot:'learn.day.3',ratio:'4/5',guide:'점심 식판·식당 테이블, 동기들과 식사',reveal:false,zoom:false,tone:'warm',alt:'동기들과 점심 식사'})}
            ${Photo({slot:'learn.day.4',ratio:'4/5',guide:'오후 팀 실습, 한 화면을 같이 보는 팀원들',reveal:false,zoom:false,alt:'오후 팀 실습'})}
            ${Photo({slot:'learn.day.5',ratio:'4/5',guide:'해 질 무렵 건물 밖, 가방 메고 나서는 모습',reveal:false,zoom:false,tone:'warm',alt:'하교하는 교육생'})}
          </div>
        </div>
        <ol class="day-steps">
          ${[
            ['09:00','등교','매일 캠퍼스로 출석해요. 7기부터는 온라인 수업 없이 전부 오프라인으로 진행돼요.','learn.day.1','','아침 등교 장면'],
            ['09:30','오전 수업','개념을 배우고 바로 실습으로 확인해요. 모르는 건 그 자리에서 물어볼 수 있어요.','learn.day.2','cool','오전 수업 장면'],
            ['12:30','점심','동기들과 같이 먹는 시간이에요. 식비 지원 기준은 지원 혜택에서 확인해 주세요.','learn.day.3','warm','점심 장면'],
            ['13:30','오후 실습·팀 활동','오후에는 팀별 실습과 프로젝트가 많아요. 의견이 부딪힐 때 조율하는 것도 배우는 과정이에요.','learn.day.4','','팀 실습 장면'],
            ['18:00','하교','“정시에 끝나나요?”는 가장 많이 받는 질문이에요. 실제 종료 시간은 확인 후 적어둘게요.','learn.day.5','warm','하교 장면']
          ].map(([t,h,p,slot,tone,alt],i)=>`
          <li class="day-step${i===0?' is-current':''}" data-index="${i}" data-time="${t}">
            <time>${t} ${TBD('예시')}</time>
            <h4>${h}</h4>
            <p>${p}</p>
            ${Photo({slot,ratio:'4/3',tone,alt,guide:'모바일에서는 단계별로 사진이 들어가요'})}
          </li>`).join('')}
        </ol>
      </div>
    </div>

    <div class="block chapter-end">
      <div class="org-intro rv">
        <h3 class="block-title">운영하는 곳</h3>
        <div>
          <p>인공지능사관학교는 인공지능산업융합사업단이 주관하고 이스트소프트가 운영해요. 수도권과 광주의 AI 교육 운영 경험을 바탕으로, 기수마다 교육생 피드백을 반영해 과정을 고쳐왔어요.</p>
          <p class="muted">기관의 공식 소개와 모집 공고는 공식 홈페이지에서 확인할 수 있어요.</p>
          <a class="text-link" href="#official" data-toast="공식 홈페이지 주소는 확정 후 연결돼요">공식 홈페이지에서 보기 ${ICON.out}</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 1.3 어떤 활동을 하나요? -->
<section id="activity" class="chapter" aria-labelledby="h-activity">
  <div class="wrap">
    ${ChapterHead({word:'Moments',title:'<span id="h-activity">어떤 활동을 하나요?</span>',desc:'수업만 있는 6개월은 아니에요. 기수마다 함께 겪는 순간들이 있어요.'})}
    <div class="mosaic chapter-end">
      <article class="act m1 rv">
        ${Photo({slot:'act.project',ratio:'4/3',guide:'최종 발표 리허설, 노트북 앞에 모인 팀. 결과물 화면이 살짝 보이게',alt:'프로젝트 발표를 준비하는 팀'})}
        <h3>프로젝트</h3>
        <p>핵심역량 프로젝트와 최종 프로젝트를 팀 단위로 진행해요. 최종 프로젝트에는 팀별 지원비가 있어요.</p>
        <p class="meta basis">지원비 금액·조건은 <a href="#/check/benefits" style="color:var(--blue)">지원 혜택</a> 기준 · 우수 프로젝트는 <a href="#/stories/cohorts" style="color:var(--blue)">기수별 이모저모</a>에서</p>
      </article>
      <article class="act m2 rv">
        ${Photo({slot:'act.lecture',ratio:'4/5',guide:'특강 중 질문하는 교육생, 손을 든 순간',alt:'특강에서 질문하는 교육생',tone:'cool'})}
        <h3>특강</h3>
        <p>현업 전문가를 초청해 최신 기술과 실무 이야기를 들어요.</p>
      </article>
      <article class="act m3 rv">
        ${Photo({slot:'act.field',ratio:'1/1',guide:'현장학습 이동 중 또는 기업 공간 견학',alt:'현장학습 모습',tone:'warm'})}
        <h3>현장학습</h3>
        <p>AI가 실제로 쓰이는 현장을 직접 보고 와요. ${TBD('용어 통일 확인')}</p>
      </article>
      <article class="act m4 rv">
        ${Photo({slot:'act.fair',ratio:'1/1',guide:'취업박람회 부스 앞에서 상담받는 모습',alt:'취업박람회 참여',tone:'cool'})}
        <h3>취업박람회 참여</h3>
        <p>채용 박람회에 함께 참여해 기업과 직접 이야기 나눠요.</p>
      </article>
      <article class="act m5 rv">
        ${Photo({slot:'act.graduation',ratio:'4/5',guide:'수료식 후 동기들과의 단체 사진이 아닌, 서로 축하하는 자연스러운 순간',alt:'수료식에서 축하하는 동기들',tone:'warm'})}
        <h3>수료식</h3>
        <p>6개월을 함께한 동기들과 마무리하는 날이에요.</p>
      </article>
      <div class="etc rv">
        <h3>그 밖의 활동</h3>
        <ul>
          <li><b>동문회</b><span>먼저 수료한 선배들과 만나는 자리예요.</span></li>
          <li><b>외부행사</b><span>AI 관련 행사·컨퍼런스에 함께 참여해요.</span></li>
          <li><b>AI PLUS</b><span>심화 학습 프로그램이에요. ${TBD()}</span></li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- 1.4 취업·창업 지원 -->
<section id="career" class="chapter deep" aria-labelledby="h-career">
  <div class="wrap">
    ${ChapterHead({word:'Next',title:'<span id="h-career">취업·창업 지원</span>',desc:'수료가 끝이 아니도록, 과정 중에 다음 단계를 함께 준비해요.'})}
    <div class="career">
      ${Photo({slot:'career.lounge',ratio:'4/5',guide:'취·창업 라운지에서 상담 중인 모습, 창가 자연광',alt:'취·창업 라운지에서 상담하는 모습'})}
      <ul class="career-list">
        <li class="rv">
          <h3>취·창업 라운지</h3>
          <p>진로 고민을 편하게 꺼낼 수 있는 공간이에요. 취업 준비와 창업 상담을 여기서 해요.</p>
          <dl><dt>운영 시간</dt><dd>[운영 시간] ${TBD()}</dd><dt>이용 방법</dt><dd>[이용 방법] ${TBD()}</dd></dl>
        </li>
        <li class="rv">
          <h3>이력서·자소서 컨설팅</h3>
          <p>1:1로 서류를 함께 다듬어요. 프로젝트 경험을 어떻게 풀어낼지도 같이 고민해요.</p>
          <dl><dt>진행 방식</dt><dd>1:1 컨설팅</dd><dt>신청 방법</dt><dd>[신청 방법] ${TBD()}</dd></dl>
        </li>
        <li class="rv">
          <h3>모의 면접</h3>
          <p>실제 면접처럼 연습하고 피드백을 받아요. 떨리는 건 연습할수록 줄어들어요.</p>
          <dl><dt>진행 방식</dt><dd>기업 모의면접</dd><dt>시기</dt><dd>[진행 시기] ${TBD()}</dd></dl>
        </li>
      </ul>
    </div>
    <figure class="quote rv chapter-end">
      <blockquote>“모의 면접 때 받은 피드백을 그대로 고쳐서 갔더니, 실제 면접에서 같은 질문이 나왔어요.”</blockquote>
      <figcaption><b>6기 수료생</b>${TBD('예시 문구')}</figcaption>
    </figure>
  </div>
</section>

<!-- 이어서 보기 -->
<section class="chapter chapter-end" aria-label="이어서 보기">
  <div class="wrap">
    <div class="next-links">
      <a class="next-link rv" href="#/stories/reviews">
        ${Photo({slot:'next.stories',ratio:'1/1',guide:'인터뷰 컷',reveal:false,alt:''})}
        <span><small>선배들의 이야기</small><strong>먼저 다녀온<br>선배들의 SSUL</strong></span>
        <span class="arrow" aria-hidden="true">${ICON.arrow}</span>
      </a>
      <a class="next-link rv" href="#/check/eligibility">
        ${Photo({slot:'next.check',ratio:'1/1',guide:'책상 위 서류',reveal:false,tone:'cool',alt:''})}
        <span><small>지원 전 체크</small><strong>지원 전<br>Check</strong></span>
        <span class="arrow" aria-hidden="true">${ICON.arrow}</span>
      </a>
    </div>
  </div>
</section>`;

/* ---------- 3. 인사교 라이프 (개별 페이지 · 탭) ---------- */
Object.assign(IMAGES, {
  'life.fac.hero':'',
  'fac.classroom':'','fac.classroom.2':'','fac.cafe':'','fac.cafe.2':'','fac.lounge':'','fac.lounge.2':'',
  'fac.project':'','fac.project.2':'','fac.cafeteria':'','fac.cafeteria.2':'',
  'tips.hero.a':'','tips.hero.b':'','tips.food.1':'','tips.food.2':'','tips.food.3':'','tips.food.4':'','tips.food.5':'','tips.food.6':'','tips.food.7':'','tips.food.8':'',
  'tips.culture.1':'','tips.culture.2':'','tips.culture.3':'','tips.culture.4':'','tips.culture.5':''
});

const FACILITIES = [
  { id:'entrance', word:'Entrance', name:'정문(입구)', tone:'', sticker:'첫 만남', tilt:'1deg',
    desc:'인사교에 들어서면 가장 먼저 \'GWANGJU AI SCHOOL\' 조형물이 반겨줘요. 매일 아침 이 앞을 지나 교육장으로 올라가요.',
    chips:['출입','조형물 앞 기념 사진','교육장으로 이동'],
    info:[['pin','위치(층)',`[층] ${TBD()}`]],
    guide:'입구 조형물', guide2:'' },
  { id:'classroom', word:'Classroom', name:'강의실', tone:'', sticker:'하루의 대부분', tilt:'-2deg',
    desc:'하루 대부분을 여기서 보내요. 수업 듣고, 바로 실습하고, 막히면 옆자리에 물어보는 곳이에요.',
    chips:['수업','실습','질문 타임'],
    info:[['pin','위치(층)',`[층] ${TBD()}`]],
    guide:'오후 햇빛이 드는 강의실. 수업 중 자연스러운 옆모습', guide2:'책상 위 모니터·키보드' },
  { id:'cafe', word:'AI Cafe', name:'AI 카페', tone:'warm', sticker:'잠깐 쉬어 가기', tilt:'2deg', check:'공간 실재·촬영 가능 여부 확인',
    desc:'머리가 꽉 찼을 때 잠깐 들르는 곳이에요. 동기들이랑 가볍게 수다 떨기에도 딱이에요.',
    chips:['커피 한 잔','가벼운 수다','짧은 휴식'],
    info:[['pin','위치(층)',`[층] ${TBD()}`]],
    guide:'음료를 들고 이야기 나누는 두세 명', guide2:'테이블 위 컵과 노트북' },
  { id:'lounge', word:'Lounge', name:'휴게 공간', tone:'cool', sticker:'충전 중', tilt:'-1.5deg', check:'기존 ‘라운지’와 같은 공간인지 확인',
    desc:'점심 먹고 잠깐 늘어져도 괜찮은 곳이에요. 오후 수업 전에 한숨 돌리기 좋아요.',
    chips:['쉬는 시간','점심 후 휴식'],
    info:[['pin','위치(층)',`[층] ${TBD()}`]],
    guide:'소파에 기대 쉬는 모습, 얼굴보다 분위기 위주', guide2:'창가 자리' },
  { id:'project', word:'Project Room', name:'프로젝트 공간', tone:'', sticker:'회의 중', tilt:'1.8deg',
    desc:'팀 프로젝트 회의가 열리는 곳이에요. 화이트보드 위 기획은 하루에도 몇 번씩 바뀌어요.',
    chips:['팀 회의','아이디어 정리','발표 연습'],
    info:[['pin','위치(층)',`[층] ${TBD()}`]],
    guide:'화이트보드 앞 팀 회의, 포스트잇이 붙은 벽', guide2:'회의 테이블 위 손과 메모' },
  { id:'cafeteria', word:'Cafeteria', name:'구내식당', tone:'warm', sticker:'점심은 여기서', tilt:'-2.2deg', check:'운영 여부·촬영 가능 여부 확인',
    desc:'오전 수업이 끝나면 다 같이 모이는 곳이에요. 식비 지원 기준은 지원 혜택에 한곳으로 모아뒀어요.',
    chips:['점심','동기들과 밥'],
    info:[['pin','위치(층)',`[층] ${TBD()}`]],
    guide:'점심시간 식당, 식판을 들고 자리 찾는 모습', guide2:'식판 위 메뉴' }
];
const MINI = {
  pin:'<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  seat:'<svg viewBox="0 0 24 24"><path d="M7 11V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5M5 11h14v4H5zM7 15v5M17 15v5"/></svg>',
  info:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>'
};

/* 도형 컴포넌트: 톱니 버스트 · 물결 씰 · 블롭 말풍선 */
function shapePath(type, seed=0){
  const pts=[], N = type==='burst' ? 36 : 140;
  for(let i=0;i<N;i++){
    const t=i/N*Math.PI*2; let r;
    if(type==='burst') r = i%2 ? 80 : 100;
    else if(type==='seal') r = 93 + 7*Math.cos(t*16);
    else r = 86 + 8*Math.sin(t*4+seed) + 5*Math.sin(t*3+seed*2) + 3*Math.cos(t*6+seed);
    pts.push([(100+r*Math.cos(t)).toFixed(1),(100+r*Math.sin(t)).toFixed(1)]);
  }
  return 'M'+pts.map(p=>p.join(' ')).join('L')+'Z';
}
const SHAPE_COLORS = {butter:'#FFE3A1', sky:'#CFE0FF', coral:'#FF7A59', ink:'#14233F', blue:'#1F4ED8'};
function Seal({text, color='butter', ink='#14233F', size=96, rot=-10, cls=''}){
  return `<span class="seal ${cls}" style="--s:${size}px;--rot:${rot}deg;color:${ink}" aria-hidden="true">
    <svg viewBox="0 0 200 200"><path d="${shapePath('seal')}" fill="${SHAPE_COLORS[color]||color}"/></svg><b>${text}</b></span>`;
}
function BurstPhoto({photo, color='butter', rot=-4, cls=''}){
  return `<div class="burst ${cls}" style="--rot:${rot}deg">
    <svg class="burst-bg" viewBox="0 0 200 200" aria-hidden="true"><path d="${shapePath('burst')}" fill="${SHAPE_COLORS[color]||color}"/></svg>
    <div class="burst-photo">${photo}</div></div>`;
}
function BlobQuote({text, who, sub='', color='sky', badge='ink', seed=1, cls=''}){
  return `<figure class="blob rv ${cls}">
    <svg class="blob-bg" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden="true"><path d="${shapePath('blob',seed)}" fill="${SHAPE_COLORS[color]||color}"/></svg>
    <blockquote><span class="blob-mark" aria-hidden="true">“</span>${text}<span class="blob-mark" aria-hidden="true">”</span></blockquote>
    <figcaption class="blob-badge" style="background:${SHAPE_COLORS[badge]||badge}"><b>${who}</b>${sub?`<span>${sub}</span>`:''}</figcaption>
  </figure>`;
}

IMAGES['dir.building']='images/img-03-be768d.jpg';
function LifeHero({crumb,title,lead,media=''}){
  return `<section class="l-hero" aria-labelledby="pageTitle"><div class="wrap">
    <p class="crumb rv">인사교 라이프 / ${crumb}</p>
    <div class="l-hero-grid">
      <h1 id="pageTitle" class="rv">${title}</h1>
      <p class="lead rv">${lead}</p>
    </div>
    ${media}
  </div></section>`;
}
function Pager(menuId, subId){
  const m = NAV.find(x=>x.id===menuId), i = m.children.findIndex(c=>c.id===subId);
  const prev = m.children[i-1], next = m.children[i+1];
  return `<nav class="pager" aria-label="${m.label} 다른 탭">
    ${prev?`<a class="prev" href="#/${m.id}/${prev.id}"><small>이전</small><strong>${prev.label}</strong></a>`:''}
    ${next?`<a class="next" href="#/${m.id}/${next.id}"><small>다음</small><strong>${next.label}</strong></a>`:''}
  </nav>`;
}


/* ===== v3 공통 컴포넌트: 어두운 히어로 · 카테고리 바 · 다음 볼 페이지 ===== */
function ThemeHero({id='', num, label, crumbs, title, en, desc, extra=''}){
  const t=String(title).replace(/<br\s*\/?>/g,' ');
  return `<section class="t-hero t-hero-slim"${id?` id="${id}"`:''} aria-labelledby="pageTitle"><div class="wrap">
    <div class="t-titlerow rv"><h1 id="pageTitle">${t}</h1>${en?`<span class="t-en" aria-hidden="true">${en}</span>`:''}</div>
    ${desc?`<p class="t-desc rv">${desc}</p>`:''}
    ${extra}
  </div></section>`;
}
function CatBar(page){
  return `<nav class="ax-index catbar" aria-label="다른 카테고리">
    ${CATS.map(c=>`<a class="ix${c.id===page?' is-current':''}" data-cat="${+c.n}" href="${catHref(c.id)}" style="--c:${c.c}"${c.id===page?' aria-current="page"':''}><b>${c.n}</b><span>${c.label}</span><i>${c.en}</i></a>`).join('')}
  </nav>`;
}
function NextCards(items){
  return ''; // '다음으로 보면 좋아요' 영역 삭제
  return `<section class="nx" aria-label="다음으로 볼 페이지"><div class="wrap">
    <p class="nx-cap rv">다음으로 보면 좋아요</p>
    <div class="nx-grid">${items.map(([k,t,d,h])=>`<a class="nx-card rv" href="${h}"><small>${k}</small><strong>${t}</strong><span>${d}</span><i aria-hidden="true">${ICON.arrow}</i></a>`).join('')}</div>
  </div></section>`;
}
const SEC_WORD={'h-floors':'Floor','h-housing':'Home','h-food':'Lunch','h-culture':'Weekend','h-eligibility':'Who','h-schedule':'Flow','h-benefits':'Benefit','h-faq':'FAQ','h-reviews':'Review','h-iv1':'Pick','h-iv2':'Interview','h-cohort':'Cohort'};
function SecHead(num,id,title,desc){
  const w=SEC_WORD[id];
  return `<div class="s-head rv"><div class="s-row">${w?`<p class="s-word" aria-hidden="true">${w}</p>`:''}<h2 id="${id}">${title}</h2></div>${desc?`<p class="s-desc">${desc}</p>`:''}</div>`;
}

/* ===== v3: 선배들의 이야기 ===== */
const StoriesHero = (tab) => ThemeHero({
  num:'02', label:'선배들의 이야기', crumbs:`홈 › 선배들의 이야기 › <b>${tab}</b>`,
  title:'먼저 다녀온 선배들의 <em class="t-ol">SSUL</em>', en:'',
  desc:'',
  extra:`<ul class="t-chips t-chips-lg rv" aria-label="키워드">${['수업','팀플','생활','선배들의','리얼한','찐후기'].map(t=>`<li><span>#${t}</span></li>`).join('')}</ul>`
});
const REVIEWS=[
  ['수업','7기','비전공자인 나, 수업 따라갈 수 있을까?','처음 2주는 용어부터 낯설었어요. 그래도 기초부터 차근차근 가니까 한 달쯤 지나서는 코드가 읽히기 시작했어요.','7기 수료생 · 비전공'],
  ['프로젝트','7기','기업 연계 프로젝트, 팀 갈등은 이렇게 풀었어요','역할이 겹치면서 처음엔 부딪혔어요. 매일 아침 10분씩 할 일을 나누는 회의를 하고 나서 훨씬 편해졌어요.','7기 수료생 · 전공'],
  ['생활','6기','타지에서 와서 방 구한 이야기','학교에서 조금 떨어진 곳에 방을 구했는데, 생각보다 걸어 다닐 만했어요. 월세 지원 조건은 미리 확인했어요.','6기 수료생 · 타지 출신'],
  ['수업','6기','AI 모델링 수업, 솔직히 어려웠던 점','수식이 나오면 막혔는데, 옆자리 동기들이랑 같이 복습하면서 버텼어요. 질문하는 게 제일 빠른 길이었어요.','6기 수료생 · 비전공'],
  ['프로젝트','6기','멘토링이 결과물을 바꾼 순간','현직 멘토님이 기능을 줄이라고 하셨을 때 처음엔 아쉬웠는데, 덕분에 끝까지 완성할 수 있었어요.','6기 수료생 · 전공'],
  ['생활','7기','점심은 이렇게 해결했어요','혼밥할 때와 팀이랑 같이 먹을 때 가는 곳을 나눠 두니까 고민이 줄었어요.','7기 수료생 · 타지 출신'],
  ['수업','3~5기','특강과 기업탐방에서 얻은 것','현업 이야기를 직접 들으니까 어떤 직무로 갈지 방향이 잡혔어요.','5기 수료생 · 전공'],
  ['프로젝트','3~5기','내향적인 내가 팀장을 맡았던 6개월','말수가 적은 편인데, 정리하는 역할부터 맡다 보니 자연스럽게 팀장이 됐어요.','4기 수료생 · 비전공'],
  ['생활','6기','6개월 동안 지원금 계획 세운 방법','첫 달에 생활비 계획을 세워 두니 마음이 편했어요. 조건은 매 기수 달라서 공고를 꼭 확인했어요.','6기 수료생 · 타지 출신']
];
function StoriesReviews(){
  return StoriesHero('선배 후기') + `
  <div class="wrap">
    <section class="v3-sec" aria-labelledby="h-reviews">
      ${SecHead('01','h-reviews','선배 후기','주제와 기수로 골라 볼 수 있어요. 아쉬웠던 점도 그대로 남겨요.')}
      <div class="rv-filters rv">
        <div class="rv-fgroup" role="group" aria-label="기수"><span>기수</span>${[['all','전체'],['7기','7기'],['6기','6기'],['3~5기','3~5기']].map(([k,l],i)=>`<button type="button" data-gen-f="${k}" aria-pressed="${i===0}">${l}</button>`).join('')}</div>
        <div class="rv-fgroup" role="group" aria-label="주제"><span>주제</span>${[['all','전체'],['수업','수업'],['생활','생활'],['프로젝트','프로젝트']].map(([k,l],i)=>`<button type="button" data-topic-f="${k}" aria-pressed="${i===0}">${l}</button>`).join('')}</div>
      </div>
      <p class="rv-meta rv"><b id="rvCount"></b> · 지금은 레이아웃 확인용 예시 후기예요 ${TBD('실제 후기로 교체')}</p>
      <ul class="rv-grid" id="rvGrid">
        ${REVIEWS.map(([t,g,title,ex,who])=>`<li class="rv-card" data-topic="${t}" data-gen="${g}">
          <p class="rv-tags"><span class="rv-gen">${g}</span><span class="rv-topic">#${t}</span></p>
          <h3>${title}</h3>
          <p class="rv-ex">${ex}</p>
          <p class="rv-foot"><span>${who} ${TBD('예시')}</span><a href="#review" data-toast="후기 상세 페이지는 준비 중이에요">읽기 ${ICON.arrow}</a></p>
        </li>`).join('')}
      </ul>
      <p class="rv-empty" id="rvEmpty" hidden>이 조건에 맞는 후기가 아직 없어요.</p>
      <aside class="rv-note rv"><span class="chk-notice-ico" aria-hidden="true">!</span><p>후기에 나온 지원금·혜택·일정은 작성 당시 기준이라 지금과 다를 수 있어요. 최신 조건은 <a class="text-link" href="#/check/benefits">지원 혜택</a>에서 확인해 주세요.</p></aside>
    </section>
  </div>
  ${NextCards([['선배들의 이야기','선배 인터뷰','글 · 영상으로 만나는 선배','#/stories/interviews'],['선배들의 이야기','기수별 이모저모','7기 · 6기 · 3~5기','#/stories/cohorts'],['지원 전 체크','자주 묻는 질문','사소하지만 궁금한 것들','#/check/faq']])}`;
}
const INTERVIEWS=[
  ['글','비전공자에서 AI 개발자로, 6개월 동안 바뀐 것','7기 수료생 · 취업','tips.iv.1'],
  ['영상','팀 프로젝트로 창업까지 이어진 이야기','6기 수료생 · 창업','tips.iv.2'],
  ['글','인턴십에서 배운 눈높이 조정','6기 수료생 · 인턴십','tips.iv.3'],
  ['영상','타지에서 온 선배의 광주 정착기','7기 수료생 · 타지 출신','tips.iv.4'],
  ['글','스타트업 취업, 기대와 현실 사이','5기 수료생 · 취업','tips.iv.5'],
  ['글','팀장이 처음이었던 선배의 6개월','7기 수료생 · 전공','tips.iv.6']
];
function StoriesInterviews(){
  return StoriesHero('선배 인터뷰') + `
  <div class="wrap">
    <section class="v3-sec" aria-labelledby="h-iv1">
      ${SecHead('01','h-iv1','이번 달 인터뷰','서포터즈 블로그 인터뷰에서 골라 소개해요.')}
      <article class="iv-feature rv">
        <a class="iv-video" href="#play" data-toast="인터뷰 영상은 준비 중이에요" aria-label="인터뷰 영상 재생">
          ${Photo({slot:'iv.feature',ratio:'16/9',guide:'수료생 인터뷰 영상 썸네일',alt:'인터뷰 영상 썸네일',reveal:false})}
          <span class="iv-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
        </a>
        <div class="iv-text">
          <p class="iv-kicker">INTERVIEW · 영상</p>
          <h3>“처음엔 코드 한 줄도 몰랐는데, 마지막엔 팀 서비스를 발표하고 있었어요.”</h3>
          <p class="iv-who">7기 수료생 · 비전공 ${TBD('예시')}</p>
          <p class="muted">수업 적응, 팀 프로젝트, 수료 후 진로까지 한 번에 들어 봤어요.</p>
          <a class="rc-link" href="#interview" data-toast="인터뷰 전문은 준비 중이에요">인터뷰 전문 보기 ${ICON.arrow}</a>
        </div>
      </article>
      <p class="basis rv" style="margin-top:12px">인터뷰는 본인 동의를 받아 게시하며, 서포터즈 블로그 글에서 발췌할 예정이에요.</p>
    </section>
    <section class="v3-sec" aria-labelledby="h-iv2">
      ${SecHead('02','h-iv2','인터뷰 모아보기','글로 읽는 인터뷰와 영상 인터뷰를 함께 모았어요.')}
      <ul class="iv-grid">
        ${INTERVIEWS.map(([k,t,w,slot])=>`<li class="iv-card rv">
          <a href="#interview" data-toast="인터뷰 상세 페이지는 준비 중이에요">
            <div class="iv-thumb">${Photo({slot,ratio:'4/3',guide:'인터뷰 썸네일',alt:`${t} 썸네일`,reveal:false})}<span class="iv-kind">${k}</span></div>
            <div class="iv-body"><h3>${t}</h3><p>${w} ${TBD('예시')}</p></div>
          </a>
        </li>`).join('')}
      </ul>
    </section>
  </div>
  ${NextCards([['선배들의 이야기','선배 후기','수업 · 생활 · 프로젝트','#/stories/reviews'],['선배들의 이야기','기수별 이모저모','7기 · 6기 · 3~5기','#/stories/cohorts'],['인사교 알아보기','취업·창업 지원','라운지 · 컨설팅 · 모의 면접','#/about/career']])}`;
}
const COHORTS=[
  {id:'7', label:'7기', title:'2026 · 7기', desc:'교육과정이 크게 바뀐 기수예요. 모든 수업이 오프라인으로 진행되고, 최종 프로젝트 지원이 확대됐어요.', chips:['전면 오프라인','최종 프로젝트 지원 확대','현직 멘토 매칭'], photos:()=>[ARCHIVE_IMG.cheer, ARCHIVE_IMG.team, IMAGES['fac.project']]},
  {id:'6', label:'6기', title:'6기', desc:'[6기 소개 문구] 7기 개편 직전 기수로, 기업 연계 프로젝트와 인턴십 연계 이야기를 모았어요.', chips:['기업 연계 프로젝트','인턴십 연계'], photos:()=>[ARCHIVE_IMG.team, ARCHIVE_IMG.cafe, ARCHIVE_IMG.entrance]},
  {id:'35', label:'3~5기', title:'3~5기', desc:'기존에 남아 있는 자료로 기록을 모아 둔 기수예요. 사진과 후기가 확인되는 대로 채워 갈게요.', chips:['기존 자료 아카이브'], photos:()=>[ARCHIVE_IMG.entrance, IMAGES['dir.building'], ARCHIVE_IMG.map]}
];
function StoriesCohorts(){
  return StoriesHero('기수별 이모저모') + `
  <div class="wrap">
    <section class="v3-sec fl" aria-labelledby="h-cohort">
      ${SecHead('01','h-cohort','기수별 기록','왼쪽에서 기수를 고르면 그 기수의 이야기를 볼 수 있어요.')}
      <div class="fl-grid">
        <aside class="fl-side rv" aria-label="기수 선택">
          <p class="fl-side-cap">기수를 선택하세요</p>
          <div class="fl-tabs" role="tablist" aria-orientation="vertical" aria-label="기수">
            ${COHORTS.map((c,i)=>`<button type="button" role="tab" id="fltab-${c.id}" aria-controls="floor-${c.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">
              <span class="fl-tab-badge">${c.label}</span>
              <span class="fl-tab-txt"><strong>${c.title}</strong><small>${c.chips[0]}</small></span>
            </button>`).join('')}
          </div>
        </aside>
        <div class="fl-body">
          <div class="fl-scroll" id="flScroll" tabindex="0" aria-label="선택한 기수의 기록">
          ${COHORTS.map((c,i)=>`<div class="fl-group" id="floor-${c.id}" role="tabpanel" aria-labelledby="fltab-${c.id}"${i?' hidden':''}>
            <div class="fl-ghead"><span class="fl-badge">${c.label}</span><div><h3>${c.title}</h3><p>${c.desc}</p></div></div>
            <div class="ch-facts"><div><small>교육 기간</small><b>[0000.00 ~ 0000.00]</b></div><div><small>수료 인원</small><b>[00명]</b></div><div><small>대표 프로젝트</small><b>[프로젝트명]</b></div></div>
            <p class="ch-facts-note">${TBD('기수 정보 확인')}</p>
            <ul class="ch-chips">${c.chips.map(x=>`<li>${x}</li>`).join('')}</ul>
            <div class="ch-photos">${c.photos().map((src,k)=>`<figure class="ch-ph${k===0?' big':''}"><img src="${src}" alt="${c.label} 활동 사진" loading="lazy"></figure>`).join('')}</div>
            <h4 class="ch-h">이 기수의 이야기</h4>
            <ul class="ch-links">
              <li><a href="#/stories/reviews"><span>후기</span>${c.label} 선배 후기 모아 보기 ${ICON.arrow}</a></li>
              <li><a href="#/stories/interviews"><span>인터뷰</span>${c.label} 선배 인터뷰 보기 ${ICON.arrow}</a></li>
              <li><a href="#/about/activity"><span>활동</span>특강 · 현장학습 · 프로젝트 기록 ${ICON.arrow}</a></li>
            </ul>
          </div>`).join('')}
          </div>
          <p class="fl-more" aria-hidden="true">아래로 스크롤하면 더 볼 수 있어요 ↓</p>
        </div>
      </div>
    </section>
  </div>
  ${NextCards([['선배들의 이야기','선배 후기','수업 · 생활 · 프로젝트','#/stories/reviews'],['선배들의 이야기','선배 인터뷰','글 · 영상으로 만나는 선배','#/stories/interviews'],['인사교 라이프','시설 둘러보기','강의실부터 구내식당까지','#/life/facilities']])}`;
}
Pages.stories = (sub) => {
  const map={reviews:StoriesReviews, interviews:StoriesInterviews, cohorts:StoriesCohorts};
  return (map[sub]||StoriesReviews)() + CatBar('stories');
};

Pages.life = (sub) => {
  const map = { facilities:LifeFacilities, tips:LifeTips, directions:LifeDirections };
  return (map[sub] || LifeFacilities)() + CatBar('life');
};

/* 3.1 시설 둘러보기 */
const FLOORS = [
  {id:'1', label:'1F', title:'정문·공용 공간', desc:'건물에 들어오면 처음 만나는 층이에요.', items:['entrance','cafe']},
  {id:'23', label:'2·3F', title:'교육장', desc:'하루 대부분을 보내는 층이에요. 2층과 3층은 같은 구성이에요.', items:['classroom','lounge','project']},
  {id:'8', label:'8F', title:'구내식당', desc:'점심은 이 층에서 먹어요.', items:['cafeteria']}
];
const FLOOR_OF = {}; FLOORS.forEach(g=>g.items.forEach(id=>FLOOR_OF[id]=g));
const PHOTO_EX = {};
function FloorSvg(){
  const slabs=[['8','8F',38],['47','4~7F',86],['3','3F',134],['2','2F',182],['1','1F',230]], cx=170;
  return `<svg viewBox="0 0 300 290" role="img" aria-label="층별 안내도">
    ${slabs.map(([f,l,y])=>`<g class="fl-slab" data-floor="${f}">
      <polygon class="side" points="${cx-92},${y} ${cx},${y+30} ${cx},${y+40} ${cx-92},${y+10}"/>
      <polygon class="side r" points="${cx},${y+30} ${cx+92},${y} ${cx+92},${y+10} ${cx},${y+40}"/>
      <polygon class="top" points="${cx},${y-30} ${cx+92},${y} ${cx},${y+30} ${cx-92},${y}"/>
      <text x="30" y="${y+6}">${l}</text></g>`).join('')}
  </svg>`;
}
function FacCard(f){
  const g=FLOOR_OF[f.id];
  return `<article class="fc rv" id="fac-${f.id}" aria-labelledby="h-${f.id}">
    <div class="fc-media">${Photo({slot:`fac.${f.id}`,ratio:'4/3',guide:f.guide,tone:f.tone,alt:`${f.name} 전경`,reveal:false})}${PHOTO_EX[f.id]?'<span class="fc-ex">사진 예시</span>':''}</div>
    <div class="fc-body">
      <p class="fc-en" aria-hidden="true">${f.word}</p>
      <h4 id="h-${f.id}">${f.name}${f.check?TBD(f.check):''}</h4>
      <p class="fc-desc">${f.desc}</p>
      <p class="fc-label">여기서 하는 일</p>
      <ul class="fc-do">${f.chips.map(c=>`<li>${c}</li>`).join('')}</ul>
      <p class="fc-floor"><span class="mini" aria-hidden="true">${MINI.pin}</span>위치 <b>${g?g.label:'[층]'}</b> ${TBD('층 확인')}</p>
    </div>
  </article>`;
}
const LifeHeroV3 = (tab) => ThemeHero({
  num:'03', label:'인사교 라이프', crumbs:`홈 › 인사교 라이프 › <b>${tab}</b>`,
  title:'인사교 <em class="t-ol">Real Life</em>', en:'', desc:'',
  extra:`<ul class="t-chips t-chips-lg rv" aria-label="키워드">${['인사교','내부','근처','뭐가','있을까'].map(t=>`<li><span>#${t}</span></li>`).join('')}</ul>`
});
function LifeFacilities(){
  const F=id=>FACILITIES.find(x=>x.id===id);
  return LifeHeroV3('시설 둘러보기') + `
  <div class="wrap">
    <section class="v3-sec fl" aria-labelledby="h-floors">
      ${SecHead('01','h-floors','층별·공간별 안내',`광주광역시 동구 제봉로 92. 왼쪽에서 층을 고르면 그 층의 공간을 볼 수 있어요. ${TBD('층 정보 운영사 확인')}`)}
      <div class="fl-grid">
        <aside class="fl-side rv" aria-label="층 선택">
          <p class="fl-side-cap">층을 선택하세요</p>
          <div class="fl-tabs" role="tablist" aria-orientation="vertical" aria-label="층별 공간">
            ${FLOORS.map((g,i)=>`<button type="button" role="tab" id="fltab-${g.id}" aria-controls="floor-${g.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">
              <span class="fl-tab-badge">${g.label}</span>
              <span class="fl-tab-txt"><strong>${g.title}</strong><small>${g.items.map(id=>F(id).name).join(' · ')}</small></span>
            </button>`).join('')}
          </div>
        </aside>
        <div class="fl-body">
          <div class="fl-scroll" id="flScroll" tabindex="0" aria-label="선택한 층의 공간 목록">
          ${FLOORS.map((g,i)=>`<div class="fl-group" id="floor-${g.id}" data-floor="${g.id}" role="tabpanel" aria-labelledby="fltab-${g.id}"${i?' hidden':''}>
            <div class="fl-ghead rv"><span class="fl-badge">${g.label}</span><div><h3>${g.title}</h3><p>${g.desc}</p></div></div>
            ${g.items.map(id=>FacCard(F(id))).join('')}
          </div>`).join('')}
          </div>
          <p class="fl-more" aria-hidden="true">아래로 스크롤하면 더 볼 수 있어요 ↓</p>
        </div>
      </div>
    </section>
    <p class="review-link v3-review rv">써 본 느낌은 매일 쓴 선배들이 제일 잘 알아요. 이용 후기는 선배 후기에 모아뒀어요. <a class="text-link" href="#/stories/reviews">선배 후기 보러 가기 ${ICON.arrow}</a></p>
  </div>
  ${NextCards([['인사교 라이프','생활 꿀팁','주거 · 근처 식당 · 문화·여가','#/life/tips'],['선배들의 이야기','선배 후기','생활 · 공간을 써 본 이야기','#/stories/reviews'],['인사교 라이프','오시는 길','주소 · 교통 · 주차','#/life/directions']])}`;
}

/* 3.2 생활 꿀팁 */
function LifeTips(){
  const PLACES=[
    ['1','국립아시아문화전당(ACC)','전시 · 공연','[도보 00분]','전시, 공연, 라이브러리가 한곳에 모여 있어요. 야외 공간이 넓어서 그냥 걷기만 해도 머리가 맑아져요.','tips.culture.1',205,140],
    ['2','5·18 민주광장','광장 · 산책','[도보 00분]','분수대 앞에서 한숨 돌리기 좋아요. 시기별로 광장에서 행사가 열리기도 해요.','tips.culture.5',300,135],
    ['3','충장로','거리 · 구경','[도보 00분]','구경하다 보면 운 좋게 버스킹을 만나기도 해요. 충장 축제도 이 일대에서 열려요.','tips.culture.3',150,255],
    ['4','동리단길','골목 · 카페','[도보 00분]','카페와 소품숍, 식당이 모여 있는 골목이에요. 천천히 걸으며 구경하기 좋아요.','tips.culture.7',370,95],
    ['5','푸른길','산책 · 러닝','[도보 00분]','도심 속에서 나무 그늘 아래를 걸을 수 있는 산책길이에요. 머리를 식히고 싶을 때 걸어 보세요.','tips.culture.8',390,285]
  ];
  return LifeHeroV3('생활 꿀팁') + `
  <nav class="pg-nav" aria-label="생활 꿀팁 목차"><div class="wrap">
    ${[['tip-housing','01','주거'],['tip-food','02','근처 식당'],['tip-culture','03','문화·여가']].map(([id,n,l],k)=>`<button type="button" data-jump="${id}"${k===0?' class="is-active"':''}><b>${n}</b>${l}</button>`).join('')}
  </div></nav>
  <div class="wrap">
    <section class="v3-sec" id="tip-housing" aria-labelledby="h-housing">
      ${SecHead('01','h-housing','주거','제일 많이 받는 질문 1위예요. 동네 분위기만 먼저 감 잡고 가세요. 위치는 동 단위로만 알려드려요.')}
      <h3 class="sub-h rv"><span>01</span>동네 비교 ${TBD('선배 설문 후 확정')}</h3>
      <div class="area3 rv" id="areaMap">
        <div class="area-map">
              <svg viewBox="0 0 500 500" role="img" aria-label="인사교를 중심으로 한 주거 지역 A, B, C 개념도">
                <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="var(--line)" stroke-width="1" opacity=".7"/></pattern></defs>
                <rect width="500" height="500" fill="url(#grid)"/>
                <g fill="none" stroke-linecap="round">
                  <path d="M60 -10 C 90 150, 110 330, 95 510" stroke="var(--line)" stroke-width="7"/>
                  <path d="M-10 110 C 150 135, 330 120, 510 75" stroke="var(--line)" stroke-width="7"/>
                  <path d="M232 -10 L 272 510" stroke="color-mix(in srgb,var(--graphite) 45%,var(--line))" stroke-width="10"/>
                  <path d="M-10 290 L 510 222" stroke="color-mix(in srgb,var(--graphite) 45%,var(--line))" stroke-width="10"/>
                </g>
                <text x="438" y="214" font-size="12" fill="var(--graphite)" font-family="Paperlogy, sans-serif">제봉로</text>
                <g class="area-zones">
                  <circle class="zone" data-area="a" cx="150" cy="175" r="68"/>
                  <circle class="zone" data-area="b" cx="372" cy="150" r="78"/>
                  <circle class="zone" data-area="c" cx="165" cy="400" r="84"/>
                </g>
                <g class="area-pins" font-family="Paperlogy, sans-serif">
                  ${[['a',150,175],['b',372,150],['c',165,400]].map(([k,x,y])=>`<g class="pin" data-area="${k}" transform="translate(${x} ${y})"><circle r="14"/><text y="4.5" text-anchor="middle" font-size="13" font-weight="700">${k.toUpperCase()}</text></g>`).join('')}
                </g>
                <g transform="translate(252 256)" font-family="Paperlogy, sans-serif">
                  <circle r="17" fill="var(--ink)"/><text y="4.5" text-anchor="middle" font-size="12" font-weight="700" fill="var(--paper)">AI</text>
                  <rect x="24" y="-13" width="58" height="26" rx="5" fill="var(--surface)" stroke="var(--line)"/>
                  <text x="53" y="4.5" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--ink)">인사교</text>
                </g>
              </svg>
              <span class="map-note">개념도예요. 실제 지도로 교체 예정 ${TBD()}</span>
            </div>
        <div class="area3-table">
          <div class="area3-head" aria-hidden="true"><span>동네</span><span>교육장까지</span></div>
          <ol class="area-list area3-list">
            ${[
              ['a','대학교 주변 원룸가','학교와 가까운 원룸이 모여 있는 곳이에요. 늦게까지 남아 공부하는 날에도 부담이 적어요.','[도보 5~10분]'],
              ['b','동명동 인근','카페와 식당이 많아 생활이 편하고 밤에도 비교적 밝은 편이에요. 대신 주말엔 사람이 많아 붐빌 수 있어요.','[도보 10~15분]'],
              ['c','금남로 근처','충장로, 5·18 민주광장과 가까운 번화가 쪽이에요. 퇴근 후 시내를 걸어 다니기 편해요.','[도보 15~20분]']
            ].map(([k,t,d,w],n)=>`<li class="area-item${n===0?' is-active':''}" data-area="${k}">
              <button type="button" class="area-btn" aria-pressed="${n===0}"><span class="area-badge" aria-hidden="true">${k.toUpperCase()}</span><span class="area3-main"><span class="area-name"><span class="sr-only">${k.toUpperCase()}지역 </span>${t}</span><small>${d}</small></span><span class="area-walk">${w}</span></button>
            </li>`).join('')}
          </ol>
        </div>
      </div>
      <p class="basis rv" style="margin-top:12px">지역은 동 단위 범위로만 안내하고, 특정 건물·매물은 소개하지 않아요.</p>

      <h3 class="sub-h rv"><span>02</span>월세 지원금 받을 때 확인할 점</h3>
      <div class="rent3 rv" id="rent-support">
        <article class="rc rc-key"><small>지원 혜택</small><h4>월세 지원금</h4><p>광주 외 지역에서 온 교육생이 받을 수 있어요. 금액과 조건은 지원 혜택에 한곳으로 모아뒀어요.</p><a class="rc-link" href="#/check/benefits">지원 금액 보기 ${ICON.arrow}</a></article>
        <article class="rc"><small>확인 01</small><h4>주민등록상 주소지가 타 지역이어야 해요</h4><p>주민등록상 거주지가 광주가 아닌 다른 지역인 경우에 지원 대상이 돼요. 전입신고를 광주로 옮기기 전에 꼭 확인하세요.</p></article>
        <article class="rc"><small>확인 02</small><h4>다른 정부지원사업 중복 수급 여부를 문의하세요</h4><p>실업급여, 국민취업지원제도 등에 참여 중이라면 해당 기관에 중복 수급이 가능한지 먼저 문의해야 해요.</p></article>
      </div>
      <p class="basis rv" style="margin-top:12px">※ 세부 기준은 기수별 모집 공고를 따라요. 실제로 받아 본 이야기는 <a class="text-link" href="#/stories/reviews">선배 후기</a>에서 볼 수 있어요.</p>
    </section>

    <section class="v3-sec" id="tip-food" aria-labelledby="h-food">
      ${SecHead('02','h-food','근처 식당','구내식당 말고 가끔 나가서 먹고 싶을 때를 위해 모았어요. 여러 곳을 함께 소개하고, 특정 가게를 추천하지는 않아요.')}
      <div class="food-bar food3-bar rv">
        <p class="basis" style="margin:0">상황별로 골라보세요. 선배들이 실제로 자주 갔던 곳 위주로 채울 예정이에요. ${TBD('서포터즈 작성 예정')}</p>
        <div class="food-tabs" role="tablist" aria-label="식당 분류">
          ${[['all','전체'],['solo','혼밥'],['group','다같이'],['cafe','카페']].map(([k,l],n)=>`<button type="button" role="tab" data-filter="${k}" aria-selected="${n===0}" aria-controls="foodGrid">${l}</button>`).join('')}
        </div>
      </div>
      <ul class="food-grid food3" id="foodGrid" role="tabpanel" aria-live="polite">
        ${[
          ['solo','혼밥 · 한식 백반','학교 앞 백반집','[도보 3분]','반찬이 매일 바뀌어요. 조금 일찍 가면 대기 없이 이용할 수 있어요.','7기 수료생','tips.food.1','warm','한식 백반'],
          ['solo','혼밥 · 분식','골목 김밥·분식','[도보 5분]','포장이 가능해서 쉬는 시간에 이용하기 편해요.','6기 수료생','tips.food.2','','분식'],
          ['solo group','혼밥 · 다같이 · 국밥','뜨끈한 국밥집','[도보 8분]','1인분 양이 많은 편이에요.','7기 수료생','tips.food.3','warm','국밥'],
          ['group','다같이 · 양식','골목 파스타집','[도보 10분]','단체석이 있어 여럿이 방문하기 편해요.','6기 수료생','tips.food.4','','양식'],
          ['group','다같이 · 고기·구이','동네 고깃집','[도보 7분]','단체 방문이 가능한 곳이에요.','7기 수료생','tips.food.5','warm','고기·구이'],
          ['group','다같이 · 중식','오래된 중국집','[도보 6분]','원형 테이블 자리가 있어 인원이 많을 때 이용할 수 있어요.','6기 수료생','tips.food.6','cool','중식'],
          ['cafe','카페 · 작업하기 좋은','조용한 2층 카페','[도보 4분]','콘센트 자리가 많아요.','7기 수료생','tips.food.7','cool','카페 내부'],
          ['cafe','카페 · 테이크아웃','테이크아웃 커피','[도보 2분]','쉬는 시간 10분 안에 다녀올 수 있는 거리예요.','6기 수료생','tips.food.8','warm','테이크아웃 카페']
        ].map(([tags,cat,name,walk,quote,who,slot,tone,photo],n)=>`<li class="food" data-tags="${tags}">
          <div class="f3-ph">${Photo({slot,ratio:'1/1',tone,alt:`${name} 사진`,guide:`${photo} 실사 예정`,reveal:false})}</div>
          <div class="f3-body">
            <p class="f3-top"><span class="food-cat">${cat}</span></p>
            <h4>${name} <small>(가칭)</small></h4>
            <p class="f3-quote">“${quote}” <cite>${who} ${TBD('예시')}</cite></p>
          </div>
          <span class="f3-walk">${walk.replace(/[\[\]]/g,'')}</span>
        </li>`).join('')}
      </ul>
      <nav class="food-pager" id="foodPager" aria-label="식당 목록 페이지" hidden>
        <button type="button" class="fp-btn" id="fpPrev" aria-label="이전 페이지">${ICON.arrow}</button>
        <span class="fp-info" aria-live="polite"><b id="fpNow">1</b> / <span id="fpTotal">1</span></span>
        <button type="button" class="fp-btn" id="fpNext" aria-label="다음 페이지">${ICON.arrow}</button>
      </nav>
      <p class="basis rv" style="margin-top:16px">서포터즈 작성 · [작성 시점] 기준 · 영업시간과 메뉴는 바뀔 수 있어요.</p>
    </section>

    <section class="v3-sec" id="tip-culture" aria-labelledby="h-culture">
      ${SecHead('03','h-culture','문화·여가','인사교는 광주 구도심 한복판에 있어요. 수업 끝나고 조금만 걸으면 전시, 공연, 거리의 음악까지 다 닿아요.')}
      <h3 class="sub-h rv"><span>01</span>걸어서 갈 수 있는 곳 ${TBD('도보 시간 확인')}</h3>
      <div class="cmap rv" id="cultureMap">
        <div class="cmap-map">
          <svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="인사교 주변 문화·여가 장소 개념도">
            <defs><pattern id="cgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="var(--line)" stroke-width="1" opacity=".7"/></pattern></defs>
            <rect x="-300" y="-300" width="1100" height="1000" fill="url(#cgrid)"/>
            <circle cx="250" cy="200" r="95" fill="none" stroke="var(--ink)" stroke-opacity=".25" stroke-dasharray="5 6"/>
            <circle cx="250" cy="200" r="175" fill="none" stroke="var(--ink)" stroke-opacity=".18" stroke-dasharray="5 6"/>
            <text x="250" y="96" text-anchor="middle" class="cm-ring">도보 [5분]</text>
            <text x="250" y="18" text-anchor="middle" class="cm-ring">도보 [15분]</text>
            <g transform="translate(250 200)"><rect x="-38" y="-16" width="76" height="32" rx="6" fill="var(--c)" stroke="var(--ink)" stroke-width="2"/><text y="5" text-anchor="middle" class="cm-center">교육장</text></g>
            ${PLACES.map(([n,t,c,w,d,slot,x,y])=>`<g class="cm-pin" data-pl="${n}" transform="translate(${x} ${y})"><circle r="15"/><text y="5" text-anchor="middle">${n}</text><text class="cm-lbl" y="31" text-anchor="middle">${t.replace('국립아시아문화전당(ACC)','ACC')}</text></g>`).join('')}
          </svg>
          <span class="map-note">개념도예요. 실제 위치와 다를 수 있어요 ${TBD()}</span>
        </div>
        <div class="cmap-side"><div class="cmap-scroll" id="cmScroll" tabindex="0" aria-label="장소 목록">
        <ol class="cmap-list">
          ${PLACES.map(([n,t,c,w,d,slot],k)=>`<li class="cm-item${k===0?' is-active':''}" data-pl="${n}">
            <span class="cm-no" aria-hidden="true">${n}</span>
            <div class="cm-ph">${Photo({slot,ratio:'1/1',alt:`${t} 사진`,guide:`${t} 실사 예정`,reveal:false})}</div>
            <div class="cm-body"><p class="cm-top"><span class="cm-cat">${c}</span><span class="cm-walk">교육장에서 ${w}</span></p><h4>${t}</h4><p>${d}</p></div>
          </li>`).join('')}
        </ol>
        </div><p class="cm-more" aria-hidden="true">아래로 스크롤하면 더 볼 수 있어요 ↓</p></div>
      </div>
      <p class="basis rv" style="margin-top:12px">관람료·운영 시간·공연 일정은 방문 전에 각 장소의 공식 채널에서 확인해 주세요.</p>

      <h3 class="sub-h rv"><span>02</span>가벼운 산책 코스 ${TBD('코스 예시')}</h3>
      <div class="walk2 rv" id="walk">
        <div class="walk2-head"><strong>수업 끝! 한 바퀴 산책 코스</strong><span>총 [00분] · 저녁 먹기 전 복귀 가능</span></div>
        <ol class="walk2-stops">
          ${[['S','인사교','수업 끝, 가방 메고 출발',''],['1','ACC','야외 잔디에서 잠깐 멍 때리기','[도보 00분]'],['2','5·18 민주광장','분수대 앞에서 한숨 돌리기','[도보 00분]'],['3','충장로','구경하다 보면 운 좋게 버스킹','[도보 00분]'],['E','동명동','골목 카페에서 마무리','[도보 00분]']]
            .map(([n,t,d,m])=>`<li><span class="walk2-pt${n==='S'||n==='E'?' end':''}">${n}</span><strong>${t}</strong><span>${d}</span>${m?`<em>${m}</em>`:''}</li>`).join('')}
        </ol>
      </div>

      <div class="scenes">
        <h3 class="sub-h rv"><span>03</span>자만추 할 수 있는 풍경</h3>
        <p class="muted rv" style="margin:-6px 0 0">매일은 아니지만, 6개월 다니다 보면 한 번쯤은 꼭 마주쳐요.</p>
        <ul class="scene-grid">
          ${[
            ['tips.culture.2','충장 축제','충장로 일대에서 열리는 축제예요. 시기마다 열려서 일정은 미리 확인해 주세요.','warm','-1.6deg'],
            ['tips.culture.3','버스킹','거리 곳곳에서 노래가 들려요. 지나가다 괜히 멈춰 서게 돼요.','','1.2deg'],
            ['tips.culture.6','플리마켓','시기별로 열리는 플리마켓이에요. 구경하다 보면 시간 가는 줄 몰라요.','','-1.2deg']
          ].map(([slot,t,d,tone,tilt])=>`<li class="scene rv" style="--tilt:${tilt}">
            ${Photo({slot,ratio:'4/3',tone,alt:`${t} 풍경`,guide:`${t} 실사 예정`,reveal:false})}
            <h4>${t}</h4>
            <p>${d}</p>
          </li>`).join('')}
        </ul>
      </div>
    </section>

    <div class="tip-extra2">
      <p class="review-link v3-review rv">이용해 본 느낌과 후기는 선배 후기에서 볼 수 있어요. <a class="text-link" href="#/stories/reviews">선배 후기 보러 가기 ${ICON.arrow}</a></p>
      <p class="disclaimer">이 페이지의 주거·식당 정보는 참고용이에요. 특정 업소나 매물을 추천하지 않으며, 실제 조건은 직접 확인해 주세요.</p>
    </div>
  </div>
  ${NextCards([['인사교 라이프','오시는 길','주소 · 교통 · 주차','#/life/directions'],['선배들의 이야기','선배 후기','생활 · 공간을 써 본 이야기','#/stories/reviews'],['지원 전 체크','지원 혜택','월세 지원금 · 교육지원금','#/check/benefits']])}`;
}

function LifeDirections(){
  const mapSvg = `<svg viewBox="0 0 530 650" preserveAspectRatio="xMidYMid slice" role="img" aria-label="인공지능사관학교 주변 약도 (개념도)">
    <rect width="530" height="650" fill="var(--surface)"/>
    <g stroke="var(--line)" stroke-width="1" opacity=".75">
      ${[44,88,132,176,220,264,308,352,396,440,484,528,572,616].map(y=>`<path d="M0 ${y}H530"/>`).join('')}
      ${[44,88,132,176,220,264,308,352,396,440,484].map(x=>`<path d="M${x} 0V650"/>`).join('')}
    </g>
    <g fill="none" stroke-linecap="round">
      <path d="M0 215 C 140 237, 300 225, 530 185" stroke="var(--line)" stroke-width="12"/>
      <path d="M306 0 L 346 650" stroke="color-mix(in srgb,var(--graphite) 38%,var(--line))" stroke-width="14"/>
      <path d="M0 392 L 530 352" stroke="color-mix(in srgb,var(--graphite) 38%,var(--line))" stroke-width="14"/>
    </g>
    <rect x="54" y="78" width="160" height="129" rx="3" fill="color-mix(in srgb,var(--blue) 9%,transparent)" stroke="var(--blue)" stroke-width="1.4" stroke-dasharray="4 4"/>
    <text x="134" y="147" text-anchor="middle" class="m-lbl m-acc">ACC</text>
    <path d="M178 291 L 246 360" fill="none" stroke="var(--blue)" stroke-width="3.2" stroke-dasharray="7 6" stroke-linecap="round"/>
    <g>
      <circle cx="82" cy="271" r="14" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>
      <rect x="76" y="264" width="12" height="13" rx="3" fill="none" stroke="var(--ink)" stroke-width="1.6"/><path d="M78 271h8M79 280l-1 2M85 280l1 2" stroke="var(--ink)" stroke-width="1.4" fill="none"/>
      <rect x="103" y="258" width="127" height="26" rx="3" fill="var(--surface)" stroke="var(--line)"/><text x="166" y="275.5" text-anchor="middle" class="m-lbl">문화전당역 2번 출구</text>
    </g>
    <g>
      <circle cx="263" cy="372" r="17" fill="var(--ink)"/><text x="263" y="376.5" text-anchor="middle" class="m-lbl m-ai">AI</text>
      <rect x="287" y="359" width="116" height="28" rx="3" fill="var(--surface)" stroke="var(--line)"/><text x="345" y="377" text-anchor="middle" class="m-lbl" font-weight="700">인공지능사관학교</text>
    </g>
    <g>
      <circle cx="333" cy="435" r="14" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>
      <rect x="327" y="428" width="12" height="13" rx="3" fill="none" stroke="var(--ink)" stroke-width="1.6"/><path d="M329 435h8M330 444l-1 2M336 444l1 2" stroke="var(--ink)" stroke-width="1.4" fill="none"/>
      <rect x="354" y="422" width="94" height="26" rx="3" fill="var(--surface)" stroke="var(--line)"/><text x="401" y="439.5" text-anchor="middle" class="m-lbl">동구청 정류장</text>
    </g>
  </svg>`;
  const FAR_ICON = {
    train:'<svg viewBox="0 0 24 24"><rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 10.5h12M9 20.5l1.6-4M15 20.5l-1.6-4"/><circle cx="9.5" cy="13.6" r=".7" fill="currentColor"/><circle cx="14.5" cy="13.6" r=".7" fill="currentColor"/></svg>',
    bus:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="14" rx="3"/><path d="M5 11h14M8 21v-3M16 21v-3"/><circle cx="8.8" cy="14.7" r=".7" fill="currentColor"/><circle cx="15.2" cy="14.7" r=".7" fill="currentColor"/></svg>',
    plane:'<svg class="is-fill" viewBox="0 0 24 24"><path d="M21.5 15.4v-1.8L13.6 9V4.6a1.6 1.6 0 0 0-3.2 0V9L2.5 13.6v1.8l7.9-2.3v4.4l-2 1.5V21l3.6-1 3.6 1v-1.8l-2-1.5v-4.4z"/></svg>'
  };
  const END = ['광주광역시 동구 제봉로 92','대성학원 1~3층'];
  const FAR = [
    {en:'TRAIN', title:'KTX · SRT 이용', icon:'train', steps:[
      ['광주송정역 도착',['서울·수도권 및 전국 주요 지역에서','KTX·SRT 이용']],
      ['광주도시철도 1호선 탑승',['광주송정역 → 소태·녹동 방면','지하철 환승 없이 이동'],'문화전당역까지 약 24분'],
      ['문화전당역 하차',['문화전당(구도청)역 2번 출구','동구청·제봉로 방향 이동']],
      ['인공지능사관학교 도착',END]]},
    {en:'EXPRESS BUS', title:'고속·시외버스 이용', icon:'bus', steps:[
      ['유스퀘어 도착',['광주종합버스터미널(유스퀘어) 하차']],
      ['동구청 방면 이동',['동구청·문화전당 방향 시내버스 또는 택시 이용']],
      ['동구청 정류장 하차',['동구청 정류장 인근에서 제봉로 방향 이동']],
      ['인공지능사관학교 도착',END]]},
    {en:'AIRPORT', title:'광주공항 이용', icon:'plane', steps:[
      ['광주공항 도착',['공항에서 광주도시철도 공항역으로 이동']],
      ['지하철 1호선 탑승',['공항역 → 소태·녹동 방면','문화전당역까지 이동'],'지하철 약 20분'],
      ['문화전당역 하차',['2번 출구 → 동구청·제봉로 방향']],
      ['인공지능사관학교 도착',END]]}
  ];
  return LifeHeroV3('오시는 길') + `
  <div class="wrap">
    <section class="dir-top" aria-labelledby="h-addr">
      <div class="dir-left">
        <p class="dir-label rv">인공지능사관학교 주소</p>
        <h2 id="h-addr" class="dir-addr rv">광주광역시<br><mark>동구 제봉로 92</mark></h2>
        <p class="dir-sub rv"><span>대성학원 1~3층</span><i aria-hidden="true"></i><span>동구청 정류장 앞</span> ${TBD('층수 확인')}</p>
        <div class="dir-actions rv">
          <button class="btn-fill" type="button" id="copyAddr"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>주소 복사</button>
          <a class="btn-line" href="#kakao-map" data-toast="카카오맵 연결 주소는 확정 후 붙여요">카카오맵 ${ICON.out}</a>
          <a class="btn-line" href="#naver-map" data-toast="네이버 지도 연결 주소는 확정 후 붙여요">네이버 지도 ${ICON.out}</a>
        </div>
        ${Photo({slot:'dir.building',ratio:'3/2',alt:'인공지능사관학교가 있는 건물 외관',guide:'건물 외관, 낮 자연광',radius:'12px'})}
      </div>
      <div class="dir-map rv">${mapSvg}<span class="dir-note">개념도 · 실제 지도 삽입 예정</span></div>
    </section>

    <section class="way" aria-labelledby="h-transit">
      <div class="rv"><h2 id="h-transit">대중교통</h2><p>교육생 대부분은 버스나 지하철로 다녀요.</p></div>
      <div class="transit rv">
        <div><h3>지하철</h3><ul><li>광주 도시철도 [N호선] [OO역] 하차</li><li>[N번 출구]에서 도보 [N분]</li></ul></div>
        <div><h3>버스</h3><ul><li>[정류장명] 하차</li><li>[노선 번호] 운행</li></ul></div>
      </div>
    </section>

    <section class="way" aria-labelledby="h-parking">
      <div class="rv"><h2 id="h-parking">주차 안내</h2><p>방문객 기준 안내예요.</p></div>
      <div class="parking rv">
        <strong>교육생 전용 주차공간은 없어요.</strong>
        <p>차를 가져오는 방문객은 국립아시아문화전당(ACC), KT 등 주변 공영주차장을 이용해 주세요. 교육생은 대중교통 이용을 권장해요.</p>
      </div>
    </section>

    <section class="far" aria-labelledby="h-far">
      <div class="far-head rv"><h2 id="h-far">타지에서 오신다면</h2><p>KTX·SRT, 고속·시외버스, 비행기로 처음 광주에 올 때 가는 길이에요. ${TBD('소요 시간 확인')}</p></div>
      <div class="far-grid">
        ${FAR.map(c=>`<article class="far-card rv">
          <header><span class="far-ico" aria-hidden="true">${FAR_ICON[c.icon]}</span><div><p class="far-en">${c.en}</p><h3>${c.title}</h3></div></header>
          <ol class="far-steps">
            ${c.steps.map(([t,lines,badge],n)=>`<li><span class="far-no">${String(n+1).padStart(2,'0')}</span><b>${t}</b><p>${lines.join('<br>')}</p>${badge?`<span class="far-badge">${badge}</span>`:''}</li>`).join('')}
          </ol>
        </article>`).join('')}
      </div>
    </section>

    <div style="margin-top:clamp(72px,9vw,120px)"><p class="review-link rv">이용해 본 느낌과 후기는 선배 후기에서 볼 수 있어요. <a class="text-link" href="#/stories/reviews">선배 후기 보러 가기 ${ICON.arrow}</a></p></div>
    ${Pager('life','directions')}
    <div style="height:clamp(72px,9vw,120px)"></div>
  </div>`;
}


/* ---------- 4. 지원 전 체크 (원페이지 + 앵커) ---------- */
const CHK_TODO = [
  '만 18~39세 이하예요',
  '지금 미취업 상태예요',
  '4학년이거나, 졸업 예정자 또는 졸업 유예자예요',
  '6개월 동안 평일 매일 광주 교육장으로 출석할 수 있어요',
  '다른 정부지원사업에 참여 중이 아니에요 (참여 중이라면 해당 기관에 먼저 문의했어요)'
];
const BEN_ICON = {
  money:'<svg viewBox="0 0 64 64"><rect x="8" y="14" width="40" height="26" rx="3"/><circle cx="28" cy="27" r="6"/><path d="M14 22h.01M42 32h.01"/><path class="b" d="M16 46h36a3 3 0 0 0 3-3V26"/></svg>',
  coins:'<svg viewBox="0 0 64 64"><ellipse cx="26" cy="15" rx="15" ry="6"/><path d="M11 15v11c0 3.3 6.7 6 15 6s15-2.7 15-6V15M11 26v11c0 3.3 6.7 6 15 6"/><circle class="b" cx="44" cy="43" r="11"/><path class="b" d="M44 37v12M39.5 41h9M39.5 46h9"/></svg>',
  laptop:'<svg viewBox="0 0 64 64"><rect x="30" y="10" width="27" height="19" rx="2"/><rect x="8" y="30" width="32" height="21" rx="2"/><path d="M4 55h40M43.5 29v6"/><path class="b" d="M17 41l5 5 9-9"/></svg>',
  book:'<svg viewBox="0 0 64 64"><path d="M6 13h21c3 0 5 2 5 5v35c0-3-2-5-5-5H6z"/><path d="M58 13H37c-3 0-5 2-5 5v35c0-3 2-5 5-5h21z"/><path d="M12 23h14M12 31h14M12 39h9"/><path class="b" d="M38 23h14M38 31h14M38 39h9"/></svg>',
  people:'<svg viewBox="0 0 64 64"><circle cx="20" cy="26" r="7.5"/><path d="M6 53c0-8.5 6-14 14-14s14 5.5 14 14"/><circle class="b" cx="43" cy="30" r="6"/><path class="b" d="M35 53c0-6.5 3.5-11 8-11s8 4.500 8 11"/><path class="b" d="M31 12l4-4 4 4"/></svg>',
  brief:'<svg viewBox="0 0 64 64"><rect x="7" y="22" width="50" height="31" rx="3"/><path d="M23 22v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M7 37h50"/><rect class="b" x="28" y="32" width="8" height="9" rx="1.5"/></svg>',
  chart:'<svg viewBox="0 0 64 64"><path d="M8 54h48"/><rect x="13" y="39" width="9" height="15"/><rect x="28" y="29" width="9" height="25"/><rect x="43" y="19" width="9" height="35"/><path class="b" d="M11 27l13-10 10 8 18-14M43 11h9v9"/></svg>',
  cert:'<svg viewBox="0 0 64 64"><rect x="7" y="11" width="42" height="32" rx="3"/><path d="M15 21h26M15 29h17"/><circle class="b" cx="46" cy="43" r="8.5"/><path class="b" d="M41.500 50l-2 10 6.500-3.500 6.500 3.500-2-10"/></svg>'
};
const BENEFITS = [
  ['money','교육지원금','교육지원금 <b>최대 50만원</b> 지원','<small>광주 시외 거주자가 광주 시내로 거주지를 이동한 경우 주거지원비 <b>최대 35만원</b> 추가 지원</small>'],
  ['coins','프로젝트 지원금','프로젝트 기간 동안 쾌적하게 진행할 수 있도록 <b>지원금</b>을 제공해요.'],
  ['laptop','개별 노트북 지원','교육 기간 동안 사용할 수 있는 <b>개별 노트북과 모니터</b>를 대여해요.'],
  ['book','교재 및 실습 자료 제공','수업을 위한 교재와 실습 자료를 <b>무료</b>로 제공해요.'],
  ['people','프로젝트 전문 지원','완성도 높은 결과물을 낼 수 있도록 <b>현직 멘토</b>를 매칭해요.'],
  ['brief','인턴십 기회 제공','우수 교육생으로 수료하면 <b>이스트소프트 인턴십</b> 기회를 제공해요.'],
  ['chart','취·창업 지원','교육생의 취업과 창업을 <b>전문가와 함께</b> 지원해요.'],
  ['cert','자격증 취득 지원','<b>AI·IT·SW 자격증</b>을 취득할 수 있도록 지원해요.']
];
const FAQ_CATS = ['준비사항','수업','생활','지원금','프로젝트'];
const FAQ = [
  ['준비사항','비전공자인데 수업을 따라갈 수 있을까요?','전공은 지원 자격에 해당하지 않아서 비전공자도 지원할 수 있어요. 수업은 AI 기초 역량부터 단계적으로 진행해요. 비전공자로 시작한 선배들의 이야기는 <a class="text-link" href="#/stories/reviews">선배 후기</a>에서 볼 수 있어요.'],
  ['준비사항','코딩 테스트를 꼭 봐야 하나요?','AI 관련 역량을 검증할 수 있는 포트폴리오를 제출하면 코딩 테스트가 면제돼요. 포트폴리오가 없다면 서류 지원이 확인된 뒤 기본적인 AI 지식과 역량을 확인하는 코딩 테스트를 진행해요. 자세한 순서는 <a class="text-link" href="#/check/schedule">모집 프로세스</a>에서 확인해 주세요.'],
  ['준비사항','지원 전에 미리 공부해 둘 게 있나요?','[사전 학습 권장 사항 안내] '+TBD('확인 필요')],
  ['수업','수업은 온라인인가요, 오프라인인가요?','7기부터는 모든 수업이 오프라인으로 진행돼요. 교육 시간과 운영 방식은 <a class="text-link" href="#/about/learn">인사교 알아보기</a>에서 볼 수 있어요.'],
  ['수업','수업은 정시에 끝나나요?','하루 일과는 <a class="text-link" href="#/about/learn">인사교의 하루</a>에서 볼 수 있어요. 실제 종료 시간은 [확인 필요] '+TBD('시간 확인')],
  ['수업','수업은 어떤 방식으로 진행되나요?','팀 기반 실무 프로젝트(PBL)를 중심으로, 토론식 수업과 팀별 실습, 발표 활동 등 다양한 방식으로 진행해요.'],
  ['생활','점심은 어디서 먹나요?','학교 근처 식당을 이용하는 선배들이 많아요. 혼밥, 같이 먹기, 카페로 나눠 정리한 <a class="text-link" href="#/life/tips">근처 식당</a> 정보를 참고해 주세요. 식비 지원 여부는 [확인 필요] '+TBD('확인 필요')],
  ['생활','타지인데 방은 어디서 구하나요?','교육생 절반은 다른 지역에서 와요. 지역별 분위기는 <a class="text-link" href="#/life/tips">생활 꿀팁의 주거</a>에서, 월세 지원 조건은 <a class="text-link" href="#/check/benefits">지원 혜택</a>에서 확인해 주세요.'],
  ['생활','내향적인 편인데 적응할 수 있을까요?','팀으로 함께 만드는 수업이 많아요. 처음엔 낯설었지만 적응했다는 선배들의 이야기는 <a class="text-link" href="#/stories/reviews">선배 후기</a>에서 볼 수 있어요.'],
  ['지원금','지원금은 얼마나 받을 수 있나요?','교육지원금, 프로젝트 지원금 등 지원 내용은 <a class="text-link" href="#/check/benefits">지원 혜택</a>에서 확인해 주세요. 금액과 조건은 모집 회차에 따라 달라질 수 있어요.'],
  ['지원금','지원금은 따로 신청해야 하나요?','[지급 조건·신청 방법 안내] '+TBD('확인 필요')],
  ['프로젝트','프로젝트 팀은 어떻게 구성되나요?','[팀 구성 방식 안내] '+TBD('확인 필요')+' 프로젝트마다 현직 멘토를 매칭해요.'],
  ['프로젝트','팀원과 갈등이 생기면 어떻게 하나요?','[갈등 조정 방식 안내] '+TBD('확인 필요')]
];
const ChkSoon = (id,word,title,desc,items) => `
<section id="${id}" class="chapter chk-soon-sec" aria-labelledby="h-${id}"><div class="wrap">
  ${ChapterHead({word,title:`<span id="h-${id}">${title}</span>`,desc})}
  <div class="chk-soon rv"><p><b>다음 단계에서 만들어요</b></p><ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>
</div></section>`;

Pages.check = () => ThemeHero({
  id:'overview', num:'04', label:'지원 전 체크', crumbs:'홈 › <b>지원 전 체크</b>',
  title:'지원 전 <em class="t-ol">Check</em>', en:'', desc:'',
  extra:`<ul class="t-chips t-chips-lg rv" aria-label="키워드">${['전국민','전공무관','무엇이든','물어봐'].map(t=>`<li><span>#${t}</span></li>`).join('')}</ul>`
}) + `
<nav class="pg-nav" aria-label="지원 전 체크 목차"><div class="wrap">
  ${[['eligibility','01','지원 자격'],['schedule','02','모집 프로세스'],['benefits','03','지원 혜택'],['faq','04','자주 묻는 질문']].map(([id,n,l],k)=>`<button type="button" data-jump="${id}"${k===0?' class="is-active"':''}><b>${n}</b>${l}</button>`).join('')}
</div></nav>
<section id="eligibility" class="v3-sec" aria-labelledby="h-eligibility"><div class="wrap">
  ${SecHead('01','h-eligibility','지원 자격','모집 대상과 지원 전에 확인할 점을 정리했어요.')}
  <h3 class="v3-h3 rv">기본 대상</h3>
  <div class="elig rv">
    <div class="elig-row"><p class="elig-k">나이</p><div><p class="elig-v"><mark>만 18~39세</mark> 이하</p><p class="elig-s">전국 청년 미취업자</p></div></div>
    <div class="elig-row"><p class="elig-k">학력</p><div><p class="elig-v"><mark>4학년</mark></p><p class="elig-s">졸업 예정자 및 졸업 유예자</p></div></div>
    <div class="elig-row"><p class="elig-k">전공</p><div><p class="elig-v"><mark>전공과 학력</mark> 무관</p><p class="elig-s">비전공자도 지원할 수 있어요</p></div></div>
  </div>
  <p class="chk-crit-note rv">세부 기준(미취업의 범위, 졸업 유예 확인 서류 등)은 공식 모집 공고를 따라요.</p>
  <aside class="chk-notice rv" aria-label="다른 정부지원사업 참여 중이라면">
    <span class="chk-notice-ico" aria-hidden="true">!</span>
    <div><h4>다른 정부지원사업에 참여 중이라면</h4>
    <p>내일배움카드, 실업급여, 국민취업지원제도 등에 참여 중이라면, 해당 기관에 교육 참여와 중복해도 되는지 먼저 문의해 주세요. 참여 기간별로 기준이 달라서 개별 확인이 꼭 필요해요.</p></div>
  </aside>
  <h3 class="v3-h3 rv">스스로 체크</h3>
  <div class="chk-self rv">
    <ul class="chk-list">
      ${CHK_TODO.map(t=>`<li><label><input type="checkbox" class="chk-box"><span class="chk-mark" aria-hidden="true"></span><span class="chk-text">${t}</span></label></li>`).join('')}
    </ul>
    <div class="chk-progress" aria-live="polite">
      <p><b id="chkNow">0</b> / ${CHK_TODO.length} 확인했어요</p>
      <div class="chk-bar"><i id="chkBar"></i></div>
      <a class="chk-go" id="chkGo" href="#/check/schedule" hidden>모두 확인했다면, 모집 프로세스 보러 가기 ${ICON.arrow}</a>
    </div>
  </div>
</div></section>

<section id="schedule" class="v3-sec" aria-labelledby="h-schedule"><div class="wrap">
  ${SecHead('02','h-schedule','모집 프로세스','서류부터 최종 발표까지, 4단계로 진행돼요.')}
  <ol class="proc2 rv" aria-label="모집 프로세스 4단계">
    <li><span class="p2-no">01</span><h3>서류 전형</h3><p>지원자님의 지원 자격, 지원 동기 등을 확인하는 과정이에요.</p></li>
    <li><span class="p2-no">02</span><h3>테스트 전형</h3><p>서류 지원이 확인되면 기본적인 AI 지식과 역량을 검증하기 위한 코딩 테스트를 진행해요.</p><p class="p2-note"><b>코딩 테스트 면제</b>지원 시 AI 관련 역량을 검증할 수 있는 포트폴리오를 제출하면 코딩 테스트가 면제돼요.</p></li>
    <li><span class="p2-no">03</span><h3>면접 전형 및<br>인적성 검사</h3><dl><div><dt>면접 전형</dt><dd>앞선 테스트 전형에 참여한 방식에 따라 면접 유형이 나뉘어 진행돼요.</dd></div><div><dt>인적성 검사</dt><dd>온라인으로 응시하며, 지원자의 인성과 적성을 검사해요.</dd></div></dl></li>
    <li class="p2-last"><span class="p2-no">04</span><h3>최종 발표</h3><p>각 전형별 결과를 종합해 최종 합격자를 선발하고, 문자나 유선으로 개별 안내해요.</p></li>
  </ol>
</div></section>

<section id="benefits" class="v3-sec" aria-labelledby="h-benefits"><div class="wrap">
  ${SecHead('03','h-benefits','지원 혜택','교육생을 위한 여덟 가지 지원 혜택이에요.')}
  <div class="ben2 rv">
    ${BENEFITS.map(([ic,t,d,sub],i)=>`<article class="b2">
      <span class="b2-ico" aria-hidden="true">${BEN_ICON[ic]}</span>
      <p class="b2-no">BENEFIT ${String(i+1).padStart(2,'0')}</p>
      <h3>${t}</h3>
      <p class="b2-desc">${d}</p>${sub?`<p class="b2-sub">${sub}</p>`:''}
    </article>`).join('')}
  </div>
  <div class="ben-foot rv">
    <p>지원 금액과 조건은 모집 회차에 따라 달라질 수 있어요. 최신 기준은 공식 모집 공고를 확인해 주세요.</p>
    <a class="text-link" href="#/stories/reviews">지원 혜택, 선배들은 어떻게 느꼈을까요? ${ICON.arrow}</a>
    <small>후기에 나온 금액은 당시 기준이라 지금과 다를 수 있어요.</small>
  </div>
</div></section>

<section id="faq" class="v3-sec" aria-labelledby="h-faq"><div class="wrap">
  ${SecHead('04','h-faq','자주 묻는 질문','카톡으로 묻기엔 사소한 질문들을 모았어요.')}
  <div class="faq faq2 rv">
    <div class="faq2-side" role="group" aria-label="질문 분류">
      <button type="button" class="faq-tab" data-cat="all" aria-pressed="true">전체<em>${FAQ.length}</em></button>
      ${FAQ_CATS.map(c=>`<button type="button" class="faq-tab" data-cat="${c}" aria-pressed="false">${c}<em>${FAQ.filter(f=>f[0]===c).length}</em></button>`).join('')}
    </div>
    <div class="faq2-main">
      <div class="faq-search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
        <input type="search" id="faqQ" placeholder="궁금한 내용을 검색해 보세요 (예: 점심, 코딩 테스트, 월세)" aria-label="자주 묻는 질문 검색" autocomplete="off">
        <button type="button" id="faqClear" aria-label="검색어 지우기" hidden>×</button>
      </div>
      <p class="faq-count" id="faqCount" aria-live="polite"></p>
      <ul class="faq-list" id="faqList">
        ${FAQ.map(([c,q,a],i)=>`<li class="faq-item${i===0?' is-open':''}" data-cat="${c}">
          <h3><button type="button" class="faq-q" id="fq-${i}" aria-expanded="${i===0}" aria-controls="fa-${i}"><span class="faq-qa">Q</span><span class="faq-qt" data-text="${q}">${q}</span><span class="faq-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 9v8H9"/></svg></span></button></h3>
          <div class="faq-a" id="fa-${i}" role="region" aria-labelledby="fq-${i}"><div><span class="faq-qa">A</span><div class="faq-at">${a}</div></div></div>
        </li>`).join('')}
      </ul>
      <div class="faq-empty" id="faqEmpty" hidden>
        <p><b id="faqEmptyQ"></b> 와(과) 맞는 질문이 없어요.</p>
        <p>카카오톡으로 물어보시면 알려드려요.</p>
      </div>
      <div class="faq-cta">
        <div><h4>더 궁금한 게 있다면</h4><p>카카오톡 채널로 편하게 물어보세요.</p></div>
        <a class="faq-kakao" href="#kakao" data-toast="카카오톡 채널 주소는 확정 후 연결돼요"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.5 3 2 6.4 2 10.7c0 2.7 1.8 5.1 4.5 6.5L5.5 21l4.3-2.4c.7.1 1.5.2 2.2.2 5.5 0 10-3.4 10-7.7S17.5 3 12 3z"/></svg>카카오톡으로 문의하기</a>
      </div>
    </div>
  </div>
</div></section>
${NextCards([['선배들의 이야기','선배 후기','수업 · 생활 · 프로젝트 후기','#/stories/reviews'],['인사교 라이프','시설 둘러보기','강의실부터 구내식당까지','#/life/facilities'],['인사교 라이프','생활 꿀팁','주거 · 식당 · 문화·여가','#/life/tips']])}
${CatBar('check')}
`;

/* ---------- 다음 단계에서 구현할 페이지 (C3 준비중) ---------- */
function PendingPage(menu, childId){
  const child = menu.children.find(c=>c.id===childId) || menu.children[0];
  const heading = menu.type==='tab' ? child.label : menu.title;
  return `<section class="pending"><div class="wrap">
    <p class="basis" style="margin:0 0 16px">${menu.label}${menu.type==='tab'?' / '+child.label:''}</p>
    <h1>${menu.title}</h1>
    <p class="muted" style="max-width:48ch;margin:0">이 페이지는 다음 단계에서 구현할게요. 상단 GNB와 하위 메뉴 바의 동작은 지금 바로 확인할 수 있어요.</p>
    <div class="pending-box">
      <strong>${heading}</strong>
      <ul>
        <li>페이지 유형: ${menu.type==='tab'?'개별 페이지(탭) · 하위 메뉴 클릭 시 별도 페이지로 이동':'원페이지 + 앵커 · 하위 메뉴 클릭 시 섹션으로 스크롤'}</li>
        <li>하위 구성: ${menu.children.map(c=>c.label).join(', ')}</li>
      </ul>
    </div>
  </div></section>`;
}
/* ---------- 0. 홈(랜딩) 첫 화면: 인사교 ARCHIVE 포스터 ---------- */
/* 제공 사진(원본) — 실제 교체 시 경로만 바꾸면 됩니다 */
const ARCHIVE_IMG = {"entrance": "images/img-04-3f2507.jpg", "cafe": "images/img-05-2c259f.jpg", "cheer": "images/img-06-fd9bc3.jpg", "team": "images/img-07-07dd5a.jpg", "map": "images/img-08-fdede0.jpg"};
IMAGES['fac.entrance']='images/img-09-159ac0.jpg'; IMAGES['fac.cafe']=ARCHIVE_IMG.cafe; IMAGES['fac.lounge']='images/img-10-772d49.jpg'; IMAGES['fac.project']='images/img-11-d6a6a8.jpg';
const CATS = [
  {n:'01', id:'about',   label:'인사교 알아보기', en:'About',     c:'var(--n-yellow)'},
  {n:'02', id:'stories', label:'선배들의 이야기', en:'Stories',   c:'var(--n-magenta)'},
  {n:'03', id:'life',    label:'인사교 라이프',   en:'Real Life', c:'var(--n-cyan)'},
  {n:'04', id:'check',   label:'지원 전 체크',    en:'Check',     c:'var(--n-lime)'}
];
const catHref = id => { const m=NAV.find(x=>x.id===id); return `#/${m.id}/${m.children[0].id}`; };
function HomePage(){
  const cheer = (cls,x,y,w,h,extra='') => `<a class="tl split ${cls}" data-cat="2" href="${catHref('stories')}" style="--x:${x};--y:${y};--w:${w};--h:${h}" aria-label="선배들의 이야기" data-depth="${extra||8}">
      <img src="${ARCHIVE_IMG.cheer}" alt="" loading="eager"></a>`;
  return `<section class="ax" aria-labelledby="axTitle">
  <div class="ax-grid" id="axGrid">
    <header class="ax-title" data-depth="-4">
      <div class="ax-row">
        <h1 id="axTitle" class="ax-ko">인사교</h1>
        <ul class="ax-tags" aria-label="인공지능사관학교에서 배우고, 만들고, 성장한 모든 순간">${["인공지능사관학교","배우고","만들고","성장한","모든순간"].map(t=>`<li>#${t}</li>`).join("")}</ul>
      </div>
    </header>

    <!-- HQ 지도 -->
    <a class="tl hq-map" data-cat="5" href="#/life/directions" data-depth="5" style="--d:.15s" aria-label="오시는 길 보기: 광주광역시 동구 제봉로 92">
      <div class="frame" style="--ar:1300/596;--fx:-39%">
        <img src="${ARCHIVE_IMG.map}" alt="인공지능사관학교 주변 위성 지도">
        <span class="pin hq" style="left:53.3%;top:43%">여기!</span>
      </div>
      <span class="tl-tag">HEADQUARTER</span>
      <span class="map-go" aria-hidden="true">오시는 길 ${ICON.arrow}</span>
    </a>

    <!-- 02 선배들의 이야기 : 한 장의 사진을 4개 모듈로 분할 -->
    ${cheer('s1',0,0,3,2,7)}
    ${cheer('s2',3,0,3,2,9)}
    ${cheer('s3',0,2,2,2,6)}
    ${cheer('s4',2,2,4,2,11)}
    <div class="mk mk-02" data-cat="2" data-depth="14"><b>02</b><span>선배들의 이야기</span></div>
    <p class="hand hand-02" data-depth="16" aria-hidden="true">다 같이 해냈다!!
      <svg viewBox="0 0 120 60"><path d="M6 8 C 40 10, 80 18, 100 48 M86 40 L101 50 L104 33"/></svg></p>
    <span class="kw kw-a" data-cat="2" data-depth="12">#비전공자도</span>
    <span class="kw kw-b" data-cat="2" data-depth="10">#팀으로</span>
    <span class="kw kw-e" data-cat="1" data-depth="11">#정문</span>
    <span class="kw kw-l1" data-cat="3" data-depth="12">#프로젝트도</span>
    <span class="kw kw-l2" data-cat="3" data-depth="10">#열심히</span>
    <span class="kw kw-m1" data-cat="5" data-depth="9">#동구 제봉로 92</span>
    <span class="kw kw-m2" data-cat="5" data-depth="11">#ACC</span>
    <span class="kw kw-m3" data-cat="5" data-depth="10">#문화전당역</span>

    <!-- 01 인사교 알아보기 : 입구 -->
    <a class="tl entrance" data-cat="1" href="${catHref('about')}" data-depth="6" style="--d:.3s" aria-label="인사교 알아보기">
      <div class="frame" style="--ar:3/4;--fx:-60%">
        <img src="${ARCHIVE_IMG.entrance}" alt="광주인공지능사관학교 입구 사인">
      </div>
    </a>
    <div class="mk mk-01" data-cat="1" data-depth="14"><b>01</b><span>인사교 알아보기</span></div>

    <!-- 03 인사교 라이프 : 팀 활동 + Cafe AI -->
    <a class="tl team" data-cat="3" href="${catHref('life')}" data-depth="7" style="--d:.45s" aria-label="인사교 라이프">
      <img src="${ARCHIVE_IMG.team}" alt="노트북 화면을 함께 보며 이야기 나누는 교육생들">
    </a>
    <a class="tl cafe" data-cat="3" href="#/life/facilities" data-depth="13" style="--d:.6s" aria-label="시설 둘러보기: Cafe AI">
      <img src="${ARCHIVE_IMG.cafe}" alt="Cafe AI 휴게 공간">
    </a>
    <div class="mk mk-03" data-cat="3" data-depth="15"><b>03</b><span>인사교 라이프</span></div>

    <!-- 04 지원 전 체크 : 체크리스트 모듈 -->
    <nav class="checkbox" data-cat="4" data-depth="10" aria-label="지원 전 체크">
      <a class="cb-head" href="${catHref('check')}" aria-label="지원 전 체크">Check this <span aria-hidden="true">${ICON.arrow}</span></a>
      <ul>
        <li><a href="#/check/eligibility"><i></i>지원 대상</a></li>
        <li><a href="#/check/schedule"><i></i>모집 프로세스</a></li>
        <li><a href="#/check/benefits"><i></i>지원 혜택</a></li>
        <li><a href="#/check/faq"><i></i>자주 묻는 질문</a></li>
      </ul>
    </nav>
  </div>

  <nav class="ax-index" aria-label="카테고리">
    ${CATS.map(c=>`<a class="ix" data-cat="${+c.n}" href="${catHref(c.id)}" style="--c:${c.c}"><b>${c.n}</b><span>${c.label}</span><i>${c.en}</i></a>`).join('')}
  </nav>
</section>`;
}

/* =========================================================
   D. APP (router · header · subnav · interactions)
   ========================================================= */
const App = (() => {
  const $ = (s,el=document)=>el.querySelector(s);
  const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
  const header = $('#siteHeader'), main = $('#main'), subnavEl = $('#subnav');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = {page:null, sub:null}, observers = [];

  const hrefFor = (m,c) => `#/${m.id}/${c.id}`;

  /* --- GNB --- */
  function renderGnb(){
    // hover 시 드롭다운 없음: 1depth 클릭 → 해당 페이지 + 상단 2depth 가로 탭으로 이동
    $('#gnb').innerHTML = NAV.map(m=>`
      <li data-menu="${m.id}">
        <a class="gnb-link" href="${hrefFor(m,m.children[0])}" data-top="${m.id}">${m.label}</a>
      </li>`).join('');
    renderMega();
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeSearch(); closeDrawer(); header.classList.remove('menu-open'); }});
  }

  /* --- 전체 메뉴: GNB hover 시 모든 하위 메뉴 펼치기 --- */
  function renderMega(){
    const mega=$('#mega'), inner=$('#megaInner'); let timer;
    inner.innerHTML = NAV.map(m=>`<div class="mega-col" data-menu="${m.id}"><ul>${subKids(m).map(c=>`<li><a href="${hrefFor(m,c)}">${c.label}</a></li>`).join('')}</ul></div>`).join('');
    const layout=()=>{
      const base=inner.getBoundingClientRect().left; let max=0;
      $$('.mega-col',inner).forEach(col=>{
        const li=$(`#gnb li[data-menu="${col.dataset.menu}"]`); if(!li) return;
        col.style.left=(li.getBoundingClientRect().left-base+22)+'px';
        max=Math.max(max,col.offsetHeight);
      });
      inner.style.height=max+'px'; mega.style.setProperty('--mega-h',(max+68)+'px');
    };
    const mark=id=>{
      $$('#gnb li').forEach(li=>li.classList.toggle('is-hover',li.dataset.menu===id));
      $$('.mega-col',inner).forEach(c=>c.classList.toggle('is-hover',c.dataset.menu===id));
    };
    const open=id=>{
      clearTimeout(timer); if(innerWidth<=1080) return;
      closeSearch(); layout(); header.classList.add('menu-open'); mark(id);
    };
    const close=()=>{ clearTimeout(timer); timer=setTimeout(()=>{ header.classList.remove('menu-open'); mark(null); },140); };
    $$('#gnb li').forEach(li=>{
      li.addEventListener('mouseenter',()=>open(li.dataset.menu));
      li.addEventListener('focusin',()=>open(li.dataset.menu));
    });
    $('#gnb').addEventListener('mouseleave',close);
    mega.addEventListener('mouseenter',()=>clearTimeout(timer));
    mega.addEventListener('mouseleave',close);
    header.addEventListener('focusout',e=>{ if(!header.contains(e.relatedTarget)) close(); });
    $$('a',inner).forEach(a=>a.addEventListener('click',()=>{ header.classList.remove('menu-open'); mark(null); }));
    addEventListener('resize',()=>{ if(innerWidth<=1080){ header.classList.remove('menu-open'); mark(null); } });
  }

  /* --- Mobile drawer --- */
  function renderDrawer(){
    $('#drawerNav').innerHTML = NAV.map((m,i)=>`
      <div class="acc">
        <button class="acc-btn" aria-expanded="false" aria-controls="acc-${m.id}" id="accb-${m.id}">${m.label}${ICON.chev}</button>
        <div class="acc-panel" id="acc-${m.id}" role="region" aria-labelledby="accb-${m.id}"><div>
          ${subKids(m).map(c=>`<a href="${hrefFor(m,c)}">${c.label}</a>`).join('')}
        </div></div>
      </div>`).join('');
    $$('.acc-btn').forEach(b=>b.addEventListener('click',()=>{
      const on = b.getAttribute('aria-expanded')==='true';
      b.setAttribute('aria-expanded', String(!on));
    }));
    $('#menuBtn').addEventListener('click',openDrawer);
    $('#drawerClose').addEventListener('click',closeDrawer);
  }
  function openDrawer(){
    const d=$('#drawer'); d.classList.add('is-open'); $('#menuBtn').setAttribute('aria-expanded','true');
    document.body.style.overflow='hidden';
    const b = $(`#accb-${current.page}`); if(b) b.setAttribute('aria-expanded','true');
    setTimeout(()=>$('#drawerClose').focus(),50);
  }
  function closeDrawer(){
    const d=$('#drawer'); if(!d.classList.contains('is-open')) return;
    d.classList.remove('is-open'); $('#menuBtn').setAttribute('aria-expanded','false'); document.body.style.overflow='';
  }

  /* --- Search --- */
  function closeSearch(){ $('#searchPanel').classList.remove('is-open'); $('#searchBtn').setAttribute('aria-expanded','false'); }
  $('#searchBtn').addEventListener('click',()=>{
    const p=$('#searchPanel'); const on=!p.classList.contains('is-open');
    p.classList.toggle('is-open',on); $('#searchBtn').setAttribute('aria-expanded',String(on));
    header.classList.remove('menu-open'); if(on) setTimeout(()=>$('#q').focus(),30);
  });

  /* --- Local nav (2depth 고정 바) --- */
  function subKids(m){ return m.id==='check' ? m.children.filter(c=>c.id!=='overview') : m.children; }
  function renderSubnav(menu){
    if(!menu){ subnavEl.innerHTML=''; subnavEl.style.display='none'; document.documentElement.style.setProperty('--sub','0px'); return; }
    subnavEl.style.display=''; document.documentElement.style.removeProperty('--sub');
    subnavEl.innerHTML = `<div class="wrap subnav-inner">
      <ul class="subnav-list" role="list">
        ${subKids(menu).map(c=>`<li><a href="${hrefFor(menu,c)}" data-sub="${c.id}">${c.label}</a></li>`).join('')}
        <span class="subnav-indicator" aria-hidden="true"></span>
      </ul>
      <span class="subnav-type">${menu.type==='anchor'?'한 페이지에서 스크롤로 이동':'메뉴별 개별 페이지'}</span>
    </div>`;
  }
  function setActiveSub(id){
    const list = $('.subnav-list',subnavEl); if(!list) return;
    let active;
    $$('a',list).forEach(a=>{ const on=a.dataset.sub===id; a.classList.toggle('is-active',on); if(on){a.setAttribute('aria-current','true');active=a;} else a.removeAttribute('aria-current'); });
    const ind = $('.subnav-indicator',list);
    if(active){
      ind.style.width = (active.offsetWidth-28)+'px';
      ind.style.transform = `translateX(${active.offsetLeft+14}px)`;
      ind.style.opacity = 1;
      // 모바일 가로 스크롤 목록에서 활성 항목을 보이게
      const l = active.offsetLeft - list.clientWidth/2 + active.offsetWidth/2;
      list.scrollTo({left:l,behavior:reduce?'auto':'smooth'});
    } else ind.style.opacity = 0;
  }

  /* --- Router --- */
  function parse(){
    const [, page='', sub=''] = (location.hash||'').split('/');
    return {page, sub};
  }
  function route(){
    let {page, sub} = parse();
    // 디자인통일v1: 랜딩(#/) 밖의 메뉴 · 링크는 사이트의 실제 페이지(../about 등)로 이동
    if(['about','stories','life','check'].includes(page)){
      const anchor={about:{overview:'',learn:'learning',activity:'activities'},check:{overview:''}};
      let s=sub||''; if(anchor[page] && s in anchor[page]) s=anchor[page][s];
      location.href=`../${page}/index.html${s?'#'+s:''}`; return;
    }
    const menu = NAV.find(m=>m.id===page);
    const samePage = current.page===page && page!=='';

    closeDrawer(); closeSearch(); header.classList.remove('menu-open');
    $$('.gnb-link').forEach(a=>{ if(a.dataset.top===page) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });

    // 원페이지 + 앵커: 같은 페이지면 스크롤만
    if(samePage && menu && menu.type==='anchor'){
      scrollToSection(sub); current.sub=sub; return;
    }
    teardown();
    renderSubnav(menu);
    document.body.classList.toggle('is-home', page==='');
    document.body.classList.toggle('is-dark', page==='life'||page==='check'||page==='stories');
    document.body.dataset.cat = page||'home';
    if(page===''){ main.innerHTML = HomePage(); document.title='인사교 ARCHIVE · 인공지능사관학교'; }
    else if(page==='about'){ main.innerHTML = Pages.about(); document.title='인사교 A to Z · 인공지능사관학교'; }
    else if(page==='life'){ main.innerHTML = Pages.life(sub||'facilities'); const c=menu.children.find(c=>c.id===sub)||menu.children[0]; document.title=`${c.label} · 인사교 Real Life · 인공지능사관학교`; }
    else if(page==='stories'){ main.innerHTML = Pages.stories(sub||'reviews'); const c=menu.children.find(c=>c.id===sub)||menu.children[0]; document.title=`${c.label} · 선배들의 이야기 · 인공지능사관학교`; }
    else if(page==='check'){ main.innerHTML = Pages.check(); document.title='지원 전 Check · 인공지능사관학교'; }
    else if(menu){ main.innerHTML = PendingPage(menu, sub); document.title=`${menu.title} · 인공지능사관학교`; }
    else { main.innerHTML = `<section class="pending"><div class="wrap"><h1>페이지를 찾을 수 없어요</h1><p class="muted">주소가 바뀌었거나 삭제된 페이지예요.</p><a class="text-link" href="#/about">인사교 알아보기로 가기 ${ICON.arrow}</a></div></section>`; }
    current = {page, sub};

    setupReveal(); bindToasts(main);
    if(page==='life'||page==='stories') setupLife();
    if(page==='stories') setupStories();
    if(page==='') setupHome();
    if(menu && menu.type==='anchor'){
      setupScrollSpy(menu);
      if(page==='about') setupDay();
      if(page==='check') setupCheck();
      requestAnimationFrame(()=>{ sub ? scrollToSection(sub,true) : window.scrollTo(0,0); });
    } else {
      window.scrollTo(0,0);
      if(menu) requestAnimationFrame(()=>setActiveSub(sub||menu.children[0].id));
    }
  }
  function scrollToSection(id, instant){
    const el = document.getElementById(id);
    if(!el){ window.scrollTo({top:0,behavior:instant||reduce?'auto':'smooth'}); return; }
    jumpTo(el, instant);
    setActiveSub(id);
  }
  /* 앵커 이동: 섹션 여백이 아니라 '콘텐츠 시작점'이 고정 헤더 바로 아래에 오도록 위치를 직접 계산 */
  function jumpTo(el, instant, gap){
    if(!el) return;
    let y;
    if(el.id==='overview'){ y=0; }
    else{
      const pick = el.matches('.chapter,.fac2,.tip,.v3-sec') ? (el.querySelector('.s-head,.chapter-head,.fac2-media,.tip-word')||el) : el;
      const tn = $('.pg-nav'); const bar = el.closest('.fac-zone') ? $('.fac-bar') : (tn && !el.closest('.t-hero') ? tn : null);
      const g = gap!=null ? gap : 32;
      y = pick.getBoundingClientRect().top + window.scrollY - (header.offsetHeight + (bar?bar.offsetHeight:0) + g);
    }
    window.scrollTo({top:Math.max(0,Math.round(y)),behavior:instant||reduce?'auto':'smooth'});
    // 접근성: 앵커 이동 시 포커스 이동(T7)
    const h = el.querySelector('h1, h2'); if(h){ h.setAttribute('tabindex','-1'); h.focus({preventScroll:true}); }
  }
  function teardown(){ observers.forEach(o=>o.disconnect()); observers=[]; }

  /* --- Scroll reveal --- */
  function setupReveal(){
    const els = $$('.rv, .rv-img', main);
    if(reduce || !('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target);} }),{rootMargin:'0px 0px -8% 0px',threshold:.08});
    els.forEach(e=>io.observe(e)); observers.push(io);
  }

  /* --- Scrollspy (원페이지 섹션 ↔ 하위 메뉴) --- */
  function setupScrollSpy(menu){
    const secs = menu.children.map(c=>document.getElementById(c.id)).filter(Boolean);
    if(!secs.length) return;
    const io = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){
        setActiveSub(e.target.id);
        const h = `#/${menu.id}/${e.target.id}`;
        if(location.hash!==h) history.replaceState(null,'',h);
        current.sub = e.target.id;
      }});
    },{rootMargin:'-40% 0px -55% 0px'});
    secs.forEach(s=>io.observe(s)); observers.push(io);
  }

  /* --- 하루 흐름: 스크롤 단계에 맞춰 사진·시각 교체 --- */
  function setupDay(){
    const steps = $$('.day-step',main), photos = $$('.day-stack .ph',main), clock = $('#dayClock');
    if(!steps.length) return;
    const io = new IntersectionObserver(es=>es.forEach(e=>{
      if(!e.isIntersecting) return;
      const i = +e.target.dataset.index;
      steps.forEach((s,j)=>s.classList.toggle('is-current',j===i));
      photos.forEach((p,j)=>p.classList.toggle('is-current',j===i));
      clock.textContent = e.target.dataset.time;
    }),{rootMargin:'-45% 0px -45% 0px'});
    steps.forEach(s=>io.observe(s)); observers.push(io);
    photos[0] && photos[0].classList.add('is-current');
  }

  /* --- 지원 전 체크: 섹션 이동 · 상태 탭 · 스스로 체크 --- */
  function setupStories(){
    const grid=$('#rvGrid',main); if(!grid) return;
    const items=$$('.rv-card',grid), empty=$('#rvEmpty',main), cnt=$('#rvCount',main);
    let topic='all', gen='all';
    const apply=()=>{ let n=0; items.forEach(it=>{ const ok=(topic==='all'||it.dataset.topic===topic)&&(gen==='all'||it.dataset.gen===gen); it.hidden=!ok; if(ok) n++; }); empty.hidden=n>0; cnt.textContent=n+'개의 후기'; };
    $$('[data-topic-f]',main).forEach(b=>b.addEventListener('click',()=>{ topic=b.dataset.topicF; $$('[data-topic-f]',main).forEach(x=>x.setAttribute('aria-pressed',String(x===b))); apply(); }));
    $$('[data-gen-f]',main).forEach(b=>b.addEventListener('click',()=>{ gen=b.dataset.genF; $$('[data-gen-f]',main).forEach(x=>x.setAttribute('aria-pressed',String(x===b))); apply(); }));
    apply();
  }
  function setupPgNav(){
    const nav=$('.pg-nav',main); if(!nav || nav.dataset.ready) return; nav.dataset.ready='1';
    const btns=$$('button',nav);
    const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ btns.forEach(b=>b.classList.toggle('is-active',b.dataset.jump===e.target.id)); const a=btns.find(b=>b.dataset.jump===e.target.id); const w=$('.wrap',nav); if(a&&w.scrollWidth>w.clientWidth) w.scrollTo({left:a.offsetLeft-20,behavior:reduce?'auto':'smooth'}); } }),{rootMargin:'-35% 0px -60% 0px'});
    btns.forEach(b=>{ const el=document.getElementById(b.dataset.jump); if(el) io.observe(el); });
    observers.push(io);
  }
  function setupCheck(){
    setupPgNav();
    $$('[data-jump]',main).forEach(b=>b.addEventListener('click',()=>{
      const el=document.getElementById(b.dataset.jump); if(!el) return;
      jumpTo(el);
    }));
    /* FAQ: 분류 · 검색 · 펼치기 */
    const fl=$('#faqList',main);
    if(fl){
      const items=$$('.faq-item',fl), tabs2=$$('.faq-tab',main), q=$('#faqQ',main), clr=$('#faqClear',main), cnt=$('#faqCount',main), empty=$('#faqEmpty',main), eq=$('#faqEmptyQ',main);
      let cat='all';
      const esc=t=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
      const apply=()=>{
        const kw=q.value.trim().toLowerCase(); let n=0;
        items.forEach(li=>{
          const qt=$('.faq-qt',li), txt=qt.dataset.text, ans=$('.faq-at',li).textContent;
          const ok=(cat==='all'||li.dataset.cat===cat) && (!kw || (txt+' '+ans).toLowerCase().includes(kw));
          li.hidden=!ok; if(ok) n++;
          if(kw && ok){ const i=txt.toLowerCase().indexOf(kw); qt.innerHTML = i<0 ? esc(txt) : esc(txt.slice(0,i))+'<mark>'+esc(txt.slice(i,i+kw.length))+'</mark>'+esc(txt.slice(i+kw.length)); }
          else qt.textContent=txt;
        });
        clr.hidden=!q.value;
        cnt.textContent = (kw||cat!=='all') ? n+'개의 질문' : '';
        empty.hidden = n>0; eq.textContent = kw ? '“'+q.value.trim()+'”' : '이 분류';
      };
      tabs2.forEach(t=>t.addEventListener('click',()=>{ cat=t.dataset.cat; tabs2.forEach(b=>b.setAttribute('aria-pressed',String(b===t))); apply(); }));
      q.addEventListener('input',apply);
      clr.addEventListener('click',()=>{ q.value=''; apply(); q.focus(); });
      $$('.faq-q',fl).forEach(b=>b.addEventListener('click',()=>{
        const li=b.closest('.faq-item'), open=!li.classList.contains('is-open');
        if(open) items.forEach(o=>{ o.classList.remove('is-open'); $('.faq-q',o).setAttribute('aria-expanded','false'); });
        li.classList.toggle('is-open',open); b.setAttribute('aria-expanded',String(open));
      }));
      apply();
    }
    const boxes=$$('.chk-box',main), now=$('#chkNow',main), bar=$('#chkBar',main), go=$('#chkGo',main);
    const upd=()=>{ const n=boxes.filter(b=>b.checked).length; now.textContent=n; bar.style.width=(n/boxes.length*100)+'%'; go.hidden = n<boxes.length; };
    boxes.forEach(b=>b.addEventListener('change',upd)); upd();
  }

  /* --- 인사교 라이프: 페이지 내부 목차 이동 · 목차 활성 · 주소 복사 --- */
  function setupLife(){
    $$('[data-jump]',main).forEach(b=>b.addEventListener('click',()=>{
      const el=document.getElementById(b.dataset.jump); if(!el) return;
      jumpTo(el);
    }));
    const ftabs=$$('.fl-tabs [role=tab]',main);
    if(ftabs.length){
      const panels=$$('.fl-group',main);
      const pick=(t,focus)=>{
        ftabs.forEach(b=>{ const on=b===t; b.setAttribute('aria-selected',String(on)); b.tabIndex=on?0:-1; });
        panels.forEach(p=>{ p.hidden = p.id!==t.getAttribute('aria-controls'); });
        const p=document.getElementById(t.getAttribute('aria-controls'));
        p.querySelectorAll('.rv').forEach(e=>e.classList.add('is-in'));
        if(focus) t.focus();
        const sc=$('#flScroll',main); if(sc){ sc.scrollTop=0; upd(); }
        const grid=$('.fl-grid',main), r=grid.getBoundingClientRect();
        if(innerWidth>1000 && (r.top < header.offsetHeight || r.bottom > innerHeight)) jumpTo(grid,false,20);
        else if(innerWidth<=1000 && (r.top < header.offsetHeight || r.top > innerHeight*.6)) jumpTo(grid,false,20);
      };
      const sc0=$('#flScroll',main), body=$('.fl-body',main);
      const upd=()=>{ if(!sc0) return; body.classList.toggle('has-more', sc0.scrollHeight - sc0.scrollTop - sc0.clientHeight > 6); };
      if(sc0){ sc0.addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd); requestAnimationFrame(upd); }
      ftabs.forEach((t,i)=>{
        t.addEventListener('click',()=>pick(t));
        t.addEventListener('keydown',e=>{
          if(e.key==='ArrowDown'||e.key==='ArrowRight'){ e.preventDefault(); pick(ftabs[(i+1)%ftabs.length],true); }
          if(e.key==='ArrowUp'||e.key==='ArrowLeft'){ e.preventDefault(); pick(ftabs[(i-1+ftabs.length)%ftabs.length],true); }
        });
      });
    }
    const cmap=$('#cultureMap',main);
    if(cmap){
      const setP=k=>{ $$('[data-pl]',cmap).forEach(el=>el.classList.toggle('is-active',el.dataset.pl===k)); };
      $$('.cm-item',cmap).forEach(li=>{ li.addEventListener('mouseenter',()=>setP(li.dataset.pl)); li.addEventListener('click',()=>setP(li.dataset.pl)); });
      $$('.cm-pin',cmap).forEach(p=>{ p.addEventListener('mouseenter',()=>setP(p.dataset.pl)); p.addEventListener('click',()=>setP(p.dataset.pl)); });
      setP('1');
      const cs=$('#cmScroll',main), side=$('.cmap-side',main);
      const upd=()=>side.classList.toggle('has-more', cs.scrollHeight-cs.scrollTop-cs.clientHeight>6);
      cs.addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd); requestAnimationFrame(upd);
    }
    setupPgNav();
    const fb=$('.fac-jump',main);
    if(fb){
      const fbtn=$$('button',fb);
      const fio=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){
        fbtn.forEach(b=>b.classList.toggle('is-active',b.dataset.jump===e.target.id));
        const a=fbtn.find(b=>b.dataset.jump===e.target.id); if(a&&fb.scrollWidth>fb.clientWidth) fb.scrollTo({left:a.offsetLeft-20,behavior:reduce?'auto':'smooth'});
      }}),{rootMargin:'-40% 0px -50% 0px'});
      $$('.fac2',main).forEach(t=>fio.observe(t)); observers.push(fio);
    }
    const idx=$('#tipsIndex',main);
    if(idx){
      const btns=$$('button',idx);
      const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){
        btns.forEach(b=>b.classList.toggle('is-active',b.dataset.jump===e.target.id));
        const a=btns.find(b=>b.dataset.jump===e.target.id); if(a&&idx.scrollWidth>idx.clientWidth) idx.scrollTo({left:a.offsetLeft-20,behavior:reduce?'auto':'smooth'});
      }}),{rootMargin:'-35% 0px -60% 0px'});
      $$('.tip',main).forEach(t=>io.observe(t)); observers.push(io);
    }
    const area=$('#areaMap',main);
    if(area){
      const set=k=>{
        $$('[data-area]',area).forEach(el=>el.classList.toggle('is-active',el.dataset.area===k));
        $$('.area-btn',area).forEach(b=>b.setAttribute('aria-pressed',String(b.closest('.area-item').dataset.area===k)));
      };
      $$('.area-item',area).forEach(li=>{
        li.addEventListener('mouseenter',()=>set(li.dataset.area));
        $('.area-btn',li).addEventListener('click',()=>set(li.dataset.area));
        $('.area-btn',li).addEventListener('focus',()=>set(li.dataset.area));
      });
      $$('.pin',area).forEach(p=>{
        p.addEventListener('mouseenter',()=>set(p.dataset.area));
        p.addEventListener('click',()=>set(p.dataset.area));
      });
      set('a');
    }
    const tabs=$$('.food-tabs button',main);
    if(tabs.length){
      const items=$$('.food',main), PER=6;
      const pager=$('#foodPager',main), prev=$('#fpPrev',main), next=$('#fpNext',main), now=$('#fpNow',main), total=$('#fpTotal',main), bar=$('.food-bar',main);
      let filter='all', page=0;
      const match=li=>filter==='all' || li.dataset.tags.split(' ').includes(filter);
      const render=(scroll)=>{
        const list=items.filter(match), pages=Math.max(1,Math.ceil(list.length/PER));
        page=Math.min(page,pages-1);
        items.forEach(li=>{ const idx=list.indexOf(li); li.hidden = !(idx>=page*PER && idx<(page+1)*PER); });
        pager.hidden = pages<=1;
        now.textContent=page+1; total.textContent=pages;
        prev.disabled = page===0; next.disabled = page===pages-1;
        if(scroll && bar.getBoundingClientRect().top < header.offsetHeight+20) jumpTo(bar,false,24);
      };
      tabs.forEach(t=>t.addEventListener('click',()=>{
        filter=t.dataset.filter; page=0;
        tabs.forEach(b=>b.setAttribute('aria-selected',String(b===t)));
        render(false);
      }));
      prev.addEventListener('click',()=>{ if(page>0){ page--; render(true); } });
      next.addEventListener('click',()=>{ page++; render(true); });
      render(false);
    }
    const cp=$('#copyAddr',main);
    if(cp) cp.addEventListener('click',async()=>{
      try{ await navigator.clipboard.writeText('광주광역시 동구 제봉로 92'); toast('주소를 복사했어요'); }
      catch(e){ toast('복사가 안 돼요. 주소를 길게 눌러 복사해 주세요'); }
    });
  }

  /* --- 홈: 카테고리 하이라이트 · 마우스 패럴랙스 · 진입 애니메이션 --- */
  function setupHome(){
    const grid=$('#axGrid',main), ax=$('.ax',main); if(!grid) return;
    const setCat=c=>{ if(c) ax.dataset.active=c; else delete ax.dataset.active; };
    $$('[data-cat]',ax).forEach(el=>{
      el.addEventListener('mouseenter',()=>setCat(el.dataset.cat));
      el.addEventListener('mouseleave',()=>setCat(null));
      el.addEventListener('focusin',()=>setCat(el.dataset.cat));
      el.addEventListener('focusout',()=>setCat(null));
    });
    requestAnimationFrame(()=>requestAnimationFrame(()=>ax.classList.add('is-in')));
    const st=setTimeout(()=>ax.classList.add('is-settled'),reduce?0:2200); observers.push({disconnect(){clearTimeout(st);}});
    if(reduce || matchMedia('(hover: none)').matches) return;
    const layers=$$('[data-depth]',grid); let raf, tx=0, ty=0;
    const onMove=e=>{ const r=grid.getBoundingClientRect();
      tx=((e.clientX-r.left)/r.width-.5); ty=((e.clientY-r.top)/r.height-.5);
      cancelAnimationFrame(raf); raf=requestAnimationFrame(()=>layers.forEach(l=>{ const d=+l.dataset.depth; l.style.translate=`${(tx*d).toFixed(1)}px ${(ty*d).toFixed(1)}px`; })); };
    const onLeave=()=>layers.forEach(l=>l.style.translate='0px 0px');
    grid.addEventListener('mousemove',onMove); grid.addEventListener('mouseleave',onLeave);
    observers.push({disconnect(){ grid.removeEventListener('mousemove',onMove); cancelAnimationFrame(raf);} });
  }

  /* --- Toast (연결처 미확정 링크) --- */
  let tt;
  function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('is-on'); clearTimeout(tt); tt=setTimeout(()=>t.classList.remove('is-on'),2600); }
  function bindToasts(root){ $$('[data-toast]',root).forEach(a=>{ if(a._t) return; a._t=1; a.addEventListener('click',e=>{ e.preventDefault(); toast(a.dataset.toast); }); }); }

  /* --- Header state / FAB --- */
  function onScroll(){
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y>8);
    $('#fabTop').classList.toggle('is-visible', y>window.innerHeight*.8);
  }
  $('#fabTop').addEventListener('click',()=>window.scrollTo({top:0,behavior:reduce?'auto':'smooth'}));
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',()=>{ if(current.sub||current.page) setActiveSub($('.subnav-list a.is-active')?.dataset.sub||null); });
  window.addEventListener('hashchange',route);
  // 같은 원페이지 안의 앵커 링크: 해시가 이미 같아도 스크롤되도록 직접 처리
  document.addEventListener('click',e=>{
    const a = e.target.closest('a[href^="#/"]'); if(!a) return;
    const [, page, sub] = a.getAttribute('href').split('/');
    const menu = NAV.find(m=>m.id===page);
    if(menu && menu.type==='anchor' && current.page===page && sub){
      e.preventDefault(); closeDrawer(); header.classList.remove('menu-open');
      history.replaceState(null,'',a.getAttribute('href')); scrollToSection(sub); current.sub=sub;
    }
  });

  function init(){ renderGnb(); renderDrawer(); bindToasts(document); route(); onScroll(); }
  return {init, toast};
})();

App.init();
