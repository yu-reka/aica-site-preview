/* DOM-exact excerpt fitting shared by story cards; no data or route ownership. */
  // Preserve DOM line wrapping exactly, but flush layout once per search round
  // rather than once per card. Callers own visibility, sizing and invalidation.
function StoryTextFit(items) {
    items.forEach(item => item.write(item.source));
    let pending = items.filter(item => item.height() > item.allowed);
    pending.forEach(item => { item.characters = item.characters(); item.low = 0; item.high = item.characters.length; });
    const candidate = (item, count) => item.characters.slice(0, count).join('').trimEnd() + '⋯';
    while (pending.some(item => item.low < item.high)) {
      const searching = pending.filter(item => item.low < item.high);
      searching.forEach(item => { item.middle = Math.ceil((item.low + item.high) / 2); item.write(candidate(item, item.middle)); });
      searching.forEach(item => { if (item.height() <= item.allowed) item.low = item.middle; else item.high = item.middle - 1; });
    }
    pending.forEach(item => item.write(candidate(item, item.low)));
  }
