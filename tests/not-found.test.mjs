import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {build} from '../scripts/build.mjs';
import {findPython, pythonCandidates} from '../scripts/preview.mjs';
import {readText} from '../scripts/text.mjs';

test('404 document is generated with recovery links and noindex', () => {
  const page = build().get('404.html');
  assert.match(page, /찾을 수 없어요/);
  assert.match(page, /name="robots" content="noindex,nofollow"/);
  assert.match(page, /href="home\/index.html"/);
  assert.match(page, /href="about\/index.html"/);
  assert.equal(readText(new URL('../404.html', import.meta.url)), page);
});

test('preview looks for Python 3 with the launcher Windows actually has, and skips one that is not Python 3', () => {
  // Windows의 python3 는 Microsoft Store 안내 프로그램인 PC가 많다(실행하면 "Python"만 찍고 끝남)
  assert.deepEqual(pythonCandidates('win32').map(([command]) => command), ['py', 'python', 'python3']);
  for (const platform of ['darwin', 'linux']) assert.deepEqual(pythonCandidates(platform)[0], ['python3', []]);
  const answers = {py: {error: new Error('ENOENT')}, python: {status: 9009, stdout: ''}, python3: {status: 0, stdout: '3\n'}};
  const tried = [];
  const run = command => { tried.push(command); return answers[command]; };
  assert.deepEqual(findPython('win32', run), ['python3', []]);
  assert.deepEqual(tried, ['py', 'python', 'python3']);
  assert.equal(findPython('linux', () => ({status: 0, stdout: '2\n'})), null, 'Python 2 is not used');
});

test('preview serves custom 404 with a real error status at root and project subpaths', {timeout: 30000}, async t => {
  const python = findPython();
  if (!python) {
    // Python은 npm run preview 에만 필요하다(docs/setup.md 설치 목록에 없음). CI(Linux)에는 python3 가 있어 여기서 돈다
    t.skip('Python 3 없음');
    return;
  }
  const [command, args] = python;
  const server = spawn(command, [...args, '-u', 'scripts/preview.py', '--port', '0'], {
    cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => server.kill());
  // 서버가 주소를 찍기 전에 끝나면 기다리지 않고 실패한다(예전에는 여기서 끝없이 멈춤)
  const [chunk] = await Promise.race([once(server.stdout, 'data'),
    once(server, 'exit').then(([code]) => { throw new Error(`preview.py ended before it started (exit ${code})`); })]);
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
