import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

// Run the shipped scripts on projects.html; mock only the DOM and history boundary.
function projectsPage(hash) {
  const events = {}, replaced = [];
  const pane = { id: 'p-pr', classList: { contains: name => name === 'pane' }, closest: () => pane, getClientRects: () => [1] };
  const detail = { id: 'pj-1', classList: { contains: () => false }, closest: () => pane, getClientRects: () => [1] };
  const page = { classList: { contains: () => false }, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, contains: () => true };
  const document = {
    currentScript: { src: 'https://example.test/common/js/site.js' },
    documentElement: { dataset: {}, style: {} },
    querySelector: selector => selector === '.stories-page' ? page : null,
    querySelectorAll: () => [],
    getElementById: id => ({ 'p-pr': pane, 'pj-1': detail })[id] || null,
    addEventListener() {},
  };
  const location = { href: 'https://example.test/stories/projects.html' + hash, pathname: '/stories/projects.html', search: '', hash };
  const context = vm.createContext({
    document, URL, location, window: {}, SiteLayout: () => ({}),
    history: { state: null, replaceState(state, title, url) { replaced.push(url); location.hash = ''; } },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener(name, handler) { (events[name] ||= []).push(handler); },
    setTimeout(handler) { handler(); }, requestAnimationFrame(handler) { handler(); }, scrollTo() {},
  });
  vm.runInContext(source('../common/js/ui.js'), context);
  vm.runInContext(source('../common/js/site.js'), context);
  vm.runInContext(source('../stories/js/stories.js'), context);
  const fire = name => (events[name] || []).forEach(handler => handler());
  return { location, replaced, fire };
}

test('returning to a story list drops the internal #p-… hash from the address', () => {
  const { location, replaced, fire } = projectsPage('');
  location.hash = '#p-pr';
  fire('hashchange');
  assert.deepEqual(replaced, ['/stories/projects.html']);
});

test('old list links still open the list and then show a clean address', () => {
  const { replaced, fire } = projectsPage('#p-pr');
  fire('load');
  assert.deepEqual(replaced, ['/stories/projects.html']);
});

test('detail and other hashes stay in the address', () => {
  const { location, replaced, fire } = projectsPage('');
  for (const hash of ['#pj-1', '#tg-2', '#projects']) {
    location.hash = hash;
    fire('hashchange');
  }
  assert.deepEqual(replaced, []);
});
