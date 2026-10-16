import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the shipped key handler at its DOM boundary. Real opening, nested
// isolation and restoration are covered by the desktop/mobile browser checks.
function start() {
  let keydown;
  const document = { activeElement: null };
  const button = () => ({
    tabIndex: 0, disabled: false,
    getClientRects: () => [{}], closest: () => null,
    focus() { document.activeElement = this; },
  });
  const close = button(), previous = button(), next = button(), zoomClose = button();
  const modal = {
    hidden: true,
    querySelector: selector => ({ '.cv3-m-x': close, '.cv3-m-bg': {}, '.pv': previous, '.nx': next })[selector],
    querySelectorAll: selector => selector === '.cv3-like,.cv3-save' ? [] : [close, previous, next].filter(node => !node.disabled),
  };
  const zoom = { hidden: true, setAttribute() {}, querySelectorAll: () => [zoomClose] };
  const root = { querySelector: () => ({ replaceChildren() {} }) };
  Object.assign(document, {
    getElementById: id => id === 'cv3' ? root : id === 'cv3-data' ? { content: { querySelectorAll: () => [] } } : null,
    querySelector: () => modal,
    createElement: tag => tag === 'div' ? zoom : { setAttribute() {} },
    body: { appendChild() {} },
    addEventListener(name, handler) { if (name === 'keydown') keydown = handler; },
  });
  vm.runInNewContext(readFileSync(new URL('../stories/js/cohort-v3.js', import.meta.url), 'utf8'), {
    document, getComputedStyle: () => ({ visibility: 'visible' }),
  });
  modal.hidden = false;
  const tab = shiftKey => {
    let prevented = false;
    keydown({ key: 'Tab', shiftKey, preventDefault() { prevented = true; } });
    return prevented;
  };
  return { document, modal, zoom, close, previous, next, zoomClose, tab };
}

test('Tab wraps when the focused next button becomes disabled on the final post', () => {
  const ui = start();
  ui.next.disabled = true;
  ui.document.activeElement = ui.next;
  assert.equal(ui.tab(false), true);
  assert.equal(ui.document.activeElement, ui.close);
});

test('Shift+Tab wraps when the focused previous button becomes disabled on the first post', () => {
  const ui = start();
  ui.previous.disabled = true;
  ui.document.activeElement = ui.previous;
  assert.equal(ui.tab(true), true);
  assert.equal(ui.document.activeElement, ui.next);
});

test('the nested zoom dialog owns both Tab directions while open', () => {
  const ui = start();
  ui.zoom.hidden = false;
  ui.document.activeElement = ui.zoomClose;
  assert.equal(ui.tab(false), true);
  assert.equal(ui.document.activeElement, ui.zoomClose);
  assert.equal(ui.tab(true), true);
  assert.equal(ui.document.activeElement, ui.zoomClose);
});
