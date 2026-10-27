/* Project demo view. No API/data mapping: a future integration supplies video[src]
   or source[src] in .pjhero. Empty previews never request an empty URL.
   2026-10-27 (user request): without a video address the preparation stage is the hero even when the
   project has photos or a thumbnail (they stay in the DOM, hidden). Heroes with a YouTube demo
   (data-pj-yt, stories-render.js pjVideo) are left alone. */
(() => {
  'use strict';
  const players = new Map();
  let active = null;
  const messages = {
    empty: '시연 영상을 준비하고 있어요.',
    loading: '시연 영상을 불러오고 있어요.',
    error: '영상을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.'
  };
  function sourceNodes(video) {
    return video ? [video, ...video.querySelectorAll('source')] : [];
  }
  function isCurrent(hero) {
    return hero.closest('.pjd')?.id === location.hash.slice(1) && !document.hidden;
  }
  function enhance(hero) {
    if (players.has(hero)) return;
    if (hero.getAttribute('data-pj-yt')) return;   // YouTube demo (stories-render.js pjVideo) owns this hero
    const existing = hero.querySelector('video');
    const video = existing || document.createElement('video');
    const stage = document.createElement('div');
    stage.className = 'pj-video-stage';
    const message = document.createElement('p');
    message.className = 'pj-video-message';
    message.setAttribute('role', 'status');
    const start = document.createElement('button');
    start.type = 'button'; start.className = 'pj-video-start';
    start.textContent = '영상 재생'; start.hidden = true;
    video.controls = true;
    video.playsInline = true;
    video.muted = true;
    video.defaultMuted = true;
    video.preload = 'none';
    video.setAttribute('aria-label', '프로젝트 시연 영상');
    stage.append(video, message, start);
    hero.insertBefore(stage, hero.firstChild);
    hero.classList.add('pj-video');
    const player = {video, stage, source: null, state: ''};
    players.set(hero, player);
    function state(value) {
      player.state = value;
      stage.dataset.state = value;
      message.textContent = messages[value] || '';
      message.hidden = !message.textContent;
      video.hidden = value === 'empty' || value === 'error';
      start.hidden = true;
    }
    player.setState = state;
    player.play = () => {
      if (!player.source || !isCurrent(hero) || player.state === 'error') return;
      const result = video.play();
      result?.catch(() => {
        if (!isCurrent(hero) || player.state === 'error') return;
        state('ready'); start.hidden = false;
      });
    };
    start.addEventListener('click', player.play);
    video.addEventListener('playing', () => {
      if (!isCurrent(hero)) { video.pause(); return; }
      state('ready');
    });
    video.addEventListener('waiting', () => { if (player.source && !video.paused) state('loading'); });
    video.addEventListener('loadeddata', () => { if (player.source && player.state !== 'error') state('ready'); });
    video.addEventListener('error', () => { if (player.source) state('error'); });
    state('empty');
  }
  function sync() {
    document.querySelectorAll('.pjd .pjhero').forEach(enhance);
    let next = null;
    players.forEach((player, hero) => {
      const {video} = player;
      if (!hero.isConnected) { video.pause(); players.delete(hero); return; }
      // Keep the existing shared URL validation at the display boundary.
      let invalid = false;
      sourceNodes(video).forEach(node => {
        const raw = node.getAttribute('src');
        if (raw && !window.AicaPublicContent?.url(raw, true)) {
          node.removeAttribute('src'); invalid = true;
        }
      });
      const source = video.getAttribute('src') || video.querySelector('source[src]')?.getAttribute('src') || '';
      if (source !== player.source || invalid) {
        video.pause(); player.source = source;
        player.setState(invalid ? 'error' : source ? 'loading' : 'empty');
        video.preload = isCurrent(hero) && source ? 'metadata' : 'none';
        if (source || invalid) video.load();
        if (active === player) active = null;
      }
      if (isCurrent(hero)) next = player;
      else video.pause();
    });
    if (next !== active) {
      active = next;
      if (active?.source) { active.video.preload = 'metadata'; active.play(); }
    }
  }
  sync();
  const main = document.querySelector('main');
  if (main) new MutationObserver(sync).observe(main, {childList:true, subtree:true, attributes:true, attributeFilter:['src']});
  addEventListener('hashchange', sync);
  addEventListener('pagehide', () => { players.forEach(player => player.video.pause()); active = null; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) players.forEach(player => player.video.pause());
  });
})();
