import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Run the shipped navigation against its rendered-card boundary. Browser checks
// cover the real type buttons, responsive CSS, focus and Spring-rendered cards.
class Element {
  constructor(tag = 'div', className = '') {
    this.tagName = tag; this.className = className; this.textContent = '';
    this.children = []; this.attrs = {}; this.dataset = {}; this.queries = {};
  }
  setAttribute(name, value) { this.attrs[name] = value; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  matches(selector) { return selector.startsWith('.') && this.className.split(' ').includes(selector.slice(1)); }
  append(...nodes) { nodes.forEach(node => { node.parent = this; this.children.push(node); }); }
  after(next) {
    const siblings=this.parent.children;
    siblings.splice(siblings.indexOf(this)+1,0,next);next.parent=this.parent;
  }
  replaceWith(next) {
    const siblings = this.parent.children;
    siblings[siblings.indexOf(this)] = next; next.parent = this.parent;
  }
  querySelector(selector) {
    return this.queries[selector] || this.children.find(node => node.matches(selector))
      || this.children.map(node => node.querySelector(selector)).find(Boolean) || null;
  }
  querySelectorAll() { return []; }
}

function start({ mobile = true, dbAnchors = false } = {}) {
  const ui = { mobile }, listeners = {}, mediaListeners = {}, scheduled = [];
  const types = ['실증', '기업연계', '기업연계', '실증', '창업', '기업연계', '신규유형', '신규유형'];
  const subject = new Element('button'); subject.dataset.subject = '';
  const cohort = new Element('button'); cohort.dataset.cohort = '';
  const selected = new Element('button'); selected.textContent = '전체';
  const projection = new Element('section', 'sm-projects');
  projection.queries['.sm-filter-tabs [aria-pressed="true"]'] = selected;
  const records = types.map((type, index) => {
    const card = new Element('a', 'pjc'), detail = new Element('article', 'pjd');
    const typeLabel = new Element('span', 'pjc-type'), heading = new Element('h2'), host = new Element('div', 'ivwrap');
    typeLabel.textContent = ` ${type} `; heading.textContent = `Project ${index + 1}`;
    detail.id = dbAnchors ? `pj-db-${100 + index}` : `pj-${index + 1}`;
    card.dataset.cohort = index < 6 ? '6' : '7';
    card.dataset.subject = index === 0 || index === 3 ? '컴퓨터비전' : '데이터 분석';
    card.setAttribute('href', '#' + detail.id); card.queries['.pjc-type'] = typeLabel;
    detail.queries.h2 = heading; detail.queries['.ivwrap'] = host;detail.append(host);
    return { card, detail, host };
  });
  const page = new Element('main', 'stories-page');
  page.querySelectorAll = selector => selector === '#p-pr .pjgrid a.pjc' ? records.map(record => record.card) : [];
  const location = { hash: '' };
  const document = {
    querySelector: selector => selector === '.pj-subject-options [aria-pressed="true"]' ? subject : selector === '.pj-cohort-filters [aria-pressed="true"]' ? cohort : selector === '.stories-page' ? page : selector === '#p-pr .sm-projects' ? projection : null,
    getElementById: id => records.find(record => record.detail.id === id)?.detail,
    createElement: tag => new Element(tag), addEventListener() {},
  };
  vm.runInNewContext(readFileSync(new URL('../stories/js/detail-navigation.js', import.meta.url), 'utf8'), {
    document, location,
    getComputedStyle: () => ({ display: ui.mobile ? 'block' : 'none' }),
    matchMedia: () => ({ addEventListener(name, handler) { mediaListeners[name] = handler; } }),
    addEventListener(name, handler) { listeners[name] = handler; },
    setTimeout(handler) { scheduled.push(handler); },
  });
  scheduled.forEach(handler => handler());
  function links(index) {
    location.hash = '#' + records[index].detail.id; listeners.hashchange();
    const nav = records[index].detail.querySelector('.sd-nav');
    return ['.sd-prev', '.sd-next'].map(selector => nav.querySelector(selector).getAttribute('href'));
  }
  return {
    outsideGrid(index) {const r=records[index];return !r.host.querySelector('.sd-nav')&&r.detail.children[1]?.className==='sd-nav'&&r.detail.children.length===2;},
    choose(type) { selected.textContent = type; },
    cohort(value) { cohort.dataset.cohort = value; },
    subject(value) { subject.dataset.subject = value; }, links,
    resize(mobile) { ui.mobile = mobile; mediaListeners.change(); },
    currentLinks(index) {
      const nav = records[index].detail.querySelector('.sd-nav');
      return ['.sd-prev', '.sd-next'].map(selector => nav.querySelector(selector).getAttribute('href'));
    },
  };
}

test('enterprise navigation stays in the selected project list and respects both ends', () => {
  const ui = start(); ui.choose('기업연계');
  assert.deepEqual(ui.links(1), [null, '#pj-3']);
  assert.deepEqual(ui.links(2), ['#pj-2', '#pj-6']);
  assert.deepEqual(ui.links(5), ['#pj-3', null]);
});

test('demonstration and single-item startup filters do not leak other types', () => {
  const ui = start(); ui.choose('실증');
  assert.deepEqual(ui.links(0), [null, '#pj-4']);
  assert.deepEqual(ui.links(3), ['#pj-1', null]);
  ui.choose('창업');
  assert.deepEqual(ui.links(4), [null, null]);
  ui.choose('전체');
  assert.deepEqual(ui.links(4), ['#pj-4', '#pj-6']);
});

test('published DB anchors and newly introduced project types use the rendered public cards', () => {
  const ui = start({ dbAnchors: true }); ui.choose('신규유형');
  assert.deepEqual(ui.links(6), [null, '#pj-db-107']);
  assert.deepEqual(ui.links(7), ['#pj-db-106', null]);
});

test('desktop ignores the hidden mobile filter and breakpoint changes refresh the current links', () => {
  const ui = start({ mobile: false }); ui.choose('기업연계');
  assert.deepEqual(ui.links(2), ['#pj-2', '#pj-4']);
  ui.resize(true);
  assert.deepEqual(ui.currentLinks(2), ['#pj-2', '#pj-6']);
  ui.resize(false);
  assert.deepEqual(ui.currentLinks(2), ['#pj-2', '#pj-4']);
});


test('project cohort and mobile type filters constrain navigation together', () => {
  const ui = start(); ui.cohort('6'); ui.choose('기업연계');
  assert.deepEqual(ui.links(2), ['#pj-2', '#pj-6']);
  assert.deepEqual(ui.links(5), ['#pj-3', null]);
  ui.choose('전체');
  assert.deepEqual(ui.links(5), ['#pj-5', null]);
  ui.cohort('7');
  assert.deepEqual(ui.links(6), [null, '#pj-8']);
  assert.deepEqual(ui.links(7), ['#pj-7', null]);
});

test('desktop retains cohort selection while ignoring the hidden mobile type filter', () => {
  const ui = start({ mobile: false }); ui.cohort('6'); ui.choose('기업연계');
  assert.deepEqual(ui.links(5), ['#pj-5', null]);
  ui.resize(true);
  assert.deepEqual(ui.currentLinks(5), ['#pj-3', null]);
  ui.resize(false);
  assert.deepEqual(ui.currentLinks(5), ['#pj-5', null]);
});


test('subject selection restricts previous and next projects together with cohort and mobile type', () => {
  const ui=start(); ui.cohort('6'); ui.subject('데이터 분석');
  assert.deepEqual(ui.links(1), [null, '#pj-3']);
  assert.deepEqual(ui.links(2), ['#pj-2', '#pj-5']);
  ui.choose('기업연계');
  assert.deepEqual(ui.links(2), ['#pj-2', '#pj-6']);
  ui.resize(false);
  assert.deepEqual(ui.currentLinks(2), ['#pj-2', '#pj-5']);
});


test('project navigation stays after the sticky article grid without duplicate bars on refresh', () => {
  const ui=start();ui.links(2);
  assert.equal(ui.outsideGrid(2),true);
  ui.subject('데이터 분석');ui.links(2);
  assert.equal(ui.outsideGrid(2),true);
});
