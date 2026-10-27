// Adapt only the existing, approved public design content. No DB/snapshot input.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, root } from './build.mjs';
import { createRenderer } from './template.mjs';

export const DESIGN_NOTE = '디자인 검토용 가상 콘텐츠입니다. 실제 선배의 경험이나 운영 DB 글이 아닙니다.';
const title = value => `[시안] ${value}`;
const text = node => typeof node === 'string' ? node : (node.children || []).map(text).join('');

// Change only this record's already-masked name; preserve footnotes and other names.
export function circleDesignName(record) {
  const match = /^([가-힣])([*ㅇO○]{2,3})$/.exec(record.author || '');
  if (!match) {
    if (record.author === '익명') return record;
    throw new Error('공개 디자인 더미 작성자는 성과 가림 기호 또는 익명만 사용할 수 있습니다.');
  }
  const masked = match[1] + '○'.repeat(match[2].length);
  const ownName = new RegExp(match[1] + '[*ㅇO○]{' + match[2].length + '}(?![*ㅇO○])', 'g');
  function visit(value) {
    if (typeof value === 'string') return value.replace(ownName, masked);
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, visit(entry)]));
    return value;
  }
  const result = visit(record);
  result.author = masked;
  return result;
}

export function designPreviewData() {
  const content = loadContent();
  const render = createRenderer(join(root, 'src/components'));
  const art = record => {
    const component = readFileSync(join(root, 'src/components', record.view.card.template + '.html'), 'utf8');
    const svg = render(component, record).match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
    return svg || '';
  };
  const image = (src, alt = '') => {
    if (!src) return undefined;
    if (!/^assets\/[A-Za-z0-9_-]+\.(?:webp|png|jpe?g)$/.test(src)) throw new Error('디자인 더미 사진은 기존 공개 assets 경로만 사용할 수 있습니다.');
    return {src, alt};
  };
  const photos = record => (record.photos || []).map(photo => image(photo.src, photo.alt));
  const meta = (record, base, prefix, index) => ({id: base + index + 1, anchor: prefix + (base + index + 1), sourceId: record.id});
  const cats = {'생활': 'life', '수업': 'class', '프로젝트': 'proj', '취업 성공': 'job', '진로 고민': 'path'};
  const stories = {
    previewSample: true, previewDesign: true, notice: DESIGN_NOTE,
    cohortInfos: content.preview.cohorts.map(({cohort, account, tag, tracks, label, bio, rows}) => ({cohort, account, tag, tracks, label, bio, rows})),
    reviews: content.stories.reviews.map((source, index) => {
      const record = circleDesignName(source);
      return {...meta(record, 900000, 'r-p', index), cat: cats[record.category], cohort: record.cohort,
        author: record.author, title: title(record.title), summary: record.summary, track: record.track,
        body: record.bodyRichText.filter(node => typeof node === 'object').map(text),
        tags: record.tags.map(tag => Number(tag.href.slice(4))), ticker: title(record.quote || record.summary)};
    }),
    interviews: content.stories.interviews.map((source, index) => {
      const record = circleDesignName(source);
      return {...meta(record, 910000, 'iv-p', index), cohort: record.cohort, author: record.author,
        title: title(record.title), track: record.track, summary: record.summary,
        img: image(record.thumbnail, record.thumbnailAlt), imgLarge: image(record.heroImage, record.heroAlt), art: art(record),
        photos: photos(record),
        ...(record.youtubeId ? {video: {yt: record.youtubeId, dur: record.duration || ''}} : {}),
        qa: (record.questions || []).map(question => ({q: question.question, a: question.answer, toc: question.navLabel}))};
    }),
    projects: content.stories.projects.map((record, index) => ({...meta(record, 920000, 'pj-p', index),
      cohort: record.cohort, term: record.cohortClass || record.duration, subject: record.subject, course: record.subject || record.type, type: record.type,
      title: title(record.name), headline: title(record.title), summary: record.detailSummary, cardSummary: record.summary,
      serviceIntro: index < content.stories.projects.length - 1 ? record.detailSummary : '',
      team: record.team, tags: record.tags, art: art(record),
      // Public illustrations and existing design words only; never import the DB-selected thumbnail.
      thumb: {src: `assets/project-thumbs/project-thumb-${String(index % 5 + 1).padStart(2, '0')}.webp`,
        em: String(record.title).split(/\s+/).slice(-2).join(' ')},
      sections: [record.section1, record.section2, record.section3].map((p, i) => ({h: ['문제 정의', '접근 방법', '결과와 다음 단계'][i], p}))})),
    cohorts: content.stories.cohorts.map((record, index) => ({...meta(record, 930000, 'st-', index),
      cohort: parseInt(record.cohort, 10), title: title(record.title), date: record.date, body: [record.summary],
      img: image(record.thumbnail, record.thumbnailAlt), art: art(record), photos: photos(record),
      ...(record.youtubeUrl ? {video: {url: record.youtubeUrl, dur: record.duration || ''}} : {})}))
  };
  const faq = {previewSample: true, previewDesign: true, notice: DESIGN_NOTE, items: content.check.faq.map(record => ({
    cat: record.category, question: title(record.question), answer: String(record.answerHtml)
  }))};
  return {stories, faq};
}
