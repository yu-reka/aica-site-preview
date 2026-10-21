/* Shared interaction contracts. No content or route ownership lives here. */
var SiteUI = (() => {
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
  return { enhance, focusable, trapFocus, createDialogScope, railState, syncRail, railKeys };
})();
