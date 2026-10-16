/* 지원 전 체크 모바일(10-16, 캔버스 '지원 전 체크' 모바일 시안 반영)
   마크업(.cm-*)은 src/pages/check/index.html, 보이는 규칙은 css/check-m.css(600px 이하)에 있음.
   여기서는 동작만: 바로가기 탭의 지금 위치 표시 · 모집 프로세스 펼침 · 자주 묻는 질문 '더 보기'. 웹(601px 이상)은 그대로. */
(function(){
  var mq = matchMedia('(max-width: 600px)');
  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return [].slice.call((c || document).querySelectorAll(s)); };
  var main = $('#main'); if (!main) return;

  /* 1) 바로가기 탭: 지금 보고 있는 구역 표시 */
  var links = $$('.cm-tabs a');
  var secs = links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
  var raf;
  var spy = function(){
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function(){
      if (!mq.matches) return;
      var tabs = $('.cm-tabs'), line = (tabs ? tabs.getBoundingClientRect().bottom : 120) + 24, k = 0;
      secs.forEach(function(s, i){ if (s && s.getBoundingClientRect().top <= line) k = i; });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) k = secs.length - 1;
      links.forEach(function(a, i){ if (i === k) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    });
  };
  addEventListener('scroll', spy, { passive: true });
  addEventListener('resize', spy);
  spy();

  /* 2) 모집 프로세스: 단계별 펼침(한 번에 하나, 처음엔 STEP 01). 머리 버튼은 카드의 단계 · 제목을 그대로 씀 */
  var cols = $$('#procFlow .pf-col');
  if (cols.length){
    var setOpen = function(n){
      cols.forEach(function(c, j){ c.classList.toggle('cm-open', j === n); $('.cm-step-btn', c).setAttribute('aria-expanded', String(j === n)); });
    };
    cols.forEach(function(col, i){
      var card = $('.pf-card', col); if (!card) return;
      var step = $('.pf-step', card), title = $('h3', card), body = $('.pf-body', card);
      if (body && !body.id) body.id = 'cm-step-' + (i + 1);
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'cm-step-btn';
      if (body) b.setAttribute('aria-controls', body.id);
      b.innerHTML = '<span class="cm-step-tx"><span class="cm-step-no"></span><span class="cm-step-t"></span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
      $('.cm-step-no', b).textContent = step ? step.textContent : '';
      $('.cm-step-t', b).textContent = title ? title.textContent : '';
      card.insertBefore(b, card.firstChild);
      b.addEventListener('click', function(){ setOpen(col.classList.contains('cm-open') ? -1 : i); });
    });
    setOpen(0);
  }

  /* 3) 자주 묻는 질문: 모바일에선 페이지 번호 대신 5개씩 '더 보기' */
  var fl = $('#faqList'), more = $('#cmFaqMore');
  if (fl && more){
    var STEP = 5, shown = STEP;
    var items = $$('.faq-item', fl);
    var render = function(){
      if (!mq.matches){ more.hidden = true; return; }
      fl.style.minHeight = '';
      var list = items.filter(function(li){ return li._ok !== false; });
      list.forEach(function(li, k){ li.hidden = k >= shown; });
      items.forEach(function(li){ if (li._ok === false) li.hidden = true; });
      more.hidden = list.length <= shown;
    };
    more.addEventListener('click', function(){ shown += STEP; render(); });
    $$('.faq-tab').forEach(function(t){ t.addEventListener('click', function(){ shown = STEP; render(); }); });
    var rz; addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(render, 300); });
    if (mq.addEventListener) mq.addEventListener('change', function(){ setTimeout(render, 300); });
    render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ setTimeout(render, 0); });
  }
})();
