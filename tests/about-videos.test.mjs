import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../about/js/about.js', import.meta.url), 'utf8');
const start = source.indexOf('(() => {', source.indexOf('// 이전 기수 프로젝트 영상'));
const controller = source.slice(start, source.indexOf('/* 오른쪽 플로팅 목차', start));

function fixture({documentary = true} = {}) {
  let focused;
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.events = {}; this.dataset = {}; }
    append(...nodes) { nodes.forEach(node => { node.parent = this; this.children.push(node); }); }
    replaceChildren(...nodes) { this.children.forEach(node => { node.parent = null; }); this.children = []; this.append(...nodes); }
    replaceWith(node) { const p = this.parent, index = p.children.indexOf(this); p.children[index] = node; node.parent = p; this.parent = null; }
    setAttribute(k, v) { this.attrs[k] = v; }
    getAttribute(k) { return this.attrs[k]; }
    querySelector(selector) { return this.children.find(n => selector === 'iframe' ? n.tag === 'iframe' : n.className === selector.slice(1)) || null; }
    addEventListener(name, fn) { this.events[name] = fn; }
    click() { this.events.click(); }
    focus() { focused = this; }
  }
  const page = new Element('main'), projects = [new Element('div'), new Element('div')];
  projects.forEach((p, i) => {
    const frame = new Element('iframe'); frame.src = `https://www.youtube-nocookie.com/embed/${['HEjp95ZGBt0', 'r8o3l-JAYLo'][i]}`; frame.title = '프로젝트 ' + i; p.append(frame);
  });
  const box = new Element('button'); box.dataset.yt = 'sJzqrR93duI'; box.setAttribute('aria-label', 'EBS 영상 재생');
  page.append(...projects, ...(documentary ? [box] : []));
  vm.runInNewContext(controller, {
    URL, location:{protocol:'https:',origin:'https://example.test',href:'https://example.test/about/index.html'},
    document:{querySelectorAll:() => projects, querySelector:() => documentary ? box : null, createElement:tag => new Element(tag)},
  });
  const frames = node => node.children.flatMap(child => child.tag === 'iframe' ? [child] : frames(child));
  return {page, box, projects, frames:() => frames(page), focused:() => focused};
}

test('project and documentary switches unload the old player and restore replayable posters', () => {
  const f = fixture();
  const play = [() => f.box.click(), ...f.projects.map(p => () => p.querySelector('.activity-project-file-video').click())];
  const oldFrames = [];
  for (const index of [0, 1, 2, 0, 2, 1, 0, 1, 2, 0]) {
    oldFrames.push(...f.frames());
    play[index]();
    assert.equal(f.frames().length, 1, 'only the newest iframe stays in the page');
    assert.doesNotMatch(f.frames()[0].allow, /\bweb-share\b/);
    assert.match(f.frames()[0].allow, /autoplay/);
    assert.equal(f.frames()[0].allowFullscreen, true);
    assert.equal(f.focused(), f.frames()[0]);
    assert.ok(oldFrames.every(frame => !f.frames().includes(frame)), 'no previous player survives');
    for (let i = 0; i < f.projects.length; i++) {
      if (index !== i + 1) assert.equal(f.projects[i].children[0].tag, 'button');
    }
  }
  assert.equal(f.frames()[0].title, 'EBS 영상');
});

test('projects remain mutually exclusive when the documentary is absent', () => {
  const f = fixture({documentary:false});
  for (let i = 0; i < 20; i++) {
    f.projects[i % 2].querySelector('.activity-project-file-video').click();
    assert.equal(f.frames().length, 1);
  }
});
