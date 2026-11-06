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
