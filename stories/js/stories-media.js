/* 이야기 글 안의 사진 · 영상. 이야기 렌더러(stories-render.js)와 데스크톱 후기 넘김(stories-review-paging.js) 다음에 실행된다.
   ---------- 글 안 사진 넘김(.phs, 위에서 그림): 화살표 · 손가락으로 밀기 · 키보드 ←→ (백오피스) ----------
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

  // 투명 썸네일은 여백 안에 두고, 불투명 썸네일은 pjthumb-full로 칸을 채운다.
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
  // 프로젝트 상세를 떠날 때 영상을 내리고 대표 그림을 복원한다.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pjvid .ivplay'); if (!b) return;
    var box = b.closest('.pjvid'), id = box.getAttribute('data-pj-yt') || '';
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return;
    e.preventDefault();
    box.pjPoster = box.pjPoster || box.innerHTML;
    var f = document.createElement('iframe');
    var start = +box.getAttribute('data-pj-start') || 0, end = +box.getAttribute('data-pj-end') || 0;
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
