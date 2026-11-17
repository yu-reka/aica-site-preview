import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from '../scripts/build.mjs';
import {assetVersion} from '../scripts/asset-versions.mjs';

for (const page of ['404.html', '500.html']) {
  test(`${page} defers the stylesheet request until its hosting root is known`, () => {
    const html = build().get(page);
    assert.doesNotMatch(html, /<base\b/, 'the skip link uses the current error URL');
    assert.match(html, /href="#main"/);
    assert.match(html, /href="\/aica-site-preview\/home\/index.html"/, 'recovery works under the Pages project with scripts off');
    // A static href can be fetched by the browser's speculative parser before the base script runs.
    assert.doesNotMatch(html, /<link\b[^>]*rel="stylesheet"[^>]*href=/i);
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
    const rewriteLinks = /<script>\s*(if\(root!==projectRoot\)[\s\S]*?)<\/script>/.exec(html)?.[1];
    assert.ok(rewriteLinks, 'root-hosted recovery links are initialized');
    for (const pathname of [`/${page}`, `/missing/nested/${page}`, `/aica-site-preview/${page}`, `/aica-site-preview/missing/nested/${page}`]) {
      const requests = [];
      const attributes = {href: '/aica-site-preview/home/index.html', src: '/aica-site-preview/common/assets/brand/symbol-white.png'};
      const element = attribute => ({
        matches: selector => selector === 'a' && attribute === 'href',
        getAttribute: key => attributes[key],
        setAttribute: (key, value) => { attributes[key] = value; },
      });
      const document = {
        querySelectorAll: selector => {
          assert.equal(selector, 'a[href^="/aica-site-preview/"],img[src^="/aica-site-preview/"]');
          return [element('href'), element('src')];
        },
        createElement: tag => { assert.equal(tag, 'link'); return {}; },
        head: {appendChild: link => requests.push({rel: link.rel, href: link.href})},
      };
      vm.runInNewContext(script + rewriteLinks, {document, location: {pathname}});
      const root = pathname.startsWith('/aica-site-preview/') ? '/aica-site-preview/' : '/';
      assert.equal(attributes.href, root + 'home/index.html');
      assert.equal(attributes.src, root + 'common/assets/brand/symbol-white.png');
      assert.deepEqual(requests, [{rel: 'stylesheet', href: root + 'common/css/tokens.css'}, {rel:'stylesheet',href:root+'common/css/availability.css?v='+assetVersion('common.css.availability')}]);
      assert.ok(html.indexOf('<script>') < html.indexOf('<body>'));
    }
  });
}
