import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../stories/js/story-detail-title.js',import.meta.url),'utf8');
const listTitle='인터뷰 — 선배들의 이야기 — 인공지능사관학교';
function start(hash=''){
  const events={},details={};
  function interview(id,title,question){
    const detail={querySelector:()=>({textContent:title}),matches:()=>false,closest:()=>detail};
    details[id]=detail;
    details[question]={closest:()=>detail};
  }
  interview('iv-p14','공개 시안 인터뷰','q-p14-1');
  interview('iv-honors-1','우수 수료생 인터뷰 준비 중','q-honors-1-1');
  details['p-iv']={closest:()=>null};
  const document={title:listTitle,getElementById:id=>details[id]||null};
  const location={hash};
  vm.runInNewContext(source,{document,location,addEventListener:(type,fn)=>events[type]=fn});
  return {document,go(hash,event='hashchange'){location.hash=hash;events[event]();}};
}
test('direct interview and question links use the interview heading, including honors',()=>{
  for(const hash of ['#iv-p14','#q-p14-1','#iv-honors-1','#q-honors-1-1']){
    const ui=start(hash);
    assert.equal(ui.document.title,(hash.includes('honors')?'우수 수료생 인터뷰 준비 중':'공개 시안 인터뷰')+' — '+listTitle);
  }
});
test('projects and review modals use their own heading and restore each listing title',()=>{
  for(const [kind,hash,selector,title] of [
    ['프로젝트','#pj-p42','h2','공개 시안 프로젝트'],
    ['후기','#r-p62','.mtop h3','공개 시안 후기'],
    ['선배들의 이야기','#r-p62','.mtop h3','공개 시안 후기']
  ]){
    const original=kind+' — 인공지능사관학교',events={},location={hash};
    const detail={matches:s=>s==='.ov'&&hash.startsWith('#r-'),closest:()=>detail,
      querySelector:s=>{assert.equal(s,selector);return {textContent:title};}};
    const document={title:original,getElementById:id=>id===hash.slice(1)||id==='section-anchor'?detail:null};
    vm.runInNewContext(source,{document,location,addEventListener:(t,f)=>events[t]=f});
    assert.equal(document.title,title+' — '+original);
    location.hash='#section-anchor';events.hashchange();
    assert.equal(document.title,title+' — '+original);
    location.hash='#p-list';events.hashchange();
    assert.equal(document.title,original);
    location.hash=hash;events.pageshow();
    assert.equal(document.title,title+' — '+original);
  }
});
test('history, adjacent details and list return update or restore the title without accumulating suffixes',()=>{
  const ui=start();
  assert.equal(ui.document.title,listTitle);
  ui.go('#iv-p14');ui.go('#q-p14-1');
  assert.equal(ui.document.title,'공개 시안 인터뷰 — '+listTitle);
  ui.go('#iv-honors-1');
  assert.equal(ui.document.title,'우수 수료생 인터뷰 준비 중 — '+listTitle);
  for(const hash of ['#p-iv','','#missing','#%E0%A4%A']){
    ui.go(hash);assert.equal(ui.document.title,listTitle);
  }
  ui.go('#iv-p14','pageshow');
  assert.equal(ui.document.title,'공개 시안 인터뷰 — '+listTitle);
});
