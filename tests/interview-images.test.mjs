import {runInNewContext,runInContext} from './support/runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const content=readFileSync(new URL('../common/js/public-content.js',import.meta.url),'utf8');
const renderer=readFileSync(new URL('../stories/js/stories-render.js',import.meta.url),'utf8');
function element(){return {innerHTML:'',inserted:'',attributes:{},querySelector(){return null;},querySelectorAll(){return [];},setAttribute(name,value){this.attributes[name]=value;},insertAdjacentHTML(_,html){this.inserted+=html;}};}
function render(interviews){
  const grid=element(),dots=element(),list=element(),pane=element(),hub=element(),hero=element(),page=element();
  pane.querySelector=selector=>({'.ivgrid':grid,'.ivdots':dots,'.ivlist':list}[selector]||null);
  hub.querySelector=selector=>selector==='.hb-ivf'?hero:null;
  page.querySelector=selector=>({'#p-iv':pane,'.hb-ivg':hub}[selector]||null);
  page.classList={contains:selector=>selector==='stories-hub'};
  const window={STORIES_DATA:{interviews},addEventListener(){},removeEventListener(){}};
  const document={baseURI:'https://example.test/stories/interviews.html',querySelector:()=>page,getElementById:()=>null,addEventListener(){},createElement:()=>({innerHTML:'',content:{childNodes:[],children:[]}})};
  const context=vm.createContext({window,document,URL,Set,location:{hash:''}});
  runInContext(content,context);runInContext(renderer,context);
  return {cards:grid.innerHTML,details:list.inserted,hubHero:hero.inserted,hubList:hub.inserted};
}
function card(html,id){return html.match(new RegExp('href="#iv-p'+id+'"([\\s\\S]*?)</a>'))?.[1]||'';}

test('interviews preserve sanitized representative images and use responsive avatars only when img is missing',()=>{
  const interviews=[
    {id:1,anchor:'iv-p1',title:'사진 인터뷰',img:{src:'assets/uploads/post-photo.webp',alt:'대표 사진',w:800,h:600,fit:{x:20,y:30,z:1.2}},imgLarge:{src:'assets/uploads/post-photo-large.webp',w:1080,h:810}},
    {id:2,anchor:'iv-p2',title:'선택한 아바타',img:{src:'/uploads/chosen-avatar.webp',w:720,h:450}},
    {id:3,anchor:'iv-p3',title:'옛 글',img:null},
    {id:4,anchor:'iv-p4',title:'잘못된 주소',img:{src:'javascript:alert(1)'}}
  ];
  const before=JSON.stringify(interviews),out=render(interviews);
  assert.match(card(out.cards,1),/src="assets\/uploads\/post-photo.webp"/);
  assert.match(card(out.cards,1),/--fx:20%;--fy:30%;--z:1.2/);
  assert.match(out.details,/src="assets\/uploads\/post-photo-large.webp"/);
  assert.match(card(out.cards,2),/src="\/uploads\/chosen-avatar.webp"/);
  assert.doesNotMatch(card(out.cards,1)+card(out.cards,2),/srcset=/);
  for(const id of [3,4]){
    assert.match(card(out.cards,id),new RegExp('avatar-card-0'+id+'-320.webp'));
    assert.match(card(out.cards,id),/srcset="[^"]*160w[^"]*1080w"/);
    assert.match(card(out.cards,id),/loading="lazy" decoding="async"/);
  }
  assert.match(out.details,/avatar-card-03-1080.webp/);
  assert.match(out.hubHero,/src="assets\/uploads\/post-photo-large.webp"/);
  assert.match(out.hubList,/src="\/uploads\/chosen-avatar.webp"/);
  assert.match(out.hubList,/avatar-card-03-320.webp/);
  assert.doesNotMatch(out.cards+out.details,/javascript:|alert\(1\)/);
  assert.equal(JSON.stringify(interviews),before,'rendering must not mutate API/snapshot data');
});


test('missing interview images cycle through the ten approved avatars before repeating',()=>{
  const out=render(Array.from({length:13},(_,i)=>({id:i+1,anchor:'iv-p'+(i+1),title:'기본 아바타 '+(i+1)})));
  for(const [id,avatar] of [[10,'10'],[11,'01'],[12,'02'],[13,'03']]){
    assert.match(card(out.cards,id),new RegExp('avatar-card-'+avatar+'-320.webp\\?v=1026avatars10'));
    assert.match(card(out.cards,id),new RegExp('avatar-card-'+avatar+'-1080.webp\\?v=1026avatars10 1080w'));
  }
});

// 인터뷰 영상 구간(2026-11-05 사용자 요청): 프로젝트 시연 구간처럼 video.start · end(초)가 있으면 그 구간만 재생하고, 유튜브 링크는 시작 시간부터
test('an interview video can play just one section, and the YouTube link opens at its start',()=>{
  const out=render([
    {id:1,anchor:'iv-p1',title:'구간',cohort:7,track:'AI',video:{yt:'dQw4w9WgXcQ',dur:'8:05',start:90,end:575},qa:[{q:'질문',a:'답'}]},
    {id:2,anchor:'iv-p2',title:'시작만',video:{yt:'dQw4w9WgXcQ',start:90}},
    {id:3,anchor:'iv-p3',title:'이상한 구간',video:{yt:'dQw4w9WgXcQ',start:'"><b>',end:-5}},
    {id:4,anchor:'iv-p4',title:'끝이 앞',video:{yt:'dQw4w9WgXcQ',start:900,end:600}},
    {id:5,anchor:'iv-p5',title:'구간 없음',video:{yt:'dQw4w9WgXcQ'}}]);
  const detail=id=>out.details.match(new RegExp('id="iv-p'+id+'"[\\s\\S]*?</aside>'))?.[0]||'';
  assert.match(detail(1),/class="ivhero ivvid ivhero-avatar" data-yt="dQw4w9WgXcQ" data-yt-start="90" data-yt-end="575"><span class="ivtag">/);
  assert.match(detail(1),/href="https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ&amp;t=90s"/);
  assert.match(detail(2),/data-yt="dQw4w9WgXcQ" data-yt-start="90"><span/);
  assert.match(detail(3),/data-yt="dQw4w9WgXcQ"><span/);   // 숫자가 아닌 값은 버림
  assert.match(detail(4),/data-yt="dQw4w9WgXcQ" data-yt-start="900"><span/);
  assert.match(detail(5),/data-yt="dQw4w9WgXcQ"><span/);
  assert.match(detail(5),/href="https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ"/);

  const sections=readFileSync(new URL('../stories/js/stories-sections.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
  const start=sections.indexOf("(function(){\n  document.querySelectorAll('.ivvid[data-yt]')");
  const player=sections.slice(start,sections.indexOf('})();',start)+5);
  assert.ok(start>0);
  const play=attrs=>{
    const made=[],button={};
    const box={dataset:{yt:'dQw4w9WgXcQ'},innerHTML:'',getAttribute:n=>attrs[n]??null,closest:()=>({id:'iv-p1',querySelector:()=>({textContent:'제목'})}),
      querySelector:s=>s==='.ivplay'?button:null,replaceChildren(){},appendChild(){}};
    const document={querySelectorAll:s=>s==='.ivvid[data-yt]'?[box]:[],createElement:tag=>{const el={tagName:tag,focus(){}};made.push(el);return el;}};
    vm.runInContext(player,vm.createContext({document,addEventListener(){},location:{hash:''}}));
    button.onclick();
    return made.find(e=>e.tagName==='iframe').src;
  };
  const base='https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1';
  assert.equal(play({'data-yt-start':'90','data-yt-end':'575'}),base+'&start=90&end=575');
  assert.equal(play({'data-yt-start':'90'}),base+'&start=90');
  assert.equal(play({'data-yt-end':'600'}),base+'&end=600');
  assert.equal(play({}),base);
  assert.equal(play({'data-yt-start':'x&mute=1','data-yt-end':'-1'}),base);
});
