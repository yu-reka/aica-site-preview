/* 알아보기 프로젝트 구역: 제목이 보이면 한 번 축하 효과를 내고, 이전 기수 프로젝트 영상을 같은 자리에서 재생한다. about-gallery.js 다음에 실행된다. */
(() => {
'use strict';

const reducedMotion = SiteUI.motion();

// Celebrate the project section once when its heading enters the viewport.
(() => {
  const section = document.querySelector('.activity-projects');
  const heading = section?.querySelector('.activity-projects-heading');
  if (!heading || !('IntersectionObserver' in window)) return;
  if (reducedMotion.matches) return;
  let headingVisible = false;
  let started = false;
  let finishedParticles = 0;
  const particleCount = section.querySelectorAll('.activity-project-particle').length;
  section.dataset.confetti = 'waiting';
  const settle = () => {
    section.dataset.confetti = 'complete';
    observer.disconnect();
    section.removeEventListener('animationend', onParticleFinished);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.removeEventListener('change', onMotionPreference);
  };
  const begin = () => {
    if (started || !headingVisible || document.hidden) return;
    started = true;
    section.dataset.confetti = 'burst';
    observer.disconnect();
  };
  const onParticleFinished = event => {
    if (event.animationName !== 'activity-project-confetti-burst') return;
    if (++finishedParticles >= particleCount) settle();
  };
  const onVisibilityChange = () => {
    if (document.hidden && started) settle();
    else begin();
  };
  const onMotionPreference = event => {
    if (event.matches) settle();
  };
  const observer = new IntersectionObserver(entries => {
    headingVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= .45;
    begin();
  }, { threshold: .45, rootMargin: '0px 0px -60px 0px' });
  section.addEventListener('animationend', onParticleFinished);
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotion.addEventListener('change', onMotionPreference);
  observer.observe(heading);
})();

// 이전 기수 프로젝트 영상은 미리보기를 누르면 같은 자리에서 재생한다.
// 파일(file://)로 열 때도 같은 동작. 유튜브가 파일 페이지 삽입을 막으면 영상 안에 오류가 보일 수 있어, 아래에 '유튜브에서 보기' 링크를 함께 둠.
(() => {
  // Removing the previous iframe stops playback without depending on the
  // cross-origin player's API. Keep its original poster so it can be replayed.
  let restoreActiveVideo;
  function stopActiveVideo() {
    if (restoreActiveVideo) restoreActiveVideo();
    restoreActiveVideo = null;
  }
  document.querySelectorAll('.activity-project-player').forEach(container => {
    const frame = container.querySelector('iframe');
    if (!frame) return;
    const videoId = new URL(frame.src).pathname.split('/').pop();
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return;
    const title = frame.title;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'activity-project-file-video';
    btn.setAttribute('aria-label', title + ' 재생');
    const poster = document.createElement('img');
    poster.src = 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
    poster.alt = ''; poster.loading = 'lazy'; poster.decoding = 'async';
    const play = document.createElement('span');
    play.className = 'activity-project-file-play';
    play.setAttribute('aria-hidden', 'true');
    btn.append(poster, play);
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      var org = /^https?:/.test(location.protocol) ? '&origin=' + encodeURIComponent(location.origin) + '&widget_referrer=' + encodeURIComponent(location.href.split('#')[0]) : '';
      f.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0&playsinline=1&hl=ko&enablejsapi=0' + org;
      f.title = title;
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.className = 'activity-project-inline-frame';
      stopActiveVideo();
      container.replaceChildren(f);
      restoreActiveVideo = () => container.replaceChildren(btn);
      f.focus();
    });
    container.replaceChildren(btn);
  });

  // The daily-routine documentary shares the same single-player policy.
  const box = document.querySelector('.drv-video--yt[data-yt]');
  if (!box) return;
  const id = box.dataset.yt;
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return;
  const poster = box.querySelector('.drv-poster');
  if (poster) poster.addEventListener('error', () => { poster.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }, { once: true });
  box.addEventListener('click', () => {
    const org = /^https?:/.test(location.protocol) ? '&origin=' + encodeURIComponent(location.origin) : '';
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1&hl=ko' + org;
    f.title = box.getAttribute('aria-label').replace(/ 재생$/, '');
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    const wrap = document.createElement('div');
    wrap.className = 'drv-video is-playing';
    wrap.append(f);
    stopActiveVideo();
    box.replaceWith(wrap);
    restoreActiveVideo = () => wrap.replaceWith(box);
    f.focus();
  });
})();
})();
