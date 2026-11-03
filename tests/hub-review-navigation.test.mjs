import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(tag='div', className='') { Object.assign(this,{tagName:tag,className,children:[],attrs:{},dataset:{},textContent:''}); }
  setAttribute(key,value) { this.attrs[key]=value; }
  getAttribute(key) { return this.attrs[key]??null; }
  append(...nodes) { for(const n of nodes){n.parent=this;this.children.push(n);} }
  after(node) { const items=this.parent.children;items.splice(items.indexOf(this)+1,0,node);node.parent=this.parent; }
  replaceWith(node) { const items=this.parent.children;items[items.indexOf(this)]=node;node.parent=this.parent; }
  matches(selector) { return selector.startsWith('.')?this.className.split(' ').includes(selector.slice(1)):selector==='h2'&&this.tagName==='h2'; }
  querySelector(selector) { return this.children.find(n=>n.matches(selector))||this.children.map(n=>n.querySelector(selector)).find(Boolean)||null; }
  closest(selector) {
    if(selector==='a[href]')return this.tagName==='a'&&(this.attrs.href||this.href)?this:this.parent?.closest(selector)||null;
    return selector.split(',').some(s=>this.matches(s))?this:this.parent?.closest(selector)||null;
  }
}
test('hub reviews share previous/next navigation across all rendered reviews and retain the reviews-page link',()=>{
  const page=new Element('main','stories-page'),clicks=[],tasks=[],hashListeners=[];
  const records=['r-p8','r-p2','r-p27'].map((id,i)=>{
    const detail=new Element('div','ov'),host=new Element('div','mscroll'),heading=new Element('h3');
    detail.id=id;heading.textContent='후기 '+i;host.append(heading);detail.append(host);page.append(detail);
    const original=detail.querySelector.bind(detail);detail.querySelector=s=>s==='.mtop h3'?heading:original(s);
    return {detail,host};
  });
  page.querySelectorAll=s=>s==='#hub-review-dialogs .ov'?records.map(r=>r.detail):[];
  const location={hash:'#r-p2'},window={scrollY:123,scrollTo(){}};
  const document={querySelector:s=>s==='.stories-page'?page:null,getElementById:id=>records.find(r=>r.detail.id===id)?.detail,
    createElement:tag=>new Element(tag),addEventListener:(name,fn)=>{if(name==='click')clicks.push(fn);}};
  vm.runInNewContext(readFileSync(new URL('../stories/js/detail-navigation.js',import.meta.url),'utf8'),{document,window,location,
    setTimeout:fn=>tasks.push(fn),requestAnimationFrame:fn=>tasks.push(fn),addEventListener:(name,fn)=>{if(name==='hashchange')hashListeners.push(fn);}});
  while(tasks.length)tasks.shift()();
  const nav=i=>records[i].detail.querySelector('.sd-nav'),pair=i=>nav(i).querySelector('.sd-pair').children;
  assert.equal(pair(0)[0].getAttribute('aria-disabled'),'true');
  assert.equal(pair(0)[1].getAttribute('href'),'#r-p2');
  assert.equal(pair(1)[0].getAttribute('href'),'#r-p8');assert.equal(pair(1)[1].getAttribute('href'),'#r-p27');
  assert.equal(pair(2)[1].getAttribute('aria-disabled'),'true');
  for(let i=0;i<3;i++){assert.equal(nav(i).querySelector('.sd-list').href,'reviews.html');assert.equal(nav(i).querySelector('.sd-list').dataset.storyList,undefined);}
  clicks.forEach(fn=>fn({target:pair(1)[1]}));location.hash='#r-p27';hashListeners.forEach(fn=>fn());
  assert.equal(records[2].host.scrollTop,0);assert.equal(records[2].host.children.filter(n=>n.className==='sd-nav').length,1);
});
