import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from '../scripts/build.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const housingSection = () => {
  const html = build().get('life/index.html');
  return html.slice(html.indexOf('id="tp-house"'), html.indexOf('id="tp-food"'));
};

test('housing shows one nearest-first list beside the map instead of tabs and cards', () => {
  const section = housingSection();
  const names = [...section.matchAll(/<b data-field="name">([^<]+)<\/b>/g)].map(match => match[1]);
  assert.deepEqual(names, ['서남동', '조선대 주변', '동명동', '충장동', '산수동', '지산1동']);
  assert.match(section, /<h2>어느 동에 살면 좋을까요\?<\/h2>\s*<\/div><\/div>\s*<h3 class="hst"><span>01<\/span>교육장 근처 주거 정보<\/h3>/);
  assert.match(section, /<p class="hzl-ord">교육장에서 가까운 순<\/p>\s*<ul class="hzl"/);
  assert.doesNotMatch(section, /sh-lead/);
  assert.doesNotMatch(section, /hzp-t|role="tab"|hz-ref|동별 주거 정보|hz-aid/);
});

test('each list row and its map circle share the same index and number', () => {
  const section = housingSection();
  const rows = [...section.matchAll(/<li class="hzr[^"]*" id="hzp-(\d)" data-i="(\d)"><button[^>]*><span class="hzr-no" aria-hidden="true">(\d)<\/span><span class="hzr-tx"><b data-field="name">([^<]+)</g)];
  assert.equal(rows.length, 6);
  for (const [, id, index, number, name] of rows) {
    assert.equal(id, index);
    assert.equal(Number(number), Number(index) + 1);
    const circle = new RegExp(`<g class="hzmap-d[^"]*" data-i="${index}"[^>]*aria-label="${name} [^"]*">(?:<circle[^>]*/>)+<text[^>]*class="nn">${number}</text>`);
    assert.match(section, circle, name);
  }
});

test('desktop and mobile controllers no longer carry the tab and card rail code', () => {
  const desktop = read('../life/js/life.js'), view = read('../life/js/life-m-view.js'), mobile = read('../life/js/life-m.js');
  assert.match(desktop, /\$\$\('\.hzr-b', MAIN\)/);
  assert.doesNotMatch(desktop, /hzp-t|\.hzp'/);
  assert.match(view, /class="housing-list"/);
  assert.doesNotMatch(view, /housing-rail|housing-card|housing-selector|housing-aid/);
  assert.doesNotMatch(mobile, /wireHousingTabs|housing-rail|housing-card/);
});

test('the housing support notes stay as their own block below the map card', () => {
  const section = housingSection();
  const map = section.indexOf('class="hzmw"'), notes = section.indexOf('<h3 class="hst hst-gap"><span>02</span>주거 지원금 받을 때 확인할 점</h3>');
  assert.ok(map > -1 && notes > map);
  assert.match(section, /<div class="hhl">\s*<p class="hhl-big"><mark>주민등록상 주소지가 타 지역<\/mark>/);
  assert.equal((section.match(/<div><i>0[12]<\/i><p>/g) || []).length, 2);
  assert.match(read('../life/js/life-m-view.js'), /<details class="support-card" open><summary>주거 지원금 받을 때 확인할 점/);
  assert.match(read('../life/css/life-m.css'), /--housing-note-line/);
});

test('room-count levels use clearly different fills and the selection dims the other areas', () => {
  const desktop = read('../life/css/life.css'), mobile = read('../life/css/life-m.css');
  for (const css of [desktop, mobile]) {
    assert.match(css, /\.hzmap-d\.lv3 \.a\{fill:color-mix\(in srgb,var\(--primary\) 62%,transparent\)/);
    assert.match(css, /\.hzmap-d \.a\{fill:color-mix\(in srgb,var\(--primary\) 24%,transparent\)/);
    assert.match(css, /\.hzmap-d\.lv1 \.a\{fill:color-mix\(in srgb,var\(--primary\) 4%,transparent\)[^}]*stroke-dasharray:10 10/);
    assert.match(css, /\.hzmap2:has\(\.hzmap-d\.on\) \.hzmap-d:not\(\.on\)\{opacity:\.35\}/);
    assert.match(css, /\.hzmap-d\.on \.n\{fill:var\(--primary\);r:54px\}/);
    assert.doesNotMatch(css, /\.hzmap-d:is\(:hover,:focus-visible,\.on\) \.a\{stroke:var\(--ink\)/);
  }
  assert.match(desktop, /\.hzmw-lg i\.lv3\{background:color-mix\(in srgb,var\(--primary\) 62%,#fff\)/);
  assert.match(desktop, /\.hzmw-lg i\.lv1\{background:#fff;border:2px dashed/);
});
