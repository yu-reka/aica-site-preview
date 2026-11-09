import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from '../scripts/build.mjs';

for (const page of ['404.html', '500.html']) {
  test(`${page} defers the stylesheet request until its hosting root is known`, () => {
    const html = build().get(page);
    assert.match(html, /<base href="\/aica-site-preview\/">/, 'without JavaScript recovery links use the public Pages project root');
    // A static href can be fetched by the browser's speculative parser before the base script runs.
    assert.doesNotMatch(html, /<link\b[^>]*rel="stylesheet"[^>]*href=/i);
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
    for (const pathname of [`/${page}`, `/missing/nested/${page}`, `/aica-site-preview/${page}`, `/aica-site-preview/missing/nested/${page}`]) {
      const base = {}, requests = [];
      const document = {
        querySelector: selector => { assert.equal(selector, 'base'); return base; },
        createElement: tag => { assert.equal(tag, 'link'); return {}; },
        head: {appendChild: link => requests.push({rel: link.rel, href: link.href})},
      };
      vm.runInNewContext(script, {document, location: {pathname}});
      const root = pathname.startsWith('/aica-site-preview/') ? '/aica-site-preview/' : '/';
      assert.equal(base.href, root);
      assert.deepEqual(requests, [{rel: 'stylesheet', href: root + 'common/css/tokens.css'}, {rel:'stylesheet',href:root+'common/css/availability.css?v=1106porcelain-states'}]);
      assert.ok(html.indexOf('<script>') < html.indexOf('<body>'));
    }
  });
}
