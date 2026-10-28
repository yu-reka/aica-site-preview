import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build, loadContent } from '../scripts/build.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('housing data and cards carry no rent, deposit or gosiwon prices', () => {
  const housing = loadContent().life.housing;
  assert.equal(housing.length, 6);
  assert.ok(housing.every(area => !Object.hasOwn(area, 'rentRichText') && !Object.hasOwn(area, 'rentHtml')));
  const gosiwon = housing.map(area => JSON.stringify(area.gosiwonRichText));
  assert.ok(gosiwon.every(text => !/만 원|보증금/.test(text)), gosiwon.join(' / '));
  const html = build().get('life/index.html');
  const house = html.slice(html.indexOf('id="tp-house"'), html.indexOf('id="tp-food"'));
  assert.doesNotMatch(house, /hzc-rent|data-field="rent"|월세|보증금/);
  assert.match(html, /<small>동별 원룸 건물 수 · 교육장까지 거리<\/small>/);
});

test('budget controls and their styles are deleted on desktop and mobile', () => {
  assert.doesNotMatch(read('../life/js/life.js'), /rentslide|rentIn|월세 예산/);
  assert.doesNotMatch(read('../life/js/life-m-view.js'), /budget|rentHtml|hzc-rent/);
  assert.doesNotMatch(read('../life/js/life-m.js'), /budget|rentHtml/);
  for (const file of ['../life/css/life.css', '../life/css/life-m.css', '../life/css/presentation.css', '../common/css/components.css'])
    assert.doesNotMatch(read(file), /\.hzc-rent|\.rentslide|\.budget-(box|options)|\.hzp-t\.(over|fit)|\.lm-content \.rent\b/, file);
});

test('each housing area shows how long it takes to reach the training center', () => {
  const expected = {
    '서남동': '도보 약 5분', '동명동': '도보 약 11분', '지산1동': '대중교통 약 13분',
    '충장동': '도보 약 12분', '조선대 주변': '도보 약 9분', '산수동': '대중교통 약 12분',
  };
  const housing = loadContent().life.housing;
  assert.deepEqual(Object.fromEntries(housing.map(area => [area.name, area.travelLabel])), expected);
  const html = build().get('life/index.html');
  for (const area of housing) assert.match(html, new RegExp(`<span class="hzr-tm" data-field="travel">${area.travelLabel}</span>`));
  assert.match(read('../life/js/life-m-view.js'), /travel:value\('\.hzr-tm',p\)/);
});

test('계림동 is removed from the housing data, map and tabs', () => {
  assert.ok(loadContent().life.housing.every(area => area.id !== 'area-7' && area.name !== '계림동'));
  const html = build().get('life/index.html');
  assert.doesNotMatch(html, /계림동|id="hzp-6"|class="hzmap-d[^"]*" data-i="6"/);
  assert.equal((html.match(/class="hzr-b"/g) || []).length, 6);
  assert.equal((html.match(/class="hzmap-d /g) || []).length, 6);
});
