import test from 'node:test';
import assert from 'node:assert/strict';
import {connectBackoffice} from '../scripts/backoffice-site.mjs';
import {build} from '../scripts/build.mjs';

test('all page CSS and JavaScript tags have cache tokens, including dynamically ordered story consumers',()=>{
  for(const [path,html] of connectBackoffice(build())){
    for(const [,url] of html.matchAll(/(?:src|href)="([^"<>]+\.(?:css|js)(?:\?[^"<>]*)?)"/g)){
      if(url.includes('/api/public/'))continue;
      assert.match(url,/\?v=[a-zA-Z0-9-]+/,path+': '+url);
    }
    const scripts=/data-scripts='([^']+)'/.exec(html);
    if(scripts)for(const url of JSON.parse(scripts[1].replaceAll('&amp;','&')))assert.match(url,/\?v=/,path+': '+url);
  }
});
test('home and eligibility pages link directly to the target story collection',()=>{
  const pages=build();
  for(const path of ['home/index.html','check/index.html']){
    assert.doesNotMatch(pages.get(path),/stories\/index.html#(?:reviews|projects)/);
  }
});

test('every story page reserves its loading view before deferred scripts run',()=>{
  const pages=connectBackoffice(build());
  for(const page of ['index','interviews','reviews','projects','cohorts']){
    const path='stories/'+page+'.html',html=pages.get(path);
    assert.match(html,/<main[^>]*data-story-loading/);
    assert.doesNotMatch(html,/<main[^>]*aria-busy/);
    assert.ok(html.includes('data-page="'+path+'"'));
  }
});

test('FAQ data is asynchronous while common navigation and the page remain ordinary deferred scripts',()=>{
  const html=connectBackoffice(build()).get('check/index.html');
  assert.match(html,/<script src="[^"<>]*faq-loader.js\?[^"<>]*" defer data-api="..\/api\/public\/faq"/);
  assert.doesNotMatch(html,/<script src="..\/api\/public\/faq.js"/);
  assert.match(html,/<script src="..\/common\/js\/site.js[^"<>]*" defer><\/script>/);
  assert.match(html,/<script src="js\/check.js[^"<>]*" defer><\/script>/);
});


test('story API loader runs in the head before defer navigation and never duplicates a preload fetch',()=>{
  for(const [path,html] of connectBackoffice(build())){
    if(!path.startsWith('stories/'))continue;
    const tags=[...html.matchAll(/<script[^>]*src="[^"<>]*stories-loader\.js[^>]*>/g)];assert.equal(tags.length,1,path);
    assert.doesNotMatch(tags[0][0],/\b(?:defer|async)\b/);assert.ok(tags[0].index<html.indexOf('</head>'));
    assert.doesNotMatch(html,/<link[^>]*as="fetch"/);
  }
});


test('all five pending pages put one accessible loading card after the real first heading without cloning a title',()=>{
  const rawPages=build(),pages=connectBackoffice(rawPages);
  for(const kind of ['index','interviews','reviews','projects','cohorts']){
    const raw=rawPages.get('stories/'+kind+'.html'),html=pages.get('stories/'+kind+'.html');
    assert.equal((raw.match(/data-story-loading-card/g)||[]).length,1,kind);
    assert.match(raw,/<section class="story-loading-shell" data-story-loading-shell hidden>/);
    const card=/<div class="story-state story-state--loading aica-state"[^>]*>[\s\S]*?<\/div>/.exec(html)?.[0];assert.ok(card,kind);
    assert.match(card,/role="status"/);assert.match(card,/story-state__icon/);assert.match(card,/<h3 class="story-state__title aica-state__title">이야기를 불러오고 있어요<\/h3>/);assert.match(card,/잠시만 기다려 주세요/);assert.match(card,/<button type="button" class="story-state__action aica-state__action" data-story-loading-retry>다시 시도<\/button>/);assert.doesNotMatch(card,/불러오지 못했습니다/);
    assert.equal((html.match(/data-story-list-state/g)||[]).length,1,kind);
    assert.equal((html.match(/data-story-loading-heading/g)||[]).length,1,kind);
    const first=/<div class="sh[^"<>]*" data-story-loading-heading>[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html);
    assert.ok(first,kind);assert.ok(first.index<html.indexOf('data-story-loading-card'),kind);
    const expected={index:'여덟 달을 먼저 지나온 선배들에게 물어봤어요',interviews:'배움을 성과로 이어간 선배들을 만나봐요',reviews:'먼저 겪어 본 선배들이 솔직하게 남겼어요',projects:'선배들은 여기서 이런 걸 만들었어요',cohorts:'입교식부터 수료식까지, 기수마다 이런 일이 있었어요'};
    assert.equal(first[1],expected[kind],kind);
    const shell=/<section class="story-loading-shell"[^>]*>[\s\S]*?<\/section>/.exec(html)?.[0];
    assert.ok(shell,kind);assert.doesNotMatch(shell,/<h2|class="sh|class="wrap/);
    if(kind==='index')assert.match(html,/<div class="hb-body hb-ivg" data-story-loading-content><section class="story-loading-shell"/);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,kind);
  }
});
