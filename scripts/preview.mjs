import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// npm run preview: scripts/preview.py(GitHub Pages와 같은 404)를 이 PC의 Python 3으로 켠다. 인자는 그대로 넘긴다(--port · --bind).
// Windows는 python3 가 Microsoft Store 안내 프로그램이라 실행해도 Python이 아닌 PC가 많아, py 실행기 · python 을 먼저 찾는다(#429).

/** 시도할 Python 3 명령(앞에서부터): [명령, 앞에 붙일 인자] */
export function pythonCandidates(platform = process.platform) {
  return platform === 'win32'
    ? [['py', ['-3']], ['python', []], ['python3', []]]
    : [['python3', []], ['python', []]];
}

/** 실제로 Python 3이 도는 첫 명령. 없으면 null */
export function findPython(platform = process.platform, run = spawnSync) {
  for (const [command, args] of pythonCandidates(platform)) {
    const result = run(command, [...args, '-c', 'import sys; print(sys.version_info[0])'], { encoding: 'utf8', timeout: 15000 });
    if (!result.error && result.status === 0 && String(result.stdout).trim() === '3') return [command, args];
  }
  return null;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const python = findPython();
  if (!python) {
    console.error('Python 3을 찾지 못했어요. 정적 시안 미리보기(npm run preview)에만 필요해요: https://www.python.org/downloads/');
    process.exit(1);
  }
  const [command, args] = python;
  const server = spawn(command, [...args, fileURLToPath(new URL('preview.py', import.meta.url)), ...process.argv.slice(2)], { stdio: 'inherit' });
  server.on('exit', code => process.exit(code ?? 1));
}
