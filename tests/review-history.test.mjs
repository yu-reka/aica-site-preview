import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readText} from '../scripts/text.mjs';
const source=readText(new URL('../stories/js/stories.js',import.meta.url));
function start(initialHash='',initialState=null){
  const handlers={},documentEvents={},calls=[];
  const cls=name=>({contains:k=>name.split(' ').includes(k)});
  const dialog={classList:cls('ov'),contains:a=>a.inside===true,querySelector:()=>({focus(){},click(){}})};
  const page={classList:cls('stories-page'),querySelector:()=>/^#r-p/.test(location.hash)?dialog:null};
  const location={hash:initialHash,pathname:'/stories/reviews.html',search:'',get href(){return 'https://example.test/stories/reviews.html'+this.hash;},replace(hash){this.hash=hash.startsWith('#')?hash:'';calls.push('replace');handlers.hashchange();}};
  let previousHash='',previousState=null;
  const history={state:initialState,replaceState(state){this.state=state;},back(){calls.push('back');location.hash=previousHash;this.state=previousState;handlers.hashchange();}};
  const document={body:{},activeElement:null,contains:()=>false,getElementById:id=>id.startsWith('r-p')?dialog:null,addEventListener:(type,fn)=>documentEvents[type]=fn};
  const context=vm.createContext({document,page,location,history,Site:{decodeHash:x=>x},SiteUI:{createDialogScope:()=>({activate(){},release(){}}),trapFocus(){}},
    window:{scrollY:745,scrollTo:o=>calls.push('scroll:'+o.top)},addEventListener:(type,fn)=>handlers[type]=fn,CustomEvent:class{}});
  const begin=source.indexOf('  (function(){\n    var opener = null, link = null;'),end=source.indexOf('  /* ---------- 숨은 라디오',begin);
  vm.runInContext(source.slice(begin,end),context);
  function click(hash,inside=false,name=''){
    let prevented=false;
    const a={hash,href:'https://example.test/stories/reviews.html'+hash,inside,classList:cls(name),closest:()=>inside?dialog:null};
    documentEvents.click({target:{closest:()=>a},preventDefault(){prevented=true;}});
    if(!prevented){previousHash=location.hash;previousState=history.state;location.hash=hash;history.state=null;handlers.hashchange();}
  }
  return{click,calls,location,history,forward(hash,state){location.hash=hash;history.state=state;handlers.hashchange();}};
}
test('card to next review to Close returns to the list once and restores its exact scroll',()=>{
  const ui=start();ui.click('#r-p1');const state=ui.history.state;
  assert.equal(state.aicaReview,true);assert.equal(state.reviewReturnScroll,745);
  ui.click('#r-p2',true);assert.equal(ui.location.hash,'#r-p2');
  ui.click('#p-rev',true,'x');assert.equal(ui.location.hash,'');
  assert.equal(ui.calls.filter(v=>v==='back').length,1);assert.ok(ui.calls.includes('scroll:745'));
  ui.forward('#r-p2',state);ui.click('#p-rev',true,'back');assert.equal(ui.location.hash,'');
  assert.equal(ui.calls.filter(v=>v==='back').length,2);
});
test('a reload restores owned modal history and scroll while a direct link closes without Back',()=>{
  const owned=start('#r-p2',{aicaReview:true,reviewReturnScroll:511});owned.click('#p-rev',true,'x');
  assert.ok(owned.calls.includes('back'));assert.ok(owned.calls.includes('scroll:511'));
  const direct=start('#r-p2');direct.click('#p-rev',true,'x');
  assert.ok(!direct.calls.includes('back'));assert.ok(direct.calls.includes('replace'));assert.equal(direct.location.hash,'');
});
