import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function start(reduced) {
  const classes = new Set(), handlers = {}, label = {}, icon = {};
  let preferenceChange;
  const preference = { matches: reduced, addEventListener(type, fn) { preferenceChange = fn; } };
  const button = { querySelector: selector => selector === '.tk-toggle-label' ? label : icon,
    addEventListener(type, fn) { handlers[type] = fn; }, setAttribute(name, value) { this[name] = value; } };
  const ticker = { querySelector: () => button, classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); } } };
  const main = { querySelector: () => null };
  const context = { Site: { reduce: reduced, menu: () => null }, location: { hash: '' },
    document: { querySelector: selector => selector === '.tk' ? ticker : selector === '#main' ? main : null },
    matchMedia: () => preference };
  vm.runInNewContext(readFileSync(new URL('../home/js/home.js', import.meta.url), 'utf8'), context);
  return { classes, label, icon, button, click: () => handlers.click(), preference: value => preferenceChange({ matches: value }) };
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
