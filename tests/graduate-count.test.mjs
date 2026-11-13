import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../about/js/about.js',import.meta.url),'utf8');
const block=source.slice(source.indexOf('// Count hours and graduate figures'),source.indexOf('/* 오른쪽 플로팅 목차'));
function setup(reduced=false){
  const nodes=[['1,216','1216','0'],['66.4%','66.4','1']].map(([textContent,target,decimals])=>({textContent,dataset:{countTo:target,countDecimals:decimals},classList:{contains:()=>true}}));
  let observer;const frames=new Map(),listeners={};let id=0;
  const motion={matches:reduced,addEventListener:(event,fn)=>{listeners.motion=fn;}};
  vm.runInNewContext(block,{document:{querySelectorAll:()=>nodes,hidden:false,addEventListener:(event,fn)=>{listeners[event]=fn;}},window:{IntersectionObserver:true},reducedMotion:motion,Intl,Number,
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:n=>frames.delete(n),
    IntersectionObserver:class{constructor(fn){this.fn=fn;observer=this;}observe(){}unobserve(){}disconnect(){}}
  });
  const step=time=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));};
  return {nodes,frames,listeners,step,enter:()=>observer.fn(nodes.map(target=>({target,isIntersecting:true,intersectionRatio:1})))};
}
test('graduate counters rise once, preserve comma/decimal/percent, and finish at source values',()=>{
  const x=setup();assert.deepEqual(x.nodes.map(n=>n.textContent),['0','0']);x.enter();x.step(0);x.step(1100);
  assert.equal(x.nodes[0].textContent,'608');assert.equal(x.nodes[1].textContent,'33.2%');
  x.step(2200);assert.deepEqual(x.nodes.map(n=>n.textContent),['1,216','66.4%']);x.enter();assert.equal(x.frames.size,0);
});
test('reduced motion preserves original figures and preference changes complete active counters',()=>{
  assert.deepEqual(setup(true).nodes.map(n=>n.textContent),['1,216','66.4%']);
  const x=setup();x.enter();x.step(0);x.listeners.motion({matches:true});
  assert.deepEqual(x.nodes.map(n=>n.textContent),['1,216','66.4%']);assert.equal(x.frames.size,0);
});
test('only cumulative total and four cohort totals opt into graduate animation',()=>{
  const html=readFileSync(new URL('../src/pages/about/index.html',import.meta.url),'utf8');
  const section=html.slice(html.indexOf('<section class="graduate-stats"'),html.indexOf('<p class="graduate-stats-note"'));
  assert.equal((section.match(/class="graduate-number"/g)||[]).length,5);
  assert.deepEqual([...section.matchAll(/class="graduate-number" data-count-to="(\d+)"/g)].map(m=>m[1]),['1216','307','305','302','302']);
  for(const match of section.matchAll(/<dl class="graduate-breakdown">([\s\S]*?)<\/dl>/g)) assert.doesNotMatch(match[1],/graduate-number|data-count-to|education-hours-number-label/);
});
