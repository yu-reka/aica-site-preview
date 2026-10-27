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
function start(hash='',topHref='#p-iv',kind='interview') {
  const project=kind==='project';
  const page=new Element('main','stories-page'),detail=new Element('div',project?'pjd':'ivd'),card=new Element('a',project?'pjc':'iv');
  const heading=new Element('h2'),host=new Element('div','ivwrap'),top=new Element('a','ivback');
  heading.textContent='인터뷰 제목';detail.id=project?'pj-p42':'iv-p8';top.setAttribute('href',topHref);card.setAttribute('href','#'+detail.id);
  detail.append(top,heading,host);page.append(card,detail);
  page.querySelectorAll=s=>s===(project?'#p-pr .pjgrid a.pjc':'#p-iv .ivgrid a.iv')?[card]:[];
  const clicks=[],tasks=[],scrolls=[],location={hash},window={scrollY:987,scrollTo:value=>scrolls.push(value)};
  const document={querySelector:s=>s==='.stories-page'?page:null,getElementById:id=>id===detail.id?detail:null,
    createElement:tag=>new Element(tag),addEventListener:(name,fn)=>{if(name==='click')clicks.push(fn);}};
  vm.runInNewContext(readFileSync(new URL('../stories/js/detail-navigation.js',import.meta.url),'utf8'),{
    document,location,window,setTimeout:fn=>tasks.push(fn),requestAnimationFrame:fn=>tasks.push(fn),addEventListener(){},
    matchMedia:()=>({matches:false,addEventListener(){}}),
  });
  const flush=()=>{while(tasks.length)tasks.shift()();};flush();
  return {top,bottom:detail.querySelector('.sd-list'),location,window,scrolls,flush,
    click:node=>clicks.forEach(fn=>fn({target:node})),card};
}

test('both interview list links restore the saved listing hash and position after reading',()=>{
  for(const initialHash of ['', '#p-iv', '#iv-honors-title'])for(const link of ['top','bottom']) {
    const ui=start(initialHash);
    ui.click(ui.card);ui.location.hash='#iv-p8';ui.window.scrollY=4200;
    ui.click(ui[link]);ui.flush();
    assert.equal(ui[link].dataset.storyList,'interview');
    assert.equal(ui[link].getAttribute('href'),'#p-iv');
    assert.equal(ui.scrolls.length,1);
    assert.equal(ui.scrolls[0].top,987);
    assert.equal(ui.scrolls[0].behavior,'instant');
  }
});

test('direct interview entry keeps the ordinary list destination without an invented return position',()=>{
  const ui=start('#iv-p8');ui.click(ui.top);ui.flush();
  assert.equal(ui.top.getAttribute('href'),'#p-iv');
  assert.equal(ui.scrolls.length,0);
});

test('a return link to the honors section does not inherit the general interview listing position',()=>{
  const ui=start('', '#iv-honors-title');
  ui.click(ui.card);ui.location.hash='#iv-honors-1';ui.click(ui.top);ui.flush();
  assert.equal(ui.top.dataset.storyList,undefined);
  assert.equal(ui.top.getAttribute('href'),'#iv-honors-title');
  assert.equal(ui.scrolls.length,0);
});

test('both project list links restore the project listing and saved position',()=>{
  for(const initialHash of ['', '#p-pr'])for(const link of ['top','bottom']) {
    const ui=start(initialHash,'#p-pr','project');
    ui.click(ui.card);ui.location.hash='#pj-p42';ui.window.scrollY=4200;
    ui.click(ui[link]);ui.flush();
    assert.equal(ui[link].dataset.storyList,'project');
    assert.equal(ui[link].getAttribute('href'),'#p-pr');
    assert.equal(ui.scrolls.length,1);
    assert.equal(ui.scrolls[0].top,987);
    assert.equal(ui.scrolls[0].behavior,'instant');
  }
});

test('direct project entry retains its default project list destination',()=>{
  const ui=start('#pj-p42','#p-pr','project');ui.click(ui.top);ui.flush();
  assert.equal(ui.top.getAttribute('href'),'#p-pr');
  assert.equal(ui.scrolls.length,0);
});
