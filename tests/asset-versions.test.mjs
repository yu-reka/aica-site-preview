import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { build, root } from '../scripts/build.mjs';
import { connectBackoffice } from '../scripts/backoffice-site.mjs';
import { assetVersion, assetVersions } from '../scripts/asset-versions.mjs';

const read = path => readFileSync(join(root, path), 'utf8');
const values = entry => typeof entry === 'string' ? [entry] : Object.values(entry).flatMap(values);
function htmlSources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? htmlSources(path) : path.endsWith('.html') ? [path] : [];
  });
}

test('cache version lookup rejects typos, inherited properties and unspecified variants', () => {
  assert.equal(assetVersion('stories.js.stories-data'), assetVersions.stories.js['stories-data']);
  for (const key of ['missing', 'common.css.typ0', '__proto__.polluted', 'constructor', 'stories.css.cohort-v3']) {
    assert.throws(() => assetVersion(key), /Unknown asset version|explicit variant/);
  }
  assert.ok(Object.isFrozen(assetVersions.stories.css));
});

test('source HTML takes local CSS and JS cache tokens from the shared map', () => {
  for (const file of htmlSources(join(root, 'src'))) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:src|href)="[^"?]+\.(?:css|js)\?v=([^"&]+)"/g)) {
      assert.match(match[1], /^\{\{v\.[\w.-]+\}\}$/, file);
    }
  }
});

test('design and connected output URLs use declared versions for the corresponding local asset', () => {
  const design = build();
  for (const outputs of [design, connectBackoffice(design)]) {
    for (const [page, html] of outputs) {
      if (!page.endsWith('.html')) continue;
      for (const match of html.matchAll(/(?:src|href)="([^"?]+\.(css|js))\?v=([^"&]+)"/g)) {
        const asset = posix.normalize(posix.join(posix.dirname(page), match[1]));
        const [domain, type, file] = asset.split('/');
        const entry = assetVersions[domain]?.[type]?.[file.slice(0, -type.length - 1)];
        assert.ok(entry, `${page}: version map missing ${asset}`);
        assert.ok(values(entry).includes(match[3]), `${page}: undeclared version for ${asset}`);
      }
      assert.doesNotMatch(html, /\{\{v\./, page);
    }
  }
});

test('standalone JS loaders and legacy CSS imports retain their explicit compatibility tokens', () => {
  const references = [
    ['home/js/ticker-render.js', '../stories/js/stories-data.js', 'stories.js.stories-data'],
    ['stories/js/stories-m.js', 'stories-m-reviews.js', 'stories.js.stories-m-reviews.legacyLoader'],
    ['stories/css/mast.css', '../../common/css/masthead.css', 'common.css.masthead'],
    ['common/css/unify.css', 'presentation.css', 'common.css.presentation'],
    ['common/css/unify.css', '../../stories/css/presentation.css', 'stories.css.presentation.hub']
  ];
  for (const [file, asset, key] of references) {
    assert.ok(read(file).includes(`${asset}?v=${assetVersion(key)}`), `${file}: update the standalone compatibility token with ${key}`);
  }
});
