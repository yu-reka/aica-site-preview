import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {build} from '../scripts/build.mjs';
import {springArtifacts} from '../scripts/export-spring.mjs';
const source = readFileSync(new URL('../common/js/availability.js', import.meta.url), 'utf8');
function harness(online = true) {
  const handlers = {}, elements = [], timers = new Map(); let id = 0, reloads = 0, focused = 0;
  function element() {
    const listeners = {}, children = {};
    return {hidden: false, open: false, textContent: '', setAttribute(){},
      querySelector(selector){return children[selector] ||= element();},
      addEventListener(name, fn){listeners[name] = fn;},
      fire(name){listeners[name]?.();},
      showModal(){this.open = true;}, close(){this.open = false; this.fire('close');}};
  }
  const navigator = {onLine: online};
  const document = {createElement(){const e = element(); elements.push(e); return e;},
    body:{append(){}}, activeElement:{isConnected:true, focus(){focused++;}},
    addEventListener(name,fn){handlers['document:' + name] = fn;}};
  const context = {document,navigator,location:{href:'https://aica.test/home/index.html',origin:'https://aica.test',pathname:'/home/index.html',search:'',reload(){reloads++;}},
    URL, window:{}, addEventListener(name,fn){handlers[name]=fn;},
    setTimeout(fn,ms){timers.set(++id,{fn,ms});return id;},clearTimeout(key){timers.delete(key);}};
  vm.runInNewContext(source, context);
  function click(href, extra = {}, attributes = []) {
    let prevented = false;
    const link = {href, target:'',hasAttribute(name){return attributes.includes(name);}};
    handlers['document:click']({target:{closest(){return link;}},button:0,preventDefault(){prevented=true;},...extra});
    return prevented;
  }
  return {elements, handlers,navigator, api:context.window.SiteAvailability,click,
    tick(ms){for(const [key,timer] of timers) if(timer.ms <= ms){timers.delete(key);timer.fn();}},
    get reloads(){return reloads;},get focused(){return focused;}};
}
test('offline blocks navigation, keeps current page, restores focus and allows reconnect retry', () => {
  const h = harness(false), dialog = h.elements[1];
  assert.equal(dialog.open,true);
  dialog.querySelector('button').fire('click');
  assert.equal(h.reloads,0);
  assert.match(dialog.querySelector('.site-offline__copy').textContent,/아직 연결/);
  dialog.querySelector('.site-offline__close').fire('click');
  assert.equal(dialog.open,false); assert.equal(h.focused,1);
  assert.equal(h.click('https://aica.test/about/index.html'),true);
  assert.equal(dialog.open,true);
  h.navigator.onLine=true; h.handlers.online();
  assert.equal(h.reloads,0);
  dialog.querySelector('button').fire('click'); assert.equal(h.reloads,1);
});
test('navigation loading is delayed, cancellable and cleared on back/forward restoration', () => {
  const h=harness(), loading=h.elements[0];
  for (const href of ['https://aica.test/home/index.html#x','https://elsewhere.test/', 'mailto:test@example.test']) h.click(href);
  h.click('https://aica.test/about/index.html',{ctrlKey:true});
  h.click('https://aica.test/about/index.html',{},['download']);
  h.click('https://aica.test/about/index.html',{},['data-toast']);
  assert.equal(h.api.busy,false);
  h.click('https://aica.test/about/index.html');
  assert.equal(h.api.busy,true); assert.equal(loading.hidden,true);
  h.tick(350); assert.equal(loading.hidden,false);
  h.handlers.pageshow(); assert.equal(loading.hidden,true); assert.equal(h.api.busy,false);
  h.api.begin(); h.tick(12000);
  assert.equal(loading.hidden,true); assert.equal(h.api.busy,false);
  // A completed request must cancel the pending indicator, including quick requests.
  h.api.begin(); h.api.end(); h.tick(12000);
  assert.equal(loading.hidden,true); assert.equal(h.api.busy,false);
  h.api.begin(); h.handlers.offline(); assert.equal(h.api.busy,false);
});
test('all regular pages include availability assets and Spring exports error documents', () => {
  const pages=build();
  for (const [path,html] of pages) if(path.endsWith('.html') && !['index.html','404.html','500.html','offline.html'].includes(path)) {
    assert.match(html,/common\/js\/availability.js/,path);
    assert.match(html,/common\/css\/availability.css/,path);
  }
  const artifacts=springArtifacts();
  assert.equal(artifacts.get('templates/error/500.html'),pages.get('500.html'));
  assert.equal(artifacts.get('static/offline.html'),pages.get('offline.html'));
});
