import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { build, loadContent } from '../scripts/build.mjs';
import { springArtifacts } from '../scripts/export-spring.mjs';

const uiSource = readFileSync(new URL('../common/js/ui.js', import.meta.url), 'utf8');

test('all shared-runtime consumers load it first, including early cohort initialization and Spring pages', () => {
  const pages = [...build(), ...springArtifacts()];
  for (const [path, html] of pages) {
    if (!path.endsWith('.html') || !html.includes('common/js/site.js')) continue;
    const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m => m[1].split('?')[0]);
    const ui = scripts.findIndex(s => s.endsWith('/common/js/ui.js'));
    assert.ok(ui >= 0, path);
    assert.equal(scripts.filter(s => s.endsWith('/common/js/ui.js')).length, 1, path);
    for (const name of ['site.js', 'cohort-v3.js', 'stories.js', 'stories-m.js', 'life-m.js', 'about-m.js']) {
      const consumer = scripts.findIndex(s => s.endsWith('/' + name));
      if (consumer >= 0) assert.ok(ui < consumer, path + ': ' + name);
    }
  }
});

test('dialog isolation restores pre-existing inert state when switching a nested scope', () => {
  const body = { children: [] };
  const node = (parent, inert = false) => { const n = { parentElement: parent, children: [], tagName: 'DIV', inert }; parent.children.push(n); return n; };
  const page = node(body), blocked = node(body, true), modal = node(body), zoom = node(body);
  const context = vm.createContext({ document: { body } });
  vm.runInContext(uiSource, context);
  const scope = context.SiteUI.createDialogScope();
  scope.activate(modal);
  assert.equal(page.inert, true);
  assert.equal(modal.inert, false);
  scope.activate(zoom);
  assert.equal(modal.inert, true);
  assert.equal(zoom.inert, false);
  scope.release();
  assert.equal(page.inert, false);
  assert.equal(blocked.inert, true);
  assert.equal(modal.inert, false);
});

test('the unified review detail preserves every tag with escaped content in static and Spring output', () => {
  const html = build().get('stories/reviews.html');
  for (const record of loadContent().stories.reviews.filter(r => r.tags.length > 1)) {
    const start = html.indexOf('id="' + record.id + '"');
    const next = html.indexOf('<div class="ov', start + 1);
    const detail = html.slice(start, next < 0 ? undefined : next);
    for (const tag of record.tags) assert.ok(detail.includes('href="' + tag.href + '"'), record.id);
  }
  const spring = springArtifacts().get('templates/public-site/review-fragments.html');
  assert.ok(spring.includes('th:each="tag : ${r.tags}"'));
  assert.ok(!spring.includes('th:utext'));
});

test('semantic small-text colors meet AA on all inspected surfaces, including previous-cohort gray', () => {
  const tokens = readFileSync(new URL('../common/css/tokens.css', import.meta.url), 'utf8');
  const color = name => new RegExp('--' + name + ':\\s*(#[A-Fa-f0-9]{6})').exec(tokens)[1];
  const luminance = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((total, v, i) => total + v * [.2126, .7152, .0722][i], 0);
  const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
  for (const surface of ['#FFFFFF', '#F7F8F5', '#EEEFF2']) assert.ok(ratio(color('text-secondary'), surface) >= 4.5, surface);
  assert.ok(ratio(color('text-on-soft'), color('primary-soft')) >= 4.5);
  assert.ok(ratio('#FFFFFF', color('primary-deep')) >= 4.5);
});
