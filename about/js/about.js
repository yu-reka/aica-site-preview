'use strict';

const chapterLinks = [...document.querySelectorAll('.section-navigation a[data-section]')];
const chapters = [...new Set(chapterLinks.map(link => document.querySelector(link.hash)))].filter(Boolean);
// Sections may move while menu labels retain their agreed order.
const orderedChapters = [...chapters].sort((a, b) =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
);
const sectionNavigation = document.querySelector('.section-navigation');
const sectionTrigger = sectionNavigation?.querySelector('.section-navigation-trigger');
const sectionPanel = sectionNavigation?.querySelector('.section-navigation-panel');
const sectionTicks = [...(sectionNavigation?.querySelectorAll('.section-navigation-ticks i') || [])];

if (sectionTrigger && sectionPanel) {
  let keyboardNavigation = false;
  function setSectionNavigation(open) {
    sectionNavigation.classList.toggle('is-open', open);
    sectionTrigger.setAttribute('aria-expanded', String(open));
    sectionPanel.inert = !open;
  }
  sectionNavigation.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') setSectionNavigation(true);
  });
  sectionNavigation.addEventListener('pointerleave', () => {
    if (!keyboardNavigation || !sectionNavigation.contains(document.activeElement)) setSectionNavigation(false);
  });
  sectionNavigation.addEventListener('focusin', () => setSectionNavigation(true));
  sectionNavigation.addEventListener('focusout', event => {
    if (!sectionNavigation.contains(event.relatedTarget)) setSectionNavigation(false);
  });
  sectionTrigger.addEventListener('click', () => setSectionNavigation(true));
  sectionNavigation.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    sectionTrigger.focus({ preventScroll: true });
    setSectionNavigation(false);
  });
  document.addEventListener('pointerdown', event => {
    keyboardNavigation = false;
    if (!sectionNavigation.contains(event.target)) setSectionNavigation(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') keyboardNavigation = true;
  });
  sectionPanel.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const target = document.querySelector(link.hash);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    setSectionNavigation(false);
  });
}

function updateCurrentChapter() {
  if (!chapters.length) return;
  // 고정 헤더(common, 하위 메뉴 바 포함) 아래를 기준으로 현재 섹션을 고릅니다.
  const offset = (document.querySelector('.site-header')?.getBoundingClientRect().height || 0) + 120;
  let currentChapter = orderedChapters[0];
  for (const chapter of orderedChapters) {
    if (chapter.getBoundingClientRect().top <= offset) currentChapter = chapter;
  }
  for (const link of chapterLinks) {
    if (link.hash === '#' + currentChapter.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  sectionTicks.forEach((tick, index) => tick.classList.toggle('is-current', chapters[index] === currentChapter));
}

let scrollQueued = false;
window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    updateCurrentChapter();
    scrollQueued = false;
  });
}, { passive: true });
window.addEventListener('resize', updateCurrentChapter);
window.addEventListener('hashchange', updateCurrentChapter);
updateCurrentChapter();

// Run connector motion only while its diagram is on screen.
const partnerNetwork = document.querySelector('.partner-network');
if (partnerNetwork && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    partnerNetwork.dataset.flowActive = String(entries[0].isIntersecting);
  }, { threshold: .1 }).observe(partnerNetwork);
}

// A hash link from another page lands before the web fonts settle the layout.
// Arrive without the smooth animation, then align once more after the fonts load.
const initialTarget = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
if (initialTarget && document.fonts) {
  const root = document.documentElement;
  let userScrolled = false;
  const markScrolled = () => { userScrolled = true; };
  ['wheel', 'touchstart', 'keydown'].forEach(type => window.addEventListener(type, markScrolled, { once: true, passive: true }));
  root.style.scrollBehavior = 'auto';
  document.fonts.ready.then(() => {
    if (!userScrolled) initialTarget.scrollIntoView({ behavior: 'instant', block: 'start' });
    root.style.scrollBehavior = '';
  });
}
