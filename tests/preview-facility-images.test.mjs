import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const mapping=Object.fromEntries(JSON.parse(readFileSync(new URL('content/preview/facility-images.json',root),'utf8')).map(x=>[x.alias,x.original]));
test('public facility filenames used by desktop and mobile contain only approved public design image copies',()=>{
  const css=readFileSync(new URL('life/css/life.css',root),'utf8');
  const presentation=JSON.parse(readFileSync(new URL('src/presentation.json',root),'utf8'));
  const used=new Set(Object.values(presentation['life/facilities']).flatMap(x=>x.panel.photos.map(p=>/im-(fac_[\w]+)/.exec(p.className)?.[1]+'.webp')).filter(x=>x!=='undefined.webp'));
  assert.deepEqual([...used].sort(),Object.keys(mapping).sort());
  for(const [alias,original] of Object.entries(mapping)){
    assert.match(alias,/^fac_[a-z0-9_]+\.webp$/);
    assert.match(original,/^[a-z0-9_]+\.webp$/);
    assert.equal(original.startsWith('fac_'),false);
    assert.deepEqual(readFileSync(new URL('life/assets/'+alias,root)),readFileSync(new URL('life/assets/'+original,root)),alias+' must remain a public fixture');
    assert.ok(css.includes('.im-'+alias.slice(0,-5)+'{background-image:url(../assets/'+alias+')}'),alias);
  }
});
