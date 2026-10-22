import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Run the real dialog controllers in browser listener order, sharing real inert scopes.
function start(zoomed = false) {
  const events = new Map();
  let active;
  class Element {
    constructor(name, parent) {
      this.name = name; this.tagName = 'DIV'; this.children = []; this.inert = false;
      this.parentElement = parent; parent?.children.push(this); this.handlers = new Map();
      this.classList = { contains: name => this.name === 'page' && name === 'stories-hub', remove() {} };
    }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    closest(selector) { return selector === '.ov' && review.contains(this) ? review : null; }
    getClientRects() { return [1]; }
    focus() { active = this; }
    setAttribute() {}
    addEventListener(type, fn) { this.handlers.set(type, [...(this.handlers.get(type) || []), fn]); }
    dispatchEvent(event) { for (const fn of this.handlers.get(event.type) || []) fn(event); }
    querySelector(selector) {
      if (this === page && selector === '.ov:target') return location.hash === '#r-p1' ? review : null;
      if (this === review && selector === '.mtop h3') return heading;
      if (this === cohort && selector === '.cv3-m-media') return media;
      if (this === cohort && selector === '.cv3-m-x') return close;
      if (this === cohort && selector === '.cv3-m-bg') return backdrop;
      return null;
    }
  }
  const body = new Element('body'), header = new Element('header', body);
  const page = new Element('page', body), cards = new Element('cards', page);
  const card = new Element('card', cards), host = new Element('reviewHost', page);
  const review = new Element('review', host), heading = new Element('heading', review);
  const cohort = new Element('cohort', page), media = new Element('media', cohort);
  const close = new Element('close', cohort), backdrop = new Element('backdrop', cohort);
  const zoom = new Element('zoom', body); zoom.hidden = !zoomed; cohort.hidden = false;
  const document = { body, documentElement: { classList: { remove() {} } },
    get activeElement() { return active; }, contains: node => body.contains(node),
    addEventListener() {}, getElementById: () => null };
  const location = { hash: '#st-1' };
  const context = vm.createContext({ document, page, location, Site: { decodeHash: value => value },
    addEventListener(type, fn) { events.set(type, [...(events.get(type) || []), fn]); },
    CustomEvent: class { constructor(type) { this.type = type; } },
    hubModal: true, root: { closest: () => page }, M: cohort, Z: zoom, modalVisited: [], last: card,
    changePhoto() {}, history: { replaceState() {} } });
  vm.runInContext(readFileSync(new URL('../common/js/ui.js', import.meta.url), 'utf8'), context);
  const cohortScope = context.SiteUI.createDialogScope();
  context.isolateDialog = dialog => dialog ? cohortScope.activate(dialog) : cohortScope.release();
  const stories = readFileSync(new URL('../stories/js/stories.js', import.meta.url), 'utf8');
  const begin = stories.indexOf('  (function(){\n    var opener = null, link = null;');
  const end = stories.indexOf('  /* ---------- 숨은 라디오', begin);
  vm.runInContext(stories.slice(begin, end), context);
  const cohorts = readFileSync(new URL('../stories/js/cohort-v3.js', import.meta.url), 'utf8');
  const closeBegin = cohorts.indexOf('  function closeM(');
  const closeEnd = cohorts.indexOf("  M.querySelector('.pv').onclick", closeBegin);
  vm.runInContext(cohorts.slice(closeBegin, closeEnd), context);
  // cohort-v3 registers its hash listener after stories.js on the hub.
  const hashBegin = cohorts.indexOf("addEventListener('hashchange',function(){", cohorts.indexOf('  function hashOpen()'));
  const hashEnd = cohorts.indexOf('\n})();', hashBegin);
  context.hashOpen = () => {};
  vm.runInContext(cohorts.slice(hashBegin, hashEnd), context);
  function activateCohort() {
    cohort.hidden = false; zoom.hidden = !zoomed;
    cohortScope.activate(zoomed ? zoom : cohort); active = close;
  }
  const hash = value => { location.hash = value; for (const fn of events.get('hashchange') || []) fn(); };
  activateCohort();
  return { hash, activateCohort, body, header, cards, review, cohort, zoom, heading, get active() { return active; } };
}

for (const zoomed of [false, true]) {
  test(`cohort${zoomed ? ' photo zoom' : ''} → hub review transfers focus and inert ownership, then fully releases it`, () => {
    const ui = start(zoomed);
    for (let attempt = 0; attempt < 2; attempt++) {
      ui.hash('#r-p1');
      assert.equal(ui.cohort.hidden, true);
      assert.equal(ui.zoom.hidden, true);
      assert.equal(ui.active, ui.heading, 'the old cohort opener must not steal review focus');
      assert.equal(ui.header.inert, true);
      assert.equal(ui.cards.inert, true, 'review background stays inert');
      assert.equal(ui.review.inert, false);
      ui.hash('#hub-reviews');
      function restored(node) { assert.equal(node.inert, false, `${node.name} is restored`); node.children.forEach(restored); }
      restored(ui.body);
      if (attempt === 0) { ui.hash('#st-1'); ui.activateCohort(); }
    }
  });
}
