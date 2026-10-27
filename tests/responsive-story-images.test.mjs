import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const code = file => readFileSync(new URL('../'+file, import.meta.url), 'utf8');
function element() { return {innerHTML:'',inserted:'',querySelector(){return null;},querySelectorAll(){return [];},setAttribute(){},insertAdjacentHTML(_,html){this.inserted+=html;}}; }
function render(data) {
  const projectGrid=element(),projectList=element(),projectPane=element(),projectHub=element();
  const interviewGrid=element(),interviewList=element(),interviewPane=element(),interviewHub=element(),interviewHero=element();
  const reviews=element(),cohorts=element(),cohortHub=element(),page=element();
  projectPane.querySelector=s=>({'.pjgrid':projectGrid,'.pjlist':projectList}[s]||null);
  interviewPane.querySelector=s=>({'.ivgrid':interviewGrid,'.ivlist':interviewList}[s]||null);
  interviewHub.querySelector=s=>s==='.hb-ivf'?interviewHero:null;
  page.querySelector=s=>({'#p-pr':projectPane,'#p-iv':interviewPane,'.hb-pjs':projectHub,'.hb-ivg':interviewHub,'.hb-mos':cohortHub}[s]||null);
  page.classList={contains:s=>s==='stories-hub'};
  const window={STORIES_DATA:data,addEventListener(){},removeEventListener(){}};
  const document={baseURI:'https://example.test/stories/projects.html',querySelector:()=>page,
    getElementById:s=>({'hub-review-dialogs':reviews,'cv3-data':cohorts}[s]||null),addEventListener(){},
    createElement:()=>({innerHTML:'',content:{childNodes:[],children:[]}})};
  const context=vm.createContext({window,document,URL,Set,location:{hash:''}});
  vm.runInContext(code('common/js/public-content.js'),context);
  vm.runInContext(code('stories/js/stories-render.js'),context);
  return {cards:projectGrid.innerHTML,details:projectList.inserted,projectHub:projectHub.innerHTML,
    interviews:interviewGrid.innerHTML,interviewDetails:interviewList.inserted,hubHero:interviewHero.inserted,
    hubList:interviewHub.inserted,reviews:reviews.innerHTML,cohorts:cohorts.innerHTML,cohortHub:cohortHub.innerHTML};
}
function photo(extra={}) { return {src:'/media/full.jpg',w:1280,h:720,alt:'Example image',
  srcset:[{src:'/media/full.jpg',w:1280},{src:'/media/small.jpg',w:320},{src:'/media/medium.webp',w:640}],...extra}; }
function project(image) { return {id:1,anchor:'pj-p1',title:'Example project',thumb:image}; }
const images=html=>[...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);

test('API image candidates are sorted, retain the original URL and metadata, and support mixed formats',()=>{
  const data={projects:[project(photo())]},before=JSON.stringify(data),out=render(data);
  const img=images(out.cards)[0];
  assert.match(img,/src="\/media\/full.jpg"/);
  assert.match(img,/srcset="\/media\/small.jpg 320w, \/media\/medium.webp 640w, \/media\/full.jpg 1280w"/);
  assert.match(img,/sizes="[^"]*100vw[^"]*360px"/);
  assert.match(img,/loading="lazy" decoding="async"/);
  assert.match(img,/width="1280" height="720"/);
  assert.match(images(out.details)[0],/sizes="[^"]*960px"/);
  assert.equal(JSON.stringify(data),before,'rendering must not mutate API data');
});

test('unsafe URLs, srcset separators, invalid widths and duplicate candidates never reach the attribute',()=>{
  const srcset=[null,{src:'javascript:alert(1)',w:20},{src:'data:image/png;base64,AAAA',w:40},
    {src:'/media/a.jpg,https://evil.test/x',w:100},{src:'/media/a.jpg 320w',w:110},
    {src:'/media/small.jpg',w:320},{src:'/media/duplicate.jpg',w:320},{src:'/media/small.jpg',w:640},
    {src:'/media/a"b.png?x=1&y=2',w:640},{src:'/media/full.jpg',w:1280}];
  const out=render({projects:[project(photo({srcset}))]}),img=images(out.cards)[0];
  assert.match(img,/srcset="\/media\/small.jpg 320w, \/media\/a&quot;b.png\?x=1&amp;y=2 640w, \/media\/full.jpg 1280w"/);
  assert.doesNotMatch(img,/javascript:|data:image|evil.test|bad.jpg|duplicate.jpg|NaN|Infinity| onerror=/);
  for(const w of [0,-1,1.5,'640',NaN,Infinity,20000,2560]) {
    const result=render({projects:[project(photo({srcset:[{src:'/media/bad.jpg',w}]}))]});
    assert.doesNotMatch(result.cards,/bad.jpg|srcset=/);
  }
});

test('missing, empty or malformed srcset leaves ordinary images on their original src',()=>{
  for(const srcset of [undefined,[],null,'/media/new.jpg 640w',[{src:'javascript:x',w:320}]]) {
    const out=render({projects:[project(photo({srcset}))]}),img=images(out.cards)[0];
    assert.match(img,/src="\/media\/full.jpg"/);
    assert.doesNotMatch(img,/srcset=|sizes=/);
  }
  const invalid=render({projects:[project(photo({src:'javascript:alert(1)'}))]});
  assert.doesNotMatch(invalid.cards,/\/media\/|srcset=|javascript:/);
});

test('interview card, large detail and hub clones retain responsive candidates at their own sizes',()=>{
  const one={id:1,anchor:'iv-p1',title:'First',img:photo(),imgLarge:photo()};
  const two={id:2,anchor:'iv-p2',title:'Second',img:photo()};
  const out=render({interviews:[one,two]});
  for(const html of [out.interviews,out.interviewDetails,out.hubHero,out.hubList])assert.match(html,/srcset="[^"]*640w[^"]*1280w"/);
  assert.match(out.interviews,/sizes="\(max-width: 640px\) 64px, 304px"/);
  assert.match(out.interviewDetails,/sizes="[^"]*720px"/);
  assert.match(out.hubHero,/sizes="[^"]*538px"/);
  assert.match(out.hubList,/sizes="\(max-width: 640px\) 104px, 140px"/);
});

test('review and cohort albums preserve candidates and reserve dimensions without lazily delaying the first slide',()=>{
  const first=photo(),second=photo({src:'/media/second.jpg',srcset:[{src:'/media/second-640.jpg',w:640},{src:'/media/second.jpg',w:1280}]});
  const out=render({reviews:[{id:1,anchor:'r-p1',title:'Review',body:['Example'],photos:[first,second]}],
    cohorts:[{id:1,anchor:'st-1',cohort:7,title:'Cohort',body:['Example'],img:first,photos:[first,second]}]});
  const slides=images(out.reviews);
  assert.match(slides[0],/srcset="[^"]*320w/);
  assert.match(slides[0],/decoding="async"/);
  assert.doesNotMatch(slides[0],/loading="lazy"/);
  assert.match(slides[1],/loading="lazy" decoding="async"/);
  assert.match(slides[0],/width="1280" height="720"/);
  assert.match(out.cohorts,/<div data-story-photos hidden>[\s\S]*srcset="[^"]*640w/);
});

test('candidate processing stays bounded and does not invent derivatives when a list is empty',()=>{
  const srcset=Array.from({length:40},(_,i)=>({src:'/media/image-'+(i+1)+'.jpg',w:(i+1)*20}));
  const img=images(render({projects:[project(photo({srcset}))]}).cards)[0];
  const candidates=img.match(/srcset="([^"]*)"/)[1].split(', ');
  assert.equal(candidates.length,17,'at most sixteen API candidates plus the verified original');
  assert.equal(candidates[16],'/media/full.jpg 1280w');
  assert.doesNotMatch(img,/image-17.jpg/);
});

test('derivative-only API candidates retain the larger original for high-density detail screens',()=>{
  const image=photo({src:'/media/original.jpg',w:2000,h:1125,srcset:[{src:'/media/1280.webp',w:1280},{src:'/media/640.webp',w:640}]});
  const data={projects:[project(image)]},before=JSON.stringify(data),out=render(data);
  for(const html of [out.cards,out.details])assert.match(html,/srcset="\/media\/640.webp 640w, \/media\/1280.webp 1280w, \/media\/original.jpg 2000w"/);
  assert.equal(JSON.stringify(data),before);
  for(const original of [{src:'/media/a,b.jpg',w:2000},{src:'/media/a b.jpg',w:2000},{w:2000.5},{w:20000},{w:0}]){
    const img=images(render({projects:[project({...image,...original})]}).details)[0];
    assert.doesNotMatch(img,/srcset="[^"]*original.jpg [\d.]+w|srcset="[^"]*\/media\/a[ ,]b.jpg/);
  }
  const repeated=images(render({projects:[project({...image,src:'/media/1280.webp'})]}).cards)[0];
  assert.equal((repeated.match(/\/media\/1280.webp \d+w/g)||[]).length,1);
});


test('portrait descriptors use actual candidate widths instead of longest-edge filename suffixes',()=>{
  const image=photo({h:1920,srcset:[{src:'/media/portrait-640.jpg',w:426},{src:'/media/portrait-1280.png',w:853},{src:'/media/full.jpg',w:1280}]});
  const img=images(render({projects:[project(image)]}).cards)[0];
  assert.match(img,/srcset="\/media\/portrait-640.jpg 426w, \/media\/portrait-1280.png 853w, \/media\/full.jpg 1280w"/);
  assert.match(img,/width="1280" height="1920"/);
});

test('project and cohort hub photos select candidates for card and mosaic slots',()=>{
  const out=render({projects:[{...project(null),img:photo()}],cohorts:[1,2].map(id=>({id,anchor:'st-'+id,cohort:id,title:'Cohort',img:photo()}))});
  assert.match(out.projectHub,/sizes="[^"]*360px"/);
  const mosaic=images(out.cohortHub);
  assert.match(mosaic[0],/srcset="[^"]*640w/);
  assert.match(mosaic[0],/sizes="[^"]*616px"/);
  assert.match(mosaic[1],/sizes="[^"]*308px"/);
  assert.doesNotMatch(out.projectHub+out.cohortHub,/104px, 140px/);
});
