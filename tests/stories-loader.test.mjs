import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../common/js/stories-loader.js',import.meta.url),'utf8');
const data=()=>({reviews:[],interviews:[],projects:[],cohorts:[]});
function start({api=data(),fallback=data(),failure=false,pending=false}={}){
  const scripts=[],requests=[],events={},attributes=new Map(),window={AicaPublicContentStatus:{}};
  const main={setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)};
  const document={readyState:pending?'loading':'interactive',currentScript:{dataset:{api:'../api/public/stories',fallback:'js/stories-data.js?v=test',scripts:JSON.stringify(['render.js','state.js','mobile.js'])}},
    body:{dataset:{}},querySelector:()=>main,addEventListener:(k,fn)=>events[k]=fn,createElement:()=>({}),head:{appendChild(script){
      scripts.push(script.src);queueMicrotask(()=>{
        if(script.src.startsWith('js/stories-data')){if(fallback){window.STORIES_DATA=fallback;script.onload();}else script.onerror();}
        else script.onload();
      });
    }}};
  const context=vm.createContext({window,document,Promise,AbortController,setTimeout,clearTimeout,
    fetch:async(url,options)=>{requests.push({url,options});if(failure)throw Error('offline');return{ok:true,json:async()=>api};}});
  vm.runInContext(code,context);
  return{window,document,scripts,requests,attributes,domReady:()=>events.DOMContentLoaded?.()};
}
test('valid API including a successful empty result never requests the snapshot and preserves consumer order',async()=>{
  for(const api of [data(),{...data(),reviews:[{id:1}]}]){
    const ui=start({api});await ui.window.AicaStoryReady;
    assert.deepEqual(ui.scripts,['render.js','state.js','mobile.js']);
    assert.equal(ui.requests.length,1);assert.equal(ui.requests[0].url,'../api/public/stories');
    assert.equal(ui.window.STORIES_DATA,api);assert.equal(ui.window.AicaPublicContentStatus.storiesApiFailed,false);
    assert.equal(ui.attributes.size,0);
  }
});
test('API failure or malformed JSON shape loads the fallback once before all consumers',async()=>{
  for(const options of [{failure:true},{api:{reviews:'invalid'}}]){
    const fallback={...data(),reviews:[{id:2}]},ui=start({...options,fallback});await ui.window.AicaStoryReady;
    assert.deepEqual(ui.scripts,['js/stories-data.js?v=test','render.js','state.js','mobile.js']);
    assert.equal(ui.window.STORIES_DATA,fallback);assert.equal(ui.document.body.dataset.publicContentUnavailable,undefined);
    assert.equal(ui.window.AicaPublicContentStatus.storiesApiFailed,true);
  }
});
test('both sources failing still initialize the shared error view and clear loading state',async()=>{
  const ui=start({failure:true,fallback:null});await ui.window.AicaStoryReady;
  assert.equal(ui.window.STORIES_DATA,undefined);assert.equal(ui.document.body.dataset.publicContentUnavailable,'true');
  assert.deepEqual(ui.scripts.slice(1),['render.js','state.js','mobile.js']);assert.equal(ui.attributes.size,0);
});
test('an immediately cached response cannot initialize story controllers before common navigation DOM readiness',async()=>{
  const ui=start({pending:true});await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(ui.scripts,[]);assert.equal(ui.attributes.get('aria-busy'),'true');
  ui.domReady();await ui.window.AicaStoryReady;assert.deepEqual(ui.scripts,['render.js','state.js','mobile.js']);
});
