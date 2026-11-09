/* Mount a story when its hash opens. Summary responses fetch each article once per page. */
const StoryDetails = (() => {
  const records = new Map();
  const groups = new Map();
  const articles = new Map();
  const summary = () => window.STORIES_DATA?.view === 'summary';
  let active;

  function load(anchor, type) {
    const cached = articles.get(anchor);
    if (cached) return cached;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const request = fetch('../api/public/stories/posts/' + encodeURIComponent(anchor), {
      credentials:'same-origin', cache:'no-cache', signal:controller.signal
    }).then(async response => {
      if (response.status === 404) throw Object.assign(new Error('Story not found'), {missing:true});
      if (!response.ok) throw new Error('Story unavailable');
      const data = await response.json();
      if (data?.type !== type || data.item?.anchor !== anchor) throw new Error('Invalid story response');
      return data.item;
    }).catch(error => {
      articles.delete(anchor);
      throw error;
    }).finally(() => clearTimeout(timer));
    articles.set(anchor, request);
    return request;
  }

  function status(host, state, retry) {
    const copy = {
      loading:['불러오는 중', '글을 불러오고 있어요.', '잠시만 기다려 주세요.'],
      missing:['미게시 또는 삭제', '글을 찾을 수 없어요.', '목록으로 돌아가 다른 이야기를 볼 수 있어요.'],
      error:['불러오기 실패', '글을 불러오지 못했어요.', '연결 상태를 확인하고 다시 시도해 주세요.']
    }[state];
    const card = document.createElement('div');
    card.className = 'aica-state aica-state--compact';
    card.setAttribute('role', 'status');
    [['span','badge'],['p','title'],['p','copy']].forEach(([tag, name], index) => {
      const node = document.createElement(tag);
      node.className = 'aica-state__' + name;
      node.textContent = copy[index];
      card.append(node);
    });
    if (retry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'aica-state__action';
      button.textContent = '다시 시도';
      button.addEventListener('click', retry);
      card.append(button);
    }
    host.replaceChildren(card);
  }
  function canonical(hash) {
    return window.AicaPublicContent?.legacyHash(hash, id => records.has(id) || document.getElementById(id)) || hash;
  }
  function find(hash) {
    const anchor = Site.decodeHash(hash.slice(1));
    const item = records.get(anchor);
    if (item) return item;
    const question = /^q-(iv-p(?:\d+|new))-(\d+)$/.exec(anchor);
    if (!question) {
      const placeholder = /^q-(honors-\d+)-(\d+)$/.exec(anchor);
      const item = placeholder && records.get('iv-' + placeholder[1]);
      const number = placeholder && Number(placeholder[2]);
      return number > 0 && number <= item?.record.questionCount ? item : undefined;
    }
    const article = records.get(question[1]);
    const number = Number(question[2]);
    if (!article || number < 1) return undefined;
    const questionCount = summary() ? article.questionCount : (article.record.qa?.length || 0);
    return questionCount === undefined || number <= questionCount ? article : undefined;
  }
  function scrollToQuestion(detail) {
    if (!location.hash.startsWith('#q-')) return;
    const target = document.getElementById(Site.decodeHash(location.hash.slice(1)));
    if (target && detail.contains(target)) requestAnimationFrame(() => {
      if (find(canonical(location.hash))?.anchor === detail.id) target.scrollIntoView({block:'start'});
    });
  }
  function reportShown(detail) {
    document.dispatchEvent(new CustomEvent('stories:detail-shown', {detail}));
  }
  function hydrate(item, detail) {
    const host = detail.querySelector('[data-story-detail-status]');
    const retryFocused = host.contains(document.activeElement);
    status(host, 'loading');
    if (retryFocused) {
      host.tabIndex = -1;
      host.focus({preventScroll:true});
    }
    load(item.anchor, item.type).then(raw => {
      const focused = detail.contains(document.activeElement);
      const article = item.normalize(raw, item.record);
      if (item.type === 'interviews') item.questionCount = article.qa?.length || 0;
      const template = document.createElement('template');
      template.innerHTML = item.render(article, item.index);
      const rendered = template.content.firstElementChild;
      detail.className = rendered.className;
      detail.style.cssText = rendered.style.cssText;
      detail.replaceChildren(...rendered.childNodes);
      item.ready = true;
      document.dispatchEvent(new CustomEvent('stories:detail-created', {detail}));
      if (find(canonical(location.hash))?.anchor !== item.anchor) {
        if (active === detail) sync();
        return;
      }
      if (focused) {
        const review = detail.matches('.ov');
        const hub = review && detail.closest('.stories-hub');
        const target = detail.querySelector(hub ? '.mtop h3' : review ? '.x' : 'h2');
        if (target?.matches('h2, h3')) target.tabIndex = -1;
        target?.focus({preventScroll:true});
      }
      scrollToQuestion(detail);
      reportShown(detail);
    }).catch(error => {
      status(host, error.missing ? 'missing' : 'error', error.missing ? undefined : () => hydrate(item, detail));
      if (document.activeElement === host) (host.querySelector('button') || host).focus({preventScroll:true});
    });
  }
  function ensure(item) {
    if (!item) return null;
    const existing = document.getElementById(item.anchor);
    if (existing) return existing;
    const pending = summary() && item.type;
    const view = item.render(item.record, item.index, pending);
    if (typeof view === 'string') item.host.insertAdjacentHTML(item.position, view);
    else item.host.insertAdjacentElement(item.position, view);
    const detail = document.getElementById(item.anchor);
    if (detail) {
      if (pending) hydrate(item, detail);
      else {
        item.ready = true;
        document.dispatchEvent(new CustomEvent('stories:detail-created', {detail}));
      }
    }
    return detail;
  }
  function sync() {
    const hash = canonical(location.hash);
    const item = find(hash);
    const existing = item && document.getElementById(item.anchor);
    const next = ensure(item);
    if (active !== next) {
      active?.removeAttribute('data-story-active');
      active = next;
      active?.setAttribute('data-story-active', '');
    }
    if (hash !== location.hash) { location.replace(hash); return; }
    // A late-mounted question did not exist during the browser's fragment scroll.
    if (next && !existing) scrollToQuestion(next);
    if (next && item.ready) reportShown(next);
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const link = event.target.closest?.('a[href^="#"]');
    if (link) ensure(find(canonical(link.hash)));
  }, true);
  addEventListener('hashchange', sync);
  return {
    register(kind, items, host, position, render, type, normalize) {
      if (!host) return;
      const group = items.map((record,index) => ({
        anchor:record.anchor, title:String(record.title || '').trim(), record, index, host, position, render, type, normalize
      }));
      group.forEach(item => records.set(item.anchor,item));
      groups.set(kind,group);
    },
    entries:kind => groups.get(kind),
    canonical, sync, load, status
  };
})();
