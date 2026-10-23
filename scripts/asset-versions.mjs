import { readFileSync } from 'node:fs';

// Build-owned cache tokens. Explicit variants preserve existing page URLs.
function freezeVersions(value) {
  if (typeof value === 'string' && /^[\w-]+$/.test(value)) return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid asset version');
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freezeVersions(child)])));
}
export const assetVersions = freezeVersions(JSON.parse(readFileSync(new URL('../src/asset-versions.json', import.meta.url), 'utf8')));

export function assetVersion(key) {
  let value = assetVersions;
  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, part)) throw new Error(`Unknown asset version: ${key}`);
    value = value[part];
  }
  if (typeof value !== 'string') throw new Error(`Asset version needs an explicit variant: ${key}`);
  return value;
}
