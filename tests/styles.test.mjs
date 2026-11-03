import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { build, root } from '../scripts/build.mjs';

const styles = html => [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(match => match[1].split('?')[0]);

test('content pages load shared and owned presentation before mobile navigation', () => {
  for (const [page, html] of build()) {
    if (!/^(about|life|check|stories)\//.test(page)) continue;
    const links = styles(html);
    const shared = '../common/css/presentation.css';
    const owned = 'css/presentation.css';
    assert.equal(links.filter(link => link === shared).length, 1, page);
    assert.equal(links.filter(link => link === owned).length, 1, page);
    assert.ok(links.indexOf(shared) < links.indexOf(owned), page);
    assert.ok(links.indexOf(owned) < links.indexOf('../common/css/navigation-mobile.css'), page);
    assert.ok(!links.some(link => link.includes('unify.css')), page);
    for (const link of links.filter(link => !/^https?:/.test(link))) {
      assert.ok(existsSync(resolve(root, dirname(page), link)), `${page}: ${link}`);
    }
  }
});

test('moved presentation assets resolve from their owning stylesheet', () => {
  for (const folder of ['common', 'about', 'life', 'check', 'stories']) {
    const file = join(root, folder, 'css/presentation.css');
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/g)) {
      const url = (match[1] ?? match[2] ?? match[3]).trim();
      if (/^(?:data:|https?:|#)/.test(url)) continue;
      assert.ok(existsSync(resolve(dirname(file), url.split(/[?#]/)[0])), `${folder}: ${url}`);
    }
  }
});

test('Stories and Life own one shared masthead', () => {
  for (const [page, html] of build()) {
    if (!/^(life|stories)\//.test(page)) continue;
    const links = styles(html);
    assert.equal(links.filter(link => link === '../common/css/masthead.css').length, 1, page);
    assert.ok(!links.some(link => /(?:^|\/)mast\.css$/.test(link)), page);
    assert.ok(links.indexOf('../common/css/masthead.css') < links.indexOf('../common/css/navigation-mobile.css'), page);
  }

});
