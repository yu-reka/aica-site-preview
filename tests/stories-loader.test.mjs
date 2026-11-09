import {runInNewContext,runInContext} from './support/runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../common/js/stories-loader.js',import.meta.url),'utf8');
const data=()=>({reviews:[],interviews:[],projects:[],cohorts:[]});
function start({api=data(),fallback=data(),failure=false,pending=false,savedHeight=null,storageError=false,width=390,page='stories/index.html',fetchImpl,noMainUntilReady=false,holdConsumers=false,setTimer=setTimeout,clearTimer=clearTimeout}={}){
  const scripts=[],scriptNodes=[],requests=[],events={},attributes=new Map(),window={AicaPublicContentStatus:{}};
  let mainAvailable=!noMainUntilReady, reloads=0;
  const styles=new Map(),writes=[];
  window.innerWidth=width;window.sessionStorage={getItem:()=>{if(storageError)throw Error('blocked');return savedHeight;},setItem:(key,value)=>{if(storageError)throw Error('full');writes.push({key,value});}};
  const main={hasAttribute:key=>attributes.has(key),style:{setProperty:(key,value)=>styles.set(key,value),removeProperty:key=>styles.delete(key)},getBoundingClientRect:()=>({height:1600.25}),setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)};
  const document={readyState:pending?'loading':'interactive',currentScript:{dataset:{page,api:'../api/public/stories',fallback:'js/stories-data.js?v=test',scripts:JSON.stringify(['render.js','state.js','mobile.js'])}},
    body:noMainUntilReady?null:{dataset:{}},querySelector:()=>mainAvailable?main:null,addEventListener:(k,fn)=>events[k]=fn,createElement:()=>({}),head:{appendChild(script){
      scripts.push(script.src);scriptNodes.push(script);if(holdConsumers&&!script.src.startsWith('js/stories-data'))return;queueMicrotask(()=>{
        if(script.src.startsWith('js/stories-data')){if(fallback){window.STORIES_DATA=fallback;script.onload();}else script.onerror();}
        else script.onload();
      });
    }}};
  const context=vm.createContext({window,document,location:{reload:()=>{reloads++;}},Promise,AbortController,setTimeout:setTimer,clearTimeout:clearTimer,
    fetch:async(url,options)=>{requests.push({url,options});if(fetchImpl)return fetchImpl(url,options);if(failure)throw Error('offline');return{ok:true,json:async()=>api};}});
  runInContext(code,context);
  return{window,document,scripts,scriptNodes,requests,attributes,styles,writes,events,reloads:()=>reloads,domReady:()=>{mainAvailable=true;document.body ||= {dataset:{}};events.DOMContentLoaded?.();}};
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

function manualClock(){
  const tasks=new Map();let id=0,now=0;
  return{set(fn,ms){assert.ok([8000,30000].includes(ms));tasks.set(++id,{fn,at:now+ms});return id;},clear(id){tasks.delete(id);},advance(ms){now+=ms;for(const[id,task]of tasks)if(task.at<=now){tasks.delete(id);task.fn();}},pending:()=>tasks.size};
}
test('headers arriving promptly keep a slow response body alive beyond the header deadline',async()=>{
  const clock=manualClock();let finish,signal;const api=data();
  const ui=start({setTimer:clock.set,clearTimer:clock.clear,fetchImpl:async(_,options)=>{
    signal=options.signal;return{ok:true,json:()=>new Promise((resolve,reject)=>{finish=resolve;signal.addEventListener('abort',()=>reject(Error('aborted')));})};
  }});
  await new Promise(resolve=>setImmediate(resolve));clock.advance(8001);
  assert.equal(signal.aborted,false,'the header deadline must not discard a pending API body');
  finish(api);await ui.window.AicaStoryReady;assert.equal(ui.window.STORIES_DATA,api);
  assert.deepEqual(ui.scripts,['render.js','state.js','mobile.js']);
});
test('a response with no headers by the deadline still aborts and loads the snapshot',async()=>{
  const clock=manualClock();let signal;const fallback=data();
  const ui=start({fallback,setTimer:clock.set,clearTimer:clock.clear,fetchImpl:(_,options)=>new Promise((resolve,reject)=>{
    signal=options.signal;signal.addEventListener('abort',()=>reject(Error('header timeout')));
  })});
  clock.advance(8001);await ui.window.AicaStoryReady;assert.equal(signal.aborted,true);assert.equal(ui.window.STORIES_DATA,fallback);
  assert.equal(ui.scripts[0],'js/stories-data.js?v=test');
});

test('a stalled body gets its own deadline then releases loading through the existing fallback',async()=>{
  for(const fallback of [data(),null]){
    const clock=manualClock();let signal;
    const ui=start({fallback,savedHeight:'1750',setTimer:clock.set,clearTimer:clock.clear,fetchImpl:async(_,options)=>{
      signal=options.signal;return{ok:true,json:()=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('body timeout'))))};
    }});
    await new Promise(resolve=>setImmediate(resolve));clock.advance(29999);assert.equal(signal.aborted,false);
    clock.advance(1);assert.equal(signal.aborted,true,'a stalled response body must not leave the page loading forever');
    await ui.window.AicaStoryReady;assert.equal(ui.window.AicaPublicContentStatus.storiesApiFailed,true);assert.equal(ui.attributes.size,0);assert.equal(ui.styles.size,0);assert.equal(clock.pending(),0);
    if(fallback)assert.equal(ui.window.STORIES_DATA,fallback);else assert.equal(ui.document.body.dataset.publicContentUnavailable,'true');
  }
});
test('a ten-second body after late valid headers remains API data and clears both timers',async()=>{
  const clock=manualClock();let headers,finish,signal;const api=data();
  const ui=start({setTimer:clock.set,clearTimer:clock.clear,fetchImpl:(_,options)=>{signal=options.signal;return new Promise(resolve=>headers=()=>resolve({ok:true,json:()=>new Promise((resolve,reject)=>{finish=resolve;signal.addEventListener('abort',()=>reject(Error('aborted')));})}));}});
  clock.advance(7000);headers();await new Promise(resolve=>setImmediate(resolve));clock.advance(10000);assert.equal(signal.aborted,false);
  finish(api);await ui.window.AicaStoryReady;assert.equal(ui.window.STORIES_DATA,api);assert.equal(clock.pending(),0);clock.advance(60000);assert.equal(signal.aborted,false);
});


test('head execution starts exactly one API request before main exists and waits for DOM before consumers',async()=>{
  const ui=start({pending:true,noMainUntilReady:true});
  assert.equal(ui.requests.length,1);assert.equal(ui.document.body,null);
  await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(ui.scripts,[]);
  ui.domReady();await ui.window.AicaStoryReady;
  assert.equal(ui.requests.length,1);assert.deepEqual(ui.scripts,['render.js','state.js','mobile.js']);assert.equal(ui.attributes.size,0);
});
test('an early failed API waits for body and shared runtime readiness before snapshot or error rendering',async()=>{
  for(const fallback of [data(),null]){
    const ui=start({pending:true,noMainUntilReady:true,failure:true,fallback});
    await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(ui.scripts,[]);assert.equal(ui.document.body,null);
    ui.domReady();await ui.window.AicaStoryReady;
    assert.equal(ui.scripts[0],'js/stories-data.js?v=test');assert.equal(ui.attributes.size,0);
    if(!fallback)assert.equal(ui.document.body.dataset.publicContentUnavailable,'true');
  }
});
test('consumer downloads all start before the first finishes, opt into ordered execution, and release loading after all outcomes',async()=>{
  const ui=start({holdConsumers:true});await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(ui.scripts,['render.js','state.js','mobile.js']);
  assert.ok(ui.scriptNodes.every(s=>s.async===false));assert.equal(ui.attributes.get('aria-busy'),'true');
  ui.scriptNodes[0].onload();ui.scriptNodes[1].onerror();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ui.document.body.dataset.publicContentUnavailable,'true');assert.equal(ui.attributes.get('aria-busy'),'true');
  ui.scriptNodes[2].onload();await ui.window.AicaStoryReady;assert.equal(ui.attributes.size,0);assert.equal(ui.styles.size,0);
});


test('loading card retry reloads only while the actual request is pending',async()=>{
  let release;
  const ui=start({fetchImpl:()=>new Promise(resolve=>{release=resolve;})});
  const event={target:{closest:selector=>selector==='[data-story-loading-retry]'?{}:null}};
  ui.events.click(event);assert.equal(ui.reloads(),1);
  release({ok:true,json:async()=>data()});await ui.window.AicaStoryReady;
  ui.events.click(event);assert.equal(ui.reloads(),1);
  assert.equal(ui.attributes.has('data-story-loading'),false);
});
