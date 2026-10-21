// 팀 백오피스(공개 API)와 연결되는 정적 사이트판.
// build()가 만든 디자인 그대로의 페이지에 백오피스 연결 줄을 넣고, 백오피스 글이 그려질 자리의 시안 글을 비워요.
// - npm run build / npm run check만 이 결과를 씁니다(scripts/build.mjs). build() 자체와 Spring 내보내기(export-spring.mjs)는
//   디자인 원본 그대로라 Spring 템플릿 · seed는 바뀌지 않아요.
// - 줄 순서는 팀 규칙 그대로: stories-data.js → ../api/public/stories.js → stories-render.js → story-state.js,
//   FAQ는 faq-data.js → ../api/public/faq.js → faq-render.js(check.js보다 먼저), 내용 페이지마다 site.js 다음 줄에 track.js.
// - 공개 API 주소는 상대 경로(../api/public/…)로 둬요. 팀 사이트 서버 · 관리자 미리보기가 이 경로를 백오피스 API로 넘겨요.
// - 디자인이 바뀌어 기대한 자리를 못 찾으면 조용히 넘어가지 않고 빌드를 멈춰요.

const TRACK = '<script src="../common/js/track.js?v=1020" defer></script>';
const STORY_SCRIPTS = [
  '<!-- 글은 백오피스 DB에서(게시물 관리): 사본(백오피스가 꺼져 있을 때) → 공개 API(DB의 지금 글, 불러오면 사본을 덮어씀) → 그리기. 디자이너 스크립트보다 먼저 -->',
  '<script src="js/stories-data.js" defer></script>',
  '<script src="../api/public/stories.js" defer></script>',
  '<script src="js/stories-render.js" defer></script>'
];
const STORY_STATE_NOTE = '<!-- 빈 목록 · 필터 결과 없음 안내(aica-site PR #27): 글을 다 그린 뒤 판단하도록 글 그리기 다음에 -->';
const STORY_STYLE = '<link rel="stylesheet" href="css/stories-render.css?v=1021">';
const FAQ_SCRIPTS = [
  '<!-- 자주 묻는 질문: 백오피스 DB(faqs) → 사본 · 공개 API → 그리기(check.js보다 먼저) -->',
  '<script src="js/faq-data.js" defer></script>',
  '<script src="../api/public/faq.js" defer></script>',
  '<script src="js/faq-render.js?v=1020" defer></script>'
];
// 큰 카드의 기본 안내는 특정 DB 글에서 복사하지 않습니다. 실제 인터뷰 내용은 공개 API/사본으로 그립니다.
const HUB_INTERVIEW_QUOTE = '인터뷰 내용을 자세히 살펴보세요.';

function fail(path, what) { throw new Error(`backoffice-site: ${path}에서 ${what}을(를) 찾지 못했어요. 디자인이 바뀌었는지 확인해 주세요.`); }

// anchor가 든 줄의 시작 · 끝 · 들여쓰기
function lineOf(html, anchor, path) {
  const at = html.indexOf(anchor);
  if (at < 0) fail(path, anchor);
  if (html.indexOf(anchor, at + 1) >= 0) throw new Error(`backoffice-site: ${path}에 ${anchor}이(가) 여러 번 있어요.`);
  const start = html.lastIndexOf('\n', at) + 1;
  const end = html.indexOf('\n', at);
  return { start, end: end < 0 ? html.length : end, indent: /^[ \t]*/.exec(html.slice(start))[0] };
}
function insertBefore(html, anchor, lines, path) {
  const l = lineOf(html, anchor, path);
  return html.slice(0, l.start) + lines.map(line => l.indent + line + '\n').join('') + html.slice(l.start);
}
function insertAfter(html, anchor, lines, path) {
  const l = lineOf(html, anchor, path);
  return html.slice(0, l.end) + lines.map(line => '\n' + l.indent + line).join('') + html.slice(l.end);
}

// 시작 태그(pattern)에서 짝이 맞는 닫는 태그까지. 같은 이름 태그가 안에 겹쳐 있어도 맞춰요
function element(html, pattern, from, path) {
  pattern.lastIndex = 0;
  const re = new RegExp(pattern.source, 'g');
  re.lastIndex = from;
  const match = re.exec(html);
  if (!match) return null;
  const start = match.index, open = match[0], tag = /^<([a-z][\w-]*)/i.exec(open)[1];
  const tokens = new RegExp('<\\/?' + tag + '\\b[^>]*>', 'gi');
  tokens.lastIndex = start + open.length;
  let depth = 1, token;
  while ((token = tokens.exec(html))) { depth += token[0].startsWith('</') ? -1 : 1; if (!depth) break; }
  if (!token) throw new Error(`backoffice-site: ${path}의 ${open}이(가) 닫히지 않았어요.`);
  return { start, openEnd: start + open.length, closeStart: token.index, end: tokens.lastIndex };
}
// 안쪽을 비워요: <div class="idgrid">…</div> → <div class="idgrid"></div>
function emptyElement(html, pattern, path) {
  const e = element(html, pattern, 0, path);
  if (!e) fail(path, pattern.source);
  return html.slice(0, e.openEnd) + html.slice(e.closeStart);
}
// 요소를 통째로 지워요(그 줄에 요소만 있으면 뒤따르는 빈 줄까지 줄째로). 하나도 없으면 디자인이 바뀐 것
function removeElements(html, pattern, path) {
  let count = 0, e;
  while ((e = element(html, pattern, 0, path))) {
    const lineStart = html.lastIndexOf('\n', e.start - 1) + 1;
    const start = /^[ \t]*$/.test(html.slice(lineStart, e.start)) ? lineStart : e.start;
    const rest = /^[ \t]*\n(?:[ \t]*\n)*/.exec(html.slice(e.end));
    html = html.slice(0, start) + html.slice(rest && start === lineStart ? e.end + rest[0].length : e.end);
    count++;
  }
  if (!count) fail(path, pattern.source);
  return html;
}
// 요소 하나를 고쳐요(edit: 요소 HTML → 새 HTML)
function editElement(html, pattern, edit, path) {
  const e = element(html, pattern, 0, path);
  if (!e) fail(path, pattern.source);
  return html.slice(0, e.start) + edit(html.slice(e.start, e.end)) + html.slice(e.end);
}

function storyHead(html, path, anchor) {
  html = insertBefore(html, anchor, anchor.includes('story-state') ? [...STORY_SCRIPTS, STORY_STATE_NOTE] : STORY_SCRIPTS, path);
  const head = html.indexOf('</head>');
  if (head < 0) fail(path, '</head>');
  return html.slice(0, head) + STORY_STYLE + '\n' + html.slice(head);
}

const PAGES = {
  'home/index.html': (html, path) => insertAfter(html, '<script src="../common/js/site.js', [TRACK, '<script src="js/ticker-render.js" defer></script>'], path),
  'about/index.html': (html, path) => insertAfter(html, '<script src="../common/js/site.js', [TRACK], path),
  'life/index.html': (html, path) => insertAfter(html, '<script src="../common/js/site.js', [TRACK], path),
  'check/index.html': (html, path) => {
    html = insertBefore(html, '<script src="../common/js/menu.js"', FAQ_SCRIPTS, path);
    return insertAfter(html, '<script src="../common/js/site.js', [TRACK], path);
  },
  'stories/index.html': (html, path) => {
    html = storyHead(html, path, '<script src="js/old-hash.js');
    html = insertAfter(html, '<script src="../common/js/site.js', [TRACK], path);
    // 큰 인터뷰 카드: 사진 · 제목 · 이름 · 주소는 stories-render.js가 가장 최근 인터뷰로 채워요. 꼬리표(em)는 디자인 글 그대로
    html = removeElements(html, /<ul class="hb-ivl"[^>]*>/, path);
    html = editElement(html, /<a class="hb-ivf"[^>]*>/, card => {
      card = card.replace(/^<a class="hb-ivf"[^>]*>/, '<a class="hb-ivf" href="interviews.html">')
        .replace(/[ \t]*<img class="hb-ph"[^>]*>\n?/, '')
        .replace(/(<h3>)[\s\S]*?(<\/h3>)/, '$1$2')
        .replace(/(<span class="hb-by">)[\s\S]*?(<\/span>)/, '$1$2')
        .replace(/(<p class="hb-ivf-q">)[\s\S]*?(<\/p>)/, (_, open, close) => open + HUB_INTERVIEW_QUOTE + close);
      if (/<img|<svg/.test(card) || !card.includes(HUB_INTERVIEW_QUOTE) || !card.includes('<h3></h3>')) fail(path, '큰 인터뷰 카드 모양');
      return card;
    }, path);
    html = emptyElement(html, /<div class="hb-lq-t">/, path);
    html = emptyElement(html, /<div class="hb-pis hb-x">/, path);
    return emptyElement(html, /<div class="hb-body hb-pjs[^"]*">/, path);
  },
  'stories/reviews.html': (html, path) => {
    html = storyHead(html, path, '<script src="js/story-state.js');
    html = insertAfter(html, '<script src="../common/js/site.js', [TRACK], path);
    if (!/<input[^>]+name="pgn"/.test(html)) fail(path, 'name="pgn"');
    html = html.replace(/\n[ \t]*<input[^>]+name="pgn"[^>]*>/g, '');   // 쪽 번호는 글 수에 맞춰 stories-render.js가 만들어요
    html = emptyElement(html, /<div class="idgrid">/, path);
    html = emptyElement(html, /<div class="rvlist">/, path);
    html = emptyElement(html, /<div class="pager">/, path);
    return removeElements(html, /<div class="ov [^"]*"[^>]*>/, path);
  },
  'stories/interviews.html': (html, path) => {
    html = storyHead(html, path, '<script src="js/story-state.js');
    html = insertAfter(html, '<script src="../common/js/site.js', [TRACK], path);
    html = emptyElement(html, /<div class="ivgrid">/, path);
    html = emptyElement(html, /<div class="ivdots"[^>]*>/, path);
    return removeElements(html, /<div class="ivd(?: [^"<>]*)?"[^>]*>/, path);
  },
  'stories/projects.html': (html, path) => {
    html = storyHead(html, path, '<script src="js/story-state.js');
    html = insertAfter(html, '<script src="../common/js/site.js', [TRACK], path);
    html = emptyElement(html, /<div class="pjgrid">/, path);
    return removeElements(html, /<div class="pjd"[^>]*>/, path);
  },
  // 기수 기록은 게시중인 글이 없으면 페이지 카드 그대로 보여요(팀 사이트와 같음)
  'stories/cohorts.html': (html, path) => {
    html = storyHead(html, path, '<script src="js/story-state.js');
    return insertAfter(html, '<script src="../common/js/site.js', [TRACK], path);
  }
};

// stories-render.js는 디자이너 스크립트(js/…)와 story-state.js보다 먼저 실행돼야 해요(defer는 적힌 순서대로)
function checkOrder(html, path) {
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].replace(/\?.*$/, ''));
  const at = name => scripts.indexOf(name);
  const data = at('js/stories-data.js'), api = at('../api/public/stories.js'), render = at('js/stories-render.js');
  if (!(data >= 0 && data < api && api < render)) throw new Error(`backoffice-site: ${path} 이야기 스크립트 순서가 틀렸어요.`);
  const early = new Set(['js/stories-data.js', '../api/public/stories.js', 'js/stories-render.js', 'js/old-hash.js']);
  scripts.forEach((src, i) => {
    if (src.startsWith('js/') && !early.has(src) && i < render) throw new Error(`backoffice-site: ${path}의 ${src}이(가) stories-render.js보다 먼저예요.`);
  });
}

export function connectBackoffice(outputs) {
  const result = new Map(outputs);
  for (const [path, connect] of Object.entries(PAGES)) {
    const html = outputs.get(path);
    if (html == null) throw new Error(`backoffice-site: ${path}이(가) 빌드 결과에 없어요.`);
    const connected = connect(html, path);
    if (path.startsWith('stories/')) checkOrder(connected, path);
    result.set(path, connected);
  }
  return result;
}
