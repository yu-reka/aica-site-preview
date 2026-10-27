import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../stories/js/interview-title.js',import.meta.url),'utf8');
const listTitle='인터뷰 — 선배들의 이야기 — 인공지능사관학교';
function start(hash=''){
  const events={},details={};
  function interview(id,title,question){
    const detail={querySelector:()=>({textContent:title}),closest:()=>detail};
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
