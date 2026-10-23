import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../stories/js/cohort-v3.js',import.meta.url),'utf8');
// 아주 작은 DOM: 기수 정보 요소를 만들 때 쓰는 것만(글자가 textContent 로만 들어가는지 봄)
class El{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.className='';}
  set textContent(v){this.children=[String(v)];}
  get textContent(){return this.children.map(c=>typeof c==='string'?c:c.textContent).join('');}
  append(...nodes){this.children.push(...nodes);}
  appendChild(node){this.children.push(node);return node;}
  setAttribute(k,v){this.attrs[k]=String(v);}
  find(cls){for(const c of this.children){if(typeof c==='string')continue;if(c.className===cls)return c;const f=c.find(cls);if(f)return f;}return null;}
}
test('cohort info elements are built from STORIES_DATA.cohortInfos as plain text',()=>{
  const STORIES_DATA={cohortInfos:[
    {cohort:'7',account:'aica_seven',tag:'인공지능사관학교',bio:{title:'인공지능사관학교 7기',text:'<b>소개</b>'},tracks:['AI 금융','<i>보안</i>'],label:'6기와 달라진 점',rows:[{item:'전형',before:'서류, 면접',after:'서류 → 코딩테스트'}]},
    {cohort:'8',account:'aica_8th',tag:'',bio:{title:'',text:''},tracks:[],label:'',rows:[{item:'프로젝트',before:'720시간',after:'준비 중'},{item:''}]}
  ]};
  const context={STORIES_DATA,root:{},D:[],document:{createElement:tag=>new El(tag)},lab:k=>k==='3-5'?'3–5':k,acc:c=>'aica_'+String(c).replace('-','to')+'th'};
  vm.runInNewContext(source.slice(source.indexOf('  var COH_KEY='),source.indexOf('  /* 기수 칩 ='))+'\nvar seven=info("7"),eight=info("8"),nine=info("9"),name=accName(7);',context);
  const {seven,eight,nine}=context;
  assert.equal(seven.has,true);
  assert.equal(seven.pin.className,'cv3-pin');
  assert.equal(seven.pin.attrs['aria-label'],'7기 교육과정');
  assert.deepEqual(seven.pin.find('cc').children.map(c=>c.textContent),['AI 금융','<i>보안</i>']);
  assert.equal(seven.acc.textContent,'aica_seven');assert.equal(context.name,'aica_seven');
  assert.equal(seven.tag.textContent,'인공지능사관학교');
  assert.equal(seven.label.textContent,'6기와 달라진 점');
  assert.equal(seven.bio.textContent,'인공지능사관학교 7기<b>소개</b>');
  const row=seven.dt.children[0];
  assert.equal(row.className,'cv3-dr');
  assert.deepEqual(row.children.map(c=>c.textContent),['전형','서류, 면접','서류 → 코딩테스트']);
  // 비운 칸: 교육과정 카드 · 꼬리표 · 소개 없음, 버튼 이름은 앞 기수로, 항목이 빈 줄은 뺌
  assert.equal(eight.pin,undefined);assert.equal(eight.tag,undefined);assert.equal(eight.bio,undefined);
  assert.equal(eight.label.textContent,'7기와 달라진 점');
  assert.equal(eight.dt.children.length,1);
  // 정보가 없는 기수
  assert.equal(nine.has,false);assert.equal(nine.acc,undefined);
});
