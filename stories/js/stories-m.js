/* 선배들의 이야기 모바일(10-16). 보이는 규칙은 css/stories-m.css(600px 이하).
   1) 메뉴 탭: 짧은 이름(All → 전체, 기수별 이모저모 → 기수 기록), 탭이 헤더 뒤로 지나가면 같은 탭을 아래 고정
   2) 옆으로 넘기는 줄(한눈에 보기의 후기 포스트잇 · 프로젝트): 오른쪽에 더 있으면 다음 화살표, 넘기면 이전 화살표
   3) 인터뷰: 카드 중앙 화살표 · 제목과 기수 탭 정렬 · 짧은 목록
   4) 기수 기록: 캔버스 시안 배치(계정 줄 → 동그라미 + 숫자 3칸 → 소개 → 회색 버튼 2개), 달별 고정 스토리 화살표, 전체/영상 탭
   5) 프로젝트: 유형별 아코디언 · 후기: 메모지 2열, 본문 펼침, 교차 필터와 페이지네이션
   웹(601px 이상)은 그대로. */
(function(){
  var mq = matchMedia('(max-width: 600px)');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return [].slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var ARROW = { prev: 'm14 5-7 7 7 7', next: 'm10 5 7 7-7 7' };
  var SHORT = { overview: '전체', cohorts: '기수 기록' };

  function initTabs(){
    var lnb = $('#siteLnb');
    var list = lnb && $('.lnb-list', lnb);
    if (!list || $('.sm-dock')) return;
    /* 짧은 이름은 600px 이하에서만(웹은 원래 이름) */
    var names = $$('a', list).map(function(a){ return { a: a, full: a.textContent, short: SHORT[a.dataset.sub] }; });
    var label = function(){
      names.forEach(function(n){ if (n.short) n.a.textContent = mq.matches ? n.short : n.full; });
    };
    label();
    var dock = document.createElement('nav');
    dock.className = 'sm-dock';
    dock.setAttribute('aria-label', (lnb.getAttribute('aria-label') || '메뉴') + '(아래 고정)');
    document.body.appendChild(dock);
    var copy = function(){
      dock.innerHTML = '';
      var c = list.cloneNode(true);
      c.removeAttribute('data-scroll-fade'); c.classList.remove('fade-l', 'fade-r');
      dock.appendChild(c);
    };
    copy();
    /* 지금 항목 표시(site.js가 바꾸면 아래 탭도 따라감) */
    new MutationObserver(copy).observe(list, { subtree: true, attributes: true, attributeFilter: ['aria-current'], childList: true, characterData: true });
    /* 기준선: 헤더 아래. 얇은 제목 띠(.st-mhf, js/mast-fix.js)가 붙어 있으면 그 아래 */
    var hdr = function(){
      var h = $('#siteHeader'), y = h ? h.getBoundingClientRect().bottom : 60;
      var f = $('.st-mhf.on');
      return f ? Math.max(y, f.getBoundingClientRect().bottom) : y;
    };
    var raf;
    var onScroll = function(){
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function(){
        if (!mq.matches){ root.classList.remove('sm-docked'); return; }
        root.classList.toggle('sm-docked', list.getBoundingClientRect().bottom <= hdr());
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    if (mq.addEventListener) mq.addEventListener('change', function(){ label(); onScroll(); });
    onScroll();
  }

  function rail(scroller, kind, label){
    if (!scroller || scroller.parentNode.classList.contains('sm-rail-box')) return;
    var box = document.createElement('div');
    box.className = 'sm-rail-box sm-rail-box--' + kind;
    scroller.parentNode.insertBefore(box, scroller);
    box.appendChild(scroller);
    arrows(box, scroller, label, function(){ return scroller.clientWidth * 0.8; });
  }

  /* 화살표(알아보기 모바일과 같은 모양): 오른쪽에 더 있으면 다음, 넘기면 이전 */
  function arrows(box, scroller, label, step){
    var mk = function(dir){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sm-arrow sm-arrow--' + dir;
      b.setAttribute('aria-label', (dir === 'prev' ? '이전 ' : '다음 ') + label);
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ARROW[dir] + '"/></svg>';
      b.addEventListener('click', function(){
        scroller.scrollBy({ left: (dir === 'prev' ? -1 : 1) * step(), behavior: reduce.matches ? 'auto' : 'smooth' });
      });
      box.appendChild(b); return b;
    };
    var p = mk('prev'), n = mk('next');
    var upd = function(){
      p.hidden = scroller.scrollLeft <= 4;
      n.hidden = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4;
    };
    scroller.addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd); upd(); setTimeout(upd, 600);
  }
  /* 3) 인터뷰 페이지: 추천 인터뷰 카드 넘김(글귀 있는 인터뷰) + 전체 인터뷰 개수 */
  function interviewQuote(a){
    // Spring은 모든 카드 변형에 공개 quote를 전달합니다. 정적 시안은 기존 인용문을 읽습니다.
    var quote = a.getAttribute('data-interview-quote');
    return (quote !== null ? quote : (($('.ivq', a) || {}).textContent || '')).trim();
  }
  function initInterviews(){
    var head = $('#p-iv .ivlist > .sh-row');
    var src = $$('#p-iv .ivgrid a.iv').filter(function(a){ return interviewQuote(a); });
    if (!head || !src.length || $('.sm-ivf')) return;
    var box = document.createElement('section');
    box.className = 'sm-ivf'; box.setAttribute('aria-label', '추천 인터뷰');
    var track = document.createElement('div'); track.className = 'sm-ivf-track';
    src.forEach(function(a){
      var c = document.createElement('a'); c.className = 'sm-ivf-c'; c.href = a.getAttribute('href');
      var ph = $('.ph', a).cloneNode(true);
      $$('[id]', ph).forEach(function(x){ x.removeAttribute('id'); });
      var dur = $('.dur', ph);
      if (dur){ var t = document.createElement('span'); t.className = 'sm-ivf-tag'; t.textContent = '▶ 영상 ' + dur.textContent; dur.remove(); ph.appendChild(t); }
      c.appendChild(ph);
      var tx = document.createElement('span'); tx.className = 'sm-ivf-tx';
      var b = document.createElement('b'); b.textContent = ($('h3', a) || {}).textContent || '';
      var q = document.createElement('q'); q.textContent = interviewQuote(a);
      var by = $('.by', a), m = document.createElement('span');
      m.textContent = [($('.av', by) || {}).textContent, ($('b', by) || {}).textContent, ($('em', by) || {}).textContent].filter(Boolean).join(' · ');
      tx.appendChild(b); tx.appendChild(q); tx.appendChild(m); c.appendChild(tx);
      track.appendChild(c);
    });
    box.appendChild(track);
    head.parentNode.insertBefore(box, head.nextSibling);
    var cards = $$('.sm-ivf-c', track);
    var on = function(){
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
      cards.forEach(function(c, i){ var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd){ bd = d; best = i; } });
      cards.forEach(function(c, i){ c.classList.toggle('is-on', i === best); });
    };
    track.addEventListener('scroll', function(){ requestAnimationFrame(on); }, { passive: true });
    on();
    arrows(box, track, '인터뷰', function(){ return cards[0].offsetWidth + 12; });
  }

  /* 4) 기수 기록(cohort-v3.js가 그린 화면을 600px 이하에서만 시안 배치로) */
  var BADGE = '<svg class="sm-cv-badge" viewBox="0 0 24 24" aria-label="공식 계정" role="img"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>';
  var ICON = { all: 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18', video: 'M3 4h18v16H3zM3 9h18M8 4l3 5M14 4l3 5M10 12v5l4-2.5z' };
  function initCohorts(){
    var root = $('#cv3');
    if (!root || !root.cv3View || root.dataset.sm) return;
    root.dataset.sm = '1';
    var official = (typeof SITE_LINKS !== 'undefined' && SITE_LINKS.official && SITE_LINKS.official.url) || 'https://support.gj-aischool.or.kr/fo/main';
    var view = 'all', busy = false;
    var hlDone = null;
    var lay = function(){
      if (!mq.matches){ var pf = $('.cv3-prof', root); if (pf) pf.classList.remove('sm-cv-prof'); return; }
      if (busy) return;
      var prof = $('.cv3-prof', root), gt = $('.cv3-gt', root);
      if (!prof || !gt) return; // 발행된 기수 기록이 없는 Spring 빈 상태
      busy = true;
      var info = $('.cv3-info', prof);
      if (info && !$('.sm-cv-top', prof)){
        var acc = $('.cv3-acc', prof), ring = $('.cv3-ring', prof), stat = $('.cv3-stat', prof), bio = $('.cv3-bio', prof), db = $('.cv3-dbtn', prof);
        var top = document.createElement('div'); top.className = 'sm-cv-top';
        top.appendChild(acc); top.insertAdjacentHTML('beforeend', BADGE);
        var mid = document.createElement('div'); mid.className = 'sm-cv-mid';
        mid.appendChild(ring); mid.appendChild(stat);
        var btns = document.createElement('div'); btns.className = 'sm-cv-btns';
        if (db) btns.appendChild(db);
        var a = document.createElement('a'); a.className = 'sm-cv-off'; a.href = official; a.target = '_blank'; a.rel = 'noopener';
        a.innerHTML = '공식 홈페이지 <span aria-hidden="true">↗</span>';
        btns.appendChild(a);
        prof.replaceChildren(top, mid, bio, btns);
        prof.classList.add('sm-cv-prof');
      }
      /* 보기 방식 탭(전체 게시물 · 영상만) */
      var tabs = $('.sm-cv-views', root);
      if (!tabs){
        tabs = document.createElement('div'); tabs.className = 'sm-cv-views'; tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', '보기 방식');
        ['all', 'video'].forEach(function(k){
          var b = document.createElement('button'); b.type = 'button'; b.dataset.v = k;
          b.addEventListener('click', function(){ if (view !== k){ view = k; root.cv3View(k); } });
          tabs.appendChild(b);
        });
        gt.parentNode.insertBefore(tabs, gt);
      }
      var nums = $$('.cv3-stat b', root).map(function(b){ return b.textContent; });
      $$('button', tabs).forEach(function(b){
        var k = b.dataset.v;
        b.setAttribute('aria-pressed', String(k === view));
        b.setAttribute('aria-label', (k === 'all' ? '전체 게시물 ' : '영상만 보기 ') + (k === 'all' ? nums[0] : nums[1]) + '개');
        b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICON[k] + '"/></svg><span>' + (k === 'all' ? nums[0] : nums[1]) + '</span>';
      });
      /* 기간을 한 줄로 유지하되 값은 발행된 기록 그대로 사용합니다. */
      var rg = $$('.cv3-stat b', root)[2];
      if (rg) rg.textContent = rg.textContent.replace(/\s+/g, '');
      /* 교육과정 고정 칸: 시안처럼 한 칸, 누르면 펼침 */
      var pin = $('.cv3-pin', root);
      if (pin && !pin.dataset.sm){
        pin.dataset.sm = '1';
        var tracks = $('.cc', pin); tracks.id = 'sm-cv-tracks';
        var more = document.createElement('button'); more.type = 'button'; more.className = 'sm-pin-more'; more.textContent = '트랙 보기 +';
        more.setAttribute('aria-expanded', 'false'); more.setAttribute('aria-controls', tracks.id);
        pin.insertBefore(more, $('.cc', pin));
        var tog = function(){ var o = !pin.classList.contains('sm-open'); pin.classList.toggle('sm-open', o); more.setAttribute('aria-expanded', String(o)); more.textContent = o ? '트랙 닫기 −' : '트랙 보기 +'; };
        more.addEventListener('click', function(e){ e.stopPropagation(); tog(); });
        pin.addEventListener('click', function(e){ if (!e.target.closest('a,button')) tog(); });
      }
      /* 달별 고정 스토리: 많아지면 화살표로 넘김 */
      var hl = $('.cv3-hl', root);
      if (hl && hlDone !== hl){ hlDone = hl; rail(hl, 'hl', '고정 스토리'); }
      if (hl) hl.dispatchEvent(new Event('scroll'));
      busy = false;
    };
    root.addEventListener('cv3:draw', lay);
    lay();
    if (mq.addEventListener) mq.addEventListener('change', function(){
      if (!mq.matches && view !== 'all'){ view = 'all'; root.cv3View('all'); } else root.cv3Redraw();
    });
  }

  // Mobile views read the existing, escaped static/Spring markup. IDs and detail links stay intact.
  function el(tag, cls, text){
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function cleanClone(node){
    if (!node) return null;
    var copy = node.cloneNode(true);
    copy.removeAttribute('id');
    $$('[id]', copy).forEach(function(n){ n.removeAttribute('id'); });
    return copy;
  }
  function tabButton(group, text, active, action){
    var b = el('button', '', text); b.type = 'button';
    b.setAttribute('aria-pressed', String(active));
    b.addEventListener('click', action);
    group.appendChild(b); return b;
  }
  function tabs(label){
    var group = el('div', 'sm-filter-tabs');
    group.setAttribute('role', 'group'); group.setAttribute('aria-label', label);
    return group;
  }

  function initProjects(){
    var grid = $('#p-pr .pjgrid');
    if (!grid || $('.sm-projects')) return;
    var cards = $$('.pjc', grid);
    if (!cards.length) return;
    var box = el('section', 'sm-projects'); box.setAttribute('aria-label', '프로젝트 아카이브');
    var filters = tabs('프로젝트 유형'), list = el('div', 'sm-project-list');
    var items = cards.map(function(card, i){
      var type = ($('.pjc-type', card) || {}).textContent || '';
      var item = el('details', 'sm-project'); item.dataset.type = type.trim();
      var summary = el('summary', 'sm-project-summary');
      summary.appendChild(el('span', 'sm-project-no', String(i + 1).padStart(2, '0')));
      var tx = el('span', 'sm-project-heading');
      var badge = el('span', 'sm-project-type', type);
      badge.dataset.type = type.trim(); tx.appendChild(badge);
      tx.appendChild(el('strong', '', ($('.pjname', card) || {}).textContent || ''));
      tx.appendChild(el('span', 'sm-project-description', ($('h3', card) || {}).textContent || ''));
      summary.appendChild(tx); item.appendChild(summary);
      var body = el('div', 'sm-project-body');
      ['.sum', '.tags', '.team'].forEach(function(s){ var c = cleanClone($(s, card)); if (c) body.appendChild(c); });
      var link = el('a', 'sm-project-link', '프로젝트 자세히 보기 →');
      link.href = card.getAttribute('href'); body.appendChild(link); item.appendChild(body);
      item.open = i === 0;
      item.addEventListener('toggle', function(){
        if (item.open) items.forEach(function(other){ if (other !== item) other.open = false; });
      });
      list.appendChild(item); return item;
    });
    var types = ['전체'].concat(Array.from(new Set(['기업연계', '실증', '창업'].concat(items.map(function(n){ return n.dataset.type; })))));
    types.forEach(function(type){
      tabButton(filters, type, type === '전체', function(){
        $$('button', filters).forEach(function(b){ b.setAttribute('aria-pressed', String(b.textContent === type)); });
        items.forEach(function(n){ n.hidden = type !== '전체' && n.dataset.type !== type; if (n.hidden) n.open = false; });
        var visible = items.filter(function(n){ return !n.hidden; });
        if (!visible.some(function(n){ return n.open; }) && visible[0]) visible[0].open = true;
      });
    });
    box.appendChild(filters); box.appendChild(list); grid.before(box); grid.classList.add('sm-project-source');
  }

  function initReviews(){
    var section = $('#p-rev'), source = section && $('.idgrid', section);
    if (!source || $('.sm-reviews', section)) return;
    var cards = $$('.idc', source);
    if (!cards.length) return; // Keep the server's published-empty state.
    var box = el('section', 'sm-reviews'); box.setAttribute('aria-label', '후기 목록');
    var categories = tabs('후기 카테고리'), cohorts = tabs('후기 기수');
    var count = el('p', 'sm-review-count'); count.setAttribute('role', 'status');
    var board = el('div', 'sm-review-board');
    var empty = el('p', 'sm-review-empty', '선택한 조건에 맞는 후기가 없습니다.');
    var pager = el('nav', 'sm-review-pager cpager'); pager.setAttribute('aria-label', '후기 페이지');
    var category = 'all', cohort = '', page = 1, tag = '', pageSize = 12;
    var entries = cards.map(function(card){
      var note = el('article', 'sm-review-note');
      var details = el('details', 'sm-review-details'), summary = el('summary', 'sm-review-summary');
      var bar = cleanClone($('.cbar', card)); if (bar) summary.appendChild(bar);
      summary.appendChild(el('h3', '', ($('h3', card) || {}).textContent || ''));
      summary.appendChild(el('span', 'sm-review-preview', ($('.in > p', card) || {}).textContent || ''));
      var hint = el('span', 'sm-review-hint');
      hint.appendChild(el('span', 'sm-review-expand', '본문 펼치기 ⌄'));
      hint.appendChild(el('span', 'sm-review-collapse', '본문 접기 ⌃')); summary.appendChild(hint);
      details.appendChild(summary);
      var body = el('div', 'sm-review-body');
      var modal = document.getElementById(card.getAttribute('href').slice(1));
      var published = modal && $('.mbody', modal);
      if (published) Array.from(published.children).forEach(function(n){
        if (!n.classList.contains('mtags')) body.appendChild(cleanClone(n));
      });
      else body.appendChild(el('p', '', ($('.in > p', card) || {}).textContent || ''));
      var link = el('a', 'sm-review-link', '상세 보기 →'); link.href = card.getAttribute('href'); body.appendChild(link);
      details.appendChild(body); note.appendChild(details);
      var footer = el('div', 'sm-review-by');
      footer.appendChild(el('b', '', ($('.who b', card) || {}).textContent || ''));
      var tg = $('.who .tg', card); if (tg) footer.appendChild(el('span', 'sm-review-tag', tg.textContent));
      note.appendChild(footer);
      var cl = Array.from(card.classList), cat = cl.find(function(c){ return /^cat-/.test(c); });
      var co = cl.find(function(c){ return /^coh\d+$/.test(c); });
      return {node:note, details:details, category:cat ? cat.slice(4) : '', cohort:co ? co.slice(3) : '', tags:cl};
    });
    var categoryNames = [['all','전체'],['life','생활'],['class','수업'],['proj','프로젝트'],['job','취업'],['path','진로']];
    categoryNames.forEach(function(c){
      tabButton(categories, c[1], c[0] === category, function(){
        category = c[0]; page = 1;
        // Keep the original radio/link contract for desktop filters and Spring.
        var radio = $('#rc_' + category, section);
        if (radio){ radio.checked = true; radio.dispatchEvent(new Event('change', {bubbles:true})); }
        refresh();
      }).dataset.value = c[0];
    });
    [''].concat(Array.from(new Set(entries.map(function(e){ return e.cohort; }))).filter(Boolean).sort(function(a,b){ return +b - +a; })).forEach(function(c){
      tabButton(cohorts, c ? c + '기' : '전체', c === cohort, function(){
        cohort = c; page = 1; refresh();
      }).dataset.value = c;
    });
    function pageButton(text, value, disabled){
      var b = el('button', '', text); b.type = 'button'; b.disabled = disabled;
      b.setAttribute('aria-label', text === '←' ? '이전 페이지' : text === '→' ? '다음 페이지' : value + '페이지');
      if (String(value) === text && page === value) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', function(){
        page = value; refresh();
        var active = $('button[aria-current="page"]', pager); if (active) active.focus({preventScroll:true});
        box.scrollIntoView({block:'start',behavior:reduce.matches ? 'auto' : 'smooth'});
      }); return b;
    }
    function refresh(){
      $$('button', categories).forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.value === category)); });
      $$('button', cohorts).forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.value === cohort)); });
      var matching = entries.filter(function(e){
        return (category === 'all' || e.category === category) && (!cohort || e.cohort === cohort) && (!tag || e.tags.indexOf('tg' + tag) >= 0);
      });
      var total = Math.max(1, Math.ceil(matching.length / pageSize)); page = Math.min(page, total);
      count.textContent = matching.length + '개의 후기';
      board.replaceChildren();
      matching.slice((page - 1) * pageSize, page * pageSize).forEach(function(e){ board.appendChild(e.node); });
      empty.hidden = matching.length > 0; board.hidden = !matching.length;
      pager.replaceChildren(); pager.hidden = !matching.length;
      if (matching.length){
        pager.appendChild(pageButton('←', page - 1, page === 1));
        var start = Math.max(1, Math.min(page - 2, total - 4));
        for (var n = start; n <= Math.min(total, start + 4); n++) pager.appendChild(pageButton(String(n), n, false));
        pager.appendChild(pageButton('→', page + 1, page === total));
      }
    }
    function fromHash(){
      var hash = /^#tg-([0-6])$/.exec(location.hash);
      if (hash){ tag = hash[1]; page = 1; }
      else if (!/^#r-/.test(location.hash)) tag = '';
      refresh();
    }
    box.append(categories, cohorts, count, board, empty, pager); source.before(box);
    // Hide the legacy controls as a group on mobile, including integration-only pager styles.
    ['.filters', '.idgrid', '.rvlist', '.pager'].forEach(function(selector){
      var original = $(selector, section);
      if (!original) return;
      var wrapper = el('div', 'sm-review-source'); original.before(wrapper); wrapper.appendChild(original);
    });
    section.classList.add('sm-review-ready');
    section.addEventListener('change', function(e){
      if (e.target.name === 'rc'){ category = e.target.id.slice(3); page = 1; refresh(); }
    });
    addEventListener('hashchange', fromHash); fromHash();
  }

  function init(){
    initTabs();
    initInterviews();
    initCohorts();
    initProjects();
    initReviews();
    rail($('.hb-pis'), 'pis', '후기');
    rail($('.hb-pjs'), 'pjs', '프로젝트');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  /* 메뉴를 늦게 그리는 경우 대비 */
  setTimeout(initTabs, 300);
})();
