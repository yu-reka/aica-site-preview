import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../life/css/presentation.css', import.meta.url), 'utf8');

test('life filter chips keep their own rules and do not borrow the food tab rule', () => {
  assert.match(css, /\.life-page \.chip\{height:40px;border:1px solid var\(--st-chip-line\)!important;background:#fff/);
  assert.match(css, /\.life-page \.chip\[aria-pressed="true"\]\{background:var\(--ink\)!important;border-color:var\(--ink\)!important;color:#fff!important\}/);
  // A selector left with a trailing comma joins the next rule (e.g. .fdk{border:0;background:none}).
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /,\s*\n\s*\n/);
});
