import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const details = readFileSync(new URL('../stories/js/story-details.js', import.meta.url), 'utf8');
const content = readFileSync(new URL('../common/js/public-content.js', import.meta.url), 'utf8');

test('story details mount on demand for preview, legacy, and direct question links', () => {
  const nodes = new Map(), mounted = [], listeners = {};
  const location = {hash:'', replace(hash) { this.hash = hash; }};
  const document = {
    getElementById: id => nodes.get(id),
    addEventListener: (name, listener) => { listeners[name] = listener; },
    dispatchEvent() {}
  };
  const ctx = {window:{addEventListener() {}}, document, location, Site:{decodeHash:decodeURIComponent},
    addEventListener: (name, listener) => { listeners[name] = listener; },
    CustomEvent: class {}, requestAnimationFrame: fn => fn()};
  vm.runInNewContext(content,ctx);
  const api = vm.runInNewContext(details + '\nStoryDetails',ctx);
  const host = {insertAdjacentHTML(position, anchor) {
    assert.equal(position,'afterend');
    const attrs = new Set();
    nodes.set(anchor,{attrs,setAttribute:name=>attrs.add(name),removeAttribute:name=>attrs.delete(name)});
    mounted.push(anchor);
  }};
  api.register('interview', [{anchor:'iv-p1',qa:[{}]},{anchor:'iv-pnew'}],host,'afterend',item=>item.anchor);
  api.sync();
  assert.deepEqual(mounted,[]);
  location.hash = '#iv-p63'; listeners.hashchange();
  assert.equal(location.hash,'#iv-p1');
  assert.deepEqual(mounted,['iv-p1']);
  assert.ok(nodes.get('iv-p1').attrs.has('data-story-active'));
  location.hash = '#q-iv-p1-1'; listeners.hashchange();
  assert.deepEqual(mounted,['iv-p1']);
  location.hash = '#q-iv-p1-9'; listeners.hashchange();
  assert.equal(nodes.get('iv-p1').attrs.size,0);
  location.hash = '#iv-pnew'; listeners.hashchange();
  assert.deepEqual(mounted,['iv-p1','iv-pnew']);
  assert.ok(nodes.get('iv-pnew').attrs.has('data-story-active'));
});

test('article requests coalesce, retain successful bodies, and let failures be retried', async () => {
  const article = {anchor:'r-p1',body:['본문']};
  const outcomes = [
    {ok:false,status:503},
    {ok:true,json:async () => ({type:'reviews',item:article})},
    {ok:false,status:404},
    {ok:true,json:async () => ({type:'projects',item:{anchor:'r-p3'}})},
  ];
  const calls = [];
  const api = vm.runInNewContext(details + '\nStoryDetails',{
    window:{},document:{addEventListener() {}},addEventListener() {},
    AbortController,setTimeout,clearTimeout,
    fetch:async (url,options) => {
      assert.equal(options.cache,'no-cache');
      assert.equal(options.credentials,'same-origin');
      calls.push(url);
      return outcomes.shift();
    },
  });
  const first = api.load('r-p1','reviews');
  assert.equal(api.load('r-p1','reviews'),first);
  await assert.rejects(first,/Story unavailable/);
  assert.deepEqual(await api.load('r-p1','reviews'),article);
  assert.deepEqual(await api.load('r-p1','reviews'),article);
  await assert.rejects(api.load('r-p2','reviews'),error=>error.missing === true);
  await assert.rejects(api.load('r-p3','reviews'),/Invalid story response/);
  assert.deepEqual(calls,['r-p1','r-p1','r-p2','r-p3'].map(anchor=>'../api/public/stories/posts/'+anchor));
});
