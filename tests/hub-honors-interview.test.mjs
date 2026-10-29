import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const renderer=readFileSync(new URL('../stories/js/stories-render.js',import.meta.url),'utf8');
const start=renderer.indexOf("    // 우수 수료생 대표는",renderer.indexOf("/* ── 한눈에 보기"));
const hub=renderer.slice(start,renderer.indexOf('    // 후기:',start));
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const iv=(id,extra={})=>({anchor:'iv-p'+id,title:'인터뷰 '+id,summary:'요약 '+id,author:'시험 작성자 '+id,img:{src:'assets/uploads/test-'+id+'.webp'},...extra});
function node(text=''){return {textContent:text,hidden:false,innerHTML:'',inserted:'',attributes:{},classList:{remove(){}},setAttribute(k,v){this.attributes[k]=v;},insertAdjacentHTML(_,html){this.inserted+=html;}};}
function render(interviews,featured=true){
  const box=node(),card=node(),photo=node(),title=node(),summary=node(),by=node(),label=node('우수 수료생 인터뷰');
  const fields={'.hb-ivf-ph':photo,h3:title,'.hb-ivf-q':summary,'.hb-by':by,em:label};
  const context={IV:interviews,photoIV:interviews.filter(v=>v.img?.src),hasPhoto:v=>!!v.img?.src,esc,who:v=>v.author,
    hubVisual:v=>'<img src="'+esc(v.img?.src||'default.webp')+'">',
    $:(selector,root)=>root===card?fields[selector]||null:root===box?(selector==='.hb-ivf'?card:null):selector==='.hb-ivg'?box:selector==='#hub-interviews[data-honors-feature]'&&featured?{}:null,
    $$:()=>[]};
  vm.runInNewContext(hub,context);
  return {box,card,photo,title,summary,by,label};
}

test('honors representative and three normal photo interviews use separate pools in data order',()=>{
  const out=render([iv(23,{honors:true,title:'<대표 인터뷰>'}),iv(99,{honors:true}),iv(98,{video:{yt:'abcdefghijk'}}),iv(14),iv(13),iv(12),iv(11)]);
  assert.equal(out.card.attributes.href,'interviews.html#iv-p23');
  assert.match(out.photo.innerHTML,/test-23.webp/);
  assert.equal(out.title.textContent,'<대표 인터뷰>');
  assert.equal(out.summary.textContent,'요약 23');
  assert.equal(out.by.textContent,'시험 작성자 23');assert.equal(out.by.hidden,false);
  assert.equal(out.label.textContent,'우수 수료생 인터뷰');
  assert.deepEqual([...out.box.inserted.matchAll(/href="interviews.html#(iv-p\d+)"/g)].map(m=>m[1]),['iv-p14','iv-p13','iv-p12']);
});

test('without an honors interview the existing placeholder stays alongside normal interviews',()=>{
  const out=render([iv(14),iv(13),iv(12)]);
  assert.equal(out.card.attributes.href,'interviews.html#iv-honors-1');
  assert.equal(out.title.textContent,'우수 수료생 인터뷰를 준비하고 있어요');
  assert.match(out.photo.innerHTML,/avatar-card-10-1080.webp/);
  assert.equal(out.by.hidden,true);assert.equal(out.by.textContent,'');
  assert.equal((out.box.inserted.match(/<li>/g)||[]).length,3);
});

test('honors-only and empty data never repeat honors in the normal list',()=>{
  const honors=render([iv(2,{honors:true}),iv(1,{honors:true})]);
  assert.equal(honors.card.attributes.href,'interviews.html#iv-p2');
  assert.doesNotMatch(honors.box.inserted,/<li>/);
  const empty=render([]);assert.equal(empty.card.attributes.href,'interviews.html#iv-honors-1');assert.doesNotMatch(empty.box.inserted,/<li>/);
});

test('a video honors interview can be featured while normal video interviews stay out of the side list',()=>{
  const out=render([iv(7,{honors:true,video:{yt:'abcdefghijk'}}),iv(6,{video:{yt:'abcdefghijk'}}),iv(5)]);
  assert.equal(out.card.attributes.href,'interviews.html#iv-p7');assert.match(out.box.inserted,/iv-p5/);assert.doesNotMatch(out.box.inserted,/iv-p6|iv-p7/);
});

test('legacy hubs without the honors feature keep the first interview plus the next three',()=>{
  const out=render([iv(4,{honors:true}),iv(3),iv(2),iv(1)],false);
  assert.equal(out.card.attributes.href,'interviews.html#iv-p4');assert.equal((out.box.inserted.match(/<li>/g)||[]).length,3);assert.doesNotMatch(out.box.inserted,/iv-p4/);
});

test('side-list titles and metadata are escaped',()=>{
  const out=render([iv(3,{honors:true}),iv(2,{title:'<script>bad</script>',author:'<name>'})]);
  assert.match(out.box.inserted,/&lt;script&gt;bad&lt;\/script&gt;/);assert.match(out.box.inserted,/&lt;name&gt;/);assert.doesNotMatch(out.box.inserted,/<script>|<name>/);
});

test('normal interviews without a stored cover do not fill the three-photo side list',()=>{
  const out=render([iv(9,{honors:true}),iv(8,{img:null}),iv(7),iv(6),iv(5)]);
  assert.deepEqual([...out.box.inserted.matchAll(/href="interviews.html#(iv-p\d+)"/g)].map(m=>m[1]),['iv-p7','iv-p6','iv-p5']);
});
