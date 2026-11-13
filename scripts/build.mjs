import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRenderer, prepare } from './template.mjs';
import { connectBackoffice } from './backoffice-site.mjs';
import { assetVersions, generatedScripts, LOADER_TOKENS } from './asset-versions.mjs';
import { readText } from './text.mjs';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(readFileSync(join(root, file), 'utf8'));
function files(directory, extension) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path, extension) : path.endsWith(extension) ? [path] : [];
  });
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
  const content = { v: assetVersions };
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
  // Culture photos list their smaller copies (long edge 640 · 1280, beside the photo) in srcset; the backoffice writes the same markup (LifeCultureService).
  // The square card crops a landscape photo to its height, so sizes asks for the box width times the photo's width/height.
  const cultureSizes = [640, 1280];
  for (const group of content.life.culture) {
    group.photos.forEach((photo, index) => {
      const edge = Math.max(photo.width, photo.height), wide = Math.max(1, photo.width / photo.height);
      const copies = cultureSizes.filter(size => size < edge)
        .map(size => [photo.image.replace(/(\.[a-z]+)$/, `-${size}$1`), Math.round(photo.width * size / edge)])
        .filter(([file]) => existsSync(join(root, 'life', file)));
      photo.view = { ...group.view.photos[index],
        srcset: [...copies, [photo.image, photo.width]].map(([file, width]) => `${file} ${width}w`).join(', '),
        sizes: `(max-width:640px) ${Math.round(82 * wide)}vw, ${Math.round(480 * wide)}px` };
    });
  }
  content.life.leisureGroups = { walk: [], near: [], far: [] };
  for (const item of content.life.leisure) {
    const group = content.life.leisureGroups[item.group];
    if (!group) throw new Error(`Unknown leisure group: ${item.group}`);
    group.push(item);
  }
  // Review previews show one tag; empty collections render no badge.
  for (const review of content.stories.reviews) review.firstTags = review.tags.slice(0, 1);
  // Render the shared menu from the same route data as the runtime fallback.
  const storyMenu = content.site.menu.find(menu => menu.id === 'stories');
  content.storyNavigation = Object.fromEntries(storyMenu.children.map(current => [current.id, {
    label: storyMenu.label,
    items: storyMenu.children.map(item => ({ ...item,
      mobileLabel: ({ overview: '전체', cohorts: '기수 기록' })[item.id] || item.label,
      states: item.id === current.id ? [{ value: 'page' }] : []
    }))
  }]));
  return content;
}
export function build() {
  const context = loadContent();
  const render = createRenderer(join(root, 'src/components'));
  const outputs = new Map();
  for (const file of files(join(root, 'src/pages'), '.html')) {
    const target = relative(join(root, 'src/pages'), file).replaceAll('\\', '/');
    const source = render(readText(file), context);
    outputs.set(target, source.replace(/(<!doctype html>\n)/i, `$1<!-- Generated from src/pages/${target} and content/. Run npm run build. -->\n`));
  }
  // menu.js from content/site.json; its cache token is the hash of this content (asset-versions.mjs)
  if (generatedScripts.has('common/js/menu.js')) outputs.set('common/js/menu.js', generatedScripts.get('common/js/menu.js'));
  return outputs;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    // Render everything before writing, so invalid data cannot leave a partial build.
    // The written static site connects to the team backoffice public API; build() stays design-only.
    const outputs = connectBackoffice(build());
    // Standalone loaders keep their source; only the ?v= of the script they load follows that file (asset-versions.mjs)
    for (const [file] of LOADER_TOKENS) outputs.set(file, generatedScripts.get(file));
    // Compared with LF line endings and written as LF (text.mjs). A file that differs only by CRLF is left as it is,
    // so a build in an old Windows copy does not mark every generated file as changed.
    const check = process.argv.includes('--check');
    const stale = [];
    for (const [path, source] of outputs) {
      const destination = join(root, path);
      let current;
      try { current = readText(destination); } catch { current = null; }
      if (current === source) continue;
      if (check) stale.push(path);
      else {
        mkdirSync(dirname(destination), { recursive: true });
        writeFileSync(destination, source);
      }
    }
    if (stale.length) throw new Error(`Generated files need npm run build:\n${stale.join('\n')}`);
    console.log(`${check ? 'Checked' : 'Built'} ${outputs.size} files.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
