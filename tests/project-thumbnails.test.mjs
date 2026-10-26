import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// 프로젝트 썸네일(2026-10-26): 백오피스에서 고른 그림(thumb)과 파란 글자(thumb.em)로 카드 · 한눈에 보기 · 상세 맨 위를 그려요.
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

test('a picked thumbnail draws the project subject left, the blue words on their own line and the picture right',()=>{
  const projects=[
    {id:1,anchor:'pj-p1',title:'리뷰 인사이트',headline:'AI 고객 리뷰 분석 및 제품 개선 인사이트 도출 시스템',
      thumb:{src:'assets/uploads/post-thumb.webp',w:1080,h:737,em:'제품 개선 인사이트'},img:{src:'assets/uploads/post-demo.webp',w:800,h:600}},
    {id:2,anchor:'pj-p2',title:'사진만',img:{src:'assets/uploads/post-photo.webp',w:800,h:600}},
    {id:3,anchor:'pj-p3',title:'주제 없는 썸네일',thumb:{src:'assets/uploads/post-thumb2.webp',em:'없는 글자'}},
    {id:4,anchor:'pj-p4',title:'위험한 주소',headline:'<b>굵게</b>',thumb:{src:'javascript:alert(1)',em:'<b>'}}
  ];
  const before=JSON.stringify(projects),out=render(projects);

  // 카드: 30자 주제라 중간 크기, 파란 글자는 em 한 줄, 그림은 고른 썸네일(대표 사진 대신)
  const one=card(out.cards,1);
  assert.match(one,/<div class="pjthumb pjthumb-m illu" aria-hidden="true"><p class="pjthumb-t">AI 고객 리뷰 분석 및<em>제품 개선 인사이트<\/em>도출 시스템<\/p>/);
  assert.match(one,/<img class="pjthumb-i" src="assets\/uploads\/post-thumb.webp" alt="" loading="lazy" decoding="async" width="1080" height="737">/);
  assert.doesNotMatch(one,/post-demo.webp/);
  // 상세 맨 위는 올린 사진(썸네일 그림이 아님)
  assert.match(detail(out.details,1),/post-demo.webp/);
  assert.doesNotMatch(detail(out.details,1),/pjthumb/);

  // 썸네일을 고르지 않은 글은 예전처럼 대표 사진
  assert.match(card(out.cards,2),/src="assets\/uploads\/post-photo.webp"/);
  assert.doesNotMatch(card(out.cards,2),/pjthumb/);

  // 프로젝트 주제가 없으면 서비스 이름, 주제에 없는 파란 글자는 무시. 사진이 없으면 상세 맨 위도 썸네일
  assert.match(card(out.cards,3),/<p class="pjthumb-t">주제 없는 썸네일<\/p>/);
  assert.match(detail(out.details,3),/class="pjthumb illu"/);

  // 위험한 주소는 버리고(썸네일 없이), 글자는 이스케이프
  assert.doesNotMatch(out.cards+out.details+out.hub,/javascript:|alert\(1\)|<b>/);
  assert.doesNotMatch(card(out.cards,4),/pjthumb/);

  // 한눈에 보기 프로젝트 칸도 같은 썸네일
  assert.match(out.hub,/href="projects.html#pj-p1"><span class="hb-pjc-ph"><div class="pjthumb pjthumb-m" aria-hidden="true">/);
  assert.equal(JSON.stringify(projects),before,'rendering must not mutate API/snapshot data');
});

test('long subjects shrink and the thumbnail CSS sizes text by the card width',()=>{
  const long='대화형 에이전트를 활용한 소상공인 브랜딩 · 콘텐츠 생성 및 운영 서비스 플랫폼';
  const out=render([{id:1,anchor:'pj-p1',title:'긴 주제',headline:long,thumb:{src:'assets/uploads/t.webp'}},{id:2,anchor:'pj-p2',title:'짧은 주제',headline:'손끝 보행 도우미',thumb:{src:'assets/uploads/t.webp'}}]);
  assert.match(card(out.cards,1),/class="pjthumb pjthumb-s illu"/);
  assert.match(card(out.cards,2),/class="pjthumb illu"/);
  assert.match(css,/\.stories-page \.pjthumb\{[^}]*container-type:inline-size/);
  assert.match(css,/\.stories-page \.pjthumb-t em\{display:block;/);
  // 카드에 마우스를 올렸을 때 그림만 따로 커지지 않게(.ph img 규칙보다 강하게)
  assert.match(css,/\.stories-page a:hover \.ph \.pjthumb \.pjthumb-i\{[^}]*scale:none/);
});
