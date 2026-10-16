import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const malformed = '#%E0%A4%A';

// Run the shipped entry scripts; mock only the DOM and browser event boundary.
function runtime(selectors = {}, hash = malformed) {
  const events = {}, documentEvents = {};
  const document = {
    currentScript: { src: 'https://example.test/common/js/site.js' },
    documentElement: { dataset: {}, style: {} },
    querySelector: selector => selectors[selector] || null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener(name, handler) { (documentEvents[name] ||= []).push(handler); },
  };
  const context = vm.createContext({
    document, URL, location: { href: 'https://example.test/check/index.html', hash, search: '' },
    matchMedia: query => ({ matches: query.includes('max-width'), addEventListener() {} }),
    SiteLayout: () => ({}), window: {},
    addEventListener(name, handler) { (events[name] ||= []).push(handler); },
    setTimeout() {}, requestAnimationFrame(handler) { handler(); },
  });
  vm.runInContext(source('../common/js/site.js'), context);
  return { context, document, events, documentEvents };
}

test('malformed direct Check URL still initializes checklist change handlers', () => {
  const changes = [];
  const boxes = Array.from({ length: 5 }, () => ({
    checked: false, addEventListener(name, handler) { if (name === 'change') changes.push(handler); },
  }));
  const nodes = Object.fromEntries(['#chkNow', '#chkBar', '#chkGo', '#cmCheckNow', '#cmCheckProgress', '#chkGoLabel', '.chk-self'].map(key => [key, {
    style: {}, classList: { toggle() {} },
  }]));
  const main = {
    querySelector: selector => nodes[selector] || null,
    querySelectorAll: selector => selector === '.chk-box' ? boxes : [],
    addEventListener() {},
  };
  const { context } = runtime({ '.check-page': main });
  vm.runInContext(source('../check/js/check.js'), context);
  assert.equal(changes.length, 5);
  assert.equal(nodes['#chkNow'].textContent, 0);
  boxes[0].checked = true;
  changes[0]();
  assert.equal(nodes['#chkNow'].textContent, 1);
  assert.equal(nodes['#cmCheckProgress'].value, 1);
  assert.equal(nodes['#chkBar'].style.width, '20%');
});

test('malformed Stories URL still registers modal Escape and focus handling', () => {
  let target = null, closed = false;
  const page = {
    querySelector: selector => selector === '.ov:target' ? target : null,
    querySelectorAll: () => [], addEventListener() {}, contains: () => true,
  };
  const { context, document, events, documentEvents } = runtime({ '.stories-page': page });
  vm.runInContext(source('../stories/js/stories.js'), context);
  const close = { focus() { document.activeElement = close; }, click() { closed = true; } };
  const modal = { contains: () => false, querySelector: selector => selector === '.x' ? close : null };
  document.activeElement = { href: '#r-life-0' };
  target = modal;
  context.location.hash = '#r-life-0';
  events.hashchange.forEach(handler => handler());
  assert.equal(document.activeElement, close);
  documentEvents.keydown.forEach(handler => handler({ key: 'Escape' }));
  assert.equal(closed, true);
});

test('early legacy router ignores malformed hashes but keeps encoded canonical links', () => {
  for (const hash of [malformed, '#%', '#q%2D1%2D2']) {
    const redirects = [], events = {};
    const context = vm.createContext({
      location: { hash, replace(url) { redirects.push(url); } },
      addEventListener(name, handler) { events[name] = handler; },
    });
    vm.runInContext(source('../stories/js/old-hash.js'), context);
    events.hashchange();
    assert.deepEqual(redirects, hash === '#q%2D1%2D2' ? ['interviews.html#q-1-2', 'interviews.html#q-1-2'] : []);
  }
});
