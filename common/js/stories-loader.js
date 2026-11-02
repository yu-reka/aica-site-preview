/* API first, snapshot only on failure. Consumer scripts run in their original order. */
(function () {
  'use strict';
  var boot = document.currentScript, main = document.querySelector('.stories-page');
  var status = window.AicaPublicContentStatus || (window.AicaPublicContentStatus = {});
  if (!boot || !main) return;
  main.setAttribute('data-story-loading', '');
  main.setAttribute('aria-busy', 'true');
  function valid(data) {
    return data && ['reviews', 'interviews', 'projects', 'cohorts'].every(function (key) { return Array.isArray(data[key]); });
  }
  function script(src) {
    return new Promise(function (resolve, reject) {
      var element = document.createElement('script');
      element.src = src; element.async = false;
      element.onload = resolve;
      element.onerror = function () { reject(new Error('Story resource unavailable')); };
      document.head.appendChild(element);
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
  })();
})();
