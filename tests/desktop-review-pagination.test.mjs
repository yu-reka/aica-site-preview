import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../stories/js/stories-render.js', import.meta.url), 'utf8');
const controller = source.split('/* Desktop review paging:')[1]?.split('/* End desktop review paging. */')[0];

class Element {
  constructor(tag = 'div', classes = []) {
    this.tagName = tag; this.classList = new Set(classes); this.classList.contains = name => this.classList.has(name);
    this.attrs = {}; this.children = []; this.events = {};
    this.hidden = false; this.textContent = ''; this.dataset = {};
  }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  hasAttribute(name) { return name in this.attrs; }
  addEventListener(name, callback) { (this.events[name] ||= []).push(callback); }
  emit(name, target = this) { this.events[name]?.forEach(callback => callback({ target })); }
  appendChild(node) { this.children.push(node); return node; }
  replaceChildren(...nodes) { this.children = nodes; }
  before(node) { this.beforeNode = node; }
  focus() { this.focused = true; }
  scrollIntoView() { this.scrolled = true; }
  querySelector(selector) { return this.children.find(node => selector === 'button[aria-current="page"]' && node.attrs['aria-current'] === 'page') || null; }
}

function start(classes, { hash = '', spring = false } = {}) {
  const cards = classes.map((list, index) => {
    const card = new Element('a', ['idc', ...list]); card.attrs.href = '#r-p' + (index + 1); return card;
  });
  const rows = classes.map(() => new Element('a'));
  const section = new Element(), grid = new Element(), pager = new Element(), filters = new Element();
  const radios = [...['rc_all', 'rc_class', 'rc_life', 'rc_job', 'rc_path'], ...['fco_all', 'fco_0', 'fco_1', 'fco_c8'], ...Array.from({ length: Math.max(1, Math.ceil(classes.length / 12)) }, (_, i) => 'pgn' + (i + 1))].map(id => {
    const node = new Element('input'); node.id = id;
    node.name = id.startsWith('rc_') ? 'rc' : id.startsWith('fco_') ? 'fco' : 'pgn';
    node.checked = ['rc_all', 'fco_all', 'pgn1'].includes(id); return node;
  });
  section.querySelector = selector => selector === '.pager' ? pager : selector === '.idgrid' ? grid : selector === '.filters' ? filters :
    /^input\[name="(rc|fco)"\]:checked$/.test(selector) ? radios.find(radio => radio.name === selector.match(/name="(.*?)"/)[1] && radio.checked) : null;
  section.querySelectorAll = selector => selector === '.idgrid .idc' ? cards : selector === '.rvlist .rvr' ? rows : selector === 'input[name="pgn"]' ? radios.filter(radio => radio.name === 'pgn') : [];
  const location = { hash }, listeners = {};
  const document = {
    documentElement: { dataset: { reviewSource: spring ? 'spring' : '' } },
    getElementById: id => id === 'p-rev' ? section : null,
    createElement: tag => new Element(tag),
  };
  // An unenhanced source intentionally leaves the category results unpaged,
  // reproducing the original 22-card regression rather than testing a model helper.
  if (controller) vm.runInNewContext('/* Desktop review paging:' + controller, {
    document, location, matchMedia: () => ({ matches: false }),
    addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
  });
  return {
    section, cards, rows, pager, grid, radios,
    get count() { return grid.beforeNode?.textContent; },
    change(id) {
      const radio = radios.find(node => node.id === id);
      radios.filter(node => node.name === radio.name).forEach(node => { node.checked = node === radio; });
      section.emit('change', radio);
    },
    hash(value) { location.hash = value; listeners.hashchange?.forEach(callback => callback()); },
    page(value) {
      const button = pager.children.find(node => node.attrs['aria-label'] === value + '페이지');
      assert.ok(button, 'missing page ' + value); button.emit('click');
    },
    shown() {
      const category = radios.find(radio => radio.name === 'rc' && radio.checked).id.slice(3);
      return cards.map((card, index) => card.attrs['data-review-visible'] !== 'false' && (category === 'all' || card.classList.has('cat-' + category)) ? index : null).filter(index => index !== null);
    },
  };
}

const entries = (n, classes = ['cat-class', 'coh7', 'tg0']) => Array.from({ length: n }, () => classes);

test('22 desktop category results paginate 12 + 10 in both views with real keyboard buttons', () => {
  const ui = start([...entries(22), ...entries(5, ['cat-life', 'coh6'])]);
  ui.change('rc_class');
  assert.equal(ui.shown().length, 12);
  assert.equal(ui.count, '22개의 후기 · 1–12');
  assert.equal(ui.pager.hidden, false);
  assert.equal(ui.pager.attrs.role, 'navigation');
  assert.equal(ui.pager.children[0].disabled, true);
  ui.page(2);
  assert.deepEqual(ui.shown(), Array.from({ length: 10 }, (_, i) => i + 12));
  assert.equal(ui.rows.filter(row => row.attrs['data-review-visible'] === 'true').length, 10);
  assert.equal(ui.count, '22개의 후기 · 13–22');
  assert.equal(ui.pager.querySelector('button[aria-current="page"]').focused, true);
  assert.equal(ui.pager.children.at(-1).disabled, true);
  assert.equal(ui.cards[12].attrs.href, '#r-p13');
  ui.change('rc_life');
  assert.equal(ui.shown().length, 5);
  assert.equal(ui.count, '5개의 후기 · 1–5');
  assert.equal(ui.pager.hidden, true);
});

test('cohort/category/tag intersections reset pages, retain modal state and clear tags on list return', () => {
  const ui = start([...entries(25), ...entries(13, ['cat-class', 'coh8', 'tg1']), ...entries(3, ['cat-life', 'coh8', 'tg0'])]);
  ui.page(3);
  ui.change('fco_c8');
  assert.equal(ui.count, '16개의 후기 · 1–12');
  ui.change('rc_class');
  ui.page(2); assert.equal(ui.shown().length, 1);
  ui.hash('#r-p38');
  assert.equal(ui.count, '13개의 후기 · 13–13');
  ui.hash('#p-rev');
  assert.equal(ui.count, '13개의 후기 · 13–13', 'closing an untagged modal keeps page 2');
  ui.hash('#tg-1');
  assert.equal(ui.count, '13개의 후기 · 1–12');
  ui.page(2); ui.hash('#r-p38');
  assert.equal(ui.count, '13개의 후기 · 13–13');
  ui.hash('#p-rev');
  assert.equal(ui.count, '13개의 후기 · 1–12');
  ui.hash('#tg-0');
  assert.equal(ui.count, '0개의 후기');
  assert.equal(ui.shown().length, 0);
  assert.equal(ui.pager.hidden, true);
  ui.change('rc_life');
  assert.equal(ui.count, '3개의 후기 · 1–3');
  ui.hash('#p-rev'); ui.change('rc_all'); ui.change('fco_all'); ui.section.emit('reviews:reset');
  assert.equal(ui.count, '41개의 후기 · 1–12');
});

test('paging clamps legacy radio requests and scales beyond the old five-page CSS limit', () => {
  const ui = start(entries(85), { hash: '#tg-0' });
  ui.page(3); ui.page(5); ui.page(7);
  assert.deepEqual(ui.shown(), [72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83]);
  ui.change('rc_life');
  ui.change('pgn8');
  assert.equal(ui.shown().length, 0);
  ui.change('rc_class');
  assert.equal(ui.shown().length, 12);
  assert.equal(ui.pager.children.filter(button => /^\d+페이지$/.test(button.attrs['aria-label'])).length, 5);
});

test('published-empty and legacy Spring pages remain owned by their existing state/controllers', () => {
  for (const ui of [start([]), start(entries(22), { spring: true })]) {
    assert.equal(ui.section.hasAttribute('data-review-paging'), false);
    assert.equal(ui.count, undefined);
  }
});
