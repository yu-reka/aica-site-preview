import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, root, loadContent } from './build.mjs';
import { addStoryArtifacts } from './spring-stories.mjs';

// Keep the accepted HTML/components as the single design source for both previews and Spring.
export function springArtifacts() {
  const output = new Map();
  const generated = build();
  let page = generated.get('stories/reviews.html');
  page = page.replace('<html ', '<html xmlns:th="http://www.thymeleaf.org" data-review-source="spring" ')
    .replace(/\s*<input[^>]+name="pgn"[^>]*>/g, '')
    .replace(/<div class="idgrid">[\s\S]*?<\/div>\s*<div class="rvlist">[\s\S]*?<\/div>\s*<div class="pager">[\s\S]*?<\/div>/, `<div class="idgrid"><th:block th:each="r : \${reviews}"><th:block th:replace="~{public-site/review-fragments :: card(\${r})}"></th:block></th:block></div>
    <div class="rvlist"><th:block th:each="r : \${reviews}"><th:block th:replace="~{public-site/review-fragments :: row(\${r})}"></th:block></th:block></div>
    <nav class="pager cpager" aria-label="후기 페이지" data-review-pager></nav>`)
    .replace(/<div class="ov [\s\S]*?(?=<\/main>)/, '<th:block th:each="r : ${reviews}"><th:block th:replace="~{public-site/review-fragments :: detail(${r})}"></th:block></th:block>\n')
    .replace('<body>', '<body th:attr="data-preview-anchor=${previewAnchor},data-public-content-unavailable=${publicContentUnavailable == true}">')
    .replace('</head>', '<link rel="stylesheet" href="/stories/css/reviews-live.css">\n<script src="/stories/js/reviews-live.js?v=1020states" defer></script>\n</head>');
  // Cohorts are data, not five fixed slots. Category/tag/view controls keep their existing IDs.
  page = page.replace(/\s*<input[^>]+name="fco"[^>]*>/g, '')
    .replace(/<div class="dwin"><label for="fco_all">[\s\S]*?<\/div>/, '<div class="dwin" data-review-cohorts></div>');
  page = page.replace(/(href|src)="\.\.\/common\//g, '$1="/common/').replace(/(href|src)="(css|js)\//g, '$1="/stories/$2/');
  output.set('templates/public-site/reviews.html', page);
  const read = name => readFileSync(join(root, 'src/components/stories/reviews', name + '.html'), 'utf8');
  function fragment(name) {
    let html = read(name);
    if(name === 'detail') html = html.replace('{{#each tags}}{{> stories/reviews/tag}}{{/each}}', '<a class=\"t\" href=\"{{tags.0.href}}\" data-field=\"tag\">{{tags.0.label}}</a>');
    html = html.replace(/<([a-z0-9]+)([^>]*?)>(\{\{(?:category|title|summary|author|track|tags\.0\.label)\}\})/g, (all, tag, attrs, value) => {
      const key = value.slice(2, -2); const expr = key === 'tags.0.label' ? 'r.firstTag' : 'r.' + key;
      return `<${tag}${attrs} th:text="\${${expr}}">`;
    });
    html = html.replace(/\{\{cohort\}\}/g, '<th:block th:text="${r.cohort}"></th:block>')
      .replace(/class="\{\{view\.(card|row|detail)\.className\}\}"/g, (_, type) => `th:class="'${type === 'card' ? 'idc' : type === 'row' ? 'rvr' : 'ov'} ' + \${r.classes}"`)
      .replace(/href="#\{\{id\}\}"/g, 'th:href="\'#\' + ${r.anchor}"')
      .replace(/id="\{\{id\}\}-t"/g, 'th:id="${r.anchor} + \'-t\'"')
      .replace(/id="\{\{id\}\}"/g, 'th:id="${r.anchor}"')
      .replace(/aria-labelledby="\{\{id\}\}-t"/g, 'th:attr="aria-labelledby=${r.anchor} + \'-t\'"')
      .replace(/style="\{\{view\.(?:card|detail)\.style\}\}"/g, 'th:style="${r.style}"')
      .replace(/style="\{\{view\.row\.cgStyle\}\}"/g, 'th:style="\'background:\' + ${r.color}"')
      .replace(/style="\{\{view\.row\.tgStyle\}\}"/g, 'th:style="\'background:\' + ${r.background} + \';color:\' + ${r.dark}"')
      .replace('{{{bodyHtml}}}', '<p th:each="paragraph : ${r.body}" th:text="${paragraph}"></p>');
    if (name === 'detail') html = html.replace('<p th:each="paragraph', '<div class="review-photos" th:if="${!#lists.isEmpty(r.photos)}"><figure th:each="photo : ${r.photos}"><img th:src="${photo.src}" th:alt="${photo.alt}" loading="lazy" decoding="async"></figure></div>\n        <p th:each="paragraph');
    if (name === 'detail') html = html.replace(/<a class="t"[\s\S]*?<\/a>/, '<a class="t" th:each="tag : ${r.tags}" th:href="\'#tg-\' + ${tag.index}" th:text="${tag.label}"></a>');
    html = html.replace(/\{\{(track|category|author|title|summary)\}\}/g, (_, key) => '<th:block th:text="${r.' + key + '}"></th:block>');
    if (/\{\{/.test(html)) throw new Error('Unmapped Spring design field in ' + name);
    return html.replace(/^<([a-z]+)/, `<$1 th:fragment="${name}(r)"`);
  }
  output.set('templates/public-site/review-fragments.html', '<!doctype html><html xmlns:th="http://www.thymeleaf.org"><body>\n' + ['card', 'row', 'detail'].map(fragment).join('\n') + '\n</body></html>');
  let hub = generated.get('stories/index.html').replace('<html ', '<html xmlns:th="http://www.thymeleaf.org" ');
  hub = hub.replace(/(<div class="hb-lq-t">)[\s\S]*?(\n\s*<\/div>)/, `$1
    <th:block th:each="copy : \${#numbers.sequence(0,1)}"><a th:each="r : \${tickerReviews}" th:href="'reviews.html#' + \${r.anchor}" th:attr="aria-hidden=\${copy == 1 ? 'true' : null},tabindex=\${copy == 1 ? '-1' : null}"><span class="t" th:text="\${r.quote}"></span><span class="a" th:text="\${r.author} + ' · ' + \${r.cohort} + '기'"></span></a></th:block>$2`);
  hub = hub.replace(/(<div class="hb-pis hb-x">)[\s\S]*?(\n\s*<\/div>)/, `$1
    <a class="hb-pi" th:each="r : \${hubReviews}" th:href="'reviews.html#' + \${r.anchor}"><span class="hb-pi-c"><b th:text="\${r.category}"></b><span th:text="\${r.cohort} + '기'"></span></span><h3 th:text="\${r.title}"></h3><p th:text="\${r.summary}"></p><span class="hb-pi-by"><b th:text="\${r.author}"></b><span th:text="\${r.track}"></span></span></a>$2`);
  output.set('templates/public-site/stories.html', hub);
  const text = node => typeof node === 'string' ? node : (node.children || []).map(text).join('');
  const records = loadContent().stories.reviews;
  const seed = records.map((r, index) => ({ anchor: r.id, order: index, title: r.title, story: {
    anchor: r.id, cat: /cat-(life|class|proj|job|path)\b/.exec(r.view.card.className)[1], cohort: r.cohort, author: r.author, track: r.track,
    summary: r.summary, body: r.bodyRichText.filter(n => typeof n === 'object').map(text),
    tags: r.tags.map(t => Number(t.href.slice(4))), ticker: r.quote || '',
    hub: ['r-career-5','r-life-6','r-class-12','r-proj-8'].includes(r.id)
  }}));
  output.set('review-seed.json', JSON.stringify(seed, null, 2) + '\n');
  addStoryArtifacts(output, generated);
  return output;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const at = process.argv.indexOf('--output');
  if (at < 0 || !process.argv[at + 1]) throw new Error('Usage: npm run export:spring -- --output /absolute/server/src/main/resources');
  const destination = resolve(process.argv[at + 1]);
  for (const [file, source] of springArtifacts()) {
    const target = join(destination, file); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, source);
  }
  console.log('Exported Spring review templates and opt-in seed data.');
}
