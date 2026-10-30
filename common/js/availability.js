/* Connection state and real full-page navigation. No simulated data requests. */
(() => {
  'use strict';
  const loading = document.createElement('div');
  loading.className = 'site-loading';
  loading.hidden = true;
  loading.setAttribute('role', 'status');
  loading.innerHTML = '<div class="site-loading__content"><p class="site-loading__brand">광주인공지능사관학교</p><h2>페이지를 불러오고 있어요.</h2>' +
    '<p class="site-loading__copy">잠시만 기다려 주세요.</p><div class="site-loading__line" aria-hidden="true"><span></span></div></div>';
  const offline = document.createElement('dialog');
  offline.className = 'site-offline';
  offline.setAttribute('aria-labelledby', 'site-offline-title');
  offline.innerHTML = '<section class="site-offline__card"><div><p class="site-offline__kicker">연결을 다시 확인해 주세요</p><h2 id="site-offline-title">인터넷 연결이<br>잠시 끊겼어요.</h2><p class="site-offline__copy" role="status">Wi-Fi나 모바일 데이터 연결을 확인한 뒤<br>다시 시도해 주세요.</p><button type="button">연결 다시 확인 →</button><button type="button" class="site-offline__close">현재 화면 계속 보기</button></div><div class="site-offline__art" aria-hidden="true"><svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 240"><path d="M40 91c57-54 143-54 200 0M70 125c40-38 100-38 140 0m-105 34c21-21 49-21 70 0" fill="none" stroke="#14233F" stroke-width="13" stroke-linecap="round"/><circle cx="140" cy="194" r="10" fill="#2457F5"/><path d="M65 40l150 170" stroke="white" stroke-width="22" stroke-linecap="round"/><path d="M65 40l150 170" stroke="#2457F5" stroke-width="10" stroke-linecap="round"/></svg><span>OFFLINE</span></div></section>';
  document.body.append(loading, offline);
  let delay, timeout, previousFocus, busy = false;
  function end() {
    clearTimeout(delay); clearTimeout(timeout); loading.hidden = true; busy = false;
  }
  function begin() {
    end(); busy = true;
    delay = setTimeout(() => { loading.hidden = false; }, 350);
    // Release a stalled overlay without adding actions to the loading screen.
    timeout = setTimeout(end, 12000);
  }
  function showOffline() {
    end();
    if (offline.open) return;
    offline.querySelector('.site-offline__copy').textContent = 'Wi-Fi나 모바일 데이터 연결을 확인한 뒤 다시 시도해 주세요.';
    previousFocus = document.activeElement;
    offline.showModal();
  }
  function syncConnection() {
    if (!navigator.onLine) showOffline();
    else if (offline.open) {
      offline.querySelector('.site-offline__copy').textContent = '인터넷 연결이 돌아왔어요. 다시 시도해 주세요.';
    }
  }
  offline.querySelector('button').addEventListener('click', () => {
    if (navigator.onLine) location.reload();
    else offline.querySelector('.site-offline__copy').textContent = '아직 연결되지 않았어요. Wi-Fi나 모바일 데이터를 확인해 주세요.';
  });
  offline.querySelector('.site-offline__close').addEventListener('click', () => offline.close());
  offline.addEventListener('close', () => { if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true}); });
  addEventListener('offline', showOffline);
  addEventListener('online', syncConnection);
  addEventListener('pageshow', end);
  addEventListener('pagehide', end);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || link.hasAttribute('data-toast') || (link.target && link.target !== '_self')) return;
    const target = new URL(link.href, location.href);
    if (!/^https?:$/.test(target.protocol) || target.origin !== location.origin ||
        (target.pathname === location.pathname && target.search === location.search)) return;
    if (!navigator.onLine) { event.preventDefault(); showOffline(); return; }
    begin();
  });
  // An async controller can bracket its actual request using the same indicator.
  window.SiteAvailability = {begin, end, get busy(){ return busy; }};
  syncConnection();
})();
