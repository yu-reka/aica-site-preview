import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

export const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('\u00a0', '&nbsp;');

// Rich text is structured data, never an arbitrary HTML string from a CMS.
const richTags = new Set('p br mark b strong em i a span small ul ol li blockquote dl dt dd div'.split(' '));
const richAttrs = new Set(['class', 'href', 'data-field', 'aria-hidden']);
export function safeUrl(value) {
  const url = String(value);
  if (/[\u0000-\u0020\u007f"'<>]/.test(url) || url.startsWith('//') || url.includes('\\')) throw new Error(`Invalid content URL: ${url}`);
  if (/^[a-z][a-z\d+.-]*:/i.test(url) && !/^https?:\/\//i.test(url)) throw new Error(`Unsupported content URL: ${url}`);
  return url;
}
export function youtubeId(value) {
  const url = new URL(safeUrl(value));
  const host = url.hostname.toLowerCase();
  const id = host === 'youtu.be' ? url.pathname.slice(1) : ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host) ? url.searchParams.get('v') : null;
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error('Invalid YouTube video URL');
  return id;
}
class RenderedHtml {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}
function renderRichText(nodes) {
  if (!Array.isArray(nodes)) throw new Error('RichText must be an array');
  return nodes.map(node => {
    if (typeof node === 'string') return escapeHtml(node);
    if (!node || !richTags.has(node.tag)) throw new Error(`Unsupported rich-text tag: ${node?.tag}`);
    const attrs = Object.entries(node.attrs || {}).map(([key, value]) => {
      if (!richAttrs.has(key) || typeof value !== 'string') throw new Error(`Unsupported rich-text attribute: ${key}`);
      if (key === 'href') safeUrl(value);
      return ` ${key}="${escapeHtml(value)}"`;
    }).join('');
    return `<${node.tag}${attrs}>${node.tag === 'br' ? '' : renderRichText(node.children || []) + `</${node.tag}>`}`;
  }).join('');
}
export const richText = nodes => new RenderedHtml(renderRichText(nodes));

function lookup(path, scopes) {
  for (const scope of scopes) {
    let value = scope;
    for (const key of path.split('.')) {
      if (['__proto__', 'constructor', 'prototype'].includes(key) || value == null || !Object.hasOwn(value, key)) { value = undefined; break; }
      value = value[key];
    }
    if (value !== undefined) return value;
  }
  throw new Error(`Missing template value: ${path}`);
}

// Deliberately small: escaped fields, generated rich text, collections and components.
export function createRenderer(componentDirectory) {
  const directory = resolve(componentDirectory);
  const cache = new Map();
  function component(name) {
    if (!/^[\w/-]+$/.test(name)) throw new Error(`Invalid component name: ${name}`);
    const file = resolve(directory, name + '.html');
    if (!file.startsWith(directory + sep)) throw new Error('Component outside source directory');
    if (!cache.has(file)) cache.set(file, readFileSync(file, 'utf8'));
    return cache.get(file);
  }
  function render(source, scopes, depth = 0) {
    if (depth > 32) throw new Error('Template nesting exceeds 32 levels');
    let output = '', cursor = 0;
    const tokens = /\{\{\{([^{}]+)\}\}\}|\{\{([^{}]+)\}\}/g;
    for (let match; (match = tokens.exec(source));) {
      output += source.slice(cursor, match.index);
      const token = (match[1] || match[2]).trim();
      if (token.startsWith('#each ')) {
        const list = lookup(token.slice(6).trim(), scopes);
        if (!Array.isArray(list)) throw new Error(`Collection is not an array: ${token}`);
        const bodyStart = tokens.lastIndex;
        let nesting = 1, end;
        while ((end = tokens.exec(source))) {
          const nested = (end[1] || end[2]).trim();
          if (nested.startsWith('#each ')) nesting++;
          if (nested === '/each' && --nesting === 0) break;
        }
        if (!end) throw new Error(`Unclosed collection: ${token}`);
        const body = source.slice(bodyStart, end.index);
        output += list.map(item => render(body, [item, ...scopes], depth + 1)).join('');
      } else if (token === '/each') {
        throw new Error('Unexpected closing collection');
      } else if (token.startsWith('> ')) {
        const [name, context] = token.slice(2).trim().split(/\s+/);
        const nestedScopes = context ? [lookup(context, scopes), ...scopes] : scopes;
        const selected = name.startsWith('@') ? lookup(name.slice(1), nestedScopes) : name;
        output += render(component(selected), nestedScopes, depth + 1);
      } else {
        const value = lookup(token, scopes);
        if (match[1]) {
          if (!token.endsWith('Html') || !(value instanceof RenderedHtml)) throw new Error(`Raw field must be generated rich text: ${token}`);
          output += String(value);
        } else {
          if (!['string', 'number', 'boolean'].includes(typeof value)) throw new Error(`Non-scalar template value: ${token}`);
          output += escapeHtml(value);
        }
      }
      cursor = tokens.lastIndex;
    }
    return output + source.slice(cursor);
  }
  return (source, context) => render(source, [context]);
}
