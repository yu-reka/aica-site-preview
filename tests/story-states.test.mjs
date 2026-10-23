import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {springArtifacts} from '../scripts/export-spring.mjs';
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
test('load failure is distinct from empty, gives retry, and uses the explicit Spring flag only',()=>{
  const ui=start(),host=new Element('div');assert.equal(ui.state.failed(),false);
  ui.document.body.dataset.publicContentUnavailable='true';assert.equal(ui.state.failed(),true);
  ui.state.render(host,'error');assert.equal(host.dataset.storyState,'error');
  assert.equal(host.children[1].textContent,'이야기를 불러오지 못했습니다.');
  host.children[3].events.click();assert.equal(ui.reloads,1);
});
test('all four exported collection pages share states and failure contract without expanding Spring output paths',()=>{
  const artifacts=springArtifacts();assert.equal(artifacts.size,12);
  for(const kind of ['reviews','interviews','projects','cohorts']){
    const html=artifacts.get('templates/public-site/'+kind+'.html');
    assert.equal((html.match(/data-story-list-state/g)||[]).length,1,kind);
    assert.ok(html.includes('data-public-content-unavailable=${publicContentUnavailable == true}'),kind);
    assert.ok(html.includes('/stories/js/story-state.js?v=1022chips-posts-only'),kind);
    assert.ok(html.includes('/stories/css/story-state.css?v=1020states'),kind);
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
    const ui=start({window:{AicaPublicContentStatus:{storiesApiFailed:scenario.failed},STORIES_DATA:{reviews:scenario.items}}});
    ui.document.documentElement={dataset:{sub:'reviews'}};
    assert.equal(ui.state.failed(),scenario.unavailable);
    assert.equal(ui.document.body.dataset.publicContentUnavailable==='true',scenario.unavailable);
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
