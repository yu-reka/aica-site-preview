import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../about/js/about-m.js', import.meta.url), 'utf8');
const chapterController = source.slice(source.indexOf('    function jumpToChapter('), source.indexOf('    var raf;'));
test('rapid chapter taps cancel animation and use the last target, then restore smooth scrolling', () => {
  const scrolls = [], handlers = [];
  let now = 1000, y = 0, nextFrame = 0;
  const frames = new Map();
  const tops = { 'am-ch1': 1000, 'am-ch2': 4000, 'am-ch3': 6000, 'am-ch4': 7000 };
  vm.runInNewContext(chapterController, {
    Date: { now: () => now }, mq: {matches:true}, reduce: {matches:false},
    btns: [1, 2, 3, 4].map(k => ({dataset:{jump:String(k)}, addEventListener:(_, fn) => handlers.push(fn)})),
    document: {readyState:'loading', addEventListener() {}, getElementById:id => ({getBoundingClientRect:()=>({top:tops[id] - y})})},
    addEventListener() {}, setCur() {}, hdr:()=>60,
    requestAnimationFrame: fn => { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    get scrollY() { return y; },
    scrollTo: options => { scrolls.push(options); if(options.behavior === 'instant') y = options.top; },
  });
  handlers[3]();
  assert.equal(scrolls.at(-1).behavior, 'smooth');
  y = 1500; // The first animation is still between chapters.
  for (const k of [1, 3, 2, 4, 2]) {
    now += 100;
    handlers[k - 1]();
    assert.equal(scrolls.at(-1).behavior, 'instant');
    assert.equal(y, tops['am-ch' + k] - 60, 'each subsequent tap reaches its own target immediately');
  }
  assert.equal(frames.size, 1, 'only the latest correction remains queued');
  y += 80; // Some browsers apply one last step from the cancelled animation.
  frames.values().next().value();
  assert.equal(y, tops['am-ch2'] - 60, 'the next frame corrects residual movement');
  now += 700;
  handlers[0]();
  assert.equal(scrolls.at(-1).behavior, 'smooth', 'isolated taps keep the original motion');
});
for (const pathname of ['/aica-site-preview/about', '/aica-site-preview/about/', '/aica-site-preview/about/index.html', '/admin/pages/site/about/']) {
  test(`same-hash drawer selection aligns the chapter at route alias ${pathname}`, () => {
    const scrolls = [];
    let click;
    const location = { origin: 'https://example.test', pathname, hash: '#learning', href: `https://example.test${pathname}#learning` };
    const targetPath = pathname.startsWith('/admin/') ? '/admin/pages/site/about/index.html' : '/aica-site-preview/about/index.html';
    const link = { href: `https://example.test${targetPath}#learning` };
    vm.runInNewContext(chapterController, {
      URL, location, mq: {matches:true}, reduce: {matches:true}, btns:[], scrollY:0,
      document: { readyState:'loading', getElementById: id => id === 'am-ch2' ? {getBoundingClientRect:()=>({top:500})} : null,
        addEventListener: (type, fn) => { if(type === 'click') click = fn; } },
      addEventListener() {}, requestAnimationFrame: fn => fn(), cancelAnimationFrame() {},
      setCur() {}, hdr:()=>60, scrollTo: options => scrolls.push(options),
    });
    click({target:{closest:()=>link}});
    assert.equal(scrolls.length, 1, 'same-page aliases must use the same jump as bottom tabs');
    assert.equal(scrolls[0].top, 440);
    assert.equal(scrolls[0].behavior, 'auto', 'reduced motion is preserved');
    scrolls.length = 0;
    click({ctrlKey:true,target:{closest:()=>link}});
    assert.equal(scrolls.length, 0, 'modified clicks remain native');
  });
}
