import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const bytes = path => readFileSync(new URL('../' + path, import.meta.url));
function webpSize(buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const kind = buffer.toString('ascii', offset, offset + 4), length = buffer.readUInt32LE(offset + 4), start = offset + 8;
    if (kind === 'VP8X') return [buffer.readUIntLE(start + 4, 3) + 1, buffer.readUIntLE(start + 7, 3) + 1];
    if (kind === 'VP8 ') return [buffer.readUInt16LE(start + 6) & 0x3fff, buffer.readUInt16LE(start + 8) & 0x3fff];
    if (kind === 'VP8L') { const bits = buffer.readUInt32LE(start + 1); return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1]; }
    offset = start + length + (length % 2);
  }
  throw new Error('No WebP image dimensions found');
}
test('public culture gallery uses the approved example image bytes and labels', () => {
  const manifest = JSON.parse(read('content/preview/culture-images.json'));
  const groups = JSON.parse(read('content/life/culture.json'));
  assert.equal(groups.length, 4); assert.equal(groups.flatMap(group => group.photos).length, 30); assert.equal(manifest.length, 30);
  assert.equal(existsSync(new URL('../life/assets/culture/', import.meta.url)), false);
  for (const group of groups) {
    assert.match(group.name, /^\[시안\]/);
    assert.ok(read('life/index.html').includes('<h4>' + group.name + '</h4>'));
    group.photos.forEach((photo, index) => {
      const approved = manifest.find(item => item.id === group.id + '-' + (index + 1));
      assert.ok(approved); assert.equal(photo.image, approved.image); assert.equal(photo.caption, approved.caption);
      assert.match(photo.image, /^assets\/(?:cafest|yl_tmp|park_tmp|riverp|acc_tmp|plaza_tmp)\.webp$/);
      assert.match(photo.caption, /사진 예시/);
      assert.equal(createHash('sha256').update(bytes('life/' + photo.image)).digest('hex'), approved.sha256);
    });
  }
  assert.doesNotMatch(read('life/css/culture.css'), /assets\/culture\//);
});
test('public responsive gallery declares actual image dimensions and only existing srcset candidates', () => {
  const groups = JSON.parse(read('content/life/culture.json')), html = read('life/index.html');
  for (const group of groups) for (const photo of group.photos) {
    assert.deepEqual([photo.width, photo.height], webpSize(bytes('life/' + photo.image)));
    assert.match(photo.position, /^\d+% \d+%$/);
    assert.ok(html.includes('src="' + photo.image + '" srcset="' + photo.image + ' ' + photo.width + 'w"'));
    assert.ok(html.includes('width="' + photo.width + '" height="' + photo.height + '"'));
  }
  const photos = html.match(/<img class="cf-ph"[^>]*>/g) || [];
  assert.equal(photos.length, 30);
  for (const image of photos) {
    assert.match(image, /loading="lazy" decoding="async"/);
    assert.doesNotMatch(image, /(?:NaN|undefined|assets\/culture\/)/);
  }
});
