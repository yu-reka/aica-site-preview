import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// 우수 수료생(2026-10-26): 백오피스에서 체크한 인터뷰(honors)는 위 '우수 수료생' 섹션에만, 아래 목록 · 넘김 점에서는 빠져요.
const content=readFileSync(new URL('../common/js/public-content.js',import.meta.url),'utf8');
const renderer=readFileSync(new URL('../stories/js/stories-render.js',import.meta.url),'utf8');
const honorsScript=readFileSync(new URL('../stories/js/interview-honors.js',import.meta.url),'utf8');
const PREVIEW='<a class="sm-ivf-c is-on" href="#iv-honors-1">준비 중</a>';
function element(){return {innerHTML:'',inserted:'',attributes:{},querySelector(){return null;},querySelectorAll(){return [];},setAttribute(name,value){this.attributes[name]=value;},insertAdjacentHTML(_,html){this.inserted+=html;}};}
function render(interviews){
  const grid=element(),dots=element(),list=element(),pane=element(),page=element(),holder=element(),track=element();
  track.innerHTML=PREVIEW;track.parentNode=holder;
  pane.querySelector=selector=>({'.ivgrid':grid,'.ivdots':dots,'.ivlist':list,'.iv-honors .sm-ivf-track':track}[selector]||null);
  page.querySelector=selector=>({'#p-iv':pane}[selector]||null);
  page.classList={contains:()=>false};
  const window={STORIES_DATA:{interviews},addEventListener(){},removeEventListener(){}};
  const document={baseURI:'https://example.test/stories/interviews.html',querySelector:()=>page,getElementById:()=>null,addEventListener(){},createElement:()=>({innerHTML:'',content:{childNodes:[],children:[]}})};
  const context=vm.createContext({window,document,URL,Set,location:{hash:''}});
  vm.runInContext(content,context);vm.runInContext(renderer,context);
  return {grid:grid.innerHTML,dots:dots.innerHTML,details:list.inserted,honors:track.innerHTML,label:holder.attributes['aria-label']};
}
const iv=(id,extra)=>Object.assign({id,anchor:'iv-p'+id,title:'인터뷰 '+id,summary:'요약 '+id,cohort:6,author:'김○○',track:'AI 서비스',qa:[{q:'질문',a:'답'}],img:{src:'assets/uploads/post-'+id+'.webp',w:800,h:500}},extra);

test('checked interviews become the honors cards and leave the general list, but keep their detail page',()=>{
  const out=render([iv(3,{honors:true}),iv(2),iv(1,{honors:true,title:'<b>우수</b>',video:{yt:'abcdefghijk',dur:'3:05'}})]);
  // 위 섹션: 체크한 글만, 최신 순(받은 순서), 첫 칸이 is-on, 상세는 그 글(#iv-pN)
  assert.equal((out.honors.match(/class="sm-ivf-c/g)||[]).length,2);
  assert.match(out.honors,/^<a class="sm-ivf-c is-on" href="#iv-p3" aria-label="인터뷰 3 상세보기">/);
  assert.match(out.honors,/<b>인터뷰 3<\/b><p class="sm-ivf-summary">요약 3<\/p><span>6기 · 김○○ · AI 서비스<\/span>/);
  assert.match(out.honors,/href="#iv-p1"[^>]*>.*<span class="play"><i><\/i><\/span>/);
  assert.doesNotMatch(out.honors,/iv-honors-1|<b>우수<\/b>/);   // '준비 중' 카드는 갈아 끼우고 글자는 이스케이프
  assert.equal(out.label,'우수 수료생 인터뷰');
  // 아래 목록 · 넘김 점: 체크하지 않은 글만
  assert.match(out.grid,/href="#iv-p2"/);
  assert.doesNotMatch(out.grid,/#iv-p3|#iv-p1/);
  assert.equal((out.dots.match(/<button/g)||[]).length,1);
  // 상세 화면은 모두(위 카드가 그 글로 열려요)
  for(const id of [1,2,3])assert.match(out.details,new RegExp('id="iv-p'+id+'"'));
});

test('without a checked interview the design preview cards stay',()=>{
  const out=render([iv(2),iv(1)]);
  assert.equal(out.honors,PREVIEW);
  assert.equal(out.label,undefined);
  assert.equal((out.dots.match(/<button/g)||[]).length,2);
});

test('the honors carousel builds placeholder details only for the preview cards',()=>{
  assert.match(honorsScript,/if \(!\/\^#iv-honors-\/\.test\(card\.getAttribute\('href'\) \|\| ''\)\) return;/);
});
