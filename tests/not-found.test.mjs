import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {build} from '../scripts/build.mjs';
import {springArtifacts} from '../scripts/export-spring.mjs';

test('404 document is generated and exported to the Spring default error path', () => {
  const page = build().get('404.html');
  assert.match(page, /찾을 수 없어요/);
  assert.match(page, /name="robots" content="noindex,nofollow"/);
  assert.match(page, /href="home\/index.html"/);
  assert.match(page, /href="about\/index.html"/);
  assert.equal(springArtifacts().get('templates/error/404.html'), page);
  assert.equal(readFileSync(new URL('../404.html', import.meta.url), 'utf8'), page);
});

test('preview serves custom 404 with a real error status at root and project subpaths', async t => {
  const server = spawn('python3', ['-u', 'scripts/preview.py', '--port', '0'], {
    cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => server.kill());
  const [chunk] = await once(server.stdout, 'data');
  const base = /http:\/\/127\.0\.0\.1:(\d+)/.exec(String(chunk))?.[0];
  assert.ok(base);
  for (const prefix of ['', '/aica-site-preview']) {
    const response = await fetch(base + prefix + '/missing/nested/page.html?x=1');
    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /id="error-title"/);
    const head = await fetch(base + prefix + '/missing.html', {method: 'HEAD'});
    assert.equal(head.status, 404);
    assert.equal(await head.text(), '');
    assert.equal((await fetch(base + prefix + '/home/index.html')).status, 200);
    assert.equal((await fetch(base + prefix + '/common/css/tokens.css')).status, 200);
  }
});
