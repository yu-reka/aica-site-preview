import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../stories/js/cohort-v3.js',import.meta.url),'utf8');
function start(){
  class Element{
    constructor(tag='p'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.textContent='';this.hidden=false;}
    appendChild(child){child.parent=this;this.children.push(child);return child;}
    remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
    querySelector(){return this.children.find(child=>child.tagName==='P');}
    querySelectorAll(){return this.children.filter(child=>'extraStory' in child.dataset);}
  }
  const node=(tag,cls,text)=>Object.assign(new Element(tag),{className:cls||'',textContent:text||''});
  const api=vm.runInNewContext(source.slice(source.indexOf('  function captionParts('),source.indexOf('  function fill(){'))+'\n({captionParts,renderCaption})',{node});
  const box=new Element('div');box.appendChild(node('h3','','title'));box.appendChild(node('p','','summary'));
  return {...api,box};
}
const plain=value=>JSON.parse(JSON.stringify(value));

test('explicit string tags win, deduplicate and ignore legacy numeric categories without rewriting body',()=>{
  const ui=start(),record={sum:'첫 문단',body:['#본문유지'],tags:['인공지능사관학교','7기','인공지능사관학교','#선배',0,7,null,'',{},'<img onerror=alert(1)>']};
  const before=JSON.stringify(record),parts=plain(ui.captionParts(record));
  assert.deepEqual(parts,{paragraphs:['첫 문단','#본문유지'],tags:['인공지능사관학교','7기','선배']});
  assert.equal(JSON.stringify(record),before);
});

test('explicit string tags keep inner spaces the backoffice saves, but legacy lines still split on spaces',()=>{
  const ui=start();
  assert.deepEqual(plain(ui.captionParts({sum:'도입',tags:['멘토 매칭데이','  AI   Agent ','#팀 빌딩','a  <b>']})).tags,['멘토 매칭데이','AI Agent','팀 빌딩']);
  assert.deepEqual(plain(ui.captionParts({sum:'도입',body:['#멘토 매칭데이']})),{paragraphs:['도입','#멘토 매칭데이'],tags:[]});
});

test('legacy fallback takes only the final whole hashtag line and supports a tag-only caption',()=>{
  const ui=start();
  for(const tags of [undefined,[],[0,4,7],[null,{}]]){
    assert.deepEqual(plain(ui.captionParts({sum:'도입',body:['중간 #본문 유지','  #7기  #네이버1784 \n #기업탐방  '],tags})),{paragraphs:['도입','중간 #본문 유지'],tags:['7기','네이버1784','기업탐방']});
  }
  assert.deepEqual(plain(ui.captionParts({sum:'#태그만',body:[]})),{paragraphs:[],tags:['태그만']});
  assert.deepEqual(plain(ui.captionParts({sum:'#중간태그',body:['마지막 일반 문장']})),{paragraphs:['#중간태그','마지막 일반 문장'],tags:[]});
});

test('hash headings, sentences, punctuation and malformed HTML remain literal body paragraphs',()=>{
  const ui=start();
  for(const last of ['#','# 제목','#메모 오늘 배운 내용입니다','가격 #7기 참고','##제목','#태그,','#a#b','#<img onerror=alert(1)>','#태그 \n 일반 문장']){
    assert.deepEqual(plain(ui.captionParts({sum:'도입',body:[last]})),{paragraphs:['도입',last],tags:[]},last);
  }
});

test('modal reuse removes stale tag rows, restores body and never turns user text into HTML or links',()=>{
  const ui=start();ui.renderCaption(ui.box,{sum:'#하나 #둘'});
  const first=ui.box.querySelector('p');assert.equal(first.hidden,true);
  let line=ui.box.children.find(child=>child.className==='cv3-hashtags');
  assert.deepEqual(line.children.map(child=>child.textContent),['#하나','#둘']);
  assert.ok(line.children.every(child=>child.tagName==='SPAN'));
  ui.renderCaption(ui.box,{sum:'<script>alert(1)</script>',body:['# 제목 일반 문장']});
  assert.equal(first.hidden,false);assert.equal(first.textContent,'<script>alert(1)</script>');
  assert.equal(ui.box.children.some(child=>child.className==='cv3-hashtags'),false);
  assert.equal(ui.box.children.at(-1).textContent,'# 제목 일반 문장');
  assert.equal(ui.box.children[0].textContent,'title');
});

test('optional tags cross the shipped API renderer as escaped hidden text, never numeric stage labels',()=>{
  const template={innerHTML:''},page={classList:{contains:()=>false},querySelector:()=>null,querySelectorAll:()=>[]};
  const window={STORIES_DATA:{cohorts:[{id:1,cohort:7,title:'테스트',body:['본문'],tags:[0,7,'기업탐방','<img onerror=alert(1)>']} ]}};
  const document={querySelector:()=>page,getElementById:id=>id==='cv3-data'?template:null,addEventListener(){}};
  vm.runInNewContext(readFileSync(new URL('../stories/js/stories-render.js',import.meta.url),'utf8'),{window,document,Set,location:{hash:''}});
  assert.match(template.innerHTML,/<div data-story-tags hidden><span>기업탐방<\/span><span>&lt;img onerror=alert\(1\)&gt;<\/span><\/div>/);
  assert.doesNotMatch(template.innerHTML,/<span>[07]<\/span>|<img onerror/);
  assert.match(template.innerHTML,/<p data-field="body">본문<\/p>/);
});
