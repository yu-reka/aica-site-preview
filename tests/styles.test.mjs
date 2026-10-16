import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { build, root } from '../scripts/build.mjs';
import { springArtifacts } from '../scripts/export-spring.mjs';

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

test('Spring public templates retain both presentation stylesheets', () => {
  const templates = [...springArtifacts()].filter(([file]) => /templates\/public-site\/(?:stories|interviews|reviews|projects|cohorts)\.html$/.test(file));
  assert.equal(templates.length, 5);
  for (const [file, html] of templates) {
    const links = styles(html).map(link => new URL(link, 'https://site.example/stories/index.html').pathname);
    assert.ok(links.includes('/common/css/presentation.css'), file);
    assert.ok(links.includes('/stories/css/presentation.css'), file);
    assert.ok(!links.some(link => link.includes('unify.css')), file);
  }
});

test('older Spring story templates can resolve their legacy stylesheet URL', () => {
  const legacy = join(root, 'common/css/unify.css');
  const imports = [...readFileSync(legacy, 'utf8').matchAll(/@import url\("([^"]+)"\)/g)].map(match => match[1].split('?')[0]);
  assert.deepEqual(imports.map(url => resolve(dirname(legacy), url)), [
    join(root, 'common/css/presentation.css'), join(root, 'stories/css/presentation.css'),
  ]);
  for (const url of imports) assert.ok(existsSync(resolve(dirname(legacy), url)), url);
});
