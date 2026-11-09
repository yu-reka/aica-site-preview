/* Mobile review projection for the published static/Spring markup.
   Owns category/cohort/tag filters, ten-card pages and canonical modal links.
   Loaded before stories-m.js on new pages; the legacy entry can load it on demand. */
const StoriesMobileReviews = (() => {
  const { $, $$ } = SiteUI.selectors();
  const reduce = SiteUI.motion();

  var el = SiteUI.element, cleanClone = SiteUI.cloneWithoutIds, tabButton = SiteUI.toggleButton;
  function tabs(label){ return SiteUI.buttonGroup(label, 'sm-filter-tabs'); }

  var viewsBySection = new WeakMap();
  function initReviews(){
    var section = $('#p-rev'), source = section && $('.idgrid', section);
    if (!source || $('.sm-reviews', section)) return;
    var managed = typeof window !== 'undefined' && window.StoryReviewCards;
    var cached = viewsBySection.get(section);
    if (cached) { cached.marker.after(cached.box); cached.restore(); return; }
    var cards = managed || $$('.idc', source);
    if (!cards.length) return; // Keep the server's published-empty state.
    var box = el('section', 'sm-reviews'); box.setAttribute('aria-label', '후기 목록');
    var categories = tabs('후기 카테고리'), cohorts = tabs('후기 기수');
    cohorts.classList.add('sm-cohort-chips');
    var count = el('p', 'sm-review-count'); count.setAttribute('role', 'status');
    var stage = el('div', 'sm-review-stage');
    var board = el('div', 'sm-review-board');
    board.tabIndex = 0; board.setAttribute('aria-label', '후기 카드 가로 목록');
    function railButton(label, direction){
      var button = el('button', 'sm-review-control ui-rail-arrow', '');
      // Same rail-arrow SVG as about-m.js, stories-m.js and the cohort dialog.
      var path = direction < 0 ? 'm14 5-7 7 7 7' : 'm10 5 7 7-7 7';
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg>';
      button.type = 'button'; button.setAttribute('aria-label', label);
      button.classList.add(direction < 0 ? 'is-prev' : 'is-next');
      button.addEventListener('click', function(){ move(direction); });
      return button;
    }
    var previous = railButton('이전 후기 카드', -1), next = railButton('다음 후기 카드', 1);
    var navigation = el('div', 'sm-review-navigation');
    navigation.setAttribute('role', 'group'); navigation.setAttribute('aria-label', '후기 카드 넘기기');
    var progress = el('div', 'sm-review-progress'), fill = el('span', '');
    progress.setAttribute('role', 'progressbar'); progress.setAttribute('aria-label', '후기 목록 탐색 위치');
    progress.setAttribute('aria-valuemin', '0'); progress.setAttribute('aria-valuemax', '100');
    progress.appendChild(fill); navigation.append(progress, previous, next);
    var loop = SiteUI.circularRail(board);
    var railWidth = 0;
    function syncRail(){
      if (board.clientWidth && board.clientWidth !== railWidth){
        railWidth = board.clientWidth;
        var cardWidth = Math.min(240, (railWidth - 32) * .84);
        board.style.setProperty('--review-card-size', cardWidth + 'px');
        board.style.setProperty('--review-card-inset', (railWidth - cardWidth) / 2 + 'px');
      }
      if (board.firstElementChild && board.firstElementChild.getBoundingClientRect){
        var rect = board.firstElementChild.getBoundingClientRect();
        stage.style.setProperty('--review-control-y', rect.top + rect.height / 2 - stage.getBoundingClientRect().top + 'px');
      }
      var state = SiteUI.railState(board);
      navigation.hidden = view === 'list' || stage.classList.contains('is-empty') || state.max <= 4;
      previous.disabled = !loop.active && state.atStart; next.disabled = !loop.active && state.atEnd;
      var value = board.scrollWidth ? Math.min(100, Math.max(0, (board.scrollLeft + board.clientWidth) / board.scrollWidth * 100)) : 100;
      if (loop.active) value = loop.position();
      fill.style.width = value + '%'; progress.setAttribute('aria-valuenow', String(Math.round(value)));
    }
    function move(direction){
      var card = board.firstElementChild;
      if (card) board.scrollBy({left:direction * (card.offsetWidth + 16), behavior:reduce.matches ? 'auto' : 'smooth'});
    }
    board.addEventListener('scroll', syncRail, {passive:true});
    board.addEventListener('keydown', function(event){ SiteUI.railKeys(event, move); });
    function resizeRail(){
      if (managed && !box.isConnected) return;
      if (view === 'list') { refresh(); return; }
      syncRail();
      loop.enable(board.clientWidth > 0 && board.clientWidth <= 600);
      syncRail();
    }
    addEventListener('resize', resizeRail);
    stage.append(board, navigation);
    var lastView = '';
    var empty = el('div', 'sm-review-empty', '선택한 조건에 맞는 후기가 없습니다.');
    var pager = el('nav', 'sm-review-pager cpager'); pager.setAttribute('aria-label', '후기 페이지');
    var category = 'all', cohort = '', page = 1, pageSize = 10;
    function readDesktopFilters(){
      var nextCategory = $('input[name="rc"]:checked', section)?.id.slice(3) || 'all';
      var cohortId = $('input[name="fco"]:checked', section)?.id || '';
      var known = /^fco_([0-4])$/.exec(cohortId), extra = /^fco_c(\d+)$/.exec(cohortId);
      var nextCohort = known ? String(7 - Number(known[1])) : extra ? extra[1] : '';
      if (category !== nextCategory || cohort !== nextCohort) page = 1;
      category = nextCategory; cohort = nextCohort;
    }
    if (managed) readDesktopFilters();
    function noteFor(card){
      var note = el('a', 'sm-review-note');
      note.href = managed ? '#' + card.anchor : card.getAttribute('href'); note.setAttribute('aria-haspopup', 'dialog');
      var summary = el('div', 'sm-review-summary');
      var bar;
      if (managed) {
        bar = el('div', 'cbar');
        var category = el('b', '', card.label); category.dataset.field = 'category';
        var chip = el('span', '', card.cohort); chip.dataset.field = 'cohort';
        chip.appendChild(el('i', '', '기')); bar.append(category, chip);
      } else bar = cleanClone($('.cbar', card)); if (bar) summary.appendChild(bar);
      summary.appendChild(el('h3', '', managed ? card.title : ($('h3', card) || {}).textContent || ''));
      summary.appendChild(el('span', 'sm-review-preview', managed ? card.summary : ($('.in > p', card) || {}).textContent || ''));
      note.appendChild(summary);
      var footer = el('div', 'sm-review-by');
      var author = managed ? card.author : ($('.who b', card) || {}).textContent || '';
      footer.appendChild(el('b', '', author));
      var tag = managed ? card.tag : $('.who .tg', card)?.textContent;
      if (tag) footer.appendChild(el('span', 'sm-review-tag', tag));
      var cohortText = managed ? card.cohort + '기' : ($('.cbar span', card) || {}).textContent || '';
      footer.appendChild(el('span', 'sm-review-list-meta', cohortText.replace(/\s+/g, '') + ' · ' + author));
      var arrow = el('span', 'sm-review-card-arrow', '→'); arrow.setAttribute('aria-hidden', 'true');
      footer.appendChild(arrow); note.appendChild(footer);
      return note;
    }
    var entries = cards.map(function(card){
      if (managed) return {card, cohort:card.cohort, classes:['cat-' + card.category]};
      var cl = Array.from(card.classList);
      var co = cl.find(function(c){ return /^coh\d+$/.test(c); });
      return {card, cohort:co ? co.slice(3) : '', classes:cl};
    });
    var toolbar = el('div', 'sm-review-toolbar');
    var filterRow = el('div', 'sm-review-filter-row');
    var cohortSelect = el('details', 'sm-review-cohort-dropdown dw');
    cohortSelect.setAttribute('name', 'mobile-review-filter');
    var cohortSummary = el('summary', ''), cohortLabel = el('b', '', '기수');
    cohortSummary.setAttribute('aria-label', '후기 기수 선택'); cohortSummary.appendChild(cohortLabel);
    var cohortChevron = cleanClone($('.dw-fco summary svg', section));
    if (cohortChevron) cohortSummary.appendChild(cohortChevron);
    cohorts.classList.add('sm-review-cohort-options');
    cohortSelect.append(cohortSummary, cohorts);
    document.addEventListener('click', function(event){ if (!cohortSelect.contains(event.target)) cohortSelect.open = false; });
    cohortSelect.addEventListener('keydown', function(event){
      if (event.key === 'Escape'){ cohortSelect.open = false; cohortSummary.focus({preventScroll:true}); }
    });
    cohortSelect.addEventListener('focusout', function(event){ if (!cohortSelect.contains(event.relatedTarget)) cohortSelect.open = false; });
    filterRow.appendChild(cohortSelect);
    var views = el('div', 'sm-review-views'); views.setAttribute('role', 'group'); views.setAttribute('aria-label', '후기 보기 방식');
    var view = 'card';
    ['card', 'list'].forEach(function(mode){
      var button = el('button', ''); button.type = 'button'; button.dataset.view = mode;
      button.setAttribute('aria-label', mode === 'card' ? '카드 보기' : '목록 보기');
      button.setAttribute('aria-pressed', String(mode === view));
      var icon = cleanClone($('.vtoggle label[for="vm-' + mode + '"] svg', section));
      if (icon) button.appendChild(icon);
      button.addEventListener('click', function(){
        view = mode; page = 1; stage.classList.toggle('is-list', mode === 'list');
        board.setAttribute('aria-label', mode === 'list' ? '후기 목록' : '후기 카드 가로 목록');
        $$('button', views).forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.view === view)); });
        refresh();
      }); views.appendChild(button);
    });
    filterRow.appendChild(views); toolbar.appendChild(count);
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
        cohort = c; page = 1; cohortSelect.open = false;
        if (managed) {
          var id = !c ? 'fco_all' : /^[3-7]$/.test(c) ? 'fco_' + (7 - Number(c)) : 'fco_c' + c;
          var radio = $('#' + id, section);
          if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', {bubbles:true})); }
        }
        refresh(); cohortSummary.focus({preventScroll:true});
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
      if (managed && !box.isConnected) return;
      $$('button', categories).forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.value === category)); });
      $$('button', cohorts).forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.value === cohort)); });
      cohortLabel.textContent = cohort ? cohort + '기' : '기수';
      cohortSelect.classList.toggle('is-active', !!cohort);
      var matching = entries.filter(function(e){
        return (category === 'all' || e.classes.indexOf('cat-' + category) >= 0) && (!cohort || e.cohort === cohort);
      });
      var total = Math.max(1, Math.ceil(matching.length / pageSize)); page = Math.min(page, total);
      count.textContent = matching.length + '개의 후기';
      var key = [category, cohort, page, view].join('|');
      if (key === lastView && view === 'card') { syncRail(); return; }
      var left = key === lastView ? board.scrollLeft : 0; lastView = key;
      board.replaceChildren();
      var shown = view === 'list' ? matching.slice((page - 1) * pageSize, page * pageSize) : matching;
      shown.forEach(function(e){ board.appendChild(e.node || (e.node = noteFor(e.card))); });
      if(!matching.length&&typeof StoryState!=='undefined')StoryState.render(empty,'filter',{subject:'후기',reviewBoard:board,onReset:function(){
        StoryState.resetReviews(section);categories.querySelector('button').focus({preventScroll:true});
      }});
      empty.hidden = matching.length > 0;
      stage.classList.toggle('is-empty', !matching.length);
      board.tabIndex = matching.length ? 0 : -1;
      board.scrollLeft = left;
      syncRail(); loop.reset(view === 'card' && board.clientWidth > 0 && board.clientWidth <= 600);
      requestAnimationFrame(syncRail);
      pager.replaceChildren(); pager.hidden = view !== 'list' || !matching.length;
      if (view === 'list' && matching.length){
        pager.appendChild(pageButton('←', page - 1, page === 1));
        var windowSize = box.clientWidth < 316 ? 4 : 5;
        var start = Math.max(1, Math.min(page - 2, total - windowSize + 1));
        for (var n = start; n <= Math.min(total, start + windowSize - 1); n++) pager.appendChild(pageButton(String(n), n, false));
        pager.appendChild(pageButton('→', page + 1, page === total));
      }
    }
    box.append(categories, filterRow, toolbar, stage, empty, pager);
    if (managed) {
      var marker = document.createComment('mobile reviews');
      source.before(marker, box);
      viewsBySection.set(section,{
        marker, box,
        restore: function(){
          readDesktopFilters(); refresh();
          if (view === 'card') resizeRail();
        },
        detach: function(){
          // Restore canonical order before detaching; resize may fire on either side of the media query.
          loop.enable(false);
          box.remove();
        }
      });
    } else source.before(box);
    // Hide the legacy controls as a group on mobile, including integration-only pager styles.
    ['.filters', '.idgrid', '.rvlist', '.pager'].forEach(function(selector){
      var original = $(selector, section);
      if (!original) return;
      var wrapper = el('div', 'sm-review-source'); original.before(wrapper); wrapper.appendChild(original);
    });
    section.classList.add('sm-review-ready');
    section.addEventListener('reviews:reset',function(){category='all';cohort='';page=1;refresh();});
    section.addEventListener('change', function(e){
      if (managed && (e.target.name === 'rc' || e.target.name === 'fco')){
        readDesktopFilters(); refresh();
      } else if (e.target.name === 'rc'){ category = e.target.id.slice(3); page = 1; refresh(); }
    });
    addEventListener('hashchange', refresh); refresh();
  }

  return {
    init: initReviews,
    unmount: function(){
      var view = viewsBySection.get($('#p-rev'));
      if (view && view.box.isConnected) view.detach();
    }
  };
})();
