import { readFile, writeFile, access } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const data=JSON.parse(await read('src/content.json'));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external=href=>{if(!/^https?:\/\//.test(href))throw Error('Invalid URL');return esc(href);};
const courses=data.courses.map((c,i)=>`<article class="course ${i===0?'course-spotlight':''}" data-mode="${esc(c.mode)}"><a class="course-image" href="${external(c.href)}" target="_blank" rel="noopener noreferrer"><img src="assets/${esc(c.image)}" alt="${esc(c.name)} 과정 캐릭터"><span class="badge ${c.state==='모집 중'?'open':''}">${esc(c.state)}</span><span class="course-no">0${i+1}</span></a><div class="course-body"><p class="eyebrow">${esc(c.en)}</p><h3>${esc(c.name)}</h3>${i===0?'<p class="spotlight-caption">이스트소프트 부트캠프<br>온·오프라인에서 만나는 AI 휴먼 과정.</p>':''}<div class="course-meta"><span>${c.mode==='hybrid'?'온/오프라인 혼합':'100% 온라인'}</span><span>모집기간 ${esc(c.period)}</span></div><a class="btn apply" href="${external(c.href)}" target="_blank" rel="noopener noreferrer">${esc(c.action)} <span aria-hidden="true">↗</span></a></div></article>`).join('\n');
const stories=data.stories.map((s,i)=>`<a class="story journal-card journal-${i+1}" data-story="${i<2?'camp':'interview'}" href="https://brunch.co.kr/@estcamp/${i+1}" target="_blank" rel="noopener noreferrer"><div class="story-image"><img src="assets/story-${i+1}.jpg" alt=""><span class="badge">${esc(s.type)}</span></div><div class="story-body"><span class="eyebrow">ESTCAMP JOURNAL / 0${i+1}</span><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p><span class="text-link">자세히 보기 <span aria-hidden="true">↗</span></span></div></a>`).join('\n');
const configs=[
 {key:'home',file:'index.html',title:'나의 다음은, 이스트캠프',source:'home',label:'HOME'},
 {key:'courses',file:'courses.html',title:'모집과정',source:'courses',label:'COURSES',number:'01',heading:'나의 다음을 만드는 <em>모집과정.</em>',lead:'AI부터 개발·보안까지, 나에게 맞는 배움을 찾아보세요.',anchors:[['bootcamp','이스트소프트 부트캠프'],['programs','함께하는 교육']]},
 {key:'stories',file:'stories.html',title:'이스트캠프 이야기',source:'stories',label:'STORIES',number:'02',heading:'이스트캠프의 <em>생생한 이야기.</em>',lead:'캠프의 사람들, 배움의 과정, 그리고 커리어의 다음.',anchors:[['all-stories','전체 이야기'],['interviews','릴레이 인터뷰']]},
 {key:'check',file:'check.html',title:'지원 전 체크',source:'check',label:'BEFORE YOU START',number:'03',heading:'시작하기 전, <em>함께 체크.</em>',lead:'지원 대상부터 교육 참여 조건까지, 하나씩 확인해 보세요.',anchors:[['eligibility','교육 신청 대상'],['recommend','추천 대상'],['contact','상담 신청']]}
];
const shell=await read('src/page.html'),header=await read('src/header.html'),footer=await read('src/footer.html');
const built=new Map();
for(const config of configs){
 let body=(await read(`src/${config.source}.html`)).replace('<!-- COURSES -->',courses).replace('<!-- STORIES -->',stories);
 if(body.includes('<!-- PROGRAMS -->'))body=body.replace('<!-- PROGRAMS -->',await read('src/programs.html'));
 if(config.key==='stories')body=body.replace('class="story journal-card journal-3"','id="interviews" class="story journal-card journal-3"');
 if(config.key!=='home'){
  const banner=`<div class="page-intro wrap"><div class="breadcrumb"><a href="index.html">HOME</a><span>/</span><span>${config.title}</span></div><div class="page-banner banner-${config.key}"><div><p class="eyebrow">${config.number} / ${config.label}</p><h1>${config.heading}</h1><p>${config.lead}</p></div><div class="banner-art" aria-hidden="true">${config.key==='stories'?'<span class="paper-note">Real<br>Stories! ↙</span>':config.key==='courses'?'<span class="banner-number">05</span><span class="banner-caption">FIND YOUR<br>NEXT ↗</span>':'<span class="banner-check-icon">✓</span><span class="banner-caption">READY,<br>SET, NEXT!</span>'}</div><nav class="corner-tabs" aria-label="관련 페이지"><a href="courses.html">모집과정</a><a href="stories.html">이야기</a><a href="check.html">지원 전 체크</a></nav></div></div>`;
  const side=`<aside class="page-side"><nav aria-label="${config.title} 페이지 목차"><p>${config.label}</p>${config.anchors.map(([id,title])=>`<a href="#${id}">${title}<span>↗</span></a>`).join('')}<a class="side-other" href="${config.key==='check'?'courses.html':'check.html'}">${config.key==='check'?'모집과정 살펴보기':'지원 전 체크하기'} →</a></nav></aside>`;
  const next=config.key==='courses'?['stories.html','02','이스트캠프 이야기','과정을 살펴봤다면, 이제 캠프 안의 이야기를 만나보세요.']:config.key==='stories'?['check.html','03','지원 전 체크','나의 시작을 위한 조건을 하나씩 확인해 보세요.']:['courses.html','01','모집과정','준비가 됐다면, 나에게 맞는 과정을 찾아보세요.'];
  body=banner+`<div class="page-layout wrap">${side}<div class="page-content">${body}<a class="next-band" href="${next[0]}"><span class="next-number">${next[1]}</span><div><small>다음으로</small><strong>${next[2]}</strong><p>${next[3]}</p></div><span class="next-arrow">↗</span></a></div></div>`;
 }
 let html=shell.replace('{{TITLE}}',config.title).replace('{{PAGE}}',config.key).replace('{{HEADER}}',header.replaceAll(`data-page-link="${config.key}"`,`data-page-link="${config.key}" aria-current="page"`)).replace('{{BODY}}',body).replace('{{FOOTER}}',footer);
 built.set(config.file,html);
}
for(const [file,html] of built){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)throw Error(`Duplicate ID in ${file}`);
 for(const [,href] of html.matchAll(/(?:href|src)="([^" ]+)"/g)){
  if(/^(https?:|mailto:)/.test(href))continue;
  const [target,hash]=href.split('#');
  const targetHtml=target?built.get(target):html;
  if(hash&&targetHtml&&!targetHtml.includes(`id="${hash}"`))throw Error(`Missing anchor ${file}: ${href}`);
  if(target&&!built.has(target))await access(new URL(target,root));
 }
 if(process.argv.includes('--check')){if(await read(file)!==html)throw Error(`Run build: ${file}`);}else await writeFile(new URL(file,root),html);
}
console.log(`${process.argv.includes('--check')?'Checked':'Built'} ${built.size} ESTcamp pages, local links and unique IDs.`);
