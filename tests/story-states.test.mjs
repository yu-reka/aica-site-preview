import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from '../scripts/build.mjs';
import {connectBackoffice} from '../scripts/backoffice-site.mjs';
import {readFileSync} from 'node:fs';
class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attrs={};this.classList={add:()=>{}};this.events={};}
  setAttribute(key,value){this.attrs[key]=value;}
  addEventListener(key,callback){this.events[key]=callback;}
  replaceChildren(...children){this.children=children;}
}
function start(extra={}){
  let reloads=0;
  const document={readyState:'loading',body:{dataset:{}},createElement:tag=>new Element(tag),addEventListener(){}};
  const context=vm.createContext({document,Event,location:{reload(){reloads++;}},...extra});
  vm.runInContext(readFileSync(new URL('../stories/js/story-state.js',import.meta.url),'utf8'),context);
  return {state:context.StoryState,document,get reloads(){return reloads;}};
}
test('empty collection has an accessible explanation and a local route to other stories',()=>{
  const {state}=start(),host=new Element('div');state.render(host,'empty',{subject:'기수 이야기'});
  assert.equal(host.attrs.role,'status');assert.equal(host.dataset.storyState,'empty');
  assert.equal(host.children[1].textContent,'아직 등록된 기수 이야기가 없습니다.');
  assert.equal(host.children[3].href,'index.html');
});
test('filter reset invokes the real owner callback and DB/user text stays literal',()=>{
  const {state}=start(),host=new Element('div');let resets=0;
  state.render(host,'filter',{subject:'<img src=x onerror=alert(1)>',onReset(){resets++;}});
  assert.equal(host.children[1].textContent,'조건에 맞는 <img src=x onerror=alert(1)>가 없습니다.');
  assert.equal(host.children[1].innerHTML,undefined);
  host.children[3].events.click();assert.equal(resets,1);
});
test('load failure is distinct from empty and its retry reloads the current page',()=>{
  const ui=start(),host=new Element('div');
  ui.state.render(host,'error');assert.equal(host.dataset.storyState,'error');
  assert.equal(host.children[1].textContent,'이야기를 불러오지 못했습니다.');
  host.children[3].events.click();assert.equal(ui.reloads,1);
});
test('all four connected collection pages load shared states before their controllers',()=>{
  const pages=connectBackoffice(build());
  for(const kind of ['reviews','interviews','projects','cohorts']){
    const html=pages.get('stories/'+kind+'.html');
    assert.equal((html.match(/data-story-list-state/g)||[]).length,1,kind);
    assert.match(html,/stories\/js\/story-state.js|js\/story-state.js/,kind);
    assert.ok(html.includes('css/story-state.css?v='),kind);
    assert.ok(html.indexOf('story-state.js')<html.indexOf(kind==='cohorts'?'cohort-v3.js':kind==='projects'?'projects-filter.js':kind==='interviews'?'stories-sections.js':'stories-m-reviews.js'));
  }
});

test('review reset dispatches actual radio changes and synchronizes both view owners',()=>{
  const ui=start(),radios=new Map(),events=[];
  for(const id of ['rc_all','fco_all','pgn1'])radios.set(id,{checked:false,dispatchEvent(event){events.push([id,event.type,event.bubbles]);}});
  ui.document.getElementById=id=>radios.get(id);
  const section={dispatchEvent(event){events.push(['section',event.type]);}};
  ui.state.resetReviews(section);
  assert.ok([...radios.values()].every(radio=>radio.checked));
  assert.deepEqual(events,[['rc_all','change',true],['fco_all','change',true],['pgn1','change',true],['section','reviews:reset']]);
});


test('API failure uses a valid snapshot and distinguishes unavailable data from a successful empty response',()=>{
  for(const scenario of [
    {failed:true,items:[],unavailable:true},
    {failed:true,items:[{id:1}],unavailable:false},
    {failed:false,items:[],unavailable:false}
  ]){
    const host=new Element('div');host.hidden=true;
    const section={querySelector:()=>host,querySelectorAll:()=>[]};
    const document={readyState:'complete',body:{dataset:{}},documentElement:{dataset:{sub:'projects'}},createElement:tag=>new Element(tag),querySelector:()=>section};
    const window={AicaPublicContentStatus:{storiesApiFailed:scenario.failed},STORIES_DATA:{projects:scenario.items}};
    vm.runInNewContext(readFileSync(new URL('../stories/js/story-state.js',import.meta.url),'utf8'),{window,document,location:{}});
    assert.equal(host.dataset.storyState,scenario.unavailable?'error':'empty');
    assert.equal(document.body.dataset.publicContentUnavailable==='true',scenario.unavailable);
  }
});

test('cohort page without posts or with a failed load shows only the page state, even when cohort info blocks exist',()=>{
  // A published post without a valid cohort makes no chip, so it counts as no post.
  const noCohort={querySelector:s=>s==='.cg'?{textContent:'기'}:null};
  for(const [withInfo,unavailable,cards] of [[true,false,[]],[false,false,[]],[true,true,[]],[true,false,[noCohort]]]){
    const host=new Element('div'),cv3={hidden:false,setAttribute(){}};host.hidden=true;
    const section={querySelector:s=>s==='[data-story-list-state]'?host:s.includes('data-cohort-infos')&&withInfo?{}:null,querySelectorAll:s=>s==='.cv3'?[cv3]:[]};
    const document={readyState:'complete',body:{dataset:unavailable?{publicContentUnavailable:'true'}:{}},documentElement:{dataset:{sub:'cohorts'}},createElement:tag=>new Element(tag),
      querySelector:s=>s==='#p-coh'?section:null,getElementById:id=>id==='cv3-data'?{content:{querySelectorAll:()=>cards}}:null};
    vm.runInContext(readFileSync(new URL('../stories/js/story-state.js',import.meta.url),'utf8'),vm.createContext({document,Event,location:{}}));
    assert.equal(cv3.hidden,true);assert.equal(host.hidden,false);
    assert.equal(host.dataset.storyState,unavailable?'error':'empty');
  }
});

test('desktop review empty updates preserve the reset action through resize/change and still reset real radios',()=>{
  const host=new Element('div'),card=new Element('a'),pager=new Element('nav'),summary=new Element('summary');
  let focused=false;summary.focus=()=>{focused=true;};
  const section=new Element('section'),radios=new Map(),listeners={},cohortDropdown={open:true};
  for(const id of ['rc_all','fco_all','pgn1'])radios.set(id,{
    checked:false,
    dispatchEvent(event){section.events[event.type]?.({target:this});}
  });
  section.dispatchEvent=event=>section.events[event.type]?.(event);
  section.querySelector=selector=>({'[data-story-list-state]':host,'.pager':pager,'.dw-fco summary':summary,'.dw-fco':cohortDropdown}[selector]||null);
  section.querySelectorAll=selector=>selector==='.idgrid .idc'?[card]:[];
  const document={readyState:'complete',body:{dataset:{}},documentElement:{dataset:{sub:'reviews'}},
    createElement:tag=>new Element(tag),getElementById:id=>radios.get(id),
    querySelector:selector=>selector==='#p-rev'?section:null};
  const context=vm.createContext({document,Event,location:{hash:''},matchMedia:()=>({matches:false}),
    getComputedStyle:()=>({display:radios.get('rc_all').checked&&radios.get('fco_all').checked?'flex':'none'}),
    addEventListener(name,callback){listeners[name]=callback;}});
  vm.runInContext(readFileSync(new URL('../stories/js/story-state.js',import.meta.url),'utf8'),context);
  section.events.change({target:{name:'fco'}});
  assert.equal(cohortDropdown.open,false,'selecting a cohort must close its pointer-blocking dropdown');
  const action=host.children[3];
  assert.equal(host.hidden,false);assert.equal(action.textContent,'필터 초기화');
  for(const update of [listeners.resize,section.events.change,listeners.resize,listeners.hashchange]){
    update();assert.equal(host.children[3],action,'an empty update must not detach a pending pointer-click target');
  }
  action.events.click();
  assert.ok([...radios.values()].every(radio=>radio.checked));
  assert.equal(host.hidden,true);assert.equal(pager.hidden,false);assert.equal(focused,true);
  // Returning to the same empty filter reuses its valid reset action as well.
  radios.get('fco_all').checked=false;section.events.change();
  assert.equal(host.hidden,false);assert.equal(host.children[3],action);
});


test('review filter notice lives on the review board and keeps its reset action',()=>{
  const {state}=start(),host=new Element('div');let placed,resets=0;
  state.render(host,'filter',{subject:'후기',reviewBoard:{appendChild(node){placed=node;}},onReset(){resets++;}});
  assert.equal(placed,host);
  assert.equal(host.children[1].textContent,'조건에 맞는 후기가 없습니다.');
  host.children[3].events.click();assert.equal(resets,1);
});


test('hub distinguishes all-empty, both sources failed, and a single empty section',()=>{
  for(const [data,failed,expected] of [
    [{reviews:[],interviews:[],projects:[],cohorts:[]},false,'empty'],
    [undefined,true,'error'],
    [{reviews:[{id:1}],interviews:[],projects:[],cohorts:[]},false,null]
  ]){
    const host=new Element('div'),body=new Element('div');host.hidden=true;
    const groups=Object.fromEntries(['interviews','reviews','projects','cohorts'].map(key=>['#hub-'+key,new Element('section')]));
    const page={querySelector:s=>s==='[data-story-list-state]'?host:s==='.hb'?body:groups[s]};
    const document={readyState:'complete',body:{dataset:failed?{publicContentUnavailable:'true'}:{}},documentElement:{dataset:{sub:'overview'}},querySelector:()=>page,createElement:tag=>new Element(tag)};
    const window={STORIES_DATA:data,AicaPublicContentStatus:{storiesApiFailed:failed}};
    vm.runInNewContext(readFileSync(new URL('../stories/js/story-state.js',import.meta.url),'utf8'),{window,document,location:{reload(){}}});
    assert.equal(host.dataset.storyState,expected||undefined);
    assert.equal(host.hidden,!expected);
    if(expected){
      assert.equal(body.hidden,true);
      if(expected==='empty'){
        assert.equal(host.children.length,3,'hub must not link back to itself');
        assert.equal(host.children[2].textContent,'새로운 이야기가 등록되면 이곳에서 확인할 수 있습니다.');
      }else assert.equal(host.children[3].textContent,'다시 시도');
    }
    else {assert.notEqual(groups['#hub-reviews'].hidden,true);assert.equal(groups['#hub-interviews'].hidden,true);}
  }
});


test('the hub final unavailable view reveals its own heading-and-state wrapper',()=>{
  const host=new Element('div'),body=new Element('div'),wrapper=new Element('section');wrapper.hidden=true;
  const page={querySelector:s=>s==='[data-story-list-state]'?host:s==='[data-story-overview-state]'?wrapper:s==='.hb'?body:null};
  const document={readyState:'complete',body:{dataset:{publicContentUnavailable:'true'}},documentElement:{dataset:{sub:'overview'}},querySelector:()=>page,createElement:t=>new Element(t)};
  vm.runInNewContext(readFileSync(new URL('../stories/js/story-state.js',import.meta.url),'utf8'),{window:{},document,location:{}});
  assert.equal(wrapper.hidden,false);assert.equal(host.hidden,false);assert.equal(body.hidden,true);assert.equal(host.dataset.storyState,'error');
});


test('empty and unavailable interviews hide data-dependent honors and reveal the final collection state',()=>{
  for(const [failed,cards,expected] of [[false,[],'empty'],[true,[],'error'],[false,[{}],null]]){
    const host=new Element('div'),honors=new Element('section');host.hidden=true;honors.hidden=false;
    const section={querySelector:()=>host,querySelectorAll:s=>s.includes('[href^=')?cards:s.includes('.iv-honors')?[honors]:[]};
    const document={readyState:'complete',body:{dataset:failed?{publicContentUnavailable:'true'}:{}},documentElement:{dataset:{sub:'interviews'}},querySelector:()=>section,createElement:t=>new Element(t)};
    vm.runInNewContext(readFileSync(new URL('../stories/js/story-state.js',import.meta.url),'utf8'),{window:{},document,location:{}});
    assert.equal(honors.hidden,!!expected);assert.equal(host.hidden,!expected);assert.equal(host.dataset.storyState,expected||undefined);
  }
});
