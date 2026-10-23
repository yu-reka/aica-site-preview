import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../stories/js/cohort-v3.js',import.meta.url),'utf8');
test('cohort chips come only from published posts; cohort info and an old upcoming flag add none',()=>{
  // 기수 정보(관리자 '기수 정보' 화면 → STORIES_DATA.cohortInfos)가 있어도 칩은 게시물로만
  const STORIES_DATA={cohortInfos:['10','7','6','3-5','x'].map(cohort=>({cohort,account:'aica_'+cohort}))};
  const root={getAttribute:k=>k==='data-upcoming-cohorts'?'8':null};
  const chips=D=>{
    const context={root,D,STORIES_DATA};
    vm.runInNewContext(source.slice(source.indexOf('  var COH_KEY='),source.indexOf('  function inC('))+'\nvar all=COHS.join();',context);
    return context;
  };
  const posted=chips([{coh:6},{coh:4},{coh:6}]);
  assert.equal(posted.all,'6,3-5');
  assert.equal(posted.LIVE,'6');
  assert.equal(chips([]).all,'');
});
test('a month without posts in the chosen cohort shows the filter state',()=>{
  const element=()=>({hidden:false,innerHTML:'',textContent:'',replaceChildren(){},querySelector(){return null}});
  const grid=element(),pager=element(),host=element();
  const selectors={'.cv3-grid':grid,'.cv3-pg':pager,'.cv3-gt':element(),'[data-cohort-filter-empty]':host};
  const st={coh:'7',pg:1,mo:202605,v:'all'};let rendered;
  const context={D:[{coh:7}],COHS:['7'],PER:9,st,$:s=>selectors[s],inC:(d,c)=>String(d.coh)===c,lab:c=>c,list:()=>[],pinOn:()=>false,draw(){},document:{createElement:element},
    StoryState:{render:(target,kind)=>{rendered={target,kind}}}};
  vm.runInNewContext(source.slice(source.indexOf('  function grid()'),source.indexOf('  function draw()'))+'\ngrid();',context);
  assert.deepEqual(rendered,{target:host,kind:'filter'});
  assert.equal(host.hidden,false);assert.equal(grid.hidden,true);assert.equal(pager.hidden,true);
});
