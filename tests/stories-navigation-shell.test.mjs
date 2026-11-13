import test from 'node:test';
import assert from 'node:assert/strict';
import { build, loadContent } from '../scripts/build.mjs';
import { connectBackoffice } from '../scripts/backoffice-site.mjs';

// The document must provide usable navigation even while the API script is pending.
test('each story document ships one complete menu with its own current page', () => {
  const menu = loadContent().site.menu.find(item => item.id === 'stories');
  for (const output of [build(), connectBackoffice(build())]) {
    for (const page of menu.children) {
      const html = output.get(page.page);
      const nav = html.match(/<nav class="lnb" id="siteLnb"[\s\S]*?<\/nav>/)?.[0];
      assert.ok(nav, page.page);
      assert.equal((html.match(/id="siteLnb"/g) || []).length, 1, page.page);
      assert.match(html, /<html[^>]*data-subnav="off"/, page.page);
      for (const child of menu.children) {
        const link = nav.match(new RegExp('<a href="([^"\\n]+)" data-sub="' + child.id + '"([^>]*)>'));
        assert.ok(link, child.id);
        assert.equal(new URL(link[1], 'https://example.test/aica-site-preview/' + page.page).pathname,
          '/aica-site-preview/' + child.page);
        assert.equal(link[2].includes('aria-current="page"'), child.id === page.id);
      }
    }
  }
});

test('common navigation initializes before the published-data script without changing data renderer order', () => {
  const output = connectBackoffice(build());
  for (const [path, html] of output) {
    if (!/^stories\/.+\.html$/.test(path)) continue;
    const scripts = [...html.matchAll(/<script src="([^"?]+)/g)].map(match => match[1]);
    const at = value => scripts.indexOf(value);
    assert.ok(at('../common/js/ui.js') < at('../common/js/site.js'), path);
    assert.ok(at('../common/js/site.js') < at('../common/js/stories-loader.js'), path);
    const consumers=JSON.parse(/data-scripts='([^']+)'/.exec(html)[1].replaceAll('&amp;','&')).map(src=>src.split('?')[0]);
    // 렌더러 세 파일(목록 · 데스크톱 후기 넘김 · 글 안 사진과 영상)은 한 파일이던 때 순서 그대로, 그다음 text-fit
    assert.deepEqual(consumers.slice(0,5),['js/story-details.js','js/stories-render.js','js/stories-review-paging.js','js/stories-media.js','js/text-fit.js'],path);
    assert.ok(consumers.indexOf('js/story-state.js')>0,path);
    assert.ok(consumers.indexOf('js/stories-m.js')>consumers.indexOf('js/story-state.js'),path);
  }
});
