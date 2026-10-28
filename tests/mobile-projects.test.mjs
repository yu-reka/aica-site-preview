import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const uiSource = readFileSync(new URL('../common/js/ui.js', import.meta.url), 'utf8');

// Execute the shipped initializer against rendered public cards. Browser QA
// separately covers CSS, focus, and the static cohort/subject controls.
class Element {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.dataset = {};
    this.attrs = {}; this.events = {}; this.textContent = '';
    this.classList = new Set(); this.queries = {};
  }
  appendChild(node) { this.children.push(node); return node; }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  addEventListener(name, callback) { this.events[name] = callback; }
  querySelector(selector) { return this.queries[selector] || null; }
  querySelectorAll(selector) { return selector === 'button' ? this.children.filter(node => node.tagName === 'button') : []; }
}

function start({ staticFilters = false } = {}) {
  let projection;
  const types = ['기업연계', '실증', '창업', '신규유형', '기업연계'];
  const cards = types.map((type, index) => {
    const card = new Element('a'), badge = new Element('span'), title = new Element('strong');
    badge.textContent = type; title.textContent = 'Project ' + index;
    card.queries['.pjc-type'] = badge; card.queries['.pjname'] = title;
    card.setAttribute('href', '#pj-db-' + (100 + index)); return card;
  });
  const grid = new Element();
  grid.querySelectorAll = selector => selector === '.pjc' ? cards : [];
  grid.before = node => { projection = node; };
  const document = {
    readyState: 'complete', documentElement: new Element(),
    currentScript: { src: 'https://site.example/stories/js/stories-m.js' },
    querySelector: selector => selector === '#p-pr .pjgrid' ? grid
      : selector === '.sm-projects' ? projection || null
      : selector === '#p-pr .pj-filter-row' && staticFilters ? new Element() : null,
    querySelectorAll: () => [], createElement: tag => new Element(tag),
  };
  vm.runInNewContext(uiSource + '\n' + readFileSync(new URL('../stories/js/stories-m.js', import.meta.url), 'utf8'), {
    document, URL, matchMedia: () => ({ matches: true }), addEventListener() {}, setTimeout() {},
  });
  const filters = projection.children.find(node => node.className === 'sm-filter-tabs');
  const list = projection.children.find(node => node.className === 'sm-project-list');
  return { filters, items: list.children, choose(type) {
    const button = filters.children.find(node => node.textContent === type);
    assert.ok(button, 'missing public project type: ' + type); button.events.click();
  } };
}

test('Spring mobile projects retain type filtering, published anchors, and custom DB types', () => {
  const ui = start();
  assert.ok(ui.filters, 'Spring export has no static filters, so its mobile type controls must remain');
  assert.deepEqual(ui.filters.children.map(node => node.textContent), ['전체', '기업연계', '실증', '창업', '신규유형']);
  ui.choose('기업연계');
  assert.deepEqual(ui.items.filter(node => !node.hidden).map(node => node.dataset.type), ['기업연계', '기업연계']);
  assert.equal(ui.filters.children.find(node => node.textContent === '기업연계').attrs['aria-pressed'], 'true');
  ui.choose('신규유형');
  assert.equal(ui.items.filter(node => !node.hidden).length, 1);
  assert.equal(ui.items[3].open, true);
  assert.equal(ui.items[0].open, false);
  const body = ui.items[3].children.find(node => node.className === 'sm-project-body');
  assert.equal(body.children[0].href, '#pj-db-103');
  ui.choose('전체');
  assert.equal(ui.items.filter(node => !node.hidden).length, 5);
});

test('static cohort and subject filters do not get duplicate mobile type controls', () => {
  const ui = start({ staticFilters: true });
  assert.equal(ui.filters, undefined);
  assert.equal(ui.items.length, 5);
});

// The title link remains outside the collapsible body, so a closed card can
// still navigate with the same published URL as its expanded CTA.
test('closed mobile project cards retain a named detail link and a separate toggle', () => {
  const ui = start();
  ui.items.forEach((item, index) => {
    const summary = item.children[0];
    const heading = summary.children.find(node => node.className === 'sm-project-heading');
    const link = heading.children.find(node => node.className === 'sm-project-card-link');
    assert.equal(link.tagName, 'a');
    assert.equal(link.href, '#pj-db-' + (100 + index));
    assert.equal(link.children[0].textContent, 'Project ' + index);
    assert.ok(summary.children.some(node => node.className === 'sm-project-toggle'));
  });
});

test('closed mobile cards expand first; open cards navigate except the toggle', () => {
  const ui = start(), item = ui.items[0];
  const heading = item.children[0].children.find(node => node.className === 'sm-project-heading');
  const link = heading.children.find(node => node.className === 'sm-project-card-link');
  let opened = 0, prevented = 0;
  link.click = () => { opened++; };
  const fire = target => item.events.click({ target: { closest: selector => {
    if (target === 'toggle') return selector.includes('.sm-project-toggle') ? {} : null;
    if (target === 'link') return selector.includes('a,') ? link : null;
    return null;
  } }, preventDefault() { prevented++; } });
  for (const target of ['blank', 'link']) {
    item.open = false;
    fire(target);
    assert.equal(item.open, true);
    assert.equal(opened, 0);
  }
  fire('blank');
  assert.equal(opened, 1);
  fire('toggle');
  fire('link');
  assert.equal(opened, 1);
  assert.equal(prevented, 3);
});
