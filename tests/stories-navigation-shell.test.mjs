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
    assert.ok(at('../common/js/site.js') < at('../api/public/stories.js'), path);
    assert.ok(at('js/stories-data.js') < at('../api/public/stories.js'), path);
    assert.ok(at('../api/public/stories.js') < at('js/stories-render.js'), path);
    if (at('js/story-state.js') >= 0) assert.ok(at('js/stories-render.js') < at('js/story-state.js'), path);
  }
});
