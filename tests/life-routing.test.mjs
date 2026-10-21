import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

// Run the shipped routers with a small DOM boundary; real layout is checked in the browser.
function start(hash, withNav = true) {
  const timers = [];
  const events = {};
  const pages = ['home', 'facility', 'tips', 'way'].map(name => ({
    id: 'pg-' + name, dataset: { page: name }, hidden: name !== 'home', querySelectorAll: () => [],
  }));
  const tips = pages[2];
  const sections = ['tp-house', 'tp-food', 'tp-fun'].map(id => ({
    id, closest: selector => selector === '.page' ? tips : selector === '.tp-sec' ? sections.find(s => s.id === id) : null,
    scrollIntoView() {},
  }));
  const main = { querySelectorAll: selector => selector === ':scope > .page' ? pages : [] };
  const nav = {
    dataset: { sub: 'tips' }, textContent: '생활 꿀팁생활 꿀팁',
    parentNode: { insertBefore(node) { nav.nextElementSibling = node; } },
  };
  const document = {
    title: '인사교 라이프', currentScript: { src: 'https://example.test/common/js/site.js' },
    documentElement: { dataset: {} }, addEventListener() {},
    querySelector: selector => selector === '.life-page' ? main : null,
    querySelectorAll: selector => withNav && selector === '.lnb a[data-sub="tips"], .side-nav a[data-sub="tips"]' ? [nav] : [],
    getElementById: id => [...pages, ...sections].find(el => el.id === id) || null,
    createElement: () => ({ classList: { contains: value => value === 'lnb-tp' } }),
  };
  const context = vm.createContext({
    document, URL, location: { href: 'https://example.test/life/index.html', hash, search: '' },
    matchMedia: () => ({ matches: false }), SiteLayout: () => ({}),
    addEventListener(name, fn) { (events[name] ||= []).push(fn); },
    setTimeout(fn) { timers.push(fn); }, dispatchEvent() {}, Event: class {},
    window: { scrollTo() {} }, history: { replaceState() {} },
  });
  vm.runInContext(source('../common/js/ui.js'), context);
  vm.runInContext(source('../common/js/site.js'), context);
  vm.runInContext(source('../life/js/life.js'), context);
  const initializedTopic = tips.dataset.topic;
  // The mobile script changes text before the deferred LNB initializer runs.
  timers.splice(0).forEach(fn => fn());
  return { tips, pages, nav, initializedTopic, decode: value => vm.runInContext(`Site.decodeHash(${JSON.stringify(value)})`, context) };
}

for (const id of ['tp-house', 'tp-food', 'tp-fun']) {
  test(`direct #${id} selects its topic before optional navigation initialization`, () => {
    const result = start('#' + id);
    assert.equal(result.tips.hidden, false);
    assert.equal(result.initializedTopic, id);
    assert.equal(result.tips.dataset.topic, id);
    assert.equal(result.nav.nextElementSibling.className, 'lnb-tp');
    assert.equal(start('#' + id, false).initializedTopic, id);
  });
}

test('malformed hash falls back safely while valid escaped anchors still decode', () => {
  const result = start('#%E0%A4%A');
  assert.equal(result.pages[0].hidden, false);
  assert.equal(result.tips.hidden, true);
  assert.equal(result.decode('%E0%A4%A'), '');
  assert.equal(result.decode('%'), '');
  assert.equal(result.decode('tp%2Dhouse'), 'tp-house');
  assert.equal(result.decode('%ED%9B%84%EA%B8%B0'), '후기');
});
