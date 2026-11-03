import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from './support/runtime.mjs';
const source=readFileSync(new URL('../home/js/ticker-render.js',import.meta.url),'utf8');
function start(){
  const scripts=[],list={},track={style:{}},ticker={hidden:false,querySelectorAll:()=>[list],querySelector:()=>track};
  const document={querySelector:()=>ticker,createElement:()=>({}),head:{appendChild:script=>scripts.push(script)}};
  const window={};runInNewContext(source,{window,document});return {scripts,list,ticker,window};
}
test('ticker API failure requests its snapshot synchronously and escapes the resulting text',()=>{
  const ui=start();assert.equal(ui.scripts.length,1);assert.equal(ui.scripts[0].src,'../api/public/stories.js');
  ui.scripts[0].onerror();assert.equal(ui.scripts.length,2);
  assert.match(ui.scripts[1].src,/stories-data\.js\?v=/);
  ui.window.STORIES_DATA={reviews:[{author:'<Alice>',cohort:3,ticker:'"Hello" & goodbye'}]};
  ui.scripts[1].onload();assert.match(ui.list.innerHTML,/&lt;Alice&gt;/);assert.match(ui.list.innerHTML,/&quot;Hello&quot; &amp; goodbye/);
});
test('ticker success avoids the fallback and an empty API payload still falls back once',()=>{
  const ui=start();ui.window.STORIES_DATA={reviews:[{author:'A',ticker:'Good.'}]};ui.scripts[0].onload();assert.equal(ui.scripts.length,1);
  const empty=start();empty.scripts[0].onload();assert.equal(empty.scripts.length,2);empty.scripts[1].onerror();assert.equal(empty.ticker.hidden,true);assert.equal(empty.scripts.length,2);
});
