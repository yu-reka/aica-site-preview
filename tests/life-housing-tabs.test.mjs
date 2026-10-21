import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

// Exercise the real controller against only the scroll geometry/DOM boundary.
function start({ width = 335, reduced = false } = {}) {
  const source = readFileSync(new URL('../life/js/life-m.js', import.meta.url), 'utf8');
  const code = source.slice(source.indexOf('  function wireHousingTabs()'), source.indexOf('  function wireHousing()'));
  const document = { activeElement: null }, handlers = {}, observers = [];
  const control = () => ({ _hidden: true,
    get hidden() { return this._hidden; },
    set hidden(value) { this._hidden = value; if (value && document.activeElement === this) document.activeElement = null; },
    get offsetWidth() { return this.hidden ? 0 : 44; },
    focus() { document.activeElement = this; } });
  const previous = control(), next = control();
  const moves = [], tabs = {
    clientWidth: width, scrollWidth: 519, scrollLeft: 0,
    getBoundingClientRect() { return { left: 20, right: 20 + this.clientWidth }; },
    addEventListener(type, fn) { handlers[type] = fn; },
    scrollBy(options) {
      moves.push(options);
      this.scrollLeft = Math.max(0, Math.min(this.scrollWidth - this.clientWidth, this.scrollLeft + options.left));
      handlers.scroll?.();
    },
  };
  const buttons = Array.from({ length: 7 }, (_, index) => ({
    getBoundingClientRect() { const left = 20 + index * 75 - tabs.scrollLeft; return { left, right: left + 69 }; },
    focus() { document.activeElement = this; },
    closest() { return this; },
  }));
  const state = { housingIndex: 0 };
  const context = { document, state, reduce: { matches: reduced }, railObservers: observers,
    $: selector => ({ '.housing-selector': tabs, '.housing-tab-prev': previous, '.housing-tab-next': next })[selector],
    $$: () => buttons,
    ResizeObserver: class { constructor(fn) { this.resize = fn; } observe() {} disconnect() {} },
  };
  vm.createContext(context);
  vm.runInContext(code + '\nthis.reveal = wireHousingTabs();', context);
  return { ...context, tabs, buttons, previous, next, handlers, moves, observers };
}

test('housing tab arrows track both ends, keep selection and hand keyboard focus to a visible control', () => {
  const ui = start();
  assert.equal(ui.previous.hidden, true);
  assert.equal(ui.next.hidden, false);
  ui.document.activeElement = ui.next;
  ui.next.onclick();
  assert.equal(ui.previous.hidden, false);
  assert.equal(ui.next.hidden, true);
  assert.equal(ui.document.activeElement, ui.previous);
  assert.equal(ui.state.housingIndex, 0);
  assert.equal(ui.moves[0].behavior, 'smooth');
  ui.previous.onclick();
  assert.equal(ui.previous.hidden, true);
  assert.equal(ui.next.hidden, false);
  assert.equal(ui.document.activeElement, ui.next);
});

test('selected and keyboard-focused areas stay outside the arrow overlays, including after resize', () => {
  const ui = start();
  ui.state.housingIndex = 6;
  ui.reveal(6);
  assert.equal(ui.tabs.scrollLeft, 184);
  assert.equal(ui.next.hidden, true);
  assert.equal(ui.buttons[6].getBoundingClientRect().right, ui.tabs.getBoundingClientRect().right);
  ui.handlers.focusin({ target: ui.buttons[0] });
  assert.equal(ui.tabs.scrollLeft, 0);
  ui.tabs.clientWidth = 300;
  ui.observers[0].resize();
  assert.equal(ui.tabs.scrollLeft, 219);
  assert.equal(ui.next.hidden, true);
});

test('housing arrows honor reduced motion and disappear when all areas fit', () => {
  const ui = start({ reduced: true });
  ui.next.onclick();
  assert.equal(ui.moves[0].behavior, 'auto');
  ui.tabs.clientWidth = 600;
  ui.tabs.scrollLeft = 0;
  ui.document.activeElement = ui.previous;
  ui.observers[0].resize();
  assert.equal(ui.previous.hidden, true);
  assert.equal(ui.next.hidden, true);
  assert.equal(ui.document.activeElement, ui.buttons[0]);
});
