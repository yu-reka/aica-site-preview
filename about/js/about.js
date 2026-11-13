/* 알아보기 본문의 상호작용을 관리한다. 사이트 공통 메뉴는 common/js/site.js가 맡는다.
   활동 사진 갤러리는 about-gallery.js, 프로젝트 축하 효과·영상은 about-projects.js, 모바일 바로가기 탭은 about-m.js가 이 파일 다음에 맡는다. */
(() => {
'use strict';

const reducedMotion = SiteUI.motion();

// Run connector motion only while its diagram is on screen.
const partnerNetwork = document.querySelector('.partner-network');
if (partnerNetwork && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    partnerNetwork.dataset.flowActive = String(entries[0].isIntersecting);
  }, { threshold: .1 }).observe(partnerNetwork);
}

// 관련 기관 연결선(10-14): 디자이너 곡선 그대로, 실제 위치(px)로 다시 그려 위 점 정가운데에서 나가 아래 네 점 정가운데로 들어가게.
// 점은 CSS에서 카드 테두리 가운데에 정확히 놓음(about.css 끝). 800px 이하는 HTML의 모바일 선 그대로
const partnerWires = partnerNetwork && partnerNetwork.querySelector('.partner-wires-desktop');
const partnerSchool = partnerNetwork && partnerNetwork.querySelector('.partner-node-school');
const partnerKids = partnerNetwork ? [...partnerNetwork.querySelectorAll('.partner-network-children > .partner-node')] : [];
if (partnerWires && partnerSchool && partnerKids.length) {
  const drawPartnerWires = () => {
    const box = partnerWires.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const f = n => Math.round(n * 10) / 10;
    const s = partnerSchool.getBoundingClientRect();
    const cx = s.left + s.width / 2 - box.left, sy = s.bottom - box.top - partnerSchool.clientTop;   // 점 가운데 = 테두리 안쪽 끝(clientTop)
    partnerWires.setAttribute('viewBox', `0 0 ${f(box.width)} ${f(box.height)}`);
    partnerWires.innerHTML = partnerKids.map(k => {
      const b = k.getBoundingClientRect(), x = b.left + b.width / 2 - box.left, ey = b.top - box.top + k.clientTop, h = ey - sy;
      return `<path d="M${f(cx)} ${f(sy)}C${f(cx + (x - cx) * .14)} ${f(sy + h * .55)} ${f(x)} ${f(sy + h * .4)} ${f(x)} ${f(ey)}"/>`;   // 원래 곡선(조절점 55 · 40)에서 첫 조절점만 목표 쪽으로 조금 — 네 선이 점에서 겹쳐 뭉치지 않고 바로 갈라짐
    }).join('');
  };
  drawPartnerWires();
  if ('ResizeObserver' in window) new ResizeObserver(drawPartnerWires).observe(partnerNetwork);
  else window.addEventListener('resize', drawPartnerWires);
}

// Reveal the four layered news cards once; their motion is defined in CSS.
// Observe the stationary frame so the animated offset does not alter its trigger.
const introNewsStack = document.querySelector('.intro-news-stack');
if (introNewsStack && !reducedMotion.matches && 'IntersectionObserver' in window) {
  introNewsStack.dataset.newsReveal = 'waiting';
  const introNewsObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    introNewsStack.dataset.newsReveal = 'visible';
    introNewsObserver.disconnect();
  }, { rootMargin: '0px 0px -120px 0px', threshold: 0 });
  introNewsObserver.observe(introNewsStack);
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    introNewsStack.dataset.newsReveal = 'visible';
    introNewsObserver.disconnect();
  });
}

// Reveal each benefit card once; stacked mobile cards wait for their own entry.
const whySchoolCards = [...document.querySelectorAll('#why-school .why-school-cards > .why-school-card')];
if (whySchoolCards.length && !reducedMotion.matches && 'IntersectionObserver' in window) {
  const whySchoolObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.dataset.cardReveal = 'visible';
      whySchoolObserver.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -120px 0px', threshold: .08 });
  for (const card of whySchoolCards) {
    card.dataset.cardReveal = 'waiting';
    whySchoolObserver.observe(card);
  }
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    for (const card of whySchoolCards) card.dataset.cardReveal = 'visible';
    whySchoolObserver.disconnect();
  });
}

// Keep the source code and its colors intact; animate each line's visible width.
const whySchoolCodeEditor = document.querySelector('#why-school .why-school-code-editor');
if (whySchoolCodeEditor && !reducedMotion.matches && 'IntersectionObserver' in window) {
  const codeLines = [...whySchoolCodeEditor.querySelectorAll('.why-school-code-lines code')]
    .filter(line => line.textContent.trim().length);
  let typingDelay = .35;
  for (const line of codeLines) {
    const characters = line.textContent.length;
    const duration = Math.max(.65, characters * .055);
    line.classList.add('why-school-typing-line');
    line.style.setProperty('--typing-characters', String(characters));
    line.style.setProperty('--typing-width', `calc(${characters}ch + 2px)`);
    line.style.setProperty('--typing-duration', `${duration}s`);
    line.style.setProperty('--typing-delay', `${typingDelay}s`);
    typingDelay += duration + .22;
  }
  if (codeLines.length) {
    whySchoolCodeEditor.dataset.codeTyping = 'waiting';
    const projectCard = whySchoolCodeEditor.closest('.why-school-card');
    let codeVisible = false;
    let codeCardReady = projectCard?.dataset.cardReveal !== 'waiting';
    let codeRestartTimer;
    let codeStartFrame;
    const clearCodeSchedule = () => {
      clearTimeout(codeRestartTimer);
      cancelAnimationFrame(codeStartFrame);
    };
    const canTypeCode = () => codeVisible && codeCardReady && !reducedMotion.matches && !document.hidden;
    const startTyping = () => {
      clearCodeSchedule();
      if (!canTypeCode()) return;
      whySchoolCodeEditor.dataset.codeTyping = 'waiting';
      codeStartFrame = requestAnimationFrame(() => {
        if (canTypeCode()) whySchoolCodeEditor.dataset.codeTyping = 'typing';
      });
    };
    const stopTyping = () => {
      clearCodeSchedule();
      whySchoolCodeEditor.dataset.codeTyping = codeCardReady ? 'complete' : 'waiting';
    };
    const codeObserver = new IntersectionObserver(entries => {
      codeVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= .35;
      if (codeVisible) startTyping();
      else stopTyping();
    }, { threshold: .35 });
    codeObserver.observe(whySchoolCodeEditor);
    const observeCodeAfterCard = event => {
      if (event.target !== projectCard || event.animationName !== 'why-school-card-reveal') return;
      projectCard.removeEventListener('animationend', observeCodeAfterCard);
      codeCardReady = true;
      startTyping();
    };
    if (!codeCardReady) projectCard.addEventListener('animationend', observeCodeAfterCard);
    const finishTyping = () => {
      clearCodeSchedule();
      whySchoolCodeEditor.dataset.codeTyping = 'complete';
      if (canTypeCode()) codeRestartTimer = setTimeout(startTyping, 2000);
    };
    whySchoolCodeEditor.addEventListener('animationend', event => {
      if (whySchoolCodeEditor.dataset.codeTyping === 'typing' && event.target === codeLines[codeLines.length - 1] && event.animationName === 'why-school-code-type') finishTyping();
    });
    reducedMotion.addEventListener('change', event => {
      if (event.matches) {
        codeCardReady = true;
        projectCard?.removeEventListener('animationend', observeCodeAfterCard);
        stopTyping();
      } else {
        startTyping();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopTyping();
      else startTyping();
    });
  }
}

// Repeat the three learning steps only while their illustration is visible.
const whySchoolLearning = document.querySelector('#why-school .why-school-visual--learning');
if (whySchoolLearning && 'IntersectionObserver' in window) {
  const learningCard = whySchoolLearning.closest('.why-school-card');
  let learningVisible = false;
  let learningCardReady = learningCard?.dataset.cardReveal !== 'waiting';
  const learningProgress = whySchoolLearning.querySelector('.why-school-learning-progress');
  let learningTimer;
  let pendingLearningStep = 0;
  const stopLearning = () => {
    clearTimeout(learningTimer);
    pendingLearningStep = 0;
    whySchoolLearning.dataset.learningActive = 'false';
  };
  const beginLearningCycle = () => {
    whySchoolLearning.dataset.learningStep = '1';
    pendingLearningStep = 2;
    whySchoolLearning.dataset.learningRouteStep = '2';
  };
  const startLearning = () => {
    stopLearning();
    if (!learningVisible || !learningCardReady || reducedMotion.matches || document.hidden) return;
    whySchoolLearning.dataset.learningStep = '0';
    whySchoolLearning.dataset.learningRouteStep = '0';
    whySchoolLearning.dataset.learningActive = 'true';
    learningTimer = setTimeout(beginLearningCycle, 350);
  };
  // A destination node lights only after the route's actual CSS transition ends.
  learningProgress.addEventListener('transitionend', event => {
    if (event.target !== learningProgress || event.propertyName !== 'stroke-dashoffset' ||
        whySchoolLearning.dataset.learningActive !== 'true' || !pendingLearningStep) return;
    const arrivedStep = pendingLearningStep;
    pendingLearningStep = 0;
    whySchoolLearning.dataset.learningStep = String(arrivedStep);
    if (arrivedStep === 2) {
      learningTimer = setTimeout(() => {
        pendingLearningStep = 3;
        whySchoolLearning.dataset.learningRouteStep = '3';
      }, 200);
    } else {
      learningTimer = setTimeout(() => {
        whySchoolLearning.dataset.learningStep = '0';
        whySchoolLearning.dataset.learningRouteStep = '0';
        learningTimer = setTimeout(beginLearningCycle, 450);
      }, 2000);
    }
  });
  if (!reducedMotion.matches) {
    whySchoolLearning.dataset.learningStep = '0';
    whySchoolLearning.dataset.learningRouteStep = '0';
  }
  new IntersectionObserver(entries => {
    learningVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= .25;
    if (learningVisible) startLearning();
    else stopLearning();
  }, { threshold: .25 }).observe(whySchoolLearning);
  const learningCardFinished = event => {
    if (event.target !== learningCard || event.animationName !== 'why-school-card-reveal') return;
    learningCardReady = true;
    learningCard.removeEventListener('animationend', learningCardFinished);
    startLearning();
  };
  if (!learningCardReady) learningCard.addEventListener('animationend', learningCardFinished);
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      stopLearning();
      learningCardReady = true;
      learningCard?.removeEventListener('animationend', learningCardFinished);
      whySchoolLearning.dataset.learningStep = '3';
      whySchoolLearning.dataset.learningRouteStep = '3';
    } else {
      startLearning();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLearning();
    else startLearning();
  });
}

// Uncover each curriculum card left to right while keeping its grid slot intact.
const commonCourseCards = [...document.querySelectorAll('#learning .common-courses-grid > .common-course-card')];
if (commonCourseCards.length && !reducedMotion.matches && 'IntersectionObserver' in window) {
  const commonCourseObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < .12) continue;
      entry.target.dataset.courseReveal = 'visible';
      commonCourseObserver.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -56px 0px', threshold: .12 });
  for (const card of commonCourseCards) {
    card.dataset.courseReveal = 'waiting';
    commonCourseObserver.observe(card);
    card.addEventListener('animationend', event => {
      if (event.target === card && event.animationName === 'common-course-wipe') card.dataset.courseReveal = 'complete';
    });
  }
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    for (const card of commonCourseCards) card.dataset.courseReveal = 'complete';
    commonCourseObserver.disconnect();
  });
}

// Count hours and graduate figures once when their numbers enter the viewport.
const educationHourNumbers = [...document.querySelectorAll('#education-hours .education-hours-number[data-count-to], .graduate-stats .graduate-number[data-count-to]')];
if (educationHourNumbers.length && !reducedMotion.matches && 'IntersectionObserver' in window) {
  const educationHoursCounters = educationHourNumbers.map(number => ({
    number,
    target: Number(number.dataset.countTo),
    suffix: number.textContent.trim().endsWith('%') ? '%' : '',
    decimals: Number(number.dataset.countDecimals || 0),
    formatter: new Intl.NumberFormat('ko-KR', { minimumFractionDigits: Number(number.dataset.countDecimals || 0), maximumFractionDigits: Number(number.dataset.countDecimals || 0) }),
    frame: 0,
    state: 'waiting',
    container: number.classList.contains('graduate-number') ? number : number.closest('.education-hours-summary, .education-time-stages > li')
  }));
  const finishEducationCounter = counter => {
    cancelAnimationFrame(counter.frame);
    counter.number.textContent = counter.formatter.format(counter.target) + counter.suffix;
    counter.number.dataset.countState = 'complete';
    counter.state = 'complete';
    educationHoursObserver.unobserve(counter.container);
  };
  const startEducationCounter = counter => {
    counter.state = 'counting';
    counter.number.dataset.countState = 'counting';
    let startedAt;
    const tick = now => {
      if (startedAt === undefined) startedAt = now;
      const progress = Math.min((now - startedAt) / 2200, 1);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - ((-2 * progress + 2) ** 3) / 2;
      counter.number.textContent = counter.formatter.format(Number((counter.target * eased).toFixed(counter.decimals))) + counter.suffix;
      if (progress < 1) counter.frame = requestAnimationFrame(tick);
      else finishEducationCounter(counter);
    };
    counter.frame = requestAnimationFrame(tick);
  };
  const educationHoursObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const counter = educationHoursCounters.find(item => item.container === entry.target);
      if (!counter || counter.state === 'complete') continue;
      if (entry.isIntersecting && entry.intersectionRatio >= .25) {
        if (counter.state === 'waiting') {
          if (document.hidden) finishEducationCounter(counter);
          else startEducationCounter(counter);
        }
      } else if (counter.state === 'counting') {
        finishEducationCounter(counter);
      }
    }
  }, { rootMargin: '0px 0px -80px 0px', threshold: .25 });
  for (const counter of educationHoursCounters) {
    counter.number.textContent = '0';
    counter.number.dataset.countState = 'waiting';
    educationHoursObserver.observe(counter.container);
  }
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    for (const counter of educationHoursCounters) finishEducationCounter(counter);
    educationHoursObserver.disconnect();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    for (const counter of educationHoursCounters) {
      if (counter.state === 'counting') finishEducationCounter(counter);
    }
  });
}

/* 오른쪽 플로팅 목차는 화면 높이 40%를 지난 마지막 섹션을 표시한다. 이동 위치는 공통 scroll-margin을 따른다. */
(function(){
  var nav = document.querySelector('.school-about .sec-float'); if (!nav) return;
  var btns = [].slice.call(nav.querySelectorAll('.sf-btn'));
  var secs = btns.map(function(b){ return document.getElementById(b.dataset.jump); });
  var first = secs[0], raf;
  function set(id){ btns.forEach(function(b){ var on = b.dataset.jump === id; b.classList.toggle('is-active', on); if (on) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current'); }); }
  function calc(){
    var line = innerHeight * .4, id = btns[0].dataset.jump;
    secs.forEach(function(el, k){ if (el && el.getBoundingClientRect().top <= line) id = btns[k].dataset.jump; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) id = btns[btns.length - 1].dataset.jump;
    set(id);
    // 늘 보임(지원 전 체크와 같음). 첫 화면(어두운 히어로) 위에 있을 때는 흰색으로
    nav.classList.add('is-in');
    var r = nav.getBoundingClientRect(), mid = r.top + r.height / 2;
    nav.classList.toggle('on-dark', !!first && first.getBoundingClientRect().top > mid);
  }
  function onS(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(calc); }
  addEventListener('scroll', onS, { passive:true }); addEventListener('resize', onS);
  btns.forEach(function(b){ b.addEventListener('click', function(){
    var el = document.getElementById(b.dataset.jump); if (!el) return;
    if (location.hash === '#' + b.dataset.jump) el.scrollIntoView({ behavior:'smooth', block:'start' }); else location.hash = b.dataset.jump;
  }); });
  calc();
})();
})();
