import {assetVersion} from '../scripts/asset-versions.mjs';
import {runInNewContext,runInContext} from './support/runtime.mjs';
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
    this.classList.contains = name => this.classList.has(name);
    this.classList.toggle = (name, enabled) => enabled ? this.classList.add(name) : this.classList.delete(name);
    this.scrollLeft = 0; this.clientWidth = 300; this.scrollWidth = 300;
    this.dataset = {}; this.attrs = {}; this.events = {}; this.textContent = ''; this.style = {setProperty(key, value) { this[key] = value; }};
  }
  get firstElementChild() { return this.children[0]; }
  scrollBy(options) { this.lastScroll = options; }
  get lastElementChild() { return this.children[this.children.length - 1]; }
  scrollTo(options) { this.scrollLeft = options.left; }
  insertBefore(node, reference) { this.children = this.children.filter(child => child !== node); this.children.splice(this.children.indexOf(reference), 0, node); }
  appendChild(node) { this.children = this.children.filter(child => child !== node); this.children.push(node); return node; }
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

function startReviews(classes, reducedMotion = true, managed = false, initialFilters = {}) {
  const created = [], listeners = {};
  const location = { hash: '' };
  const section = new Element();
  const source = new Element();
  const records = classes.map((classes, index) => {
    const card = new Element('a', ['idc', ...classes]);
    card.attrs.href = '#r-' + index; return card;
  });
  source.querySelectorAll = selector => selector === '.idc' ? records : [];
  const filters = {
    rc: { name: 'rc', id: initialFilters.rc ?? 'rc_all' },
    fco: { name: 'fco', id: initialFilters.fco ?? 'fco_all' },
  };
  const changeFilter = (name, id) => {
    filters[name].id = id;
    section.events.change?.({ target: filters[name] });
  };
  let mounted = false;
  section.querySelector = selector => {
    if (selector === '.idgrid') return source;
    if (selector === '.sm-reviews' && mounted) return created.find(node => node.className === 'sm-reviews');
    if (selector === 'input[name="rc"]:checked') return filters.rc;
    if (selector === 'input[name="fco"]:checked') return filters.fco;
    return null;
  };
  function attach(box) {
    mounted = true; box.isConnected = true;
    created.find(node => node.className === 'sm-review-board').clientWidth = 300;
  }
  source.before = (marker, box) => {
    if (!managed || !box) return;
    attach(box);
    marker.after = attach;
    box.remove = () => {
      mounted = false; box.isConnected = false;
      created.find(node => node.className === 'sm-review-board').clientWidth = 0;
    };
  };
  section.querySelectorAll = () => [];
  const document = {
    addEventListener() {},
    readyState: 'complete', documentElement: new Element(),
    querySelector: selector => selector === '#p-rev' ? section : null,
    querySelectorAll: () => [], getElementById: () => null,
    createElement: tag => { const node = new Element(tag); created.push(node); return node; },
    createComment: () => ({}),
  };
  const window = managed ? { StoryReviewCards: classes.map((values, index) => ({
    anchor: 'r-' + index, category: values[0].slice(4), cohort: values[1].slice(3),
  })) } : undefined;
  const context = vm.createContext({
    document, window, location, matchMedia: () => ({ matches: reducedMotion }),
    addEventListener(name, fn) { listeners[name] = fn; }, clearTimeout() {}, setTimeout() {}, requestAnimationFrame(fn) { fn(); },
  });
  runInContext(uiSource + '\n' + readFileSync(new URL('../stories/js/stories-m-reviews.js', import.meta.url), 'utf8') + '\nStoriesMobileReviews.init();', context);
  function resize(mobile) {
    runInContext(mobile ? 'StoriesMobileReviews.init()' : 'StoriesMobileReviews.unmount()', context);
  }
  const categories = created.find(node => node.attrs['aria-label'] === '후기 카테고리');
  const cohorts = created.find(node => node.attrs['aria-label'] === '후기 기수');
  const board = created.find(node => node.className === 'sm-review-board');
  const count = created.find(node => node.className === 'sm-review-count');
  const pager = created.find(node => node.attrs['aria-label'] === '후기 페이지');
  const empty = created.find(node => node.className === 'sm-review-empty');
  const choose = (group, value) => group.children.find(node => node.dataset.value === value).events.click();

  return { categories, cohorts, board, count, empty, pager, choose, listeners, location, changeFilter, resize,
    navigation: created.find(node => node.className === 'sm-review-navigation'),
    progress: created.find(node => node.className === 'sm-review-progress'),
    tagSelect: created.find(node => node.className === 'sm-review-tag-dropdown dw'),
    views: created.find(node => node.className === 'sm-review-views'),
    stage: created.find(node => node.className === 'sm-review-stage') };
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


test('mobile grid exposes all matching reviews while the shared list pager keeps ten rows', () => {
  const classes = Array.from({ length: 11 }, () => ['cat-life', 'coh7', 'tg4']);
  const { board, pager, count, location, listeners, views } = startReviews(classes);
  assert.equal(count.textContent, '11개의 후기');
  assert.equal(board.children.length, 11);
  assert.equal(pager.hidden, true);
  views.children[1].events.click();
  assert.equal(pager.hidden, false);
  assert.equal(board.children.length, 10);
  assert.equal(board.children[0].tagName, 'a');
  assert.equal(board.children[0].href, '#r-0');
  assert.equal(board.children[0].attrs['aria-haspopup'], 'dialog');
  pager.children.find(button => button.attrs['aria-label'] === '2페이지').events.click();
  assert.equal(board.children.length, 1);
  assert.equal(board.children[0].href, '#r-10');
  location.hash = '#tg-4'; listeners.hashchange();
  assert.equal(board.children.length, 1, 'an old tag hash does not change page 2');
  assert.equal(count.textContent, '11개의 후기');
  views.children[0].events.click();
  assert.equal(board.children.length, 11);
  assert.equal(pager.hidden, true);
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
    runInContext(uiSource, context);
    runInContext(readFileSync(new URL('../stories/js/stories-m.js', import.meta.url), 'utf8'), context);
    assert.equal(appended.length, hasReviews ? 1 : 0);
    if (hasReviews) {
      assert.equal(appended[0].src, 'https://site.example/stories/js/stories-m-reviews.js?v='+assetVersion('stories.js.stories-m-reviews.legacyLoader'));
      let initialized = 0;
      context.StoriesMobileReviews = { init() { initialized++; } };
      appended[0].onload();
      assert.equal(initialized, 1);
    }
  }
});

// Modal hash changes retain the current rail position; selecting a different
// filter/page starts at its first matching card.
test('mobile review rail keeps its position across modal open and close', () => {
  const { board, categories, choose, location, listeners } = startReviews([
    ['cat-life', 'coh7'], ['cat-class', 'coh7'],
  ]);
  board.scrollLeft = 180;
  location.hash = '#r-1'; listeners.hashchange();
  assert.equal(board.scrollLeft, 180);
  location.hash = '#p-rev'; listeners.hashchange();
  assert.equal(board.scrollLeft, 180);
  choose(categories, 'life');
  assert.equal(board.scrollLeft, 0);
});

test('mobile omits tag controls and ignores old tag hashes in either view', () => {
  const { tagSelect, views, board, count, location, listeners } = startReviews([
    ['cat-life', 'coh7', 'tg0'], ['cat-class', 'coh7', 'tg5'],
  ]);
  assert.equal(tagSelect, undefined);
  location.hash = '#tg-5'; listeners.hashchange();
  assert.equal(count.textContent, '2개의 후기');
  assert.equal(board.children.length, 2);
  views.children[1].events.click();
  location.hash = '#r-1'; listeners.hashchange();
  location.hash = '#p-rev'; listeners.hashchange();
  assert.equal(board.children.length, 2);
});

// Navigation follows native scrolling, including swipes; it never rebuilds cards.
test('review navigation tracks scroll bounds and hides for lists and nonoverflowing results', () => {
  const {board, navigation, progress, views} = startReviews([['cat-life','coh7'],['cat-life','coh7']]);
  const previous = navigation.children[1], next = navigation.children[2];
  assert.equal(navigation.hidden, true);
  board.scrollWidth = 900; board.events.scroll();
  assert.equal(navigation.hidden, false);
  assert.equal(previous.disabled, false); assert.equal(next.disabled, false);
  assert.ok(Number(progress.attrs['aria-valuenow']) > 0);
  board.scrollLeft = 300; board.events.scroll();
  assert.equal(previous.disabled, false); assert.equal(next.disabled, false);
  assert.ok(Number(progress.attrs['aria-valuenow']) <= 100);
  board.scrollLeft = 600; board.events.scroll();
  assert.equal(next.disabled, false);
  views.children[1].events.click(); assert.equal(navigation.hidden, true);
});

test('review navigation requests a smooth card step and respects reduced motion', () => {
  for (const reducedMotion of [false,true]) {
    const {board,navigation} = startReviews([['cat-life','coh7'],['cat-life','coh7']], reducedMotion);
    board.children[0].offsetWidth = 240;
    navigation.children[2].events.click();
    assert.equal(board.lastScroll.left, 256);
    assert.equal(board.lastScroll.behavior, reducedMotion ? 'auto' : 'smooth');
    assert.equal(board.children.length, 2);
  }
});

test('circular rail reuses cards at either edge and restores desktop order', () => {
  const context = vm.createContext({setTimeout() {},clearTimeout() {}});
  runInContext(uiSource, context);
  const track = new Element();
  const cards = Array.from({length:4},()=>new Element('a'));
  cards.forEach(card=>{card.offsetWidth=240;track.appendChild(card)});
  track.scrollWidth=1068; track.clientWidth=300;
  const loop = context.SiteUI.circularRail(track);
  loop.reset(true);
  assert.equal(track.children.length,4);
  assert.equal(track.children[0], cards[3]);
  assert.equal(track.children[1], cards[0]);
  assert.equal(track.scrollLeft,256);
  assert.equal(loop.position(),25);
  track.scrollLeft=0; track.events.scrollend();
  assert.equal(track.children[1],cards[3]);
  assert.equal(track.scrollLeft,256);
  assert.equal(loop.position(),100);
  assert.equal(cards[3].dataset.railSlot,'4');
  track.scrollLeft=768; track.events.scrollend();
  assert.equal(track.scrollLeft,512);
  assert.equal(track.children.length,4);
  loop.enable(false);
  assert.deepEqual(track.children,cards);
  assert.equal(track.scrollLeft,0);
  assert.equal(loop.active,false);
});


test('mobile review remount picks up desktop category and cohort filters', () => {
  const { board, count, resize, changeFilter } = startReviews([
    ['cat-life', 'coh8'], ['cat-life', 'coh7'], ['cat-life', 'coh8'], ['cat-class', 'coh8'],
  ], true, true, { rc: 'rc_life' });

  assert.equal(count.textContent, '3개의 후기');
  resize(false);
  changeFilter('fco', 'fco_c8');
  resize(true);
  assert.equal(count.textContent, '2개의 후기');
  assert.deepEqual(board.children.map(node => node.href).sort(), ['#r-0', '#r-2']);

  resize(false);
  changeFilter('fco', 'fco_0');
  resize(true);
  assert.equal(count.textContent, '1개의 후기');
  assert.deepEqual(board.children.map(node => node.href), ['#r-1']);
});

test('mobile review rail restores the same order after a desktop round trip', () => {
  const { board, resize, changeFilter, listeners } = startReviews([
    ['cat-life', 'coh7'], ['cat-class', 'coh7'], ['cat-class', 'coh8'],
  ], true, true);

  for (const category of ['rc_all', 'rc_class']) {
    changeFilter('rc', category);
    const order = board.children.map(node => node.href);
    const start = board.scrollLeft;
    assert.ok(start > 0, 'the circular rail starts at the first canonical review');
    resize(false);
    listeners.resize();
    listeners.resize();
    resize(true);
    assert.deepEqual(board.children.map(node => node.href), order);
    assert.equal(board.scrollLeft, start);
  }
});
