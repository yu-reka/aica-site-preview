/* Keep the browser title in sync with the story, including question and section anchors. */
(function () {
  'use strict';
  var listTitle = document.title;
  function syncTitle() {
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); }
    catch (_) { id = ''; }
    var target = document.getElementById(id);
    var detail = target && target.closest('.ivd, .pjd, .ov');
    var heading = detail && detail.querySelector(detail.matches('.ov') ? '.mtop h3' : 'h2');
    var title = heading && heading.textContent.trim();
    document.title = title ? title + ' — ' + listTitle : listTitle;
  }
  addEventListener('hashchange', syncTitle);
  addEventListener('pageshow', syncTitle);
  syncTitle();
})();
