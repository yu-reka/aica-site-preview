import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('topic shortcut bar hides on desktop with the side menu but keeps its markup for the side menu links', () => {
  assert.match(read('../life/css/life.css'), /@media \(min-width:1200px\)\{html body \.life-page \.tp-bar\{display:none\}\}/);
  assert.match(read('../life/css/life.css'), /@media \(min-width:1200px\)\{html\[data-nav="side"\] body \.life-page #pg-tips\[data-topic\] \.tp-sec\{padding-top:var\(--mh-gap\)!important\}\}/);
  assert.match(read('../src/pages/life/index.html'), /<div class="wrap tp-bar"><a class="tp-back" href="#tips">[\s\S]*?<nav aria-label="생활 꿀팁 주제">/);
  assert.match(read('../life/js/life.js'), /\$\$\('\.tp-bar nav a', TPG\)/);
});

test('opening or reloading a topic screen (#tp-house …) starts at the top instead of jumping to the section', () => {
  assert.match(read('../life/js/life.js'), /target = el\.closest\('\.tp-sec'\) === el \? null : el;/);
});

test('section eyebrows on facility, tips and directions keep the home line height so titles line up', () => {
  assert.match(read('../life/css/life.css'), /\.life-page :is\(#pg-facility,#pg-tips,#pg-way\) \.sh \.sh-k\{line-height:1\.3\}/);
});
