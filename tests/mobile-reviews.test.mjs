import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const uiSource = readFileSync(new URL('../common/js/ui.js', import.meta.url), 'utf8');

// Minimal DOM boundary for running the shipped mobile script without browser packages.
// Layout, focus and responsive behavior are covered separately in the browser.
class Element {
  constructor(tag = 'div', classes = []) {
    this.tagName = tag; this.classList = new Set(classes); this.children = [];
    this.dataset = {}; this.attrs = {}; this.events = {}; this.textContent = '';
  }
  appendChild(node) { this.children.push(node); return node; }
  append(...nodes) { nodes.forEach(node => this.appendChild(node)); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  addEventListener(event, callback) { this.events[event] = callback; }
  before() {}
  focus() {}
  scrollIntoView() {}
  querySelector() { return null; }
  querySelectorAll(selector) { return selector === 'button' ? this.children.filter(node => node.tagName === 'button') : []; }
}

function startReviews(classes) {
  const created = [], listeners = {};
  const location = { hash: '' };
  const section = new Element();
  const source = new Element();
  const records = classes.map((classes, index) => {
    const card = new Element('a', ['idc', ...classes]);
    card.attrs.href = '#r-' + index; return card;
  });
  source.querySelectorAll = selector => selector === '.idc' ? records : [];
  section.querySelector = selector => selector === '.idgrid' ? source : null;
  const document = {
    readyState: 'complete', documentElement: new Element(),
    querySelector: selector => selector === '#p-rev' ? section : null,
    querySelectorAll: () => [], getElementById: () => null,
    createElement: tag => { const node = new Element(tag); created.push(node); return node; },
  };
  vm.runInNewContext(uiSource + '\n' + readFileSync(new URL('../stories/js/stories-m-reviews.js', import.meta.url), 'utf8') + '\nStoriesMobileReviews.init();', {
    document, location, matchMedia: () => ({ matches: true }),
    addEventListener(name, fn) { listeners[name] = fn; }, setTimeout() {},
  });
  const categories = created.find(node => node.attrs['aria-label'] === '후기 카테고리');
  const cohorts = created.find(node => node.attrs['aria-label'] === '후기 기수');
  const board = created.find(node => node.className === 'sm-review-board');
  const count = created.find(node => node.className === 'sm-review-count');
  const pager = created.find(node => node.attrs['aria-label'] === '후기 페이지');
  const empty = created.find(node => node.className === 'sm-review-empty');
  const choose = (group, value) => group.children.find(node => node.dataset.value === value).events.click();

  return { categories, cohorts, board, count, empty, pager, choose, listeners, location };
}

test('mobile review tabs match specific categories even after a shared career class', () => {
  const { board, categories, cohorts, count, empty, choose } = startReviews([
    ['cat-career', 'cat-job', 'coh6'], ['cat-career', 'cat-path', 'coh7'], ['cat-life', 'coh7'],
  ]);

  assert.equal(board.children.length, 3);
  for (const category of ['job', 'path', 'life']) {
    choose(categories, category);
    assert.equal(count.textContent, '1개의 후기', category);
    assert.equal(board.children.length, 1, category);
    assert.equal(empty.hidden, true, category);
  }
  choose(categories, 'job');
  choose(cohorts, '7');
  assert.equal(count.textContent, '0개의 후기');
  assert.equal(empty.hidden, false);
  choose(categories, 'path');
  assert.equal(count.textContent, '1개의 후기');
  choose(categories, 'all');
  choose(cohorts, '');
  assert.equal(board.children.length, 3);
});


test('mobile review pages retain canonical modal links and the ten-card boundary', () => {
  const classes = Array.from({ length: 11 }, () => ['cat-life', 'coh7', 'tg4']);
  const { board, pager, count, location, listeners } = startReviews(classes);
  assert.equal(count.textContent, '11개의 후기');
  assert.equal(board.children.length, 10);
  assert.equal(board.children[0].tagName, 'a');
  assert.equal(board.children[0].href, '#r-0');
  assert.equal(board.children[0].attrs['aria-haspopup'], 'dialog');
  pager.children.find(button => button.attrs['aria-label'] === '2페이지').events.click();
  assert.equal(board.children.length, 1);
  assert.equal(board.children[0].href, '#r-10');
  location.hash = '#tg-4'; listeners.hashchange();
  assert.equal(board.children.length, 10);
  assert.equal(count.textContent, '11개의 후기');
});

test('legacy Spring entry loads reviews only on a review page', () => {
  for (const hasReviews of [false, true]) {
    const appended = [];
    const document = {
      readyState: 'complete', documentElement: new Element(),
      currentScript: { src: 'https://site.example/stories/js/stories-m.js?v=old' },
      querySelector: selector => selector === '#p-rev' && hasReviews ? new Element() : null,
      querySelectorAll: () => [],
      createElement: tag => new Element(tag),
      head: { appendChild: node => appended.push(node) },
    };
    const context = vm.createContext({ document, URL, location: { hash: '' },
      matchMedia: () => ({ matches: true }), addEventListener() {}, setTimeout() {} });
    vm.runInContext(uiSource, context);
    vm.runInContext(readFileSync(new URL('../stories/js/stories-m.js', import.meta.url), 'utf8'), context);
    assert.equal(appended.length, hasReviews ? 1 : 0);
    if (hasReviews) {
      assert.equal(appended[0].src, 'https://site.example/stories/js/stories-m-reviews.js?v=1028shared-controls');
      let initialized = 0;
      context.StoriesMobileReviews = { init() { initialized++; } };
      appended[0].onload();
      assert.equal(initialized, 1);
    }
  }
});
