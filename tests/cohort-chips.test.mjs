import {runInNewContext,runInContext} from './support/runtime.mjs';
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
    runInNewContext(source.slice(source.indexOf('  var COH_KEY='),source.indexOf('  function inC('))+'\nvar all=COHS.join();',context);
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
  runInNewContext(source.slice(source.indexOf('  function grid()'),source.indexOf('  function draw()'))+'\ngrid();',context);
  assert.deepEqual(rendered,{target:host,kind:'filter'});
  assert.equal(host.hidden,false);assert.equal(grid.hidden,true);assert.equal(pager.hidden,true);
});

test('video-empty photo records offer photos without resetting the selected month',()=>{
  const title={},copy={},action={},pager={hidden:false,replaceChildren(){}},grid={innerHTML:'',hidden:false};
  const host={hidden:false,querySelector:s=>({'.story-state__title':title,'.story-state__copy':copy,'.story-state__action':action})[s]};
  const st={coh:'3-5',pg:1,mo:202206,v:'video'};let options,drawn=0;
  const selectors={'.cv3-grid':grid,'.cv3-pg':pager,'.cv3-gt':{},'[data-cohort-filter-empty]':host};
  const context={D:[{coh:3,date:'2022-06-01',yt:''}],PER:9,st,$:s=>selectors[s],inC:()=>true,ym:()=>202206,lab:c=>c,list:()=>[],pinOn:()=>false,
    root:{querySelector:()=>null},draw(){drawn++;},StoryState:{render:(target,kind,opts)=>{options=opts;}}};
  runInNewContext(source.slice(source.indexOf('  function grid()'),source.indexOf('  function draw()'))+'\ngrid();',context);
  assert.equal(title.textContent,'등록된 영상이 없어요.');
  assert.match(copy.textContent,/사진으로만/);
  assert.equal(action.textContent,'사진 보기');
  options.onReset();
  assert.equal(st.v,'all');assert.equal(st.mo,202206);assert.equal(st.coh,'3-5');assert.equal(drawn,1);
});
