import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Exercise the shipped controller against DOM/media-query event boundaries.
function runtime() {
  const events = {}, timers = new Map(), media = new Map();
  let timerId = 0, modalActive = false;
  const document = {documentElement:{dataset:{}}, body:{style:{}},
    currentScript:{src:'https://aica.test/common/js/site.js'},
    addEventListener(name, fn) {(events[name] ||= []).push(fn);},
    querySelector: selector => nodes[selector] || null,
    querySelectorAll: () => [], activeElement:null};
  function node() {
    const classes = new Set(), handlers = {};
    return {attributes:{}, style:{setProperty(){}},
      classList:{contains:x=>classes.has(x),add:x=>classes.add(x),remove:x=>classes.delete(x),
        toggle(x,on){if(on)classes.add(x);else classes.delete(x);}},
      addEventListener(name,fn){handlers[name]=fn;}, fire(name,event={}){handlers[name]?.(event);},
      setAttribute(name,value){this.attributes[name]=value;},
      getAttribute(name){return this.attributes[name];},
      contains(other){return other===this || this.children?.includes(other);},
      querySelector(){return null;}, querySelectorAll(){return [];},
      focus(){const changed=document.activeElement!==this; document.activeElement=this;
        if(changed){if(this===topLink)gnb.fire('focusin');(events.focusin || []).forEach(fn=>fn({target:this}));}}};
  }
  const header=node(), drawer=node(), dim=node(), menu=node(), close=node(), topLink=node(), gnb=node(), fab=node();
  drawer.children=[close]; gnb.children=[topLink];
  header.querySelector=s=>s==='.gnb'?gnb:s.startsWith('.gnb-link')?topLink:null;
  header.querySelectorAll=s=>s==='.drop'?[{offsetHeight:150}]:[];
  const nodes={'#siteHeader':header,'#drawer':drawer,'#drawerDim':dim,'#menuBtn':menu,
    '#drawerClose':close,'#fabTop':fab};
  const context={document,URL,location:{href:'https://aica.test/about/index.html',origin:'https://aica.test',
      pathname:'/about/index.html',search:'',hash:''},window:{},scrollY:0,innerHeight:900,
    addEventListener(name,fn){(events[name] ||= []).push(fn);},
    matchMedia(query){
      if(!media.has(query))media.set(query,{matches:query.includes('max-width'),listeners:[],
        addEventListener(name,fn){if(name==='change')this.listeners.push(fn);},
        change(matches){if(this.matches===matches)return;this.matches=matches;this.listeners.forEach(fn=>fn());}});
      return media.get(query);
    },
    setTimeout(fn){timers.set(++timerId,fn);return timerId;}, clearTimeout(id){timers.delete(id);},
    SiteUI:{createDialogScope:()=>({activate(){modalActive=true;},release(){modalActive=false;}}),trapFocus(){}},
    SiteLayout:()=>Object.fromEntries(['renderHeader','renderLnb','renderFooter','renderFloating'].map(k=>[k,()=>{}]))};
  vm.runInNewContext(readFileSync(new URL('../common/js/site.js',import.meta.url),'utf8'),context);
  return {document,header,drawer,dim,menu,close,topLink,gnb,events,
    boundary:media.get('(min-width:1081px)'),
    get modalActive(){return modalActive;},
    flush(){for(const [id,fn] of timers){timers.delete(id);fn();}}};
}

test('desktop boundary closes the mobile modal, unlocks body and restores visible focus',()=>{
  const h=runtime();
  h.menu.focus(); h.menu.fire('click'); h.flush();
  assert.equal(h.drawer.classList.contains('is-open'),true);
  assert.equal(h.modalActive,true);
  assert.equal(h.document.body.style.overflow,'hidden');
  assert.equal(h.document.activeElement,h.close);
  h.boundary.change(true);
  assert.equal(h.drawer.classList.contains('is-open'),false);
  assert.equal(h.dim.classList.contains('is-open'),false);
  assert.equal(h.menu.getAttribute('aria-expanded'),'false');
  assert.equal(h.document.body.style.overflow,'');
  assert.equal(h.modalActive,false);
  assert.equal(h.document.activeElement,h.topLink);
  assert.equal(h.header.classList.contains('menu-open'),false,'restored focus must not reopen the dropdown');
  h.boundary.change(false);
  assert.equal(h.document.activeElement,h.menu);
  h.menu.fire('click'); h.flush();
  assert.equal(h.drawer.classList.contains('is-open'),true,'menu remains reusable after crossing twice');
});

test('desktop dropdown is cleared when its focused controls become mobile-only',()=>{
  const h=runtime(); h.boundary.change(true);
  h.topLink.focus();
  assert.equal(h.header.classList.contains('menu-open'),true);
  h.document.activeElement=h.document.body; // CSS display:none can blur before matchMedia dispatch.
  h.boundary.change(false);
  assert.equal(h.header.classList.contains('menu-open'),false);
  assert.equal(h.document.activeElement,h.menu);
  assert.equal(h.drawer.classList.contains('is-open'),false);
});

test('boundary change does not steal focus after interacting outside navigation',()=>{
  const h=runtime(); h.boundary.change(true); h.topLink.focus();
  h.events.pointerdown.forEach(fn=>fn({target:h.document.body}));
  h.document.activeElement=h.document.body;
  h.boundary.change(false);
  assert.equal(h.document.activeElement,h.document.body);
  assert.equal(h.header.classList.contains('menu-open'),false);
});

test('rapid boundary change cancels delayed drawer focus; ordinary mobile resize keeps menu open',()=>{
  const h=runtime(); h.menu.focus(); h.menu.fire('click');
  h.events.resize.forEach(fn=>fn());
  assert.equal(h.drawer.classList.contains('is-open'),true,'resizing within mobile range does not dismiss navigation');
  h.boundary.change(true); h.flush();
  assert.equal(h.document.activeElement,h.topLink,'pending opening timer cannot focus the now-hidden close button');
  h.boundary.change(false); h.menu.fire('click'); h.flush(); h.close.fire('click');
  assert.equal(h.document.activeElement,h.menu,'normal close still returns focus to the hamburger');
  assert.equal(h.document.body.style.overflow,'');
});
