import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const data = JSON.parse(await readFile(new URL('src/content.json', root), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external = href => {if (!/^https?:\/\//.test(href)) throw Error('Invalid link');return esc(href);};
const arrow = '<span aria-hidden="true">↗</span>';
const courses = data.courses.map((c,i) => `<article class="course" data-mode="${esc(c.mode)}"><a class="course-image" href="${external(c.href)}" target="_blank" rel="noopener noreferrer"><img src="assets/${esc(c.image)}" alt="${esc(c.name)} 과정 캐릭터" loading="lazy"><span class="badge ${c.state === '모집 중'?'open':''}">${esc(c.state)}</span><span class="course-no">0${i+1}</span></a><div class="course-body"><p class="eyebrow">${esc(c.en)}</p><h3>${esc(c.name)}</h3><div class="course-meta"><span>${c.mode==='hybrid'?'온/오프라인 혼합':'100% 온라인'}</span><span>모집기간 ${esc(c.period)}</span></div><a class="btn apply" href="${external(c.href)}" target="_blank" rel="noopener noreferrer">${esc(c.action)} ${arrow}</a></div></article>`).join('\n');
const stories = data.stories.map((s,i)=>`<a class="story" href="https://brunch.co.kr/@estcamp/${i+1}" target="_blank" rel="noopener noreferrer"><div class="story-image"><img src="assets/story-${i+1}.jpg" alt="" loading="lazy"><span class="badge">${esc(s.type)}</span></div><div class="story-body"><span class="eyebrow">ESTCAMP STORY / 0${i+1}</span><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p><span class="text-link">자세히 보기 ${arrow}</span></div></a>`).join('\n');
let html = await readFile(new URL('src/page.html',root),'utf8');
html=html.replace('<!-- COURSES -->',courses).replace('<!-- STORIES -->',stories);
const out = new URL('index.html',root);
if(process.argv.includes('--check')) {if(await readFile(out,'utf8')!==html) throw Error('Run npm run build');console.log('ESTcamp generated page matches source');}
else {await writeFile(out,html);console.log('Built ESTcamp concept');}
