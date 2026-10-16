/* Mobile LIFE presentation. Content is read from the rendered source so desktop and mobile share one editorial source. */
(() => {
'use strict';
const src=document.querySelector('#main').cloneNode(true);
const pick=(s,r=src)=>r.querySelector(s);
const all=(s,r=src)=>[...r.querySelectorAll(s)];
const value=(s,r=src)=>pick(s,r)?.textContent.trim()||'';
const html=(s,r)=>pick(s,r)?.innerHTML||'';
const life={
 facilities:all('.bx9-g .bx9-s').map(p=>({
  id:p.id,floorKey:p.closest('.bx9-g').dataset.g,spaceKey:p.id.split('-').pop(),
  name:value('.bx9-info h4',p),caption:value('.bx9-cap span',p),galleryLabel:value('.bx9-info h4',p),
  photos:all('.bx9-sl',p).map(n=>({alt:n.getAttribute('aria-label')||''})),
  notes:all('.bx9-info li',p).map(n=>n.innerHTML),
  view:{panel:{photos:all('.bx9-sl',p).map(n=>({className:n.className,style:n.getAttribute('style')||''}))}}
 })),
 housing:all('.hzp').map(p=>({panelId:p.id,name:value('.hzc-h>b',p),summary:value('.hzc-s',p),
  rentHtml:html('.hzc-rent dd',p),densityHtml:html('.hzc-cnt dd',p),gosiwonHtml:html('.hzc-gs dd',p),
  typeHtml:all('dl>div',p).find(n=>value('dt',n)==='주로 보이는 형태')?.querySelector('dd').innerHTML||''
 })),
 food:all('.fdg .fdc').map(p=>({type:p.dataset.t,group:p.dataset.g,walkMinutes:+p.dataset.w,
  photoLabel:pick('.fdc-ph',p).getAttribute('aria-label'),image:pick('img',p).getAttribute('src'),
  category:value('.fdc-cat',p),name:value('h3',p),menu:value('.fdc-m',p),review:value('blockquote',p),groupLabel:value('.fdc-g',p),walkLabel:value('.fdc-wk',p)
 })),
 leisure:all('.fsg .fsc').map(p=>({group:p.closest('.fsg').dataset.k,name:value('.fsc-b>b',p),distance:value('.fsc-b>small',p),fee:value('.fsc-t',p),summary:value('.fsc-d',p),photoLabel:pick('.fsc-ph',p).getAttribute('aria-label'),view:{card:{photoClass:pick('.fsc-ph',p).className}}}))
};
const map=pick('.hzmap2').cloneNode(true);
// The desktop map owns its IDs and ARIA references. Mobile pins are independent buttons.
all('[id]',map).forEach(n=>n.removeAttribute('id'));
all('[aria-controls],[aria-labelledby]',map).forEach(n=>{n.removeAttribute('aria-controls');n.removeAttribute('aria-labelledby');});
all('.hzmap-d',map).forEach(n=>{n.setAttribute('tabindex','0');n.setAttribute('role','button');});
const mapMarkup=map.outerHTML;
const $=(s,r=main)=>r.querySelector(s), $$=(s,r=main)=>[...r.querySelectorAll(s)];
const text=s=>$(s,src)?.textContent.trim()||'';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
const image=(path,alt='',cls='')=>`<img class="${cls}" src="${esc(path)}" alt="${esc(alt)}" loading="lazy">`;
const heading=(k,t,lead='')=>`<div class="section-heading"><p class="kicker">${esc(k)}</p><h2>${esc(t)}</h2>${lead?`<p class="lead">${esc(lead)}</p>`:''}</div>`;
const host=document.querySelector('#main');
const main=document.createElement('div');main.className='lm-content';host.append(main);
let page='overview';const railObservers=[];
const mqReduce=matchMedia('(prefers-reduced-motion:reduce)');
function activeGroup(p){return p.startsWith('tp-')?'tips':p;}
function topicNav(p){return `<div class="topic-nav"><a class="back-link" href="#tips">← 생활 꿀팁 전체</a><nav class="underline-tabs" aria-label="생활 꿀팁 주제">${[['tp-house','주거'],['tp-food','먹거리'],['tp-fun','문화 · 여가']].map(([id,label])=>`<a href="#${id}" ${id===p?'aria-current="page"':''}>${label}</a>`).join('')}</nav></div>`;}
function rail(items,label,cls=''){return `<div class="rail-wrap ${cls}"><div class="rail" aria-label="${esc(label)}">${items.join('')}</div><button class="rail-arrow previous" aria-label="이전 ${esc(label)}" hidden>${arrow}</button><button class="rail-arrow next" aria-label="다음 ${esc(label)}">${arrow}</button></div>`;}
function topicRows(){return $$('.lo-tr',src).map((a,i)=>`<a class="topic-row" href="${esc(a.getAttribute('href'))}"><span class="index">${String(i+1).padStart(2,'0')}</span><span class="topic-tx"><small>${esc($('.tx em',a).textContent)}</small><b>${esc($('.tx b',a).textContent)}</b><span>${esc($('.tx small',a).textContent)}</span></span>${image($('.ph img',a).getAttribute('src'))}<span class="row-arrow" aria-hidden="true">↗</span></a>`).join('');}
function overview(){
 const photos=['entrance.webp','classroom.webp','cafe8_tmp.webp'];
 const floors=['1F','2·3F','8F'];
 const cards=$$('.lo-pj',src).map((a,i)=>`<a href="#facilities" data-fac="${a.dataset.fac}" class="facility-card">${image('assets/'+photos[i],$('.lo-tx b',a).textContent)}<span class="floor-badge">${floors[i]}</span><div><small>${esc($('.lo-tx em',a).textContent)}</small><b>${esc($('.lo-tx b',a).textContent)}</b><p>${esc($('.lo-tx small',a).textContent)}</p></div></a>`);
 return `<div class="quick-facts"><a href="#facilities"><b>1~3F</b><span>교육장</span></a><a href="#facilities" data-fac="8-0"><b>8F</b><span>구내식당</span></a><a href="#directions"><b>5분</b><span>문화전당역 도보</span></a></div><section class="section"><div class="section-head-row">${heading('시설 둘러보기',text('#lo-fac-t'))}<a class="small-link" href="#facilities">전체 보기 →</a></div>${rail(cards,'시설 사진')}</section><section class="section">${heading('생활 꿀팁',text('#lo-tip-t'))}<div class="topic-list">${topicRows()}</div></section><section class="section">${heading('오시는 길',text('#lo-way-t'))}<a href="#directions" class="way-preview">${image('assets/way-map.webp','문화전당역에서 교육장까지 걸어서 약 5분 지도')}<div><span class="kicker">주소</span><b>${esc(text('.lo-wtx>b'))}</b><span>출발지별 길 찾기 ${arrow}</span></div></a></section>`;
}
const floorTitles={'8':text('.bx9-g[data-g="8"] h3'),'23':text('.bx9-g[data-g="23"] h3'),'1':text('.bx9-g[data-g="1"] h3')};
const floorDesc={'8':text('.lo-pj[data-fac="8-0"] .lo-tx b'),'23':text('.lo-pj[data-fac="23-0"] .lo-tx b'),'1':text('.lo-pj[data-fac="1-0"] .lo-tx b')};
let chosenFloor='23', chosenSpace={'1':'0','23':'0','8':'0'};
function photoStyle(photo){let name=/im-([\w_]+)/.exec(photo.className)?.[1];let s=photo.style||'';let size=/--bs:([^;]+)/.exec(s)?.[1]||'cover';let pos=/--bp:([^;]+)/.exec(s)?.[1]||'center';return `background-image:url('assets/${name}.webp');background-size:${size};background-position:${pos}`;}
function space(f){return `<div class="space-view" data-space="${f.spaceKey}" ${chosenSpace[f.floorKey]!==f.spaceKey?'hidden':''}><div class="photo-gallery" aria-label="${esc(f.galleryLabel)}"><div class="photo-track">${f.view.panel.photos.map((p,i)=>`<div class="photo" role="img" aria-label="${esc(f.photos[i].alt)}" style="${photoStyle(p)}"></div>`).join('')}</div><button class="photo-prev" aria-label="이전 사진">${arrow}</button><button class="photo-next" aria-label="다음 사진">${arrow}</button><span class="photo-caption">${esc(f.caption)} <b>1 / ${f.photos.length}</b></span></div><h3 class="space-name">${esc(f.name)}</h3><ul class="notes">${f.notes.map(n=>`<li>${n}</li>`).join('')}</ul></div>`;}
function facilities(){return `<section class="section first">${heading('시설 둘러보기',text('.fac-sh h2'))}<div class="floors">${['8','off','23','1'].map(g=>{if(g==='off')return `<div class="floor-off"><b>4~7F</b><span>${esc(text('.bx9-f.off span'))}</span></div>`;let list=life.facilities.filter(f=>f.floorKey===g);return `<details class="floor-card" data-floor="${g}" ${chosenFloor===g?'open':''}><summary><span class="floor-number">${g==='23'?'2·3F':g+'F'}</span><span><small>${esc(floorTitles[g])}</small><strong>${esc(floorDesc[g])}</strong><em>${esc(list.map(f=>f.name).join(' · '))}</em></span><i aria-hidden="true"></i></summary><div class="floor-body">${list.length>1?`<div class="space-tabs" role="group" aria-label="${g==='23'?'2·3':g}층 공간">${list.map(f=>`<button data-space-select="${f.spaceKey}" aria-pressed="${chosenSpace[g]===f.spaceKey}">${esc(f.name)}</button>`).join('')}</div>`:''}${list.map(space).join('')}</div></details>`;}).join('')}</div><div class="cross-links">${$$('.fsx a',src).map(a=>`<a href="${a.getAttribute('href')}" data-source-link="true"><span><b>${esc($('b',a).textContent)}</b><small>${esc($('span',a).textContent)}</small></span>${arrow}</a>`).join('')}</div></section>`;}
function tips(){return `<section class="section first">${heading('생활 꿀팁',text('#tp-hub-t'),text('.tp-hub .sh-lead'))}<div class="tips-cards">${$$('.tp-flc',src).map((a,i)=>`<a class="tip-card tip-${i}" href="${a.getAttribute('href')}"><span class="tip-stage"><i>${esc($('.w i',a).textContent)}</i>${esc($('.w',a).textContent.replace(/^\d{2}\s*/,''))}</span><div class="tip-panel"><span class="tip-art">${image($('.ph img',a).getAttribute('src'))}</span><div class="tip-copy"><small>${esc($('.cd em',a).textContent)}</small><h3>${esc($('.cd>b',a).textContent)}</h3><p>${esc($('.cd>small',a).textContent)}</p><span class="tip-go">자세히 보기 ${arrow}</span></div></div></a>`).join('')}</div></section>`;}
let budget=35,housingIndex=0;
function housingCards(){return life.housing.map((h,i)=>{let dom=$('#'+h.panelId,src);return `<article class="housing-card" aria-label="${esc(h.name)} 주거 정보"><div class="housing-title"><span>${i+1}</span><h3>${esc(h.name)}</h3></div><p class="housing-description">${esc(h.summary)}</p><div class="rent"><span>${esc($('.hzc-rent dt',dom).textContent)}</span>${h.rentHtml}</div><dl class="housing-details"><div><dt>원룸 건물 수</dt><dd>${h.densityHtml}</dd></div><div><dt>주로 보이는 형태</dt><dd>${h.typeHtml}</dd></div><div><dt>고시원</dt><dd>${h.gosiwonHtml}</dd></div></dl></article>`;});}
function housing(){return `<section class="section first housing-section">${heading('주거',text('#tp-house .sh h2'))}<p class="caption house-ref">${esc(text('.hz-ref'))} · ${esc(text('.hst em'))}</p><div class="budget-box"><div><span id="budget-label">월세 예산</span><output id="budget-value">${budget}만 원</output></div><div class="budget-options" role="group" aria-label="월세 예산">${[25,30,35,40,45].map(v=>`<button aria-pressed="${v===budget}" data-budget="${v}">${v}만</button>`).join('')}</div><p class="caption" id="budget-result"></p></div><div class="housing-map life-page">${mapMarkup}<span class="map-note">위치와 거리는 대략이에요</span></div><div class="housing-selector underline-tabs" role="group" aria-label="동 고르기">${life.housing.map((h,i)=>`<button data-area="${i}" aria-pressed="${i===housingIndex}">${i+1} ${esc(h.name)}</button>`).join('')}</div>${rail(housingCards(),'동별 주거 정보','housing-rail')}<p class="caption source-note">${esc(text('.hzmw-ds'))}</p><div class="source-caption">${$$('.hzmw-lg span',src).map(n=>`<span>${esc(n.textContent)}</span>`).join('')}</div><details class="support-card" open><summary>주거 지원금 받을 때 확인할 점<span>⌃</span></summary><div>${$('.hhl',src).innerHTML}</div></details></section>`;}
let foodType='food',foodGroup='all',foodNear=false,foodPage=1;
function food(){return `<section class="section first">${heading('근처 먹거리',text('#tp-food .sh h2'))}<div class="food-kind underline-tabs" role="group" aria-label="먹거리 종류">${[['food','식당'],['cafe','카페']].map(([k,t])=>`<button data-kind="${k}" aria-pressed="${k===foodType}">${t}<span>${life.food.filter(f=>f.type===k).length}</span></button>`).join('')}</div><div class="food-filters" role="group" aria-label="먹거리 거르기">${[['all','전체'],['solo',foodType==='cafe'?'혼자':'혼밥'],['group','여럿이']].map(([g,t])=>`<button data-food-group="${g}" aria-pressed="${g===foodGroup}">${t}</button>`).join('')}<button id="near" aria-pressed="${foodNear}">도보 10분 안</button></div><p id="food-count" class="list-count" role="status"></p><div id="food-results"></div><nav class="pagination" aria-label="먹거리 페이지"></nav><p class="caption">${esc(text('.fdisc'))}</p></section>`;}
let culture='walk';
function culturePage(){let groups=$$('.fsg',src);return `<section class="section first">${heading('문화 · 여가',text('#tp-fun .sh h2'))}<div class="culture-tabs underline-tabs" role="group" aria-label="문화·여가 분류">${groups.map((g,i)=>`<button data-culture="${g.dataset.k}" aria-pressed="${g.dataset.k===culture}">${['산책길','가까운 곳','멀지만 가볼 곳'][i]}</button>`).join('')}</div><div class="culture-groups">${groups.map(g=>`<section class="culture-group" data-culture-group="${g.dataset.k}" ${g.dataset.k!==culture?'hidden':''}><h3>${esc($('.fsh h3',g).textContent)}</h3><p class="caption">${esc($('.fsh p',g).textContent)}</p><div class="leisure-list">${life.leisure.filter(x=>x.group===g.dataset.k).map((f,i)=>{let asset=/im-([\w_]+)/.exec(f.view.card.photoClass)[1];return `<details class="leisure-card" ${i===0?'open':''}><summary>${image('assets/'+asset+'.webp',f.photoLabel)}<span><strong>${esc(f.name)}</strong><small>${esc(f.distance)}</small><em>${esc(f.fee)}</em></span><i aria-hidden="true"></i></summary><p>${esc(f.summary)}</p></details>`;}).join('')}</div></section>`).join('')}</div><p class="caption">${esc(text('#tp-fun .note'))}</p></section>`;}
let departure=0;
function routeCard(){let article=$$('.rt3 article',src)[departure];return `<div class="route-steps"><h4>${esc($('h3',article).textContent)}</h4>${$('ol',article).outerHTML}${$('.rtr',article).outerHTML}</div>`;}
function directions(){let routes=$$('.rt3 article',src);return `<section class="section first">${heading('오시는 길',text('#way-loc .sh h2'))}<div class="address-card">${image('assets/way-map.webp',$('.wymap-img',src).alt)}<div class="address-copy"><small>주소</small><b>${esc(text('.ad>div>b'))}</b><p>문화전당역에서 걸어서 약 5분</p><div><button class="copy-address">주소 복사</button><a href="${esc($('.ad-b a',src).getAttribute('href'))}" target="_blank" rel="noopener">지도에서 보기 ↗</a></div></div></div><details class="building-card"><summary>${image('assets/building.webp','교육장 건물 외관')}<span><b>${esc(text('.wbld figcaption>b'))}</b><small>정문 사진 더 보기</small></span><i aria-hidden="true"></i></summary><div>${image('assets/entrance.webp','입구 안쪽 GWANGJU AI SCHOOL 사인')}<p>${esc(text('.wbld figcaption>span'))}</p><a href="#facilities" data-fac="1-0">정문 사진 더 보기 →</a></div></details></section><section class="section route-section">${heading('주요 이동 경로',text('#way-route .sh h2'))}<div class="departure-tabs" role="group" aria-label="출발지 선택">${routes.map((a,i)=>`<button data-departure="${i}" aria-pressed="${departure===i}"><b>${esc($('h3',a).textContent)}</b><span>${esc($('small',a).textContent)}</span></button>`).join('')}</div><div id="route-content">${routeCard()}</div><p class="caption">${esc(text('#way-route .note'))}</p><div class="parking"><span>P</span><div><p class="kicker">${esc(text('.park2 .sh-k'))}</p><p>${esc(text('.park2-d'))}</p><a href="#tp-house">도보권 주거 보기 →</a></div></div></section>`;}
const renders={overview,facilities,tips,'tp-house':housing,'tp-food':food,'tp-fun':culturePage,directions};
function render(){
 railObservers.forEach(o=>o.disconnect());railObservers.length=0;
 const raw=Site.decodeHash(location.hash.slice(1));
 const target=src.querySelector('[id="'+CSS.escape(raw)+'"]');
 const topic=target?.closest('.tp-sec')?.id;
 const aliases={home:'overview',facility:'facilities',way:'directions'};
 const pane=target?.closest('.page')?.dataset.page;
 const paneRoutes={home:'overview',facility:'facilities',tips:'tips',way:'directions'};
 const next=topic||aliases[raw]||(renders[raw]?raw:paneRoutes[pane]);
 // Common anchors (contact, privacy, skip link) must not reset the current LIFE screen.
 if(!next&&raw&&main.childElementCount)return;
 page=next||paneRoutes[host.querySelector(':scope>.page:not([hidden])')?.dataset.page]||'overview';
 const facility=target?.closest('.bx9-s');
 if(facility){chosenFloor=facility.closest('.bx9-g').dataset.g;chosenSpace[chosenFloor]=facility.id.split('-').pop();}
 const area=target?.closest('.hzp');if(area)housingIndex=+area.dataset.i;

 main.innerHTML=(page.startsWith('tp-')?topicNav(page):'')+renders[page]();main.dataset.screen=page;
 wireRails();wireFacilities();if(page==='tp-house')wireHousing();if(page==='tp-food')renderFood();
 syncNav();
 // Keep the original body available until the mobile screen has rendered and bound successfully.
 host.classList.add('lm-ready');
}
function wireRails(){
 $$('.rail-wrap').forEach(w=>{let r=$('.rail',w),prev=$('.previous',w),next=$('.next',w);let sync=()=>{prev.hidden=r.scrollLeft<4;next.hidden=r.scrollLeft+r.clientWidth>=r.scrollWidth-4;};prev.onclick=()=>r.scrollBy({left:-r.clientWidth*.86,behavior:mqReduce.matches?'auto':'smooth'});next.onclick=()=>r.scrollBy({left:r.clientWidth*.86,behavior:mqReduce.matches?'auto':'smooth'});r.addEventListener('scroll',sync,{passive:true});let observer=new ResizeObserver(sync);observer.observe(r);railObservers.push(observer);sync();});
}
function wireFacilities(){
 $$('.floor-card').forEach(card=>{card.addEventListener('toggle',()=>{if(card.open){chosenFloor=card.dataset.floor;$$('.floor-card').forEach(c=>{if(c!==card)c.open=false;});}});});
 $$('.photo-gallery').forEach(g=>{let track=$('.photo-track',g);let move=d=>track.scrollBy({left:d*track.clientWidth,behavior:mqReduce.matches?'auto':'smooth'});$('.photo-prev',g).onclick=()=>move(-1);$('.photo-next',g).onclick=()=>move(1);let sync=()=>{let n=Math.round(track.scrollLeft/track.clientWidth)||0;$('.photo-caption',g).firstChild.textContent=track.children[n].getAttribute('aria-label')+' ';$('.photo-caption b',g).textContent=(n+1)+' / '+track.children.length;$('.photo-prev',g).disabled=n===0;$('.photo-next',g).disabled=n===track.children.length-1;};track.addEventListener('scroll',sync,{passive:true});sync();});
}
function wireHousing(){
 let track=$('.housing-rail .rail');track.scrollLeft=housingIndex*(track.clientWidth-10);
 function sync(index){housingIndex=index;$$('[data-area]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.area===index)));$$('.hzmap-d').forEach(p=>{p.classList.toggle('on',+p.dataset.i===index);p.setAttribute('aria-pressed',String(+p.dataset.i===index));});}
 function select(i){let c=$$('.housing-card')[i];track.scrollTo({left:c.offsetLeft-20,behavior:mqReduce.matches?'auto':'smooth'});sync(i);}
 $$('[data-area]').forEach(b=>b.onclick=()=>select(+b.dataset.area));
 $$('.hzmap-d').forEach(p=>{p.onclick=()=>select(+p.dataset.i);p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(+p.dataset.i);}};});
 track.addEventListener('scroll',()=>{let mid=track.getBoundingClientRect().left+track.clientWidth/2;let cards=$$('.housing-card');let best=0,d=Infinity;cards.forEach((c,i)=>{let r=c.getBoundingClientRect(),diff=Math.abs(r.left+r.width/2-mid);if(diff<d){d=diff;best=i;}});sync(best);},{passive:true});
 sync(housingIndex);updateBudget();
}
function updateBudget(){let total=life.housing.filter(h=>+( /\d+/.exec(new DOMParser().parseFromString(h.rentHtml,'text/html').body.textContent)?.[0]||Infinity)<=budget).length;$('#budget-value').textContent=budget+'만 원';$('#budget-result').textContent='표시된 월세의 하한 기준 '+total+'곳 · 집마다 차이가 있어요';$$('[data-budget]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.budget===budget)));}
function renderFood(){let matches=life.food.filter(f=>f.type===foodType&&(foodGroup==='all'||f.group===foodGroup)&&(!foodNear||f.walkMinutes<=10));let pages=Math.max(1,Math.ceil(matches.length/8));foodPage=Math.min(foodPage,pages);$('#food-count').textContent=matches.length+'곳';$('#food-results').innerHTML=matches.length?`<div class="food-list">${matches.slice((foodPage-1)*8,foodPage*8).map(f=>`<article class="food-card"><div class="food-card-top">${image(f.image,f.photoLabel)}<div><span class="food-meta">${esc(f.category)} <b>${esc(f.walkLabel)}</b></span><h3>${esc(f.name)}</h3><p>${esc(f.menu)}</p><small>${esc(f.groupLabel)}</small></div></div><details class="food-review"><summary><span>선배 후기 <em>예시</em></span><span>펼쳐보기 ⌄</span></summary><p>${esc(f.review)}</p></details></article>`).join('')}</div>`:`<div class="empty">${esc(text('.fdempty-t'))}<button data-reset-food>거르기 풀기</button></div>`;
 $('.pagination').innerHTML=pages>1?`<button data-food-page="${foodPage-1}" aria-label="이전 페이지" ${foodPage===1?'disabled':''}>←</button>${Array.from({length:pages},(_,i)=>`<button data-food-page="${i+1}" aria-label="${i+1}페이지" ${foodPage===i+1?'aria-current="page"':''}>${i+1}</button>`).join('')}<button data-food-page="${foodPage+1}" aria-label="다음 페이지" ${foodPage===pages?'disabled':''}>→</button>`:'';
 $$('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===foodType)));$$('[data-food-group]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.foodGroup===foodGroup));if(b.dataset.foodGroup==='solo')b.textContent=foodType==='cafe'?'혼자':'혼밥';});$('#near').setAttribute('aria-pressed',String(foodNear));
}
function toast(t){Site.toast(t);}
main.addEventListener('click',async e=>{let b=e.target.closest('button');let a=e.target.closest('[data-fac]');if(a){let [f,s]=a.dataset.fac.split('-');chosenFloor=f;chosenSpace[f]=s;if(page==='facilities'){render();}}if(!b)return;
 if(b.dataset.spaceSelect){let c=b.closest('.floor-card'),v=b.dataset.spaceSelect;chosenSpace[c.dataset.floor]=v;$$('[data-space-select]',c).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$$('.space-view',c).forEach(x=>x.hidden=x.dataset.space!==v);}
 if(b.dataset.budget){budget=+b.dataset.budget;updateBudget();}
 if(b.dataset.kind){foodType=b.dataset.kind;foodPage=1;renderFood();}
 if(b.dataset.foodGroup){foodGroup=b.dataset.foodGroup;foodPage=1;renderFood();}
 if(b.id==='near'){foodNear=!foodNear;foodPage=1;renderFood();}
 if(b.dataset.foodPage){foodPage=+b.dataset.foodPage;renderFood();$('#food-count').tabIndex=-1;$('#food-count').focus({preventScroll:true});$('.food-kind').scrollIntoView({block:'start',behavior:mqReduce.matches?'auto':'smooth'});}
 if(b.hasAttribute('data-reset-food')){foodGroup='all';foodNear=false;foodPage=1;renderFood();}
 if(b.dataset.culture){culture=b.dataset.culture;$$('[data-culture]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$$('[data-culture-group]').forEach(x=>x.hidden=x.dataset.cultureGroup!==culture);}
 if(b.dataset.departure){departure=+b.dataset.departure;$$('[data-departure]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#route-content').innerHTML=routeCard();}
 if(b.classList.contains('copy-address')){try{await navigator.clipboard.writeText(text('.ad>div>b'));toast('주소를 복사했어요');}catch{toast(text('.ad>div>b'));}}
});

const nav=document.querySelector('#siteLnb');
if(nav)nav.querySelectorAll('.lnb-list>li>a').forEach(a=>{
 const full=document.createElement('span');full.className='lm-nav-full';full.textContent=a.textContent;
 const short=document.createElement('span');short.className='lm-nav-short';short.textContent=({overview:'전체',facilities:'시설',tips:'생활 꿀팁',directions:'오시는 길'})[a.dataset.sub]||a.textContent;
 a.replaceChildren(full,short);
});
const dock=document.createElement('nav');dock.className='lm-dock';dock.setAttribute('aria-label','인사교 라이프 빠른 이동');
if(nav){dock.append(nav.querySelector('.lnb-list').cloneNode(true));document.body.append(dock);}
function syncNav(){
 const group=activeGroup(page);
 [nav,dock].filter(Boolean).forEach(n=>n.querySelectorAll('.lnb-list>li>a').forEach(a=>{
  const id=a.hash.slice(1);const selected=(id==='overview'&&group==='overview')||id===group;
  if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 }));
}
if(nav){
 const observer=new IntersectionObserver(entries=>document.body.classList.toggle('lm-docked',!entries[0].isIntersecting&&nav.getBoundingClientRect().top<0),{rootMargin:'-60px 0px 0px 0px'});observer.observe(nav);
}
addEventListener('hashchange',()=>{render();});
render();
})();
