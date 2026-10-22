const menuButton=document.querySelector('.menu-toggle');
const mobileNav=document.querySelector('#mobile-nav');
function closeMenu(){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','메뉴 열기');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';mobileNav.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
mobileNav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileNav.hidden){closeMenu();menuButton.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu();});
matchMedia('(min-width: 1001px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
// Preserve the first concept's incoming hash URLs after the page split.
if(document.body.dataset.page==='home'){
 const routes={courses:'courses.html',programs:'courses.html#programs',stories:'stories.html',check:'check.html',contact:'check.html#contact'};
 function routeLegacyHash(){const target=routes[location.hash.slice(1)];if(target)location.replace(target);}
 routeLegacyHash();addEventListener('hashchange',routeLegacyHash);
}
function filterCards(buttons,cardSelector,dataKey,statusSelector){
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const filter=button.dataset[dataKey];buttons.forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  let count=0;document.querySelectorAll(cardSelector).forEach(card=>{const value=dataKey==='filter'?card.dataset.mode:card.dataset.story;card.hidden=filter!=='all'&&value!==filter;if(!card.hidden)count++;});
  const status=document.querySelector(statusSelector);if(status)status.textContent=`${button.textContent.trim()} 선택, ${count}개 표시`;
 }));
}
filterCards([...document.querySelectorAll('[data-filter]')],'.course','filter','#filter-status');
filterCards([...document.querySelectorAll('[data-story-filter]')],'.journal-card','storyFilter','#story-status');
// The interview shortcut also resets a previous category filter before scrolling.
document.querySelectorAll('a[href="#interviews"]').forEach(a=>a.addEventListener('click',()=>document.querySelector('[data-story-filter="interview"]')?.click()));
const checks=[...document.querySelectorAll('.checklist input')];
checks.forEach(input=>input.addEventListener('change',()=>{document.querySelector('#check-count').textContent=`${checks.filter(i=>i.checked).length} / 4개 확인했어요`;}));
