/* Mobile LIFE controller. Keep routes, state and event handling here;
   source content and generated markup belong to life-m-view.js. */
(() => {
  'use strict';
  const mobileWidth = matchMedia('(max-width:600px)');
  const desktopMap = document.querySelector('.housing-basemap[data-desktop-src]');
  const syncDesktopMap = () => {
    if (!mobileWidth.matches && desktopMap && !desktopMap.hasAttribute('href')) desktopMap.setAttribute('href', desktopMap.dataset.desktopSrc);
  };
  syncDesktopMap();
  mobileWidth.addEventListener('change', syncDesktopMap);
  let mounted = false;
  const mountMobile = () => {
  if (mounted || !mobileWidth.matches) return;
  mounted = true;
  const host = document.querySelector('#main');
  const template = document.createElement('template');
  template.innerHTML = host.innerHTML;
  const source = template.content;
  const state = {
    page: 'overview',
    chosenFloor: '1',
    chosenSpace: { '1': '0', '23': '0', '8': '0' },
    housingIndex: 0,
    foodType: 'food',
    foodGroup: 'all',
    foodPage: 1,
    culture: 'walk',
    departure: 0,
  };
  const view = LifeMobileView.create(source, state);
  const life = view.data;
  const main = document.createElement('div');
  main.className = 'lm-content';
  host.append(main);
  const { $, $$ } = SiteUI.selectors(main);
  const reduce = SiteUI.motion();
  const railObservers = [];
  document.addEventListener('click', event => {
    $$('.topic-picker[open]').forEach(picker => {
      if (!picker.contains(event.target)) picker.open = false;
    });
  });
  const cultureSheet = document.createElement('dialog');
  cultureSheet.className = 'lm-culture-sheet';
  cultureSheet.setAttribute('aria-labelledby', 'lm-culture-title');
  document.body.append(cultureSheet);
  let cultureOpener, cultureIndex=0, previousOverflow='';
  function closeCulture(){ if(cultureSheet.open) cultureSheet.close(); }
  cultureSheet.addEventListener('close', () => {
    document.body.style.overflow=previousOverflow;
    if(cultureOpener?.isConnected) cultureOpener.focus({preventScroll:true});
  });
  cultureSheet.addEventListener('click', event => {
    if(event.target===cultureSheet || event.target.closest('[data-culture-close]')) closeCulture();
    const button=event.target.closest('[data-culture-photo]');
    if(!button) return;
    const track=cultureSheet.querySelector('.culture-photos');
    const current=Math.round(track.scrollLeft/track.clientWidth);
    const next=(current+Number(button.dataset.culturePhoto)+track.children.length)%track.children.length;
    track.scrollTo({left:next*track.clientWidth,behavior:reduce.matches?'instant':'smooth'});
  });
  matchMedia('(max-width:600px)').addEventListener('change', closeCulture);
  function openCulture(button){
    cultureOpener=button; cultureIndex=Number(button.dataset.cultureOpen);
    cultureSheet.innerHTML=view.cultureDetail(cultureIndex);
    const track=cultureSheet.querySelector('.culture-photos');
    track.addEventListener('scroll',()=>{
      const photo=life.culture[cultureIndex].photos[Math.round(track.scrollLeft/track.clientWidth)];
      cultureSheet.querySelector('.culture-photo-caption').textContent=photo?.caption||'';
    },{passive:true});
    previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    cultureSheet.showModal();
  }
  const aliases = { home: 'overview', facility: 'facilities', way: 'directions' };
  const paneRoutes = { home: 'overview', facility: 'facilities', tips: 'tips', way: 'directions' };

  function render() {
    closeCulture();
    railObservers.forEach(observer => observer.disconnect());
    railObservers.length = 0;
    const raw = Site.decodeHash(location.hash.slice(1));
    const target = source.querySelector('[id="' + CSS.escape(raw) + '"]');
    const topic = target?.closest('.tp-sec')?.id;
    const pane = target?.closest('.page')?.dataset.page;
    const next = topic || aliases[raw] || (view.screens[raw] ? raw : paneRoutes[pane]);
    // Contact, privacy and skip-link anchors preserve the current LIFE screen.
    if (!next && raw && main.childElementCount) return;
    const destination = next || paneRoutes[host.querySelector(':scope>.page:not([hidden])')?.dataset.page] || 'overview';
    if (destination !== state.page) {
      if (state.page === 'tp-food') { state.foodType='food'; state.foodGroup='all'; state.foodPage=1; }
      if (state.page === 'tp-fun') state.culture='walk';
      if (state.page === 'tp-house') state.housingIndex=0;
      if (state.page === 'directions') state.departure=0;
      if (state.page === 'facilities') { state.chosenFloor='1'; state.chosenSpace={ '1':'0','23':'0','8':'0' }; }
    }
    state.page = destination;
    const facility = target?.closest('.bx9-s');
    if (facility) {
      state.chosenFloor = facility.closest('.bx9-g').dataset.g;
      state.chosenSpace[state.chosenFloor] = facility.id.split('-').pop();
    }
    const area = target?.closest('.hzr');
    if (area) state.housingIndex = +area.dataset.i;

    main.innerHTML = view.screens[state.page]();
    main.dataset.screen = state.page;
    wireRails();
    wireFacilities();
    if (state.page === 'tp-fun') fitCultureExcerpts();
    if (state.page === 'tp-house') wireHousing();
    if (state.page === 'tp-food') renderFood();
    syncNav();
    // The original body remains available until rendering and binding succeed.
    host.classList.add('lm-ready');
  }

  // CSS line-clamp supplies a baseline ellipsis; fit the two-line preview with ⋯ instead.
  // Only the list preview is shortened. The detail sheet keeps the complete description.
  function fitCultureExcerpts() {
    const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ko', {granularity:'grapheme'}) : null;
    $$('.culture-row small').forEach(element => {
      const source = element.textContent;
      const characters = segmenter ? Array.from(segmenter.segment(source), part => part.segment) : Array.from(source);
      const copy = document.createElement('span');
      copy.textContent = source;
      element.replaceChildren(copy);
      let previousKey = '';
      const fit = () => {
        if (!element.isConnected || !element.clientWidth) return;
        const style = getComputedStyle(element);
        const key = [element.clientWidth, style.font, style.letterSpacing].join('|');
        if (key === previousKey) return;
        previousKey = key;
        const allowed = parseFloat(style.lineHeight) * 2;
        copy.textContent = source;
        if (copy.offsetHeight <= allowed + .5) return;
        let low = 0, high = characters.length;
        while (low < high) {
          const middle = Math.ceil((low + high) / 2);
          copy.textContent = characters.slice(0, middle).join('').trimEnd() + '⋯';
          if (copy.offsetHeight <= allowed + .5) low = middle;
          else high = middle - 1;
        }
        copy.textContent = characters.slice(0, low).join('').trimEnd() + '⋯';
      };
      const observer = new ResizeObserver(fit);
      observer.observe(element);
      railObservers.push(observer);
      document.fonts.ready.then(() => { previousKey = ''; fit(); });
      fit();
    });
  }

  function wireRails() {
    $$('.rail-wrap').forEach(wrapper => {
      const track = $('.rail', wrapper);
      const previous = $('.previous', wrapper);
      const next = $('.next', wrapper);
      const sync = () => {
        previous.hidden = next.hidden = track.children.length < 2;
      };
      const move = direction => {
        const items = [...track.children];
        if (!items.length) return;
        const positions = items.map(item => item.offsetLeft - items[0].offsetLeft);
        const current = positions.reduce((best, left, index) =>
          Math.abs(left - track.scrollLeft) < Math.abs(positions[best] - track.scrollLeft) ? index : best, 0);
        const target = (current + direction + items.length) % items.length;
        const max = Math.max(0, track.scrollWidth - track.clientWidth);
        track.scrollTo({ left: Math.min(max, positions[target]), behavior: reduce.matches ? 'auto' : 'smooth' });
      };
      track.addEventListener('keydown', event => { if(event.target===track) SiteUI.railKeys(event, move); });
      previous.onclick = () => move(-1);
      next.onclick = () => move(1);
      track.addEventListener('scroll', sync, { passive: true });
      const observer = new ResizeObserver(sync);
      observer.observe(track);
      railObservers.push(observer);
      sync();
    });
  }

  function wireFacilities() {
    $$('.floor-card').forEach(card => card.addEventListener('toggle', () => {
      if (!card.open) return;
      state.chosenFloor = card.dataset.floor;
      $$('.floor-card').forEach(other => { if (other !== card) other.open = false; });
    }));
    $$('.photo-gallery').forEach(gallery => {
      const track = $('.photo-track', gallery);
      const space = gallery.closest('.space-view'), title = $('.space-name', space), notes = $('.notes', space);
      const baseTitle = title.textContent, baseNotes = notes.cloneNode(true);
      const move = direction => {
        const count = track.children.length;
        if (!count) return;
        const index = Math.round(track.scrollLeft / track.clientWidth) || 0;
        const next = (index + direction + count) % count;
        track.scrollTo({ left: next * track.clientWidth, behavior: reduce.matches ? 'auto' : 'smooth' });
      };
      $('.photo-prev', gallery).onclick = () => move(-1);
      $('.photo-next', gallery).onclick = () => move(1);
      const sync = () => {
        const index = Math.round(track.scrollLeft / track.clientWidth) || 0;
        $('.photo-caption [hidden]', gallery).textContent = track.children[index].getAttribute('aria-label') + ' ';
        $('.photo-caption b', gallery).textContent = (index + 1) + '/' + track.children.length;
        const photo = track.children[index];
        title.textContent = photo.dataset.infoTitle || baseTitle;
        if (photo.dataset.infoNote) {
          const note = document.createElement('li'), text = document.createElement('span');
          text.className = 'space-note-text'; text.textContent = photo.dataset.infoNote;
          note.append(baseNotes.querySelector('.space-note-icon').cloneNode(true), text); notes.replaceChildren(note);
        } else { notes.replaceChildren(...[...baseNotes.childNodes].map(node => node.cloneNode(true))); }
      };
      track.addEventListener('scroll', sync, { passive: true });
      sync();
    });
  }

  function wireHousing() {
    const select = index => {
      state.housingIndex = index;
      $$('[data-area]').forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.area === index)));
      $$('.hzmap-d').forEach(pin => {
        pin.classList.toggle('on', +pin.dataset.i === index);
        pin.setAttribute('aria-pressed', String(+pin.dataset.i === index));
      });
    };
    $$('[data-area]').forEach(button => { button.onclick = () => select(+button.dataset.area); });
    $$('.hzmap-d').forEach(pin => {
      const choose = () => {
        select(+pin.dataset.i);
        $(`[data-area="${pin.dataset.i}"]`)?.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
      };
      pin.onclick = choose;
      pin.onkeydown = event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          choose();
        }
      };
    });
    select(state.housingIndex);
  }

  function renderFood() {
    const matches = life.food.filter(food => food.type === state.foodType &&
      (state.foodGroup === 'all' || food.group === state.foodGroup));
    const pages = Math.max(1, Math.ceil(matches.length / 8));
    state.foodPage = Math.min(state.foodPage, pages);
    $('#food-count').textContent = matches.length + '곳';
    $('#food-results').innerHTML = view.foodResults(matches);
    $('.pagination').innerHTML = view.foodPagination(pages);
    $$('[data-kind]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.kind === state.foodType)));
    $$('[data-food-group]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.foodGroup === state.foodGroup));
      if (button.dataset.foodGroup === 'solo') button.textContent = state.foodType === 'cafe' ? '혼자' : '혼밥';
    });
  }

  function handleClick(event) {
    const button = event.target.closest('button');
    const facility = event.target.closest('[data-fac]');
    if (facility) {
      const [floor, space] = facility.dataset.fac.split('-');
      state.chosenFloor = floor;
      state.chosenSpace[floor] = space;
      if (state.page === 'facilities') render();
    }
    if (!button) return;
    if (button.hasAttribute('data-culture-open')) { openCulture(button); return; }
    if (button.dataset.spaceSelect) {
      const card = button.closest('.floor-card');
      state.chosenSpace[card.dataset.floor] = button.dataset.spaceSelect;
      $$('[data-space-select]', card).forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      $$('.space-view', card).forEach(space => { space.hidden = space.dataset.space !== button.dataset.spaceSelect; });
    }
    if (button.dataset.kind) { state.foodType = button.dataset.kind; state.foodPage = 1; renderFood(); }
    if (button.dataset.foodGroup) { state.foodGroup = button.dataset.foodGroup; state.foodPage = 1; renderFood(); }
    if (button.dataset.foodPage) {
      state.foodPage = +button.dataset.foodPage;
      renderFood();
      $('.food-kind [aria-pressed=true]').focus({ preventScroll: true });
      $('.food-kind').scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' });
    }
    if (button.hasAttribute('data-reset-food')) { state.foodGroup = 'all'; state.foodPage = 1; renderFood(); }
    if (button.dataset.culture) {
      state.culture = button.dataset.culture;
      $$('[data-culture]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      $$('[data-culture-group]').forEach(group => { group.hidden = group.dataset.cultureGroup !== state.culture; });
    }
    if (button.dataset.departure) {
      state.departure = +button.dataset.departure;
      $$('[data-departure]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      $('#route-content').innerHTML = view.routeCard();
    }
    if (button.classList.contains('copy-address')) copyAddress();
  }

  async function copyAddress() {
    const address = view.text('.ad>div>b');
    try { await navigator.clipboard.writeText(address); Site.toast('주소가 복사되었습니다.'); }
    catch { Site.toast(address); }
  }
  main.addEventListener('click', handleClick);

  const nav = document.querySelector('#siteLnb');
  if (nav) nav.querySelectorAll('.lnb-list>li>a').forEach(link => {
    const full = document.createElement('span');
    full.className = 'lm-nav-full'; full.textContent = link.textContent;
    const short = document.createElement('span');
    short.className = 'lm-nav-short';
    short.textContent = ({ overview: '전체', facilities: '시설', tips: '생활 꿀팁', directions: '오시는 길' })[link.dataset.sub] || link.textContent;
    link.replaceChildren(full, short);
  });
  const dock = document.createElement('nav');
  dock.className = 'lm-dock';
  dock.setAttribute('aria-label', '인사교 라이프 빠른 이동');
  if (nav) { dock.append(nav.querySelector('.lnb-list').cloneNode(true)); document.body.append(dock); }

  // These pills switch complete mobile views, rather than scroll to the hidden
  // desktop anchors. Handle both menus before the shared document link handler.
  function navigatePill(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        !matchMedia('(max-width:600px)').matches || !host.classList.contains('lm-ready')) return;
    const link = event.target.closest('.lnb-list>li>a[href]');
    if (!link || !['#overview', '#facilities', '#tips', '#directions'].includes(link.hash)) return;
    event.preventDefault();
    if (link.hash !== location.hash) {
      const oldURL = location.href;
      history.pushState(null, '', link.href);
      // Run the existing route/state reset/nav sync in this click, without the
      // browser's smooth anchor scroll or an extra asynchronous hash navigation.
      dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL: location.href }));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    const heading = $('h2');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }
  nav?.addEventListener('click', navigatePill);
  dock.addEventListener('click', navigatePill);

  function syncNav() {
    const group = state.page.startsWith('tp-') ? 'tips' : state.page;
    [nav, dock].filter(Boolean).forEach(menu => menu.querySelectorAll('.lnb-list>li>a').forEach(link => {
      const id = link.hash.slice(1);
      const selected = (id === 'overview' && group === 'overview') || id === group;
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }));
  }
  if (nav) {
    const observer = new IntersectionObserver(entries => {
      document.body.classList.toggle('lm-docked', !entries[0].isIntersecting && nav.getBoundingClientRect().top < 0);
    }, { rootMargin: '-60px 0px 0px 0px' });
    observer.observe(nav);
  }
  addEventListener('hashchange', render);
  render();
  };
  mobileWidth.addEventListener('change', mountMobile);
  mountMobile();
})();
