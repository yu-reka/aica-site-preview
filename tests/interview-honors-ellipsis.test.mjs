import {runInNewContext,runInContext} from './support/runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../stories/js/interview-honors.js',import.meta.url),'utf8');
const fitting=source.slice(source.indexOf('  var summaries ='),source.indexOf("  var desktopCount ="));
function setup(text,width){
  const el={textContent:text,clientWidth:width,clientHeight:48,setAttribute(){},
    get scrollHeight(){return Math.ceil(Array.from(this.textContent).length/this.clientWidth)*24;}};
  const context=vm.createContext({track:{querySelectorAll:()=>[el]},document:{},addEventListener(){},cancelAnimationFrame(){},requestAnimationFrame(){}});
  runInContext(fitting,context);return {el,fit:()=>runInContext('fitSummaries()',context)};
}
test('overflowing honors excerpt ends in a centered ellipsis and fits two lines',()=>{
  const s=setup('가'.repeat(60),20);s.fit();
  assert.equal(s.el.textContent,'가'.repeat(39)+'⋯');
  assert.ok(s.el.scrollHeight<=s.el.clientHeight);
});
test('short text has no ellipsis and enlarging the card restores the full original summary',()=>{
  const text='짧은 문장입니다.';const short=setup(text,20);short.fit();assert.equal(short.el.textContent,text);
  const s=setup('나'.repeat(60),20);s.fit();s.el.clientWidth=40;s.fit();assert.equal(s.el.textContent,'나'.repeat(60));
});
test('hidden desktop/mobile copies are left intact until measurable',()=>{
  const s=setup('다'.repeat(60),0);s.fit();assert.equal(s.el.textContent,'다'.repeat(60));
  s.el.clientWidth=20;s.fit();assert.ok(s.el.textContent.endsWith('⋯'));
});
