import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Run the shipped controller against the published-DOM boundary, including
// dynamically created options. Browser checks cover geometry and real focus.
class Element {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.dataset = {}; this.attrs = {};
    this.events = {}; this.queries = {}; this.textContent = ''; this.hidden = false;
  }
  append(...nodes) { nodes.forEach(node => { node.parent = this; this.children.push(node); }); }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  addEventListener(name, callback) { this.events[name] = callback; }
  querySelector(selector) {
    return this.queries[selector] || this.children.find(node =>
      selector === '[aria-pressed="true"]' ? node.attrs['aria-pressed'] === 'true'
        : selector === '[aria-current="page"]' ? node.attrs['aria-current'] === 'page'
          : selector === '[data-cohort="6"]' ? node.dataset.cohort === '6' : false) || null;
  }
  querySelectorAll(selector) { return selector === 'button' ? this.children : []; }
  closest(selector) { return selector.includes('button[data-') ? this : null; }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  click() {
    for (let node = this; node; node = node.parent) node.events.click?.({ target: this });
  }
  focus() { this.focused = true; }
  scrollIntoView() { this.scrolled = true; }
}

function start(rows, { live = true } = {}) {
  const section = new Element(), filters = new Element(), options = new Element();
  const dropdown = new Element('details'), summary = new Element('summary'), label = new Element('b');
  const grid = new Element(), mobile = new Element(), empty = new Element(), notice = new Element(), back = new Element('button');
  const cards = rows.map(([cohort, subject]) => { const card = new Element('a'); card.dataset = { cohort, subject }; return card; });
  const items = cards.map(() => new Element('details'));
  function button(key, value) {
    const node = new Element('button'); node.dataset[key] = value;
    node.textContent = value; node.setAttribute('aria-pressed', String(!value)); return node;
  }
  filters.append(...['', '7', '6'].map(value => button('cohort', value)));
  options.append(...['', '컴퓨터비전', '데이터 분석'].map(value => button('subject', value)));
  label.textContent = '교과목'; summary.queries.b = label;
  dropdown.queries = { summary, '.pj-subject-options': options };
  dropdown.append(summary, options);
  mobile.querySelectorAll = selector => selector === '.sm-project' ? items : [];
  section.queries = {
    '.pj-cohort-filters': filters, '.pj-subject-filter': dropdown, '.pjgrid': grid,
    '.sm-projects': mobile, '.pj-filter-row': new Element(),
    '.pj-filter-empty': live ? null : notice, '.pj-subject-empty': empty,
    '.pj-empty-back': live ? null : back,
  };
  section.querySelectorAll = selector => selector === '.pjgrid .pjc' ? cards : [];
  let pager;
  grid.after = node => { pager = node; };
  const document = {
    readyState: 'complete', documentElement: { dataset: { storySource: live ? 'spring' : '' } },
    querySelector: selector => selector === '#p-pr' ? section : null,
    createElement: tag => new Element(tag), addEventListener() {},
  };
  const context = vm.createContext({ document, matchMedia: () => ({ matches: false, addEventListener() {} }) });
  const source = readFileSync(new URL('../stories/js/projects-filter.js', import.meta.url), 'utf8');
  vm.runInContext(source, context);
  const choose = (group, key, value) => {
    const target = group.children.find(node => node.dataset[key] === value);
    assert.ok(target, 'missing ' + key + ': ' + value); target.click();
  };
  return {
    filters, options, cards, items, mobile, empty, notice, back,
    get pager() { return pager; },
    cohort(value) { choose(filters, 'cohort', value); },
    subject(value) { choose(options, 'subject', value); },
    shown() { return cards.filter(card => !card.hidden).length; },
    page(value) { pager.children.find(node => node.attrs['aria-label'] === value + '페이지').click(); },
    rerun() { const previous = pager; vm.runInContext(source, context); assert.equal(pager, previous); },
  };
}

test('Spring options come only from valid published metadata, with no fixed sample cohorts or inferred labels', () => {
  const ui = start([['12', '새 교과목'], ['8', '컴퓨터비전'], ['12', '새 교과목'], ['0', ''], ['100', '']]);
  assert.deepEqual(ui.filters.children.map(node => node.dataset.cohort), ['', '12', '8']);
  assert.deepEqual(new Set(ui.options.children.map(node => node.dataset.subject)), new Set(['', '새 교과목', '컴퓨터비전']));
  assert.equal(ui.shown(), 5); // Unclassified legacy records remain in the all list.
  ui.cohort('12'); ui.subject('컴퓨터비전');
  assert.equal(ui.shown(), 0); assert.equal(ui.empty.hidden, false); assert.equal(ui.pager.hidden, true);
  ui.subject(''); assert.equal(ui.shown(), 2);
  ui.rerun();
});

test('DB cohort/subject intersections paginate six at a time and synchronize mobile items', () => {
  const ui = start([...Array.from({ length: 7 }, () => ['8', '컴퓨터비전']), ['9', '데이터 분석'], ['0', '']]);
  ui.cohort('8'); ui.subject('컴퓨터비전');
  assert.equal(ui.shown(), 6); assert.equal(ui.items.filter(item => !item.hidden).length, 6);
  ui.page(2);
  assert.equal(ui.shown(), 1); assert.equal(ui.items[6].open, true);
  assert.equal(ui.pager.querySelector('[aria-current="page"]').focused, true);
  ui.cohort('9');
  assert.equal(ui.shown(), 0); assert.equal(ui.mobile.hidden, true);
  ui.subject('데이터 분석');
  assert.equal(ui.shown(), 1); assert.equal(ui.pager.querySelector('[aria-current="page"]').textContent, '1');
});

test('empty DB has only all controls while static preview retains its upcoming-cohort behavior', () => {
  const empty = start([]);
  assert.equal(empty.filters.children.length, 1); assert.equal(empty.options.children.length, 1);
  assert.equal(empty.empty.hidden, true); assert.equal(empty.pager.hidden, true); // Shared published-empty state is separate from filter results.
  const ui = start([['6', '컴퓨터비전']], { live: false });
  ui.cohort('7'); assert.equal(ui.notice.hidden, false);
  ui.back.click(); assert.equal(ui.shown(), 1); assert.equal(ui.notice.hidden, true);
  const populated = start([['7', '컴퓨터비전']], { live: false });
  populated.cohort('7'); assert.equal(populated.notice.hidden, true); assert.equal(populated.shown(), 1);
});
