import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import vm from 'node:vm';
import {previewData, previewFiles, checkPreviewData, circleDesignName} from '../scripts/preview-data.mjs';

test('public fixtures restore approved design content with masked names and existing media', () => {
  const {stories, faq} = previewData();
  assert.equal(stories.previewSample, true);
  assert.equal(faq.previewSample, true);
  for (const [kind, prefix] of Object.entries({reviews:'r-p', interviews:'iv-p', projects:'pj-p', cohorts:'st-'})) {
    const records = stories[kind];
    assert.ok(records.length > 1);
    assert.equal(new Set(records.map(item => item.anchor)).size, records.length);
    for (const item of records) {
      assert.equal(item.anchor, prefix + item.id);
      assert.match(item.title, /^\[시안\]/);
      assert.ok(item.sourceId);
      if (item.headline) assert.match(item.headline, /^\[시안\]/);
      if (item.author) assert.match(item.author, /^[가-힣]○{2,3}$/);
      for (const img of [item.img, ...(item.photos || [])].filter(Boolean)) assert.match(img.src, /^assets\/[A-Za-z0-9_-]+\.(?:webp|png|jpe?g)$/);
    }
  }
  for (const item of faq.items) {assert.match(item.question, /^\[시안\]/);}
  assert.equal(stories.previewDesign, true);
  assert.equal(faq.previewDesign, true);
  assert.match(stories.notice, /가상 콘텐츠/);
  assert.equal(JSON.stringify({stories, faq}).includes('/uploads/'), false);
  for (const record of stories.cohorts.filter(item => item.video)) {
    const url = new URL(record.video.url);
    assert.equal(url.origin, 'https://www.youtube.com');
    assert.match(url.searchParams.get('v'), /^[A-Za-z0-9_-]{11}$/);
  }
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
      const changed = source.replace('더미', marker);
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
    assert.match(readFileSync(new URL('stories/' + file, root), 'utf8'), /src="js\/stories-data\.js\?v=design-20261029-hub-honors"/);
  }
  assert.match(readFileSync(new URL('check/index.html', root), 'utf8'), /src="js\/faq-data\.js\?v=design-20261022"/);
  assert.match(readFileSync(new URL('home/index.html', root), 'utf8'), /src="js\/ticker-render\.js\?v=design-20261029-hub-honors"/);
  assert.match(readFileSync(new URL('home/js/ticker-render.js', root), 'utf8'), /stories-data\.js\?v=design-20261029-hub-honors/);
});


test('design fixtures come from public source collections with distinct content, media and complete detail copy', () => {
  const {stories, faq} = previewData();
  for (const kind of ['reviews', 'interviews', 'projects', 'cohorts']) {
    const source = JSON.parse(readFileSync(new URL('../content/stories/' + kind + '.json', import.meta.url), 'utf8'));
    assert.equal(stories[kind].length, source.length);
    for (let i = 0; i < source.length; i++) {
      assert.equal(stories[kind][i].sourceId, source[i].id);
      assert.equal(stories[kind][i].title, '[시안] ' + (source[i].name || source[i].title));
    }
  }
  assert.equal(stories.interviews[0].qa.length, 6);
  assert.equal(stories.interviews.filter(item => item.honors).length, 1);
  assert.equal(stories.interviews[0].honors, true);
  assert.ok(stories.projects.every(item => item.art.includes('<svg') && item.sections.length === 3));
  assert.ok(stories.cohorts.some(item => item.photos.length > 1));
  assert.equal(faq.items.length, JSON.parse(readFileSync(new URL('../content/check/faq.json', import.meta.url), 'utf8')).length);
});

test('circle masks change only the current dummy name and leave footnotes, another name and anonymous text intact', () => {
  for (const [author, expected] of [['김ㅇㅇ','김○○'], ['김**','김○○'], ['백***','백○○○'], ['김OO','김○○']]) {
    const result = circleDesignName({author, body: [author + '님은 어떤가요?', '(*수업 각주) · 이ㅇㅇ님 · 익명'], qa: [{q: author + ' 님에게 묻습니다.'}]});
    assert.equal(result.author, expected);
    assert.equal(result.body[0], expected + '님은 어떤가요?');
    assert.equal(result.qa[0].q, expected + ' 님에게 묻습니다.');
    assert.equal(result.body[1], '(*수업 각주) · 이ㅇㅇ님 · 익명');
  }
  assert.deepEqual(circleDesignName({author:'익명', body:['(*수업 각주)']}), {author:'익명', body:['(*수업 각주)']});
});


test('dummy generation rejects an unmasked author without exposing the supplied name in errors', () => {
  for (const author of ['홍길동', 'PRIVATE_RECORD_SENTINEL', '', undefined]) {
    assert.throws(() => circleDesignName({author, body: []}), error => error.message.includes('가림 기호') && (!author || !error.message.includes(author)));
  }
});


test('public cohort metadata comes from the approved design fixture and project course filters have values', () => {
  const {stories} = previewData();
  const source = JSON.parse(readFileSync(new URL('../content/preview/cohorts.json', import.meta.url), 'utf8'));
  assert.deepEqual(stories.cohortInfos, source.map(({cohort, account, tag, tracks, label, bio, rows}) => ({cohort, account, tag, tracks, label, bio, rows})));
  assert.deepEqual(stories.cohortInfos.map(info => info.cohort), ['7', '6', '3-5']);
  assert.ok(stories.projects.every(item => item.course && item.course === (item.subject || item.type)));
});


test('project preview thumbnails use approved public illustrations and existing design words only', () => {
  const {stories} = previewData();
  const source = JSON.parse(readFileSync(new URL('../content/stories/projects.json', import.meta.url), 'utf8'));
  assert.equal(new Set(stories.projects.map(item => item.thumb.src)).size, 5);
  for (let i = 0; i < stories.projects.length; i++) {
    const thumb = stories.projects[i].thumb;
    assert.match(thumb.src, /^assets\/project-thumbs\/project-thumb-0[1-5]\.webp$/);
    assert.ok(readFileSync(new URL('../stories/' + thumb.src, import.meta.url)).length > 0);
    assert.ok(thumb.em && source[i].title.includes(thumb.em));
  }
});


test('project service introduction uses approved public design copy and keeps one empty case', () => {
  const {stories} = previewData();
  const source = JSON.parse(readFileSync(new URL('../content/stories/projects.json', import.meta.url), 'utf8'));
  for (let i = 0; i < source.length; i++) {
    assert.equal(stories.projects[i].serviceIntro, i < source.length - 1 ? source[i].detailSummary : '');
  }
});
