/* =========================================================
   인사교 라이프 — 시설 둘러보기 · 생활 꿀팁 · 오시는 길
   박지원 시안8(2026-10-07 전달) script.js에서 이 세 화면이 쓰는 동작만 옮김. [nn]은 시안 블록 번호
   본문(엘리베이터 · 공간 썸네일 · 크게 보기 창 · 목록 스크롤 안내 자리 포함)은 모두 index.html에 있고, 이 파일은 움직임만
   2026-10-07 정리: 실제로 안 돌던 시안 블록은 뺌 — [10] 지도 핀 터치 대체 · [09] 핀 고정(.pick)(둘 다 [15]가 핀 클릭을 먼저 받아 닿지 않음),
   [20] 숨긴 층 카드(.fxsel) 맞추기(카드 자체를 HTML에서 뺌)
   ========================================================= */
(function(){
'use strict';
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return [].slice.call((r || document).querySelectorAll(s)); };
var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
var NARROW = matchMedia('(max-width: 860px)');   // 폰 · 태블릿: 목록 안 스크롤 없음 · 꿀팁 바로가기 막대 안 붙음(life.css와 같은 경계)
var MAIN = $('.life-page');
if (!MAIN) return;

/* ---------- 화면 전환 ([01] 라우터 → 메뉴 주소) ----------
   #facilities(기본) · #tips · #directions. 시안 주소 #facility · #way · #tips/house 도 받음.
   화면 안 위치(#tp-house 등)로 오면 그 화면을 연 뒤 그 위치로. 하위 메뉴 바 · 헤더 드롭다운에서 고르면 site.js가 location.hash를 바꿈 */
var PG = $$(':scope > .page', MAIN);
var SCREEN = { facilities:'facility', facility:'facility', tips:'tips', directions:'way', way:'way' };
var CANON = { facility:'#facilities', way:'#directions' };
var NAME = { facility:'시설 둘러보기', tips:'생활 꿀팁', way:'오시는 길' };
var SUB = { facility:'facilities', tips:'tips', way:'directions' };   // menu.js 하위 메뉴 id
var BASE_TITLE = document.title;
function route(){
  var raw = decodeURIComponent(location.hash.slice(1)), part = raw.split('/'), id = SCREEN[part[0]], target = null;
  if (id && part[1]) {
    target = document.getElementById('tp-' + part[1]);
    history.replaceState(null, '', target ? '#tp-' + part[1] : (CANON[part[0]] || '#' + part[0]));
  } else if (CANON[part[0]]) history.replaceState(null, '', CANON[part[0]]);
  if (!id && raw) {
    var el = document.getElementById(raw), pg = el && el.closest('.page');
    if (pg && PG.indexOf(pg) > -1) { id = pg.dataset.page; target = el; }
    else return;   // 화면 밖 위치(본문으로 바로가기 #main 등)나 모르는 주소: 지금 화면 그대로
  }
  if (!id) id = 'facility';
  var cur = document.getElementById('pg-' + id), was = !cur.hidden;
  PG.forEach(function(p){ p.hidden = p !== cur; });
  document.title = NAME[id] + ' · ' + BASE_TITLE;
  // 공통 하위 메뉴 바의 지금 항목 = 지금 화면(주소가 #tp-house처럼 화면 안 위치여도)
  document.documentElement.dataset.sub = SUB[id];
  if (typeof Site !== 'undefined' && Site.syncSubnav) Site.syncSubnav();
  if (target) {   // 같은 화면이면 브라우저가 이미 그 위치로 감
    if (!was) {
      var go = function(){ target.scrollIntoView(); };
      setTimeout(go, 40);
      // 목록 높이(아래 [09] · [16])를 화면을 연 뒤 정하므로 그다음 한 번 더 맞춤
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(function(){ setTimeout(go, 160); });
    }
  }
  else window.scrollTo({ top: 0, behavior: 'instant' });   // 다른 화면으로 바뀌므로 부드러운 스크롤(공통 base.css) 없이 맨 위로
}
addEventListener('hashchange', route);

/* ---------- 생활 꿀팁 바로가기 막대: 지금 보는 부분 표시 ([01]) ----------
   항목은 링크(<a href="#tp-…">: 주소 공유 · 새 탭 가능). 누르면 브라우저가 그 위치로(부드러운 스크롤은 base.css) · 화면 전환은 위 route()가 맡음.
   지금 보는 부분 = aria-current="location"(모양은 공통 하위 메뉴 바처럼 밑줄, life.css) */
function spy(){
  var pg = $(':scope > .page:not([hidden])', MAIN); if (!pg) return;
  var sn = $$('.lnb-s a', pg); if (!sn.length) return;
  var cur = sn[0];
  sn.forEach(function(a){ var t = document.getElementById(a.hash.slice(1)); if (t && t.getBoundingClientRect().top < innerHeight * .4) cur = a; });
  sn.forEach(function(a){ if (a === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
}
addEventListener('scroll', spy, { passive:true });

/* ---------- 주소 복사 ([01]) ---------- */
var cA = $('#copyAd');
if (cA) cA.addEventListener('click', function(){
  var b = this, t = '광주광역시 동구 제봉로 92';
  function done(){ b.textContent = '복사했어요'; setTimeout(function(){ b.textContent = '주소 복사'; }, 1600); }
  try { navigator.clipboard.writeText(t).then(done, done); } catch (e) { done(); }
});

/* ---------- 한 줄 메뉴: 지금 바로가기 버튼이 보이도록 가로 위치 맞추기 ([06]) ---------- */
var lw = $('#pg-tips .lnb .wrap');
addEventListener('scroll', function(){
  if (!lw || !lw.offsetParent) return;
  var on = lw.querySelector('.lnb-s [aria-current]'); if (!on) return;
  var a = on.offsetLeft, b = a + on.offsetWidth;
  if (a < lw.scrollLeft + 8 || b > lw.scrollLeft + lw.clientWidth - 8) lw.scrollLeft = a - lw.clientWidth / 2 + on.offsetWidth / 2;
}, { passive:true });

/* ---------- 문화 · 여가: 지도 핀 ↔ 목록 짝 표시 · 거르기 · 목록 높이 · 펼치기 ([09] · [17]) ----------
   거르기: 조건에 안 맞는 곳은 목록에서 숨기고(hidden — Tab에서도 빠짐) 지도 핀만 흐리게(.off). 목록 머리 'n곳'은 보이는 곳만 셈.
   861px 이상: 목록 상자 높이 = 옆 지도 칸, 목록만 안에서 스크롤 · 아래 줄 '↓ n곳 더'(보이는 곳만 셈, 넘치지 않으면 숨김).
   860px 이하: 안 스크롤 없이 처음 5곳 + '나머지 n곳 더 보기'(시안은 화면보다 긴 목록 안에 스크롤이 갇혀 페이지가 안 내려갔음, 2026-10-08) */
(function(){
  var r = $('.lmap', MAIN); if (!r) return;
  var pins = $$('.lmp', r), li = $$('.lmli', r), ol = $('.lml', r), box = $('.lmlw', r), lw2 = $('.lmw2', r), sep = $('.lmsep', r);
  var cnt = $('.lmlh em', r), empty = $('.lmempty', r), more = $('.lmmore', r), mb = more && more.querySelector('button'), m = box.querySelector('.fdmore');
  var N = 5, w = 'all', free = false, unfold = false, bw = $$('[data-lw]', MAIN), bf = $('#lmFree');
  function hl(i, on){ pins.concat(li).forEach(function(e){ if (e.dataset.i === i) e.classList.toggle('on', on); }); }
  pins.concat(li).forEach(function(e){
    e.addEventListener('mouseenter', function(){ hl(e.dataset.i, true); });
    e.addEventListener('mouseleave', function(){ hl(e.dataset.i, false); });
    e.addEventListener('focus', function(){ hl(e.dataset.i, true); });
    e.addEventListener('blur', function(){ hl(e.dataset.i, false); });
  });
  function vis(){ return li.filter(function(e){ return !e.classList.contains('off'); }); }
  function tip(){
    var v = li.filter(function(e){ return !e.hidden; }), rr = ol.getBoundingClientRect();
    var left = v.filter(function(e){ return e.getBoundingClientRect().bottom > rr.bottom + 2; }).length, end = ol.scrollTop + ol.clientHeight >= ol.scrollHeight - 4;
    m.classList.toggle('end', end);
    m.innerHTML = end ? '목록 끝 · ' + v.length + '곳' : '↓ 아래로 스크롤하면 <b>' + Math.max(left, 1) + '곳</b> 더 있어요';
  }
  function layout(){
    var v = vis(), narrow = NARROW.matches, fold = narrow && !unfold && v.length > N;
    li.forEach(function(e){ e.hidden = e.classList.contains('off') || (fold && v.indexOf(e) >= N); });
    if (sep) {   // '더 멀리 · 버스 · 지하철로' 줄: 앞뒤에 보이는 곳이 있을 때만
      var all = $$(':scope > li', ol), k = all.indexOf(sep), shown = function(x){ return x.classList.contains('lmli') && !x.hidden; };
      sep.hidden = !(all.slice(0, k).some(shown) && all.slice(k + 1).some(shown));
    }
    if (cnt) cnt.textContent = v.length + '곳';
    if (empty) empty.hidden = v.length > 0;
    if (more) {
      more.hidden = !narrow || v.length <= N;
      mb.setAttribute('aria-expanded', String(unfold));
      mb.textContent = unfold ? '접기' : '나머지 ' + (v.length - N) + '곳 더 보기';
    }
    if (narrow) { box.style.maxHeight = ''; m.hidden = true; return; }
    if (!ol.offsetParent) return;   // 다른 화면을 보는 중(크기를 잴 수 없음) — 화면이 바뀌면 다시 잼
    box.style.maxHeight = lw2 ? Math.max(320, Math.round(lw2.getBoundingClientRect().height)) + 'px' : '';
    m.hidden = !v.length; if (m.hidden) return;
    tip();
    if (ol.scrollHeight <= ol.clientHeight + 4) m.hidden = true;   // 다 보이면 아래 줄 없음
  }
  function ap(){
    pins.concat(li).forEach(function(e){ e.classList.toggle('off', !((w === 'all' || e.dataset.w === w) && (!free || e.dataset.f === 'free'))); });
    pins.forEach(function(p){ p.tabIndex = p.classList.contains('off') ? -1 : 0; });   // 흐린 핀은 Tab에서 뺌(눌러도 안 열림)
    ol.scrollTop = 0; layout();
  }
  function pressW(v){ w = v; bw.forEach(function(x){ x.setAttribute('aria-pressed', x.dataset.lw === v); }); }
  bw.forEach(function(b){ b.addEventListener('click', function(){ pressW(b.dataset.lw); ap(); }); });
  if (bf) bf.addEventListener('click', function(){ free = !free; bf.setAttribute('aria-pressed', free); ap(); });
  if (empty) empty.querySelector('[data-lmreset]').addEventListener('click', function(){ pressW('all'); free = false; if (bf) bf.setAttribute('aria-pressed', 'false'); ap(); });
  if (mb) mb.addEventListener('click', function(){
    unfold = !unfold; layout();
    if (!unfold) mb.scrollIntoView({ block:'nearest', behavior: RM ? 'auto' : 'smooth' });   // 접은 뒤 버튼이 화면 밖이면 그 자리로
  });
  ol.addEventListener('scroll', function(){ if (!NARROW.matches && !m.hidden) tip(); }, { passive:true });
  addEventListener('resize', layout);
  if (NARROW.addEventListener) NARROW.addEventListener('change', function(){ unfold = false; layout(); });
  addEventListener('hashchange', function(){ setTimeout(layout, 80); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout(); setTimeout(layout, 60);
})();

/* ---------- 근처 식당: 혼밥 / 여럿이 · 도보 10분 · 1만 원 이하 ([11]) ---------- */
(function(){
  var bs = $$('[data-fg2]', MAIN), nb = $('#fdNear'), cb = $('#fdCheap'); if (!bs.length) return;
  var g = 'all', near = false, cheap = false;
  function ap(){
    $$('.fd2c', MAIN).forEach(function(c){
      var vis = g === 'all' || c.classList.contains(g); c.hidden = !vis; var n = 0;
      $$('.fd2i', c).forEach(function(i){ var ok = (!near || +i.dataset.w <= 10) && (!cheap || i.dataset.p === '1'); i.hidden = !ok; if (ok) n++; });
      c.querySelector('h3 em').textContent = n + '곳';
    });
    $('.fd2', MAIN).classList.toggle('one', g !== 'all');
  }
  bs.forEach(function(b){ b.addEventListener('click', function(){ g = b.dataset.fg2; bs.forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); ap(); }); });
  if (nb) nb.addEventListener('click', function(){ near = !near; nb.setAttribute('aria-pressed', near); ap(); });
  if (cb) cb.addEventListener('click', function(){ cheap = !cheap; cb.setAttribute('aria-pressed', cheap); ap(); });
})();

/* ---------- 문화 · 여가: 누르면 크게 보기 ([15], 창 dialog.lbx는 index.html에) ---------- */
(function(){
  var map = $('.lmm.one', MAIN), d = $('dialog.lbx', MAIN);
  if (!map || !d || !d.showModal) return;   // <dialog> 없는 옛 브라우저(Safari 15.4 미만)는 크게 보기 없이 목록만
  // 이전 · 다음은 거른 뒤 남은 곳만 돎(860px 이하에서 '더 보기'로 접혀 있는 곳은 포함)
  var lis = $$('.lmap .lmli', MAIN), list = [], cur = 0, byPtr = false;
  var q = function(s){ return d.querySelector(s); };
  function show(k){
    cur = (k + list.length) % list.length;
    var li = list[cur], i = li.dataset.i, pin = map.querySelector('.lmp[data-i="' + i + '"]');
    var im = pin.querySelector('.lmi'), cls = [].slice.call(im.classList).filter(function(c){ return c.indexOf('im-') === 0; }), fig = q('.lbxi');
    fig.className = 'lbxi ' + cls.join(' '); fig.setAttribute('aria-label', li.querySelector('b').textContent);
    var n = q('.lbxn'); n.textContent = li.querySelector('.lmn').textContent; n.classList.toggle('wkd', li.dataset.w === 'wkd');
    q('h3').textContent = li.querySelector('b').textContent; q('.lbxt').innerHTML = li.querySelector('.lmt').innerHTML;
    var ds = li.querySelector('.lmdist'); q('.lbxd').textContent = ds ? ds.textContent : ''; q('.lbxx').textContent = li.querySelector('p').textContent;
    q('.lbxc').textContent = (cur + 1) + ' / ' + list.length;
  }
  function open(i){
    list = lis.filter(function(li){ return !li.classList.contains('off'); });
    var k = -1; list.forEach(function(li, j){ if (li.dataset.i === i) k = j; }); if (k < 0) return;
    $$('[data-go]', d).forEach(function(b){ b.hidden = list.length < 2; });
    show(k); if (!d.open) d.showModal(); q('.lbxx2').focus();
  }
  map.addEventListener('click', function(e){ var p = e.target.closest('.lmp'); if (!p) return; e.preventDefault(); e.stopImmediatePropagation(); if (p.classList.contains('off')) return; byPtr = e.detail > 0; open(p.dataset.i); }, true);
  lis.forEach(function(li){
    li.addEventListener('click', function(e){ byPtr = e.detail > 0; open(li.dataset.i); });
    li.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); byPtr = false; open(li.dataset.i); } });
  });
  q('.lbxx2').addEventListener('click', function(){ d.close(); });
  $$('[data-go]', d).forEach(function(b){ b.addEventListener('click', function(){ show(cur + +b.dataset.go); }); });
  d.addEventListener('click', function(e){ if (e.target === d) d.close(); });
  d.addEventListener('close', function(){
    $$('.lmap .lmp.on,.lmap .lmli.on', MAIN).forEach(function(x){ x.classList.remove('on'); });
    if (byPtr) setTimeout(function(){ var a = document.activeElement; if (a && a.closest && a.closest('.lmp,.lmli')) a.blur(); }, 0);
  });
  d.addEventListener('keydown', function(e){ if (list.length < 2) return; if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
})();

/* ---------- 근처 식당: 5곳이 넘으면 목록 안에서 스크롤 ([16], 안내 줄 p.fdmore는 index.html에) ----------
   861px 이상만. 860px 이하는 모두 펼침(폰에서 목록 안에 스크롤이 갇히던 것 — 숨기는 곳도 1 ~ 2곳뿐, 2026-10-08) */
(function(){
  var N = 5, cs = $$('.fd2c', MAIN); if (!cs.length) return;
  cs.forEach(function(c){
    var ul = c.querySelector('ul'), m = c.querySelector('.fdmore');
    function vis(){ return [].slice.call(ul.children).filter(function(li){ return !li.hidden; }); }
    function upd(){
      var v = vis();
      if (v.length <= N || c.hidden || NARROW.matches) { ul.classList.remove('fdsc'); ul.style.maxHeight = ''; m.hidden = true; return; }
      if (!c.offsetParent) return;   // 다른 화면을 보는 중(크기를 잴 수 없음) — 화면이 바뀌면 다시 잼
      ul.classList.add('fdsc'); var h = 0;
      for (var i = 0; i < N; i++) h += v[i].getBoundingClientRect().height;
      h += Math.round(v[N].getBoundingClientRect().height * .45); ul.style.maxHeight = h + 'px'; m.hidden = false; tip();
    }
    function tip(){
      var v = vis(), left = 0, r = ul.getBoundingClientRect();
      v.forEach(function(li){ if (li.getBoundingClientRect().bottom > r.bottom + 2) left++; });
      var end = ul.scrollTop + ul.clientHeight >= ul.scrollHeight - 4;
      m.classList.toggle('end', end);
      m.innerHTML = end ? '목록 끝 · ' + v.length + '곳' : '↓ 아래로 스크롤하면 <b>' + Math.max(left, 1) + '곳</b> 더 있어요';
    }
    ul.addEventListener('scroll', tip, { passive:true }); c._fdupd = upd;
  });
  function all(){ cs.forEach(function(c){ if (c._fdupd) c._fdupd(); }); }
  $$('[data-fg2],#fdNear,#fdCheap', MAIN).forEach(function(b){ b.addEventListener('click', function(){ setTimeout(all, 0); }); });
  addEventListener('resize', all); addEventListener('hashchange', function(){ setTimeout(all, 80); });
  if (NARROW.addEventListener) NARROW.addEventListener('change', all);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
  setTimeout(all, 50);
})();

/* ---------- 층별 · 공간별 안내(엘리베이터) ----------
   index.html의 구조는 시안 [26](사진을 엘리베이터 안으로) · [28](공간 탭 썸네일)이 만든 모양 그대로.
   공간(.fxs) ↔ 엘리베이터 안 사진(.fxv) ↔ 아래 막대(.fxbar)는 data-k(층-공간)로 짝 지음 */
var FX = $('#pg-facility .fx');
if (FX) {
  var FP = FX.querySelector('.fxp'), E8 = FX.querySelector('.e8');
  var pair = function(sp, sel){ return E8.querySelector(sel + '[data-k="' + sp.dataset.k + '"]'); };

  /* [18] 층 선택 · 공간 탭 · 사진 넘김(몇 번째 사진인지 표시) */
  (function(){
    var r = FX, $$r = function(q, e){ return [].slice.call((e || r).querySelectorAll(q)); };
    function floor(g){
      $$r('.fxf.act').forEach(function(b){ var on = b.dataset.g === g; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      $$r('.fxg').forEach(function(x){ x.hidden = x.dataset.g !== g; });
    }
    $$r('.fxf.act').forEach(function(b){ b.addEventListener('click', function(){ floor(b.dataset.g); }); });
    // 공간 탭: 고른 탭만 Tab 키로 들어가고(나머지 tabindex -1), 안에서는 ← → · Home · End로 옮김(탭 목록 키보드 규칙)
    $$r('.fxg').forEach(function(g){
      var ts = $$r('.fxt', g);
      function pick(t){
        ts.forEach(function(x){ x.setAttribute('aria-selected', x === t); x.tabIndex = x === t ? 0 : -1; });
        $$r('.fxs', g).forEach(function(sp){ sp.hidden = sp.dataset.s !== t.dataset.s; });
      }
      ts.forEach(function(t, i){
        t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
        t.addEventListener('click', function(){ pick(t); });
        t.addEventListener('keydown', function(e){
          var j = { ArrowRight:i + 1, ArrowLeft:i - 1, Home:0, End:ts.length - 1 }[e.key];
          if (j === undefined) return;
          e.preventDefault(); var n = ts[(j + ts.length) % ts.length]; n.focus(); pick(n);
        });
      });
    });
    $$r('.fxs').forEach(function(sp){
      var v = pair(sp, '.fxv'), bar = pair(sp, '.fxbar'); if (!v || !bar) return;
      var tr = v.querySelector('.fxtr'), sl = $$r('.fxsl', v), ds = $$r('.fxd', bar), cap = bar.querySelector('.fxcap'), num = bar.querySelector('.fxn b'), k = 0, n = sl.length;
      function go(j){
        k = (j + n) % n; tr.style.transform = 'translateX(' + (-100 * k) + '%)';
        ds.forEach(function(d, i){ d.classList.toggle('on', i === k); if (i === k) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
        cap.textContent = sl[k].getAttribute('aria-label'); num.textContent = k + 1;
      }
      v.querySelector('.fxa.prev').addEventListener('click', function(){ go(k - 1); });
      v.querySelector('.fxa.next').addEventListener('click', function(){ go(k + 1); });
      ds.forEach(function(d, i){ d.addEventListener('click', function(){ go(i); }); });
      v.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight') { e.preventDefault(); go(k + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(k - 1); } });
      var x0 = null;
      v.addEventListener('pointerdown', function(e){ if (e.target.closest('.fxa')) return; x0 = e.clientX; });
      v.addEventListener('pointerup', function(e){ if (x0 == null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(dx < 0 ? k + 1 : k - 1); });
      if (n < 2) { bar.querySelector('.fxdots').hidden = true; $$r('.fxa', v).forEach(function(a){ a.hidden = true; }); }
    });
  })();

  /* [19] 위(히어로 사진)에서 층을 고르면 엘리베이터가 다 보이게 스크롤 — 고정 헤더 · 붙는 메뉴 높이를 재서 그 아래로 */
  (function(){
    function navBottom(){
      var L = [];
      document.querySelectorAll('body *').forEach(function(el){
        if (FX.contains(el)) return; var c = getComputedStyle(el); if (c.position !== 'sticky' && c.position !== 'fixed') return;
        var r = el.getBoundingClientRect(), t = c.position === 'sticky' && c.top !== 'auto' ? parseFloat(c.top) : r.top;
        if (r.height < 200 && r.width > innerWidth * .5 && t < innerHeight / 2) L.push({ top:t, bottom:t + r.height });
      });
      var m = 0, ch = true;
      while (ch) { ch = false; L.forEach(function(r){ if (r.top <= m + 4 && r.bottom > m) { m = r.bottom; ch = true; } }); }
      return m;
    }
    function bottomBar(){
      var m = innerHeight;
      document.querySelectorAll('body *').forEach(function(el){
        if (FX.contains(el)) return; var c = getComputedStyle(el); if (c.position !== 'fixed') return;
        var r = el.getBoundingClientRect(); if (r.bottom > innerHeight - 4 && r.width > innerWidth * .6) m = Math.min(m, r.top);
      });
      return m;
    }
    function fit(){
      var g = [].find.call(FX.querySelectorAll('.fxg'), function(x){ return !x.hidden; }); if (!g) return;
      var s = [].find.call(g.querySelectorAll('.fxs'), function(x){ return !x.hidden; }); if (!s) return;
      // 기준 = 안내 칸과 엘리베이터 중 위에 있는 것. 860px 이하는 엘리베이터가 안내 칸 위에 쌓여, 안내 칸 기준이면 사진이 헤더 뒤로 숨었음(2026-10-08)
      var top = Math.min(g.getBoundingClientRect().top, E8.getBoundingClientRect().top), bot = E8.getBoundingClientRect().bottom, nb = navBottom(), bb = bottomBar();
      if (top < nb - 2 || bot > bb - 6) scrollTo({ top:scrollY + top - nb - 12, behavior:RM ? 'auto' : 'smooth' });
    }
    FX.addEventListener('click', function(e){ if (!e.isTrusted && !FX.__quiet && e.target.closest('.fxf.act')) requestAnimationFrame(function(){ requestAnimationFrame(fit); }); });
  })();

  /* [25] 엘리베이터: 층 버튼을 누르면 문이 닫히고 표시창이 한 층씩 바뀐 뒤 그 층으로 */
  (function(){
    var num = FX.querySelector('.e8-num'), nm = FX.querySelector('.e8-name'), arw = FX.querySelector('.e8-arw'), busy = false;
    var bs = [].slice.call(FX.querySelectorAll('.fxf.act'));
    function fl(b){ return parseInt(b.querySelector('b').textContent, 10); }
    function label(b){ return b.querySelector('b').textContent + ' ' + b.querySelector('span').textContent; }
    var cur = bs.filter(function(b){ return fl(b) === 2; })[0] || bs[0];
    function mark(b){ bs.forEach(function(x){ x.classList.toggle('cur', x === b); }); cur = b; num.textContent = fl(b) + 'F'; nm.textContent = label(b); }
    mark(cur);
    function press(b){ FX.__quiet = true; b.click(); FX.__quiet = false; }
    FX.addEventListener('click', function(e){
      var b = e.target.closest('.fxf.act'); if (!b) return;
      if (!e.isTrusted) { if (!FX.__quiet) mark(b); return; }   // 히어로 사진 등에서 넘어온 클릭: 표시만 바로 맞춤
      e.stopImmediatePropagation(); e.preventDefault(); if (busy) return;
      var from = fl(cur), to = fl(b);
      if (b === cur || from === to && b.dataset.g === cur.dataset.g) { mark(b); press(b); return; }
      if (RM) { mark(b); press(b); return; }
      busy = true; arw.className = 'e8-arw ' + (to > from ? 'up' : 'dn'); FX.classList.add('e8-closed'); var f = from, step = to > from ? 1 : -1;
      setTimeout(function tick(){
        if (f !== to) { f += step; num.textContent = f + 'F'; setTimeout(tick, 140); return; }
        mark(b); press(b); setTimeout(function(){ FX.classList.remove('e8-closed'); arw.className = 'e8-arw'; busy = false; }, 160);
      }, 460);
    }, true);
  })();

  /* [26] 고른 층 · 공간의 사진과 아래 막대만 보이게 */
  (function(){
    function sync(){
      $$('.fxs', FP).forEach(function(sp){
        var g = sp.closest('.fxg'), on = !sp.hidden && !(g && g.hidden);
        [pair(sp, '.fxv'), pair(sp, '.fxbar')].forEach(function(x){ if (x) x.hidden = !on; });
      });
    }
    new MutationObserver(sync).observe(FP, { attributes:true, attributeFilter:['hidden'], subtree:true }); sync();
  })();

  /* [27] 히어로 사진 → 그 공간 안내 */
  $$('#pg-facility .fh8 .btl').forEach(function(b){ b.addEventListener('click', function(){
    var f = FX.querySelector('.fxf.act[data-g="' + b.dataset.hf + '"]'); if (!f) return; f.click();
    var g = FX.querySelector('.fxg[data-g="' + b.dataset.hf + '"]'), t = g && g.querySelectorAll('.fxt')[+b.dataset.ht || 0]; if (t) t.click();
  }); });
}

route(); spy();
})();
