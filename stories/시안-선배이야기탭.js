/* 시안 전용: 하위 메뉴 '선배 후기 · 선배 인터뷰' → '선배 이야기' 하나로(인터뷰 탭이어도 '선배 이야기'에 밑줄) */
(function(){
  var m = SITE_MENU.filter(function(x){ return x.id === 'stories'; })[0];
  m.children = m.children.filter(function(c){ return c.id !== 'interviews'; });
  m.children[0].label = '선배 이야기';
  var html = document.documentElement;
  function fix(){ if (html.dataset.sub === 'interviews') { html.dataset.sub = 'reviews'; if (typeof Site !== 'undefined' && Site.syncSubnav) Site.syncSubnav(); } }
  new MutationObserver(fix).observe(html, { attributes:true, attributeFilter:['data-sub'] });
  fix(); addEventListener('DOMContentLoaded', fix); addEventListener('load', function(){ setTimeout(function(){ fix(); }, 80); });
  addEventListener('hashchange', function(){ setTimeout(function(){ fix(); }, 30); });
})();
