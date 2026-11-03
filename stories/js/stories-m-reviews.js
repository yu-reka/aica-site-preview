/* Mobile review projection for the published static/Spring markup.
   Owns category/cohort/tag filters, ten-card pages and canonical modal links.
   Loaded before stories-m.js on new pages; the legacy entry can load it on demand. */
const StoriesMobileReviews = (() => {
  const { $, $$ } = SiteUI.selectors();
  const reduce = SiteUI.motion();

  var el = SiteUI.element, cleanClone = SiteUI.cloneWithoutIds, tabButton = SiteUI.toggleButton;
  function tabs(label){ return SiteUI.buttonGroup(label, 'sm-filter-tabs'); }

  function initReviews(){
    var section = $('#p-rev'), source = section && $('.idgrid', section);
    if (!source || $('.sm-reviews', section)) return;
    var cards = $$('.idc', source);
    if (!cards.length) return; // Keep the server's published-empty state.
    var box = el('section', 'sm-reviews'); box.setAttribute('aria-label', '후기 목록');
    var categories = tabs('후기 카테고리'), cohorts = tabs('후기 기수');
    cohorts.classList.add('sm-cohort-chips');
    var count = el('p', 'sm-review-count'); count.setAttribute('role', 'status');
    var stage = el('div', 'sm-review-stage');
    var board = el('div', 'sm-review-board');
    board.tabIndex = 0; board.setAttribute('aria-label', '후기 카드 가로 목록');
    function railButton(label, direction){
      var button = el('button', 'sm-arrow sm-review-arrow', direction < 0 ? '‹' : '›');
      button.type = 'button'; button.setAttribute('aria-label', label);
      button.classList.add(direction < 0 ? 'is-prev' : 'is-next');
      button.addEventListener('click', function(){ move(direction); });
      return button;
    }
    var previous = railButton('이전 후기 카드', -1), next = railButton('다음 후기 카드', 1);
    function syncRail(){
      SiteUI.syncRail(board, previous, next);
      if (view === 'list' || stage.classList.contains('is-empty')) { previous.hidden = true; next.hidden = true; }
    }
    function move(direction){
      var card = board.firstElementChild;
      if (card) board.scrollBy({left:direction * (card.offsetWidth + 16), behavior:reduce.matches ? 'auto' : 'smooth'});
    }
    board.addEventListener('scroll', syncRail, {passive:true});
    board.addEventListener('keydown', function(event){ SiteUI.railKeys(event, move); });
    addEventListener('resize', function(){ if (view === 'list') refresh(); else syncRail(); });
    stage.append(board, previous, next);
    var lastView = '';
    var empty = el('div', 'sm-review-empty', '선택한 조건에 맞는 후기가 없습니다.');
    var pager = el('nav', 'sm-review-pager cpager'); pager.setAttribute('aria-label', '후기 페이지');
    var category = 'all', cohort = '', page = 1, tag = '', pageSize = 10;
    var entries = cards.map(function(card){
      var note = el('a', 'sm-review-note');
      note.href = card.getAttribute('href'); note.setAttribute('aria-haspopup', 'dialog');
      var summary = el('div', 'sm-review-summary');
      var bar = cleanClone($('.cbar', card)); if (bar) summary.appendChild(bar);
      summary.appendChild(el('h3', '', ($('h3', card) || {}).textContent || ''));
      summary.appendChild(el('span', 'sm-review-preview', ($('.in > p', card) || {}).textContent || ''));
      note.appendChild(summary);
      var footer = el('div', 'sm-review-by');
      footer.appendChild(el('b', '', ($('.who b', card) || {}).textContent || ''));
      var tg = $('.who .tg', card);
      footer.appendChild(el('span', tg ? 'sm-review-tag' : 'sm-review-tag sm-review-tag-empty', tg ? tg.textContent : '태그 없음'));
      var cohortText = ($('.cbar span', card) || {}).textContent || '';
      footer.appendChild(el('span', 'sm-review-list-meta', cohortText.replace(/\s+/g, '') + ' · ' + (($('.who b', card) || {}).textContent || '')));
      var arrow = el('span', 'sm-review-card-arrow', '→'); arrow.setAttribute('aria-hidden', 'true');
      footer.appendChild(arrow); note.appendChild(footer);
      var cl = Array.from(card.classList);
      var co = cl.find(function(c){ return /^coh\d+$/.test(c); });
      return {node:note, cohort:co ? co.slice(3) : '', classes:cl};
    });
    var toolbar = el('div', 'sm-review-toolbar');
    var filterRow = el('div', 'sm-review-filter-row');
    var cohortSelect = el('details', 'sm-review-cohort-dropdown dw');
    cohortSelect.setAttribute('name', 'mobile-review-filter');
    var cohortSummary = el('summary', ''), cohortLabel = el('b', '', '기수');
    cohortSummary.setAttribute('aria-label', '후기 기수 선택'); cohortSummary.appendChild(cohortLabel);
    var cohortChevron = cleanClone($('.dw-fco summary svg', section));
    if (cohortChevron) cohortSummary.appendChild(cohortChevron);
    cohorts.classList.add('sm-review-tag-options');
    cohortSelect.append(cohortSummary, cohorts);
    document.addEventListener('click', function(event){ if (!cohortSelect.contains(event.target)) cohortSelect.open = false; });
    cohortSelect.addEventListener('keydown', function(event){
      if (event.key === 'Escape'){ cohortSelect.open = false; cohortSummary.focus({preventScroll:true}); }
    });
    cohortSelect.addEventListener('focusout', function(event){ if (!cohortSelect.contains(event.relatedTarget)) cohortSelect.open = false; });
    var tagSelect = el('details', 'sm-review-tag-dropdown dw');
    tagSelect.setAttribute('name', 'mobile-review-filter');
    var tagSummary = el('summary', ''), tagLabel = el('b', '', '태그');
    tagSummary.setAttribute('aria-label', '후기 태그'); tagSummary.appendChild(tagLabel);
    var tagChevron = cleanClone($('.dw-ftg summary svg', section));
    if (tagChevron) tagSummary.appendChild(tagChevron);
    var tagOptions = el('div', 'sm-review-tag-options');
    $$('.dw-ftg .dwin a', section).forEach(function(link){
      var match = /^#tg-([0-6])$/.exec(link.getAttribute('href'));
      var option = el('button', '', match ? link.textContent : '전체'); option.type = 'button';
      option.dataset.value = match ? match[1] : '';
      option.addEventListener('click', function(){
        tag = option.dataset.value; page = 1; tagSelect.open = false; refresh();
        tagSummary.focus({preventScroll:true});
      }); tagOptions.appendChild(option);
    });
    tagSelect.append(tagSummary, tagOptions); filterRow.append(cohortSelect, tagSelect);
    document.addEventListener('click', function(event){ if (!tagSelect.contains(event.target)) tagSelect.open = false; });
    tagSelect.addEventListener('keydown', function(event){
      if (event.key === 'Escape'){ tagSelect.open = false; tagSummary.focus({preventScroll:true}); }
    });
    tagSelect.addEventListener('focusout', function(event){ if (!tagSelect.contains(event.relatedTarget)) tagSelect.open = false; });
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
        cohort = c; page = 1; cohortSelect.open = false; refresh(); cohortSummary.focus({preventScroll:true});
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
      cohortLabel.textContent = cohort ? cohort + '기' : '기수';
      cohortSelect.classList.toggle('is-active', !!cohort);
      tagSelect.classList.toggle('is-active', !!tag);
      var matching = entries.filter(function(e){
        return (category === 'all' || e.classes.indexOf('cat-' + category) >= 0) && (!cohort || e.cohort === cohort) && (!tag || e.classes.indexOf('tg' + tag) >= 0);
      });
      var total = Math.max(1, Math.ceil(matching.length / pageSize)); page = Math.min(page, total);
      count.textContent = matching.length + '개의 후기';
      $$('button', tagOptions).forEach(function(button){ button.setAttribute('aria-pressed', String(button.dataset.value === tag)); });
      var selectedTag = $$('button', tagOptions).find(function(button){ return button.dataset.value === tag; });
      tagLabel.textContent = tag && selectedTag ? selectedTag.textContent : '태그';
      var key = [category, cohort, tag, page, view].join('|');
      var left = key === lastView ? board.scrollLeft : 0; lastView = key;
      board.replaceChildren();
      var shown = view === 'list' ? matching.slice((page - 1) * pageSize, page * pageSize) : matching;
      shown.forEach(function(e){ board.appendChild(e.node); });
      if(!matching.length&&typeof StoryState!=='undefined')StoryState.render(empty,'filter',{subject:'후기',reviewBoard:board,onReset:function(){
        StoryState.resetReviews(section);categories.querySelector('button').focus({preventScroll:true});
      }});
      empty.hidden = matching.length > 0;
      stage.classList.toggle('is-empty', !matching.length);
      board.tabIndex = matching.length ? 0 : -1;
      board.scrollLeft = left; requestAnimationFrame(syncRail);
      pager.replaceChildren(); pager.hidden = view !== 'list' || !matching.length;
      if (view === 'list' && matching.length){
        pager.appendChild(pageButton('←', page - 1, page === 1));
        var windowSize = box.clientWidth < 316 ? 4 : 5;
        var start = Math.max(1, Math.min(page - 2, total - windowSize + 1));
        for (var n = start; n <= Math.min(total, start + windowSize - 1); n++) pager.appendChild(pageButton(String(n), n, false));
        pager.appendChild(pageButton('→', page + 1, page === total));
      }
    }
    function fromHash(){
      var hash = /^#tg-([0-6])$/.exec(location.hash);
      if (hash){ tag = hash[1]; page = 1; }
      refresh();
    }
    box.append(categories, filterRow, toolbar, stage, empty, pager); source.before(box);
    // Hide the legacy controls as a group on mobile, including integration-only pager styles.
    ['.filters', '.idgrid', '.rvlist', '.pager'].forEach(function(selector){
      var original = $(selector, section);
      if (!original) return;
      var wrapper = el('div', 'sm-review-source'); original.before(wrapper); wrapper.appendChild(original);
    });
    section.classList.add('sm-review-ready');
    section.addEventListener('reviews:reset',function(){category='all';cohort='';tag='';page=1;refresh();});
    section.addEventListener('change', function(e){
      if (e.target.name === 'rc'){ category = e.target.id.slice(3); page = 1; refresh(); }
    });
    addEventListener('hashchange', fromHash); fromHash();
  }

  return { init: initReviews };
})();
