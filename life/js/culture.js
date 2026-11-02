/* 문화 · 여가 새 사진 디자인 */
/* 문화 · 여가 새 사진 디자인: 펼치기 · 접기 FLIP + 좌우 이동 */
(function(){
  var active = new Map();
  function bindAll(root){
    active.forEach(function(dispose, group){ if(!group.isConnected){ dispose(); active.delete(group); } });
    [].forEach.call((root||document).querySelectorAll('.cf-g'), function(group){ if(!active.has(group)) bind(group); });
  }
  var RMQ = matchMedia('(prefers-reduced-motion: reduce)'), EASE = 'cubic-bezier(.22,.8,.24,1)', DUR = 600, CLOSE_DUR = 360;
  function bind(g){
    active.set(g, function(){});
    var pile = g.querySelector('.cf-pile'), yb = g.querySelector('.cf-yb'), tg = g.querySelector('.cf-tg');
    var cards = [].slice.call(g.querySelectorAll('.cf-card')), heads = [g.querySelector('.cf-h'), tg];
    var title = g.querySelector('.cf-intro h4').textContent, busy = false;
    var pv = g.querySelector('.pv'), nx = g.querySelector('.nx');
    function ph(c){ return c.querySelector('.cf-ph'); }
    function pos(e){ var r = e.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2, w:r.width}; }
    function snap(){ return { h:g.getBoundingClientRect().height, yb:pos(yb), heads:heads.map(pos), c:cards.map(function(c){ return pos(ph(c)); }) }; }
    function measure(){
      if(!g.isConnected || !g.clientWidth || !cards[0].offsetWidth) return;
      var keep = clones.length ? Math.round(rel() / stepW()) : -1;
      var cs = getComputedStyle(g); g.style.setProperty('--cf-w', (g.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) + 'px');
      g.style.setProperty('--cwpx', cards[0].offsetWidth + 'px');
      g.style.setProperty('--pt', pile.offsetTop + 'px');
      if (keep >= 0) keep %= cards.length;
      if (keep >= 0) pile.scrollLeft = setW() + keep * stepW();
      cards.forEach(function(c){ var p = ph(c); c.style.transformOrigin = (p.offsetLeft+p.offsetWidth/2)+'px '+(p.offsetTop+p.offsetHeight/2)+'px'; });
      upd();
    }
    function upd(){ if (clones.length){ pv.disabled = nx.disabled = false; return; } var m = pile.scrollWidth - pile.clientWidth; pv.disabled = pile.scrollLeft <= 2; nx.disabled = m <= 2 || pile.scrollLeft >= m - 2; }
    /* 순환: 펼치면 사진 묶음을 앞뒤로 한 벌씩 복제해 두고, 끝에 닿으면 같은 사진 자리로 몰래 건너뜀 */
    var clones = [], wrapT = 0;
    function stepW(){ return cards[0].offsetWidth + 12; }
    function setW(){ return stepW() * cards.length; }
    function addClones(){
      if (clones.length) return;
      var before = document.createDocumentFragment(), after = document.createDocumentFragment();
      cards.forEach(function(c){
        [before, after].forEach(function(f){ var k = c.cloneNode(true); k.classList.add('cf-clone'); k.setAttribute('aria-hidden','true'); k.removeAttribute('role'); f.appendChild(k); clones.push(k); });
      });
      pile.insertBefore(before, cards[0]); pile.appendChild(after);
    }
    function removeClones(){ clones.forEach(function(k){ k.remove(); }); clones = []; }
    function rel(){ var w = setW(); return ((pile.scrollLeft - w) % w + w) % w; }
    function wrap(){
      if (!clones.length) return;
      var w = setW(), sl = pile.scrollLeft;
      if (sl < w * .5 || sl >= w * 1.5){ pile.style.scrollSnapType = 'none'; pile.scrollLeft = w + rel(); pile.style.scrollSnapType = ''; }
    }
    function onScroll(){ upd(); clearTimeout(wrapT); wrapT = setTimeout(wrap, 140); }
    function apply(open){
      if (!open && clones.length){ var r = rel(); removeClones(); pile.scrollLeft = r; }
      /* 펼치면 노란 −를 사진 띠 밖(카드 묶음)으로 옮겨, 사진을 넘겨도 제자리에 있게 함 */
      var hadFocus = [yb,tg,cl].indexOf(document.activeElement) >= 0;
      if (open) g.appendChild(yb); else pile.appendChild(yb);
      g.classList.toggle('is-open', open);
      [yb,tg].forEach(function(b){ b.setAttribute('aria-expanded', open); });
      yb.setAttribute('aria-label', title + (open ? ' 사진 접기' : ' 사진 펼쳐보기'));
      pile.scrollLeft = 0; measure();
      pile.tabIndex = open ? 0 : -1;
      if (open){ addClones(); pile.scrollLeft = setW(); upd(); }
      if(hadFocus) (open && !yb.offsetParent && cl ? cl : yb).focus({preventScroll:true});
    }
    function slide(e, a, z, duration){ var dx = a.x-z.x, dy = a.y-z.y; return Math.abs(dx)+Math.abs(dy) > 1 ? e.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],{duration:duration,easing:EASE}) : null; }
    function set(open){
      if (busy || open === g.classList.contains('is-open')) return;
      if (RMQ.matches || !g.animate){ apply(open); return; }
      busy = true;
      var duration = open ? DUR : CLOSE_DUR;
      /* 애니메이션 동안 사진이 움직여 스크롤 맞춤(snap)이 엉뚱한 사진에 붙지 않도록 잠시 끔 */
      pile.style.scrollSnapType = 'none';
      if (!open && clones.length){ var r = rel(); removeClones(); pile.scrollLeft = r; }
      var A = snap(); apply(open); var B = snap(), an = [];
      an.push(g.animate([{height:A.h+'px'},{height:B.h+'px'}],{duration:duration,easing:EASE}));
      an.push(slide(yb, A.yb, B.yb, duration));
      heads.forEach(function(e,i){ an.push(slide(e, A.heads[i], B.heads[i], duration)); });
      cards.forEach(function(c,i){
        var a = A.c[i], z = B.c[i], s = a.w/z.w, rt = parseFloat(c.style.getPropertyValue('--rt')) || 0;
        an.push(c.animate([
          {transform:'translate('+(a.x-z.x)+'px,'+(a.y-z.y)+'px) rotate('+(open?rt:0)+'deg) scale('+s+')'},
          {transform:'rotate('+(open?0:rt)+'deg)'}
        ],{duration:duration,easing:EASE,delay:open ? i*45 : 0,fill:'backwards'}));
      });
      g.style.overflow = 'hidden';
      function done(){
        g.style.overflow='';
        if (clones.length) pile.scrollLeft = setW() + Math.round(rel() / stepW()) % cards.length * stepW();
        pile.style.scrollSnapType = ''; upd(); busy = false;
      }
      Promise.all(an.filter(Boolean).map(function(x){ return x.finished; })).then(done, done);
    }
    yb.addEventListener('click', function(e){ e.stopPropagation(); set(!g.classList.contains('is-open')); });
    tg.addEventListener('click', function(){ set(!g.classList.contains('is-open')); });
    pile.addEventListener('click', function(){ if (!g.classList.contains('is-open')) set(true); });
    var cl = g.querySelector('.cf-close');
    if (cl) cl.addEventListener('click', function(){ set(false); });
    pv.addEventListener('click', function(){ pile.scrollBy({left:-(cards[0].offsetWidth+12),behavior:RMQ.matches ? 'auto' : 'smooth'}); });
    nx.addEventListener('click', function(){ pile.scrollBy({left:cards[0].offsetWidth+12,behavior:RMQ.matches ? 'auto' : 'smooth'}); });
    pile.addEventListener('scroll', onScroll, {passive:true});
    pile.addEventListener('keydown', function(event){
      if(!g.classList.contains('is-open')) return;
      SiteUI.railKeys(event, function(direction){ pile.scrollBy({left:direction*stepW(),behavior:RMQ.matches ? 'auto' : 'smooth'}); });
    });
    var observer;
    if (window.ResizeObserver){ observer = new ResizeObserver(measure); observer.observe(g); }
    else addEventListener('resize', measure);
    active.set(g, function(){ if(observer) observer.disconnect(); else removeEventListener('resize', measure); clearTimeout(wrapT); });
    measure();
  }
  bindAll();
  /* 모바일 화면은 내용을 다시 그리므로, 새로 생긴 카드도 묶어 줍니다 */
  new MutationObserver(function(){ bindAll(); }).observe(document.getElementById('main')||document.body,{childList:true,subtree:true});
})();
