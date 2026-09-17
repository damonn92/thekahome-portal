/* ==========================================================================
   K&A (Kahome Inc) — thekahome.com · shared behaviour
   Loaded with <script defer> on every page. Every feature guards its own
   lookups, so pages that lack homepage-only elements run without errors.

   1. Language   ?lang=zh|en  >  localStorage "ka-lang"  >  "en"
                 Swaps, for the active language (en | zh):
                   data-en / data-zh            -> textContent
                                                   (<meta>: content, <title>: document.title)
                   data-html-en / data-html-zh  -> innerHTML (strings with inline markup)
                   data-alt-*        -> alt          data-arialabel-* -> aria-label
                   data-title-*      -> title        data-content-*   -> content
                   data-href-*       -> href
                 Buttons: .lang-switch button[data-lang="en|zh"] (aria-pressed is kept in sync).
                 Fires "ka:langchange" on document (event.detail.lang). window.KA.setLang / getLang.
   2. Menu       #nav-toggle + #site-nav: Escape closes and returns focus, links close it,
                 outside click closes it, crossing to the desktop layout closes it.
   3. Header     .site-header gets .is-scrolled after 8px.
   4. Anchors    Links whose pathname is the current page scroll smoothly to their hash target.
   5. Scroll-spy .site-nav links are matched by the hash part of their href (aria-current="location").
   6. Reveal     [data-reveal]: nothing is hidden until the first real scroll; only elements still
                 below the fold are armed; classes are stripped ~800ms after firing; a 2.5s safety
                 net plus a scroll sweep un-hide anything still pending.
   ========================================================================== */
(function () {
  'use strict';

  var win = window;
  var doc = document;
  var root = doc.documentElement;
  var KEY = 'ka-lang';
  var DESKTOP_NAV = '(min-width:1024px)';

  root.classList.add('js');

  /* ---------- helpers ---------- */
  function all(sel, ctx) {
    try { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
    catch (e) { return []; }
  }
  function safe(fn) {
    try { fn(); } catch (e) { if (win.console && win.console.warn) { win.console.warn('[ka]', e); } }
  }
  function media(q) {
    try { return win.matchMedia ? win.matchMedia(q) : null; } catch (e) { return null; }
  }
  function onMedia(mq, fn) {
    if (!mq) { return; }
    if (mq.addEventListener) { mq.addEventListener('change', fn); }
    else if (mq.addListener) { mq.addListener(fn); }
  }
  function reducedMotion() {
    var mq = media('(prefers-reduced-motion: reduce)');
    return !!(mq && mq.matches);
  }
  function normPath(p) {
    return String(p || '/').replace(/index\.html?$/i, '').replace(/\/+$/, '') || '/';
  }
  function closestLink(node) {
    while (node && node !== doc) {
      if (node.nodeType === 1 && node.tagName && node.tagName.toLowerCase() === 'a' && node.hasAttribute('href')) { return node; }
      node = node.parentNode;
    }
    return null;
  }
  function parseUrl(href) {
    try { return new URL(href, win.location.href); } catch (e) { return null; }
  }

  /* ---------- 1. language ---------- */
  function readStored() { try { return win.localStorage.getItem(KEY); } catch (e) { return null; } }
  function writeStored(v) { try { win.localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable */ } }
  function langFromUrl() {
    var m = /[?&]lang=([^&#]*)/i.exec(win.location.search || '');
    if (!m) { return null; }
    var v = m[1].toLowerCase();
    if (v.indexOf('zh') === 0) { return 'zh'; }
    if (v.indexOf('en') === 0) { return 'en'; }
    return null;
  }

  var currentLang = 'en';

  function swapAttr(prefix, lang, apply) {
    all('[' + prefix + lang + ']').forEach(function (el) {
      var v = el.getAttribute(prefix + lang);
      if (v !== null) { apply(el, v); }
    });
  }

  function applyLang(lang, opts) {
    lang = lang === 'zh' ? 'zh' : 'en';
    opts = opts || {};
    currentLang = lang;

    root.setAttribute('lang', lang === 'zh' ? 'zh-Hans' : 'en');
    if (lang === 'zh') { root.classList.add('lang-zh'); } else { root.classList.remove('lang-zh'); }

    if (!opts.skipText) {
      swapAttr('data-', lang, function (el, v) {
        var tag = el.tagName ? el.tagName.toUpperCase() : '';
        if (tag === 'META') { el.setAttribute('content', v); }
        else if (tag === 'TITLE') { doc.title = v; }
        else { el.textContent = v; }
      });
      swapAttr('data-html-', lang, function (el, v) { el.innerHTML = v; });
      swapAttr('data-alt-', lang, function (el, v) { el.setAttribute('alt', v); });
      swapAttr('data-arialabel-', lang, function (el, v) { el.setAttribute('aria-label', v); });
      swapAttr('data-title-', lang, function (el, v) { el.setAttribute('title', v); });
      swapAttr('data-content-', lang, function (el, v) { el.setAttribute('content', v); });
      swapAttr('data-href-', lang, function (el, v) { el.setAttribute('href', v); });
    }

    all('.lang-switch [data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
    });

    root.classList.remove('lang-pending');

    try {
      var ev;
      if (typeof win.CustomEvent === 'function') { ev = new win.CustomEvent('ka:langchange', { detail: { lang: lang } }); }
      else { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent('ka:langchange', false, false, { lang: lang }); }
      doc.dispatchEvent(ev);
    } catch (e) { /* no custom events */ }
  }

  function syncUrlLang(lang) {
    /* only touch the URL when it already carries ?lang, so a reload keeps the visitor's choice */
    try {
      if (!/[?&]lang=/i.test(win.location.search) || !win.history || !win.history.replaceState) { return; }
      var url = new URL(win.location.href);
      if (lang === 'zh') { url.searchParams.set('lang', 'zh'); } else { url.searchParams.delete('lang'); }
      win.history.replaceState(win.history.state, '', url.pathname + url.search + url.hash);
    } catch (e) { /* leave the URL alone */ }
  }

  safe(function () {
    var fromUrl = langFromUrl();
    var stored = readStored();
    var initial = fromUrl || (stored === 'zh' || stored === 'en' ? stored : 'en');
    if (fromUrl) { writeStored(fromUrl); }
    /* the markup is authored in English, so an English first load needs no text swap */
    applyLang(initial, { skipText: initial === 'en' });

    all('.lang-switch [data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-lang') === 'zh' ? 'zh' : 'en';
        writeStored(next);
        applyLang(next);
        syncUrlLang(next);
      });
    });

    win.KA = win.KA || {};
    win.KA.setLang = function (l) { var n = l === 'zh' ? 'zh' : 'en'; writeStored(n); applyLang(n); syncUrlLang(n); };
    win.KA.getLang = function () { return currentLang; };
  });
  /* whatever happened above, never leave the page hidden */
  root.classList.remove('lang-pending');

  /* ---------- 2. mobile menu ---------- */
  var header = doc.querySelector('.site-header');
  var closeMenu = function () {};

  safe(function () {
    var toggle = doc.getElementById('nav-toggle') || doc.querySelector('.nav-toggle');
    var nav = doc.getElementById('site-nav') || doc.querySelector('.site-nav');
    if (!toggle || !nav) { return; }
    var desktop = media(DESKTOP_NAV);

    function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }
    function setMenu(open, returnFocus) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { nav.classList.add('is-open'); } else { nav.classList.remove('is-open'); }
      if (header) { if (open) { header.classList.add('menu-open'); } else { header.classList.remove('menu-open'); } }
      if (!open && returnFocus) { try { toggle.focus(); } catch (e) { /* ignore */ } }
    }
    closeMenu = function () { if (isOpen()) { setMenu(false, false); } };

    toggle.addEventListener('click', function () { setMenu(!isOpen(), false); });
    nav.addEventListener('click', function (e) {
      if (isOpen() && closestLink(e.target)) { setMenu(false, false); }
    });
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) && isOpen()) { setMenu(false, true); }
    });
    doc.addEventListener('click', function (e) {
      if (isOpen() && header && !header.contains(e.target)) { setMenu(false, false); }
    });
    onMedia(desktop, function () { if (desktop.matches) { closeMenu(); } });
  });

  /* ---------- 3. header state ---------- */
  safe(function () {
    if (!header) { return; }
    var ticking = false;
    function update() {
      ticking = false;
      if ((win.pageYOffset || root.scrollTop || 0) > 8) { header.classList.add('is-scrolled'); }
      else { header.classList.remove('is-scrolled'); }
    }
    win.addEventListener('scroll', function () {
      if (ticking) { return; }
      ticking = true;
      if (win.requestAnimationFrame) { win.requestAnimationFrame(update); } else { win.setTimeout(update, 16); }
    }, { passive: true });
    update();
  });

  /* ---------- 4. same-page anchors ---------- */
  safe(function () {
    var here = normPath(win.location.pathname);

    function scrollToTarget(target) {
      var behavior = reducedMotion() ? 'auto' : 'smooth';
      try { target.scrollIntoView({ behavior: behavior, block: 'start' }); }
      catch (e) { target.scrollIntoView(true); }
    }

    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
      var a = closestLink(e.target);
      if (!a || a.hasAttribute('download')) { return; }
      var tgt = (a.getAttribute('target') || '').toLowerCase();
      if (tgt && tgt !== '_self') { return; }
      var url = parseUrl(a.href);
      if (!url || url.origin !== win.location.origin || normPath(url.pathname) !== here) { return; }

      if (url.hash && url.hash.length > 1) {
        var id = url.hash.slice(1);
        try { id = decodeURIComponent(id); } catch (err) { /* keep raw id */ }
        var target = doc.getElementById(id);
        if (!target) { return; }
        e.preventDefault();
        closeMenu();
        scrollToTarget(target);
        try {
          if (win.history && win.history.pushState && win.location.hash !== url.hash) {
            win.history.pushState(null, '', win.location.pathname + win.location.search + url.hash);
          }
        } catch (err2) { /* file:// or sandboxed history */ }
        try {
          if (!target.hasAttribute('tabindex') && !/^(a|button|input|select|textarea|summary)$/i.test(target.tagName)) {
            target.setAttribute('tabindex', '-1');
          }
          target.focus({ preventScroll: true });
        } catch (err3) { /* focus options unsupported */ }
      } else if (!url.hash && (url.search === '' || url.search === win.location.search)) {
        /* e.g. the logo on the page it points to: go to the top instead of reloading */
        e.preventDefault();
        closeMenu();
        try { win.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); }
        catch (err4) { win.scrollTo(0, 0); }
      }
    });
  });

  /* ---------- 5. scroll-spy (keys off the hash part of each nav href) ---------- */
  safe(function () {
    if (!('IntersectionObserver' in win)) { return; }
    var here = normPath(win.location.pathname);
    var links = {};
    var ids = [];
    all('.site-nav a[href]:not(.btn)').forEach(function (a) {
      var url = parseUrl(a.href);
      if (!url || url.origin !== win.location.origin || normPath(url.pathname) !== here) { return; }
      if (!url.hash || url.hash.length < 2) { return; }
      var id = url.hash.slice(1);
      if (!links[id] && doc.getElementById(id)) { links[id] = a; ids.push(id); }
    });
    if (!ids.length) { return; }

    function clear(a) { a.classList.remove('is-current'); a.removeAttribute('aria-current'); }
    var spy = new win.IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = links[en.target.id];
        if (!a) { return; }
        if (en.isIntersecting) {
          ids.forEach(function (k) { clear(links[k]); });
          a.classList.add('is-current');
          a.setAttribute('aria-current', 'location');
        } else if (a.classList.contains('is-current')) {
          clear(a);
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    ids.forEach(function (id) { spy.observe(doc.getElementById(id)); });
  });

  /* ---------- 6. scroll-armed reveal ---------- */
  safe(function () {
    var items = all('[data-reveal]');
    if (!items.length || reducedMotion() || !('IntersectionObserver' in win)) { return; }

    var pending = [];
    var armed = false;
    var io = null;

    function viewportH() { return win.innerHeight || root.clientHeight || 0; }
    function strip(el) { el.classList.remove('will-reveal'); el.classList.remove('is-in'); }
    function fire(el) {
      var i = pending.indexOf(el);
      if (i === -1) { return; }
      pending.splice(i, 1);
      if (io) { io.unobserve(el); }
      el.classList.add('is-in');
      /* strip the classes once the transition is over so no reveal rule lingers */
      win.setTimeout(function () { strip(el); }, 800);
    }
    function showAllNow() {
      pending.slice().forEach(function (el) { if (io) { io.unobserve(el); } strip(el); });
      pending = [];
    }
    function sweep() {
      /* anything that is already in (or above) the viewport must not stay hidden */
      var fold = viewportH();
      pending.slice().forEach(function (el) {
        if (el.getBoundingClientRect().top < fold) { fire(el); }
      });
    }

    var sweeping = false;
    function onScrollSweep() {
      if (!pending.length) { win.removeEventListener('scroll', onScrollSweep); return; }
      if (sweeping) { return; }
      sweeping = true;
      win.setTimeout(function () { sweeping = false; sweep(); }, 250);
    }

    function arm() {
      if (armed) { return; }
      armed = true;
      win.removeEventListener('scroll', arm);
      var fold = viewportH();
      io = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { fire(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      items.forEach(function (el) {
        if (el.getBoundingClientRect().top > fold) {
          el.classList.add('will-reveal');
          pending.push(el);
          io.observe(el);
        }
      });
      win.addEventListener('scroll', onScrollSweep, { passive: true });
      /* safety net: 2.5s after arming, un-hide anything that should be visible by now */
      win.setTimeout(sweep, 2500);
    }

    win.addEventListener('scroll', arm, { passive: true });
    win.addEventListener('beforeprint', showAllNow);
    var reduce = media('(prefers-reduced-motion: reduce)');
    onMedia(reduce, function () { if (reduce.matches) { showAllNow(); } });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) { sweep(); } });
  });
})();
