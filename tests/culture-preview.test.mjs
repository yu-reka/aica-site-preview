import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('public culture gallery uses the approved example image bytes and labels', () => {
  const manifest = JSON.parse(read('content/preview/culture-images.json'));
  const groups = JSON.parse(read('content/life/culture.json'));
  const photos = groups.flatMap(group => group.photos);
  assert.equal(groups.length, 4); assert.equal(photos.length, 30); assert.equal(manifest.length, 30);
  assert.equal(existsSync(new URL('../life/assets/culture/', import.meta.url)), false);
  for (const group of groups) assert.match(group.name, /^\[시안\]/);
  for (const photo of photos) {
    const approved = manifest.find(item => item.photoClass === photo.photoClass);
    assert.ok(approved); assert.equal(photo.image, approved.image); assert.equal(photo.caption, approved.caption);
    assert.match(photo.image, /^assets\/(?:cafest|yl_tmp|park_tmp|riverp|acc_tmp|plaza_tmp)\.webp$/);
    assert.match(photo.caption, /사진 예시/);
    const bytes = readFileSync(new URL('../life/' + photo.image, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), approved.sha256);
  }
  assert.doesNotMatch(read('life/css/culture.css'), /assets\/culture\//);
  for (const group of groups) assert.ok(read('life/index.html').includes('<h4>' + group.name + '</h4>'));
});
