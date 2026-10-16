import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Only the source/map DOM boundary is mocked. Browser comparisons cover full pages.
function createView(state) {
  const pin = attrs => ({ attrs: { ...attrs },
    removeAttribute(name) { delete this.attrs[name]; },
    setAttribute(name, value) { this.attrs[name] = value; },
  });
  const map = nodes => ({
    nodes,
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
    querySelectorAll: () => [],
  };
  const context = vm.createContext({ source, state });
  vm.runInContext(readFileSync(new URL('../life/js/life-m-view.js', import.meta.url), 'utf8'), context);
  return { view: vm.runInContext('LifeMobileView.create(source, state)', context), originalMap };
}
const initialState = () => ({ budget: 35, housingIndex: 0, foodPage: 1 });

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
    menu: '메뉴', review: '후기', groupLabel: '혼밥',
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
