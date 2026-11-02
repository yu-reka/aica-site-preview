import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../stories/js/cohort-v3.js',import.meta.url),'utf8');
function start(){
  const events={},calls=[],state={v:'all'},records=[{id:'st-1',coh:7},{id:'st-2',coh:7,yt:'video'}],location={hash:'',pathname:'/stories/cohorts.html',search:''};
  const media={innerHTML:''},close={focus(){calls.push('focus');}},M={hidden:true,querySelector:s=>s==='.cv3-m-media'?media:close},Z={hidden:true};
  const history={state:null,pushState(state,_,hash){this.state=state;location.hash=hash;calls.push('push:'+hash);},replaceState(state,_,url){this.state=state;location.hash=url.startsWith('#')?url:'';},back(){calls.push('back');location.hash='';events.popstate();}};
  const context=vm.createContext({M,Z,location,history,window:{scrollY:745,scrollTo:options=>calls.push('scroll:'+options.top)},
    document:{activeElement:{focus(){calls.push('opener');}},documentElement:{classList:{add(){},remove(){}}},contains:()=>true},
    list:()=>records.filter(d=>state.v!=='video'||d.yt),fill(){},isolateDialog(){},changePhoto(){},modalVisited:[],hubModal:false,root:{closest:()=>({addEventListener(){}})},
    addEventListener:(type,fn)=>events[type]=fn,COHS:[1],D:records,st:state,draw(){}});
  const begin=source.indexOf('  var modalScroll=0;'),end=source.indexOf("  M.querySelector('.pv').onclick",begin);
  vm.runInContext(source.slice(begin,end),context);
  const tail=source.slice(source.indexOf('  function hashOpen()'),source.lastIndexOf('\n})();'));
  vm.runInContext('(function(){'+tail+'})()',context);
  return{context,M,location,history,calls,events};
}
test('card opens one history entry and Back closes without leaving the page, then Forward reopens',()=>{
  const ui=start();ui.context.openM(0,true);assert.equal(ui.location.hash,'#st-1');assert.equal(ui.M.hidden,false);
  ui.history.back();assert.equal(ui.M.hidden,true);assert.ok(ui.calls.includes('scroll:745'));
  ui.location.hash='#st-1';ui.history.state={aicaCohort:true};ui.events.popstate();assert.equal(ui.M.hidden,false);
  assert.equal(ui.calls.filter(c=>c.startsWith('push:')).length,1);
  ui.context.closeM();assert.equal(ui.M.hidden,true);assert.equal(ui.calls.filter(c=>c==='back').length,2);
});
test('close uses Back only for a card-created entry; direct deep links close in place',()=>{
  const ui=start();ui.context.openM(1,true);ui.context.closeM();assert.equal(ui.M.hidden,true);assert.ok(ui.calls.includes('back'));
  const direct=start();direct.location.hash='#st-2';direct.events.hashchange();assert.equal(direct.M.hidden,false);
  direct.context.closeM();assert.equal(direct.M.hidden,true);assert.equal(direct.location.hash,'');assert.ok(!direct.calls.includes('back'));
});

test('Forward to a photo outside the current video filter restores the all-post view',()=>{
  const ui=start();ui.context.openM(0,true);const saved=ui.history.state;ui.history.back();ui.context.st.v='video';
  ui.location.hash='#st-1';ui.history.state=saved;ui.events.popstate();
  assert.equal(ui.context.st.v,'all');assert.equal(ui.context.cur,0);assert.equal(ui.M.hidden,false);
});
test('owned deep-link reload uses its stored return scroll instead of overwriting it with zero',()=>{
  const ui=start();ui.location.hash='#st-1';ui.history.state={aicaCohort:true,cohortReturnScroll:511};ui.events.hashchange();
  ui.context.closeM();assert.ok(ui.calls.includes('scroll:511'));
});
