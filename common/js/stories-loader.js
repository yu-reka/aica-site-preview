/* API first, snapshot only on failure. Consumer scripts run in their original order. */
(function () {
  'use strict';
  var boot = document.currentScript, main = document.querySelector('.stories-page');
  var status = window.AicaPublicContentStatus || (window.AicaPublicContentStatus = {});
  if (!boot || !main) return;
  main.setAttribute('data-story-loading', '');
  main.setAttribute('aria-busy', 'true');
  // Cache only a layout measurement, scoped to this tab/page and viewport width.
  // A cold visit uses CSS reservations; a blocked/full storage never delays data.
  var heightKey = 'aica:story-height:v1:' + boot.dataset.page + ':' + window.innerWidth;
  try {
    var savedHeight = Number(window.sessionStorage.getItem(heightKey));
    if (savedHeight >= 400 && savedHeight <= 20000) main.style.setProperty('--story-loading-height', savedHeight + 'px');
  } catch (_) {}

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
    document.addEventListener('DOMContentLoaded', resolve, {once: true});
  }) : Promise.resolve();
  async function data() {
    var controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, 8000);
    try {
      var response = await fetch(boot.dataset.api, {signal: controller.signal, credentials: 'same-origin', cache: 'no-cache'});
      if (!response.ok) throw new Error('Story API unavailable');
      var result = await response.json();
      if (!valid(result)) throw new Error('Invalid story response');
      window.STORIES_DATA = result;
      status.storiesApiFailed = false;
    } catch (_) {
      status.storiesApiFailed = true;
      window.STORIES_DATA = undefined;
      try { await script(boot.dataset.fallback); } catch (_) {}
      if (!valid(window.STORIES_DATA)) {
        window.STORIES_DATA = undefined;
        document.body.dataset.publicContentUnavailable = 'true';
      }
    } finally { clearTimeout(timer); }
  }
  window.AicaStoryReady = (async function () {
    await Promise.all([ready, data()]);
    var consumers = JSON.parse(boot.dataset.scripts || '[]');
    for (var src of consumers) {
      try { await script(src); }
      catch (_) { document.body.dataset.publicContentUnavailable = 'true'; }
    }
    main.removeAttribute('data-story-loading');
    main.removeAttribute('aria-busy');
    main.style?.removeProperty('--story-loading-height');
    try {
      var finalHeight = Math.ceil(main.getBoundingClientRect().height);
      if (finalHeight >= 400 && finalHeight <= 20000) window.sessionStorage.setItem(heightKey, String(finalHeight));
    } catch (_) {}
  })();
})();
