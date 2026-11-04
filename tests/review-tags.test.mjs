import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {runInContext} from './support/runtime.mjs';
const renderer=readFileSync(new URL('../stories/js/stories-render.js',import.meta.url),'utf8');
const publicContent=readFileSync(new URL('../common/js/public-content.js',import.meta.url),'utf8');
function render(tags){
  const element=()=>({innerHTML:'',inserted:'',content:{childNodes:[],children:[]},querySelector:()=>null,querySelectorAll:()=>[],insertAdjacentHTML(_,s){this.inserted+=s;}});
  const grid=element(),rows=element(),host=element(),hub=element(),pane=element(),page=element();
  pane.querySelector=s=>({'.idgrid':grid,'.rvlist':rows}[s]||null);
  page.querySelector=s=>({'#p-rev':pane,'.st-main':host}[s]||null);page.classList={contains:()=>false};
  const data={reviews:[{id:1,anchor:'r-p1',cat:'life',cohort:7,title:'후기 시안',author:'선배',summary:'요약',body:['본문'],tags}]};
  const before=JSON.stringify(data);
  const window={STORIES_DATA:data,addEventListener(){}};
  const document={baseURI:'https://example.test/stories/reviews.html',querySelector:s=>s==='.stories-page'?page:null,querySelectorAll:()=>[],getElementById:id=>id==='hub-review-dialogs'?hub:null,addEventListener(){},createElement:()=>element()};
  const context=vm.createContext({window,document,URL,Set,location:{hash:''}});
  runInContext(publicContent,context);runInContext(renderer,context);
  assert.equal(JSON.stringify(data),before,'rendering does not rewrite the source data');
  return {cards:grid.innerHTML,rows:rows.innerHTML,detail:host.inserted,hub:hub.innerHTML};
}
test('review cards keep the first free tag while details show ordered mixed legacy and string tags',()=>{
  const out=render(['#경력전환',0,'#팀 프로젝트',6]);
  for(const html of [out.cards,out.rows]){assert.match(html,/#경력전환/);assert.doesNotMatch(html,/#비전공자|#팀 프로젝트|#취업연계/);}
  for(const html of [out.detail,out.hub]){
    assert.match(html,/<span class="t" data-field="tag">#경력전환<\/span><span class="t" data-field="tag">#비전공자<\/span><span class="t" data-field="tag">#팀 프로젝트<\/span><span class="t" data-field="tag">#취업연계<\/span>/);
    assert.doesNotMatch(html,/#tg-|태그를 누르면|\btg[0-6]\b/);
  }
  assert.match(render([0]).cards,/#비전공자/);
});
test('untrusted free tags remain escaped text and never become links, elements or class names',()=>{
  const out=render(['#<img src=x onerror="alert(1)">','"><script>bad</script>',null,{},-1,7,NaN,1.5,'   ']);
  for(const html of Object.values(out)){
    assert.match(html,/#&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
    assert.doesNotMatch(html,/<img|<script>|undefined|tg\[object|href="#tg-/);
  }
  assert.match(out.detail,/&quot;&gt;&lt;script&gt;bad&lt;\/script&gt;/);
});
test('empty or invalid tags create no tag row or placeholder on cards, rows and detail',()=>{
  for(const tags of [[],null,[null,{},-1,7,'']]){
    const out=render(tags);
    for(const html of Object.values(out))assert.doesNotMatch(html,/class="mtags"|data-field="tag"|태그 없음/);
  }
});


test('build components omit empty review tags and retain the first escaped label', async () => {
  const {loadContent, deriveContent, root}=await import('../scripts/build.mjs');
  const {createRenderer}=await import('../scripts/template.mjs');
  const content=loadContent();
  const review=content.stories.reviews[0];
  const render=createRenderer(root+'/src/components');
  for(const tags of [[],[{label:'#한 개'},{label:'#두 번째'}]]){
    review.tags=tags;deriveContent(content);
    for(const name of ['card','card-2','row','row-2']){
      const html=render('{{> stories/reviews/'+name+' review}}',{review});
      if(tags.length) {assert.match(html,/#한 개/);assert.doesNotMatch(html,/#두 번째/);}
      else assert.doesNotMatch(html,/class="tg"/);
    }
  }
});
