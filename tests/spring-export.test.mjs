import test from 'node:test';
import assert from 'node:assert/strict';
import { springArtifacts } from '../scripts/export-spring.mjs';
import { loadContent } from '../scripts/build.mjs';

test('Spring review export has no static records and uses escaped live fragments', () => {
  const artifacts = springArtifacts();
  const reviews = artifacts.get('templates/public-site/reviews.html');
  const hub = artifacts.get('templates/public-site/stories.html');
  const fragments = artifacts.get('templates/public-site/review-fragments.html');
  for (const record of loadContent().stories.reviews) {
    assert.ok(!reviews.includes(record.title));
    assert.ok(!hub.includes(record.title));
  }
  assert.equal((reviews.match(/th:each="r : \$\{reviews\}"/g) || []).length, 3);
  assert.ok(!reviews.includes('name="pgn"'));
  assert.ok(!fragments.includes('th:utext'));
  assert.ok(!fragments.includes('{{'));
  assert.ok(fragments.includes('th:text="${paragraph}"'));
  assert.ok(reviews.includes('src="/stories/js/reviews-live.js"'));
  assert.ok(reviews.includes('src="/stories/js/stories-m-reviews.js?v=1016cleanup"'));
  assert.ok(reviews.indexOf('stories-m-reviews.js') < reviews.indexOf('stories-m.js?'));
  assert.ok(reviews.includes('href="/common/css/masthead.css?v=1016cleanup"'));
});

test('opt-in review seed preserves anchors, content order and every body paragraph', () => {
  const seed = JSON.parse(springArtifacts().get('review-seed.json'));
  const source = loadContent().stories.reviews;
  assert.deepEqual(seed.map(r => r.anchor), source.map(r => r.id));
  assert.equal(new Set(seed.map(r => r.anchor)).size, seed.length);
  source.forEach((r,index) => {
    assert.equal(seed[index].title, r.title);
    assert.equal(seed[index].order, index);
    assert.equal(seed[index].story.body.length, r.bodyRichText.filter(p => typeof p === 'object').length);
    assert.deepEqual(seed[index].story.tags, r.tags.map(t => Number(t.href.slice(4))));
  });
});

test('every story kind exports only live slots, canonical links and build-owned artwork', () => {
  const artifacts = springArtifacts();
  const seed = JSON.parse(artifacts.get('story-seed.json'));
  const source=loadContent();
  assert.equal(seed.length,86);
  for (const [kind,key,count] of [['interview','interviews',7],['project','projects',6],['cohort','cohorts',17]]) {
    const page=artifacts.get('templates/public-site/'+key+'.html');
    assert.equal(seed.filter(s=>s.kind===kind).length,count);
    assert.deepEqual(seed.filter(s=>s.kind===kind).map(s=>s.anchor),source.stories[key].map(s=>s.id));
    for (const record of source.stories[key]) assert.ok(!page.includes(record.title), key+': static title remained');
    assert.ok(page.includes('${'+key+'}'));
    assert.ok(!page.includes('{{'));
  }
  const fragments=artifacts.get('templates/public-site/story-fragments.html');
  // Every card variant, including the fallback, exposes the escaped public quote.
  assert.equal((fragments.match(/data-interview-quote=\$\{s.quote\}/g)||[]).length,source.stories.interviews.length);
  for (const [tag] of fragments.matchAll(/<a\b[^>]*>/g)) assert.ok((tag.match(/th:attr=/g)||[]).length<=1,'Thymeleaf attributes must be combined');
  assert.ok(!fragments.includes('th:utext'));
  assert.ok(fragments.includes('th:each="q, n : ${s.questions}"'));
  assert.ok(fragments.includes('th:each="section : ${s.sections}"'));
  assert.ok(fragments.includes('data-story-body'));
  assert.ok(!fragments.includes('{{'));
  const hub=artifacts.get('templates/public-site/stories.html');
  for (const list of ['hubInterviews','hubProjects','hubCohorts']) assert.ok(hub.includes('${'+list+'}'));
});

test('hub selection retains the approved cohort slots without duplicate image aliases', () => {
  const records=JSON.parse(springArtifacts().get('story-seed.json'));
  assert.deepEqual(records.filter(s=>s.kind==='cohort' && s.story.hubRank != null)
    .sort((a,b)=>a.story.hubRank-b.story.hubRank).map(s=>s.anchor),
    ['cohort-story-5','cohort-story-7','cohort-story-12','cohort-story-14','cohort-story-16']);
  const fragments=springArtifacts().get('templates/public-site/story-fragments.html');
  assert.ok(!fragments.includes('${s.art}'));
  assert.ok(fragments.includes('hub-media(s,hero)'));
});

 test('all Spring detail pages retain shared published-DOM navigation assets', () => {
  const artifacts=springArtifacts();
  for(const name of ['reviews','interviews','projects']){
    const html=artifacts.get('templates/public-site/'+name+'.html');
    assert.ok(html.includes('/stories/js/detail-navigation.js?v=1020outsidegrid'));
    assert.ok(html.includes('/stories/css/detail-navigation.css?v=1020outsidegrid'));
  }
});


test('Spring projects retain shared filters and read escaped metadata from published cards only', () => {
  const artifacts=springArtifacts();
  const html=artifacts.get('templates/public-site/projects.html');
  assert.ok(html.includes('pj-filter-row'));
  assert.ok(html.includes('pj-subject-empty'));
  assert.ok(html.includes('/stories/js/projects-filter.js?v=1020integratedfilters'));
  assert.ok(!html.includes('data-cohort="7"'));
  assert.ok(!html.includes('data-subject="컴퓨터비전"'));
  assert.ok(!html.includes('pj-filter-empty'));
  const fragments=artifacts.get('templates/public-site/story-fragments.html');
  assert.ok(fragments.includes('data-cohort=${s.cohort},data-subject=${s.subject}'));
  assert.ok(fragments.includes('${#strings.isEmpty(s.subject) ? s.type : s.subject}'));
  const seed=JSON.parse(artifacts.get('story-seed.json')).filter(r=>r.kind==='project');
  assert.deepEqual(seed.map(r=>[r.story.cohort,r.story.subject]),loadContent().stories.projects.map(r=>[r.cohort,r.subject]));
  assert.ok(html.indexOf('stories-m.js')<html.indexOf('projects-filter.js'));
});


test('published project details show confirmed cohort and course with legacy fallbacks', () => {
  const fragments=springArtifacts().get('templates/public-site/story-fragments.html');
  assert.ok(fragments.includes("${s.cohort > 0 ? '기수' : '기간'}"));
  assert.ok(fragments.includes("${s.cohort > 0 ? s.cohort + '기' : s.duration}"));
  assert.ok(!fragments.includes('s.cohortClass'));
  for(const record of loadContent().stories.projects.filter(r=>['pj-3','pj-6'].includes(r.id)))
    assert.equal(record.cohortClass,record.cohort+'기');
});
