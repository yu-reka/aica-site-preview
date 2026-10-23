/* =========================================================
   선배들의 이야기 — 섹션별 추가 동작
   (전체 인터뷰 목록 · 영상 인터뷰 재생, 인터뷰 페이지만)
   stories.js보다 먼저 불러옵니다(defer 순서)
   글 수 숫자(전체 인터뷰 옆 개수 · 더 보기 남은 수)는 안 씀(2026-10-08 사용자 결정)
   ========================================================= */

(function(){
  var sec=document.getElementById('iv-all');if(!sec)return;
  var src=[].slice.call(document.querySelectorAll('#p-iv .ivgrid a.iv'));
  var D=src.map(function(a){
    var av=a.querySelector('.by .av'),c=av?parseInt(av.textContent,10):0,dur=a.querySelector('.ph .dur');
    return {a:a,c:c,v:!!dur,t:(a.querySelector('h3')||{}).textContent||'',s:(a.querySelector('.tb p')||{}).textContent||'',n:(a.querySelector('.by b')||{}).textContent||'',tr:(a.querySelector('.by em')||{}).textContent||''};
  });
  var STEP=6,pg=1,coh='all',view='grid';   // 10-13: '더 보기' → 기수별 이모저모와 같은 숫자 페이지(6개씩)
  var out=sec.querySelector('.iva-out'),empty=sec.querySelector('.iva-empty');
  function chip(box,val,label,curv){var b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',val===curv);b.onclick=function(){coh=val;pg=1;draw()};box.appendChild(b)}
  function chips(){
    var cb=sec.querySelector('[data-f=coh]');cb.innerHTML='';
    chip(cb,'all','전체 기수',coh);
    var groups=[]; D.forEach(function(d){var c=d.c>=3&&d.c<=5?'3-5':String(d.c);if(d.c&&groups.indexOf(c)<0)groups.push(c)});
    groups.sort(function(a,b){return parseInt(b,10)-parseInt(a,10)}).forEach(function(c){chip(cb,c,c==='3-5'?'3–5기':c+'기',coh)});
  }
  // 후기 카드처럼 실제 두 줄에 들어가는 글자 수를 재고 가운데 세 점을 씁니다.
  var excerpts=new WeakMap();
  var segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ko',{granularity:'grapheme'}):null;
  function fitExcerpt(el){
    var state=excerpts.get(el);if(!state||!el.clientWidth)return;
    function write(text){if(state.span.textContent!==text)state.span.textContent=text}
    write(state.source);
    if(view!=='grid'||matchMedia('(max-width:600px)').matches||!el.clientHeight)return;
    var line=parseFloat(getComputedStyle(el).lineHeight),allowed=state.lines*line;
    if(!(line>0)||state.span.offsetHeight<=allowed+.5)return;
    var chars=segmenter?Array.from(segmenter.segment(state.source),function(p){return p.segment}):Array.from(state.source);
    var low=0,high=chars.length;
    while(low<high){
      var mid=Math.ceil((low+high)/2);write(chars.slice(0,mid).join('').trimEnd()+'⋯');
      if(state.span.offsetHeight<=allowed+.5)low=mid;else high=mid-1;
    }
    write(chars.slice(0,low).join('').trimEnd()+'⋯');
  }
  var excerptResize=new ResizeObserver(function(entries){entries.forEach(function(entry){fitExcerpt(entry.target)})});
  function excerpt(el,text,lines){
    var span=document.createElement('span');span.className='iva-excerpt';span.textContent=text;el.replaceChildren(span);
    excerpts.set(el,{source:text,span:span,lines:lines||2});excerptResize.observe(el);
  }
  function fitExcerpts(){out.querySelectorAll('h4,p,.by').forEach(fitExcerpt)}
  document.fonts.ready.then(fitExcerpts);
  addEventListener('resize',fitExcerpts);
  function card(d){
    var a=document.createElement('a');a.className='iva-c';a.href=d.a.getAttribute('href');
    if(d.a.target){a.target=d.a.target;a.rel='noopener'}
    var ph=d.a.querySelector('.ph').cloneNode(true);ph.querySelectorAll('[id]').forEach(function(x){x.removeAttribute('id')});
    ph.querySelectorAll('img[srcset]').forEach(function(img){img.sizes=view==='list'?'(max-width: 640px) 64px, 80px':'(max-width: 640px) 64px, (max-width: 1000px) 45vw, 304px'});
    a.appendChild(ph);
    var tx=document.createElement('div');
    var h=document.createElement('h4');excerpt(h,d.t);if(d.v){var bd=document.createElement('span');bd.className='iva-badge';bd.textContent='영상';h.appendChild(bd)}
    var p=document.createElement('p');excerpt(p,d.s);tx.appendChild(h);tx.appendChild(p);a.appendChild(tx);
    // 10-13: 기수 동그라미 대신 '7기 · 김ㅇㅇ · AI 모델링' 한 줄 글자
    var by=document.createElement('div');by.className='by by-t';by.textContent=[d.c?d.c+'기':'',d.n,d.tr].filter(Boolean).join(' · ');
    a.setAttribute('aria-label',[d.t,d.s,by.textContent].filter(Boolean).join(' '));
    excerpt(by,by.textContent,1);
    if(view==='grid')tx.appendChild(by);else a.appendChild(by);
    return a;
  }
  function draw(){
    chips();
    sec.querySelectorAll('.iva-seg button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.v===view)});
    var list=D.filter(function(d){return (coh==='all'||(coh==='3-5'?(d.c>=3&&d.c<=5):String(d.c)===coh))});
    excerptResize.disconnect();out.dataset.view=view;out.innerHTML='';
    var pages=Math.max(1,Math.ceil(list.length/STEP));if(pg>pages)pg=pages;
    list.slice((pg-1)*STEP,pg*STEP).forEach(function(d){out.appendChild(card(d))});
    if(!list.length&&D.length&&typeof StoryState!=='undefined')StoryState.render(empty,'filter',{subject:'인터뷰',onReset:function(){coh='all';pg=1;draw();sec.querySelector('[data-f=coh] button').focus({preventScroll:true});}});
    empty.hidden=!D.length||list.length>0;
    nav.innerHTML='';nav.hidden=pages<2;
    if(pages>1){
      nav.appendChild(pbtn('←',pg-1,{dis:pg===1,aria:'이전 페이지'}));
      for(var i=1;i<=pages;i++)nav.appendChild(pbtn(String(i),i,{cur:i===pg,aria:i+'페이지'}));
      nav.appendChild(pbtn('→',pg+1,{dis:pg===pages,aria:'다음 페이지'}));
    }
  }
  var nav=document.createElement('nav');nav.className='cpager';nav.setAttribute('aria-label','인터뷰 페이지');empty.after(nav);
  function pbtn(label,to,o){var b=document.createElement('button');b.type='button';b.textContent=label;
    if(o.cur)b.setAttribute('aria-current','page');if(o.dis)b.disabled=true;if(o.aria)b.setAttribute('aria-label',o.aria);
    b.onclick=function(){pg=to;draw();var top=sec.getBoundingClientRect().top+scrollY-140;scrollTo({top:top,behavior:'smooth'})};return b}
  sec.querySelectorAll('.iva-seg button').forEach(function(b){b.onclick=function(){view=b.dataset.v;draw()}});
  // Page re-entry, including the browser back/forward cache, starts in grid view.
  addEventListener('pageshow',function(){if(view!=='grid'){view='grid';draw()}});
  draw();
})();

(function(){
  document.querySelectorAll('.ivvid[data-yt]').forEach(function(box){
    var id=box.dataset.yt;if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
    var orig=box.innerHTML,detail=box.closest('.ivd');
    function bind(){var b=box.querySelector('.ivplay');if(b)b.onclick=function(){
      var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&playsinline=1';
      f.title=(detail.querySelector('h2')||{}).textContent||'인터뷰 영상';f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;
      var tag=box.querySelector('.ivtag');box.replaceChildren();if(tag)box.appendChild(tag);box.appendChild(f);f.focus();
    }}
    bind();
    addEventListener('hashchange',function(){if(location.hash!=='#'+detail.id&&box.querySelector('iframe')){box.innerHTML=orig;bind()}});
  });
})();

/* 인터뷰 본문 위치와 질문 목차를 동기화합니다. 문서 대신 목차만 스크롤합니다. */
(function(){
  var states=[],frame=0,keyboardIntent=false;
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var mobile=matchMedia('(max-width: 600px)');
  document.querySelectorAll('.ivd .sidebox > ol').forEach(function(list){
    var detail=list.closest('.ivd');
    var pairs=[].slice.call(list.querySelectorAll('a[href^="#"]')).map(function(link){
      var section=document.getElementById(link.hash.slice(1));
      return section&&detail.contains(section)?{link:link,section:section}:null;
    }).filter(Boolean);
    if(!pairs.length)return;
    var state={detail:detail,list:list,pairs:pairs,current:null,pauseUntil:0,pressed:false,keyboard:false};
    states.push(state);
    var pauseTimer;
    function pause(){
      state.pauseUntil=performance.now()+1800;
      clearTimeout(pauseTimer);pauseTimer=setTimeout(schedule,1850);
    }
    list.addEventListener('wheel',pause,{passive:true});
    list.addEventListener('touchmove',pause,{passive:true});
    list.addEventListener('pointerdown',function(){state.pressed=true;state.keyboard=false;pause()});
    addEventListener('pointerup',function(){if(state.pressed){state.pressed=false;pause()}});
    addEventListener('pointercancel',function(){state.pressed=false;pause()});
    list.addEventListener('keydown',function(){state.keyboard=true;pause()});
    list.addEventListener('focusin',function(){state.keyboard=keyboardIntent});
    list.addEventListener('focusout',function(e){if(!list.contains(e.relatedTarget)){state.keyboard=false;pause()}});
  });
  if(!states.length)return;
  document.addEventListener('keydown',function(e){if(e.key==='Tab')keyboardIntent=true},true);
  document.addEventListener('pointerdown',function(){keyboardIntent=false},true);
  function update(){
    frame=0;
    // 모바일 목차는 본문 뒤에 있으므로 읽기 위치 추적 없이 직접 탐색합니다.
    if(mobile.matches){
      states.forEach(function(s){
        if(!s.current)return;
        s.pairs.forEach(function(pair){pair.link.removeAttribute('aria-current')});
        s.current=null;s.list.scrollTop=0;
      });
      return;
    }
    var target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)))}catch(e){}
    var detail=target&&target.closest('.ivd');
    var state=states.find(function(s){return s.detail===detail});
    if(!state||!detail.getClientRects().length)return;
    var header=document.getElementById('siteHeader');
    var readingLine=Math.max(header?header.getBoundingClientRect().bottom+32:100,innerHeight*.25);
    var active=state.pairs[0];
    state.pairs.forEach(function(pair){if(pair.section.getBoundingClientRect().top<=readingLine)active=pair});
    if(state.current!==active){
      state.pairs.forEach(function(pair){if(pair===active)pair.link.setAttribute('aria-current','location');else pair.link.removeAttribute('aria-current')});
      state.current=active;
    }
    if(state.pressed||state.keyboard||performance.now()<state.pauseUntil)return;
    var list=state.list,box=list.getBoundingClientRect();
    if(box.bottom<=0||box.top>=innerHeight)return;
    var item=active.link.getBoundingClientRect(),delta=0;
    if(item.top<box.top+8)delta=item.top-box.top-8;
    else if(item.bottom>box.bottom-8)delta=item.bottom-box.bottom+8;
    if(Math.abs(delta)>1)list.scrollBy({top:delta,behavior:reduced.matches?'instant':'smooth'});
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update)}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  addEventListener('hashchange',schedule);
  addEventListener('pageshow',schedule);
  document.fonts&&document.fonts.ready.then(schedule);
  schedule();
})();
