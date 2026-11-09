/* FAQ JSON is independent of deferred navigation and page scripts. */
(function () {
  'use strict';
  var boot = document.currentScript;
  if (!boot || !document.querySelector('.check-page')) return;
  var ready = document.readyState === 'loading' ? new Promise(function (resolve) {
    document.addEventListener('DOMContentLoaded', resolve, {once: true});
  }) : Promise.resolve();
  function valid(value) { return value && Array.isArray(value.items); }
  function script(src) {
    return new Promise(function (resolve, reject) {
      SiteUI.loadScript(src, {async: false, onload: resolve,
        onerror: function () { reject(new Error('FAQ resource unavailable')); }});
    });
  }
  async function data() {
    var controller = new AbortController();
    // FAQ has a bounded wait before its small local snapshot becomes usable.
    var timer = setTimeout(function () { controller.abort(); }, 8000);
    try {
      var response = await fetch(boot.dataset.api, {signal: controller.signal, credentials: 'same-origin', cache: 'no-cache'});
      if (!response.ok) throw new Error('FAQ API unavailable');
      var result = await response.json();
      if (!valid(result)) throw new Error('Invalid FAQ response');
      window.FAQ_DATA = result;
    } catch (_) {
      window.FAQ_DATA = undefined;
      try { await script(boot.dataset.fallback); } catch (_) {}
      if (!valid(window.FAQ_DATA)) window.FAQ_DATA = undefined;
    } finally { clearTimeout(timer); }
  }
  window.AicaFaqReady = (async function () {
    await Promise.all([ready, data()]);
    try { await script(boot.dataset.renderer); } catch (_) {}
  })();
})();
