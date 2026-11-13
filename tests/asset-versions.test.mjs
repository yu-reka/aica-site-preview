import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { build, root } from '../scripts/build.mjs';
import { connectBackoffice } from '../scripts/backoffice-site.mjs';
import { assetVersion, assetVersions, contentToken, generatedScripts, LOADER_TOKENS } from '../scripts/asset-versions.mjs';
import { readText } from '../scripts/text.mjs';

// LF로 읽음: 예전 Windows 사본(CRLF)도 Git에 담긴 내용과 같은 값으로 비교
const read = path => readText(join(root, path));
const values = entry => typeof entry === 'string' ? [entry] : Object.values(entry).flatMap(values);
function htmlSources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? htmlSources(path) : path.endsWith('.html') ? [path] : [];
  });
}

test('cache version lookup rejects typos, inherited properties and partial keys', () => {
  assert.equal(assetVersion('stories.js.stories-data'), assetVersions.stories.js['stories-data']);
  for (const key of ['missing', 'common.css.typ0', '__proto__.polluted', 'constructor', 'stories.css', 'stories.css.cohort-v3.hub']) {
    assert.throws(() => assetVersion(key), /Unknown asset version|needs <area>/);
  }
  assert.ok(Object.isFrozen(assetVersions.stories.css));
});

test('every local CSS and JS file gets its content hash as the cache token', () => {
  const sha = text => createHash('sha256').update(text).digest('hex').slice(0, 8);
  let count = 0;
  for (const area of readdirSync(root, { withFileTypes: true })) {
    if (!area.isDirectory() || area.name.startsWith('.') || area.name === 'node_modules') continue;
    for (const type of ['css', 'js']) {
      let names = [];
      try { names = readdirSync(join(root, area.name, type)).filter(name => name.endsWith(`.${type}`)); } catch { continue; }
      for (const name of names) {
        const path = `${area.name}/${type}/${name}`;
        // build-written files (menu.js, loaders) are hashed as the build writes them, so a stale copy cannot keep an old token
        assert.equal(assetVersions[area.name][type][name.slice(0, -type.length - 1)], sha(generatedScripts.get(path) ?? read(path)), path);
        count++;
      }
    }
  }
  assert.ok(count > 50, `expected the site CSS and JS files, found ${count}`);
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

test('standalone JS loaders request the current token of the script they load (npm run build rewrites it)', () => {
  assert.deepEqual(LOADER_TOKENS.map(([file]) => file), ['home/js/ticker-render.js', 'stories/js/stories-m.js']);
  for (const [file, url, target] of LOADER_TOKENS) {
    const [area, type, name] = target.split('/');
    assert.ok(generatedScripts.get(file).includes(`${url}?v=${assetVersion(`${area}.${type}.${name.slice(0, -type.length - 1)}`)}`), file);
    assert.equal(read(file), generatedScripts.get(file), `${file}: run npm run build`);
  }
});

test('cache tokens hash LF text: an old Windows copy with CRLF files gets the same tokens, LF files keep theirs', () => {
  const lf = 'body {\n  color: red;\n}\n';
  assert.equal(contentToken(lf), createHash('sha256').update(lf).digest('hex').slice(0, 8));
  assert.equal(contentToken(lf.replaceAll('\n', '\r\n')), contentToken(lf));
});
