import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../common/js/ui.js',import.meta.url),'utf8').split('/* Restore view choices')[1];
const script='/* Restore view choices'+source;
function page(store,{type='navigate',url='https://example.test/life/#tp-food',selected=false,ready=true,blocked=false}={}){
 const events={},handlers={},nodes=new Map();let clicked=0,observer;
 const button={id:'cafe',dataset:{kind:'cafe'},tagName:'BUTTON',textContent:'카페 8',selected,
  matches(){return this.selected;},closest(selector){return selector.includes('[hidden]')?null:{};},getClientRects(){return [1];},click(){this.selected=true;clicked++;}};
 const root={querySelectorAll(selector){return selector.startsWith('button')?[button]:[];}};
 const context={window:{addEventListener(name,fn){(handlers[name] ||= []).push(fn);events[name]=arg=>handlers[name].forEach(cb=>cb(arg));},scrollTo(){}},location:{href:url},scrollY:120,
  sessionStorage:{getItem(k){if(blocked)throw Error('disabled');return store[k];},setItem(k,v){if(blocked)throw Error('disabled');store[k]=v;},removeItem(k){delete store[k];}},
  document:{getElementById(){return root;},querySelector(p){return ready?nodes.get(p):null;},body:root},
  CSS:{escape:x=>x},performance:{getEntriesByType:()=>[{type}]},
  MutationObserver:class{constructor(fn){observer=fn;}observe(){}disconnect(){}},requestAnimationFrame(fn){fn();return 1;},cancelAnimationFrame(){},setTimeout(){}};
 nodes.set('#main #cafe',button);vm.runInNewContext(script,context);
 return {button,events,get clicks(){return clicked;},ready(){ready=true;observer?.();}};
}
test('reload restores a selected tab through its existing handler',()=>{
 const store={};const old=page(store,{selected:true});old.events.pagehide();
 const next=page(store,{type:'reload'});next.events.load();assert.equal(next.button.selected,true);assert.equal(next.clicks,1);
});
test('normal navigation and a different hash keep their own defaults',()=>{
 for(const options of [{type:'navigate'},{type:'reload',url:'https://example.test/life/#tp-fun'}]){
 const store={};page(store,{selected:true}).events.pagehide();const next=page(store,options);next.events.load?.();assert.equal(next.clicks,0);
 }
});
test('already selected choices are not toggled again',()=>{
 const store={};page(store,{selected:true}).events.pagehide();const next=page(store,{type:'reload',selected:true});next.events.load();assert.equal(next.clicks,0);
});
test('late-rendered API controls are restored when markup arrives',()=>{
 const store={};page(store,{selected:true}).events.pagehide();const next=page(store,{type:'reload',ready:false});next.events.load();assert.equal(next.clicks,0);next.ready();assert.equal(next.clicks,1);
});
test('blocked session storage leaves ordinary navigation usable',()=>{
 const next=page({}, {blocked:true});assert.doesNotThrow(()=>next.events.pagehide());assert.doesNotThrow(()=>next.events.load?.());
});

test('a browser cache return resets choices instead of preserving filters',()=>{
 const next=page({}, {selected:true});next.events.load();next.button.selected=false;
 next.events.pageshow({persisted:false});assert.equal(next.button.selected,false);
 next.events.pageshow({persisted:true});assert.equal(next.button.selected,true);
});
