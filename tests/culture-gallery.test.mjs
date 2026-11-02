import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

class Node {
  constructor(text=''){this.textContent=text;this.attrs={};this.events={};this.style={setProperty(){},getPropertyValue:()=>''};this.classes=new Set();
    this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name),contains:name=>this.classes.has(name),add:name=>this.classes.add(name)};}
  setAttribute(key,value){this.attrs[key]=String(value);}
  removeAttribute(key){delete this.attrs[key];}
  getAttribute(key){return this.attrs[key];}
  addEventListener(key,callback){this.events[key]=callback;}
  appendChild(){}
  insertBefore(){}
  remove(){}
  cloneNode(){return new Node();}
  focus(){}
  scrollBy(){}
  querySelector(){return new Node();}
  getBoundingClientRect(){return {left:0,top:0,width:0,height:0};}
}
function gallery(){
  const nodes={'.cf-pile':new Node(),'.cf-yb':new Node(),'.cf-tg':new Node(),'.cf-h':new Node(),
    'h3':new Node('가까운 산책'),'.cf-intro h4':new Node('동명동 카페거리'),'.pv':new Node(),'.nx':new Node(),'.cf-close':new Node()};
  const group=new Node();
  group.querySelector=selector=>nodes[selector]||null;
  group.querySelectorAll=selector=>selector==='.cf-card'?[new Node()]:[];
  const document={querySelectorAll:selector=>selector==='.cf-g'?[group]:[],getElementById:()=>null,body:new Node(),
    createDocumentFragment:()=>new Node(),activeElement:null};
  const context=vm.createContext({document,Map,Promise,matchMedia:()=>({matches:true}),
    getComputedStyle:()=>({paddingLeft:'0',paddingRight:'0'}),addEventListener(){},removeEventListener(){},
    MutationObserver:class{observe(){}},window:{},setTimeout,clearTimeout});
  vm.runInContext(readFileSync(new URL('../life/js/culture.js',import.meta.url),'utf8'),context);
  return nodes;
}

test('culture gallery toggle labels name the place, not the group heading',()=>{
  const nodes=gallery(),yb=nodes['.cf-yb'];
  yb.events.click({stopPropagation(){}});
  assert.equal(yb.attrs['aria-label'],'동명동 카페거리 사진 접기');
  yb.events.click({stopPropagation(){}});
  assert.equal(yb.attrs['aria-label'],'동명동 카페거리 사진 펼쳐보기');
});
