import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from './support/runtime.mjs';

const source=readFileSync(new URL('../stories/js/stories-m.js',import.meta.url),'utf8');
const helper=source.slice(source.indexOf('  function alignCohortAccount('),source.indexOf('  function initCohorts('));
test('account follows actual post-number left edge for one, two and three digits and after resizing',()=>{
  const mq={matches:true},top={style:{}},stat={getBoundingClientRect:()=>({left:104})};
  let numberLeft=127.57;
  const count={getBoundingClientRect:()=>({left:numberLeft})};
  const prof={querySelector:s=>({'.sm-cv-top':top,'.cv3-stat':stat,'.cv3-stat b':count})[s]};
  const align=runInNewContext(helper+'\nalignCohortAccount',{mq});
  for(const left of [127.57,122.1,116.7,132.24]){
    numberLeft=left;align(prof);
    assert.ok(Math.abs(104+Number.parseFloat(top.style.paddingLeft)-left)<.001);
  }
  mq.matches=false;numberLeft=200;const mobile=top.style.paddingLeft;align(prof);
  assert.equal(top.style.paddingLeft,mobile);
  align(null);
});
