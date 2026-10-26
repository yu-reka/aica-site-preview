/* Desktop month navigation; the existing mobile rail keeps its own controls. */
(() => {
  'use strict';
  const root = document.querySelector('#cv3');
  const track = root?.querySelector('.cv3-hl');
  if (!track) return;
  const desktop = matchMedia('(min-width:601px)');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const box = document.createElement('div');
  box.className = 'cv3-month-nav';
  const content = track.closest('.sm-rail-box--hl') || track;
  content.before(box); box.append(content);
  let count = 1, step = 1;
  function button(dir) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sm-arrow ui-rail-arrow cv3-month-arrow cv3-month-' + dir;
    b.setAttribute('aria-label', (dir === 'prev' ? '이전' : '다음') + ' 월 목록');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (dir === 'prev' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6') + '"/></svg>';
    b.addEventListener('click', () => move(dir === 'prev' ? -1 : 1));
    box.append(b); return b;
  }
  const prev = button('prev'), next = button('next');
  function state() {
    if (!desktop.matches) return;
    const s = SiteUI.railState(track, 1);
    prev.disabled = s.atStart; next.disabled = s.atEnd;
    box.classList.toggle('has-previous', !s.atStart);
    box.classList.toggle('has-next', !s.atEnd);
  }
  function move(direction) {
    if (!desktop.matches || !track.children.length) return;
    const index = Math.round(track.scrollLeft / step);
    track.scrollTo({left:Math.max(0, index + direction * count) * step, behavior:reduce.matches ? 'auto' : 'smooth'});
  }
  function layout() {
    if (!desktop.matches) { box.style.removeProperty('--month-rail-width'); return; }
    const items = [...track.children];
    const first = items[0];
    if (!first || track.hidden) { box.dataset.overflow = 'false'; state(); return; }
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    step = first.getBoundingClientRect().width + gap;
    const total = items.length * step - gap + 24;
    const overflow = total > box.clientWidth + 1;
    box.dataset.overflow = String(overflow);
    count = Math.max(1, Math.floor((box.clientWidth - (overflow ? 104 : 0) - 24 + gap) / step));
    const width = overflow ? count * step - gap + 24 : box.clientWidth;
    box.style.setProperty('--month-rail-width', width + 'px');
    // A full number of items fits between the two controls, including the last page.
    const max = Math.max(0, items.length - count);
    track.scrollLeft = Math.min(max, Math.round(track.scrollLeft / step)) * step;
    state();
  }
  track.addEventListener('scroll', state, {passive:true});
  track.addEventListener('keydown', event => {
    if (!desktop.matches || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    const items = [...track.children], index = items.indexOf(event.target);
    if (index < 0) return;
    event.preventDefault();
    const target = items[Math.max(0, Math.min(items.length - 1, index + (event.key === 'ArrowLeft' ? -1 : 1)))];
    target.focus({preventScroll:true});
    const position = items.indexOf(target);
    if (position * step < track.scrollLeft || position * step >= track.scrollLeft + count * step) {
      track.scrollTo({left:Math.floor(position / count) * count * step,behavior:reduce.matches ? 'auto':'smooth'});
    }
  });
  root.addEventListener('cv3:draw', layout);
  desktop.addEventListener('change', layout);
  new ResizeObserver(layout).observe(box);
  document.fonts?.ready.then(layout);
  layout();
})();
