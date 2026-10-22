import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../stories/js/cohort-v3.js',import.meta.url),'utf8');
test('a cohort without posts skips photo highlights and can switch to the preceding populated cohort',()=>{
  const pieces={};
  const element=()=>({hidden:false,innerHTML:'',textContent:'',replaceChildren(){},querySelector(s){return pieces[s]},focus(){this.focused=true}});
  const hl=element(),grid=element(),pager=element(),host=element(),chosen=element();
  for(const s of ['.story-state__title','.story-state__copy','.story-state__action'])pieces[s]=element();
  pieces['.story-state__action'].replaceWith=e=>{pieces.action=e};
  const selectors={'.cv3-hl':hl,'.cv3-grid':grid,'.cv3-pg':pager,'.cv3-gt':element(),'[data-cohort-filter-empty]':host,'.cv3-chips button[aria-pressed="true"]':chosen};
  const st={coh:'8',pg:1,mo:0,v:'all'};let draws=0,rendered;
  const context={D:[{coh:7}],COHS:['8','7'],PER:9,st,$:s=>selectors[s],inC:(d,c)=>String(d.coh)===c,lab:c=>c,list:()=>[],pinOn:()=>false,draw:()=>draws++,document:{createElement:element},StoryState:{render:(host,kind)=>{rendered=kind}}};
  vm.runInNewContext(source.slice(source.indexOf('  function highlights()'),source.indexOf('  /* 교육과정 고정 게시물'))+'\nhighlights();',context);
  assert.equal(hl.hidden,true);
  vm.runInNewContext(source.slice(source.indexOf('  function grid()'),source.indexOf('  function draw()'))+'\ngrid();',context);
  assert.equal(rendered,'empty');assert.equal(grid.hidden,true);assert.equal(pager.hidden,true);
  assert.equal(pieces['.story-state__title'].textContent,'아직 등록된 게시물이 없어요');
  assert.equal(pieces.action.textContent,'7기 이야기 먼저 보기 →');
  pieces.action.onclick();assert.equal(st.coh,'7');assert.equal(st.v,'all');assert.equal(draws,1);assert.equal(chosen.focused,true);
});
function emptyView(st,D,COHS){
  const pieces={};
  const element=()=>({hidden:false,innerHTML:'',textContent:'',replaceChildren(){},querySelector(s){return pieces[s]},focus(){}});
  for(const s of ['.story-state__title','.story-state__copy','.story-state__action'])pieces[s]=element();
  pieces['.story-state__action'].replaceWith=e=>{pieces.action=e};
  const selectors={'.cv3-grid':element(),'.cv3-pg':element(),'.cv3-gt':element(),'[data-cohort-filter-empty]':element()};
  const context={D,COHS,PER:9,st,$:s=>selectors[s],inC:(d,c)=>c==='3-5'?d.coh>=3&&d.coh<=5:String(d.coh)===c,lab:c=>c==='3-5'?'3–5':c,list:()=>[],pinOn:()=>false,draw(){},document:{createElement:element},StoryState:{render(){}}};
  vm.runInNewContext(source.slice(source.indexOf('  function grid()'),source.indexOf('  function draw()'))+'\ngrid();',context);
  return {copy:pieces['.story-state__copy'].textContent,action:pieces.action&&pieces.action.textContent};
}
test('cohorts with an info block keep their chip after every post is deleted, with an empty view for that cohort',()=>{
  const box=key=>({getAttribute:()=>key,children:[{classList:{contains:c=>c==='cv3-acc'},textContent:'aica_'+key}]});
  const root={getAttribute:k=>k==='data-upcoming-cohorts'?'8':null,querySelectorAll:s=>s==='[data-cohort-infos] > .cv3-cinfo'?['10','7','6','3-5','x'].map(box):[]};
  const D=[{coh:6}],context={root,D};
  vm.runInNewContext(source.slice(source.indexOf('  var INFO=null;'),source.indexOf('  function inC('))+'\nvar all=COHS.join();',context);
  assert.equal(context.all,'10,8,7,6,3-5');
  assert.equal(context.LIVE,'6');
  const seven=emptyView({coh:'7',pg:1,mo:0,v:'all'},D,context.COHS);
  assert.equal(seven.copy,'7기의 이야기는 새로운 게시물이 등록되면 이곳에 표시돼요.');
  assert.equal(seven.action,'6기 이야기 먼저 보기 →');
  // The lowest chip has no earlier cohort, so it offers the nearest later one.
  const oldest=emptyView({coh:'3-5',pg:1,mo:0,v:'all'},D,context.COHS);
  assert.equal(oldest.copy,'3–5기의 이야기는 새로운 게시물이 등록되면 이곳에 표시돼요.');
  assert.equal(oldest.action,'6기 이야기 먼저 보기 →');
});
