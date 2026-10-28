import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build, loadContent} from '../scripts/build.mjs';

test('food source records and generated cards contain no senior reviews', () => {
  const food = loadContent().life.food;
  assert.ok(food.length > 0);
  assert.ok(food.every(card => !Object.hasOwn(card, 'review')));
  const html = build().get('life/index.html');
  assert.doesNotMatch(html, /class="fdc-r"|data-field="review"/);
  assert.equal((html.match(/class="fdc"/g) || []).length, food.length);
});

test('food review styles are deleted, not hidden', () => {
  for (const file of ['life.css', 'life-m.css', 'presentation.css']) {
    const css = readFileSync(new URL('../life/css/' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(css, /\.fdc-r\b/, file);
  }
});

test('the separate stories review collection is retained', () => {
  assert.ok(loadContent().stories.reviews.length > 0);
  assert.match(build().get('stories/reviews.html'), /id="r-life-0"/);
});
