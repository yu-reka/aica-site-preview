import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function start(reduced, mobile = false) {
  const classes = new Set(), handlers = {}, icon = {};
  let preferenceChange;
  const preference = { matches: reduced, addEventListener(type, fn) { preferenceChange = fn; } };
  const button = { querySelector: selector => selector === '.tk-toggle-icon' ? icon : null,
    addEventListener(type, fn) { handlers[type] = fn; }, setAttribute(name, value) { this[name] = value; } };
  const areaHandlers = {};
  const area = { addEventListener(type, fn) { areaHandlers[type] = fn; } };
  const ticker = { querySelector: selector => selector === '.tk-window' ? area : button, classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); } } };
  const main = { querySelector: () => null };
  const context = { Site: { reduce: reduced, menu: () => null }, location: { hash: '' },
    document: { querySelector: selector => selector === '.tk' ? ticker : selector === '#main' ? main : null },
    matchMedia: query => query.includes('prefers-reduced-motion') ? preference : { matches: mobile } };
  vm.runInNewContext(readFileSync(new URL('../home/js/home.js', import.meta.url), 'utf8'), context);
  return { classes, icon, button, click: () => handlers.click(), tapArea: () => areaHandlers.click(), preference: value => preferenceChange({ matches: value }) };
}

test('ticker exposes persistent user pause and resume, with a reduced-motion default and live preference changes', () => {
  const normal = start(false);
  assert.equal(normal.icon.textContent, 'Ⅱ');
  normal.click();
  assert.equal(normal.classes.has('is-paused'), true);
  assert.equal(normal.button['aria-label'], '전광판 다시 재생');
  normal.click();
  assert.equal(normal.classes.has('is-running'), true);
  normal.preference(true);
  assert.equal(normal.classes.has('is-paused'), true);
  const reduced = start(true);
  assert.equal(reduced.icon.textContent, '▶');
  assert.equal(reduced.classes.has('is-paused'), true);
});

test('mobile ticker area and button share pause/resume state, including reduced-motion startup', () => {
  const mobile = start(false, true);
  mobile.tapArea();
  assert.equal(mobile.classes.has('is-paused'), true);
  assert.equal(mobile.icon.textContent, '▶');
  assert.equal(mobile.button['aria-label'], '전광판 다시 재생');
  mobile.click();
  assert.equal(mobile.classes.has('is-running'), true);
  assert.equal(mobile.icon.textContent, 'Ⅱ');
  mobile.click();
  mobile.tapArea();
  assert.equal(mobile.classes.has('is-running'), true);
  const reduced = start(true, true);
  reduced.tapArea();
  assert.equal(reduced.classes.has('is-running'), true);
  assert.equal(reduced.icon.textContent, 'Ⅱ');
});

test('desktop area click does not change the persistent pause preference', () => {
  const desktop = start(false);
  desktop.tapArea();
  assert.equal(desktop.classes.has('is-running'), true);
  assert.equal(desktop.icon.textContent, 'Ⅱ');
});
