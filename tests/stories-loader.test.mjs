import {runInNewContext,runInContext} from './support/runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../common/js/stories-loader.js',import.meta.url),'utf8');
const data=()=>({reviews:[],interviews:[],projects:[],cohorts:[]});
function start({api=data(),fallback=data(),failure=false,pending=false,savedHeight=null,storageError=false,width=390,page='stories/index.html'}={}){
  const scripts=[],requests=[],events={},attributes=new Map(),window={AicaPublicContentStatus:{}};
  const styles=new Map(),writes=[];
  window.innerWidth=width;window.sessionStorage={getItem:()=>{if(storageError)throw Error('blocked');return savedHeight;},setItem:(key,value)=>{if(storageError)throw Error('full');writes.push({key,value});}};
  const main={style:{setProperty:(key,value)=>styles.set(key,value),removeProperty:key=>styles.delete(key)},getBoundingClientRect:()=>({height:1600.25}),setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)};
  const document={readyState:pending?'loading':'interactive',currentScript:{dataset:{page,api:'../api/public/stories',fallback:'js/stories-data.js?v=test',scripts:JSON.stringify(['render.js','state.js','mobile.js'])}},
    body:{dataset:{}},querySelector:()=>main,addEventListener:(k,fn)=>events[k]=fn,createElement:()=>({}),head:{appendChild(script){
      scripts.push(script.src);queueMicrotask(()=>{
        if(script.src.startsWith('js/stories-data')){if(fallback){window.STORIES_DATA=fallback;script.onload();}else script.onerror();}
        else script.onload();
      });
    }}};
  const context=vm.createContext({window,document,Promise,AbortController,setTimeout,clearTimeout,
    fetch:async(url,options)=>{requests.push({url,options});if(failure)throw Error('offline');return{ok:true,json:async()=>api};}});
  runInContext(code,context);
  return{window,document,scripts,requests,attributes,styles,writes,domReady:()=>events.DOMContentLoaded?.()};
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

test('loading restores a bounded same-page viewport height, then releases it and records the completed layout',async()=>{
  const ui=start({savedHeight:'1750',page:'stories/reviews.html',width:430});
  assert.equal(ui.styles.get('--story-loading-height'),'1750px');
  await ui.window.AicaStoryReady;
  assert.equal(ui.styles.size,0);
  assert.deepEqual(ui.writes,[{key:'aica:story-height:v1:stories/reviews.html:430',value:'1601'}]);
  assert.equal(ui.attributes.size,0);
});
test('invalid cached heights and unavailable storage never reserve unbounded space or block content',async()=>{
  for(const savedHeight of [null,'NaN','0','-400','20001','900px']){
    const ui=start({savedHeight});assert.equal(ui.styles.size,0);await ui.window.AicaStoryReady;assert.equal(ui.styles.size,0);
  }
  const blocked=start({storageError:true});await blocked.window.AicaStoryReady;
  assert.equal(blocked.attributes.size,0);assert.equal(blocked.styles.size,0);
  assert.deepEqual(blocked.scripts,['render.js','state.js','mobile.js']);
});
test('empty API results and both failed sources release a restored loading height',async()=>{
  for(const options of [{api:data()},{failure:true,fallback:null}]){
    const ui=start({...options,savedHeight:'3000'});assert.equal(ui.styles.size,1);
    await ui.window.AicaStoryReady;assert.equal(ui.styles.size,0);assert.equal(ui.attributes.size,0);
  }
});
