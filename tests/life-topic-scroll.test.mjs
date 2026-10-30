import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../life/js/life.js', import.meta.url), 'utf8');
const routers = source.slice(source.indexOf("var PG = $$(':scope > .page', MAIN);"), source.indexOf("addEventListener('hashchange', topic);"));

// Run both shipped routers, including their timers, with ready and delayed fonts.
async function open(hash, delayedFonts, mobile = false) {
  const timers = [], scrolls = [];
  let fontsReady, now = 0;
  const pages = ['home', 'facility', 'tips', 'way'].map(name => ({
    id: 'pg-' + name, dataset: { page: name }, hidden: name !== 'home',
  }));
  const tips = pages[2];
  const sections = ['house', 'food', 'fun'].map(name => {
    const section = { id: 'tp-' + name, closest: selector => selector === '.page' ? tips : section,
      scrollIntoView() { scrolls.push(section.id); } };
    return section;
  });
  const detail = { id: 'hzp-0', closest: selector => selector === '.page' ? tips : sections[0],
    scrollIntoView() { scrolls.push('hzp-0'); } };
  const location = { hash };
  const ready = new Promise(resolve => { fontsReady = resolve; });
  if (!delayedFonts) fontsReady();
  const context = {
    MAIN: { classList: { contains: () => true } }, matchMedia: () => ({ matches: mobile }),
    $: () => null, $$: selector => selector === ':scope > .page' ? pages : [],
    Site: { decodeHash: value => decodeURIComponent(value) }, location,
    document: { title: 'Life', documentElement: { dataset: {} }, fonts: { ready },
      getElementById: id => [...pages, ...sections, detail].find(el => el.id === id) || null },
    history: { replaceState(_state, _title, hash) { location.hash = hash; } },
    window: { scrollTo: () => scrolls.push('top') },
    setTimeout(fn, delay) { timers.push({ fn, at: now + delay }); },
    dispatchEvent() {}, Event: class {}, addEventListener() {},
  };
  vm.runInNewContext(routers + '\nroute();\ntopic();', context);
  const scheduledDelays = timers.map(timer => timer.at);
  const flush = async () => {
    await Promise.resolve();
    while (timers.length) {
      timers.sort((a, b) => a.at - b.at);
      const timer = timers.shift();
      now = timer.at;
      timer.fn();
      await Promise.resolve();
    }
  };
  await flush();
  if (delayedFonts) { fontsReady(); await flush(); }
  return { scrolls, hash: location.hash, tips, scheduledDelays };
}

test('mobile topic transitions do not queue a late scroll reset after the next menu click', async () => {
  const mobile = await open('#tp-food', false, true);
  assert.deepEqual(mobile.scheduledDelays, []);
  assert.ok(mobile.scrolls.every(value => value === 'top'));
  const desktop = await open('#tp-food', false);
  assert.deepEqual(desktop.scheduledDelays, [200]);
});

for (const delayedFonts of [false, true]) {
  for (const topic of ['house', 'food', 'fun']) {
    for (const hash of ['#tp-' + topic, '#tips/' + topic, '#tips%2F' + topic]) {
      test(`${hash} stays at the top with ${delayedFonts ? 'delayed' : 'ready'} fonts`, async () => {
        const result = await open(hash, delayedFonts);
        assert.equal(result.hash, '#tp-' + topic);
        assert.equal(result.tips.hidden, false);
        assert.equal(result.tips.dataset.topic, 'tp-' + topic);
        assert.ok(result.scrolls.length > 0);
        assert.ok(result.scrolls.every(value => value === 'top'), result.scrolls.join(' → '));
      });
    }
  }
  test(`an internal topic anchor stays aligned with ${delayedFonts ? 'delayed' : 'ready'} fonts`, async () => {
    const result = await open('#hzp-0', delayedFonts);
    assert.equal(result.tips.hidden, false);
    assert.equal(result.tips.dataset.topic, 'tp-house');
    assert.deepEqual(result.scrolls, ['hzp-0', 'hzp-0']);
  });
}
