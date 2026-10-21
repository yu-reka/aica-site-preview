import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import vm from 'node:vm';
import {previewData, previewFiles, checkPreviewData} from '../scripts/preview-data.mjs';

test('public fixtures explicitly identify synthetic records and never reference uploads or external media', () => {
  const {stories, faq} = previewData();
  assert.equal(stories.previewSample, true);
  assert.equal(faq.previewSample, true);
  for (const [kind, prefix] of Object.entries({reviews:'r-p', interviews:'iv-p', projects:'pj-p', cohorts:'st-'})) {
    const records = stories[kind];
    assert.ok(records.length > 1);
    assert.equal(new Set(records.map(item => item.anchor)).size, records.length);
    for (const item of records) {
      assert.equal(item.anchor, prefix + item.id);
      assert.match(item.title, /^\[샘플\]/);
      if (item.author) assert.match(item.author, /^샘플 /);
      for (const img of [item.img, ...(item.photos || [])].filter(Boolean)) assert.match(img.src, /^\.\.\/assets\/preview\/sample-[12]\.svg$/);
    }
  }
  for (const item of faq.items) {assert.match(item.question, /^\[샘플\]/); assert.match(item.answer, /가상 예시/);}
  assert.doesNotMatch(JSON.stringify({stories, faq}), /https?:|\/uploads\/|@/);
  for (const source of previewFiles().values()) {
    const context = {window: {}};
    vm.runInNewContext(source, context);
    assert.equal(Object.values(context.window)[0].previewSample, true);
  }
});

test('public release guard rejects substituted DB text without logging it or modifying either snapshot', () => {
  const root = mkdtempSync(join(tmpdir(), 'aica-sample-guard-'));
  try {
    for (const [file, source] of previewFiles()) {mkdirSync(dirname(join(root, file)), {recursive:true}); writeFileSync(join(root, file), source);}
    assert.doesNotThrow(() => checkPreviewData(root));
    for (const [file, source] of previewFiles()) {
      const marker = 'PRIVATE_RECORD_SENTINEL';
      const changed = source.replace('샘플', marker);
      writeFileSync(join(root, file), changed);
      assert.throws(() => checkPreviewData(root), error => !error.message.includes(marker) && error.message.includes(file));
      assert.equal(readFileSync(join(root, file), 'utf8'), changed);
      writeFileSync(join(root, file), source);
    }
  } finally {rmSync(root, {recursive:true, force:true});}
});

// The first clean deployment must not reuse the old snapshot URL from a browser cache.
test('public HTML and home fallback request a new snapshot cache version', () => {
  const root = new URL('../', import.meta.url);
  for (const file of ['index.html','reviews.html','interviews.html','projects.html','cohorts.html']) {
    assert.match(readFileSync(new URL('stories/' + file, root), 'utf8'), /src="js\/stories-data\.js\?v=sample-20261021"/);
  }
  assert.match(readFileSync(new URL('check/index.html', root), 'utf8'), /src="js\/faq-data\.js\?v=sample-20261021"/);
  assert.match(readFileSync(new URL('home/index.html', root), 'utf8'), /src="js\/ticker-render\.js\?v=sample-20261021"/);
  assert.match(readFileSync(new URL('home/js/ticker-render.js', root), 'utf8'), /stories-data\.js\?v=sample-20261021/);
});
