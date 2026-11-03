import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../common/js/ui.js',import.meta.url),'utf8');
const start=(document={},matchMedia=()=>({matches:false}))=>{
  const context={document,matchMedia};vm.runInNewContext(source,context);return context.SiteUI;
};
test('text and attribute escaping preserve all existing value and quote contracts',()=>{
  const ui=start();
  for(const input of [null,undefined])assert.equal(ui.escapeText(input),'');
  assert.equal(ui.escapeAttribute(null),'null');assert.equal(ui.escapeAttribute(undefined),'undefined');
  assert.equal(ui.escapeText(0),'0');assert.equal(ui.escapeAttribute(false),'false');
  assert.equal(ui.escapeText(`<&"'>`),`&lt;&amp;&quot;'&gt;`);
  assert.equal(ui.escapeAttribute(`<&"'>`),'&lt;&amp;&quot;&#39;&gt;');
  assert.equal(ui.escapeAttribute('이미 &amp; 인 값'),'이미 &amp;amp; 인 값');
});
test('query scopes preserve explicit parent, array output and nullable legacy roots',()=>{
  const node={id:1},document={querySelector:s=>'document:'+s,querySelectorAll:()=>[node]};
  const parent={querySelector:s=>'parent:'+s,querySelectorAll:()=>[node,node]};
  const ui=start(document),queries=ui.selectors(parent);
  assert.equal(queries.$('x'),'parent:x');assert.equal(queries.$('x',document),'document:x');
  assert.equal(ui.selectors().$('x'),'document:x');assert.ok(Array.isArray(queries.$$('x')));
  assert.equal(queries.$$('x').length,2);assert.throws(()=>queries.$('x',null),{name:'TypeError'});
  assert.equal(ui.selectors(parent,true).$('x',null),'parent:x');
});
test('script insertion keeps caller callbacks, exact URLs, ordering and repeat attempts',()=>{
  const scripts=[],document={createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};
  const ui=start(document);let loaded=0,failed=0;
  const first=ui.loadScript('file.js?v=kept',{async:false,onload:()=>loaded++,onerror:()=>failed++});
  assert.equal(first.src,'file.js?v=kept');assert.equal(first.async,false);
  assert.equal(loaded,0);assert.equal(failed,0);first.onerror();assert.equal(failed,1);
  const second=ui.loadScript('file.js?v=kept',{onload:()=>loaded++});
  assert.equal(scripts.length,2);assert.notEqual(first,second);assert.equal(second.async,undefined);
  second.onload();assert.equal(loaded,1);
});
test('motion queries remain live objects and each caller owns its listener',()=>{
  const requests=[],ui=start({},query=>{const mql={matches:false,addEventListener(type,fn){this.notify=fn;}};requests.push({query,mql});return mql;});
  const first=ui.motion(),second=ui.motion();assert.notEqual(first,second);
  first.addEventListener('change',event=>{first.matches=event.matches;});first.notify({matches:true});
  assert.equal(first.matches,true);assert.equal(second.matches,false);
  assert.ok(requests.every(r=>r.query==='(prefers-reduced-motion: reduce)'));
});

test('shared hash decoding keeps Unicode and malformed input behavior',()=>{
  const ui=start();assert.equal(ui.decodeHash('%ED%95%9C'), '한');
  for(const hash of ['%', '%E0%A4%A', '%ZZ'])assert.equal(ui.decodeHash(hash),'');
  assert.equal(ui.decodeHash(''), '');assert.equal(ui.decodeHash('iv-p1'),'iv-p1');
});
