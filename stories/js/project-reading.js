/* Display existing bullet-separated descriptions as a numbered list without editing data. */
(() => {
  'use strict';
  const seen = new WeakSet();
  function enhance() {
    document.querySelectorAll('.pjd p.pjph-t').forEach(paragraph => {
      if (seen.has(paragraph)) return;
      seen.add(paragraph);
      // Only plain text with an explicit leading bullet is a list. Rich text stays intact.
      if (paragraph.children.length || !/^\s*•\s*/.test(paragraph.textContent)) return;
      const items = paragraph.textContent.split(/\s*•\s*/).map(text => text.trim()).filter(Boolean);
      if (items.length < 2) return;
      const block = document.createElement('div');
      [...paragraph.attributes].forEach(attribute => block.setAttribute(attribute.name, attribute.value));
      const list = document.createElement('ol');
      list.className = 'pj-feature-list';
      items.forEach(text => {
        const item = document.createElement('li');
        item.textContent = text;
        list.append(item);
      });
      block.append(list);
      paragraph.replaceWith(block);
    });
  }
  enhance();
  const main = document.querySelector('main');
  if (main) new MutationObserver(enhance).observe(main, {childList:true, subtree:true});
})();
