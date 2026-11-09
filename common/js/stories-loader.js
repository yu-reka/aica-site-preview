/* API first, snapshot only on failure. Consumer scripts run in their original order. */
(function () {
  'use strict';
  var boot = document.currentScript, main;
  var status = window.AicaPublicContentStatus || (window.AicaPublicContentStatus = {});
  var HEADER_TIMEOUT_MS = 8000, BODY_TIMEOUT_MS = 30000;
  if (!boot) return;
  // The head script starts data before deferred common navigation. DOM work waits.
  var heightKey = 'aica:story-height:v1:' + boot.dataset.page + ':' + window.innerWidth;
  function prepareMain() {
    main = document.querySelector('.stories-page');
    if (!main) return;
    main.setAttribute('data-story-loading', '');
    main.setAttribute('aria-busy', 'true');
    // Cache only a layout measurement, scoped to this tab/page and viewport width.
    try {
      var savedHeight = Number(window.sessionStorage.getItem(heightKey));
      if (savedHeight >= 400 && savedHeight <= 20000) main.style.setProperty('--story-loading-height', savedHeight + 'px');
    } catch (_) {}
  }
  prepareMain();
  // The loading card reuses the error card's recovery action, without declaring a pending request failed.
  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-story-loading-retry]') && main?.hasAttribute('data-story-loading')) location.reload();
  });

  function valid(data) {
    return data && ['reviews', 'interviews', 'projects', 'cohorts'].every(function (key) { return Array.isArray(data[key]); });
  }
  function script(src) {
    return new Promise(function (resolve, reject) {
      SiteUI.loadScript(src, {async: false, onload: resolve,
        onerror: function () { reject(new Error('Story resource unavailable')); }});
    });
  }
  var ready = document.readyState === 'loading' ? new Promise(function (resolve) {
    document.addEventListener('DOMContentLoaded', function () { prepareMain(); resolve(); }, {once: true});
  }) : Promise.resolve();
  async function data() {
    var controller = new AbortController();
    var headerTimer = setTimeout(function () { controller.abort(); }, HEADER_TIMEOUT_MS), bodyTimer;
    try {
      var api = boot.dataset.api;
      // The admin preview replaces this URL with a full data: payload.
      if (api === '../api/public/stories') api += '/summary';
      var response = await fetch(api, {signal: controller.signal, credentials: 'same-origin', cache: 'no-cache'});
      clearTimeout(headerTimer);
      if (!response.ok) throw new Error('Story API unavailable');
      // Give slow valid bodies 30 seconds after headers, but never wait forever.
      bodyTimer = setTimeout(function () { controller.abort(); }, BODY_TIMEOUT_MS);
      var result = await response.json();
      clearTimeout(bodyTimer);
      if (!valid(result)) throw new Error('Invalid story response');
      window.STORIES_DATA = result;
      status.storiesApiFailed = false;
    } catch (_) {
      status.storiesApiFailed = true;
      window.STORIES_DATA = undefined;
      clearTimeout(headerTimer); clearTimeout(bodyTimer);
      // SiteUI and body belong to the deferred common scripts / parsed document.
      await ready;
      try { await script(boot.dataset.fallback); } catch (_) {}
      if (!valid(window.STORIES_DATA)) {
        window.STORIES_DATA = undefined;
        document.body.dataset.publicContentUnavailable = 'true';
      }
    } finally { clearTimeout(headerTimer); clearTimeout(bodyTimer); }
  }
  window.AicaStoryReady = (async function () {
    await Promise.all([ready, data()]);
    if (!main) return;
    var consumers = JSON.parse(boot.dataset.scripts || '[]');
    // async=false makes classic scripts execute in insertion order while their
    // downloads overlap. Data and common navigation are ready before insertion.
    await Promise.all(consumers.map(function (src) {
      return script(src).catch(function () { document.body.dataset.publicContentUnavailable = 'true'; });
    }));
    main.removeAttribute('data-story-loading');
    main.removeAttribute('aria-busy');
    main.style?.removeProperty('--story-loading-height');
    try {
      var finalHeight = Math.ceil(main.getBoundingClientRect().height);
      if (finalHeight >= 400 && finalHeight <= 20000) window.sessionStorage.setItem(heightKey, String(finalHeight));
    } catch (_) {}
  })();
})();
