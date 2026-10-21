/* Connection state and real full-page navigation. No simulated data requests. */
(() => {
  'use strict';
  const loading = document.createElement('div');
  loading.className = 'site-loading';
  loading.hidden = true;
  loading.setAttribute('role', 'status');
  loading.innerHTML = '<div class="site-loading__content"><h2>페이지를 불러오고 있어요.</h2><div class="site-loading__grid" aria-hidden="true">' +
    '<div class="site-loading__card"><i></i><b></b><span></span></div>'.repeat(3) + '</div><button type="button" hidden>화면으로 돌아가기</button></div>';
  const offline = document.createElement('dialog');
  offline.className = 'site-offline';
  offline.setAttribute('aria-labelledby', 'site-offline-title');
  offline.innerHTML = '<section class="site-offline__card"><div><p class="site-offline__kicker">연결을 다시 확인해 주세요</p><h2 id="site-offline-title">인터넷 연결이<br>잠시 끊겼어요.</h2><p class="site-offline__copy" role="status">Wi-Fi나 모바일 데이터 연결을 확인한 뒤<br>다시 시도해 주세요.</p><button type="button">연결 다시 확인 →</button><button type="button" class="site-offline__close">현재 화면 계속 보기</button></div><div class="site-offline__art" aria-hidden="true"><svg viewBox="0 0 160 160" fill="none" stroke="#14233F" stroke-width="7" stroke-linecap="round"><path d="M25 62q55-50 110 0M45 85q35-32 70 0M65 108q15-14 30 0"/><circle cx="80" cy="130" r="4" fill="#2457F5" stroke="none"/><path d="m32 25 100 115"/></svg><span>OFFLINE</span></div></section>';
  document.body.append(loading, offline);
  let delay, timeout, previousFocus, busy = false;
  function end() {
    clearTimeout(delay); clearTimeout(timeout); loading.hidden = true; busy = false;
  }
  function begin() {
    end(); busy = true;
    loading.querySelector('button').hidden = true;
    delay = setTimeout(() => { loading.hidden = false; }, 350);
    // A cancelled or stalled navigation must never trap the visitor.
    timeout = setTimeout(() => { loading.querySelector('button').hidden = false; }, 12000);
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
  loading.querySelector('button').addEventListener('click', end);
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
