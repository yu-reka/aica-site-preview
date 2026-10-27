import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// 프로젝트 썸네일(2026-10-26): 백오피스에서 고른 그림(thumb)만 크게 카드 · 한눈에 보기 · 상세 맨 위에 그리고, 프로젝트 주제(summary)는 카드 글로 보여요.
const content=readFileSync(new URL('../common/js/public-content.js',import.meta.url),'utf8');
const renderer=readFileSync(new URL('../stories/js/stories-render.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../stories/css/stories-render.css',import.meta.url),'utf8');
function element(){return {innerHTML:'',inserted:'',attributes:{},querySelector(){return null;},querySelectorAll(){return [];},setAttribute(name,value){this.attributes[name]=value;},insertAdjacentHTML(_,html){this.inserted+=html;}};}
function render(projects){
  const grid=element(),list=element(),pane=element(),hubBox=element(),page=element();
  pane.querySelector=selector=>({'.pjgrid':grid,'.pjlist':list}[selector]||null);
  page.querySelector=selector=>({'#p-pr':pane,'.hb-pjs':hubBox}[selector]||null);
  page.classList={contains:selector=>selector==='stories-hub'};
  const window={STORIES_DATA:{projects},addEventListener(){},removeEventListener(){}};
  const document={baseURI:'https://example.test/stories/projects.html',querySelector:()=>page,getElementById:()=>null,addEventListener(){},createElement:()=>({innerHTML:'',content:{childNodes:[],children:[]}})};
  const context=vm.createContext({window,document,URL,Set,location:{hash:''}});
  vm.runInContext(content,context);vm.runInContext(renderer,context);
  return {cards:grid.innerHTML,details:list.inserted,hub:hubBox.innerHTML};
}
function card(html,id){return html.match(new RegExp('href="#pj-p'+id+'"([\\s\\S]*?)</a>'))?.[1]||'';}
function detail(html,id){return html.match(new RegExp('id="pj-p'+id+'"([\\s\\S]*?)class="pjno"'))?.[1]||'';}

test('a picked thumbnail is the picture alone, and the card text is service name, project subject (summary) and team',()=>{
  const projects=[
    {id:1,anchor:'pj-p1',title:'리뷰 인사이트',headline:'리뷰 분석 플랫폼',summary:'AI 고객 리뷰 분석 및\n제품 개선 인사이트 도출 시스템',team:'리뷰랩 · 4명',
      thumb:{src:'assets/uploads/post-thumb.webp',w:1080,h:737,em:'제품 개선 인사이트'},img:{src:'assets/uploads/post-demo.webp',w:800,h:600}},
    {id:2,anchor:'pj-p2',title:'사진만',img:{src:'assets/uploads/post-photo.webp',w:800,h:600}},
    {id:3,anchor:'pj-p3',title:'주제 없는 썸네일',thumb:{src:'assets/uploads/post-thumb2.webp'}},
    {id:4,anchor:'pj-p4',title:'위험한 주소',headline:'<b>굵게</b>',thumb:{src:'javascript:alert(1)'}},
    {id:5,anchor:'pj-p5',title:'예전 글',headline:'카메라가 신호등을 읽어요',thumb:{src:'assets/uploads/post-thumb3.webp'}}
  ];
  const before=JSON.stringify(projects),out=render(projects);

  // 썸네일: 고른 그림만(글자 · 예전 파란 글자 em · 흐린 배경 그림 없음), 대표 사진 대신
  const one=card(out.cards,1);
  assert.match(one,/<div class="pjthumb illu" aria-hidden="true"><img class="pjthumb-i" src="assets\/uploads\/post-thumb.webp" alt="" loading="lazy" decoding="async" width="1080" height="737"><\/div>/);
  assert.doesNotMatch(one,/pjthumb-t|<em>|post-demo.webp/);
  // 카드 글: 서비스 이름(작은 파란 글씨) · 프로젝트 주제(큰 글씨, 줄바꿈은 한 줄로) · 팀
  assert.match(one,/<div class="pjc-tx"><p class="pjname">리뷰 인사이트<\/p><h3 data-field="summary">AI 고객 리뷰 분석 및 제품 개선 인사이트 도출 시스템<\/h3>.*<p class="team" data-field="team">리뷰랩 · 4명<\/p><\/div>$/s);
  assert.doesNotMatch(one,/class="sum"|리뷰 분석 플랫폼/);
  // 상세 맨 위는 올린 사진(썸네일 그림이 아님)
  assert.match(detail(out.details,1),/post-demo.webp/);
  assert.doesNotMatch(detail(out.details,1),/pjthumb/);

  // 썸네일을 고르지 않은 글은 예전처럼 대표 사진, 주제가 없으면 서비스 이름이 큰 글씨
  assert.match(card(out.cards,2),/src="assets\/uploads\/post-photo.webp"/);
  assert.doesNotMatch(card(out.cards,2),/pjthumb|pjname/);
  assert.match(card(out.cards,2),/<div class="pjc-tx"><h3 data-field="title">사진만<\/h3>/);

  // 주제가 없으면 썸네일은 그림만, 큰 글씨는 서비스 이름. 사진이 없으면 상세 맨 위도 썸네일
  assert.match(card(out.cards,3),/<div class="pjthumb illu" aria-hidden="true"><img class="pjthumb-i" src="assets\/uploads\/post-thumb2.webp"[^>]*><\/div>/);
  assert.match(card(out.cards,3),/<h3 data-field="title">주제 없는 썸네일<\/h3>/);
  assert.match(detail(out.details,3),/class="pjthumb illu"/);
  // 예전 프로젝트 주제(headline)는 2026-10-27 DB에서 없앤 칸 — 카드는 프로젝트 주제(summary)만 보고, 없으면 서비스 이름이 큰 글씨
  assert.match(card(out.cards,5),/<div class="pjc-tx"><h3 data-field="title">예전 글<\/h3>/);
  assert.doesNotMatch(card(out.cards,5),/카메라가 신호등을 읽어요/);

  // 위험한 주소는 버리고(썸네일 없이), 글자는 이스케이프
  assert.doesNotMatch(out.cards+out.details+out.hub,/javascript:|alert\(1\)|<b>/);
  assert.doesNotMatch(card(out.cards,4),/pjthumb/);

  // 한눈에 보기 프로젝트 칸도 같은 썸네일 · 같은 글
  assert.match(out.hub,/href="projects.html#pj-p1"><span class="hb-pjc-ph"><div class="pjthumb" aria-hidden="true"><img class="pjthumb-i"/);
  assert.match(out.hub,/<div class="hb-pjc-tx"><p class="hb-pjc-nm">리뷰 인사이트<\/p><h3>AI 고객 리뷰 분석 및 제품 개선 인사이트 도출 시스템<\/h3><span class="hb-pjc-tm">리뷰랩 · 4명<\/span><\/div><\/a>/);
  assert.match(out.hub,/<div class="hb-pjc-tx"><h3>주제 없는 썸네일<\/h3>/);
  assert.doesNotMatch(out.hub,/hb-pjc-s"|리뷰 분석 플랫폼|pjthumb-t/);
  assert.equal(JSON.stringify(projects),before,'rendering must not mutate API/snapshot data');
});

test('the thumbnail CSS fits the picture large on white and long subjects stop at three lines',()=>{
  assert.match(css,/\.stories-page \.pjthumb\{[^}]*background:#fff\}/);
  assert.match(css,/\.stories-page \.pjthumb \.pjthumb-i,\.stories-page a:hover \.ph \.pjthumb \.pjthumb-i\{[^}]*width:88%;height:86%;object-fit:contain;scale:none\}/);
  assert.doesNotMatch(css,/pjthumb-t|pjthumb-xs|cqw/);
  // 사진처럼 꽉 찬 그림(pjthumb-full)은 칸 크기에 맞춰 꽉 채움(cover — 넘치는 가장자리는 잘림), 뒤 흐린 배경은 없음(2026-10-27)
  assert.match(css,/\.stories-page \.pjthumb-full \.pjthumb-i,\.stories-page a:hover \.ph \.pjthumb-full \.pjthumb-i\{left:0;top:0;width:100%;height:100%;object-fit:cover\}/);
  assert.doesNotMatch(css+renderer,/pjthumb-bg|blur\(/);
  // 카드 · 한눈에 보기 그림 칸은 16:9(썸네일 그림 1600×900 이 잘리지 않게, 2026-10-27)
  assert.match(css,/\.stories-page \.pjc \.ph,\.stories-page \.hb-pjc-ph\{aspect-ratio:16\/9\}/);
  assert.match(css,/\.stories-page \.pjc-tx h3\[data-field="summary"\],\.hb-pjc \.hb-pjc-nm \+ h3\{[^}]*-webkit-line-clamp:3/);
});

test('a picture with no transparent pixel fills the thumbnail box; transparent or unreadable pictures keep the white margin',()=>{
  const box=()=>({attrs:{},classes:new Set(),hasAttribute(n){return n in this.attrs;},setAttribute(n,v){this.attrs[n]=v;},classList:{add(){}}});
  const img=(alpha,opts={})=>{const b=box();b.classList={add:c=>b.classes.add(c)};return {complete:true,naturalWidth:1600,alpha,parentNode:b,...opts};};
  const photo=img(255),art=img(0),foreign=img(255,{foreign:true}),loading=img(255,{complete:false});
  let drawn;
  const canvas={getContext:()=>({drawImage(i){drawn=i;},getImageData(x,y,w,h){
    if(drawn.foreign) throw new Error('SecurityError');   // 다른 주소 그림은 읽지 못함
    const a=new Uint8ClampedArray(w*h*4).fill(255);if(drawn.alpha<255) a[3+4*7]=drawn.alpha;return {data:a};}})};
  const listeners={};
  const document={querySelector:()=>null,querySelectorAll:sel=>sel==='.pjthumb-i'?[photo,art,foreign,loading]:[],createElement:()=>canvas,
    addEventListener(type,fn,capture){(listeners[type]||=[]).push(fn);}};
  const context=vm.createContext({window:{},document,setTimeout,clearTimeout,matchMedia:()=>({matches:false})});
  vm.runInContext(renderer,context);
  assert.deepEqual([photo.parentNode.attrs['data-fit'],[...photo.parentNode.classes]],['full',['pjthumb-full']]);
  assert.deepEqual([art.parentNode.attrs['data-fit'],[...art.parentNode.classes]],['art',[]]);
  assert.deepEqual([foreign.parentNode.attrs['data-fit'],[...foreign.parentNode.classes]],['art',[]]);
  assert.equal(loading.parentNode.attrs['data-fit'],undefined);   // 아직 오는 중인 그림은 load 때
  listeners.load.forEach(fn=>fn({target:{...loading,classList:{contains:c=>c==='pjthumb-i'}}}));
  assert.deepEqual([loading.parentNode.attrs['data-fit'],[...loading.parentNode.classes]],['full',['pjthumb-full']]);
});

test('a project with a demo video shows its picture and a play button at the top of the detail; cards stay the same',()=>{
  const out=render([
    {id:1,anchor:'pj-p1',title:'Pyxis',video:{yt:'dQw4w9WgXcQ'},thumb:{src:'assets/uploads/post-t.webp',w:1600,h:900},img:{src:'assets/uploads/post-photo.webp',w:800,h:600}},
    {id:2,anchor:'pj-p2',title:'영상 없음',img:{src:'assets/uploads/post-photo2.webp',w:800,h:600}},
    {id:3,anchor:'pj-p3',title:'이상한 번호',video:{yt:'<b>bad</b>'}},
    {id:4,anchor:'pj-p4',title:'사진만 있는 영상',video:{yt:'abcDEF_1234'},img:{src:'assets/uploads/post-photo4.webp',w:800,h:600}}]);
  // 영상이 있으면 상세 맨 위는 대표 그림(썸네일 우선) + 재생 단추. 인터뷰용 data-yt 가 아니라 data-pj-yt
  const one=detail(out.details,1);
  assert.match(one,/<div class="ivhero pjhero ivvid pjvid" data-pj-yt="dQw4w9WgXcQ"><span class="ivtag">[^<]*<\/span><div class="pjthumb illu" aria-hidden="true"><img class="pjthumb-i" src="assets\/uploads\/post-t.webp"[^>]*><\/div><button class="ivplay" type="button" aria-label="Pyxis 시연 영상 재생"><i><\/i><\/button><\/div>/);
  assert.doesNotMatch(one,/data-yt=|post-photo.webp|class="phs"/);
  assert.match(detail(out.details,4),/data-pj-yt="abcDEF_1234"><span class="ivtag">[^<]*<\/span><img[^>]*post-photo4.webp/);   // 썸네일이 없으면 대표 사진
  assert.doesNotMatch(detail(out.details,2),/pjvid|ivplay/);
  assert.doesNotMatch(detail(out.details,3),/pjvid|ivplay|bad/);   // 알아볼 수 없는 번호는 버림
  assert.doesNotMatch(out.cards+out.hub,/pjvid|ivplay|data-pj-yt/);
  assert.match(css,/\.stories-page \.pjhero\.pjvid::after\{content:"시연 영상 · 유튜브"!important\}/);
});

test('pressing play swaps the poster for a privacy-friendly YouTube player, and leaving the detail puts the poster back',()=>{
  const listeners={},made=[];
  const document={querySelector:()=>null,querySelectorAll:sel=>sel==='.pjvid'?[box]:[],addEventListener(type,fn){(listeners['doc:'+type]||=[]).push(fn);},
    createElement:tag=>{const el={tagName:tag,focus(){el.focused=true;}};made.push(el);return el;}};
  const tag={className:'ivtag'};
  const box={innerHTML:'<span class="ivtag">자연어처리B</span><img><button class="ivplay"></button>',kids:[],
    getAttribute:n=>n==='data-pj-yt'?'dQw4w9WgXcQ':null,querySelector:s=>s==='.ivtag'?tag:s==='iframe'?box.kids.find(k=>k.tagName==='iframe')||null:null,
    replaceChildren(){box.kids=[];},appendChild(k){box.kids.push(k);},closest:s=>s==='.pjd'?{id:'pj-p1'}:null};
  const button={closest:s=>s==='.pjvid .ivplay'?button:s==='.pjvid'?box:null};
  const context=vm.createContext({window:{addEventListener(type,fn){(listeners['win:'+type]||=[]).push(fn);}},document,location:{hash:'#pj-p1'},setTimeout,clearTimeout,matchMedia:()=>({matches:false})});
  vm.runInContext(renderer,context);
  let prevented=false;
  listeners['doc:click'].forEach(fn=>fn({target:button,preventDefault(){prevented=true;}}));
  const frame=made.find(e=>e.tagName==='iframe');
  assert.ok(prevented);
  assert.equal(frame.src,'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1');
  assert.equal(frame.allowFullscreen,true);
  assert.deepEqual(box.kids,[tag,frame]);
  assert.ok(frame.focused);
  // 같은 상세에 머무는 동안은 그대로, 다른 곳으로 가면 대표 그림 · 재생 단추로 되돌림(소리가 계속 나지 않게)
  listeners['win:hashchange'].forEach(fn=>fn());
  assert.deepEqual(box.kids,[tag,frame]);
  context.location.hash='#p-pr';
  listeners['win:hashchange'].forEach(fn=>fn());
  assert.equal(box.innerHTML,'<span class="ivtag">자연어처리B</span><img><button class="ivplay"></button>');
});
