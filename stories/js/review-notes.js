/* Fit card excerpts to the available full lines and use a centered ellipsis (⋯).
   Keep the full source in memory; modal content and data are never shortened. */
(() => {
  'use strict';
  const selector = '.idc > .in > p, .hb-pi p, .sm-review-preview';
  const seen = new WeakMap();
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ko', {granularity:'grapheme'}) : null;
  let measurements = new WeakMap();
  let frame;
  function fit(element) {
    const state = seen.get(element);
    if (!state || !element.clientWidth || !element.clientHeight) return;
    const style = getComputedStyle(element);
    const line = parseFloat(style.lineHeight);
    if (!(line > 0)) return;
    const key = [element.clientWidth, element.clientHeight, style.font, style.letterSpacing].join('|');
    if (measurements.get(element) === key) return;
    measurements.set(element, key);
    const lines = Math.floor(element.clientHeight / line);
    state.excerpt.hidden = lines < 1;
    if (lines < 1) return;
    const allowed = lines * line;
    const write = text => { if (state.excerpt.textContent !== text) state.excerpt.textContent = text; };
    write(state.source);
    if (state.excerpt.offsetHeight <= allowed + .5) return;
    const characters = segmenter ? Array.from(segmenter.segment(state.source), part => part.segment) : Array.from(state.source);
    let low = 0, high = characters.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      write(characters.slice(0, middle).join('').trimEnd() + '⋯');
      if (state.excerpt.offsetHeight <= allowed + .5) low = middle;
      else high = middle - 1;
    }
    write(characters.slice(0, low).join('').trimEnd() + '⋯');
  }
  const resize = new ResizeObserver(entries => entries.forEach(entry => fit(entry.target)));
  function scan() {
    document.querySelectorAll(selector).forEach(element => {
      if (!seen.has(element)) {
        const source = element.textContent;
        const excerpt = document.createElement('span');
        excerpt.className = 'note-excerpt';
        excerpt.textContent = source;
        seen.set(element, {source, excerpt});
        element.replaceChildren(excerpt);
        resize.observe(element);
      }
      fit(element);
    });
  }
  function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(scan); }
  new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1))) schedule();
  }).observe(document.querySelector('main'), {childList:true, subtree:true});
  document.fonts.ready.then(() => { measurements = new WeakMap(); schedule(); });
  addEventListener('resize', schedule);
  scan();
})();

/* Progressive enhancement: preserve wheel/touch scrolling and add an accessible outer rail. */
(() => {
  'use strict';
  const initialized = new WeakSet();
  const refreshers = new Set();
  function enhance() {
    document.querySelectorAll('.stories-page .ov .sheet').forEach(sheet => {
      if (initialized.has(sheet)) return;
      const scroller = sheet.querySelector('.mscroll');
      if (!scroller) return;
      initialized.add(sheet);
      const control = document.createElement('button');
      control.type = 'button';
      control.className = 'review-scrollbar';
      control.setAttribute('role', 'scrollbar');
      control.setAttribute('aria-label', '후기 스크롤 위치');
      control.setAttribute('aria-orientation', 'vertical');
      control.setAttribute('aria-valuemin', '0');
      control.setAttribute('aria-valuemax', '100');
      if (!scroller.id) scroller.id = sheet.closest('.ov').id + '-scroll';
      control.setAttribute('aria-controls', scroller.id);
      const track = document.createElement('span');
      track.className = 'review-scroll-track';
      const thumb = document.createElement('span');
      thumb.className = 'review-scroll-thumb';
      track.append(thumb);
      control.append(track);
      sheet.append(control);
      sheet.classList.add('review-external-scroll');
      function sync() {
        if (!scroller.clientHeight) return;
        const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        control.hidden = max < 1;
        const ratio = max ? scroller.scrollTop / max : 0;
        const height = Math.min(track.clientHeight, Math.max(36, track.clientHeight * scroller.clientHeight / scroller.scrollHeight));
        thumb.style.height = height + 'px';
        thumb.style.transform = 'translateY(' + Math.max(0, track.clientHeight - height) * ratio + 'px)';
        control.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
        control.setAttribute('aria-valuetext', Math.round(ratio * 100) + '% 읽음');
      }
      scroller.addEventListener('scroll', sync, {passive:true});
      control.addEventListener('keydown', event => {
        const steps = {ArrowDown:40, ArrowUp:-40, PageDown:scroller.clientHeight * .8, PageUp:-scroller.clientHeight * .8};
        if (Object.hasOwn(steps, event.key)) {
          event.preventDefault();
          scroller.scrollBy(0, steps[event.key]);
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          scroller.scrollTop = event.key === 'Home' ? 0 : scroller.scrollHeight;
        }
      });
      let drag;
      control.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        event.preventDefault();
        control.focus({preventScroll:true});
        control.setPointerCapture(event.pointerId);
        drag = {offset:event.target === thumb ? event.clientY - thumb.getBoundingClientRect().top : thumb.offsetHeight / 2};
        move(event);
      });
      function move(event) {
        if (!drag) return;
        const bounds = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientY - bounds.top - drag.offset) / Math.max(1, bounds.height - thumb.offsetHeight)));
        scroller.scrollTop = ratio * Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      }
      control.addEventListener('pointermove', move);
      const stop = () => { drag = null; };
      control.addEventListener('pointerup', stop);
      control.addEventListener('pointercancel', stop);
      control.addEventListener('lostpointercapture', stop);
      const resize = new ResizeObserver(sync);
      resize.observe(scroller);
      [...scroller.children].forEach(child => resize.observe(child));
      new MutationObserver(() => {
        [...scroller.children].forEach(child => resize.observe(child));
        sync();
      }).observe(scroller, {childList:true, subtree:true, characterData:true});
      refreshers.add(sync);
      sync();
    });
  }
  enhance();
  new MutationObserver(enhance).observe(document.querySelector('main'), {childList:true, subtree:true});
  addEventListener('hashchange', () => requestAnimationFrame(() => refreshers.forEach(sync => sync())));
  document.fonts.ready.then(() => refreshers.forEach(sync => sync()));
})();
