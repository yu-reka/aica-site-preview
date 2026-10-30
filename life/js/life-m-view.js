/* Read the built, validated LIFE markup once and render mobile HTML.
   This factory owns presentation only. The controller owns mutable state and events.
   Existing IDs stay on the desktop source; the mobile map removes copied references. */
const LifeMobileView = (() => {
  'use strict';
  function create(src, state) {
    const pick=(s,r=src)=>r.querySelector(s);
    const all=(s,r=src)=>[...r.querySelectorAll(s)];
    const value=(s,r=src)=>pick(s,r)?.textContent.trim()||'';
    const html=(s,r)=>pick(s,r)?.innerHTML||'';
    const life={
     facilities:all('.bx9-g .bx9-s').map(p=>({
      id:p.id,floorKey:p.closest('.bx9-g').dataset.g,spaceKey:p.id.split('-').pop(),
      name:value('.bx9-info h4',p),caption:value('.bx9-cap span',p),galleryLabel:value('.bx9-info h4',p),
      photos:all('.bx9-sl',p).map(n=>({alt:n.getAttribute('aria-label')||'',infoTitle:n.dataset.infoTitle||'',infoNote:n.dataset.infoNote||''})),
      notes:all('.bx9-info li',p).map(n=>n.innerHTML),
      view:{panel:{photos:all('.bx9-sl',p).map(n=>({className:n.className,style:n.getAttribute('style')||''}))}}
     })),
     housing:all('.hzr').map(p=>({name:value('.hzr-tx b',p),summary:value('.hzr-tx small',p),rooms:value('.hzr-cnt',p),travel:value('.hzr-tm',p),bus:p.classList.contains('hzr-bus')
     })),
     food:all('.fdg .fdc').map(p=>({type:p.dataset.t,group:p.dataset.g,walkMinutes:+p.dataset.w,
      photoLabel:pick('.fdc-ph',p).getAttribute('aria-label'),image:pick('img',p).getAttribute('src'),
      category:value('.fdc-cat',p),name:value('h3',p),menu:value('.fdc-menu',p)||value('.fdc-m',p),location:value('.fdc-location',p),groupLabel:value('.fdc-g',p),walkLabel:value('.fdc-wk',p)
     })),
     leisure:all('.fsg .fsc').map(p=>({group:p.closest('.fsg').dataset.k,name:value('.fsc-b>b',p),distance:value('.fsc-b>small',p),fee:value('.fsc-t',p),summary:value('.fsc-d',p),photoLabel:pick('.fsc-ph',p).getAttribute('aria-label'),view:{card:{photoClass:pick('.fsc-ph',p).className}}}))
    };
    const map=pick('.hzmap2').cloneNode(true);
    // The desktop map owns its IDs and ARIA references. Mobile pins are independent buttons.
    all('[id]',map).forEach(n=>n.removeAttribute('id'));
    all('[aria-controls],[aria-labelledby]',map).forEach(n=>{n.removeAttribute('aria-controls');n.removeAttribute('aria-labelledby');});
    all('.hzmap-d',map).forEach(n=>{
      n.setAttribute('tabindex','0');n.setAttribute('role','button');
      const circle=pick('.n',n), number=pick('.nn',n);
      if(circle&&number){
        number.setAttribute('x',circle.getAttribute('cx')||'0');
        number.setAttribute('y',circle.getAttribute('cy')||'0');
      }
    });
    if(map.classList.contains('housing-map-refined')){
      all('.hzmap-d',map).forEach(pin=>{
        pick('.n',pin).setAttribute('cy','-10');
        pick('.nn',pin).setAttribute('y','-10');
        pick('.dn',pin).setAttribute('y','8');
      });
      // Crop only the empty margins; keep all map and pin coordinates unchanged.
      map.setAttribute('viewBox','0 100 320 320');
      const basemap=pick('.housing-basemap',map);
      basemap.setAttribute('href','assets/housing-map-mobile.svg?v=1028simple');
      basemap.setAttribute('width','320');basemap.setAttribute('height','580');
      all('[data-mobile-transform]',map).forEach(n=>n.setAttribute('transform',n.dataset.mobileTransform));
    }
    const mapMarkup=map.outerHTML;
    const mapCredit=pick('.housing-map-credit')?.outerHTML||'';
    const $=(s,r=src)=>r.querySelector(s), $$=(s,r=src)=>[...r.querySelectorAll(s)];
    const text=s=>$(s,src)?.textContent.trim()||'';
    const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
    const image=(path,alt='',cls='')=>`<img class="${cls}" src="${esc(path)}" alt="${esc(alt)}" loading="lazy">`;
    const heading=(k,t,lead='')=>`<div class="section-heading"><p class="kicker">${esc(k)}</p><h2>${esc(t)}</h2>${lead?`<p class="lead">${esc(lead)}</p>`:''}</div>`;
    function topicHeading(k,t,p){return `<div class="section-heading"><div class="topic-heading-row"><p class="kicker">${esc(k)}</p><details class="topic-picker"><summary>다른 꿀팁 보기<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><nav aria-label="생활 꿀팁 주제">${[['tp-house','주거'],['tp-food','먹거리'],['tp-fun','문화 · 여가']].map(([id,label])=>`<a href="#${id}" ${id===p?'aria-current="page"':''}>${label}</a>`).join('')}</nav></details></div><h2>${esc(t)}</h2></div>`;}

    function rail(items,label,cls=''){return `<div class="rail-wrap ${cls}"><div class="rail" aria-label="${esc(label)}">${items.join('')}</div><button class="rail-arrow previous" aria-label="이전 ${esc(label)}" hidden>${arrow}</button><button class="rail-arrow next" aria-label="다음 ${esc(label)}">${arrow}</button></div>`;}
    function topicRows(){return $$('.lo-tr',src).map((a,i)=>`<a class="topic-row" href="${esc(a.getAttribute('href'))}"><span class="index">${String(i+1).padStart(2,'0')}</span><span class="topic-tx"><small>${esc($('.tx em',a).textContent)}</small><b>${esc($('.tx b',a).textContent)}</b><span>${esc($('.tx small',a).textContent)}</span></span>${image($('.ph img',a).getAttribute('src'))}<span class="row-arrow" aria-hidden="true">↗</span></a>`).join('');}
    function overview(){
     const photos=['entrance.webp','classroom.webp','fac_8f_cafeteria_01.webp'];
     const floors=['1F','2·3F','8F'];
     const cards=$$('.lo-pj',src).map((a,i)=>`<a href="#facilities" data-fac="${a.dataset.fac}" class="facility-card">${image('assets/'+photos[i],$('.lo-tx b',a).textContent)}<span class="floor-badge">${floors[i]}</span><div><small>${esc($('.lo-tx em',a).textContent)}</small><b>${esc($('.lo-tx b',a).textContent)}</b><p>${esc($('.lo-tx small',a).textContent)}</p></div></a>`);
     return `<div class="quick-facts"><a href="#facilities" data-fac="23-0"><b>1~3F</b><span>교육장</span></a><a href="#facilities" data-fac="8-0"><b>8F</b><span>구내식당</span></a><a href="#directions"><b>5분</b><span>문화전당역 도보</span></a></div><section class="section"><div class="section-head-row">${heading('시설 둘러보기',text('#lo-fac-t'))}<a class="small-link" href="#facilities">전체 보기 →</a></div>${rail(cards,'시설 사진')}</section><section class="section">${heading('생활 꿀팁',text('#lo-tip-t'))}<div class="topic-list">${topicRows()}</div></section><section class="section">${heading('오시는 길',text('#lo-way-t'))}<a href="#directions" class="way-preview">${image('assets/way-map.webp','문화전당역에서 교육장까지 걸어서 약 5분 지도')}<div><span class="kicker">주소</span><b>${esc(text('.lo-wtx>b'))}</b><span>출발지별 길 찾기 ${arrow}</span></div></a></section>`;
    }
    const floorTitles={'8':text('.bx9-g[data-g="8"] h3'),'23':text('.bx9-g[data-g="23"] h3'),'1':text('.bx9-g[data-g="1"] h3')};
    const floorDesc={'8':text('.lo-pj[data-fac="8-0"] .lo-tx b'),'23':text('.lo-pj[data-fac="23-0"] .lo-tx b'),'1':text('.lo-pj[data-fac="1-0"] .lo-tx b')};
    
    function photoStyle(photo){let name=/im-([\w_]+)/.exec(photo.className)?.[1];let s=photo.style||'';let size=/--bs:([^;]+)/.exec(s)?.[1]||'cover';let pos=/--bp:([^;]+)/.exec(s)?.[1]||'center';return `background-image:url('assets/${name}.webp');background-size:${size};background-position:${pos}`;}
    function facilityNote(note){
      const paths=/예약/.test(note)?'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-11 5 2 2 4-4"/>':/식권/.test(note)?'<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z"/><path d="M15 5v2m0 4v2m0 4v2"/>':/평일|시간/.test(note)?'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>':'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>';
      return `<li><span class="space-note-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${paths}</svg></span><span class="space-note-text">${note}</span></li>`;
    }
    function space(f){return `<div class="space-view" data-space="${f.spaceKey}" ${state.chosenSpace[f.floorKey]!==f.spaceKey?'hidden':''}><div class="photo-gallery" aria-label="${esc(f.galleryLabel)}"><div class="photo-track">${f.view.panel.photos.map((p,i)=>`<div class="photo" role="img" aria-label="${esc(f.photos[i].alt)}" data-info-title="${esc(f.photos[i].infoTitle)}" data-info-note="${esc(f.photos[i].infoNote)}" style="${photoStyle(p)}"></div>`).join('')}</div><button class="photo-prev" aria-label="이전 사진">${arrow}</button><button class="photo-next" aria-label="다음 사진">${arrow}</button><span class="photo-caption"><span hidden>${esc(f.caption)}</span><b>1/${f.photos.length}</b></span></div><h3 class="space-name">${esc(f.name)}</h3><ul class="notes">${f.notes.map(facilityNote).join('')}</ul></div>`;}
    function facilities(){return `<section class="section first">${heading('시설 둘러보기',text('.fac-sh h2'))}<div class="floors">${['8','off','23','1'].map(g=>{if(g==='off')return `<div class="floor-off"><b>4~7F</b><span>${esc(text('.bx9-f.off span'))}</span></div>`;let list=life.facilities.filter(f=>f.floorKey===g);return `<details class="floor-card" data-floor="${g}" ${state.chosenFloor===g?'open':''}><summary><span class="floor-number">${g==='23'?'2·3F':g+'F'}</span><span><small>${esc(floorTitles[g])}</small><strong>${esc(floorDesc[g])}</strong></span><i aria-hidden="true"></i></summary><div class="floor-body">${list.length>1?`<div class="space-tabs" role="group" aria-label="${g==='23'?'2·3':g}층 공간">${list.map(f=>`<button data-space-select="${f.spaceKey}" aria-pressed="${state.chosenSpace[g]===f.spaceKey}">${esc(f.name)}</button>`).join('')}</div>`:''}${list.map(space).join('')}</div></details>`;}).join('')}</div></section>`;}
    function tips(){return `<section class="section first">${heading('생활 꿀팁',text('#tp-hub-t'),text('.tp-hub .sh-lead'))}<div class="tips-cards">${$$('.tp-flc',src).map((a,i)=>`<a class="tip-card tip-${i}" href="${a.getAttribute('href')}"><span class="tip-stage"><i>${esc($('.w i',a).textContent)}</i>${esc($('.w',a).textContent.replace(/^\d{2}\s*/,''))}</span><div class="tip-panel"><span class="tip-art">${image($('.ph img',a).getAttribute('src'))}</span><div class="tip-copy"><small>${esc($('.cd em',a).textContent)}</small><h3>${esc($('.cd>b',a).textContent)}</h3><p>${esc($('.cd>small',a).textContent)}</p><span class="tip-go">자세히 보기 ${arrow}</span></div></div></a>`).join('')}</div></section>`;}
    
    function housingList(){return `<ul class="housing-list" aria-label="교육장에서 가까운 순 동네">${life.housing.map((h,i)=>`<li${h.bus?' class="bus"':''}><button type="button" data-area="${i}" aria-pressed="${i===state.housingIndex}"><span class="housing-no" aria-hidden="true">${i+1}</span><span class="housing-name"><b>${esc(h.name)}</b><small>${esc(h.summary)}</small></span><span class="housing-meta"><em>${esc(h.travel)}</em><small>${esc(h.rooms)}</small></span></button></li>`).join('')}</ul>`;}
    function housing(){return `<section class="section first housing-section">${topicHeading('주거',text('#tp-house .sh h2'),'tp-house')}<div class="housing-map life-page">${mapMarkup}${mapCredit}</div><p class="caption house-ref">${esc(text('.hzl-ord'))}</p>${housingList()}<div class="source-caption">${$$('.hzmw-lg span',src).map(n=>`<span>${esc(n.textContent)}</span>`).join('')}</div><p class="caption source-note">${esc(text('.hzmw-ds'))}</p><details class="support-card" open><summary>주거 지원금 받을 때 확인할 점<span>⌃</span></summary><div>${$('.hhl',src).innerHTML}</div></details></section>`;}
    
    function food(){return `<section class="section first">${topicHeading('근처 먹거리',text('#tp-food .sh h2'),'tp-food')}<div class="food-controls"><div class="food-kind underline-tabs" role="group" aria-label="먹거리 종류">${[['food','식당'],['cafe','카페']].map(([k,t])=>`<button data-kind="${k}" aria-pressed="${k===state.foodType}">${t}<span>${life.food.filter(f=>f.type===k).length}</span></button>`).join('')}</div><div class="food-filters" role="group" aria-label="먹거리 거르기">${[['all','전체'],['solo',state.foodType==='cafe'?'혼자':'혼밥'],['group','여럿이']].map(([g,t])=>`<button data-food-group="${g}" aria-pressed="${g===state.foodGroup}">${t}</button>`).join('')}</div></div><p id="food-count" class="list-count" role="status"></p><div id="food-results"></div><nav class="pagination" aria-label="먹거리 페이지"></nav><p class="caption">${esc(text('.fdisc'))}</p></section>`;}
    
    function culturePage(){let groups=$$('.fsg',src);return `<section class="section first">${topicHeading('문화 · 여가',text('#tp-fun .sh h2'),'tp-fun')}<div class="culture-tabs underline-tabs" role="group" aria-label="문화·여가 분류">${groups.map((g,i)=>`<button data-culture="${g.dataset.k}" aria-pressed="${g.dataset.k===state.culture}">${['산책길','가까운 곳','멀지만 가볼 곳'][i]}</button>`).join('')}</div><div class="culture-groups">${groups.map(g=>`<section class="culture-group" data-culture-group="${g.dataset.k}" ${g.dataset.k!==state.culture?'hidden':''}><h3>${esc($('.fsh h3',g).textContent)}</h3><p class="caption">${esc($('.fsh p',g).textContent)}</p><div class="leisure-list">${life.leisure.filter(x=>x.group===g.dataset.k).map(f=>{let asset=/im-([\w_]+)/.exec(f.view.card.photoClass)[1];return `<details class="leisure-card"><summary>${image('assets/'+asset+'.webp',f.photoLabel)}<span><strong>${esc(f.name)}</strong><small>${esc(f.distance)}</small><em>${esc(f.fee)}</em></span><i aria-hidden="true"></i></summary><p>${esc(f.summary)}</p></details>`;}).join('')}</div></section>`).join('')}</div><p class="caption">${esc(text('#tp-fun .note'))}</p></section>`;}
    
    function routeCard(){let article=$$('.rt3 article',src)[state.departure];return `<div class="route-steps"><h4>${esc($('h3',article).textContent)}</h4>${$('ol',article).outerHTML}${$('.rtr',article).outerHTML}</div>`;}
    function directions(){let routes=$$('.rt3 article',src);return `<section class="section first">${heading('오시는 길',text('#way-loc .sh h2'))}<div class="address-card">${image('assets/way-map.webp',$('.wymap-img',src).alt)}<div class="address-copy"><small>주소</small><b>${esc(text('.ad>div>b'))}</b><p>문화전당역에서 걸어서 약 5분</p><div><button class="copy-address">주소 복사</button><a href="${esc($('.ad-b a',src).getAttribute('href'))}" target="_blank" rel="noopener">지도에서 보기 ↗</a></div></div></div><details class="building-card"><summary>${image('assets/building.webp','교육장 건물 외관')}<span><b>${esc(text('.wbld figcaption>b'))}</b></span><i aria-hidden="true"></i></summary><div>${image('assets/entrance.webp','입구 안쪽 GWANGJU AI SCHOOL 사인')}<p>${esc(text('.wbld figcaption>span'))}</p><a href="#facilities" data-fac="1-0">정문 사진 더 보기 →</a></div></details></section><section class="section route-section">${heading('주요 이동 경로',text('#way-route .sh h2'))}<div class="departure-tabs" role="group" aria-label="출발지 선택">${routes.map((a,i)=>`<button data-departure="${i}" aria-pressed="${state.departure===i}"><b>${esc($('h3',a).textContent)}</b><span>${esc($('small',a).textContent)}</span></button>`).join('')}</div><div id="route-content">${routeCard()}</div><p class="caption">${esc(text('#way-route .note'))}</p><div class="parking"><span>P</span><div><p class="kicker">${esc(text('.park2 .sh-k'))}</p><p>${esc(text('.park2-d'))}</p><a href="#tp-house">도보권 주거 보기 →</a></div></div></section>`;}
    const renders={overview,facilities,tips,'tp-house':housing,'tp-food':food,'tp-fun':culturePage,directions};
    
    function foodResults(matches){return matches.length?`<div class="food-list">${matches.slice((state.foodPage-1)*8,state.foodPage*8).map(f=>`<article class="food-card"><div class="food-card-top">${image(f.image,f.photoLabel)}<div><span class="food-meta">${esc(f.category)} <b>${esc(f.walkLabel)}</b></span><div class="food-card-info"><h3>${esc(f.name)}</h3><p class="food-menu">${esc(f.menu)}</p></div><div class="food-card-bottom"><small>${esc(f.groupLabel)}</small>${f.location?`<p class="food-location"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${esc(f.location)}</span></p>`:''}</div></div></div></article>`).join('')}</div>`:`<div class="empty">${esc(text('.fdempty-t'))}<button data-reset-food>거르기 풀기</button></div>`;}
    function foodPagination(pages){return pages>1?`<button data-food-page="${state.foodPage-1}" aria-label="이전 페이지" ${state.foodPage===1?'disabled':''}>←</button>${Array.from({length:pages},(_,i)=>`<button data-food-page="${i+1}" aria-label="${i+1}페이지" ${state.foodPage===i+1?'aria-current="page"':''}>${i+1}</button>`).join('')}<button data-food-page="${state.foodPage+1}" aria-label="다음 페이지" ${state.foodPage===pages?'disabled':''}>→</button>`:'';}
    
    return { data: life, screens: renders, text, routeCard, foodResults, foodPagination };
  }
  return { create };
})();
