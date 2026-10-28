import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from '../scripts/build.mjs';

test('facility tour page has no related links block on desktop or mobile', () => {
  const html = build().get('life/index.html');
  assert.doesNotMatch(html, /class="fsx"/);
  const view = readFileSync(new URL('../life/js/life-m-view.js', import.meta.url), 'utf8');
  assert.doesNotMatch(view, /cross-links|\.fsx a/);
});

test('facility related link styles are deleted, not hidden', () => {
  for (const file of ['life.css', 'life-m.css', 'presentation.css']) {
    const css = readFileSync(new URL('../life/css/' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(css, /\.fsx\b|cross-links|함께 보면 좋아요/, file);
  }
});
