/* =========================================================
   선배들의 이야기 — 글 그리기 (디자이너 시안: 한눈에 보기 + 후기 · 인터뷰 · 프로젝트 · 기수별 이모저모 페이지)
   글은 페이지에 적어 두지 않고 백오피스 DB에서 받아요. 관리자 페이지 '게시물 관리'에 게시중인 후기 · 인터뷰 · 프로젝트 · 기수 기록을
   각 페이지 시안과 같은 마크업으로 그립니다. stories-loader.js가 JSON API를 먼저 읽고 실패할 때만 사본을 읽어 window.STORIES_DATA에 넣습니다.
   데이터와 공통 탐색이 준비되면 이 렌더러 → story-state.js → 페이지별 동작 순서로 실행합니다.
   후기 데스크톱 거르기·쪽 넘김은 이 파일이 맡고, 나머지 보기·창 열기는 CSS와 기존 스크립트(stories.js · stories-sections.js · cohort-v3.js · hub.js)가 맡아요.
   이 파일은 그 스크립트들보다 먼저 불러옵니다(defer 순서).
   - reviews.html: 카드 · 리스트 · 쪽 번호 · 글 창(.ov), 새 기수 거르기 단추
   - interviews.html: 카드 · 넘김 점 · 상세(.ivd)
   - projects.html: 카드 격자(.pjgrid) · 상세(.pjd)
   - cohorts.html: 기수 기록 카드는 페이지 HTML의 <template id="cv3-data">에 적혀 있어요. 관리자 › 기수별 이모저모에 게시중인 글(cohorts)이
     하나라도 있으면 그 글로 다시 그려요(2026-10-20, cohort_stories 표)
   - index.html(한눈에 보기): 대표 인터뷰 + 3개 · 흐르는 한마디 12개 + 포스트잇 4장 · 유형별 프로젝트 3개 · 행사 단계별 기수 사진 5장
   - 사진: 카드에는 대표 사진(img, 관리자가 맞춘 보일 위치 · 확대 fit), 글을 열면 사진 여러 장(photos)을 넘겨 봐요(.phs)
   목록은 최신 글이 먼저예요.
   통합 저장소(aica-site) 반영 2026-10-21: 최신 디자인(aica-site-preview PR #33)에 맞춤 — 프로젝트 칸 글은 p.pjph-t
   (• 목록은 project-reading.js가 번호 목록으로), 한눈에 보기 프로젝트 배지는 반 이름(subject, 없으면 type), 후기 쪽 넘김 CSS는 5쪽까지.
   사진 넘김(.phs) 움직임과 모양은 이 파일 끝과 css/stories-render.css에(디자이너 파일은 그대로). 페이지에 이 줄들을 넣는 일은
   scripts/backoffice-site.mjs(npm run build)가 맡아요.
   ========================================================= */
(function () {
  'use strict';
  var D = window.STORIES_DATA, page = document.querySelector('.stories-page');
  if (!D || !page) return;
  var REV = D.reviews || [], IV = D.interviews || [], PJ = D.projects || [], CO = D.cohorts || [];
  var PER = 12;           // 후기 한 쪽에 12개
  var CSS_PAGES = 5;      // stories.css에 넘김 규칙이 있는 쪽 수(pgn1~pgn5). 6쪽부터는 아래에서 규칙을 만들어요
  var LEGACY_REVIEW_TAGS = ['#비전공자', '#타지출신', '#직장인출신', '#졸업생', '#적응', '#팀활동', '#취업연계'];
  var LIFE = { c: '#22D3EE', bg: '#DFF8FC', dk: '#0B5563' }, CAREER = { c: '#2457F5', bg: '#DCE5F7', dk: '#15368F' };
  var CAT = {
    life: { name: '생활', cls: 'cat-life', c: LIFE.c, bg: LIFE.bg, dk: LIFE.dk },
    class: { name: '수업', cls: 'cat-class', c: '#FFE600', bg: '#FFF8C2', dk: '#5A4F00' },
    proj: { name: '프로젝트', cls: 'cat-proj', c: '#8CFF3F', bg: '#ECFFD9', dk: '#2F5A12' },
    job: { name: '취업 성공', cls: 'cat-career cat-job', c: CAREER.c, bg: CAREER.bg, dk: CAREER.dk },
    path: { name: '진로 고민', cls: 'cat-career cat-path', c: CAREER.c, bg: CAREER.bg, dk: CAREER.dk }
  };
  CAT.career = CAT.job;   // 예전 분류(취업·진로)는 취업 성공으로
  var CAT_ORDER = ['job', 'path', 'life', 'class', 'proj'];   // 한눈에 보기 포스트잇 순서(시안)
  var FIELD = { 'AI 모델개발': 0, 'AI 클라우드·인프라': 1, 'AI 서비스 기획': 2, '데이터 분석': 3 };   // 시안의 fld 표시(직군 묶음)
  var COH_COLOR = { 7: '#10203D', 6: '#2457F5', 5: '#2457F5', 4: '#6E97F2', 3: '#8FA8D8' };
  var STAGES = [0, 4, 3, 7, 8];   // 한눈에 보기 기수 사진: 입교식 → 중간발표회 → 기업탐방 → 취업박람회 → 수료식

  // API strings remain untrusted even when the source is a backoffice-owned snapshot.
  var safe = window.AicaPublicContent;
  function publicItem(item, prefix) {
    var out = Object.assign({}, item);
    function image(value) {
      if (!value || !safe) return null;
      var src = safe.url(value.src, true); if (!src) return null;
      var out = Object.assign({}, value, {src:src,w:Math.max(0,num(value.w,0)),h:Math.max(0,num(value.h,0))});
      // Srcset is a list of URLs, not an arbitrary HTML attribute or descriptor string.
      var widths = Object.create(null), sources = Object.create(null);
      out.srcset = (Array.isArray(value.srcset) ? value.srcset.slice(0,16) : []).filter(function (candidate) {
        return candidate && typeof candidate.src === 'string' && Number.isSafeInteger(candidate.w) && candidate.w > 0 && candidate.w <= 16384 && (!out.w || candidate.w <= out.w);
      }).map(function (candidate) { return {src:safe.url(candidate.src,true),w:candidate.w}; }).filter(function (candidate) {
        if (!candidate.src || /[\s,]/.test(candidate.src) || widths[candidate.w] || sources[candidate.src]) return false;
        widths[candidate.w] = true; sources[candidate.src] = true; return true;
      }).sort(function (a,b) { return a.w-b.w; });
      // The API lists derivatives only; retain the original for large/high-density slots.
      if (out.srcset.length && Number.isSafeInteger(out.w) && out.w <= 16384 && out.w > out.srcset[out.srcset.length-1].w && !sources[out.src] && !/[\s,]/.test(out.src)) {
        out.srcset.push({src:out.src,w:out.w});
      }
      return out;
    }
    out.img = image(item.img); out.imgLarge = image(item.imgLarge); out.thumb = image(item.thumb);   // thumb: 프로젝트 썸네일(그림만)
    out.photos = (Array.isArray(item.photos) ? item.photos : []).map(image).filter(Boolean);
    out.art = safe ? safe.svg(item.art) : '';
    out.links = (Array.isArray(item.links) ? item.links : []).map(function (link) { return link && Object.assign({}, link,{url:safe ? safe.url(link.url,false) : ''}); }).filter(function (link) { return link && link.url; });
    var tags = Array.isArray(item.tags) ? item.tags : [];
    out.tags = prefix === 'r-p' ? tags.map(reviewTag).filter(Boolean) : tags.filter(function (tag) { return (prefix === 'st-' && typeof tag === 'string') || (Number.isInteger(tag) && tag >= 0 && tag < LEGACY_REVIEW_TAGS.length); });
    if (item.video) out.video = Object.assign({}, item.video,{url:safe ? safe.url(item.video.url,false) : '',yt:/^[A-Za-z0-9_-]{6,20}$/.test(item.video.yt || '') ? item.video.yt : ''});
    if (!new RegExp('^'+prefix+'(?:[0-9]{1,18}|new)$').test(out.anchor || '')) out.anchor = prefix + String(item.id || '').replace(/[^0-9]/g,'').slice(0,18);
    return out;
  }
  REV = REV.map(function (item) { return publicItem(item,'r-p'); });
  IV = IV.map(function (item) { return publicItem(item,'iv-p'); });
  var photoIV = IV.filter(hasPhoto);   // 허브 일반 목록은 표시용 기본 아바타를 채우기 전, 실제 대표 사진이 있는 글에서 고릅니다.
  // 대표 사진(관리자가 고른 아바타 포함)은 유지하고, 없는 옛 글만 표시 전용 아바타로 채웁니다.
  // ID 순서로 순환 배정하므로 정렬·기수 필터·페이지 이동에도 같은 글의 아바타가 유지됩니다.
  var avatarOrder = IV.map(function (item) { return item.anchor; }).sort(function (a, b) { return a.localeCompare(b, 'en', { numeric: true }); });
  IV = IV.map(function (item) {
    if (item.img) return item;
    var no = avatarOrder.indexOf(item.anchor) % 10 + 1;
    var avatar = { src: 'assets/interview-avatars/avatar-card-' + ('0' + no).slice(-2) + '-320.webp', alt: '인터뷰 아바타', w: 320, h: 200, fit: { x: 50, y: 50, z: 1 } };
    return Object.assign({}, item, { img: avatar, imgLarge: Object.assign({}, avatar, { src: avatar.src.replace('-320.webp', '-1080.webp'), w: 1080, h: 675 }) });
  });
  PJ = PJ.map(function (item) { return publicItem(item,'pj-p'); });
  CO = CO.map(function (item) { return publicItem(item,'st-'); });

  function esc(t) { return SiteUI.escapeText(t); }
  var queries = SiteUI.selectors(page, true), $ = queries.$, $$ = queries.$$;
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function coh(n) { return esc(n) + '<i>기</i>'; }
  function cat(r) { return CAT[r.cat] || CAT.life; }
  function catKey(r) { return r.cat === 'career' ? 'job' : (CAT[r.cat] ? r.cat : 'life'); }
  function fld(r) { return FIELD[r.track] == null ? '' : ' fld' + FIELD[r.track]; }
  // Number tags are retained only for older API responses and cached snapshots.
  function reviewTag(tag) {
    if (typeof tag === 'string') return tag.trim() ? tag : '';
    return Number.isInteger(tag) && tag >= 0 && tag < LEGACY_REVIEW_TAGS.length ? LEGACY_REVIEW_TAGS[tag] : '';
  }
  function firstTag(r) { return r.tags && r.tags.length ? r.tags[0] : ''; }
  function firstSentence(t) { var m = String(t || '').match(/^.*?[.!?。](\s|$)/); return (m ? m[0] : String(t || '')).trim(); }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function hasPhoto(item) { return !!(item.img && item.img.src); }
  // 사진(img). fit: 썸네일 자리에서는 관리자가 '썸네일 맞추기'로 정한 보일 위치(--fx · --fy)와 확대(--z)를 따라요
  var PHOTO_CARD_SIZES = '(max-width: 640px) calc(100vw - 40px), (max-width: 1199px) calc((100vw - 72px) / 2), 360px';
  var PHOTO_DETAIL_SIZES = '(max-width: 1000px) calc(100vw - 40px), 960px';
  function sourceSet(m, sizes) {
    if (!m.srcset || !m.srcset.length) return '';
    return ' srcset="' + m.srcset.map(function (candidate) { return esc(candidate.src) + ' ' + candidate.w + 'w'; }).join(', ') + '" sizes="' + esc(sizes || PHOTO_DETAIL_SIZES) + '"';
  }
  function imgTag(m, cls, lazy, fit, field, sizes, priority) {
    if (!m || !m.src) return '';
    var f = fit && m.fit, style = f ? ' data-fit style="--fx:' + num(f.x, 50) + '%;--fy:' + num(f.y, 50) + '%;--z:' + num(f.z, 1) + '"' : '';
    var avatarBase = /^(assets\/interview-avatars\/avatar-card-\d{2})-(160|320|608|1080)\.webp$/.exec(m.src);
    var uploadedAvatar = /^assets\/uploads\/post-avatar-card-(0[1-9]|10)-1080\.webp$/.exec(m.src);
    if (uploadedAvatar) avatarBase = [m.src, 'assets/interview-avatars/avatar-card-' + uploadedAvatar[1]];
    var responsive = sourceSet(m,sizes) || (avatarBase ? ' srcset="' + [160, 320, 608, 1080].map(function (w) { return avatarBase[1] + '-' + w + '.webp?v=1026avatars10 ' + w + 'w'; }).join(', ') + '" sizes="' + esc(sizes || '(max-width: 640px) 64px, 304px') + '"' : '');
    return '<img class="' + cls + '" src="' + esc(m.src + (avatarBase ? '?v=1026avatars10' : '')) + '" alt="' + esc(m.alt || '') + '"' + (lazy ? ' loading="lazy"' : ' loading="eager"') + (priority ? ' fetchpriority="high"' : '') + ' decoding="async"'
      + responsive + (m.w ? ' width="' + m.w + '"' : '') + (m.h ? ' height="' + m.h + '"' : '') + style + (field ? ' data-field="' + field + '"' : '') + '>';
  }
  // 사진 또는 그림(svg, 관리자가 가져온 시안 그림)
  function visual(item, opts) {
    opts = opts || {};
    var m = opts.large && item.imgLarge ? item.imgLarge : item.img;
    var sizes = opts.large ? '(max-width: 1000px) calc(100vw - 40px), 720px' : null;
    sizes = opts.sizes || sizes;
    if (!sizes && m && m.srcset && m.srcset.length) sizes = PHOTO_CARD_SIZES;
    if (m && m.src) return imgTag(opts.alt === false ? Object.assign({},m,{alt:''}) : m, 'illu', true, opts.fit && m === item.img, opts.field, sizes);
    if (item.art) return opts.hidden && !/^<svg\b[^>]*\saria-hidden=/.test(item.art) ? item.art.replace(/^<svg\b/, '<svg aria-hidden="true"') : item.art;
    return '<svg class="illu" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"' + (opts.hidden ? ' aria-hidden="true"' : '') + '><rect width="100%" height="100%" fill="#E4E9F7"/></svg>';
  }
  // 한눈에 보기 칸의 그림: 사진이면 hb-ph, 그림이면 class 없이(시안)
  function hubVisual(item, opts) {
    opts = opts || {};
    var m = opts.large && item.imgLarge ? item.imgLarge : item.img;
    if (m && m.src) return imgTag(Object.assign({},m,{alt:''}), 'hb-ph', !opts.priority, m === item.img, null, opts.sizes || (opts.large ? '(max-width: 800px) calc(100vw - 40px), 538px' : '(max-width: 640px) 104px, 140px'), opts.priority);
    var svg = item.art || '<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#E4E9F7"/></svg>';
    return svg.replace(/^<svg\b([^>]*)>/, function (all, attrs) { return '<svg aria-hidden="true"' + attrs.replace(/\s(class|aria-hidden)="[^"]*"/g, '') + '>'; });
  }
  // 프로젝트 썸네일(2026-10-26): 흰 바탕에 관리자가 고른 그림(thumb, 투명 배경)만 크게. 글자는 넣지 않아요(사용자 요청 — 주제는 카드 글로)
  // 사진처럼 꽉 찬 그림은 그림이 오면 칸 크기에 맞춰 채워요(이 파일 끝 '썸네일 그림 맞추기')
  function hasThumb(item) { return !!(item.thumb && item.thumb.src); }
  // 보일 위치 · 확대(2026-11-05, 관리 화면 발행 창에서 끌어 맞춤 — thumb.fit): 카드 · 한눈에 보기(card)에서만, 사진처럼 꽉 찬 썸네일(pjthumb-full)일 때 CSS 가 써요
  function pjThumb(item, cls, sizes, card) {
    var t = item.thumb, f = card && t.fit;
    var pos = f ? ' data-pos style="--fx:' + num(f.x, 50) + '%;--fy:' + num(f.y, 50) + '%;--z:' + num(f.z, 1) + '"' : '';
    return '<div class="pjthumb' + (cls ? ' ' + cls : '') + '" aria-hidden="true">'
      + '<img class="pjthumb-i"' + pos + ' src="' + esc(t.src) + '" alt="" loading="lazy" decoding="async"' + sourceSet(t,sizes || PHOTO_CARD_SIZES) + (t.w && t.h ? ' width="' + t.w + '" height="' + t.h + '"' : '') + '></div>';
  }
  // 프로젝트 시연 영상(2026-10-27): 유튜브 번호가 있으면 상세 맨 위(대표 이미지 자리)에 대표 그림(썸네일 · 대표 사진) + 재생 단추.
  // 누르면 그 자리에서 재생해요(이 파일 끝 '프로젝트 시연 영상'). data-yt 가 아니라 data-pj-yt — 인터뷰용 재생(stories-sections.js)과 겹치지 않게
  // 시연 구간(2026-11-03): 1시간짜리 영상 하나에 여러 팀 시연이 이어져 있어 video.start · end(초)가 있으면 그 구간만 재생(data-pj-start · data-pj-end)
  // 영상 구간 시간(초): 하루 안의 양수만, 아니면 0(인터뷰 영상 구간 2026-11-05)
  function ytSec(v) { return typeof v === 'number' && v > 0 && v <= 86400 ? Math.floor(v) : 0; }
  function pjVideo(x) {
    var yt = x.video && x.video.yt;
    if (!yt) return '';
    var sec = function (v) { return typeof v === 'number' && v > 0 && v <= 86400 ? Math.floor(v) : 0; }, start = sec(x.video.start), end = sec(x.video.end);
    return '<div class="ivhero pjhero ivvid pjvid" data-pj-yt="' + esc(yt) + '"' + (start ? ' data-pj-start="' + start + '"' : '')
      + (end > start ? ' data-pj-end="' + end + '"' : '') + '><span class="ivtag">' + esc(pjSubject(x)) + '</span>'
      + (hasThumb(x) ? pjThumb(x, 'illu', PHOTO_DETAIL_SIZES) : visual(x, { hidden: true, sizes: PHOTO_DETAIL_SIZES }))
      + '<button class="ivplay" type="button" aria-label="' + esc(x.title) + ' 시연 영상 재생"><i></i></button></div>';
  }
  // 카드 큰 글씨: 프로젝트 주제(글쓰기 화면 '프로젝트 주제' = summary). 줄바꿈은 카드에서 한 줄로 이어요
  function pjTopic(x) { return String(x.summary || '').replace(/\s+/g, ' ').trim(); }
  // 글 안 사진 여러 장: 옆으로 넘겨 봐요(손가락으로 밀기 · 화살표 · 키보드 ←→, 움직임은 stories.js)
  function photoList(item) { return (item.photos || []).filter(function (p) { return p && p.src; }); }
  function slides(item, label) {
    var list = photoList(item);
    if (list.length < 2) return '';
    return '<div class="phs" role="group" aria-roledescription="사진 넘김" aria-label="' + esc(label) + ' 사진 ' + list.length + '장">'
      + '<div class="phs-track" tabindex="0">' + list.map(function (p, i) {
        return '<figure class="phs-slide" aria-label="' + (i + 1) + ' / ' + list.length + '">' + imgTag(p, 'phs-img', i > 0) + '</figure>';
      }).join('') + '</div>'
      + '<button type="button" class="phs-btn prev" aria-label="이전 사진" disabled>' + ARROW_L + '</button>'
      + '<button type="button" class="phs-btn next" aria-label="다음 사진">' + ARROW_R + '</button>'
      + '<span class="phs-count" aria-hidden="true"><b>1</b> / ' + list.length + '</span></div>';
  }
  // 한 장이면 그 사진만, 여러 장이면 넘김
  function photos(item, label) {
    var list = photoList(item), one = list[0] || item.img;
    if (list.length > 1) return slides(item, label);
    return one && one.src ? '<figure class="phs one">' + imgTag(one, 'phs-img', true) + '</figure>' : '';
  }
  var ARROW_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ARROW_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function insertAfter(ref, markup) { if (ref) ref.insertAdjacentHTML('afterend', markup); }
  function anchorNo(anchor, fallback) { var m = /-(\d+)$/.exec(anchor || ''); return m ? m[1] : fallback; }
  function who(r) { return [r.cohort ? r.cohort + '기' : '', r.author, r.track].filter(Boolean).join(' · '); }
  function projectName(x) { return String(x.title || '').replace(/\s+—\s+/, ' · '); }
  // 프로젝트 반 이름: subject, 없으면 우리 글의 type(예: 자연어처리A). 카드 썸네일 위 · 상세 꼬리표 · 한눈에 보기 배지가 같은 값을 써요
  function subjectOf(x) { return x.subject || x.type || ''; }
  // 프로젝트 과정(2026-10-23, course): 그 기수 '기수 정보'의 교육과정 트랙(6기 데이터 기술 · AI 모델링 …). 과정 거르기 · 상세 '과정'
  function courseOf(x) { return x.course || ''; }
  var css = '';

  function hubReviewByline(r) {
    var tag=firstTag(r);
    return '<span class="hb-pi-by"><span class="hb-pi-meta"><b>' + esc(r.author) + '</b>'
      + (r.track ? '<span>' + esc(r.track) + '</span>' : '') + '</span>'
      + (tag ? '<span class="tg" data-field="tag">' + esc(tag) + '</span>' : '')
      + '<span class="hb-pi-arrow" aria-hidden="true">→</span></span>';
  }

  function reviewDialog(r, hub, index, pending) {
      var c = cat(r), id = esc(r.anchor);
      var tags = (r.tags || []).map(function (t) { return '<span class="t" data-field="tag">' + esc(t) + '</span>'; }).join('');
      var slot = !hub && Number.isInteger(index) ? ' data-review-note-slot="' + (index % 8 + 1) + '"' : '';
      return '<div class="ov ' + c.cls + ' coh' + esc(r.cohort) + fld(r) + '" id="' + id + '"' + slot + ' style="--c:' + c.c + ';--bg:' + c.bg + ';--dk:' + c.dk + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '-t">'
        + '<a class="back" href="' + (hub ? '#hub-reviews' : '#p-rev') + '" aria-label="닫기"></a><div class="sheet"><a class="x" href="' + (hub ? '#hub-reviews' : '#p-rev') + '" aria-label="닫기"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg></a><div class="mscroll">'
        + '<div class="mtop"><div class="review-heading-meta"><div class="mcat" data-field="category">' + c.name + '</div>' + (tags ? '<div class="mtags">' + tags + '</div>' : '') + '</div><h3 id="' + id + '-t" data-field="title">' + esc(r.title) + '</h3>'
        + '<div class="mby"><span class="mav" data-field="cohort">' + coh(r.cohort) + '</span><div><b data-field="author">' + esc(r.author) + '</b>' + (r.track ? '<em data-field="track">' + esc(r.track) + '</em>' : '') + '</div></div></div>'
        + '<div class="mbody">' + (pending ? '<div data-story-detail-status></div>'
          : '<p class="lead" data-field="summary">' + esc(r.summary) + '</p>' + photos(r, r.title)
            + (r.body || []).map(function (b) { return '<p data-field="body">' + esc(b) + '</p>'; }).join(''))
        + '</div>' + (hub ? '<nav class="sd-nav" aria-label="후기 더 보기"><a class="sd-list" href="reviews.html">후기 더 보기 →</a></nav>' : '') + '</div></div></div>';
  }
  function detailGroup(kind, items, host, position, render, type, prefix) {
    if (!host) return;
    if (typeof StoryDetails !== 'undefined') StoryDetails.register(kind, items, host, position, render, type, function (raw, item) {
      var result = publicItem(raw, prefix);
      // Keep the display avatar assigned on the list when an older interview has no photo.
      if (type === 'interviews' && !result.img) {
        result.img = item.img;
        result.imgLarge = item.imgLarge;
      }
      return result;
    });
    else host.insertAdjacentHTML(position, items.map((item, index) => render(item, index)).join(''));
  }
  var hubDialogs=document.getElementById('hub-review-dialogs');
  if (typeof StoryDetails !== 'undefined') detailGroup('hub-review', REV, hubDialogs, 'beforeend', (r, i, pending) => reviewDialog(r, true, i, pending), 'reviews', 'r-p');
  else if (hubDialogs) hubDialogs.innerHTML=REV.map(r => reviewDialog(r, true)).join('');

  /* ── 후기(reviews.html) ── */
  var rev = $('#p-rev');
  if (rev) {
    var pages = Math.max(1, Math.ceil(REV.length / PER));
    // 쪽 번호 라디오(보기 방식 라디오 바로 뒤)와 아래 쪽 번호
    $$('input[name="pgn"]', rev).forEach(function (r) { r.remove(); });
    var radios = '';
    for (var p = 1; p <= pages; p++) radios += '<input class="tr" autocomplete="off" type="radio" name="pgn" id="pgn' + p + '"' + (p === 1 ? ' checked' : '') + '>';
    insertAfter($('#vm-list', rev), radios);
    var pager = $('.pager', rev);
    if (pager) {
      var labels = '';
      for (p = 1; p <= pages; p++) labels += '<label for="pgn' + p + '">' + p + '</label>';
      pager.innerHTML = labels;
      pager.hidden = pages < 2;
    }
    var grid = $('.idgrid', rev), list = $('.rvlist', rev);
    function renderDesktopReviews() {
      var cards = '', rows = '';
      REV.forEach(function (r, i) {
        var c = cat(r), pg = Math.floor(i / PER) + 1, cls = c.cls + ' coh' + esc(r.cohort) + fld(r);
        var tag = firstTag(r);
        cards += '<a class="idc ' + cls + ' pg' + pg + '" href="#' + esc(r.anchor) + '" style="--c:' + c.c + ';--bg:' + c.bg + ';--dk:' + c.dk + '">'
          + '<div class="cbar"><b data-field="category">' + c.name + '</b><span data-field="cohort">' + coh(r.cohort) + '</span></div>'
          + '<div class="in"><h3 data-field="title">' + esc(r.title) + '</h3><p data-field="summary">' + esc(r.summary) + '</p>'
          + '<div class="who"><b data-field="author">' + esc(r.author) + '</b>' + (r.track ? '<em data-field="track">' + esc(r.track) + '</em>' : '')
          + (tag ? '<span class="tg" data-field="tag">' + esc(tag) + '</span>' : '') + '</div></div></a>';
        rows += '<a class="rvr ' + cls + ' pg' + pg + '" href="#' + esc(r.anchor) + '">'
          + '<span class="cg" style="background:' + c.c + '" data-field="category">' + c.name + '</span>'
          + '<span class="tt" data-field="title">' + esc(r.title) + '</span>'
          + (tag ? '<span class="tg" style="background:' + c.bg + ';color:' + c.dk + '" data-field="tag">' + esc(tag) + '</span>' : '')
          + '<span class="mt">' + esc([r.cohort ? r.cohort + '기' : '', r.author].filter(Boolean).join(' · ')) + '</span></a>';
      });
      if (grid) grid.innerHTML = cards;
      if (list) list.innerHTML = rows;
    }
    if (typeof StoryDetails === 'undefined') renderDesktopReviews();
    else {
      window.StoryReviewCards = REV.map(r => ({
        anchor:r.anchor, category:catKey(r), label:cat(r).name, cohort:String(r.cohort || ''),
        title:r.title, summary:r.summary, author:r.author, tag:firstTag(r)
      }));
      var reviewViewport = matchMedia('(max-width:600px)');
      var desktopCards, desktopRows;
      function mountDesktopReviews() {
        if (reviewViewport.matches) {
          if (desktopCards) { grid.replaceChildren(); list.replaceChildren(); }
        } else if (!desktopCards) {
          renderDesktopReviews();
          desktopCards = Array.from(grid.children);
          desktopRows = Array.from(list.children);
        } else {
          grid.replaceChildren(...desktopCards);
          list.replaceChildren(...desktopRows);
        }
        rev.dispatchEvent(new Event('stories:review-layout'));
      }
      reviewViewport.addEventListener('change', mountDesktopReviews);
      mountDesktopReviews();
    }
    // 후기 글 창(.ov)은 .st-main 바로 뒤에
    $$('.ov').forEach(function (o) { o.remove(); });
    detailGroup('review', REV, $('.st-main'), 'afterend', (r, i, pending) => reviewDialog(r, false, i, pending), 'reviews', 'r-p');
    // 쪽 번호 넘김 규칙이 모자라면 더 만들어요(CSS에는 7쪽까지)
    for (var k = CSS_PAGES + 1; k <= pages; k++) {
      var on = '.stories-page .rev:not([data-review-paging]):has(#rc_all:checked):has(#fco_all:checked):has(#pgn' + k + ':checked)';
      css += on + ' .idc:not(.pg' + k + '),' + on + ' .rvr:not(.pg' + k + '){display:none}'
        + '.stories-page .rev:has(#pgn' + k + ':checked) .pager.cpager label[for=pgn' + k + ']{background:#2B2D31;border-color:#2B2D31;color:#fff}';   // 1~5쪽과 같은 지금 쪽 표시(presentation.css)
    }
    // 기수 거르기: 시안에 있는 7기~3기 말고 새 기수 후기가 오면 버튼과 규칙을 더해요
    var KNOWN = [7, 6, 5, 4, 3], fcoBox = $('.dw-fco .dwin', rev), fcoLast = $('#fco_' + (KNOWN.length - 1));
    REV.map(function (r) { return +r.cohort; }).filter(function (c, i, a) { return c && KNOWN.indexOf(c) < 0 && a.indexOf(c) === i; })
      .sort(function (a, b) { return b - a; }).forEach(function (c) {
        var fid = 'fco_c' + c, sel = '.stories-page .rev:has(#' + fid + ':checked)';
        if (fcoLast) fcoLast.insertAdjacentHTML('afterend', '<input class="tr" autocomplete="off" type="radio" name="fco" id="' + fid + '">');
        if (fcoBox) {
          var labs = fcoBox.querySelectorAll('label'), before = [].filter.call(labs, function (l) { var m = /^(\d+)기$/.exec(l.textContent.trim()); return m && +m[1] < c; })[0];
          var lab = '<label for="' + fid + '">' + c + '기</label>';
          if (before) before.insertAdjacentHTML('beforebegin', lab); else fcoBox.insertAdjacentHTML('beforeend', lab);
        }
        css += sel + ' .dw-fco summary b{display:none}' + sel + ' .dw-fco summary u::after{content:"' + c + '기"}'
          + sel + ' .idc:not(.coh' + c + '),' + sel + ' .rvr:not(.coh' + c + '){display:none}'
          + sel + ' .dw-fco summary{background:var(--g900);color:#fff}' + sel + ' .dw-fco label[for=' + fid + ']{color:var(--g900);font-weight:600}';
      });
  }

  function pendingPage(cls, id, back, label, title) {
    return '<div class="' + cls + '" id="' + id + '"><a class="ivback" href="' + back + '">← ' + label
      + ' 목록</a><div class="ivwrap"><div><h2>' + esc(title) + '</h2><div data-story-detail-status></div></div></div></div>';
  }

  /* ── 인터뷰(interviews.html) ── */
  var ivPane = $('#p-iv');
  if (ivPane) {
    var grid2 = $('.ivgrid', ivPane), dots = $('.ivdots', ivPane);
    // 우수 수료생(2026-10-26): 백오피스에서 체크한 인터뷰(honors)는 위 '우수 수료생' 섹션 카드로만 그리고 아래 목록 · 넘김 점에서는 빼요.
    // 체크한 글이 없으면 섹션은 페이지에 적힌 '준비 중' 카드 그대로(넘김은 interview-honors.js).
    var honors = IV.filter(function (v) { return v.honors; }), listed = IV.filter(function (v) { return !v.honors; });
    var honorsTrack = $('.iv-honors .sm-ivf-track', ivPane);
    if (honorsTrack && honors.length) {
      honorsTrack.innerHTML = honors.map(function (v, i) {
        var vid = v.video && v.video.yt;
        return '<a class="sm-ivf-c' + (i ? '' : ' is-on') + '" href="#' + esc(v.anchor) + '" aria-label="' + esc(v.title) + ' 상세보기">'
          + '<div class="ph">' + visual(v, { alt: false, fit: true, sizes: '(max-width: 390px) calc(100vw - 90px), (max-width: 600px) 300px, (max-width: 1080px) 320px, 350px' }) + (vid ? '<span class="play"><i></i></span>' : '') + '</div>'
          + '<div class="sm-ivf-tx"><b>' + esc(v.title) + '</b><p class="sm-ivf-summary">' + esc(v.summary) + '</p><span>' + esc(who(v)) + '</span></div></a>';
      }).join('');
      honorsTrack.parentNode.setAttribute('aria-label', '우수 수료생 인터뷰');
    }
    if (grid2) grid2.innerHTML = listed.map(function (v) {
      var vid = v.video && v.video.yt;
      return '<a class="iv" href="#' + esc(v.anchor) + '" data-interview-summary="' + esc(v.summary || '') + '"' + (vid ? ' data-yt="' + esc(v.video.yt) + '"' : '') + '>'
        + '<div class="ph">' + visual(v, { alt: false, fit: true, field: 'thumbnail', sizes: '(max-width: 640px) 64px, 304px' }) + (vid ? '<span class="play"><i></i></span><span class="dur" data-field="duration">' + esc(v.video.dur || '') + '</span>' : '') + '</div>'
        + '<div class="tb"><h3 data-field="title">' + esc(v.title) + '</h3>'
        + '<p data-field="summary">' + esc(v.summary) + '</p>'
        + '<div class="by"><span class="av" data-field="cohort">' + coh(v.cohort) + '</span><b data-field="author">' + esc(v.author) + '</b><em data-field="track">' + esc(v.track) + '</em></div></div></a>';
    }).join('');
    if (dots) dots.innerHTML = listed.map(function (v, i) { return '<button type="button" aria-label="' + (i + 1) + '번째 인터뷰"></button>'; }).join('');
    $$('.ivd', ivPane).forEach(function (d) { d.remove(); });
    detailGroup('interview', IV, $('.ivlist', ivPane), 'afterend', function (v, i, pending) {
      var id = esc(v.anchor);
      if (pending) return pendingPage('ivd', id, '#p-iv', '인터뷰', v.title);
      var no = anchorNo(v.anchor, id), vid = v.video && v.video.yt;
      var tag = '<span class="ivtag">' + esc(v.cohort) + '기 · ' + esc(v.track) + '</span>';
      // 영상 구간(2026-11-05): video.start · end(초)가 있으면 재생 단추가 그 구간만 재생(data-yt-start · data-yt-end → stories-sections.js)
      var ytFrom = vid ? ytSec(v.video.start) : 0, ytTo = vid ? ytSec(v.video.end) : 0;
      var hero = vid
        ? '<div class="ivhero ivvid ivhero-avatar" data-yt="' + esc(v.video.yt) + '"' + (ytFrom ? ' data-yt-start="' + ytFrom + '"' : '')
          + (ytTo > ytFrom ? ' data-yt-end="' + ytTo + '"' : '') + '>' + tag + visual(v, { large: true, alt: false, hidden: true })
          + '<button class="ivplay" type="button" aria-label="인터뷰 영상 재생"><i></i></button><span class="dur">' + esc(v.video.dur || '') + '</span></div>'
        : '<div class="ivhero ivhero-avatar">' + tag + visual(v, { large: true, alt: false, field: 'thumbnail' })
          + '<svg class="ivhero-bubble" viewBox="0 0 100 80" aria-hidden="true" focusable="false"><path d="M20 8h60q13 0 13 13v29q0 13-13 13H48L30 76l3-13H20Q7 63 7 50V21Q7 8 20 8Z" fill="white"/><g fill="#6c95dd"><circle cx="33" cy="36" r="4"/><circle cx="50" cy="36" r="4"/><circle cx="67" cy="36" r="4"/></g></svg></div>';
      var qa = (v.qa || []).map(function (q, k) {
        return '<div id="q-' + no + '-' + (k + 1) + '"><div class="q"><i>' + (k + 1) + '</i><span data-field="question">' + esc(q.q) + '</span></div><p class="a" data-field="answer">' + esc(q.a) + '</p></div>';
      }).join('');
      var mainHtml = '<header class="ivintro">' + hero + '<h2 data-field="title">' + esc(v.title) + '</h2><p class="lead" data-field="summary">' + esc(v.summary) + '</p>'
        + '<div class="ivintro-meta"><span data-field="cohort">' + coh(v.cohort) + '</span><span aria-hidden="true"> · </span><span data-field="author">' + esc(v.author) + '</span><span aria-hidden="true"> · </span><span data-field="track">' + esc(v.track) + '</span></div></header>'
        + (vid ? slides(v, v.title) : '')
        + (qa ? '<div class="qa">' + qa + '</div>' : '')
        + (vid && !qa ? '<div class="ivnote aica-state aica-state--compact"><span class="aica-state__badge">요약 준비 중</span><p class="aica-state__copy">영상 인터뷰예요. 위 화면에서 바로 재생됩니다. 영상 내용을 글로 옮긴 요약이 준비되면 이 아래에 함께 실어요.</p></div>' : '');
      var side;
      if (vid) {
        var mm = /^(\d+):(\d{1,2})$/.exec(v.video.dur || ''), len = mm ? (+mm[1] ? +mm[1] + '분 ' : '') + (+mm[2]) + '초' : (v.video.dur || '');
        side = '<h3>이 영상</h3><dl class="ivmeta">' + (len ? '<div><dt>길이</dt><dd>' + esc(len) + '</dd></div>' : '') + '<div><dt>기수</dt><dd>' + esc(v.cohort) + '기</dd></div><div><dt>직군</dt><dd>' + esc(v.track) + '</dd></div></dl>'
          + '<a class="ivyt" href="https://www.youtube.com/watch?v=' + esc(v.video.yt) + (ytFrom ? '&amp;t=' + ytFrom + 's' : '') + '" target="_blank" rel="noopener">유튜브에서 보기 ↗</a>';
      } else {
        side = '<h3>이 인터뷰에서 묻는 것</h3><ol>' + (v.qa || []).map(function (q, k) { return '<li><a href="#q-' + no + '-' + (k + 1) + '">' + esc(q.toc || q.q) + '</a></li>'; }).join('') + '</ol>';
      }
      return '<div class="ivd' + (vid ? ' ivd-v' : '') + '" id="' + id + '"><a class="ivback" href="#p-iv">← 인터뷰 목록</a><div class="ivwrap"><div>' + mainHtml + '</div><aside class="sidebox">' + side + '</aside></div></div>';
    }, 'interviews', 'iv-p');
  }

  /* ── 프로젝트(projects.html) ── */
  var prPane = $('#p-pr');
  if (prPane) {
    var n = PJ.length, pjgrid = $('.pjgrid', prPane);
    // 기수 · 과정 거르기(aica-site 디자인, projects-filter.js): 카드의 data-cohort · data-subject 로 거른다.
    // 과정(data-subject)은 글의 과정(course, 기수 정보 교육과정 트랙), 기수는 기수 · 반(term, 예: 6기 · 01반)의 숫자. 썸네일 위 글자는 반 이름(type) 그대로
    var pjCohort = function (x) { var m = /(\d{1,2})\s*기/.exec(x.term || ''); return x.cohort ? String(x.cohort) : m ? m[1] : ''; };
    var pjSubject = subjectOf;
    // 카드(2026-10-26 사용자 요청): 썸네일(그림만) 아래에 서비스 이름(작은 파란 글씨) · 프로젝트 주제(큰 글씨) · 팀 이름 · 인원.
    // 주제가 없는 예전 글은 서비스 이름을 큰 글씨로. 회색 요약 줄은 주제와 같은 글이라 두지 않아요
    function projectArt(x) {
      return hasThumb(x) ? pjThumb(x, 'illu', null, true) : visual(x, {fit:true});
    }
    function projectCard(x) {
      var topic = pjTopic(x);
      return '<a data-cohort="' + esc(pjCohort(x)) + '" data-subject="' + esc(courseOf(x)) + '" class="pjc" href="#' + esc(x.anchor) + '"><div class="ph">' + projectArt(x) + '<span class="pjc-type" data-field="subject">' + esc(pjSubject(x)) + '</span></div>'
        + '<div class="pjc-tx">' + (topic ? '<p class="pjname">' + esc(projectName(x)) + '</p><h3 data-field="summary">' + esc(topic) + '</h3>' : '<h3 data-field="title">' + esc(projectName(x)) + '</h3>')
        + '<div class="tags">' + (x.tags || []).map(function (t) { return '<span data-field="tag">' + esc(t) + '</span>'; }).join('') + '</div>'
        + '<p class="team" data-field="team">' + esc(x.team) + '</p></div></a>';
    }
    // The static filter owns lazy pagination. Older templates without it keep
    // their original card source so their mobile type controls can read it.
    if (pjgrid && (typeof StoryDetails === 'undefined' || !$('.pj-filter-row', prPane))) {
      pjgrid.innerHTML = PJ.map(projectCard).join('');
    } else if (pjgrid) {
      var items = PJ.map((x,index) => ({
        anchor:x.anchor, cohort:pjCohort(x), subject:String(courseOf(x) || ''), type:String(pjSubject(x) || ''),
        name:String(projectName(x) || ''), topic:String(pjTopic(x) || ''), team:String(x.team || ''), index
      }));
      var cards = new WeakMap();
      function element(markup) {
        var template = document.createElement('template');
        template.innerHTML = markup;
        return template.content.firstElementChild;
      }
      window.StoryProjectLayout = {
        items,
        desktop(item) {
          if (!cards.has(item)) cards.set(item,element(projectCard(PJ[item.index])));
          return cards.get(item);
        },
        artwork(item) { return element(projectArt(PJ[item.index])); }
      };
      pjgrid.replaceChildren();
    }
    // 거르기 단추: DB에 있는 기수(큰 수부터) · 과정(가나다순)만. 첫 단추 '전체'
    var pjChoices = function (box, key, values, label) {
      if (!box) return;
      box.innerHTML = [''].concat(values).map(function (v) {
        return '<button type="button" data-' + key + '="' + esc(v) + '" aria-pressed="' + (v ? 'false' : 'true') + '">' + (v ? esc(label(v)) : '전체') + '</button>';
      }).join('');
    };
    var pjUnique = function (list) { return list.filter(function (v, k) { return v && list.indexOf(v) === k; }); };
    pjChoices($('.pj-cohort-filters', prPane), 'cohort', pjUnique(PJ.map(pjCohort)).sort(function (a, b) { return b - a; }), function (v) { return v + '기'; });
    pjChoices($('.pj-subject-options', prPane), 'subject', pjUnique(PJ.map(courseOf)).sort(function (a, b) { return a.localeCompare(b, 'ko'); }), function (v) { return v; });
    $$('.pjd', prPane).forEach(function (d) { d.remove(); });
    var SECS = ['문제 정의', '주요 기능', '기술 설명'];
    // 칸의 글은 최신 디자인(PR #33)처럼 p.pjph-t 한 문단 그대로. • 로 시작하는 목록은 project-reading.js가 번호 목록(ol.pj-feature-list)으로 바꿔요
    // 프로젝트 정보: 비어 있는 줄은 빼요
    var meta = function (rows) {
      return rows.filter(function (r) { return r[1]; }).map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
    };
    detailGroup('project', PJ, $('.pjlist', prPane), 'afterend', function (x, i, pending) {
      var id = esc(x.anchor);
      if (pending) return pendingPage('pjd', id, '#p-pr', '프로젝트', x.title);
      var prev = PJ[(i - 1 + n) % n], next = PJ[(i + 1) % n];
      var given = x.sections || [];
      var secs = SECS.map(function (s, k) {
        var g = given[k] || {};
        if (!String(g.p || '').trim()) return '';
        return '<section><h3>' + esc(g.h || s) + '</h3><p class="pjph-t">' + esc(g.p) + '</p></section>';
      }).join('');
      var links = (x.links || []).filter(function (l) { return l && l.url; }).map(function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label || '자료 보기') + ' ↗</a>'; }).join('');
      return '<div class="pjd" id="' + id + '"><a class="ivback" href="#p-pr">← 프로젝트 목록</a><div class="ivwrap"><div>'
        + (pjVideo(x) || '<div class="ivhero pjhero"><span class="ivtag">' + esc(pjSubject(x)) + '</span>' + (photos(x, x.title) || (hasThumb(x) ? pjThumb(x, 'illu', PHOTO_DETAIL_SIZES) : visual(x, { hidden: true, sizes: PHOTO_DETAIL_SIZES }))) + '</div>')
        + '<span class="pjno">' + pad2(i + 1) + '</span><h2>' + esc(x.title) + '</h2><p class="lead">' + esc(x.summary) + '</p>'
        // 서비스 소개(2026-10-27, 글쓰기 화면 '서비스 소개'): 프로젝트 주제 바로 아래, 다른 칸과 같은 카드(파란 윗선)
        + (x.serviceIntro ? '<section class="pjintro"><h3>서비스 소개</h3><p class="pjph-t" data-field="serviceIntro">' + esc(x.serviceIntro) + '</p></section>' : '')
        + '<div class="pjtags">' + (x.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>'
        + (secs ? '<div class="pjsec">' + secs + '</div>' : '')
        + (links ? '<div class="pjlinks">' + links + '</div>' : '')
        + '</div><aside class="sidebox pjside"><h3>프로젝트 정보</h3><dl class="ivmeta">' + meta([['팀', x.team], ['과정', courseOf(x) || pjSubject(x)], ['전공', courseOf(x) ? pjSubject(x) : ''], ['기수·반', x.term]]) + '</dl>'
        + (n > 1 ? '<div class="pjnav"><a href="#' + esc(prev.anchor) + '"><small>이전 프로젝트</small>' + esc(prev.title) + '</a><a href="#' + esc(next.anchor) + '"><small>다음 프로젝트</small>' + esc(next.title) + '</a></div>' : '')
        + '</aside></div></div>';
    }, 'projects', 'pj-p');
  }

  /* ── 기수 기록(cohorts.html): 인스타형 화면(cohort-v3.js)이 읽는 카드 ──
     관리자 › 기수별 이모저모(cohort_stories 표)에 게시중인 글로 늘 다시 그려요. 글이 없으면 비워서 story-state.js 가 페이지 상태 화면을 보여 줘요.
     카드 모양은 cohort-v3.js 가 읽는 그대로: 기수(.cg → 기수 칩 · aica_7th) · 날짜(.dt 2026. 08. 20 → 달별 동그라미) · 제목(h3) ·
     글 창 첫 문단(p) · 그림(.illu) · 유튜브(data-yt) · 나머지 문단([data-story-body] p) · 사진 여러 장([data-story-photos] img) · 주소(id st-3) */
  var cvData = document.getElementById('cv3-data');
  if (cvData) {
    function cohortCard(c) {
      var vid = c.video && c.video.url, body = Array.isArray(c.body) ? c.body : (c.body ? [c.body] : []);
      var yt = vid ? /[?&]v=([\w-]{6,20})/.exec(c.video.url) : null;
      // 사진이 없는 영상 글은 유튜브 썸네일을 그림으로
      var pic = !hasPhoto(c) && yt
        ? '<img class="illu" src="https://i.ytimg.com/vi/' + esc(yt[1]) + '/hqdefault.jpg" alt="" loading="lazy" decoding="async" width="480" height="360" data-field="thumbnail">'
        : visual(c, { fit: true, field: 'thumbnail' });
      // 영상 구간(2026-11-05): video.start · end(초)가 있으면 글 창의 재생 단추가 그 구간만(data-yt-start · data-yt-end → cohort-v3.js)
      var ytFrom = vid ? ytSec(c.video.start) : 0, ytTo = vid ? ytSec(c.video.end) : 0;
      return '<a class="st c' + esc(c.cohort) + '" href="#"' + (c.anchor ? ' id="' + esc(c.anchor) + '"' : '') + (vid ? ' data-yt="' + esc(c.video.url) + '"' : '')
        + (ytFrom ? ' data-yt-start="' + ytFrom + '"' : '') + (ytTo > ytFrom ? ' data-yt-end="' + ytTo + '"' : '')
        + ' style="--c:' + (COH_COLOR[c.cohort] || '#2B2D31') + '"><div class="ph">' + pic + (vid ? '<span class="play"><i></i></span>' + (c.video.dur ? '<span class="dur">' + esc(c.video.dur) + '</span>' : '') : '') + '</div>'
        + '<h3 data-field="title">' + esc(c.title) + '</h3><p data-field="body">' + esc((D.view === 'summary' && !body.length ? c.summary : body[0]) || '') + '</p>'
        + '<div class="mt"><span class="cg" data-field="cohort">' + esc(c.cohort) + '기</span><span class="dt" data-field="date">' + esc(c.date || '') + '</span></div>'
        + (body.length > 1 ? '<div data-story-body hidden>' + body.slice(1).map(function (b) { return '<p>' + esc(b) + '</p>'; }).join('') + '</div>' : '')
        + '<div data-story-tags hidden>' + (Array.isArray(c.tags) ? c.tags : []).filter(function (t) { return typeof t === 'string'; }).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>'
        + '<div data-story-photos hidden>' + photoList(c).map(function (p) { return imgTag(p, 'st-ph', true); }).join('') + '</div>'
        + '</a>';
    }
    cvData.innerHTML = CO.map(cohortCard).join('');
    if (D.view === 'summary' && typeof StoryDetails !== 'undefined') {
      cvData.loadStory = function (anchor) {
        return StoryDetails.load(anchor, 'cohorts').then(function (item) {
          var card = document.createElement('template');
          card.innerHTML = cohortCard(publicItem(item, 'st-'));
          return card.content.firstElementChild;
        });
      };
    }
  }

  /* ── 한눈에 보기(index.html) ── */
  if (page.classList.contains('stories-hub')) {
    // 우수 수료생 대표는 받은 순서의 첫 글, 옆 목록은 일반 사진 인터뷰 3개로 고릅니다.
    var honorsFeature = !!$('#hub-interviews[data-honors-feature]');
    var ivs = (honorsFeature ? photoIV : IV).filter(function (v) { return (!honorsFeature || !v.honors) && hasPhoto(v) && !(v.video && v.video.yt); });
    // 우수 수료생 칸이 없는 예전 페이지의 사진 없는 글 대체는 유지합니다.
    if (!ivs.length && !honorsFeature) ivs = IV.filter(function (v) { return !(v.video && v.video.yt); });
    var ivBox = $('.hb-ivg');
    if (ivBox) {
      var f = honorsFeature ? IV.filter(function (v) { return v.honors; })[0] : ivs[0];
      var list = '<ul class="hb-ivl" role="list">' + ivs.slice(honorsFeature ? 0 : 1, honorsFeature ? 3 : 4).map(function (v) {
        return '<li><a href="interviews.html#' + esc(v.anchor) + '"><span class="hb-ivl-ph">' + hubVisual(v) + '</span>'
          + '<div><h3>' + esc(v.title) + '</h3><span class="hb-by">' + esc(who(v)) + '</span></div></a></li>';
      }).join('') + '</ul>';
      // 큰 카드의 꼬리표는 페이지 문구를 유지하고, 이미지·제목·요약·작성자는 같은 최신 인터뷰에서 채웁니다.
      var card = $('.hb-ivf', ivBox);
      // 페이지에 시안 사진 · 목록이 남아 있으면(빌드가 비우지 않은 페이지) 겹치지 않게 먼저 지워요
      if (card && !honorsFeature) $$(':scope > .hb-ivf-ph, :scope > .hb-ph, :scope > svg', card).forEach(function (el) { el.remove(); });
      $$('.hb-ivl', ivBox).forEach(function (el) { el.remove(); });
      if (card && honorsFeature && !f) {
        card.setAttribute('href', 'interviews.html#iv-honors-1');
        var honorsPhoto = $('.hb-ivf-ph', card);
        if (honorsPhoto) {
          honorsPhoto.classList.remove('honors-placeholder');
          honorsPhoto.innerHTML = '<img class="hb-ph" src="assets/interview-avatars/avatar-card-10-1080.webp" alt="" width="1080" height="675" loading="eager" fetchpriority="high" decoding="async">';
        }
        card.classList.add('aica-state','aica-state--compact');
        if(honorsPhoto)honorsPhoto.hidden=true;
        var badge=document.createElement('span');badge.className='aica-state__badge';badge.textContent='준비 중';card.prepend(badge);
        var honorsTitle = $('h3', card), honorsQuote = $('.hb-ivf-q', card);
        if(honorsTitle)honorsTitle.classList.add('aica-state__title');
        if(honorsQuote)honorsQuote.classList.add('aica-state__copy');
        if (honorsTitle) honorsTitle.textContent = '우수 수료생 인터뷰를 준비하고 있어요';
        if (honorsQuote) honorsQuote.textContent = '배움 이후의 도전과 성장을 곧 전해드릴게요.';
        var honorsBy = $('.hb-by', card);
        if (honorsBy) { honorsBy.textContent = ''; honorsBy.hidden = true; }
        ivBox.insertAdjacentHTML('beforeend', list);
      } else if (card && f) {
        card.setAttribute('href', 'interviews.html#' + f.anchor);
        if (honorsFeature) {
          var featuredPhoto = $('.hb-ivf-ph', card);
          if (featuredPhoto) {
            featuredPhoto.classList.remove('honors-placeholder');
            featuredPhoto.innerHTML = hubVisual(f, { large: true, priority: true });
          }
        } else {
          card.insertAdjacentHTML('afterbegin', '<span class="hb-ivf-ph">' + hubVisual(f, { large: true, priority: true }) + '</span>');
        }
        var h = $('h3', card), by = $('.hb-by', card), em = $('em', card), q = $('.hb-ivf-q', card);
        if (h) h.textContent = f.title || '';
        if (by) { by.textContent = who(f); by.hidden = !by.textContent.trim(); }
        if (em) em.hidden = !em.textContent.trim();
        if (q) q.textContent = f.summary || '';
        if (q) q.hidden = !q.textContent.trim();
        ivBox.insertAdjacentHTML('beforeend', list);
      } else if (card) {
        card.hidden = true;   // 보여 줄 인터뷰가 없으면 빈 카드 대신 숨김
      } else {
        // 예전 페이지(큰 카드가 HTML에 없음): 꼬리표 · 인용 없이 통째로
        ivBox.innerHTML = f ? '<a class="hb-ivf" href="interviews.html#' + esc(f.anchor) + '">' + '<span class="hb-ivf-ph">' + hubVisual(f, { large: true, priority: true }) + '</span>'
          + '<div class="hb-ivf-tx"><h3>' + esc(f.title) + '</h3><span class="hb-by">' + esc(who(f)) + '</span></div></a>' + list : '';
      }
    }
    // 후기: 흐르는 한마디(최근 12개, 끊김 없이 두 번) + 포스트잇 4장(관리자가 '한눈에 보기에 보이기'로 고른 글, 모자라면 분류 · 기수가 겹치지 않게 채움)
    var tick = REV.slice(0, 12), lq = $('.hb-lq-t');
    if (lq) {
      var one = tick.map(function (r) {
        return '<a href="#' + esc(r.anchor) + '"%HIDE%><span class="t">' + esc(r.ticker || firstSentence(r.summary)) + '</span><span class="a">' + esc(r.author) + ' · ' + esc(r.cohort) + '기</span></a>';
      }).join('');
      lq.innerHTML = one.replace(/%HIDE%/g, '') + one.replace(/%HIDE%/g, ' aria-hidden="true" tabindex="-1"');
    }
    var pis = $('.hb-pis');
    if (pis) {
      var picked = REV.filter(function (r) { return r.hub; });
      var usedCat = {}, usedCoh = {};
      picked.forEach(function (r) { usedCat[catKey(r)] = 1; usedCoh[r.cohort] = 1; });
      CAT_ORDER.forEach(function (k) {
        if (picked.length >= 4 || usedCat[k]) return;
        var r = REV.slice(12).filter(function (x) { return catKey(x) === k && !usedCoh[x.cohort] && picked.indexOf(x) < 0; })[0];
        if (r) { picked.push(r); usedCat[k] = 1; usedCoh[r.cohort] = 1; }
      });
      REV.forEach(function (r) { if (picked.length < 4 && picked.indexOf(r) < 0 && tick.indexOf(r) < 0) picked.push(r); });
      picked = picked.slice(0, 4).map(function (r, i) { return { r: r, i: i }; })
        .sort(function (a, b) { return CAT_ORDER.indexOf(catKey(a.r)) - CAT_ORDER.indexOf(catKey(b.r)) || a.i - b.i; }).map(function (x) { return x.r; });
      pis.innerHTML = picked.map(function (r) {
        return '<a class="hb-pi" href="#' + esc(r.anchor) + '"><span class="hb-pi-c"><b>' + cat(r).name + '</b><span>' + esc(r.cohort) + '기</span></span>'
          + '<h3>' + esc(r.title) + '</h3><p>' + esc(r.summary) + '</p>' + hubReviewByline(r) + '</a>';
      }).join('');
    }
    // 프로젝트: 유형이 겹치지 않게 3개(목록 순서대로 유형마다 첫 글), 모자라면 다음 글로
    var pjBox = $('.hb-pjs');
    if (pjBox) {
      var types = {}, three = [];
      PJ.forEach(function (x) { if (three.length < 3 && !types[x.type]) { types[x.type] = 1; three.push(x); } });
      PJ.forEach(function (x) { if (three.length < 3 && three.indexOf(x) < 0) three.push(x); });
      pjBox.innerHTML = three.map(function (x) {
        return '<a class="hb-pjc" href="projects.html#' + esc(x.anchor) + '"><span class="hb-pjc-ph">' + (hasThumb(x) ? pjThumb(x, null, null, true) : hubVisual(x, {sizes:PHOTO_CARD_SIZES})) + '<span class="hb-pjc-type">' + esc(subjectOf(x)) + '</span></span>'
          + '<div class="hb-pjc-tx">' + (pjTopic(x) ? '<p class="hb-pjc-nm">' + esc(projectName(x)) + '</p><h3>' + esc(pjTopic(x)) + '</h3>' : '<h3>' + esc(projectName(x)) + '</h3>')
          + '<span class="hb-pjc-tm">' + esc(x.team) + '</span></div></a>';   // 프로젝트 카드와 같게: 서비스 이름 · 프로젝트 주제 · 팀
      }).join('');
    }
    // 기수별 이모저모: 행사 단계마다 사진 있는 기록 하나(영상 먼저, 그다음 최근), 기수가 겹치지 않게. 영상은 유튜브로, 기록은 그 글 창으로
    var mos = $('.hb-mos');
    if (mos) {   // 게시중인 기수별 이모저모 글이 없으면 HTML에 적힌 사진 묶음 그대로
      var usedC = {}, five = [];
      STAGES.forEach(function (g) {
        var cand = CO.filter(function (c) { return hasPhoto(c) && (c.tags || []).indexOf(g) >= 0 && !usedC[c.cohort] && five.indexOf(c) < 0; });
        var pick = cand.filter(function (c) { return c.video && c.video.url; })[0] || cand[0];
        if (pick) { usedC[pick.cohort] = 1; five.push(pick); }
      });
      CO.forEach(function (c) { if (five.length < 5 && hasPhoto(c) && five.indexOf(c) < 0 && !usedC[c.cohort]) { usedC[c.cohort] = 1; five.push(c); } });
      // DB 글(2026-10-20)에는 행사 태그가 없어요: 기수가 겹쳐도 사진 있는 최근 글로 채우고, 5장이 안 되면 HTML 사진 묶음 그대로
      CO.forEach(function (c) { if (five.length < 5 && hasPhoto(c) && five.indexOf(c) < 0) five.push(c); });
      mos.innerHTML = five.map(function (c, i) {
        var vid = c.video && c.video.url;
        var title = esc(c.title).replace(/ — (.+)$/, ' — <span class="hb-nw">$1</span>');
        return '<li' + (i === 0 ? ' class="is-big"' : '') + '><a href="' + ('#' + esc(c.anchor || ('st-' + c.id))) + '">'
          + hubVisual(c, {sizes:i === 0 ? '(max-width: 1199px) calc(100vw - 40px), 616px' : '(max-width: 1199px) calc((100vw - 52px) / 2), 308px'})
          + '<div class="hb-mos-tx"><span class="hb-mos-m">' + esc(c.cohort) + '기<span class="hb-mos-d"> · ' + esc(c.date || '') + '</span>'
          + (vid && c.video.dur ? '<span class="hb-vd"><span class="hb-sr">영상, 길이 </span>' + esc(c.video.dur) + '</span>' : '') + '</span>'
          + '<h3>' + title + '</h3>' + (i === 0 ? '<p>' + esc(c.summary || (Array.isArray(c.body) ? c.body[0] : c.body) || '') + '</p>' : '') + '</div></a></li>';
      }).join('');
    }
  }

  if (css) { var st = document.createElement('style'); st.setAttribute('data-stories', 'generated'); st.textContent = css; document.head.appendChild(st); }

  /* ── 주소(#…)가 방금 그린 글을 가리키면 다시 짚어 창이 열리게 해요(공유 링크 · 미리보기) ── */
  var originalHash = location.hash;
  var lazyDetails = typeof StoryDetails !== 'undefined';
  var hash = lazyDetails ? StoryDetails.canonical(originalHash) : safe ? safe.legacyHash(originalHash) : originalHash;
  if (lazyDetails) StoryDetails.sync();
  if (lazyDetails && hash !== originalHash) return;
  if (hash && hash.length > 1) {
    var id = Site.decodeHash(hash.slice(1));
    var target = id ? document.getElementById(id) : null;
    if (target && (target.classList.contains('ov') || target.classList.contains('ivd') || target.classList.contains('pjd'))) {
      history.replaceState(null, '', location.pathname + location.search);
      location.replace(hash); // 방문 기록은 늘리지 않고 다시 짚기
    } else if (hash !== originalHash) {
      location.replace(hash);
    }
  }
})();

/* Desktop review paging: intersect the published card metadata before slicing.
   Mobile keeps its independent ten-card projection; IDs, links and radios remain compatible. */
(function () {
  'use strict';
  if (document.documentElement && document.documentElement.dataset.reviewSource === 'spring') return;
  var section = document.getElementById && document.getElementById('p-rev');
  if (!section || section.hasAttribute('data-review-paging')) return;
  function init() {
    if (section.hasAttribute('data-review-paging')) return;
    var cards = [].slice.call(section.querySelectorAll('.idgrid .idc'));
    var rows = [].slice.call(section.querySelectorAll('.rvlist .rvr'));
    var pager = section.querySelector('.pager');
    if (!cards.length || !pager) return; // Shared published-empty/error states own an empty collection.
    var radios = [].slice.call(section.querySelectorAll('input[name="pgn"]'));
    var page = 1, pageSize = 12;
    var count = document.createElement('p');
    count.className = 'review-count story-state--desktop'; count.setAttribute('role', 'status');
    section.querySelector('.idgrid').before(count);
    section.setAttribute('data-review-paging', '');
    pager.classList.add('cpager'); pager.setAttribute('role', 'navigation'); pager.setAttribute('aria-label', '후기 페이지');
    radios.forEach(function (radio) { radio.setAttribute('tabindex', '-1'); radio.setAttribute('aria-hidden', 'true'); });

    function button(label, value, disabled) {
      var node = document.createElement('button'); node.type = 'button'; node.textContent = label; node.disabled = disabled;
      node.setAttribute('aria-label', label === '←' ? '이전 페이지' : label === '→' ? '다음 페이지' : value + '페이지');
      if (String(value) === label && page === value) node.setAttribute('aria-current', 'page');
      node.addEventListener('click', function () {
        page = value; refresh();
        var current = pager.querySelector('button[aria-current="page"]');
        if (current) current.focus({ preventScroll: true });
        var filters = section.querySelector('.filters');
        if (filters) filters.scrollIntoView({ block: 'start', behavior: SiteUI.motion().matches ? 'auto' : 'smooth' });
      });
      return node;
    }
    function refresh() {
      if (typeof StoryDetails !== 'undefined' && !cards[0].isConnected) return;
      var category = section.querySelector('input[name="rc"]:checked');
      category = category ? category.id.slice(3) : 'all';
      var cohort = section.querySelector('input[name="fco"]:checked');
      var cohortId = cohort ? cohort.id : 'fco_all';
      var known = /^fco_([0-4])$/.exec(cohortId), extra = /^fco_c(\d+)$/.exec(cohortId);
      cohort = known ? String(7 - Number(known[1])) : extra ? extra[1] : '';
      var matching = cards.map(function (card, index) { return { card: card, index: index }; }).filter(function (entry) {
        return (category === 'all' || entry.card.classList.contains('cat-' + category)) &&
          (!cohort || entry.card.classList.contains('coh' + cohort));
      });
      var total = Math.max(1, Math.ceil(matching.length / pageSize));
      page = Math.max(1, Math.min(page, total));
      var visible = new Set(matching.slice((page - 1) * pageSize, page * pageSize).map(function (entry) { return entry.index; }));
      cards.forEach(function (card, index) {
        var shown = String(visible.has(index)); card.setAttribute('data-review-visible', shown);
        if (rows[index]) rows[index].setAttribute('data-review-visible', shown);
      });
      radios.forEach(function (radio) { radio.checked = radio.id === 'pgn' + page; });
      count.textContent = matching.length + '개의 후기';
      // StoryState also toggles `hidden`; this result count keeps a single-page pager
      // suppressed after its empty-state check, without changing the shared owner.
      section.setAttribute('data-review-pages', matching.length ? total : 0);
      pager.replaceChildren(); pager.hidden = matching.length <= pageSize;
      if (matching.length > pageSize) {
        pager.appendChild(button('←', page - 1, page === 1));
        var first = Math.max(1, Math.min(page - 2, total - 4));
        for (var n = first; n <= Math.min(total, first + 4); n++) pager.appendChild(button(String(n), n, false));
        pager.appendChild(button('→', page + 1, page === total));
      }
    }
    section.addEventListener('change', function (event) {
      if (event.target.name === 'rc' || event.target.name === 'fco') { page = 1; refresh(); }
      else if (event.target.name === 'pgn') { page = Number(event.target.id.slice(3)) || 1; refresh(); }
    });
    section.addEventListener('reviews:reset', function () { page = 1; refresh(); });
    addEventListener('hashchange', refresh);
    section.addEventListener('stories:review-layout', refresh);
    refresh();
  }
  section.addEventListener('stories:review-layout', init);
  init();
})();
/* End desktop review paging. */

/* ---------- 글 안 사진 넘김(.phs, 위에서 그림): 화살표 · 손가락으로 밀기 · 키보드 ←→ (백오피스) ----------
   팀 사이트에서는 stories.js에 있던 부분이에요. 최신 디자이너 stories.js를 그대로 두려고 이 파일로 옮겼어요. */
(function () {
  'use strict';
  var reduce = typeof Site !== 'undefined' && Site.reduce != null ? Site.reduce : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function step(track, dir) { track.scrollBy({ left: dir * track.clientWidth, behavior: reduce ? 'instant' : 'smooth' }); }
  function sync(track) {
    var box = track.closest('.phs'), n = track.children.length;
    var i = Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
    var no = box.querySelector('.phs-count b'), prev = box.querySelector('.phs-btn.prev'), next = box.querySelector('.phs-btn.next');
    if (no) no.textContent = i + 1;
    if (prev) prev.disabled = i <= 0;
    if (next) next.disabled = i >= n - 1;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.phs-btn'); if (!b) return;
    e.preventDefault();
    var track = b.closest('.phs').querySelector('.phs-track');
    if (track) step(track, b.classList.contains('next') ? 1 : -1);
  });
  // 스크롤은 거품이 안 올라와서 잡는 단계(capture)에서 받아요
  document.addEventListener('scroll', function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains('phs-track')) return;
    clearTimeout(t.phsTimer); t.phsTimer = setTimeout(function () { sync(t); }, 50);
  }, true);
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t.classList || !t.classList.contains('phs-track') || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault(); e.stopPropagation();
    step(t, e.key === 'ArrowRight' ? 1 : -1);
  }, true);

  // 썸네일 그림 맞추기(2026-10-26 사용자 요청): 배경이 투명한 그림(기본 썸네일 같은 그림)은 흰 바탕 여백 안에 두고,
  // 사진처럼 투명한 곳이 없는 그림은 썸네일 칸 크기에 맞춰 꽉 채워요(pjthumb-full — 비율이 달라도 칸을 다 덮고 넘치는 가장자리는 잘림, 2026-10-27 사용자 요청: 뒤 흐린 배경 없이).
  // 그림이 오면 작은 캔버스에 그려 투명한 곳이 있는지 봐요. 다른 주소라 읽지 못하는 그림은 예전처럼 여백 안에
  function fitThumb(img) {
    var box = img.parentNode;
    if (!box || box.hasAttribute('data-fit')) return;
    var full = false;
    try {
      var c = document.createElement('canvas'), n = 40, g, a, i;
      c.width = c.height = n;
      g = c.getContext('2d'); g.drawImage(img, 0, 0, n, n);
      a = g.getImageData(0, 0, n, n).data; full = true;
      for (i = 3; i < a.length; i += 4) if (a[i] < 250) { full = false; break; }
    } catch (e) { full = false; }
    box.setAttribute('data-fit', full ? 'full' : 'art');
    if (full) box.classList.add('pjthumb-full');
  }
  // 프로젝트 시연 영상(2026-10-27): 재생 단추를 누르면 그 자리에서 유튜브(쿠키 없는 주소)로 재생, 상세를 떠나면 다시 대표 그림으로(소리가 계속 나지 않게)
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pjvid .ivplay'); if (!b) return;
    var box = b.closest('.pjvid'), id = box.getAttribute('data-pj-yt') || '';
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return;
    e.preventDefault();
    box.pjPoster = box.pjPoster || box.innerHTML;
    var f = document.createElement('iframe');
    var start = +box.getAttribute('data-pj-start') || 0, end = +box.getAttribute('data-pj-end') || 0;   // 시연 구간(2026-11-03)
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1'
      + (start > 0 ? '&start=' + Math.floor(start) : '') + (end > start ? '&end=' + Math.floor(end) : '');
    f.title = '프로젝트 시연 영상'; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
    var tag = box.querySelector('.ivtag');
    box.replaceChildren(); if (tag) box.appendChild(tag); box.appendChild(f); f.focus();
  });
  if (window.addEventListener) window.addEventListener('hashchange', function () {
    [].forEach.call(document.querySelectorAll('.pjvid'), function (box) {
      var d = box.closest('.pjd');
      if (box.pjPoster && box.querySelector('iframe') && (!d || location.hash !== '#' + d.id)) box.innerHTML = box.pjPoster;
    });
  });

  // load 는 거품이 안 올라와서 잡는 단계에서, 이미 와 있는 그림은 바로
  document.addEventListener('load', function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('pjthumb-i')) fitThumb(t);
  }, true);
  function fitLoadedThumbs(root) {
    [].forEach.call(root.querySelectorAll('.pjthumb-i'), function (img) {
      if (img.complete && img.naturalWidth) fitThumb(img);
    });
  }
  document.addEventListener('stories:project-page', function (event) { fitLoadedThumbs(event.target); });
  if (document.querySelectorAll) fitLoadedThumbs(document);
})();
