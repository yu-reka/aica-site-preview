import {runInContext} from './support/runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../common/js/faq-loader.js',import.meta.url),'utf8');
function clock(){const tasks=new Map();let id=0;return{set(fn,ms){assert.equal(ms,8000);tasks.set(++id,fn);return id;},clear(id){tasks.delete(id);},fire(){for(const[id,fn]of tasks){tasks.delete(id);fn();}},size:()=>tasks.size};}
function start({api={items:[]},fallback={items:[{question:'Fallback'}]},failure=false,pending=false,fetchImpl}={}){
  const window={},scripts=[],requests=[],events={},timer=clock();
  const document={readyState:pending?'loading':'interactive',currentScript:{dataset:{api:'../api/public/faq',fallback:'js/faq-data.js?v=test',renderer:'js/faq-render.js?v=test'}},querySelector:()=>({}),addEventListener:(key,fn)=>events[key]=fn,
    head:{appendChild(script){scripts.push(script.src);queueMicrotask(()=>{if(script.src.startsWith('js/faq-data')){if(fallback){window.FAQ_DATA=fallback;script.onload();}else script.onerror();}else script.onload();});}},createElement:()=>({})};
  runInContext(source,vm.createContext({window,document,Promise,AbortController,setTimeout:timer.set,clearTimeout:timer.clear,fetch:async(url,options)=>{requests.push({url,options});if(fetchImpl)return fetchImpl(url,options);if(failure)throw Error('offline');return{ok:true,json:async()=>api};}}));
  return{window,document,scripts,requests,timer,domReady:()=>events.DOMContentLoaded?.()};
}
test('FAQ uses valid JSON including an empty list without requesting the snapshot',async()=>{
  for(const api of [{items:[]},{items:[{question:'API'}]}]){
    const ui=start({api});await ui.window.AicaFaqReady;assert.equal(ui.window.FAQ_DATA,api);assert.deepEqual(ui.scripts,['js/faq-render.js?v=test']);assert.equal(ui.requests[0].url,'../api/public/faq');assert.equal(ui.timer.size(),0);
  }
});
test('FAQ failure or invalid shape loads the snapshot once before the renderer',async()=>{
  for(const options of [{failure:true},{api:{items:'invalid'}}]){const ui=start(options);await ui.window.AicaFaqReady;assert.deepEqual(ui.scripts,['js/faq-data.js?v=test','js/faq-render.js?v=test']);assert.equal(ui.window.FAQ_DATA.items[0].question,'Fallback');}
});
test('immediate FAQ data cannot start consumers before common navigation DOM readiness',async()=>{
  const ui=start({pending:true});await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(ui.scripts,[]);ui.domReady();await ui.window.AicaFaqReady;assert.deepEqual(ui.scripts,['js/faq-render.js?v=test']);
});
test('FAQ headers and response body stalls both time out into the snapshot',async()=>{
  for(const body of [false,true]){let signal;const ui=start({fetchImpl:(_,options)=>{signal=options.signal;const stalled=()=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout'))));return body?{ok:true,json:stalled}:stalled();}});await new Promise(resolve=>setImmediate(resolve));ui.timer.fire();await ui.window.AicaFaqReady;assert.equal(signal.aborted,true);assert.equal(ui.window.FAQ_DATA.items[0].question,'Fallback');assert.deepEqual(ui.scripts,['js/faq-data.js?v=test','js/faq-render.js?v=test']);}
});
test('both FAQ sources failing still let the static page and FAQ controller initialize',async()=>{
  const ui=start({failure:true,fallback:null});await ui.window.AicaFaqReady;assert.equal(ui.window.FAQ_DATA,undefined);assert.deepEqual(ui.scripts,['js/faq-data.js?v=test','js/faq-render.js?v=test']);assert.equal(ui.timer.size(),0);
});
