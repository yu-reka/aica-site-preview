import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {build} from '../scripts/build.mjs';

// 보안 감리 #49: 선배 이름은 V30 · V32(StoryContent.maskName)와 같게 성 한 글자만 남기고 나머지를 ○로. '익명'은 그대로.
// 실패 메시지에 이름을 넣지 않는다(위치만).
const masked=name=>name==='익명'||/^[^\s○]○+$/u.test(name);
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
// 전광판 한 줄 앞머리 '[7기] 김○○ &gt;'에서 이름만
const tickerNames=html=>[...html.matchAll(/<span class="tk-p">(?:\[\d+기\] )?([^<]*?) &gt;<\/span>/g)].map(match=>match[1]);

test('home ticker fallback in page source shows only masked names',()=>{
  const quotes=JSON.parse(read('content/home/quotes.json'));
  assert.ok(quotes.length>0);
  for(const quote of quotes)assert.ok(masked(quote.author),`content/home/quotes.json ${quote.id}: 이름이 가려지지 않음`);
  for(const [label,html] of [['build()',build().get('home/index.html')],['home/index.html',read('home/index.html')]]){
    const names=tickerNames(html);
    // 두 번째 목록은 끊김 없이 흐르게 하는 복사본(aria-hidden)이라 같은 줄이 두 번 나온다
    assert.equal(names.length,quotes.length*2,label);
    names.forEach((name,index)=>assert.ok(masked(name),`${label} 전광판 ${index+1}번째 줄: 이름이 가려지지 않음`));
  }
});

test('stories fallback copy keeps every review and interview author masked',()=>{
  const context={window:{}};
  vm.runInNewContext(read('stories/js/stories-data.js'),context);
  const data=context.window.STORIES_DATA;
  let count=0;
  for(const kind of ['reviews','interviews']){
    for(const item of data[kind]){
      count++;
      assert.ok(masked(item.author),`stories/js/stories-data.js ${kind} id ${item.id}: 이름이 가려지지 않음`);
    }
  }
  assert.ok(count>0);
});
