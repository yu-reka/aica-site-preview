import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function start(){
  const listeners={},window={addEventListener(type,fn){listeners[type]=fn;},removeEventListener(){}};
  const document={getElementById(){return null;},baseURI:'https://example.test/aica-site-preview/stories/reviews.html',addEventListener(){}};
  vm.runInNewContext(readFileSync(new URL('../common/js/public-content.js',import.meta.url),'utf8'),{window,document,URL,Set});
  return {window,listeners,document};
}
test('public URLs preserve relative Pages paths and reject executable protocols/control obfuscation',()=>{
  const safe=start().window.AicaPublicContent;
  for(const value of ['javascript:alert(1)','java\nscript:alert(1)','data:text/html,x','vbscript:msgbox(1)','blob:https://example.test/1'])assert.equal(safe.url(value,false),'');
  for(const value of ['../assets/photo.png','https://example.org/a','#q-1','/uploads/a.png'])assert.equal(safe.url(value,true),value);
  assert.equal(safe.url('mailto:hello@example.org',false),'mailto:hello@example.org');
  assert.equal(safe.url('mailto:hello@example.org',true),'');
});
test('only the stories API resource failure marks content availability',()=>{
  const {window,listeners}=start();
  for(const src of ['https://example.test/aica-site-preview/stories/js/stories-data.js','https://example.test/aica-site-preview/api/public/faq.js'])listeners.error({target:{tagName:'SCRIPT',src}});
  assert.equal(window.AicaPublicContentStatus.storiesApiFailed,false);
  listeners.error({target:{tagName:'SCRIPT',src:'https://example.test/aica-site-preview/api/public/stories.js'}});
  assert.equal(window.AicaPublicContentStatus.storiesApiFailed,true);
});


test('owner-defined legacy IDs resolve only to existing migrated records, preserving exact and design anchors',()=>{
  const {window,document}=start(),targets=new Set(['iv-p1','iv-p14','pj-p1','pj-p42','q-1-1']);
  document.getElementById=id=>targets.has(id) ? {} : null;
  const alias=window.AicaPublicContent.legacyHash;
  for(const [old,next] of [['iv-p63','iv-p1'],['iv-p76','iv-p14'],['pj-p77','pj-p1'],['pj-p118','pj-p42'],['q-63-1','q-1-1']])assert.equal(alias('#'+old),'#'+next);
  for(const id of ['iv-1','pj-1','iv-p62','pj-p119','r-p1','iv-p64'])assert.equal(alias('#'+id),'#'+id);
  targets.add('iv-p63');assert.equal(alias('#iv-p63'),'#iv-p63');
});
