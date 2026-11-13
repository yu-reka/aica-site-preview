import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepare } from './template.mjs';
import { lf, readText } from './text.mjs';

// Build-owned cache tokens (?v=): the first 8 hex characters of the sha256 of each local CSS/JS file
// (<area>/css/<name>.css, <area>/js/<name>.js), the same rule as the admin templates (npm run assets).
// Editing a file changes its token on the next npm run build; unchanged files keep theirs. Keys are <area>.<css|js>.<name>.
// Files the build writes itself (menu.js, loader tokens below) are hashed as the build writes them.
// Hashes use LF line endings, so an old Windows copy with CRLF files gets the same tokens as Git (text.mjs).
const root = fileURLToPath(new URL('..', import.meta.url));
const read = path => readText(join(root, path));
export const contentToken = text => createHash('sha256').update(lf(text)).digest('hex').slice(0, 8);

/** common/js/menu.js: menu, links and organization info from content/site.json */
export function menuScript(site) {
  const json = value => JSON.stringify(value, null, 2).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  return '// Generated from content/site.json. Run npm run build.\n' +
    `const SITE_HOME = ${json(site.home)};\n\nconst SITE_MENU = ${json(site.menu)};\n\nconst SITE_LINKS = ${json(site.links)};\n\nconst SITE_INFO = ${json(site.organization)};\n`;
}

/**
 * Browser-only loaders that request another local script without HTML: [loader, URL inside the loader, file it loads].
 * The build rewrites that URL's ?v= to the loaded file's token (one occurrence per loader).
 */
export const LOADER_TOKENS = [
  ['home/js/ticker-render.js', '../stories/js/stories-data.js', 'stories/js/stories-data.js'],   // relative to home/index.html
  ['stories/js/stories-m.js', 'stories-m-reviews.js', 'stories/js/stories-m-reviews.js']         // relative to the script itself
];

function withLoaderToken(file, url, target) {
  const text = read(file);
  const pattern = new RegExp(`${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=[\\w-]+`, 'g');
  const found = text.match(pattern)?.length || 0;
  if (found !== 1) throw new Error(`${file}: expected one ${url}?v= loader URL, found ${found}`);
  return text.replace(pattern, `${url}?v=${contentToken(read(target))}`);
}

/** JS the build writes (path -> content): checked by npm run check like the generated HTML */
export const generatedScripts = new Map([
  ...(existsSync(join(root, 'content/site.json')) ? [['common/js/menu.js', menuScript(prepare(JSON.parse(read('content/site.json'))))]] : []),
  ...LOADER_TOKENS.map(([file, url, target]) => [file, withLoaderToken(file, url, target)])
]);

function localAssets() {
  const paths = new Set(generatedScripts.keys());
  for (const area of readdirSync(root, { withFileTypes: true })) {
    if (!area.isDirectory() || area.name.startsWith('.') || area.name === 'node_modules') continue;
    for (const type of ['css', 'js']) {
      const directory = join(root, area.name, type);
      if (!existsSync(directory)) continue;
      for (const name of readdirSync(directory)) if (name.endsWith(`.${type}`)) paths.add(`${area.name}/${type}/${name}`);
    }
  }
  return [...paths].sort();
}

function freeze(value) {
  if (typeof value === 'string') return value;
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
}

export const assetVersions = freeze(localAssets().reduce((versions, path) => {
  const [area, type, file] = path.split('/');
  const name = file.slice(0, -type.length - 1);
  if (!/^[\w-]+$/.test(name)) throw new Error(`Asset file name must be letters, digits, - or _ for its cache token: ${path}`);
  ((versions[area] ||= {})[type] ||= {})[name] = contentToken(generatedScripts.get(path) ?? read(path));
  return versions;
}, {}));

export function assetVersion(key) {
  let value = assetVersions;
  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, part)) throw new Error(`Unknown asset version: ${key}`);
    value = value[part];
  }
  if (typeof value !== 'string') throw new Error(`Asset version needs <area>.<css|js>.<file name>: ${key}`);
  return value;
}
