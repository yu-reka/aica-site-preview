import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../about/js/about-m.js', import.meta.url), 'utf8');
const chapterController = source.slice(source.indexOf('    function jumpToChapter('), source.indexOf('    var raf;'));
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
