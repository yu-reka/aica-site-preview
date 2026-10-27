import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { validateCohortPhotos } from '../scripts/build.mjs';

function start() {
  const hosts = [];
  class Element {
    constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.attrs = {}; this.children = []; this.handlers = {}; this.classList = { add() {}, toggle() {} }; }
    setAttribute(k, v) { this.attrs[k] = v; }
    getAttribute(k) { return this.attrs[k] || null; }
    removeAttribute(k) { delete this.attrs[k]; }
    appendChild(el) { this.children.push(el); }
    replaceChildren(...els) { this.children = els; }
    addEventListener(type, fn) { (this.handlers[type] ||= []).push(fn); }
    cloneNode() { const copy = new Element(this.tagName); copy.attrs = { ...this.attrs }; return copy; }
  }
  const document = { createElement: tag => new Element(tag), querySelectorAll: () => hosts };
  const source = readFileSync(new URL('../stories/js/cohort-v3.js', import.meta.url), 'utf8');
  const api = vm.runInNewContext(source.slice(source.indexOf('  function galleryPhotos('), source.indexOf('  function ym(')) + '\n({galleryPhotos,changePhoto,gallery})', { document, Date });
  const photo = src => { const img = new Element('img'); img.setAttribute('src', src); return img; };
  const record = { title: '사진 게시물', illu: photo('cover.jpg'), photos: [photo('cover.jpg'), photo('second.jpg'), photo('third.jpg')] };
  const mount = (data, tag = 'div') => { const host = new Element(tag); hosts.push(host); api.gallery(host, data); return host; };
  const control = (host, name) => host.children.find(el => el.className === name);
  return { ...api, hosts, record, mount, control, photo };
}

test('photo albums deduplicate the cover and synchronize feed and detail at both boundaries', () => {
  const ui = start(), feed = ui.mount(ui.record, 'article'), detail = ui.mount(ui.record);
  assert.equal(ui.galleryPhotos(ui.record).length, 3);
  const counter = host => ui.control(host, 'cv3-photo-count').textContent;
  const dots = ui.control(detail, 'cv3-photo-dots');
  let stopped = false;
  dots.children[1].onclick({ preventDefault() {}, stopPropagation() { stopped = true; } });
  assert.equal(stopped, true);
  assert.equal(ui.control(feed, 'cv3-photo-stack').getAttribute('aria-label'), '사진 3장 · 2번째 사진');
  assert.equal(counter(detail), '2/3');
  ui.changePhoto(ui.record, 99);
  assert.equal(ui.control(feed, 'cv3-photo-stack').getAttribute('aria-label'), '사진 3장 · 3번째 사진');
  assert.equal(dots.children[2].getAttribute('aria-pressed'), 'true');
  ui.changePhoto(ui.record, -1);
  assert.equal(counter(detail), '1/3');
  assert.equal(dots.children[0].getAttribute('aria-pressed'), 'true');
});

test('vertical touches preserve scrolling and a reused detail gallery swipes only its current post', () => {
  const ui = start(), host = ui.mount(ui.record);
  const touch = (type, x, y) => host.handlers[type].forEach(fn => fn({ clientX:x,clientY:y,pointerId:1,button:0,target:{closest:()=>null} }));
  touch('pointerdown', 100, 100); touch('pointerup', 90, 200);
  assert.equal(ui.record.photoIndex, undefined);
  const other = { title: '다른 게시물', illu: ui.photo('a.jpg'), photos: [ui.photo('b.jpg')] };
  host.children = []; ui.gallery(host, other);
  touch('pointerdown', 150, 100); touch('pointerup', 50, 100);
  assert.equal(other.photoIndex, 1);
  assert.equal(ui.record.photoIndex, undefined);
  assert.equal(host.handlers.pointerup.length, 1);
});

test('single-photo posts have no album arrows or counter', () => {
  const ui = start(), host = ui.mount({title: '한 장', illu: ui.photo('one.jpg'), photos: []});
  assert.equal(host.children.length, 1);
});


test('albums stop at ten unique photos including the cover in feed and detail', () => {
  const ui = start();
  ui.record.photos = [ui.photo('cover.jpg'), ...Array.from({length: 11}, (_, i) => ui.photo(`photo-${i}.jpg`))];
  const feed = ui.mount(ui.record, 'article'), detail = ui.mount(ui.record);
  ui.changePhoto(ui.record, 11);
  for (const host of [feed, detail]) {
    assert.equal(ui.control(host, 'cv3-photo-stage').children[0].getAttribute('src'), 'photo-8.jpg');
  }
  assert.equal(ui.control(feed, 'cv3-photo-stack').getAttribute('aria-label'), '사진 10장 · 10번째 사진');
  assert.equal(ui.control(feed, 'cv3-photo-dots').children.length, 5);
  assert.equal(ui.control(feed, 'cv3-photo-dots').getAttribute('aria-hidden'), 'true');
  assert.equal(ui.control(feed, 'cv3-photo-dots').children[4].cv3PhotoIndex, 9);
  assert.equal(ui.control(detail, 'cv3-photo-count').textContent, '10/10');
  assert.equal(ui.control(detail, 'cv3-photo-dots').children.length, 10);
  assert.equal(ui.control(detail, 'cv3-photo-dots').children[9].getAttribute('aria-pressed'), 'true');
});

test('static content accepts ten photos but rejects an eleventh including the cover', () => {
  const photos = Array.from({length: 9}, (_, i) => ({src: `photo-${i}.jpg`, alt: ''}));
  const record = {id: 'album', thumbnail: 'cover.jpg', photos};
  assert.doesNotThrow(() => validateCohortPhotos(record));
  assert.doesNotThrow(() => validateCohortPhotos({...record, photos: [{src:'cover.jpg'}, ...photos]}));
  assert.throws(() => validateCohortPhotos({...record, photos: [...photos, {src:'eleventh.jpg'}]}), /must not exceed 10/);
  assert.doesNotThrow(() => validateCohortPhotos({id:'illustration', photos}));
  assert.throws(() => validateCohortPhotos({id:'illustration', photos: [...photos, {src:'extra.jpg'}]}), /must not exceed 10/);
});


test('detail albums show one selectable dot per photo with stable labels', () => {
  const ui = start();
  ui.record.photos = Array.from({length: 9}, (_, i) => ui.photo(`photo-${i}.jpg`));
  const host = ui.mount(ui.record), dots = ui.control(host, 'cv3-photo-dots');
  for(let index=0;index<10;index++){
    ui.changePhoto(ui.record,index);
    assert.equal(dots.children.length,10);
    const selected=dots.children.filter(dot=>dot.getAttribute('aria-pressed')==='true');
    assert.equal(selected.length,1);
    assert.equal(selected[0].getAttribute('aria-label'),`${index+1}번째 사진`);
  }
  ui.changePhoto(ui.record,0);
  dots.children[4].onclick({preventDefault(){},stopPropagation(){}});
  assert.equal(ui.record.photoIndex,4);
  assert.equal(dots.children[4].getAttribute('aria-label'),'5번째 사진');
  dots.children[9].onclick({preventDefault(){},stopPropagation(){}});
  assert.equal(ui.record.photoIndex,9);
});


test('photo arrows synchronize galleries, stop card opening, and wrap across both ends', () => {
  const ui=start(),feed=ui.mount(ui.record,'article'),detail=ui.mount(ui.record);
  const previous=ui.control(detail,'cv3-photo-arrow cv3-photo-prev');
  const next=ui.control(detail,'cv3-photo-arrow cv3-photo-next');
  assert.ok(!previous.disabled && !next.disabled);
  let stopped=false;
  const event={preventDefault(){},stopPropagation(){stopped=true;}};
  previous.onclick(event);
  assert.equal(ui.control(feed,'cv3-photo-stack').getAttribute('aria-label'),'사진 3장 · 3번째 사진');
  next.onclick(event);
  assert.equal(ui.control(feed,'cv3-photo-stack').getAttribute('aria-label'),'사진 3장 · 1번째 사진');
  next.onclick(event);
  assert.equal(ui.control(detail,'cv3-photo-count').textContent,'2/3');
  assert.equal(stopped,true);
  assert.ok(!previous.disabled && !next.disabled);
});


test('closing the detail restores visited posts to their covers without changing other feed posts', () => {
  const ui=start(),feed=ui.mount(ui.record,'article');
  const other={title:'다른 게시물',illu:ui.photo('a.jpg'),photos:[ui.photo('b.jpg')]};
  ui.mount(other);ui.changePhoto(ui.record,2);ui.changePhoto(other,1);
  const source=readFileSync(new URL('../stories/js/cohort-v3.js',import.meta.url),'utf8');
  const begin=source.indexOf('  function closeM(');
  const end=source.indexOf("  M.querySelector('.cv3-m-x').onclick",begin);
  const state={
    hubModal:false,Z:{hidden:false},M:{hidden:false,querySelector:()=>({innerHTML:''})},
    modalVisited:[ui.record],changePhoto:ui.changePhoto,isolateDialog(){},last:null,
    document:{documentElement:{classList:{remove(){}}}}
  };
  vm.runInNewContext(source.slice(begin,end)+'\ncloseM();',state);
  assert.equal(state.M.hidden,true);
  assert.equal(state.Z.hidden,true);
  assert.equal(ui.control(feed,'cv3-photo-stack').getAttribute('aria-label'),'사진 3장 · 1번째 사진');
  assert.equal(ui.record.photoIndex,0);
  assert.equal(other.photoIndex,1);
  assert.equal(state.modalVisited.length,0);
});

test('responsive cohort clones retain dimensions and switch feed versus modal image sizes without changing the record',()=>{
  const ui=start(),cover=ui.record.illu;
  cover.setAttribute('srcset','cover-640.jpg 640w, cover.jpg 1280w');
  cover.setAttribute('width','1280');cover.setAttribute('height','720');
  const original=JSON.stringify(cover.attrs);
  const feed=ui.mount(ui.record,'article'),detail=ui.mount(ui.record);
  const active=host=>ui.control(host,'cv3-photo-stage').children[0];
  for(const host of [feed,detail]){
    assert.equal(active(host).getAttribute('srcset'),'cover-640.jpg 640w, cover.jpg 1280w');
    assert.equal(active(host).getAttribute('width'),'1280');assert.equal(active(host).getAttribute('height'),'720');
    assert.equal(active(host).getAttribute('decoding'),'async');
  }
  assert.match(active(feed).getAttribute('sizes'),/max-width: 600px\) calc\(\(100vw - 4px\) \/ 3\)/);
  assert.match(active(feed).getAttribute('sizes'),/min\(309px, calc\(\(100vw - clamp\(40px, 8vw, 96px\) - 8px\) \/ 3\)\)$/);
  assert.doesNotMatch(active(feed).getAttribute('sizes'),/calc\(100vw - 40px\)/,'a three-column feed must not advertise the whole viewport');
  assert.match(active(detail).getAttribute('sizes'),/960px$/);
  assert.equal(active(feed).getAttribute('loading'),'lazy');
  assert.equal(active(detail).getAttribute('loading'),null);
  ui.changePhoto(ui.record,1);
  assert.equal(active(detail).getAttribute('srcset'),null,'an original-only next image must not reuse the previous candidates');
  assert.equal(JSON.stringify(cover.attrs),original);
});

test('fullscreen cohort zoom upgrades responsive sizing without retaining lazy loading or changing the source',()=>{
  const ui=start(),cover=ui.record.illu;
  cover.setAttribute('srcset','cover-640.jpg 640w, cover.jpg 1280w');
  cover.setAttribute('sizes','320px');cover.setAttribute('loading','lazy');
  cover.setAttribute('width','1280');cover.setAttribute('height','720');
  ui.record.photos=[];const before=JSON.stringify(cover.attrs);
  const box={children:[],contains(){return false;},appendChild(n){this.children.push(n);}},caption={};
  const source=readFileSync(new URL('../stories/js/cohort-v3.js',import.meta.url),'utf8');
  const state={list:()=>[ui.record],cur:0,galleryPhotos:ui.galleryPhotos,document:{activeElement:null},
    Z:{querySelector:s=>s==='figcaption'?caption:box},bindPhotoSwipe(){},closeZ(){throw Error('unexpected close');}};
  vm.runInNewContext(source.slice(source.indexOf('  function zfill()'),source.indexOf('  function openZ()'))+'\nzfill();',state);
  const img=box.children[0];
  assert.equal(img.getAttribute('sizes'),'(max-width: 1328px) calc(100vw - 48px), 1280px');
  assert.equal(img.getAttribute('loading'),null);assert.equal(img.getAttribute('decoding'),'async');
  assert.equal(img.getAttribute('srcset'),cover.getAttribute('srcset'));
  assert.equal(img.getAttribute('width'),null);assert.equal(img.getAttribute('height'),null);
  assert.equal(JSON.stringify(cover.attrs),before);
});
