/* Caption scrolling uses the review dialog's outer rail; native wheel/touch remain. */
(() => {
  'use strict';
  const dialog = document.querySelector('.cv3-m');
  if (!dialog) return;
  const box = dialog.querySelector('.cv3-m-box');
  const scroller = dialog.querySelector('.cv3-m-body');
  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'cv3-caption-scrollbar';
  control.setAttribute('role', 'scrollbar');
  control.setAttribute('aria-label', '기수별 기록 본문 스크롤 위치');
  control.setAttribute('aria-orientation', 'vertical');
  control.setAttribute('aria-valuemin', '0');
  control.setAttribute('aria-valuemax', '100');
  scroller.id = 'cv3-caption-scroll';
  control.setAttribute('aria-controls', scroller.id);
  const track = document.createElement('span');
  track.className = 'cv3-caption-track';
  const thumb = document.createElement('span');
  thumb.className = 'cv3-caption-thumb';
  track.append(thumb);
  control.append(track);
  box.append(control);
  box.classList.add('cv3-caption-external');
  // Keep one bounded album canvas per post; wide photos are letterboxed, not cropped.
  const media = dialog.querySelector('.cv3-m-media');
  const albumRatios = new WeakMap();
  function albumRatio() {
    const record = media.cv3Record;
    if (!record) return 1;
    if (!albumRatios.has(record)) {
      albumRatios.set(record, 1);
      const cover = record.illu;
      if (cover && cover.tagName === 'IMG') {
        const probe = cover.cloneNode(true);
        probe.removeAttribute('loading');
        const loaded = () => {
          if (!probe.naturalWidth || !probe.naturalHeight) return;
          albumRatios.set(record, Math.max(.8, Math.min(1, probe.naturalWidth / probe.naturalHeight)));
          if (media.cv3Record === record) { fitPhoto(); sync(); }
        };
        probe.addEventListener('load', loaded, {once:true});
        if (probe.complete) loaded();
      }
    }
    return albumRatios.get(record);
  }
  function fitPhoto() {
    if (dialog.hidden || innerWidth <= 760) return;
    const ratio = albumRatio();
    const caption = innerWidth > 1100 ? 400 : 340;
    const maxHeight = Math.min(680, innerHeight - 128);
    const width = Math.min(740, innerWidth - 176 - caption, maxHeight * ratio);
    box.style.setProperty('--cohort-photo-width', width + 'px');
    box.style.setProperty('--cohort-caption-width', caption + 'px');
    box.style.setProperty('--cohort-dialog-height', Math.max(Math.min(360, maxHeight), width / ratio) + 'px');
  }
  function sync() {
    if (dialog.hidden || !scroller.clientHeight) return;
    const mediaBounds = media.getBoundingClientRect();
    box.style.setProperty('--cohort-nav-top', mediaBounds.bottom - box.getBoundingClientRect().top - box.clientTop + 'px');
    const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    control.hidden = max < 1;
    const bounds = scroller.getBoundingClientRect();
    control.style.top = bounds.top - box.getBoundingClientRect().top + 8 + 'px';
    control.style.height = Math.max(0, bounds.height - 16) + 'px';
    const ratio = max ? scroller.scrollTop / max : 0;
    const height = Math.min(track.clientHeight, Math.max(36, track.clientHeight * scroller.clientHeight / scroller.scrollHeight));
    thumb.style.height = height + 'px';
    thumb.style.transform = 'translateY(' + Math.max(0, track.clientHeight - height) * ratio + 'px)';
    control.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    control.setAttribute('aria-valuetext', Math.round(ratio * 100) + '% 읽음');
  }
  control.addEventListener('keydown', event => {
    const steps = {ArrowDown:40, ArrowUp:-40, PageDown:scroller.clientHeight * .8, PageUp:-scroller.clientHeight * .8};
    if (Object.hasOwn(steps, event.key)) {
      event.preventDefault(); scroller.scrollBy(0, steps[event.key]);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); scroller.scrollTop = event.key === 'Home' ? 0 : scroller.scrollHeight;
    }
  });
  let drag;
  function move(event) {
    if (!drag) return;
    const bounds = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientY - bounds.top - drag.offset) / Math.max(1, bounds.height - thumb.offsetHeight)));
    scroller.scrollTop = ratio * Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  }
  control.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault(); control.focus({preventScroll:true});
    control.setPointerCapture(event.pointerId);
    drag = {offset:event.target === thumb ? event.clientY - thumb.getBoundingClientRect().top : thumb.offsetHeight / 2};
    move(event);
  });
  control.addEventListener('pointermove', move);
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => control.addEventListener(type, () => { drag = null; }));
  scroller.addEventListener('scroll', sync, {passive:true});
  new ResizeObserver(sync).observe(scroller);
  media.addEventListener('load', () => { fitPhoto(); sync(); }, true);
  new MutationObserver(() => requestAnimationFrame(() => { fitPhoto(); sync(); })).observe(media, {childList:true, subtree:true});
  new MutationObserver(() => { scroller.scrollTop = 0; requestAnimationFrame(sync); }).observe(scroller, {childList:true, subtree:true, characterData:true});
  new MutationObserver(() => requestAnimationFrame(() => { fitPhoto(); sync(); })).observe(dialog, {attributes:true, attributeFilter:['hidden']});
  addEventListener('resize', () => { fitPhoto(); sync(); });
  document.fonts.ready.then(sync);
  sync();
})();
