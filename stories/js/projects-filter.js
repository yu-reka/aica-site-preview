/* Filter only explicit cohort metadata; never infer cohorts from card order. */
(function(){
  'use strict';
  function init(){
    const section=document.querySelector('#p-pr');
    const filters=section?.querySelector('.pj-cohort-filters');
    if(!filters)return;
    section.querySelector('.pj-empty-back').addEventListener('click',()=>{
      const button=filters.querySelector('[data-cohort="6"]');
      button.click();
      button.focus({preventScroll:true});
    });
    const cards=Array.from(section.querySelectorAll('.pjgrid .pjc'));
    filters.addEventListener('click',event=>{
      const button=event.target.closest('button[data-cohort]');
      if(!button)return;
      const cohort=button.dataset.cohort;
      filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      cards.forEach(card=>{card.hidden=!!cohort&&card.dataset.cohort!==cohort;});
      const mobile=section.querySelector('.sm-projects');
      const active=mobile?.querySelector('.sm-filter-tabs [aria-pressed="true"]');
      if(active)active.click();
      const any=cards.some(card=>!card.hidden);
      if(mobile)mobile.hidden=!any;
      const empty=section.querySelector('.pj-filter-empty');
      empty.hidden=any;

    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
