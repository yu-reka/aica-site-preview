'use strict';
/* 이전 버전(디자인통일v1 about/js/about.js 맨 끝)에서 그대로 옮김 */
/* 오른쪽 플로팅 목차(10-13, 지원 전 체크와 같음): 화면 40% 지점을 지난 마지막 섹션 표시 · 누르면 그 섹션 주소로(도착 자리는 공통 scroll-margin) */
(function(){
  var nav = document.querySelector('.school-about .sec-float'); if (!nav) return;
  var btns = [].slice.call(nav.querySelectorAll('.sf-btn'));
  var secs = btns.map(function(b){ return document.getElementById(b.dataset.jump); });
  var first = secs[0], raf;
  function set(id){ btns.forEach(function(b){ var on = b.dataset.jump === id; b.classList.toggle('is-active', on); if (on) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current'); }); }
  function calc(){
    var line = innerHeight * .4, id = btns[0].dataset.jump;
    secs.forEach(function(el, k){ if (el && el.getBoundingClientRect().top <= line) id = btns[k].dataset.jump; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) id = btns[btns.length - 1].dataset.jump;
    set(id);
    // 늘 보임(지원 전 체크와 같음). 첫 화면(어두운 히어로) 위에 있을 때는 흰색으로
    nav.classList.add('is-in');
    var r = nav.getBoundingClientRect(), mid = r.top + r.height / 2;
    nav.classList.toggle('on-dark', !!first && first.getBoundingClientRect().top > mid);
  }
  function onS(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(calc); }
  addEventListener('scroll', onS, { passive:true }); addEventListener('resize', onS);
  btns.forEach(function(b){ b.addEventListener('click', function(){
    var el = document.getElementById(b.dataset.jump); if (!el) return;
    if (location.hash === '#' + b.dataset.jump) el.scrollIntoView({ behavior:'smooth', block:'start' }); else location.hash = b.dataset.jump;
  }); });
  calc();
})();
