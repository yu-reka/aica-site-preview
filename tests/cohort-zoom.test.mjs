import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function zoom() {
  const document={activeElement:null,querySelectorAll:()=>[],createElement:tag=>new Element(tag)};
  class Element {
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.attrs={};this.children=[];this.parentElement=null;}
    get classList(){return {contains:name=>this.className?.split(' ').includes(name),toggle:(name,on)=>{const names=new Set((this.className||'').split(' ').filter(Boolean));on?names.add(name):names.delete(name);this.className=[...names].join(' ');}};}
    addEventListener(){}
    setAttribute(name,value){this.attrs[name]=String(value);}
    getAttribute(name){return this.attrs[name]??null;}
    removeAttribute(name){delete this.attrs[name];}
    appendChild(child){child.parentElement=this;this.children.push(child);return child;}
    set innerHTML(value){this.children=[];}
    cloneNode(){const copy=new Element(this.tagName);copy.attrs={...this.attrs};return copy;}
    contains(node){return this===node||this.children.some(child=>child.contains(node));}
    closest(selector){return selector.startsWith('.')&&this.classList.contains(selector.slice(1))?this:this.parentElement?.closest(selector)||null;}
    focus(){document.activeElement=this;}
    querySelector(selector){const nodes=[];const visit=node=>{node.children.forEach(child=>{nodes.push(child);visit(child);});};visit(this);if(selector.includes('[aria-pressed="true"]'))return nodes.find(node=>node.tagName==='BUTTON'&&node.getAttribute('aria-pressed')==='true');return nodes.find(node=>node.classList.contains(selector.slice(1)));}
  }
  const photo=(src,alt)=>{const el=new Element('img');el.setAttribute('src',src);el.setAttribute('alt',alt);return el;};
  const record={title:'게시물 제목',illu:photo('one.jpg','첫 번째 장면'),photos:[photo('two.jpg','두 번째 장면'),photo('three.jpg','')]};
  const host=new Element(),close=new Element('button'),caption=new Element();
  const Z={querySelector:selector=>selector==='.cv3-zv-im'?host:selector==='figcaption'?caption:close};
  const source=readFileSync(new URL('../stories/js/cohort-v3.js',import.meta.url),'utf8');
  const album=source.slice(source.indexOf('  function galleryPhotos('),source.indexOf('  function ym('));
  const fill=source.slice(source.indexOf('  function zfill('),source.indexOf('  function openZ('));
  const api=vm.runInNewContext(album+fill+'\n({zfill})',{document,Z,list:()=>[record],cur:0,closeZ(){},Date});
  api.zfill();
  const activate=button=>{button.focus();button.onclick({preventDefault(){},stopPropagation(){}});};
  return {record,host,close,document,activate};
}

test('successive zoom next activations keep focus on next rather than close',()=>{
  const ui=zoom();
  ui.activate(ui.host.querySelector('.cv3-photo-next'));
  assert.equal(ui.record.photoIndex,1);
  assert.equal(ui.document.activeElement,ui.host.querySelector('.cv3-photo-next'));
  ui.activate(ui.document.activeElement);
  assert.equal(ui.record.photoIndex,2);
  assert.equal(ui.document.activeElement,ui.host.querySelector('.cv3-photo-next'));
});

test('zoom dot selection restores focus to the newly selected dot',()=>{
  const ui=zoom(),dots=ui.host.querySelector('.cv3-photo-dots');
  ui.activate(dots.children[1]);
  assert.equal(ui.record.photoIndex,1);
  assert.equal(ui.document.activeElement,ui.host.querySelector('.cv3-photo-dots').children[1]);
});

test('zoom keeps each photo description and falls back only when it is empty',()=>{
  const ui=zoom();assert.equal(ui.host.children[0].getAttribute('alt'),'첫 번째 장면');
  ui.activate(ui.host.querySelector('.cv3-photo-next'));
  assert.equal(ui.host.children[0].getAttribute('alt'),'두 번째 장면');
  ui.activate(ui.host.querySelector('.cv3-photo-next'));
  assert.equal(ui.host.children[0].getAttribute('alt'),'게시물 제목');
});
