import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../life/js/life.js', import.meta.url), 'utf8');
const router = source.slice(source.indexOf("var PG = $$(':scope > .page', MAIN);"), source.indexOf("addEventListener('hashchange', route);"));

// Exercise the shipped router with fonts becoming ready after its first timer.
async function open(hash) {
  const timers = [], sectionScrolls = [], topScrolls = [];
  let fontsReady;
  const pages = ['home', 'facility', 'tips', 'way'].map(name => ({
    id: 'pg-' + name, dataset: { page: name }, hidden: name !== 'home',
  }));
  const tips = pages[2];
  const sections = ['house', 'food', 'fun'].map(name => {
    const section = { id: 'tp-' + name, closest: selector => selector === '.page' ? tips : section,
      scrollIntoView() { sectionScrolls.push(section.id); } };
    return section;
  });
  const detail = { id: 'house-detail', closest: selector => selector === '.page' ? tips : sections[0],
    scrollIntoView() { sectionScrolls.push('house-detail'); } };
  const location = { hash };
  const context = {
    MAIN: {}, PG: pages, $: () => null, $$: () => pages,
    Site: { decodeHash: value => decodeURIComponent(value) }, location,
    document: { title: 'Life', documentElement: { dataset: {} },
      fonts: { ready: new Promise(resolve => { fontsReady = resolve; }) },
      getElementById: id => [...pages, ...sections, detail].find(el => el.id === id) || null },
    history: { replaceState(_state, _title, hash) { location.hash = hash; } },
    window: { scrollTo: options => topScrolls.push(options.top) },
    setTimeout(fn, delay) { timers.push({ fn, delay }); },
  };
  vm.runInNewContext(router + '\nroute();', context);
  const flush = () => timers.splice(0).sort((a, b) => a.delay - b.delay).forEach(timer => timer.fn());
  flush();
  fontsReady();
  await Promise.resolve();
  flush();
  return { sectionScrolls, topScrolls, hash: location.hash, tips };
}

for (const topic of ['house', 'food', 'fun']) {
  for (const hash of ['#tp-' + topic, '#tips/' + topic, '#tips%2F' + topic]) {
    test(`${hash} stays at the top after delayed font readiness`, async () => {
      const result = await open(hash);
      assert.equal(result.hash, '#tp-' + topic);
      assert.equal(result.tips.hidden, false);
      assert.deepEqual(result.topScrolls, [0]);
      assert.deepEqual(result.sectionScrolls, []);
    });
  }
}

test('an anchor inside a topic still aligns its content after fonts become ready', async () => {
  const result = await open('#house-detail');
  assert.equal(result.tips.hidden, false);
  assert.deepEqual(result.topScrolls, []);
  assert.deepEqual(result.sectionScrolls, ['house-detail', 'house-detail']);
});
