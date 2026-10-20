import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, loadContent } from './build.mjs';

const t = expression => '${' + expression + '}';
const value = field => t('s.' + field);
const loop = (list, fragment) => `<th:block th:each="s : \${${list}}"><th:block th:replace="~{public-site/story-fragments :: ${fragment}(\${s})}"></th:block></th:block>`;
const read = name => readFileSync(join(root,'src/components',name+'.html'),'utf8');
const svgOf = source => source.match(/<svg\b[\s\S]*?<\/svg>/)?.[0] || '';
const fallback = svgOf(read('stories/interviews/card-3'));
// Replace a balanced element; nested cards/SVG wrappers must not leak static records.
function replaceElement(source, pattern, replacement, outer=false) {
  const match=pattern.exec(source); if(!match)throw new Error('Design slot moved: '+pattern);
  const start=match.index, open=match[0], tag=/^<([a-z][\w-]*)/i.exec(open)[1];
  const tokens=new RegExp('<\\/?'+tag+'\\b[^>]*>','gi'); tokens.lastIndex=start+open.length;
  let depth=1,end;
  while((end=tokens.exec(source))) { depth+=end[0].startsWith('</')?-1:1; if(!depth)break; }
  if(!end)throw new Error('Unclosed design slot '+pattern);
  return source.slice(0,start)+(outer?replacement:open+replacement+end[0])+source.slice(tokens.lastIndex);
}
function replaceDetails(page,kind,content) {
  const pattern=new RegExp('<div class="'+(kind==='interview'?'ivd':'pjd')+'(?: [^"<>]*)?"[^>]*>');
  let first=true;
  while(pattern.test(page)) { page=replaceElement(page,pattern,first?content:'',true);first=false; }
  return page;
}
function media(source, field) {
  const image = `<img class="illu" th:src="${value(field)}" th:alt="${value('thumbnailAlt')}" loading="lazy" decoding="async" th:if="\${!#strings.isEmpty(s.${field})}">`;
  // Illustrations come only from the approved source components, never editor-supplied raw SVG.
  return source.replace(/<svg\b[^>]*class="illu"[\s\S]*?<\/svg>|<img\b[^>]*class="illu"[^>]*>/g, original => {
    const art = original.startsWith('<svg') ? original : fallback;
    return `<th:block th:if="\${#strings.isEmpty(s.${field})}">${art}</th:block>${image}`;
  });
}
function fields(source, record) {
  // Presentation metadata is build-owned; only escaped data fields remain in the Spring template.
  source = source.replace(/\{\{(view\.[\w.]+)\}\}/g, (_,path) => path.split('.').reduce((o,k)=>o[k],record));
  source = source.replace(/<([a-z][\w:-]*)([^<>]*?)>/g, (all,tag,attrs) => {
    const custom=[];
    attrs=attrs.replace(/([\w:-]+)="([^"<>]*\{\{[^"<>]*?)"/g, (_,name,content) => {
      const parts=content.split(/(\{\{[^{}]+\}\})/).filter(Boolean).map(part => part.startsWith('{{') ? value(part.slice(2,-2).trim()) : "'"+part.replaceAll("'","''")+"'");
      const expression=parts.join(' + ');
      if (['href','src','alt','id','class','style','title'].includes(name)) return `th:${name}="${expression}"`;
      custom.push(name+'='+expression); return '';
    });
    if(custom.length)attrs+=' th:attr="'+custom.join(',')+'"';
    return '<'+tag+attrs+'>';
  });
  source=source.replace(/>(\{\{[\w.]+\}\})(?=<\/)/g, (_,v) => '><th:block th:text="'+value(v.slice(2,-2))+'"></th:block>');
  source=source.replace(/\{\{([\w.]+)\}\}/g, (_,field) => '<th:block th:text="'+value(field)+'"></th:block>');
  if(source.includes('{{'))throw new Error('Unsupported story field');
  return source;
}
const questions=`<div class="qa"><div th:each="q, n : \${s.questions}" th:id="\${q.id}"><div class="q"><i th:text="\${n.count}"></i><span th:text="\${q.question}"></span></div><p class="a" th:text="\${q.answer}"></p></div></div>`;
const toc=`<ol><li th:each="q : \${s.questions}"><a th:href="'#' + \${q.id}" th:text="\${q.navLabel}"></a></li></ol>`;
function interview(source,record,detail) {
  if(detail) {
    if(source.includes('<div class="qa">'))source=replaceElement(source,/<div class="qa">/,questions,true);
    source=source.replace(/<ol>[\s\S]*?<\/ol>/,toc);
  }
  if(detail) {
    if(!source.includes('class="qa"'))source=source.replace(/<p class="ivnote">/,questions+'<p class="ivnote" th:if="${#lists.isEmpty(s.questions)}">');
    const art=svgOf(source)||fallback;
    const hero=`<div class="ivhero ivvid" th:attr="data-yt=\${s.youtubeId}"><span class="ivtag" th:text="\${s.byline}"></span><th:block th:if="\${#strings.isEmpty(s.heroImage)}">${art}</th:block><img class="illu" th:if="\${!#strings.isEmpty(s.heroImage)}" th:src="\${s.heroImage}" th:alt="\${s.thumbnailAlt}"><button class="ivplay" type="button" aria-label="인터뷰 영상 재생" th:if="\${!#strings.isEmpty(s.youtubeId)}"><i></i></button><span class="dur" th:if="\${!#strings.isEmpty(s.youtubeId)}" th:text="\${s.duration}"></span></div>`;
    source=replaceElement(source,/<div class="ivhero[^">]*"[^>]*>/,hero,true);
    const side=`<aside class="sidebox"><th:block th:if="\${!#lists.isEmpty(s.questions)}"><h3>이 인터뷰에서 묻는 것</h3>${toc}</th:block><th:block th:if="\${!#strings.isEmpty(s.youtubeId)}"><h3>이 영상</h3><dl class="ivmeta"><div><dt>길이</dt><dd th:text="\${s.duration}"></dd></div><div><dt>기수</dt><dd th:text="\${s.cohort} + '기'"></dd></div><div><dt>직군</dt><dd th:text="\${s.track}"></dd></div></dl><a class="ivyt" th:href="\${s.youtubeUrl}" target="_blank" rel="noopener">유튜브에서 보기 ↗</a></th:block></aside>`;
    source=replaceElement(source,/<aside class="sidebox">/,side,true);
  } else {
    source=source.replace(/^<a /,'<a data-interview-quote="{{quote}}" ');
    source=media(source,'thumbnail');
    if(!source.includes('class="dur"'))source=source.replace('<div class="ph">','<div class="ph"><span class="play" th:if="${!#strings.isEmpty(s.youtubeId)}"><i></i></span><span class="dur" th:if="${!#strings.isEmpty(s.youtubeId)}" th:text="${s.duration}"></span>');
    source=source.replace(/<span class="(?:play|dur)"(?! th:if)/g,all=>all.includes('th:if')?all:all.replace('<span','<span th:if="${!#strings.isEmpty(s.youtubeId)}"'));
  }
  if(detail)source=source.replace(/(<p class="lead"[^>]*>[\s\S]*?<\/p>)/,'$1<div class="story-extra-photos"><img th:each="photo : ${s.extraPhotos}" th:src="${photo.src}" th:alt="${photo.alt}" loading="lazy"></div>');
  return fields(source,record);
}
function project(source,record,detail) {
  source=source.replace(' data-cohort="{{cohort}}"','').replace(' data-subject="{{subject}}"','');
  // Static subject classification is not part of the current Spring API contract.
  source=source.replaceAll('{{subject}}','{{type}}').replace('data-field="subject"','data-field="type"');
  if(detail)source=source.replace('<dt>과정</dt>','<dt>유형</dt>').replace('<dt>기수·반</dt><dd>{{cohortClass}}</dd>','<dt>기간</dt><dd>{{duration}}</dd>');
  source=media(source,detail?'heroImage':'thumbnail');
  source=source.replace(/(<div class="(?:tags|pjtags)">)[\s\S]*?<\/div>/g,'$1<span th:each="tag : ${s.tags}" th:text="${tag}"></span></div>');
  if(detail) {
    source=replaceElement(source,/<div class="pjsec">/,'<section th:each="section : ${s.sections}"><h3 th:text="${section.h}"></h3><p class="pjph-t" th:text="${section.p}"></p></section>');
    source=source.replace(/<span class="pjno">[^<]*<\/span>/,'<span class="pjno" th:text="${s.number}"></span>');
    source=replaceElement(source,/<div class="pjnav">/,'<a th:if="${s.previous != null}" th:href="\'#\' + ${s.previous.id}"><small>이전 프로젝트</small><th:block th:text="${s.previous.name}"></th:block></a><a th:if="${s.next != null}" th:href="\'#\' + ${s.next.id}"><small>다음 프로젝트</small><th:block th:text="${s.next.name}"></th:block></a>');
    source=source.replace(/<p class="ivnote">[\s\S]*?<\/p>/,'<p class="ivnote" th:each="link : ${s.links}"><a th:href="${link.url}" th:text="${link.label}" target="_blank" rel="noopener"></a></p>');
  }
  if(detail)source=source.replace(/(<p class="lead"[^>]*>[\s\S]*?<\/p>)/,'$1<div class="story-extra-photos"><img th:each="photo : ${s.extraPhotos}" th:src="${photo.src}" th:alt="${photo.alt}" loading="lazy"></div>');
  return fields(source,record);
}
function cohort(source,record) {
  source=media(source,'thumbnail');
  source=source.replace(/href="\{\{href\}\}"/,'th:href="\'#\' + ${s.id}"');
  source=source.replace(/^<a /,'<a th:id="${s.id}" th:attr="data-yt=${s.youtubeUrl}" ');
  // The old variants can also declare data-yt; the generic attribute above owns it.
  source=source.replace(/ data-yt="\{\{youtubeUrl\}\}"/g,'');
  source=source.replace('</a>','<div data-story-body hidden><p th:each="paragraph : ${s.body}" th:text="${paragraph}"></p></div><div data-story-photos hidden><img th:each="photo : ${s.photos}" th:src="${photo.src}" th:alt="${photo.alt}"></div></a>');
  return fields(source,record);
}
function slotPage(page,kind,list,card,detail) {
  if(kind==='project') {
    page=replaceElement(page,/<div class="pj-filter-row">/,'',true);
    page=replaceElement(page,/<p class="pj-subject-empty"[^>]*>/,'',true);
    page=replaceElement(page,/<section class="pj-filter-empty"[^>]*>/,'',true);
    page=page.replace(/  <script src="js\/projects-filter\.js(?:\?[^"\s]*)?" defer><\/script>\n/,'');
  }
  const cardClass=kind==='cohort'?'st':kind==='interview'?'iv':'pjc';
  if(kind==='cohort')page=replaceElement(page,/<template id="cv3-data">/,loop(list,card));
  else page=replaceElement(page,new RegExp('<div class="'+(kind==='interview'?'ivgrid':'pjgrid')+'">'),loop(list,card));
  if(detail)page=replaceDetails(page,kind,loop(list,detail));
  page=page.replace('<html ','<html xmlns:th="http://www.thymeleaf.org" data-story-source="spring" ')
    .replace('<body>','<body th:attr="data-preview-anchor=${previewAnchor}">')
    .replace('</head>','<link rel="stylesheet" href="/stories/css/stories-live.css">\n<script src="/stories/js/stories-live.js" defer></script>\n</head>')
    .replace(/(href|src)="\.\.\/common\//g,'$1="/common/').replace(/(href|src)="(css|js)\//g,'$1="/stories/$2/');
  if(page.includes('<a class="'+cardClass+'" href="#'))throw new Error('Unreplaced static '+kind+' records');
  return page;
}
export function addStoryArtifacts(output, generated) {
  const content=loadContent(); const fragments=[];
  const kinds=[['interview','interviews',interview],['project','projects',project],['cohort','cohorts',cohort]];
  for(const [kind,collection,convert] of kinds) {
    const records=content.stories[collection];
    for(const part of (kind==='cohort'?['card']:['card','detail'])) {
      const name=kind+'-'+part;
      const variants=records.map((record,index)=>{
        const source=read(record.view[part].template);
        const html=convert(source,record,part==='detail');
        const fragment=name+'-'+index;
        fragments.push(`<th:block th:fragment="${fragment}(s)">${html}</th:block>`);
        return `<th:block th:case="'${record.id}'"><th:block th:replace="~{public-site/story-fragments :: ${fragment}(\${s})}"></th:block></th:block>`;
      });
      variants.push(`<th:block th:case="*"><th:block th:replace="~{public-site/story-fragments :: ${name}-0(\${s})}"></th:block></th:block>`);
      fragments.push(`<th:block th:fragment="${name}(s)"><th:block th:switch="\${s.id}">${variants.join('')}</th:block></th:block>`);
    }
    output.set('templates/public-site/'+collection+'.html',slotPage(generated.get('stories/'+collection+'.html'),kind,collection,kind+'-card',kind==='cohort'?null:kind+'-detail'));
  }
  output.set('templates/public-site/story-fragments.html','<!doctype html><html xmlns:th="http://www.thymeleaf.org"><body>'+fragments.join('\n')+'</body></html>');
  const reviewSeed=JSON.parse(output.get('review-seed.json')).map(r=>({...r,kind:'review'}));
  const seed=[...reviewSeed];
  const hubInterviews=['iv-1','iv-2','iv-3','iv-6'],hubProjects=['pj-1','pj-2','pj-5'];
  for(const [index,r] of content.stories.interviews.entries()) seed.push({kind:'interview',anchor:r.id,order:index,title:r.title,story:{
    anchor:r.id,cohort:r.cohort,author:r.author,track:r.track,summary:r.summary,quote:r.quote||'',
    kicker:r.id==='iv-1'?'비전공자라면':'',img:r.thumbnail?{src:r.thumbnail,alt:r.thumbnailAlt||''}:undefined,
    imgLarge:r.heroImage?{src:r.heroImage,alt:r.heroAlt||''}:undefined,
    video:r.youtubeId?{yt:r.youtubeId,dur:r.duration||''}:undefined,
    qa:(r.questions||[]).map(q=>({q:q.question,a:q.answer,toc:q.navLabel})),hubRank:hubInterviews.indexOf(r.id)>=0?hubInterviews.indexOf(r.id):undefined
  }});
  for(const [index,r] of content.stories.projects.entries()) seed.push({kind:'project',anchor:r.id,order:index,title:r.name,story:{
    anchor:r.id,headline:r.title,detailTitle:r.detailTitle,cardSummary:r.summary,summary:r.detailSummary,
    team:r.team,type:r.type,term:r.duration,tags:r.tags,
    sections:[r.section1,r.section2,r.section3].map((p,i)=>({h:['문제 정의','접근 방법','결과와 다음 단계'][i],p})),
    hubRank:hubProjects.indexOf(r.id)>=0?hubProjects.indexOf(r.id):undefined
  }});
  for(const [index,r] of content.stories.cohorts.entries()) {
    const selected=['cohort-story-5','cohort-story-7','cohort-story-12','cohort-story-14','cohort-story-16'];
    const rank=selected.includes(r.id)?selected.indexOf(r.id):undefined;
    seed.push({kind:'cohort',anchor:r.id,order:index,title:r.title,story:{anchor:r.id,cohort:parseInt(r.cohort,10),summary:r.summary,date:r.date,
      img:r.thumbnail?{src:r.thumbnail,alt:r.thumbnailAlt||''}:undefined,video:r.youtubeUrl?{url:r.youtubeUrl,dur:r.duration||''}:undefined,hubRank:rank}});
  }
  output.set('story-seed.json',JSON.stringify(seed,null,2)+'\n');
  // Replace complete hub bodies, preserving the accepted surrounding section layout.
  let hub=output.get('templates/public-site/stories.html');
  hub=replaceElement(hub,/<div class="hb-body hb-ivg">/,`<div class="hb-body hb-ivg"><th:block th:if="\${!#lists.isEmpty(hubInterviews)}"><a class="hb-ivf" th:href="'interviews.html#' + \${hubInterviews[0].id}"><img class="hb-ph" th:if="\${!#strings.isEmpty(hubInterviews[0].heroImage)}" th:src="\${hubInterviews[0].heroImage}" alt="" loading="lazy"><div class="hb-ivf-tx"><em th:text="\${hubInterviews[0].kicker}"></em><h3 th:text="\${hubInterviews[0].title}"></h3><p class="hb-ivf-q" th:text="\${hubInterviews[0].quote}"></p><span class="hb-by" th:text="\${hubInterviews[0].hubByline}"></span></div></a><ul class="hb-ivl" role="list"><li th:each="s,n : \${hubInterviews}" th:if="\${n.index > 0}"><a th:href="'interviews.html#' + \${s.id}"><span class="hb-ivl-ph"><img class="hb-ph" th:src="\${s.thumbnail}" alt="" loading="lazy"></span><div><h3 th:text="\${s.title}"></h3><span class="hb-by" th:text="\${s.hubByline}"></span></div></a></li></ul></th:block></div>`,true);
  // Keep the project illustrations by exporting their existing hub cards as trusted fragments.
  const projectBody=/<div class="hb-body hb-pjs[^">]*">/;
  if(!projectBody.test(hub))throw new Error('Project hub design slot moved');
  // A project's generic card already contains the same illustration; hub CSS uses its own card wrappers below.
  hub=replaceElement(hub,projectBody,`<div class="hb-body hb-pjs hb-x"><a class="hb-pjc" th:each="s : \${hubProjects}" th:href="'projects.html#' + \${s.id}"><span class="hb-pjc-ph"><th:block th:replace="~{public-site/story-fragments :: hub-project-art(\${s})}"></th:block><span class="hb-pjc-type" th:text="\${s.type}"></span></span><div class="hb-pjc-tx"><p class="hb-pjc-nm" th:text="\${s.name}"></p><h3 th:text="\${s.title}"></h3><p class="hb-pjc-s" th:text="\${s.summary}"></p><span class="hb-pjc-tm" th:text="\${s.team}"></span></div></a></div>`,true);
  const artSwitch=content.stories.projects.map(r=>`<th:block th:case="'${r.id}'">${svgOf(read(r.view.card.template))}</th:block>`).join('');
  let allFragments=output.get('templates/public-site/story-fragments.html');
  allFragments=allFragments.replace('</body>',`<th:block th:fragment="hub-project-art(s)"><th:block th:if="\${#strings.isEmpty(s.thumbnail)}" th:switch="\${s.id}">${artSwitch}<th:block th:case="*">${fallback}</th:block></th:block><img class="illu" th:if="\${!#strings.isEmpty(s.thumbnail)}" th:src="\${s.thumbnail}" th:alt="\${s.thumbnailAlt}"></th:block></body>`);
  const hubArt=[...content.stories.interviews,...content.stories.cohorts].map(r=>{
    const art=svgOf(read(r.view.card.template));
    return art?`<th:block th:case="'${r.id}'">${art.replace(/<svg\b[^>]*>/,tag=>tag.replace(/ class="[^"]*"/,'').replace('<svg','<svg class="hb-ph"'))}</th:block>`:'';
  }).join('');
  const genericArt=fallback.replace(/<svg\b[^>]*>/,tag=>tag.replace(/ class="[^"]*"/,'').replace('<svg','<svg class="hb-ph"'));
  allFragments=allFragments.replace('</body>',`<th:block th:fragment="hub-media(s,hero)" th:with="picture=\${hero ? s.heroImage : s.thumbnail}"><img class="hb-ph" th:if="\${!#strings.isEmpty(picture)}" th:src="\${picture}" th:alt="\${s.thumbnailAlt}" loading="lazy"><th:block th:if="\${#strings.isEmpty(picture)}" th:switch="\${s.id}">${hubArt}<th:block th:case="*">${genericArt}</th:block></th:block></th:block></body>`);
  output.set('templates/public-site/story-fragments.html',allFragments);
  hub=hub.replace(/<ul class="hb-body hb-mos"[\s\S]*?<\/ul>/,`<ul class="hb-body hb-mos" role="list"><li th:each="s,n : \${hubCohorts}" th:classappend="\${n.first ? 'is-big' : ''}"><a th:href="\${#strings.isEmpty(s.youtubeUrl) ? 'cohorts.html#' + s.id : s.youtubeUrl}" th:attr="target=\${#strings.isEmpty(s.youtubeUrl) ? null : '_blank'},rel=\${#strings.isEmpty(s.youtubeUrl) ? null : 'noopener'}"><img class="hb-ph" th:src="\${s.thumbnail}" alt="" loading="lazy"><div class="hb-mos-tx"><span class="hb-mos-m"><th:block th:text="\${s.cohort}"></th:block><span class="hb-mos-d" th:text="' · ' + \${s.date}"></span><span class="hb-vd" th:if="\${!#strings.isEmpty(s.youtubeUrl)}" th:text="\${s.duration}"></span></span><h3 th:text="\${s.title}"></h3><p th:if="\${n.first}" th:text="\${s.summary}"></p></div></a></li></ul>`);
  hub=hub.replace(/<img class="hb-ph" th:if="[^">]*" th:src="\\?\$\{hubInterviews\[0\]\.heroImage\}"[^>]*>/, '<th:block th:replace="~{public-site/story-fragments :: hub-media(\${hubInterviews[0]},true)}"></th:block>');
  hub=hub.replace(/<img class="hb-ph" th:src="\$\{s.thumbnail\}"[^>]*>/g,'<th:block th:replace="~{public-site/story-fragments :: hub-media(\${s},false)}"></th:block>');
  hub=hub.replace('</head>','<link rel="stylesheet" href="/stories/css/stories-live.css"></head>');
  output.set('templates/public-site/stories.html',hub);
}
