import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { build, loadContent, deriveContent, root } from '../scripts/build.mjs';
import { createRenderer, richText, safeUrl, youtubeId } from '../scripts/template.mjs';

const render = createRenderer(join(root, 'src/components'));

test('one review edit reaches card, list and detail without editing markup', () => {
  const context = loadContent();
  const title = '콘텐츠 한 곳 수정 <검증> & "인용"';
  context.stories.reviews[0].title = title;
  const html = render(readFileSync(join(root, 'src/pages/stories/reviews.html'), 'utf8'), context);
  assert.equal(html.split('콘텐츠 한 곳 수정 &lt;검증&gt; &amp; &quot;인용&quot;').length - 1, 3);
  assert.match(html, /href="#r-life-0"/);
  assert.match(html, /id="r-life-0"/);
  assert.match(html, /aria-labelledby="r-life-0-t"/);
});

test('all generated pages and site settings render from source', () => {
  const outputs = build();
  assert.equal(outputs.size, 11);
  for (const [path, html] of outputs) {
    if (!path.endsWith('.html')) continue;
    assert.match(html, /<!doctype html>/i);
    assert.doesNotMatch(html, /\{\{(?:>|#each|\/each)/);
    if (path !== 'index.html') {
      const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
      assert.ok(scripts.indexOf('../common/js/menu.js') < scripts.indexOf('../common/js/site-layout.js'));
      assert.ok(scripts.indexOf('../common/js/site-layout.js') < scripts.indexOf('../common/js/site.js'));
    }
  }
  const site = loadContent().site;
  const generated = vm.runInNewContext(outputs.get('common/js/menu.js') + '\nJSON.stringify({home:SITE_HOME,menu:SITE_MENU,links:SITE_LINKS,organization:SITE_INFO})');
  assert.deepEqual(JSON.parse(generated), site);
});

test('FAQ categories and food counts follow managed records', () => {
  const context = loadContent();
  assert.equal(context.check.faqCounts.all, context.check.faq.length);
  assert.equal(context.check.faqCounts['준비사항'], context.check.faq.filter(item => item.category === '준비사항').length);
  assert.equal(context.life.foodCounts.food + context.life.foodCounts.cafe, context.life.food.length);
  const output = build().get('check/index.html');
  for (const item of context.check.faq) {
    assert.ok(output.includes(`id="${item.questionId}"`));
    assert.ok(output.includes(`aria-controls="${item.answerId}"`));
  }
});

test('collection insertion and removal update generated cards', () => {
  const context = loadContent();
  const source = readFileSync(join(root, 'src/pages/about/index.html'), 'utf8');
  const original = context.about.gallery.length;
  const count = () => (render(source, context).match(/<figure class="activity-gallery-slide(?: |")/g) || []).length;
  assert.equal(count(), original);
  context.about.gallery.push({ ...context.about.gallery[0], id: 'added-slide', title: '추가한 활동 사진' });
  deriveContent(context);
  assert.equal(count(), original + 1);
  assert.equal(context.about.categories[0].count, 4);
  context.about.gallery.shift();
  deriveContent(context);
  assert.equal(count(), original);
});

test('unmapped filter categories fail instead of silently hiding content', () => {
  const faq = loadContent();
  faq.check.faq[0].category = 'unmapped';
  assert.throws(() => deriveContent(faq), /Unknown FAQ category/);
  const food = loadContent();
  food.life.food[0].type = 'unmapped';
  assert.throws(() => deriveContent(food), /Unknown food type/);
  const facilities = loadContent();
  facilities.life.facilities.pop();
  assert.throws(() => deriveContent(facilities), /Fixed design slots changed/);
});

test('footer reads editable channel and copyright settings', () => {
  const context = loadContent();
  const info = { ...context.site.organization, kakaoChannel: '@changed-channel', copyright: '변경한 저작권 문구' };
  const factory = vm.runInNewContext(readFileSync(join(root, 'common/js/site-layout.js'), 'utf8') + '\nSiteLayout', {
    SITE_HOME: context.site.home, SITE_MENU: context.site.menu, SITE_LINKS: context.site.links, SITE_INFO: info
  });
  const footer = { firstElementChild: null, innerHTML: '' };
  const layout = factory({ $: selector => selector === '#siteFooter' ? footer : null, ROOT: '../', href: () => '', current: null, html: {}, sideNav: false, subnavOn: false });
  layout.renderFooter();
  assert.ok(footer.innerHTML.includes('@changed-channel'));
  assert.ok(footer.innerHTML.includes('변경한 저작권 문구'));
});

test('rich text rejects executable markup, handlers and unsafe link schemes', () => {
  assert.equal(String(richText(['<script>', { tag: 'mark', attrs: { class: 'hl' }, children: ['강조 & 내용'] }])), '&lt;script&gt;<mark class="hl">강조 &amp; 내용</mark>');
  assert.throws(() => richText([{ tag: 'script', children: [] }]), /Unsupported/);
  assert.throws(() => richText([{ tag: 'span', attrs: { onclick: 'alert(1)' }, children: [] }]), /Unsupported/);
  assert.throws(() => richText([{ tag: 'a', attrs: { href: 'javascript:alert(1)' }, children: [] }]), /Unsupported/);
  assert.throws(() => render('{{{answerHtml}}}', { answerHtml: '<script>alert(1)</script>' }), /generated rich text/);
  for (const url of ['javascript:alert(1)', 'data:text/html,test', '//other.example', 'java\nscript:alert(1)', '\\other.example', 'https://example.com/" onmouseover="alert(1)']) assert.throws(() => safeUrl(url));
  assert.equal(safeUrl('../stories/index.html#reviews'), '../stories/index.html#reviews');
  assert.equal(youtubeId('https://www.youtube.com/watch?v=asfChHljIC0'), 'asfChHljIC0');
  assert.equal(youtubeId('https://youtu.be/asfChHljIC0'), 'asfChHljIC0');
  assert.throws(() => youtubeId('https://www.youtube.com/watch?v=x%22%20onload=alert(1)'));
  assert.throws(() => youtubeId('https://other.example/watch?v=asfChHljIC0'));
});

test('nested collections and components preserve context and fail on missing fields', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'aica-template-'));
  try {
    writeFileSync(join(temporary, 'item.html'), '{{title}}:{{#each lines}}{{text}}{{/each}}');
    const renderTest = createRenderer(temporary);
    const result = renderTest('{{#each items}}{{> item}}{{/each}}', { items: [{ title: 'A', lines: [{ text: '<1>' }] }, { title: 'B', lines: [{ text: '&2' }] }] });
    assert.equal(result, 'A:&lt;1&gt;B:&amp;2');
    assert.throws(() => renderTest('{{missing}}', {}), /Missing template value/);
    assert.throws(() => renderTest('{{#each items}}', { items: [] }), /Unclosed collection/);
    assert.throws(() => renderTest('{{constructor.name}}', {}), /Missing template value/);
    assert.throws(() => renderTest('{{> ../outside}}', {}), /Invalid component/);
  } finally { rmSync(temporary, { recursive: true }); }
});
