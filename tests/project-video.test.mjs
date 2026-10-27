import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function start(specs){
  class El{
    constructor(tag,cls=''){this.tagName=tag.toUpperCase();this.className=cls;this.children=[];this.attrs={};this.events={};this.isConnected=true;this.hidden=false;this.paused=true;this.plays=0;this.pauses=0;this.loads=[];this.textContent='';this.dataset={};
      this.classList={contains:c=>this.className.split(/\s+/).includes(c),add:c=>this.classList.toggle(c,true),toggle:(c,on)=>{const all=new Set(this.className.split(/\s+/).filter(Boolean));if(on??!all.has(c))all.add(c);else all.delete(c);this.className=[...all].join(' ');}};}
    get firstChild(){return this.children[0]||null;}
    append(...nodes){nodes.forEach(n=>{if(n.parentElement)n.parentElement.children=n.parentElement.children.filter(c=>c!==n);n.parentElement=this;this.children.push(n);});}
    insertBefore(node,before){if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(c=>c!==node);node.parentElement=this;const i=this.children.indexOf(before);this.children.splice(i<0?this.children.length:i,0,node);}
    setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
    closest(){return this.project;}
    matches(selector){if(selector==='source[src]')return this.tagName==='SOURCE'&&this.getAttribute('src')!==null;if(selector==='svg.illu')return this.tagName==='SVG'&&this.classList.contains('illu');if(selector[0]==='.')return this.classList.contains(selector.slice(1));return this.tagName===selector.toUpperCase();}
    querySelectorAll(selector){const match=e=>selector.split(',').some(s=>e.matches(s));return this.children.flatMap(c=>[...(match(c)?[c]:[]),...c.querySelectorAll(selector)]);}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    addEventListener(type,fn){(this.events[type]??=[]).push(fn);}fire(type){(this.events[type]||[]).forEach(fn=>fn());}
    play(){this.plays++;this.paused=false;return this.rejectPlay?{catch:fn=>fn()}:Promise.resolve();}pause(){this.pauses++;this.paused=true;}load(){this.loads.push(this.getAttribute('src'));}
  }
  const heroes=specs.map((spec,i)=>{const h=new El('div','ivhero pjhero');h.project={id:'pj-p'+(i+1)};h.append(new El('span','ivtag'));if(spec.visual)h.append(new El(spec.visual==='img'?'img':spec.visual==='svg'?'svg':'div',spec.visual==='img'?'illu':spec.visual==='svg'?'illu':spec.visual));if(spec.yt)h.setAttribute('data-pj-yt',spec.yt);if(spec.video){const v=new El('video');if(spec.src!==undefined)v.setAttribute('src',spec.src);if(spec.source){const s=new El('source');s.setAttribute('src',spec.source);v.append(s);}h.append(v);}return h;});
  const events={},document={hidden:false,baseURI:'https://example.test/stories/projects.html',addEventListener:(t,f)=>(events[t]??=[]).push(f),getElementById:()=>null,querySelectorAll:()=>heroes.filter(h=>h.isConnected),querySelector:()=>new El('main'),createElement:t=>new El(t)};
  const context={document,window:{addEventListener(){},removeEventListener(){}},URL,Set,location:{hash:'#pj-p1'},addEventListener:(t,f)=>(events[t]??=[]).push(f),MutationObserver:class{constructor(fn){context.mutate=fn;}observe(){}}};
  vm.runInNewContext(readFileSync(new URL('../common/js/public-content.js',import.meta.url),'utf8'),context);
  const before=heroes.map(h=>h.children.slice());vm.runInNewContext(readFileSync(new URL('../stories/js/project-video.js',import.meta.url),'utf8'),context);
  return {heroes,before,document,context,El,fire:t=>(events[t]||[]).forEach(fn=>fn())};
}

test('without a video address every hero shows the preparation stage, keeping its photo, gallery, thumbnail or illustration hidden',()=>{
  // 2026-10-27 사용자 요청: 시연 영상이 없으면 썸네일 · 사진이 있어도 '시연 영상을 준비하고 있어요'
  const ui=start([{visual:'img'},{visual:'phs'},{visual:'pjthumb'},{visual:'svg'},{visual:'img',video:true,src:''}]);
  ui.heroes.forEach((h,i)=>{
    const stage=h.querySelector('.pj-video-stage');
    assert.ok(stage);assert.equal(stage.hidden,false);assert.equal(stage.dataset.state,'empty');assert.equal(h.classList.contains('pj-video'),true);
    ui.before[i].forEach(node=>assert.ok(h.children.includes(node)||stage.children.includes(node),'기존 그림 · 꼬리표는 그대로(숨김만)'));
    assert.equal(h.querySelector('.pj-video-message').textContent,'시연 영상을 준비하고 있어요.');
  });
  assert.equal(ui.heroes[4].querySelector('video').loads.length,0);
});

test('a hero with a YouTube demo (data-pj-yt) is left to the renderer',()=>{
  const ui=start([{visual:'pjthumb',yt:'dQw4w9WgXcQ'}]),h=ui.heroes[0];
  assert.deepEqual(h.children,ui.before[0]);assert.equal(h.querySelector('.pj-video-stage'),null);assert.equal(h.classList.contains('pj-video'),false);
});

test('a sourced demo selects video while retaining the same fallback image and badge',()=>{
  const ui=start([{visual:'img',video:true,src:'assets/demo.mp4'}]),h=ui.heroes[0],photo=ui.before[0][1],badge=ui.before[0][0],video=h.querySelector('video');
  assert.equal(h.firstChild.className,'pj-video-stage');assert.ok(h.children.includes(photo)&&h.children.includes(badge));assert.equal(h.children.indexOf(photo)>h.children.indexOf(h.firstChild),true);
  assert.equal(video.controls,true);assert.equal(video.playsInline,true);assert.equal(video.muted,true);assert.equal(video.plays,1);assert.equal(video.loads.length,1);
  video.fire('loadeddata');assert.equal(h.querySelector('.pj-video-message').hidden,true);
});

test('source elements retain photo albums, controls and their attached handlers',()=>{
  const ui=start([{visual:'phs',video:true,source:'https://example.test/demo.webm'}]),h=ui.heroes[0],album=ui.before[0][1];album.onclick=()=>42;ui.context.mutate();
  assert.equal(h.querySelector('.phs'),album);assert.equal(album.onclick(),42);assert.equal(h.querySelector('source').getAttribute('src'),'https://example.test/demo.webm');
});

test('the network-free preparation stage stays when photos arrive, until a video address plays',()=>{
  const ui=start([{}]),h=ui.heroes[0],video=h.querySelector('video'),stage=h.querySelector('.pj-video-stage');
  assert.equal(stage.dataset.state,'empty');assert.equal(video.loads.length,0);assert.equal(video.plays,0);assert.equal(video.hidden,true);
  const image=new ui.El('img','illu');h.append(image);ui.context.mutate();assert.equal(stage.hidden,false);assert.equal(stage.dataset.state,'empty');assert.equal(h.classList.contains('pj-video'),true);assert.equal(h.querySelector('img'),image);
  video.setAttribute('src','demo.mp4');ui.context.mutate();assert.equal(stage.hidden,false);assert.equal(video.plays,1);assert.equal(h.querySelector('img'),image);
});

test('the renderer blank placeholder (a single rect) still gets the preparation stage',()=>{
  const ui=start([{visual:'svg'}]),h=ui.heroes[0],svg=ui.before[0][1];svg.append(new ui.El('rect'));
  const fresh=start([{visual:'svg'}]);fresh.heroes[0].children[1].append(new fresh.El('rect'));fresh.context.mutate();
  const stage=fresh.heroes[0].querySelector('.pj-video-stage');assert.ok(stage);assert.equal(stage.hidden,false);assert.equal(stage.dataset.state,'empty');assert.equal(fresh.heroes[0].classList.contains('pj-video'),true);
  const early=h.querySelector('.pj-video-stage');assert.ok(early);assert.equal(early.dataset.state,'empty');   // 그림이 있어도 같은 준비 화면
});

test('unsafe video addresses are cleared without replacing images; source removal goes back to the preparation stage',()=>{
  const bad=start([{visual:'img',video:true,src:'javascript:alert(1)'}]),h=bad.heroes[0];assert.equal(h.querySelector('video').getAttribute('src'),null);assert.ok(h.querySelector('img'));assert.equal(h.querySelector('video').plays,0);assert.equal(h.querySelector('.pj-video-stage').dataset.state,'error');assert.equal(h.classList.contains('pj-video'),true);
  const good=start([{visual:'img',video:true,src:'demo.mp4'}]),hero=good.heroes[0],video=hero.querySelector('video');video.removeAttribute('src');good.context.mutate();assert.equal(hero.querySelector('.pj-video-stage').hidden,false);assert.equal(hero.querySelector('.pj-video-stage').dataset.state,'empty');assert.ok(hero.querySelector('img'));assert.equal(hero.classList.contains('pj-video'),true);
});

test('navigation and hidden tabs pause playback; autoplay rejection leaves an explicit start button',()=>{
  const ui=start([{visual:'img',video:true,src:'one.mp4'},{visual:'img',video:true,src:'two.mp4'}]),one=ui.heroes[0].querySelector('video'),two=ui.heroes[1].querySelector('video');
  assert.equal(one.plays,1);assert.equal(two.plays,0);two.rejectPlay=true;ui.context.location.hash='#pj-p2';ui.fire('hashchange');assert.equal(one.paused,true);assert.equal(two.plays,1);assert.equal(ui.heroes[1].querySelector('.pj-video-start').hidden,false);
  ui.document.hidden=true;ui.fire('visibilitychange');assert.equal(two.paused,true);ui.fire('pagehide');assert.ok(one.paused&&two.paused);
});
