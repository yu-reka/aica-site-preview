import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../check/js/check.js',import.meta.url),'utf8');
const init=source.slice(source.indexOf('  function initFAQ()'),source.indexOf('  // FAQ data never'));

test('an empty FAQ collection shows registration guidance before search and paging initialize',()=>{
  const classes=new Set(),state={hidden:true};
  const list={closest(selector){assert.equal(selector,'.faq');return{classList:{add:name=>classes.add(name)}};}};
  const fields={'#faqList':list,'#faqCollectionEmpty':state};
  // No search/paging controls or geometry are needed for an empty collection.
  vm.runInNewContext(init+'\ninitFAQ();',{main:{},$:selector=>fields[selector],$$:()=>[]});
  assert.equal(state.hidden,false);
  assert.equal(classes.has('is-empty'),true);
});
