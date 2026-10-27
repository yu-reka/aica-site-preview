import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../common/js/track.js', import.meta.url), 'utf8');
function load(page = 'https://site.test/stories/interviews.html#iv-p3', scriptUrl, fail = false) {
  const url = new URL(page), calls = [], listeners = {};
  const location = {protocol:url.protocol, pathname:url.pathname, hash:url.hash};
  const fetch = (url, options) => {
    calls.push({url, ...options, body:JSON.parse(options.body)});
    return fail ? Promise.reject(new Error('offline')) : Promise.resolve({ok:true});
  };
  const document = {currentScript:{src:scriptUrl || new URL('../common/js/track.js', page).href}, body:{dataset:{}}};
  const context = {document, location, URL, navigator:{userAgent:'Mozilla/5.0'}, fetch,
    localStorage:{getItem:()=> 'visitor-test-1234'},
    addEventListener:(name, listener) => {listeners[name] = listener;}};
  context.window = context;
  vm.runInNewContext(source, context);
  return {calls, location, listeners, document};
}

test('visit and story view use same-origin credentials so the server can exclude signed-in admins', () => {
  const {calls, location, listeners} = load();
  assert.deepEqual(calls.map(call => call.url), [
    'https://site.test/api/public/track/visit',
    'https://site.test/api/public/track/posts/interview/3/view'
  ]);
  for (const call of calls) {
    assert.equal(call.credentials, 'same-origin');
    assert.equal(call.method, 'POST');
    assert.equal(call.keepalive, true);
    assert.equal(call.cache, 'no-store');
    assert.equal(call.body.visitorKey, 'visitor-test-1234');
  }
  listeners.hashchange();
  assert.equal(calls.length, 2, 'opening the same story again does not resend a view');
  location.hash = '#pj-p5';
  listeners.hashchange();
  assert.equal(calls[2].url, 'https://site.test/api/public/track/posts/project/5/view');
  assert.equal(calls[2].credentials, 'same-origin');
});

test('Pages stays under its own project URL and cross-origin scripts cannot request credentials with include', () => {
  const page = 'https://yu-reka.github.io/aica-site-preview/stories/interviews.html#iv-p3';
  assert.equal(load(page).calls[0].url, 'https://yu-reka.github.io/aica-site-preview/api/public/track/visit');
  const external = load(page, 'https://assets.test/common/js/track.js').calls[0];
  assert.equal(external.url, 'https://assets.test/api/public/track/visit');
  assert.equal(external.credentials, 'same-origin');
});

test('admin pages and file previews remain untracked', () => {
  assert.equal(load('https://site.test/admin/posts/1/preview').calls.length, 0);
  assert.equal(load('file:///site/stories/interviews.html#iv-p3').calls.length, 0);
});

test('an unavailable API stays silent', async () => {
  assert.equal(load(undefined, undefined, true).calls.length, 2);
  await new Promise(resolve => setImmediate(resolve));
});
