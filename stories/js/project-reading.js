/* Display explicitly marked descriptions as a numbered list without editing data. */
(() => {
  'use strict';
  const seen = new WeakSet();
  function listItems(text) {
    // Preserve published • lists, including multiple bullets on the same line.
    if (/^\s*•\s*/.test(text) && !/^\s*(?:·|-\s+|\d+[.)]\s+)/m.test(text)) {
      return text.split(/\s*•\s*/).map(item => item.trim()).filter(Boolean);
    }
    // New markers start a line; punctuation inside a sentence is not a separator.
    const marker = /^\s*(?:[•·]\s*|-\s+|\d+[.)]\s+)/;
    const lines = text.trim().split(/\r?\n/);
    if (!marker.test(lines[0])) return [];
    const items = [];
    lines.forEach(line => {
      if (marker.test(line)) items.push(line.replace(marker, '').trim());
      else if (line.trim()) items[items.length - 1] += '\n' + line.trim();
    });
    return items.filter(Boolean);
  }
  function enhance() {
    document.querySelectorAll('.pjd p.pjph-t').forEach(paragraph => {
      if (seen.has(paragraph)) return;
      seen.add(paragraph);
      // Rich text stays intact; list text is always inserted through textContent.
      if (paragraph.children.length) return;
      const items = listItems(paragraph.textContent);
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
