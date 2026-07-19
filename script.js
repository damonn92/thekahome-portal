(function(){
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  /* ---------- i18n ---------- */
  var meta = {
    title:{
      en:"K&A Home Inc — We operate brands in America, and open the market for yours",
      zh:"K&A Home Inc｜我们在美国经营自己的品牌，也为更多品牌打开这个市场"
    },
    desc:{
      en:"K&A Home Inc is a US commerce company in Irvine, California: three owned consumer brands (Calivell, KZG, ODORUN), growth services for global brands entering the US (GoWest, OnShelfs), and AI products born from daily operations (AISight, PostPilot).",
      zh:"K&A Home Inc 是一家位于加州尔湾的品牌运营公司：三个自营消费品牌（Calivell、KZG、ODORUN）、帮助全球品牌进入美国市场的增长服务（GoWest、OnShelfs），以及源自日常运营的 AI 产品（AISight、PostPilot）。"
    }
  };
  var btnEn = document.getElementById('lang-en');
  var btnZh = document.getElementById('lang-zh');

  function setLang(l){
    var zh = l === 'zh';
    root.setAttribute('lang', zh ? 'zh-Hans' : 'en');
    root.classList.toggle('lang-zh', zh);
    document.querySelectorAll('[data-en]').forEach(function(el){
      var t = zh ? el.getAttribute('data-zh') : el.getAttribute('data-en');
      if (t !== null) el.textContent = t;
    });
    document.querySelectorAll('[data-alt-en]').forEach(function(el){
      el.alt = zh ? el.getAttribute('data-alt-zh') : el.getAttribute('data-alt-en');
    });
    document.querySelectorAll('[data-arialabel-en]').forEach(function(el){
      el.setAttribute('aria-label', zh ? el.getAttribute('data-arialabel-zh') : el.getAttribute('data-arialabel-en'));
    });
    document.title = meta.title[l];
    var d = document.querySelector('meta[name="description"]');
    if (d) d.setAttribute('content', meta.desc[l]);
    btnEn.setAttribute('aria-pressed', String(!zh));
    btnZh.setAttribute('aria-pressed', String(zh));
    try { localStorage.setItem('ka-lang', l); } catch(e){}
  }
  btnEn.addEventListener('click', function(){ setLang('en'); });
  btnZh.addEventListener('click', function(){ setLang('zh'); });
  var saved = null;
  try { saved = new URLSearchParams(location.search).get('lang') || localStorage.getItem('ka-lang'); } catch(e){}
  if (saved === 'zh') setLang('zh');

  /* ---------- Header scroll state ---------- */
  var head = document.getElementById('site-head');
  var ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      head.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById('nav-toggle');
  var bar = toggle.closest('.head-bar');
  var nav = document.getElementById('site-nav');
  function closeNav(){
    bar.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function(){
    var open = bar.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function(e){
    if (e.target.closest('a')) closeNav();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && bar.classList.contains('nav-open')) {
      closeNav();
      toggle.focus();
    }
  });

  /* ---------- Reveal on scroll ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.08});
    items.forEach(function(el){ io.observe(el); });
  } else {
    items.forEach(function(el){ el.classList.add('in'); });
  }
})();
