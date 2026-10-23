import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function fixture() {
  const timers = new Map(), globalEvents = {}, clicks = [];
  let serial = 0;
  const element = () => {
    const classes = new Set(), listeners = {};
    return {
      classList: {add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x)},
      addEventListener: (name, fn) => (listeners[name] ||= []).push(fn),
      click() { (listeners.click || []).forEach(fn => fn()); },
      dispatchEvent(event) { (listeners[event.type] || []).forEach(fn => fn(event)); },
      setAttribute() {}, querySelector() { return null; }, scrollIntoView() {}, offsetParent: {},
    };
  };
  const cards = Array.from({length: 8}, element), list = element();
  list.querySelectorAll = () => cards;
  list.querySelector = () => null;
  let dice;
  const document = {
    querySelector: selector => selector === '#fdList' ? list : {insertBefore(button) { dice = button; }},
    createElement: element,
    addEventListener: (name, fn) => { if (name === 'click') clicks.push(fn); },
  };
  const source = readFileSync(new URL('../life/js/life.js', import.meta.url), 'utf8');
  const start = source.indexOf('(function(){\n  var q=function(s){return document.querySelector(s)};\n  var bar=');
  const end = source.indexOf('/* 선배 손글씨 포스트잇 */', start);
  vm.runInNewContext(source.slice(start, end), {
    document, Math, MutationObserver: class { observe() {} },
    setTimeout(fn) { timers.set(++serial, fn); return serial; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener: (name, fn) => { globalEvents[name] = fn; },
  });
  const drain = () => {
    let limit = 500;
    while (timers.size && limit--) {
      const [id, fn] = timers.entries().next().value;
      timers.delete(id); fn();
    }
    assert.ok(limit > 0);
  };
  return {cards, list, timers, drain, roll: () => dice.click(),
    filter: () => list.dispatchEvent({type: 'foodchange'}),
    navigate: () => globalEvents.hashchange()};
}

test('rapid dice clicks replace the pending roll and finish with exactly one selection', () => {
  const f = fixture();
  for (let i = 0; i < 30; i++) { f.roll(); assert.equal(f.timers.size, 1); }
  f.drain();
  assert.equal(f.cards.filter(c => c.classList.contains('pick')).length, 1);
  assert.equal(f.cards.filter(c => c.classList.contains('lit')).length, 0);
  f.roll(); f.drain();
  assert.equal(f.cards.filter(c => c.classList.contains('pick')).length, 1);
});

test('filter changes and navigation cancel an unfinished roll without delayed selections', () => {
  for (const cancel of ['filter', 'navigate']) {
    const f = fixture(); f.roll(); f[cancel](); f.drain();
    assert.equal(f.timers.size, 0);
    assert.equal(f.cards.filter(c => c.classList.contains('pick') || c.classList.contains('lit')).length, 0);
    assert.equal(f.list.classList.contains('rolling'), false);
    assert.equal(f.list.classList.contains('picked'), false);
  }
});
