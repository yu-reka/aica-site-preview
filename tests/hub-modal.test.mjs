import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../stories/js/stories-render.js',import.meta.url),'utf8');
test('hub review detail keeps escaped content with a more-reviews footer and local close target',()=>{
  const context={REV:[{anchor:'r-p1',cohort:6,title:'<unsafe>',author:'선배',summary:'요약',body:['본문'],tags:[0]}],TAGS:['#태그'],cat:()=>({cls:'cat-life',c:'#000',bg:'#fff',dk:'#000',name:'생활'}),esc:x=>String(x??'').replaceAll('<','&lt;').replaceAll('>','&gt;'),coh:c=>c+'기',fld:()=>'',tagClasses:()=>'',photos:()=>''};
  const fn=vm.runInNewContext(source.slice(source.indexOf('  function reviewDialogs('),source.indexOf('  var hubDialogs='))+'\nreviewDialogs',context);
  const hub=fn(true),listing=fn(false);
  assert.ok(hub.includes('href="#hub-reviews"'));assert.ok(hub.includes('후기 더 보기 →'));
  assert.ok(hub.includes('href="reviews.html#tg-0"'));assert.ok(hub.includes('&lt;unsafe&gt;'));assert.ok(hub.includes('본문'));
  assert.ok(!hub.includes('sd-pair'));assert.ok(listing.includes('href="#p-rev"'));assert.ok(!listing.includes('후기 더 보기'));
});
