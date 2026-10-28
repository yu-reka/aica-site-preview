/* Shared interaction contracts. No content or route ownership lives here. */
var SiteUI = (() => {
  function element(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function cloneWithoutIds(node) {
    if (!node) return null;
    const copy = node.cloneNode(true);
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
    return copy;
  }
  function toggleButton(group, text, active, action) {
    const button = element('button', '', text);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(active));
    button.addEventListener('click', action);
    group.appendChild(button);
    return button;
  }
  function buttonGroup(label, cls) {
    const group = element('div', cls);
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', label);
    return group;
  }
  const focusable = root => [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]')]
    .filter(el => el.tabIndex >= 0 && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert],[hidden]'));
  function trapFocus(event, dialog) {
    if (event.key !== 'Tab') return;
    const items = focusable(dialog);
    if (!items.length) { event.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1], at = document.activeElement;
    if (!items.includes(at) || (event.shiftKey ? at === first : at === last)) {
      event.preventDefault(); (event.shiftKey ? last : first).focus({ preventScroll: true });
    }
  }
  function createDialogScope() {
    let previous = [];
    const release = () => { previous.forEach(({ node, inert }) => { node.inert = inert; }); previous = []; };
    return { release, activate(dialog, keep = []) {
      release();
      for (let node = dialog; node && node !== document.body; node = node.parentElement) {
        for (const sibling of node.parentElement?.children || []) {
          if (sibling === node || /^(SCRIPT|STYLE|LINK)$/.test(sibling.tagName) || keep.includes(sibling)) continue;
          previous.push({ node: sibling, inert: sibling.inert }); sibling.inert = true;
        }
      }
    } };
  }
  function railState(track, tolerance = 4) {
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    return { max, atStart: track.scrollLeft <= tolerance, atEnd: track.scrollLeft >= max - tolerance };
  }
  function syncRail(track, previous, next) {
    const state = railState(track);
    previous.hidden = state.atStart; next.hidden = state.atEnd;
    return state;
  }
  function railKeys(event, move) {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.target.closest('input,select,textarea')) return;
    event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
  }
  function enhance(root = document) {
    const segments='.am-seg,.cm-seg,#siteLnb .lnb-list,.sm-dock .lnb-list,.lm-dock .lnb-list';
    const filters='#iv-all .iva-chips,.cv3-chips,.sm-filter-tabs:not(.sm-cohort-chips),.sm-cv-views,.lm-content .underline-tabs';
    for (const [selector, name] of [[segments,'ui-segment'],[filters,'ui-filter'],['.am-arrow,.sm-arrow,.lm-content .rail-arrow','ui-rail-arrow']]) {
      if(root.matches?.(selector))root.classList.add(name);
      root.querySelectorAll?.(selector).forEach(el=>el.classList.add(name));
    }
  }
  if(typeof MutationObserver !== 'undefined') {
    const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)enhance(node);})));
    observer.observe(document.documentElement,{childList:true,subtree:true});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>enhance());else enhance();
  }
  return { element, cloneWithoutIds, toggleButton, buttonGroup, enhance, focusable, trapFocus, createDialogScope, railState, syncRail, railKeys };
})();

/* Restore view choices only for a reload of this exact URL. Links and browser
   history continue to own page routing; no forms, dialogs or action buttons replay. */
(() => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  const key = 'aica.reload-view.v1';
  const choices = '[role="tablist"], [role="group"], .ui-filter, .ui-segment, .cpager, .pagination, .bx9-tw';
  const active = 'button[aria-selected="true"], button[aria-pressed="true"], button[aria-current]';
  const visible = node => !!node.getClientRects().length && !node.closest('[hidden],[inert],[role="dialog"],dialog');
  const available = node => visible(node) || (!node.closest('[hidden],[inert],[role="dialog"],dialog') && !!node.closest('details') && visible(node.closest('details')));
  const choice = node => node.matches(active) && node.closest(choices) && available(node);
  function path(node) {
    const parts = [];
    while (node && node.id !== 'main') {
      if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      const siblings = [...node.parentElement.children].filter(other => other.tagName === node.tagName);
      parts.unshift(node.tagName.toLowerCase() + ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')');
      node = node.parentElement;
    }
    return '#main ' + parts.join(' > ');
  }
  const identity = node => Object.entries(node.dataset).sort().map(([k,v]) => k + '=' + v).join('|') || node.textContent.trim().replace(/\s+/g, ' ');
  let saved;
  try {
    saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    sessionStorage.removeItem(key);
  } catch (_) { /* Storage may be disabled. */ }
  window.addEventListener('pagehide', () => {
    const root = document.getElementById('main');
    if (!root) return;
    const buttons = [...root.querySelectorAll(active)].filter(choice).map(node => ({ path:path(node), identity:identity(node) }));
    const inputs = [...root.querySelectorAll('input[type="radio"],input[type="checkbox"]')].filter(node => !node.closest('form,[role="dialog"],dialog')).map(node => ({path:path(node), checked:node.checked, type:node.type, name:node.name}));
    const toggles = [...root.querySelectorAll('.fs-tg[aria-expanded]')].filter(visible).map(node => ({path:path(node), expanded:node.getAttribute('aria-expanded')}));
    const details = [...root.querySelectorAll('details')].filter(node => visible(node) && !node.matches('.topic-picker')).map(node => ({path:path(node), open:node.open}));
    const rails = [...root.querySelectorAll('.rail,.photo-track')].filter(visible).map(node => ({path:path(node), left:node.scrollLeft}));
    try { sessionStorage.setItem(key, JSON.stringify({url:location.href, buttons, details, rails, toggles, inputs, y:scrollY})); } catch (_) { /* No persistence is required for navigation to work. */ }
  });
  // A back/forward-cache return is navigation, not a reload. Restore initial
  // choices rather than the cached filters; ordinary fresh navigation already
  // starts from those defaults.
  window.addEventListener('load', () => {
    const root=document.getElementById('main'); if (!root) return;
    const defaultDetails=[...root.querySelectorAll('details')].filter(node=>visible(node) && !node.matches('.topic-picker')).map(node=>({path:path(node),open:node.open}));
    const defaults=[...root.querySelectorAll(active)].filter(choice).map(node=>({path:path(node),identity:identity(node)}));
    const inputs=[...root.querySelectorAll('input[type="radio"],input[type="checkbox"]')].filter(node=>!node.closest('form,[role="dialog"],dialog')).map(node=>({path:path(node),checked:node.defaultChecked}));
    window.addEventListener('pageshow', event=>{
      if (!event.persisted) return;
      for(const item of defaultDetails){ const node=document.querySelector(item.path); if(node?.tagName==='DETAILS')node.open=item.open; }
      for(const item of defaults){ const node=document.querySelector(item.path); if(node && available(node) && identity(node)===item.identity && !node.matches(active))node.click(); }
      for(const item of inputs){ const node=document.querySelector(item.path); if(node && (item.checked || node.type==='checkbox') && node.checked!==item.checked)node.click(); }
    });
  }, {once:true});
  const navigation = performance.getEntriesByType?.('navigation')[0];
  if (navigation?.type !== 'reload' || saved?.url !== location.href || !Array.isArray(saved.buttons)) return;
  window.addEventListener('load', () => {
    let observer, frame, stopped = false;
    const stop = () => { stopped=true; observer?.disconnect(); if(frame)cancelAnimationFrame(frame); };
    const find = item => {
      if (typeof item.path !== 'string' || !item.path.startsWith('#main ')) return null;
      try { return document.querySelector(item.path); } catch (_) { return null; }
    };
    function restore() {
      frame = null;
      if (stopped) return;
      for (const item of saved.details || []) {
        const node=find(item);
        if (node?.tagName === 'DETAILS' && visible(node)) node.open=!!item.open;
      }
      for (const item of saved.inputs || []) {
        const node=find(item);
        if (node?.tagName === 'INPUT' && ['radio','checkbox'].includes(node.type) && node.type === item.type && node.name === item.name && (item.checked || node.type === 'checkbox') && !node.closest('form,[role="dialog"],dialog') && node.checked !== item.checked) node.click();
      }
      const pending = [];
      for (const item of saved.buttons) {
        const node = find(item);
        if (!node || !available(node) || !node.closest(choices) || node.tagName !== 'BUTTON' || identity(node) !== item.identity) { pending.push(item); continue; }
        if (!node.matches(active)) node.click();
      }
      saved.buttons = pending;
      for (const item of saved.toggles || []) {
        const node=find(item);
        if (node?.matches('.fs-tg[aria-expanded]') && visible(node) && node.getAttribute('aria-expanded') !== item.expanded) node.click();
      }
      for (const item of saved.rails || []) {
        const node=find(item);
        if (node && visible(node) && Number.isFinite(item.left)) node.scrollLeft=item.left;
      }
      if (Number.isFinite(saved.y)) window.scrollTo({top:saved.y,behavior:'instant'});
      if (!pending.length) stop();
    }
    // Public API rendering can finish after load. Retry missing controls when
    // markup arrives, but stop immediately when the visitor starts interacting.
    observer = new MutationObserver(() => { if (!frame && !stopped) frame=requestAnimationFrame(restore); });
    observer.observe(document.getElementById('main') || document.body, {childList:true,subtree:true});
    for (const event of ['pointerdown','keydown','hashchange']) window.addEventListener(event, stop, {once:true});
    setTimeout(stop, 5000);
    restore();
  }, {once:true});
})();
