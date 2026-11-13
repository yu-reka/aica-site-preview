/* 알아보기 활동 사진 갤러리: 분류 필터, 사진 넘김(단추 · 키보드 ←→ · 손가락으로 밀기), 점 표시와 설명을 관리한다. about.js 다음에 실행된다. */
(() => {
'use strict';

const reducedMotion = SiteUI.motion();

const activityGallery = document.querySelector('#activities .activity-gallery');
if (activityGallery) {
  const slides = [...activityGallery.querySelectorAll('.activity-gallery-slide')];
  const filters = [...activityGallery.querySelectorAll('[data-gallery-category]')];
  const stage = activityGallery.querySelector('.activity-gallery-stage');
  const dots = activityGallery.querySelector('.activity-gallery-dots');
  const caption = activityGallery.querySelector('.activity-gallery-caption');
  const description = activityGallery.querySelector('.activity-gallery-description');
  const categoryLabel = activityGallery.querySelector('.activity-gallery-category');
  const names = { orientation: '오리엔테이션', lecture: '특강', field: '현장학습', jobfair: '취업박람회', graduation: '수료식' };
  const positions = Object.fromEntries(filters.map(filter => [filter.dataset.galleryCategory, 0]));
  let category = 'orientation';
  let currentSlides = [];
  let dotButtons = [];
  let visibleSlide;
  let galleryNear = !('IntersectionObserver' in window);
  let renderSequence = 0;
  let preparingSequence = 0;
  let transitionLayer;
  let transitionAnimations = [];
  const showText = (target, from, fallback) => {
    const clean = window.PageBlocks && window.PageBlocks.cleanHtml;
    if (from && clean) target.innerHTML = clean(from.innerHTML);
    else target.textContent = from ? from.textContent : fallback || '';
  };
  const clearTransition = () => {
    for (const animation of transitionAnimations) animation.cancel();
    transitionAnimations = [];
    transitionLayer?.remove();
    transitionLayer = undefined;
    delete activityGallery.dataset.galleryAnimating;
  };
  const renderGallery = async (direction = 0) => {
    const sequence = ++renderSequence;
    const index = positions[category];
    const current = currentSlides[index];
    const previous = currentSlides[(index - 1 + currentSlides.length) % currentSlides.length];
    const next = currentSlides[(index + 1) % currentSlides.length];
    // Decode before replacing the central image; stale requests never commit.
    if (galleryNear) for (const slide of [current, previous, next]) slide.querySelector('img').loading = 'eager';
    if (visibleSlide && visibleSlide !== current) {
      preparingSequence = sequence;
      await current.querySelector('img').decode().catch(() => {});
      if (sequence !== renderSequence) return;
    }
    preparingSequence = 0;
    const outgoing = visibleSlide;
    clearTransition();
    let layer;
    let movingFrames;
    if (outgoing && outgoing !== current && outgoing.dataset.category === current.dataset.category) {
      const from = currentSlides.indexOf(outgoing);
      const forward = (index - from + currentSlides.length) % currentSlides.length;
      direction ||= forward <= currentSlides.length / 2 ? 1 : -1;
    } else direction = 0;
    if (outgoing && outgoing !== current && !reducedMotion.matches && typeof current.animate === 'function') {
      // Separate slots keep wrap-around previews outside the central path.
      const makePhoto = slide => {
        const photo = slide.querySelector('.activity-gallery-photo').cloneNode(true);
        photo.querySelector('img').alt = '';
        photo.querySelector('img').loading = 'eager';
        return photo;
      };
      layer = document.createElement('div');
      layer.className = 'activity-gallery-transition-layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.inert = true;
      if (direction) {
        layer.classList.add('activity-gallery-transition-track');
        const from = currentSlides.indexOf(outgoing);
        const neighbor = activityGallery.querySelector('[data-gallery-position="next"]');
        const distance = new DOMMatrixReadOnly(getComputedStyle(neighbor).transform).m41;
        const pose = slot => ({
          transform: `translateX(${slot * distance}px) scale(${slot === 0 ? 1 : .92})`,
          opacity: slot === 0 ? 1 : .52,
          filter: slot === 0 ? 'blur(0px)' : 'blur(4px)'
        });
        movingFrames = [];
        for (let slot = -2; slot <= 2; slot++) {
          const slide = currentSlides[(from + slot + currentSlides.length * 2) % currentSlides.length];
          const frame = document.createElement('div');
          frame.className = 'activity-gallery-transition-frame';
          frame.style.cssText = slide.style.cssText;
          frame.classList.add(...[...slide.classList].filter(name => name.startsWith('export-style-')));
          const initial = pose(slot);
          frame.style.transform = initial.transform;
          frame.style.zIndex = slot === direction ? '3' : slot === 0 ? '2' : '1';
          const photo = makePhoto(slide);
          photo.style.opacity = initial.opacity;
          photo.style.filter = initial.filter;
          frame.append(photo);
          layer.append(frame);
          movingFrames.push({ frame, photo, from: initial, to: pose(slot - direction) });
        }
        activityGallery.dataset.galleryAnimating = 'true';
      } else {
        layer.style.cssText = outgoing.style.cssText;
        layer.classList.add(...[...outgoing.classList].filter(name => name.startsWith('export-style-')));
        layer.append(makePhoto(outgoing));
      }
      stage.append(layer);
      transitionLayer = layer;
    }
    for (const slide of slides) {
      const active = slide === current;
      slide.dataset.galleryPosition = active ? 'current' : slide === previous ? 'previous' : slide === next ? 'next' : 'hidden';
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    }
    current.querySelector('img').loading = galleryNear ? 'eager' : 'lazy';
    // 사진 아래 글: 카드의 제목(figcaption) · 설명 칸 꾸밈 그대로(페이지 관리의 굵게 · 글자 색 — 페이지 블록 글 정리를 거친 글), 칸이 없으면 속성 글
    showText(caption, current.querySelector('figcaption'), current.dataset.title);
    showText(description, current.querySelector('.activity-gallery-slide-description'), current.dataset.description);
    categoryLabel.textContent = names[category];
    current.setAttribute('aria-label', `${names[category]} ${index + 1}번째 사진: ${current.dataset.title}`);
    for (let i = 0; i < dotButtons.length; i++) dotButtons[i].setAttribute('aria-current', String(i === index));
    visibleSlide = current;
    if (layer) {
      const options = { duration: 480, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' };
      transitionAnimations = movingFrames ? movingFrames.flatMap(({ frame, photo, from, to }) => [
        frame.animate([{ transform: from.transform }, { transform: to.transform }], options),
        photo.animate([{ opacity: from.opacity, filter: from.filter }, { opacity: to.opacity, filter: to.filter }], options)
      ]) : [
        layer.animate([{ opacity: 1 }, { opacity: 0 }], options),
        current.animate([{ opacity: 0 }, { opacity: 1 }], options)
      ];
      Promise.allSettled(transitionAnimations.map(animation => animation.finished)).then(() => {
        if (transitionLayer === layer) {
          clearTransition();
        } else layer.remove();
      });
    }
  };
  const selectCategory = value => {
    category = value;
    currentSlides = slides.filter(slide => slide.dataset.category === category);
    for (const filter of filters) filter.setAttribute('aria-pressed', String(filter.dataset.galleryCategory === category));
    dots.replaceChildren();
    dotButtons = currentSlides.map((slide, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'activity-gallery-dot';
      button.setAttribute('aria-label', `${slide.dataset.title} 사진 보기`);
      const mark = document.createElement('span');
      mark.setAttribute('aria-hidden', 'true');
      button.append(mark);
      button.addEventListener('click', () => { positions[category] = index; renderGallery(); });
      dots.append(button);
      return button;
    });
    renderGallery();
  };
  const moveGallery = direction => {
    // Ignore extra input during decoding or motion; never replay clicks later.
    if (preparingSequence || transitionLayer) return;
    positions[category] = (positions[category] + direction + currentSlides.length) % currentSlides.length;
    renderGallery(direction);
  };
  if (slides.length && stage && dots && caption && description && categoryLabel) {
    activityGallery.dataset.galleryReady = 'true';
    for (const element of activityGallery.querySelectorAll('.activity-gallery-filters, .activity-gallery-arrows, .activity-gallery-info, .activity-gallery-pagination')) element.hidden = false;
    for (const filter of filters) filter.addEventListener('click', () => selectCategory(filter.dataset.galleryCategory));
    for (const arrow of activityGallery.querySelectorAll('[data-gallery-direction]')) arrow.addEventListener('click', () => moveGallery(Number(arrow.dataset.galleryDirection)));
    activityGallery.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        moveGallery(event.key === 'ArrowLeft' ? -1 : 1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        positions[category] = event.key === 'Home' ? 0 : currentSlides.length - 1;
        renderGallery();
      }
    });
    let gesture;
    stage.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.target.closest('button') || (event.pointerType === 'mouse' && event.button !== 0)) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    stage.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture = undefined;
      if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) moveGallery(dx < 0 ? 1 : -1);
    });
    stage.addEventListener('pointercancel', () => { gesture = undefined; });
    stage.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') gesture = undefined; });
    reducedMotion.addEventListener('change', () => { clearTransition(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTransition(); } });
    selectCategory(category);
    if (!galleryNear) {
      const galleryObserver = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        galleryNear = true; galleryObserver.disconnect();
        const index = positions[category];
        for (const offset of [-1, 0, 1]) currentSlides[(index + offset + currentSlides.length) % currentSlides.length].querySelector('img').loading = 'eager';
      }, {rootMargin: '200px'});
      galleryObserver.observe(activityGallery);
    }
  }
}
})();
