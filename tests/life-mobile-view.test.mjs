import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Only the source/map DOM boundary is mocked. Browser comparisons cover full pages.
function createView(state, fixtures = {}) {
  const pin = attrs => ({ attrs: { ...attrs },
    querySelector() { return null; },
    removeAttribute(name) { delete this.attrs[name]; },
    setAttribute(name, value) { this.attrs[name] = value; },
  });
  const map = nodes => ({
    nodes,
    classList: { contains: () => false },
    cloneNode() { return map(this.nodes.map(node => pin(node.attrs))); },
    querySelectorAll(selector) {
      if (selector === '[id]') return this.nodes.filter(node => 'id' in node.attrs);
      if (selector.startsWith('[aria-controls]')) return this.nodes.filter(node => 'aria-controls' in node.attrs || 'aria-labelledby' in node.attrs);
      return selector === '.hzmap-d' ? this.nodes : [];
    },
    get outerHTML() { return '<svg>' + this.nodes.map(node => '<g ' + Object.entries(node.attrs).map(([key, value]) => `${key}="${value}"`).join(' ') + '></g>').join('') + '</svg>'; },
  });
  const originalMap = map([pin({ id: 'desktop-pin', 'aria-controls': 'hzp-0', 'aria-labelledby': 'desktop-label' })]);
  const source = {
    querySelector: selector => selector === '.hzmap2' ? originalMap : selector === '.hhl' ? { innerHTML: '<p>기존 지원 조건</p>' } : null,
    querySelectorAll: selector => fixtures[selector] || [],
  };
  const context = vm.createContext({ source, state });
  vm.runInContext(readFileSync(new URL('../life/js/life-m-view.js', import.meta.url), 'utf8'), context);
  return { view: vm.runInContext('LifeMobileView.create(source, state)', context), originalMap };
}
const initialState = () => ({ housingIndex: 0, foodPage: 1 });

test('mobile housing map removes copied desktop IDs/ARIA without mutating the source', () => {
  const state = initialState(), before = { ...state };
  const { view, originalMap } = createView(state);
  const markup = view.screens['tp-house']();
  const map = /<svg>[\s\S]*?<\/svg>/.exec(markup)[0];
  assert.ok(!/id=|aria-controls=|aria-labelledby=/.test(map));
  assert.match(map, /role="button"/);
  assert.match(map, /tabindex="0"/);
  assert.equal(originalMap.nodes[0].attrs.id, 'desktop-pin');
  assert.equal(originalMap.nodes[0].attrs['aria-controls'], 'hzp-0');
  assert.deepEqual(state, before);
});

test('mobile food view reads controller page state, keeps eight-card pages and escapes text', () => {
  const state = initialState();
  const { view } = createView(state);
  const items = Array.from({ length: 13 }, (_, index) => ({
    image: 'assets/food.webp', photoLabel: '음식', category: '식당', walkLabel: '5분',
    name: index === 0 ? '<img onerror="bad">' : '식당 ' + index,
    menu: '메뉴', groupLabel: '혼밥',
  }));
  const first = view.foodResults(items);
  assert.equal((first.match(/class="food-card"/g) || []).length, 8);
  assert.match(first, /&lt;img onerror=&quot;bad&quot;&gt;/);
  assert.ok(!first.includes('<img onerror='));
  state.foodPage = 2;
  assert.equal((view.foodResults(items).match(/class="food-card"/g) || []).length, 5);
  assert.match(view.foodPagination(2), /aria-label="2페이지" aria-current="page"/);
  assert.equal(state.foodPage, 2);
});

function facility(photos) {
  const label = textContent => ({ textContent });
  return { id: 'bx9s-1-0', closest: () => ({ dataset: { g: '1' } }),
    querySelector: selector => selector === '.bx9-info h4' ? label('정문') : null,
    querySelectorAll: selector => selector === '.bx9-sl' ? photos.map(photo => ({
      className: photo.cls || '', dataset: {},
      getAttribute: name => name === 'style' ? photo.style || '' : '시설 사진',
    })) : [],
  };
}
function facilityScreen(photos) {
  const { view } = createView({ chosenSpace: { '1': '0' } }, { '.bx9-g .bx9-s': [facility(photos)] });
  return view.screens.facilities();
}
test('mobile facilities prefer a published inline photo over a legacy class and preserve zoom and position', () => {
  const markup = facilityScreen([{ cls: 'bx9-sl im-entrance', style: 'background-image:url(assets/uploads/facility-fixture.webp);--bs:120%;--bp:30% 40%;' }]);
  assert.match(markup, /background-image:url\(assets\/uploads\/facility-fixture.webp\);background-size:120%;background-position:30% 40%/);
  assert.doesNotMatch(markup, /assets\/entrance.webp|undefined.webp/);
});
test('mobile facilities keep static photos and escape quoted CSS inside the style attribute', () => {
  const markup = facilityScreen([{ cls: 'bx9-sl im-classroom', style: '--bp:20% 70%;' },
    { cls: 'bx9-sl', style: 'background-image:url("assets/uploads/facility-fixture.webp");' }, { cls: 'bx9-sl' }]);
  assert.match(markup, /background-image:url\(&#39;assets\/classroom.webp&#39;\);background-size:cover;background-position:20% 70%/);
  assert.match(markup, /url\(&quot;assets\/uploads\/facility-fixture.webp&quot;\)/);
  assert.doesNotMatch(markup, /undefined.webp|style="[^">]*url\("/);
});
test('mobile overview uses the published overview image rather than hard-coded facility assets', () => {
  const fields = { '.lo-tx b': { textContent: '정문' }, '.lo-tx em': { textContent: '1F' }, '.lo-tx small': { textContent: '입구' },
    '.lo-ph img': { getAttribute: () => 'assets/uploads/overview-fixture.webp' } };
  const card = { dataset: { fac: '1-0' }, querySelector: selector => fields[selector] };
  const { view } = createView(initialState(), { '.lo-pj': [card] });
  assert.match(view.screens.overview(), /src="assets\/uploads\/overview-fixture.webp"/);
});

test('desktop overview resolves the published first photo before the mobile source is cloned', () => {
  const source = readFileSync(new URL('../life/js/life.js', import.meta.url), 'utf8');
  const block = source.slice(source.indexOf("$$('.lo-pj[data-fac]')"), source.indexOf('/* Prefer structured source fields;'));
  const attrs = { src: 'assets/old.webp', srcset: 'assets/stale.webp 640w' };
  const preview = { setAttribute: (name, value) => { attrs[name] = value; }, removeAttribute: name => { delete attrs[name]; } };
  const card = { dataset: { fac: '1-0' } }, photo = {};
  vm.runInNewContext(block, { $$: () => [card], $: selector => selector === '#bx9s-1-0 .bx9-sl' ? photo : preview,
    getComputedStyle: () => ({ backgroundImage: 'url("https://example.test/life/assets/uploads/first-fixture.webp")' }) });
  assert.equal(attrs.src, 'https://example.test/life/assets/uploads/first-fixture.webp');
  assert.equal(attrs.srcset, undefined);
});
