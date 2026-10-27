/* Honors cards: interviews checked as 우수 수료생 in the backoffice (stories-render.js draws them before this runs and
   leaves them out of the general list), or the design-preview '준비 중' cards when none is checked. */
(function () {
  var section = document.querySelector('.iv-honors');
  if (!section) return;
  var track = section.querySelector('.sm-ivf-track');
  var cards = Array.from(track.querySelectorAll('.sm-ivf-c'));
  // These draft details belong only to the preview cards; checked interviews open their own detail (.ivd).
  cards.forEach(function (card, index) {
    if (!/^#iv-honors-/.test(card.getAttribute('href') || '')) return;
    var detail = document.createElement('div');
    detail.className = 'ivd ivd-honors'; detail.id = 'iv-honors-' + (index + 1);
    var back = document.createElement('a'); back.className = 'ivback';
    back.href = '#iv-honors-title'; back.textContent = '← 우수 수료생 인터뷰 목록';
    var wrap = document.createElement('div'); wrap.className = 'ivwrap';
    var main = document.createElement('div'), intro = document.createElement('header'); intro.className = 'ivintro';
    var hero = document.createElement('div'); hero.className = 'ivhero ivhero-avatar';
    var photo = card.querySelector('img').cloneNode(true); photo.className = 'illu'; hero.appendChild(photo);
    var tag = document.createElement('span'); tag.className = 'ivtag'; tag.textContent = '준비 중'; hero.prepend(tag);
    var bubble = document.querySelector('.ivd:not(.ivd-honors) .ivhero-bubble');
    if (bubble) hero.appendChild(bubble.cloneNode(true));
    var heading = document.createElement('h2'); heading.tabIndex = -1;
    heading.textContent = '우수 수료생 인터뷰 준비 중';
    var summary = document.createElement('p'); summary.className = 'lead';
    summary.textContent = '준비 중';
    var meta = document.createElement('div'); meta.className = 'ivintro-meta';
    ['기수 준비 중', '이름 준비 중', '과정 준비 중'].forEach(function (text, i) {
      if (i) { var dot = document.createElement('span'); dot.textContent = ' · '; dot.setAttribute('aria-hidden', 'true'); meta.appendChild(dot); }
      var label = document.createElement('span'); label.textContent = text; meta.appendChild(label);
    });
    intro.append(hero, heading, summary, meta); main.appendChild(intro);
    var qa = document.createElement('div'); qa.className = 'qa';
    var side = document.createElement('aside'); side.className = 'sidebox';
    var sideHeading = document.createElement('h3'); sideHeading.textContent = '이 인터뷰에서 묻는 것';
    var list = document.createElement('ol');
    var sample = document.querySelector('.ivd:not(.ivd-honors) .qa');
    var questionCount = sample ? sample.children.length : 13;
    for (var n = 1; n <= questionCount; n++) {
      var item = document.createElement('div'); item.id = 'q-honors-' + (index + 1) + '-' + n;
      var question = document.createElement('div'); question.className = 'q';
      var number = document.createElement('i'); number.textContent = n;
      var questionText = document.createElement('span'); questionText.textContent = '준비 중';
      question.append(number, questionText);
      var answer = document.createElement('p'); answer.className = 'a'; answer.textContent = '준비 중';
      item.append(question, answer); qa.appendChild(item);
      var li = document.createElement('li'), link = document.createElement('a');
      link.href = '#' + item.id; link.textContent = '준비 중'; li.appendChild(link); list.appendChild(li);
    }
    main.appendChild(qa); side.append(sideHeading, list); wrap.append(main, side);
    detail.append(back, wrap); document.getElementById('p-iv').appendChild(detail);
  });
  function focusDetail() {
    var detail = document.getElementById(location.hash.slice(1));
    if (detail && detail.classList.contains('ivd-honors')) detail.querySelector('h2').focus({preventScroll:true});
  }
  addEventListener('hashchange', focusDetail);
  requestAnimationFrame(focusDetail);
  var originals = cards;
  if (originals.length > 1) {
    [originals[originals.length - 1], originals[0]].forEach(function (card, i) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.tabIndex = -1;
      clone.dataset.loopCopy = 'true';
      clone.classList.remove('is-on');
      if (i === 0) track.insertBefore(clone, originals[0]); else track.appendChild(clone);
    });
    cards = Array.from(track.querySelectorAll('.sm-ivf-c'));
  }
  var first = originals.length > 1 ? 1 : 0;
  var reduce = matchMedia('(prefers-reduced-motion:reduce)'), current = first, timer, frame, destination = null, lastMove = 0;
  track.tabIndex = 0;
  track.setAttribute('role', 'group');
  track.setAttribute('aria-label', '우수 수료생 인터뷰 ' + originals.length + '개, 좌우 방향키로 넘기기');
  var desktopFan = matchMedia('(min-width:1081px)');
  var fanIndex = 0, fanCursor = 0;
  // Small collections repeat visually across five positions, in continuous post order.
  // These nodes never join the mobile scroller or create extra detail pages.
  var desktopCopies = [];
  if (originals.length > 0 && originals.length < 5) {
    track.classList.add('has-desktop-repeats');
    var cycles = Math.max(1, Math.ceil(3 / originals.length));
    for (var virtual = -cycles * originals.length; virtual < (cycles + 1) * originals.length; virtual++) {
      var source = (virtual % originals.length + originals.length) % originals.length;
      var copy = originals[source].cloneNode(true);
      copy.dataset.desktopCopy = 'true'; copy.dataset.virtualIndex = String(virtual);
      copy.classList.remove('is-on'); copy.tabIndex = -1; copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy); desktopCopies.push(copy);
    }
  }

  var desktopCount = document.createElement('span');
  desktopCount.className = 'honors-position-count';
  desktopCount.setAttribute('role', 'status'); desktopCount.setAttribute('aria-live', 'polite');
  var desktopControls = document.createElement('div'); desktopControls.className = 'honors-pc-controls';
  ['prev', 'next'].forEach(function (direction) {
    if (direction === 'next') desktopControls.appendChild(desktopCount);
    var source = section.querySelector('.sm-arrow--' + direction);
    var button = source.cloneNode(true);
    button.className = 'icon-btn';
    button.addEventListener('click', function () { move(direction === 'prev' ? -1 : 1); });
    desktopControls.appendChild(button);
  });
  section.querySelector('.sm-ivf').appendChild(desktopControls);
  originals.concat(desktopCopies).forEach(function (card) {
    var cue = document.createElement('span'); cue.className = 'honors-card-cue';
    cue.textContent = '이 인터뷰 보기'; cue.setAttribute('aria-hidden', 'true');
    card.appendChild(cue);
  });

  var drag = null, suppressClickUntil = 0;
  track.addEventListener('dragstart', function (event) { if (desktopFan.matches) event.preventDefault(); });
  track.addEventListener('pointerdown', function (event) {
    if (!desktopFan.matches || event.button !== 0) return;
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY, active:false};
  });
  track.addEventListener('pointermove', function (event) {
    if (!drag || !desktopFan.matches || drag.id !== event.pointerId) return;
    var x = event.clientX - drag.x, y = event.clientY - drag.y;
    if (!drag.active && Math.abs(y) > 8 && Math.abs(y) > Math.abs(x)) { drag = null; return; }
    if (!drag.active && Math.abs(x) > 7) {
      drag.active = true; track.setPointerCapture(event.pointerId); track.classList.add('is-dragging');
    }
    if (!drag.active) return;
    event.preventDefault();
    track.style.setProperty('--honors-drag-x', Math.max(-75, Math.min(75, x)) + 'px');
  });
  function endDrag(event, cancel) {
    if (!drag || event.pointerId !== drag.id) return;
    var active = drag.active, x = event.clientX - drag.x; drag = null;
    track.classList.remove('is-dragging'); track.style.removeProperty('--honors-drag-x');
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (active) suppressClickUntil = performance.now() + 300;
    if (active && !cancel && Math.abs(x) >= 45) move(x < 0 ? 1 : -1);
  }
  track.addEventListener('pointerup', function (event) { endDrag(event, false); });
  track.addEventListener('pointercancel', function (event) { endDrag(event, true); });
  track.addEventListener('lostpointercapture', function () {
    drag = null; track.classList.remove('is-dragging'); track.style.removeProperty('--honors-drag-x');
  });
  track.addEventListener('click', function (event) {
    if (!desktopFan.matches || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (event.detail > 0 && performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); return; }
    var card = event.target.closest('a.sm-ivf-c');
    if (!card || !track.contains(card) || card.dataset.fanPos === undefined) return;
    var offset = Number(card.dataset.fanPos);
    if (!offset || Math.abs(offset) > 2) return;
    event.preventDefault(); event.stopPropagation();
    var restoreFocus = document.activeElement === card;
    move(offset);
    if (restoreFocus) {
      var center = desktopCopies.length ? desktopCopies.find(function (item) { return item.dataset.fanPos === '0'; }) : originals[fanIndex];
      center.focus({preventScroll:true});
    }
  }, true);


  function paintFan() {
    originals.forEach(function (card, index) {
      var offset = (index - fanIndex + originals.length) % originals.length;
      if (offset > originals.length / 2) offset -= originals.length;
      card.dataset.fanPos = String(offset);
      card.classList.toggle('is-on', offset === 0);
      card.tabIndex = Math.abs(offset) > 2 ? -1 : 0;
      card.setAttribute('aria-hidden', Math.abs(offset) > 2 ? 'true' : 'false');
    });
    desktopCopies.forEach(function (card) {
      // Wrap only the offstage copies; the visible next card always moves left
      // into the center, including the last-post → first-post transition.
      var offset = (Number(card.dataset.virtualIndex) - fanCursor) % desktopCopies.length;
      if (offset > desktopCopies.length / 2) offset -= desktopCopies.length;
      if (offset < -desktopCopies.length / 2) offset += desktopCopies.length;
      card.dataset.fanPos = String(offset);
      card.classList.toggle('is-on', offset === 0);
      card.tabIndex = Math.abs(offset) <= 1 ? 0 : -1;
      card.setAttribute('aria-hidden', Math.abs(offset) <= 1 ? 'false' : 'true');
    });
    current = fanIndex + first;
    desktopCount.textContent = String(fanIndex + 1).padStart(2, '0') + ' / ' + String(originals.length).padStart(2, '0');
  }
  function syncLayout() {
    cancelAnimationFrame(frame); clearTimeout(timer); destination = null;
    drag = null; track.classList.remove('is-dragging'); track.style.removeProperty('--honors-drag-x');
    track.classList.remove('is-animating');
    if (desktopFan.matches) {
      track.scrollLeft = 0;
      paintFan();
    } else {
      originals.forEach(function (card) {
        card.removeAttribute('data-fan-pos'); card.removeAttribute('tabindex'); card.removeAttribute('aria-hidden');
      });
      desktopCopies.forEach(function (card) { card.tabIndex = -1; card.setAttribute('aria-hidden', 'true'); });
      align(current, true);
      paint();
    }
  }
  desktopFan.addEventListener('change', syncLayout);
  function nearest() {
    var center = track.scrollLeft + track.clientWidth / 2;
    return cards.reduce(function (best, card, i) {
      return Math.abs(card.offsetLeft + card.offsetWidth / 2 - center) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - center) ? i : best;
    }, 0);
  }
  function paint() {
    if (desktopFan.matches) { paintFan(); return; }
    current = nearest();
    if (originals.length > 1 && (current === 0 || current === cards.length - 1)) {
      current = current === 0 ? originals.length : 1;
      track.classList.add('is-repositioning');
      align(current, true);
      cards.forEach(function (card, i) { card.classList.toggle('is-on', i === current); });
      void track.offsetWidth;
      track.classList.remove('is-repositioning');
    }
    cards.forEach(function (card, i) { card.classList.toggle('is-on', i === current); });
  }
  function align(index, instant) {
    if (desktopFan.matches) { paintFan(); return; }
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    var card = cards[index], start = track.scrollLeft;
    var end = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    destination = index;
    cards.forEach(function (item, i) { item.classList.toggle('is-on', i === index); });
    track.classList.add('is-animating');
    function finish() {
      track.scrollTo({left:end, behavior:'instant'});
      destination = null;
      track.classList.remove('is-animating');
      paint();
    }
    if (instant || reduce.matches) {
      track.scrollTo({left:end, behavior:'instant'});
      destination = null;
      track.classList.remove('is-animating');
      current = index;
      return;
    }
    var began;
    function tick(now) {
      if (began === undefined) began = now;
      var progress = Math.min(1, (now - began) / 160);
      var eased = 1 - Math.pow(1 - progress, 3);
      track.scrollTo({left:start + (end - start) * eased, behavior:'instant'});
      if (progress < 1) frame = requestAnimationFrame(tick); else finish();
    }
    frame = requestAnimationFrame(tick);
  }
  function move(step) {
    if (desktopFan.matches) {
      fanCursor += step;
      fanIndex = (fanCursor % originals.length + originals.length) % originals.length;
      paintFan(); return;
    }
    var now = performance.now(), rapid = now - lastMove < 250;
    lastMove = now;
    if (destination !== null) align(destination, true);
    paint();
    align(Math.max(0, Math.min(cards.length - 1, current + step)), rapid);
    if (rapid) paint();
  }
  section.querySelector('.sm-arrow--prev').addEventListener('click', function () { move(-1); });
  section.querySelector('.sm-arrow--next').addEventListener('click', function () { move(1); });
  track.addEventListener('keydown', function (event) {
    if (event.target === track && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  track.addEventListener('scroll', function () {
    if (desktopFan.matches || destination !== null) return;
    clearTimeout(timer); timer = setTimeout(paint, 50);
  }, {passive:true});
  ['pointerdown', 'touchstart', 'wheel'].forEach(function (type) {
    track.addEventListener(type, function () {
      cancelAnimationFrame(frame); destination = null; track.classList.remove('is-animating');
    }, {passive:true});
  });
  addEventListener('resize', function () {
    if (desktopFan.matches) paintFan(); else align(current, true);
  });
  requestAnimationFrame(syncLayout);
})();
