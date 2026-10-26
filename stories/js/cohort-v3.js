/* 기수별 이모저모 — 선배들의 이야기 v3 시안(인스타 프로필형): 기수 칩 → 프로필(기수 동그라미 · 계정 · 게시물/영상/기록) → 달별 하이라이트 → 3열 정사각 격자 → 페이지 · 글 창
   자료는 cohorts.html 안 <template id="cv3-data">의 카드(a.st)에서 읽음: 기수(.cg) · 날짜(.dt) · 제목(h3) · 요약(p) · 그림(.illu) · 영상(data-yt)
   기수마다 교육과정 카드 · 계정 · 소개 · 달라진 점은 선배들의 이야기 데이터의 cohortInfos(관리자 '기수 정보' 화면, 새 기수는 백오피스가 앞 기수 모양으로 만듦) */
(function(){
  var root=document.getElementById('cv3'); if(!root) return;
  var hubModal=root.getAttribute('data-hub-modal')==='true';
  var tpl=document.getElementById('cv3-data').content;
  var D=[].slice.call(tpl.querySelectorAll('a.st')).map(function(a){
    var dt=(a.querySelector('.dt')||{}).textContent||'', m=dt.match(/(\d{4})\.\s*(\d{2})\.\s*(\d{2})/);
    return {id:a.id||'', tags:[].slice.call(a.querySelectorAll('[data-story-tags] span')).map(function(t){return t.textContent}), body:[].slice.call(a.querySelectorAll('[data-story-body] p')).map(function(p){return p.textContent}), photos:[].slice.call(a.querySelectorAll('[data-story-photos] img')), coh:parseInt((a.querySelector('.cg')||{}).textContent,10)||0, date:dt.trim(), y:m?+m[1]:0, mo:m?+m[2]:0,
      title:(a.querySelector('h3')||{}).textContent||'', sum:(a.querySelector('p')||{}).textContent||'',
      illu:a.querySelector('.illu'), yt:a.getAttribute('data-yt')||''};
  });
  /* 기수 정보(2026-10-22): 관리자 '기수 정보' 화면(DB cohort_infos)의 내용을 STORIES_DATA.cohortInfos(공개 API · stories-data.js)로 받아
     기수마다 교육과정 카드 · 계정 · 꼬리표 · 달라진 점 버튼 이름 · 소개 · 달라진 점 표 요소를 한 번 만들어 두고 화면 자리로 옮겨요(글자는 textContent로만).
     기수 칩은 만들지 않아요(아래 규칙). 정보가 없는 기수는 예전처럼 기본 글로 */
  var COH_KEY=/^([1-9][0-9]*|3-5)$/;
  function keyOf(c){ return c>=3&&c<=5?'3-5':String(c); }   // 10-13: 3~5기는 한 칩(3–5기)으로 묶음
  var RAW={}, INFO={};
  (typeof STORIES_DATA!=='undefined'&&STORIES_DATA&&Array.isArray(STORIES_DATA.cohortInfos)?STORIES_DATA.cohortInfos:[]).forEach(function(c){
    var key=keyOf(String(c&&c.cohort||'')); if(COH_KEY.test(key)&&!RAW[key]) RAW[key]=c;
  });
  function node(tag,cls,text){ var e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
  function build(key){
    var c=RAW[key], I={has:!!c}; if(!c) return I;
    var L=lab(key), tracks=(c.tracks||[]).filter(Boolean), rows=(c.rows||[]).filter(function(r){return r&&r.item}), bio=c.bio||{};
    if(tracks.length){
      var pin=node('div','cv3-pin'), b=node('b'), cc=node('div','cc'), ft=node('div','ft'), a=node('a','','공식 홈페이지 '), arrow=node('span','','↗'), pn=node('img','pn');
      pin.setAttribute('role','group'); pin.setAttribute('aria-label',L+'기 교육과정');
      b.append(L+'기',document.createElement('br'),'교육과정');
      tracks.forEach(function(t){ cc.appendChild(node('span','',t)); });
      arrow.setAttribute('aria-hidden','true'); a.target='_blank'; a.rel='noopener'; a.appendChild(arrow);
      ft.append(node('p','','자세한 내용은 공식 홈페이지에서 확인하세요.'),a);
      pn.src='assets/pin-white.png'; pn.alt='고정됨'; pn.width=96; pn.height=96;
      pin.append(node('span','k','CURRICULUM'),b,cc,ft,pn);
      I.pin=pin;
    }
    I.acc=node('b','cv3-acc',c.account||acc(key));
    if(c.tag) I.tag=node('span','cv3-tag',c.tag);
    I.label=node('span','cv3-dlabel',c.label||((parseInt(key,10)-1)+'기와 달라진 점'));
    if(bio.title||bio.text){ I.bio=node('p','cv3-bio'); I.bio.append(node('b','',bio.title||''),document.createElement('br'),bio.text||''); }
    if(rows.length){
      I.dt=node('div','cv3-dt');
      rows.forEach(function(r){ var p=node('p','cv3-dr'); p.append(node('b','',r.item),node('s','',r.before||''),node('span','',r.after||'')); I.dt.appendChild(p); });
    }
    return I;
  }
  function info(k){ if(!INFO[k]) INFO[k]=build(k); return INFO[k]; }
  function accName(c){ var a=info(keyOf(c)).acc; return a?a.textContent:acc(c); }
  function el(tag,cls,html){ var e=document.createElement(tag); e.className=cls; e.innerHTML=html; return e; }
  /* 기수 칩 = 게시중인 글이 있는 기수(2026-10-22). 기수 정보만 있는 기수 · 시작 전 기수는 칩이 없어요.
     글을 못 불러왔으면(API 실패 + 사본 없음) story-state.js 가 이 화면을 숨기고 페이지 오류 화면만 보여 줘요 */
  var COHS=[]; function addCoh(k){ if(COH_KEY.test(k)&&COHS.indexOf(k)<0) COHS.push(k); }
  D.forEach(function(d){ addCoh(keyOf(d.coh)); });
  /* 가장 최근 기수(지금은 7기)만 인스타 스토리 그라데이션 링, 나머지는 회색 링(10-14) */
  var LIVE=D.length?keyOf(Math.max.apply(null,D.map(function(d){return d.coh}))):'';
  COHS.sort(function(a,b){return parseInt(b,10)-parseInt(a,10)});
  function inC(d,k){ return k==='3-5'?(d.coh>=3&&d.coh<=5):String(d.coh)===k; }
  function lab(k){ return k==='3-5'?'3–5':k; }
  var PER=9, st={coh:COHS[0], mo:0, pg:1, diff:false, v:'all'};   // v: 보기 방식(모바일 '영상만' 탭, js/stories-m.js). 웹은 늘 'all'
  var $=function(s){return root.querySelector(s)};
  function acc(c){return 'aica_'+String(c).replace('-','to')+'th'}
  function media(d){ var n=d.illu.cloneNode(true); n.removeAttribute('loading'); n.setAttribute('alt',''); return n; }
  function galleryPhotos(d){
    var seen=[], result=[];
    [d.illu].concat(d.photos||[]).forEach(function(photo){
      if(!photo)return;var src=photo.getAttribute('src');
      if(src&&seen.indexOf(src)>=0)return;
      if(src)seen.push(src);result.push(photo);
    });return result.slice(0,10);
  }
  function changePhoto(d,index){
    d.photoIndex=Math.max(0,Math.min(galleryPhotos(d).length-1,index));
    document.querySelectorAll('.cv3-photo-gallery').forEach(function(host){
      if(host.cv3Record===d)host.cv3Render();
    });
  }
  function photoArrows(host,d,onSelect){
    ['prev','next'].forEach(function(direction){
      var button=document.createElement('button');button.type='button';button.className='cv3-photo-arrow cv3-photo-'+direction;
      button.setAttribute('aria-label',(direction==='prev'?'이전':'다음')+' 사진');
      button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(direction==='prev'?'m14 5-7 7 7 7':'m10 5 7 7-7 7')+'"/></svg>';
      button.onclick=function(event){event.preventDefault();event.stopPropagation();var total=galleryPhotos(d).length;changePhoto(d,((d.photoIndex||0)+(direction==='prev'?-1:1)+total)%total);if(onSelect)onSelect();};
      host.appendChild(button);
    });
  }
  function photoDots(host,d,isFeed,onSelect){
    var dots=document.createElement('span');dots.className='cv3-photo-dots';
    if(isFeed)dots.setAttribute('aria-hidden','true');
    else {dots.setAttribute('role','group');dots.setAttribute('aria-label','사진 선택');}
    dots.cv3Total=galleryPhotos(d).length;
    galleryPhotos(d).slice(0,isFeed?5:10).forEach(function(photo,index){
      var dot=document.createElement(isFeed?'i':'button');
      if(!isFeed){
        dot.type='button';dot.setAttribute('aria-label',(index+1)+'번째 사진');
        dot.onclick=function(event){event.preventDefault();event.stopPropagation();changePhoto(d,dot.cv3PhotoIndex);if(onSelect)onSelect();};
      }
      dots.appendChild(dot);
    });host.appendChild(dots);return dots;
  }
  function paintDots(dots,index){
    var visible=dots.children.length,start=Math.max(0,Math.min(index-2,dots.cv3Total-visible));
    [].forEach.call(dots.children,function(dot,i){
      var target=start+i,active=target===index;
      dot.cv3PhotoIndex=target;
      dot.classList.toggle('is-active',active);
      dot.classList.toggle('is-small',!active&&((start>0&&i===1)||(start+visible<dots.cv3Total&&i===visible-2)));
      dot.classList.toggle('is-tiny',!active&&((start>0&&i===0)||(start+visible<dots.cv3Total&&i===visible-1)));
      if(dot.tagName==='BUTTON'){
        dot.setAttribute('aria-label',(target+1)+'번째 사진');
        dot.setAttribute('aria-pressed',String(active));
      }
    });
  }
  function bindPhotoSwipe(host){
    if(host.cv3SwipeBound)return;host.cv3SwipeBound=true;var start;
    host.addEventListener('pointerdown',function(event){
      if(event.button>0||event.target.closest('button'))return;
      start={x:event.clientX,y:event.clientY,id:event.pointerId};
    });
    host.addEventListener('pointermove',function(event){
      if(!start||event.pointerId!==start.id)return;
      var dx=event.clientX-start.x,dy=event.clientY-start.y;
      if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3&&host.setPointerCapture)host.setPointerCapture(event.pointerId);
    });
    host.addEventListener('pointerup',function(event){
      if(!start||event.pointerId!==start.id)return;
      var dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;
      var record=host.cv3Record;if(!record||galleryPhotos(record).length<2)return;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){
        host.cv3SwipeUntil=Date.now()+400;changePhoto(record,(record.photoIndex||0)+(dx<0?1:-1));
        if(host.cv3AfterSwipe)host.cv3AfterSwipe();
      }
    });
    host.addEventListener('pointercancel',function(){start=null;});
    host.addEventListener('dragstart',function(event){event.preventDefault();});
    host.addEventListener('click',function(event){if(Date.now()<(host.cv3SwipeUntil||0)){event.preventDefault();event.stopPropagation();}},true);
    host.addEventListener('keydown',function(event){
      if(host.tagName!=='ARTICLE'||(event.key!=='ArrowLeft'&&event.key!=='ArrowRight'))return;
      var record=host.cv3Record;if(!record||galleryPhotos(record).length<2)return;
      event.preventDefault();event.stopPropagation();changePhoto(record,(record.photoIndex||0)+(event.key==='ArrowLeft'?-1:1));
    });
  }
  function gallery(host,d){
    host.classList.add('cv3-photo-gallery');host.cv3Record=d;
    var photos=galleryPhotos(d),stage=document.createElement('div');stage.className='cv3-photo-stage';host.appendChild(stage);
    var count,dots,isFeed=host.tagName==='ARTICLE';
    if(photos.length>1){
      count=document.createElement('span');count.className=isFeed?'cv3-photo-stack':'cv3-photo-count';
      if(isFeed){count.setAttribute('role','img');count.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20h8a4 4 0 0 0 4-4V8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><rect x="3" y="3" width="13" height="13" rx="3" fill="currentColor"/></svg>';}
      else count.setAttribute('aria-live','polite');host.appendChild(count);
      dots=photoDots(host,d,isFeed);photoArrows(host,d);
    }
    host.cv3Render=function(){
      var index=Math.min(d.photoIndex||0,photos.length-1),img=photos[index].cloneNode(true);
      img.classList.add('illu');img.removeAttribute('id');img.removeAttribute('loading');
      if(img.tagName==='IMG')img.setAttribute('alt',img.getAttribute('alt')||d.title+' 사진 '+(index+1));
      stage.replaceChildren(img);
      if(count){if(isFeed)count.setAttribute('aria-label','사진 '+photos.length+'장 · '+(index+1)+'번째 사진');else count.textContent=(index+1)+'/'+photos.length;}
      if(dots)paintDots(dots,index);
    };
    bindPhotoSwipe(host);host.cv3Render();return stage;
  }
  function ym(d){ return d.y*100+d.mo; }
  function list(){ return D.filter(function(d){return inC(d,st.coh) && (!st.mo||ym(d)===st.mo) && (st.v!=='video'||d.yt)}).sort(function(a,b){return b.date.localeCompare(a.date)}); }
  function yymm(d){ return String(d.y).slice(2)+'. '+String(d.mo).padStart(2,'0')+'.'; }

  function chips(){
    var box=$('.cv3-chips'); box.innerHTML='';
    COHS.forEach(function(c,i){
      var b=document.createElement('button'); b.type='button'; b.setAttribute('aria-pressed',c===st.coh);
      b.innerHTML=lab(c)+'기'+(i===0?'<i aria-hidden="true"></i>':'');
      b.onclick=function(){ st.coh=c; st.mo=0; st.pg=1; st.diff=false; draw(); var chosen=$('.cv3-chips button[aria-pressed=\"true\"]'); if(chosen)chosen.focus({preventScroll:true}); };
      box.appendChild(b);
    });
  }
  function profile(){
    var all=D.filter(function(d){return inC(d,st.coh)}).sort(function(a,b){return ym(a)-ym(b)});
    var vids=all.filter(function(d){return d.yt}).length;
    var range=all.length?yymm(all[0])+' – '+yymm(all[all.length-1]):'없음';
    var I=info(st.coh), hasDiff=!!(I.dt&&I.dt.querySelector('.cv3-dr')), L=lab(st.coh), prof=$('.cv3-prof');
    // 다시 그릴 때 innerHTML 로 비우면 옮겨 둔 기수 정보 요소는 화면에서만 빠지고(I 에 남음) 아래에서 다시 붙여요
    prof.innerHTML='<span class="cv3-ring'+(st.coh==='3-5'?' is-grp':'')+(st.coh===LIVE?' is-live':'')+'" role="img" aria-label="'+L+'기"><span aria-hidden="true"><b>'+L+'</b></span></span>'
      +'<div class="cv3-info"><div class="cv3-r1"></div>'
      +'<div class="cv3-stat"><span>게시물 <b>'+all.length+'</b></span><span>영상 <b>'+vids+'</b></span><span>기록 <b>'+range+'</b></span></div></div>';
    var r1=prof.querySelector('.cv3-r1');
    r1.appendChild(I.acc||el('b','cv3-acc',acc(st.coh)));
    // 기수 정보에서 꼬리표를 비웠으면 꼬리표 없이(정보가 없는 기수만 기본 꼬리표)
    if(I.tag||!I.has) r1.appendChild(I.tag||el('span','cv3-tag','인공지능사관학교'));
    if(hasDiff){
      var db=document.createElement('button'); db.type='button'; db.className='cv3-dbtn'; db.setAttribute('aria-expanded',st.diff);
      db.appendChild(I.label||el('span','cv3-dlabel',(parseInt(st.coh,10)-1)+'기와 달라진 점'));
      db.appendChild(document.createTextNode(' '+(st.diff?'접기 ▴':'펼치기 ▾')));
      db.onclick=function(){ st.diff=!st.diff; draw(); };
      r1.appendChild(db);
    }
    // 소개: 블록이 있으면 페이지 관리 원본 그대로, 없으면 기본 문구(칩은 게시물이 있는 기수만이라 기다림 문구는 대비용)
    prof.querySelector('.cv3-info').appendChild(I.bio||el('p','cv3-bio','<b>인공지능사관학교 '+L+'기</b><br>'+(all.length?'입교식부터 수료식까지, '+L+'기가 남긴 순간들을 모았어요.':'새로운 기수의 이야기를 기다리고 있어요.')));
    var box=$('.cv3-diff'); box.hidden=!(hasDiff&&st.diff);
    if(hasDiff&&st.diff) box.replaceChildren(I.dt); else box.replaceChildren();
  }
  function highlights(){
    var all=D.filter(function(d){return inC(d,st.coh)});
    var mos=[]; all.forEach(function(d){ if(mos.indexOf(ym(d))<0) mos.push(ym(d)); }); mos.sort(function(a,b){return a-b});
    var multiY=mos.length&&Math.floor(mos[0]/100)!==Math.floor(mos[mos.length-1]/100);
    var box=$('.cv3-hl'), scroll=box.dataset.coh===String(st.coh)?box.scrollLeft:0; box.dataset.coh=st.coh; box.innerHTML='';box.hidden=!all.length;if(!all.length)return;
    [0].concat(mos).forEach(function(m){
      var items=all.filter(function(d){return !m||ym(d)===m}).sort(function(a,b){return ym(b)-ym(a)});
      var b=document.createElement('button'); b.type='button'; b.setAttribute('aria-pressed',st.mo===m);
      var ring=document.createElement('span'); ring.className='cv3-hr'; var ph=document.createElement('span'); ph.appendChild(media(items[0])); ring.appendChild(ph);
      b.appendChild(ring); b.insertAdjacentHTML('beforeend','<b>'+(m?(multiY?String(Math.floor(m/100)).slice(2)+'. '+(m%100)+'월':(m%100)+'월'):'전체')+'</b><small>'+items.length+'개</small>');
      b.onclick=function(){ st.mo=m; st.pg=1; draw(); };
      box.appendChild(b);
    });
    box.scrollLeft=scroll;
  }
  /* 교육과정 고정 게시물(10-13, 디자인통일v1과 같은 내용): 기수마다 격자 첫 칸에 고정. 카드는 기수 정보 블록의 .cv3-pin(카테고리 페이지 관리에서 고침, 2026-10-22).
     카드가 없는 기수(3–5기)는 안 보임 */
  var OFFICIAL=(typeof SITE_LINKS!=='undefined'&&SITE_LINKS.official&&SITE_LINKS.official.url)||'https://support.gj-aischool.or.kr/fo/main';
  function pinOn(){ return !!info(st.coh).pin && !st.mo && st.v!=='video'; }
  function pinEl(){ var d=info(st.coh).pin, a=d.querySelector('.ft a'); if(a) a.href=OFFICIAL; return d; }
  function grid(){
    var L=list(), P=pinOn(), first=P?PER-1:PER, pages=Math.max(1,1+Math.ceil(Math.max(0,L.length-first)/PER)); if(st.pg>pages) st.pg=pages;
    var s0=st.pg===1?0:first+(st.pg-2)*PER, s1=st.pg===1?first:s0+PER;
    $('.cv3-gt').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>'+lab(st.coh)+'기 · '+(st.mo?(st.mo%100)+'월':'전체')+' 기록 '+L.length+'개';
    var g=$('.cv3-grid'),empty=$('[data-cohort-filter-empty]');
    if(!empty){empty=document.createElement('div');empty.setAttribute('data-cohort-filter-empty','');g.after(empty);}
    empty.hidden=!!L.length;g.hidden=!L.length;$('.cv3-pg').hidden=!L.length;
    g.innerHTML='';
    if(!L.length){
      $('.cv3-pg').replaceChildren();
      if(typeof StoryState!=='undefined')StoryState.render(empty,'filter',{subject:'기수 이야기',onReset:function(){
        st.mo=0;st.v='all';st.pg=1;draw();
        var button=root.querySelector('.sm-cv-views [data-v="all"]')||root.querySelector('.cv3-chips [aria-pressed="true"]');if(button)button.focus({preventScroll:true});
      }});
      return;
    }
    if(P&&st.pg===1)g.appendChild(pinEl());
    L.slice(s0,s1).forEach(function(d){
      var tile=document.createElement('article');tile.className='cv3-it';
      var a=document.createElement('a');a.href='#';a.className='cv3-open';a.setAttribute('aria-label',d.title+(d.yt?' (영상)':''));
      if(d.yt)a.appendChild(media(d));else{
        var stage=gallery(tile,d);a.appendChild(stage);
      }
      if(d.yt)a.insertAdjacentHTML('beforeend','<svg class="cv3-reel" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="6" fill="#fff"/><path d="M10 7.5v9l6.5-4.5z" fill="#14233F"/></svg>');
      var overlay=document.createElement('span');overlay.className='cv3-ov';
      var title=document.createElement('b');title.textContent=d.title;overlay.appendChild(title);
      var date=document.createElement('span');date.textContent=d.date;overlay.appendChild(date);a.appendChild(overlay);
      a.onclick=function(e){e.preventDefault();openM(L.indexOf(d));};
      tile.insertBefore(a,tile.firstChild);g.appendChild(tile);
    });
    var nav=root.querySelector('.cv3-pg'); nav.innerHTML='';
    var row=document.createElement('div'); row.className='cv3-pgr';
    function pb(t,to,o){ var b=document.createElement('button'); b.type='button'; b.textContent=t; if(o.cur) b.setAttribute('aria-current','page'); if(o.dis) b.disabled=true; if(o.aria) b.setAttribute('aria-label',o.aria);
      b.onclick=function(){ st.pg=to; draw(); root.scrollIntoView({behavior:'smooth',block:'start'}); }; row.appendChild(b); }
    pb('←',st.pg-1,{dis:st.pg===1,aria:'이전 페이지'}); for(var i=1;i<=pages;i++) pb(String(i),i,{cur:i===st.pg,aria:i+'페이지'}); pb('→',st.pg+1,{dis:st.pg===pages,aria:'다음 페이지'});
    nav.appendChild(row);
  }
  function draw(){ if(hubModal)return; chips(); profile(); highlights(); grid(); root.dispatchEvent(new CustomEvent('cv3:draw',{detail:{v:st.v}})); }
  /* 모바일 보기 방식 탭(js/stories-m.js)이 부름 */
  if(COHS.length)root.cv3View=function(v){ st.v=v; st.pg=1; draw(); };
  root.cv3Redraw=function(){ draw(); };

  /* 글 창 */
  var M=document.querySelector('.cv3-m'), cur=0, last=null, modalVisited=[];
  // Isolate the active dialog, including nested photo zoom, without changing layout.
  // Restore each sibling's previous inert state when switching or closing scopes.
  var dialogScope=SiteUI.createDialogScope();
  function isolateDialog(dialog){ if(dialog)dialogScope.activate(dialog);else dialogScope.release(); }
  function trapDialogFocus(event,dialog){SiteUI.trapFocus(event,dialog);}
  // Only a whole hashtag-only final paragraph is a legacy caption tag line.
  // A heading ("# 제목") or a sentence containing # stays ordinary body text.
  function captionParts(d){
    var paragraphs=[d.sum || ''].concat(d.body || []);
    var tagName=/^[\p{L}\p{M}\p{N}_]+$/u;
    // Saved tags may hold single spaces ("멘토 매칭데이"), as the backoffice keeps them (V40).
    var savedTag=/^[\p{L}\p{M}\p{N}_]+(?: [\p{L}\p{M}\p{N}_]+)*$/u;
    var tags=(Array.isArray(d.tags)?d.tags:[]).filter(function(t){return typeof t==='string'}).map(function(t){return t.trim().replace(/^#/, '').replace(/\s+/g,' ')}).filter(function(t){return savedTag.test(t)});
    if(!tags.length){
      var last=paragraphs[paragraphs.length-1], tokens=typeof last==='string'?last.trim().split(/\s+/):[];
      if(tokens.length && tokens.every(function(t){return t[0]==='#' && tagName.test(t.slice(1))})){
        tags=tokens.map(function(t){return t.slice(1)}); paragraphs.pop();
      }
    }
    return {paragraphs:paragraphs,tags:Array.from(new Set(tags))};
  }
  function renderCaption(box,d){
    box.querySelectorAll('[data-extra-story]').forEach(function(e){e.remove()});
    var caption=captionParts(d), first=box.querySelector('p');
    first.textContent=caption.paragraphs[0] || ''; first.hidden=!caption.paragraphs.length;
    caption.paragraphs.slice(1).forEach(function(text){var p=node('p','',text);p.dataset.extraStory='';box.appendChild(p)});
    if(caption.tags.length){
      var line=node('p','cv3-hashtags');line.dataset.extraStory='';
      caption.tags.forEach(function(tag){line.appendChild(node('span','', '#'+tag))});box.appendChild(line);
    }
  }
  function fill(){
    var L=list(), d=L[cur]; if(!d) return;
    if(modalVisited.indexOf(d)<0)modalVisited.push(d);
    var md=M.querySelector('.cv3-m-media'); md.innerHTML=''; md.classList.remove('can-zoom','cv3-photo-gallery');md.cv3Record=null;
    if(d.yt)md.appendChild(media(d));else gallery(md,d);
    if(d.yt){ var id=null;
      try { var url=new URL(d.yt), host=url.hostname.toLowerCase();
        id=host==='youtu.be'?url.pathname.slice(1):['youtube.com','www.youtube.com','m.youtube.com'].indexOf(host)>-1?url.searchParams.get('v'):null;
      } catch(e) {}
      if(!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) id=null;
      var p=document.createElement('button'); p.type='button'; p.className='cv3-play'; p.setAttribute('aria-label','영상 재생'); p.innerHTML='<i></i>';
      p.onclick=function(){ if(!id) return;
        var frame=document.createElement('iframe'); frame.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&playsinline=1';
        frame.title=d.title; frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen'; frame.allowFullscreen=true;
        md.replaceChildren(frame); };
      if(id) md.appendChild(p); }
    else { /* 사진 크게 보기(10-14): 오른쪽 위 버튼 · 사진 클릭 */
      var z=document.createElement('button'); z.type='button'; z.className='cv3-zoom'; z.setAttribute('aria-label','사진 크게 보기');
      z.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>';
      z.onclick=openZ; md.querySelector('.cv3-photo-stage').addEventListener('click',openZ); md.classList.add('can-zoom'); md.appendChild(z); }
    M.querySelector('.cv3-av').innerHTML='<b>'+d.coh+'</b>';
    M.querySelector('.cv3-m-acc').textContent=accName(d.coh);
    var heading=M.querySelector('h3'), account=document.createElement('b'); account.textContent=accName(d.coh);
    heading.replaceChildren(account, document.createTextNode(' '+d.title));
    renderCaption(M.querySelector('.cv3-m-body'),d);

    M.querySelector('time').textContent=d.date;
    M.querySelectorAll('.cv3-like,.cv3-save').forEach(function(b){b.setAttribute('aria-pressed','false')});
    M.querySelector('.no').textContent=(cur+1)+' / '+L.length;
    M.querySelector('.pv').disabled=cur===0; M.querySelector('.nx').disabled=cur===L.length-1;
  }
  /* 크게 보기 창: 어두운 바탕 + 사진 전체(잘림 없이). ←/→로 넘기면 같이 바뀜 */
  var Z=document.createElement('div'); Z.className='cv3-zv'; Z.hidden=true; Z.setAttribute('role','dialog'); Z.setAttribute('aria-modal','true'); Z.setAttribute('aria-label','사진 크게 보기');
  Z.innerHTML='<button type="button" class="cv3-zv-x" aria-label="크게 보기 닫기">&times;</button><figure><div class="cv3-zv-im"></div><figcaption></figcaption></figure>';
  document.body.appendChild(Z);
  function zfill(){ var d=list()[cur]; if(!d||d.yt){ closeZ(); return; } var n=galleryPhotos(d)[d.photoIndex||0].cloneNode(true);
    if(n.tagName==='IMG'){ var sm=n.getAttribute('src'); if(/-sm\.(jpe?g|png|webp)$/i.test(sm)){ n.src=sm.replace(/-sm(\.[a-z]+)$/i,'$1'); n.onerror=function(){ n.onerror=null; n.src=sm; }; } n.removeAttribute('width'); n.removeAttribute('height'); }
    n.setAttribute('alt',n.getAttribute('alt')||d.title); var b=Z.querySelector('.cv3-zv-im');
    // Rebuilding the album must preserve the keyboard control that changed it.
    var active=document.activeElement,restore=null;
    if(b.contains(active)){
      if(active.classList.contains('cv3-photo-prev'))restore='.cv3-photo-prev';
      else if(active.classList.contains('cv3-photo-next'))restore='.cv3-photo-next';
      else if(active.closest('.cv3-photo-dots'))restore='.cv3-photo-dots button[aria-pressed="true"]';
    }
    b.innerHTML=''; b.appendChild(n);
    var photos=galleryPhotos(d);
    b.cv3Record=d;b.cv3AfterSwipe=zfill;bindPhotoSwipe(b);
    if(photos.length>1){var dots=photoDots(b,d,false,zfill);paintDots(dots,d.photoIndex||0);photoArrows(b,d,zfill);}
    if(restore){var target=b.querySelector(restore);if(target)target.focus({preventScroll:true});}
    Z.querySelector('figcaption').textContent=d.title+' · '+d.date+' · '+((d.photoIndex||0)+1)+' / '+galleryPhotos(d).length; }
  function openZ(){ zfill(); Z.hidden=false; isolateDialog(Z); Z.querySelector('.cv3-zv-x').focus(); }
  function closeZ(){ if(Z.hidden) return; Z.hidden=true; Z.querySelector('.cv3-zv-im').innerHTML=''; isolateDialog(M); (M.querySelector('.cv3-zoom')||M.querySelector('.cv3-m-x')).focus(); }
  Z.onclick=function(e){ if(Date.now()<(Z.querySelector('.cv3-zv-im').cv3SwipeUntil||0))return;if(!e.target.closest('.cv3-zv-im img,.cv3-zv-im svg,.cv3-photo-dots')) closeZ(); };
  function openM(i){ modalVisited=[];cur=i; last=document.activeElement; fill(); M.hidden=false; isolateDialog(M); document.documentElement.classList.add('cv3-lock'); M.querySelector('.cv3-m-x').focus(); }
  function closeM(restoreFocus){ Z.hidden=true; M.hidden=true; modalVisited.forEach(function(d){changePhoto(d,0);});modalVisited=[];M.querySelector('.cv3-m-media').innerHTML=''; isolateDialog(null); document.documentElement.classList.remove('cv3-lock'); if(hubModal&&/^#st-/.test(location.hash))history.replaceState(null,'',location.pathname+location.search); if(restoreFocus!==false&&last&&document.contains(last)) last.focus({preventScroll:true}); }
  M.querySelector('.cv3-m-x').onclick=closeM; M.querySelector('.cv3-m-bg').onclick=closeM;
  if(hubModal)root.closest('.stories-page').addEventListener('stories:before-review-open',function(){
    if(!M.hidden)closeM(false);
  });
  M.querySelector('.pv').onclick=function(){ if(cur>0){cur--;fill();} };
  M.querySelector('.nx').onclick=function(){ if(cur<list().length-1){cur++;fill();} };
  M.querySelectorAll('.cv3-like,.cv3-save').forEach(function(b){ b.onclick=function(){ b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true'); }; });
  document.addEventListener('keydown',function(e){ if(M.hidden) return; if(e.key==='Tab'){ trapDialogFocus(e,Z.hidden?M:Z); return; } if(e.key==='Escape'){ if(!Z.hidden) closeZ(); else closeM(); return; } if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();var d=list()[cur];if(d&&!d.yt&&galleryPhotos(d).length>1)changePhoto(d,(d.photoIndex||0)+(e.key==='ArrowLeft'?-1:1));else M.querySelector(e.key==='ArrowLeft'?'.pv':'.nx').click();if(!Z.hidden)zfill();} });

  function hashOpen(){
    var id=location.hash.slice(1), d=D.find(function(item){return item.id&&item.id===id});if(!d)return;
    st.coh=d.coh>=3&&d.coh<=5?'3-5':String(d.coh);st.mo=0;st.pg=1;draw();openM(list().indexOf(d));
  }
  if(!COHS.length)return; // Shared list state (story-state.js); no mobile projection or profile when there is no cohort at all.
  draw();hashOpen();addEventListener('hashchange',function(){
    if(hubModal&&!/^#st-/.test(location.hash)&&!M.hidden)closeM();
    hashOpen();
  });
})();
