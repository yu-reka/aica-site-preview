import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRenderer, richText, safeUrl, youtubeId } from './template.mjs';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(readFileSync(join(root, file), 'utf8'));
function files(directory, extension) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path, extension) : path.endsWith(extension) ? [path] : [];
  });
}
function prepare(record) {
  if (Array.isArray(record)) return record.map(prepare);
  if (!record || typeof record !== 'object') return record;
  const output = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.endsWith('Html')) throw new Error(`Content cannot contain raw HTML: ${key}`);
    if (key.endsWith('RichText')) {
      output[key] = value;
      output[key.slice(0, -8) + 'Html'] = richText(value);
    } else {
      if (typeof value === 'string' && /(^href$|Href$|Url$|^url$|^home$|^page$|^image$|^thumbnail$|^heroImage$)/.test(key)) safeUrl(value);
      if (key === 'youtubeUrl') youtubeId(value);
      if (key === 'youtubeId' && !/^[A-Za-z0-9_-]{11}$/.test(value)) throw new Error('Invalid YouTube video ID');
      output[key] = prepare(value);
    }
  }
  return output;
}
// The cover (including a build-owned illustration) is the first album image.
export function validateCohortPhotos(record) {
  const sources = new Set((record.photos || []).map(photo => photo.src));
  if (record.thumbnail) sources.add(record.thumbnail);
  const count = sources.size + (record.thumbnail ? 0 : 1);
  if (count > 10) throw new Error(`Cohort post ${record.id}: photos must not exceed 10 including the cover (received ${count})`);
}
export function loadContent() {
  const presentation = readJson('src/presentation.json');
  const content = {};
  for (const file of files(join(root, 'content'), '.json')) {
    const domain = relative(join(root, 'content'), file).replaceAll('\\', '/').replace(/\.json$/, '');
    if (domain === 'site') { content.site = prepare(readJson('content/site.json')); continue; }
    const parts = domain.split('/');
    let parent = content;
    for (const part of parts.slice(0, -1)) parent = parent[part] ||= {};
    const key = parts.at(-1);
    const records = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(records)) throw new Error(`Content collection must be an array: ${domain}`);
    const ids = new Set();
    parent[key] = records.map(record => {
      if (!record.id || ids.has(record.id)) throw new Error(`Missing or duplicate ID in ${domain}: ${record.id}`);
      ids.add(record.id);
      if (domain === 'stories/cohorts') validateCohortPhotos(record);
      return { ...prepare(record), view: presentation[domain]?.[record.id] || {} };
    });
    parent[key + 'ById'] = Object.fromEntries(parent[key].map(record => [record.id, record]));
  }
  return deriveContent(content);
}
export function deriveContent(content) {
  const slots = readJson('src/slots.json');
  for (const [domain, fields] of [['facilities', ['floorKey', 'spaceKey']], ['housing', ['panelId', 'index']]]) {
    const records = content.life[domain];
    if (records.length !== slots[domain].length || slots[domain].some(slot => !records.some(record => record.id === slot.id && fields.every(field => record[field] === slot[field])))) {
      throw new Error(`Fixed design slots changed: ${domain}. Update controls and src/slots.json together.`);
    }
  }
  const galleryCategories = new Map(content.about.categories.map(category => [category.id, category]));
  for (const category of content.about.categories) { category.count = 0; category.selected = category === content.about.categories[0]; }
  for (const slide of content.about.gallery) {
    const category = galleryCategories.get(slide.category);
    if (!category) throw new Error(`Unknown gallery category: ${slide.category}`);
    category.count++;
  }
  content.check.checklistCount = content.check.checklist.length;
  content.check.faqCounts = Object.fromEntries(content.check.categories.map(category => [category.id, 0]));
  content.check.faqCounts.all = content.check.faq.length;
  for (const item of content.check.faq) {
    if (item.category === 'all' || !Object.hasOwn(content.check.faqCounts, item.category)) throw new Error(`Unknown FAQ category: ${item.category}`);
    content.check.faqCounts[item.category]++;
  }
  for (const category of content.check.categories) {
    category.count = content.check.faqCounts[category.id];
    category.selected = category.id === 'all';
  }
  content.life.foodCounts = { food: 0, cafe: 0 };
  for (const item of content.life.food) {
    if (!Object.hasOwn(content.life.foodCounts, item.type)) throw new Error(`Unknown food type: ${item.type}`);
    content.life.foodCounts[item.type]++;
  }
  content.life.facilityGroups = { floor1: [], floor23: [], floor8: [] };
  for (const item of content.life.facilities) {
    const group = content.life.facilityGroups['floor' + item.floorKey];
    if (!group) throw new Error(`Unknown facility floor: ${item.floorKey}`);
    group.push(item);
  }
  content.life.leisureGroups = { walk: [], near: [], far: [] };
  for (const item of content.life.leisure) {
    const group = content.life.leisureGroups[item.group];
    if (!group) throw new Error(`Unknown leisure group: ${item.group}`);
    group.push(item);
  }
  return content;
}
export function build() {
  const context = loadContent();
  const render = createRenderer(join(root, 'src/components'));
  const outputs = new Map();
  for (const file of files(join(root, 'src/pages'), '.html')) {
    const target = relative(join(root, 'src/pages'), file).replaceAll('\\', '/');
    const source = render(readFileSync(file, 'utf8').replaceAll('\r\n', '\n'), context);
    outputs.set(target, source.replace(/(<!doctype html>\n)/i, `$1<!-- Generated from src/pages/${target} and content/. Run npm run build. -->\n`));
  }
  if (context.site) {
    const json = value => JSON.stringify(value, null, 2).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
    outputs.set('common/js/menu.js', '// Generated from content/site.json. Run npm run build.\n' +
      `const SITE_HOME = ${json(context.site.home)};\n\nconst SITE_MENU = ${json(context.site.menu)};\n\nconst SITE_LINKS = ${json(context.site.links)};\n\nconst SITE_INFO = ${json(context.site.organization)};\n`);
  }
  return outputs;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    // Render everything before writing, so invalid data cannot leave a partial build.
    const outputs = build();
    const check = process.argv.includes('--check');
    const stale = [];
    for (const [path, source] of outputs) {
      const destination = join(root, path);
      if (check) {
        try { if (readFileSync(destination, 'utf8') !== source) stale.push(path); }
        catch { stale.push(path); }
      } else {
        mkdirSync(dirname(destination), { recursive: true });
        writeFileSync(destination, source);
      }
    }
    if (stale.length) throw new Error(`Generated files need npm run build:\n${stale.join('\n')}`);
    console.log(`${check ? 'Checked' : 'Built'} ${outputs.size} files.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
