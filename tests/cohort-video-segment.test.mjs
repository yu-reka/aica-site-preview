import {runInContext} from './support/runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// 기수별 이모저모 영상 구간(2026-11-05 사용자 요청): 인터뷰처럼 video.start · end(초)가 있으면 글 창의 재생 단추가 그 구간만 재생
const content=readFileSync(new URL('../common/js/public-content.js',import.meta.url),'utf8');
const renderer=readFileSync(new URL('../stories/js/stories-render.js',import.meta.url),'utf8');
const cohortV3=readFileSync(new URL('../stories/js/cohort-v3.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');

function cards(cohorts){
  const data={innerHTML:''};
  const window={STORIES_DATA:{cohorts},addEventListener(){},removeEventListener(){}};
  const page={querySelector:()=>null,querySelectorAll:()=>[],classList:{contains:()=>false}};
  const document={baseURI:'https://example.test/stories/cohorts.html',querySelector:sel=>sel==='.stories-page'?page:null,querySelectorAll:()=>[],getElementById:id=>id==='cv3-data'?data:null,addEventListener(){},
    createElement:()=>({innerHTML:'',content:{childNodes:[],children:[]}})};
  const context=vm.createContext({window,document,URL,Set,location:{hash:''}});
  runInContext(content,context);runInContext(renderer,context);
  return data.innerHTML;
}
const card=(html,id)=>html.match(new RegExp('<a class="st[^>]*id="st-'+id+'"[^>]*>'))?.[0]||'';

test('a cohort card carries its video section so the post window can play just that part',()=>{
  const url='https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const html=cards([
    {id:1,anchor:'st-1',title:'구간',cohort:7,date:'2026. 08. 20',video:{url,dur:'8:05',start:90,end:575}},
    {id:2,anchor:'st-2',title:'시작만',cohort:7,date:'2026. 08. 20',video:{url,start:90}},
    {id:3,anchor:'st-3',title:'이상한 구간',cohort:7,date:'2026. 08. 20',video:{url,start:'"><b>',end:-5}},
    {id:4,anchor:'st-4',title:'구간 없음',cohort:7,date:'2026. 08. 20',video:{url}}]);
  assert.match(card(html,1),/data-yt="https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ" data-yt-start="90" data-yt-end="575"/);
  assert.match(card(html,2),/data-yt="[^"]+" data-yt-start="90" style=/);
  assert.match(card(html,3),/data-yt="[^"]+" style=/);   // 숫자가 아닌 값은 버림
  assert.match(card(html,4),/data-yt="[^"]+" style=/);
  assert.doesNotMatch(html,/<b>/);
});

test('the cohort post window embeds the video from its start to its end',()=>{
  const start=cohortV3.indexOf('  function ytEmbed(');
  assert.ok(start>0);
  const ytEmbed=vm.runInNewContext(cohortV3.slice(start,cohortV3.indexOf('  function fill(){',start))+'\nytEmbed');
  const base='https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1';
  assert.equal(ytEmbed('dQw4w9WgXcQ',{ytFrom:'90',ytTo:'575'}),base+'&start=90&end=575');
  assert.equal(ytEmbed('dQw4w9WgXcQ',{ytFrom:'90',ytTo:null}),base+'&start=90');
  assert.equal(ytEmbed('dQw4w9WgXcQ',{ytFrom:null,ytTo:'600'}),base+'&end=600');
  assert.equal(ytEmbed('dQw4w9WgXcQ',{}),base);
  assert.equal(ytEmbed('dQw4w9WgXcQ',{ytFrom:'x&mute=1',ytTo:'-1'}),base);
  assert.equal(ytEmbed('dQw4w9WgXcQ',{ytFrom:'600',ytTo:'300'}),base+'&start=600');
});
