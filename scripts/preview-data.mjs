// Public design fixtures only. Read approved content/ and components, never a DB or private snapshot.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export {circleDesignName} from './preview-design-data.mjs';
export {designPreviewData as previewData} from './preview-design-data.mjs';
import {designPreviewData} from './preview-design-data.mjs';

export function previewFiles() {
  const {stories, faq} = designPreviewData();
  const source = (name, data) => '// 공개 프리뷰 전용 디자인 더미. content/ 원본에서 생성하며 실제 DB 사본을 복사하지 않습니다.\n'
    + `window.${name} = ${JSON.stringify(data, null, 2)};\n`;
  return new Map([['stories/js/stories-data.js', source('STORIES_DATA', stories)], ['check/js/faq-data.js', source('FAQ_DATA', faq)]]);
}
export function checkPreviewData(directory) {
  for (const [path, expected] of previewFiles()) {
    if (readFileSync(resolve(directory, path), 'utf8') !== expected) {
      // Do not echo private content into logs when this guard detects a copied snapshot.
      throw new Error(`${path}: 공개 샘플과 다릅니다. 실제 DB 사본을 공개하지 마세요.`);
    }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--write') {
    const origin = execFileSync('git', ['remote', 'get-url', 'origin'], {cwd: root, encoding: 'utf8'}).trim();
    if (!/^(https:\/\/github\.com\/|git@github\.com:)yu-reka\/aica-site-preview(?:\.git)?$/.test(origin)) {
      throw new Error('샘플 생성은 공개 aica-site-preview checkout에서만 가능합니다. 비공개 DB 사본은 보존하세요.');
    }
    for (const [path, source] of previewFiles()) writeFileSync(resolve(root, path), source);
  } else if (process.argv[2] !== '--check') {
    throw new Error('사용법: node scripts/preview-data.mjs --write|--check');
  }
  checkPreviewData(root);
  console.log('공개 이야기·FAQ 샘플 2개 일치 확인');
}
