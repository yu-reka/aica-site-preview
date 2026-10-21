// Public demo fixtures only. Never read a DB, a private snapshot, or copied article text.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NOTE = '화면 확인을 위해 만든 가상 예시입니다. 실제 수강생의 경험이나 운영 안내가 아닙니다.';
const image = n => ({src: `../assets/preview/sample-${n % 2 + 1}.svg`, alt: '샘플 화면용 추상 그림', w: 640, h: 400});
const rows = (count, make) => Array.from({length: count}, (_, i) => make(i + 1));
export function previewData() {
  const cats = ['life', 'class', 'proj', 'job', 'path'];
  const themes = ['생활', '수업', '프로젝트', '진로', '학습'];
  const types = ['AI 모델개발', 'AI 클라우드·인프라', 'AI 서비스 기획'];
  const stories = {
    previewSample: true,
    reviews: rows(18, n => ({id: 900000 + n, anchor: `r-p${900000 + n}`, cat: cats[(n - 1) % 5], cohort: 5 + n % 3,
      author: `샘플 수강생 ${String(n).padStart(2, '0')}`, title: `[샘플] ${themes[(n - 1) % 5]} 후기 ${n}`,
      summary: '후기 카드의 제목과 본문 배치를 확인하는 예시입니다.', track: types[n % 3], tags: [n % 7],
      body: [NOTE, '이 문단은 긴 글의 줄바꿈과 상세 화면을 확인하기 위한 샘플 문장입니다.']})),
    interviews: rows(4, n => ({id: 910000 + n, anchor: `iv-p${910000 + n}`, cohort: 5 + n % 3,
      author: `샘플 인터뷰이 ${n}`, title: `[샘플] 인터뷰 화면 ${n}`, track: types[n % 3], summary: NOTE,
      img: image(n), photos: [image(n), image(n + 1)], qa: [
        {q: '이 인터뷰는 실제 인물의 이야기인가요?', a: NOTE, toc: '샘플 안내'},
        {q: '어떤 화면을 확인할 수 있나요?', a: '질문과 답변, 사진 넘김, 공유 링크의 배치를 확인할 수 있습니다.', toc: '화면 확인'}]})),
    projects: rows(6, n => ({id: 920000 + n, anchor: `pj-p${920000 + n}`, cohort: 5 + n % 3, term: 5 + n % 3,
      title: `[샘플] 프로젝트 ${n}`, headline: '프로젝트 소개 화면 예시', summary: NOTE, team: `샘플 팀 ${n}`,
      type: types[n % 3], subject: types[n % 3], tags: [], img: image(n),
      sections: [{h: '샘플 소개', p: NOTE}, {h: '화면 구성', p: '소개와 결과 영역의 배치를 확인합니다.'},
        {h: '참고 사항', p: '실제 프로젝트 성과를 설명하는 자료가 아닙니다.'}]})),
    cohorts: rows(9, n => ({id: 930000 + n, anchor: `st-${930000 + n}`, cohort: 5 + n % 3,
      title: `[샘플] 기수 기록 ${n}`, date: `2026. ${String(n).padStart(2, '0')}. 01`,
      body: [NOTE, '사진과 설명이 함께 있는 게시물의 예시입니다.'], img: image(n), photos: [image(n), image(n + 1)]}))
  };
  const categories = ['준비사항', '수업', '생활', '지원금', '프로젝트'];
  const faq = {previewSample: true, items: rows(10, n => ({cat: categories[(n - 1) % 5],
    question: `[샘플] ${categories[(n - 1) % 5]} 질문 ${n}`,
    answer: `<p>${NOTE}</p><p>이 답변은 검색·분류·펼치기 동작 확인용입니다. 실제 모집 조건이나 지원 내용을 안내하지 않습니다.</p>`}))};
  return {stories, faq};
}
export function previewFiles() {
  const {stories, faq} = previewData();
  const source = (name, data) => '// 공개 프리뷰 전용 합성 샘플. scripts/preview-data.mjs로 생성하며 실제 DB 사본을 복사하지 않습니다.\n'
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
