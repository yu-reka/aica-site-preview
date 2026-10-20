/* Static preview filters; Spring templates omit these until its API supports them. */
(function(){
  'use strict';
  function init(){
    const section=document.querySelector('#p-pr');
    const filters=section?.querySelector('.pj-cohort-filters');
    if(!filters)return;
    const dropdown=section.querySelector('.pj-subject-filter');
    const summary=dropdown.querySelector('summary');
    const options=dropdown.querySelector('.pj-subject-options');
    function selectSubject(value){
      options.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.subject===value)));
      summary.querySelector('b').textContent=value||'과정';
    }
    const cards=Array.from(section.querySelectorAll('.pjgrid .pjc'));
    function close(){dropdown.open=false;}
    const pager=document.createElement('nav');pager.className='cpager pj-pager';
    pager.setAttribute('aria-label','프로젝트 페이지');section.querySelector('.pjgrid').after(pager);
    let page=1;const pageSize=6;
    function pageButton(label,to,disabled,current){
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.disabled=disabled;button.setAttribute('aria-label',label==='←'?'이전 페이지':label==='→'?'다음 페이지':to+'페이지');
      if(current)button.setAttribute('aria-current','page');
      button.addEventListener('click',()=>{
        page=to;refresh();pager.querySelector('[aria-current="page"]').focus({preventScroll:true});
        section.querySelector('.pj-filter-row').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
      });return button;
    }
    function refresh(reset=false){
      if(reset)page=1;
      const cohort=filters.querySelector('[aria-pressed="true"]').dataset.cohort;
      const subject=options.querySelector('[aria-pressed="true"]').dataset.subject;
      const mobile=section.querySelector('.sm-projects');
      const eligible=cards.filter(card=>(!cohort||card.dataset.cohort===cohort)&&(!subject||card.dataset.subject===subject));
      const matching=eligible;
      const total=Math.max(1,Math.ceil(matching.length/pageSize));page=Math.min(page,total);
      const visible=new Set(matching.slice((page-1)*pageSize,page*pageSize));
      cards.forEach(card=>{card.hidden=!visible.has(card);});
      if(mobile){
        const items=Array.from(mobile.querySelectorAll('.sm-project'));
        items.forEach((item,index)=>{item.hidden=!visible.has(cards[index]);if(item.hidden)item.open=false;});
        const first=items.find(item=>!item.hidden);
        if(first&&!items.some(item=>!item.hidden&&item.open))first.open=true;
        mobile.hidden=!eligible.length;
      }
      section.querySelector('.pj-filter-empty').hidden=cohort!=='7';
      section.querySelector('.pj-subject-empty').hidden=!!matching.length||cohort==='7';
      pager.replaceChildren();pager.hidden=!matching.length;
      if(matching.length){
        pager.append(pageButton('←',page-1,page===1,false));
        const start=Math.max(1,Math.min(page-2,total-4));
        for(let n=start;n<=Math.min(total,start+4);n++)pager.append(pageButton(String(n),n,false,n===page));
        pager.append(pageButton('→',page+1,page===total,false));
      }
    }
    section.querySelector('.pj-empty-back').addEventListener('click',()=>{
      // The suggested action must always reveal the existing sixth-cohort list.
      selectSubject('');
      const button=filters.querySelector('[data-cohort="6"]');button.click();button.focus({preventScroll:true});
    });
    filters.addEventListener('click',event=>{
      const button=event.target.closest('button[data-cohort]');if(!button)return;
      filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));refresh(true);
    });
    options.addEventListener('click',event=>{
      const button=event.target.closest('button[data-subject]');if(!button)return;
      selectSubject(button.dataset.subject);
      close();summary.focus({preventScroll:true});refresh(true);
    });
    matchMedia('(max-width:600px)').addEventListener('change',()=>{close();refresh();});
    document.addEventListener('click',event=>{if(!dropdown.contains(event.target))close();});
    dropdown.addEventListener('keydown',event=>{if(event.key==='Escape'){close();summary.focus();}});
    dropdown.addEventListener('focusout',event=>{if(!dropdown.contains(event.relatedTarget))close();});
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
