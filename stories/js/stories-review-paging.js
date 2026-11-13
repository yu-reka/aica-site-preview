/* 데스크톱 후기 쪽 넘김. 이야기 렌더러(stories-render.js)가 카드를 그린 다음, stories-media.js 앞에 실행된다. */
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
