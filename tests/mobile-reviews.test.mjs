import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

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
  querySelector() { return null; }
  querySelectorAll(selector) { return selector === 'button' ? this.children.filter(node => node.tagName === 'button') : []; }
}

test('mobile review tabs match specific categories even after a shared career class', () => {
  const created = [];
  const section = new Element();
  const source = new Element();
  const records = [
    ['cat-career', 'cat-job', 'coh6'],
    ['cat-career', 'cat-path', 'coh7'],
    ['cat-life', 'coh7'],
  ].map((classes, index) => {
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
  vm.runInNewContext(readFileSync(new URL('../stories/js/stories-m.js', import.meta.url), 'utf8'), {
    document, location: { hash: '' }, matchMedia: () => ({ matches: true }),
    addEventListener() {}, setTimeout() {},
  });
  const categories = created.find(node => node.attrs['aria-label'] === '후기 카테고리');
  const cohorts = created.find(node => node.attrs['aria-label'] === '후기 기수');
  const board = created.find(node => node.className === 'sm-review-board');
  const count = created.find(node => node.className === 'sm-review-count');
  const empty = created.find(node => node.className === 'sm-review-empty');
  const choose = (group, value) => group.children.find(node => node.dataset.value === value).events.click();

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
