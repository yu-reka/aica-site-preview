import {runInNewContext,runInContext} from './support/runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../stories/js/interview-honors.js',import.meta.url),'utf8');
const gesture=source.slice(source.indexOf('  // Follow the finger'),source.indexOf("  track.addEventListener('click', function (event) {"));
function setup(){
  let now=0,captured=false;
  const events={},alignments=[],classes=new Set();
  const track={scrollLeft:312,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},
    addEventListener:(type,fn)=>{(events[type] ||= []).push(fn);},
    setPointerCapture:()=>{captured=true;},hasPointerCapture:()=>captured,releasePointerCapture:()=>{captured=false;},
    scrollTo:({left})=>{track.scrollLeft=left;}};
  runInNewContext(gesture,{mobileSwipeView:{matches:true},mobileSwipe:null,track,timer:0,clearTimeout(){},
    performance:{now:()=>now},cards:Array.from({length:5},()=>({offsetWidth:300})),
    nearest:()=>Math.round(track.scrollLeft/312),align:(...args)=>alignments.push(args),suppressClickUntil:0});
  function fire(type,x,y=20,time=now){now=time;let prevented=false;
    const event={pointerId:1,isPrimary:true,button:0,clientX:x,clientY:y,preventDefault:()=>{prevented=true;}};
    events[type].forEach(fn=>fn(event));return prevented;}
  return {track,alignments,classes,fire};
}
test('short quick horizontal flick follows the pointer and settles to the next card immediately on release',()=>{
  const s=setup();s.fire('pointerdown',200);assert.equal(s.fire('pointermove',180,20,80),true);
  assert.equal(s.track.scrollLeft,332);
  s.fire('pointerup',180,20,100);
  assert.deepEqual(s.alignments,[[2,false]]);
  assert.equal(s.classes.has('is-swiping'),false);
});
test('vertical scroll and an ordinary tap do not turn cards',()=>{
  const s=setup();s.fire('pointerdown',200);assert.equal(s.fire('pointermove',198,60,50),false);
  s.fire('pointerup',198,60,100);assert.equal(s.track.scrollLeft,312);assert.equal(s.alignments.length,0);
  s.fire('pointerdown',200);s.fire('pointerup',200);assert.equal(s.alignments.length,0);
});
test('short slow drag and cancelled swipe return to the starting card',()=>{
  for(const cancelled of [false,true]){
    const s=setup();s.fire('pointerdown',200);s.fire('pointermove',cancelled?100:180,20,300);
    s.fire(cancelled?'pointercancel':'pointerup',cancelled?100:180,20,500);
    assert.deepEqual(s.alignments,[[1,false]]);
  }
});
