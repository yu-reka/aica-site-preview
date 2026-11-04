import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from './support/runtime.mjs';

const source=readFileSync(new URL('../stories/js/interview-honors.js',import.meta.url),'utf8');
const restore=source.slice(source.indexOf('  function restoreHonors()'),source.lastIndexOf('})();'));
function start(hash){
  const frames=[],events={},positions=[];
  const state={location:{hash},originals:['#iv-a','#iv-b','#iv-c'].map(href=>({getAttribute:()=>href})),
    first:1,current:1,fanIndex:0,fanCursor:0,
    requestAnimationFrame:fn=>frames.push(fn),addEventListener:(type,fn)=>{events[type]=fn;}};
  state.syncLayout=()=>positions.push([state.current,state.fanIndex,state.fanCursor]);
  runInNewContext(restore,state);
  const flush=()=>{while(frames.length)frames.shift()();};
  const go=hash=>{state.location.hash=hash;events.hashchange();flush();};
  return {state,positions,flush,go};
}
test('direct honors detail returns to that card rather than the hidden loop copy',()=>{
  const ui=start('#iv-b');ui.flush();
  assert.deepEqual(ui.positions.at(-1),[2,1,1]);
  ui.go('#p-iv');assert.deepEqual(ui.positions.at(-1),[2,1,1]);
});
test('later detail navigation updates the remembered card and both list anchors preserve it',()=>{
  const ui=start('#iv-a');ui.flush();ui.go('#iv-c');
  for(const hash of ['#iv-honors-title','#p-iv']){
    ui.go(hash);assert.deepEqual(ui.positions.at(-1),[3,2,2]);
  }
});
