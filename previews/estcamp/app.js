const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu(){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','메뉴 열기');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';mobileNav.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
mobileNav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileNav.hidden){closeMenu();menuButton.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu();});
matchMedia('(min-width: 1001px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});let count=0;document.querySelectorAll('.course').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.mode!==filter;if(!card.hidden)count++;});document.querySelector('#filter-status').textContent=`${button.textContent.trim()} 선택, ${count}개 과정`; }));
const track=document.querySelector('.story-track');
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function moveStories(direction){track.scrollBy({left:direction*(track.querySelector('.story').getBoundingClientRect().width+24),behavior:reduced()?'instant':'smooth'});}
document.querySelector('#story-prev').addEventListener('click',()=>moveStories(-1));
document.querySelector('#story-next').addEventListener('click',()=>moveStories(1));
track.addEventListener('keydown',e=>{if(e.target===track&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();moveStories(e.key==='ArrowRight'?1:-1);}});
const checks=[...document.querySelectorAll('.checklist input')];
checks.forEach(input=>input.addEventListener('change',()=>{document.querySelector('#check-count').textContent=`${checks.filter(i=>i.checked).length} / 4개 확인했어요`;}));
