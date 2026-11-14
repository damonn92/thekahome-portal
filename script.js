/* ==========================================================================
   K&A (Kahome Inc) — thekahome.com · shared behaviour
   Loaded with <script defer> on every page. Every feature guards its own
   lookups, so pages that lack homepage-only elements run without errors.
   Storage: localStorage "ka-lang" only. No cookies, no network requests.

   1. Language   ?lang=zh|en (prefix match)  >  localStorage "ka-lang"  >  "en"
                 Swaps, for the active language (en | zh):
                   data-en / data-zh            -> textContent
                                                   (<meta>: content, <title>: document.title)
                   data-html-en / data-html-zh  -> innerHTML (strings with inline markup)
                   data-alt-*        -> alt          data-arialabel-* -> aria-label
                   data-title-*      -> title        data-content-*   -> content
                   data-href-*       -> href
                 Sets <html lang> ("en" | "zh-Hans") and html.lang-zh.
                 Buttons: .lang-switch button[data-lang="en|zh"] (aria-pressed is kept in sync).
                 Fires "ka:langchange" on document (event.detail.lang). window.KA.setLang / getLang.
   2. Menu       #nav-toggle + #site-nav inside #site-header (.nav-open on the header):
                 Escape closes and returns focus, links close it, a click outside closes it (the scrim
                 behind the open menu is the header's own ::before, so a click on it counts as outside),
                 crossing to the desktop layout closes it. The closed panel is visibility:hidden
                 (out of the tab order); while open, Tab from the toggle enters the panel.
   3. Header     html.is-scrolled after 8px.
   4. Anchors    Links whose pathname is the current page scroll smoothly to their hash target
                 (instantly under prefers-reduced-motion). A hash-less link to the current page (the
                 logo) scrolls to the top and drops any #section from the address. Cold loads of
                 /page#id jump natively; the landing position is re-checked once fonts and language
                 have settled, and again when the web font arrives (it loads late), unless the visitor
                 has already moved. Reloads and back / forward loads keep the browser's restored position.
   5. Scroll-spy #site-nav .lnk links are matched by the hash part of their href
                 (aria-current="location"). Sub-pages mark their item with class="is-current".
   6. Reveal     [data-rv] (alias [data-reveal]): nothing is hidden at load; after the first real
                 scroll only elements still below the fold are armed; classes are stripped after
                 the transition; a 2.5s safety net plus a scroll sweep un-hide anything pending.
   7. Pointer    .spot cards get --mx/--my (hover spotlight); #hv gets --px/--py (hero parallax).
                 Fine pointers only, never under prefers-reduced-motion.
   (Drifting mesh, bobbing chips, travelling ring etc. are CSS animations in styles.css.)
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
  var reduceMq = media('(prefers-reduced-motion: reduce)');
  function reducedMotion() { return !!(reduceMq && reduceMq.matches); }
  function raf(fn) {
    if (win.requestAnimationFrame) { return win.requestAnimationFrame(fn); }
    return win.setTimeout(fn, 16);
  }
  function scrollY() { return win.pageYOffset || root.scrollTop || 0; }
  function viewportH() { return win.innerHeight || root.clientHeight || 0; }
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
  function hashTarget(hash) {
    if (!hash || hash.length < 2) { return null; }
    var id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch (e) { /* keep the raw id */ }
    return doc.getElementById(id);
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

  function setLang(l) {
    var next = l === 'zh' ? 'zh' : 'en';
    writeStored(next);
    applyLang(next);
    syncUrlLang(next);
  }

  safe(function () {
    var fromUrl = langFromUrl();
    var stored = readStored();
    var initial = fromUrl || (stored === 'zh' || stored === 'en' ? stored : 'en');
    if (fromUrl) { writeStored(fromUrl); }
    /* the markup is authored in English, so an English first load needs no text swap */
    applyLang(initial, { skipText: initial === 'en' });

    all('.lang-switch [data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang')); });
    });

    win.KA = win.KA || {};
    win.KA.setLang = setLang;
    win.KA.getLang = function () { return currentLang; };
  });
  /* whatever happened above, never leave the page hidden */
  root.classList.remove('lang-pending');

  /* ---------- 2. mobile menu ---------- */
  var header = doc.getElementById('site-header');
  var closeMenu = function () {};

  safe(function () {
    var toggle = doc.getElementById('nav-toggle');
    var nav = doc.getElementById('site-nav');
    if (!toggle || !nav || !header) { return; }
    var desktop = media(DESKTOP_NAV);

    function isOpen() { return header.classList.contains('nav-open'); }
    function setMenu(open, returnFocus) {
      if (open) { header.classList.add('nav-open'); } else { header.classList.remove('nav-open'); }
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open && returnFocus) { try { toggle.focus(); } catch (e) { /* ignore */ } }
    }
    closeMenu = function () { if (isOpen()) { setMenu(false, false); } };

    toggle.addEventListener('click', function () { setMenu(!isOpen(), false); });
    nav.addEventListener('click', function (e) {
      if (isOpen() && closestLink(e.target)) { setMenu(false, false); }
    });
    doc.addEventListener('keydown', function (e) {
      if (!isOpen()) { return; }
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) { setMenu(false, true); return; }
      if (e.key !== 'Tab') { return; }
      /* the panel sits before the toggle in the DOM: bridge Tab between the two */
      var links = all('a[href]', nav);
      var first = links[0];
      var active = doc.activeElement;
      if (!first) { return; }
      if (!e.shiftKey && active === toggle) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && active === first) { e.preventDefault(); toggle.focus(); }
    });
    doc.addEventListener('click', function (e) {
      /* outside the header, or on the header element itself (its ::before is the scrim behind the open menu) */
      if (isOpen() && (e.target === header || !header.contains(e.target))) { setMenu(false, false); }
    });
    onMedia(desktop, function () { if (desktop.matches) { closeMenu(); } });
  });

  /* ---------- 3. header state ---------- */
  safe(function () {
    var ticking = false;
    function update() {
      ticking = false;
      if (scrollY() > 8) { root.classList.add('is-scrolled'); } else { root.classList.remove('is-scrolled'); }
    }
    win.addEventListener('scroll', function () {
      if (ticking) { return; }
      ticking = true;
      raf(update);
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
        var target = hashTarget(url.hash);
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
      } else if (!url.hash && a.getAttribute('href') !== '#' && (url.search === '' || url.search === win.location.search)) {
        /* e.g. the logo on the page it points to: go to the top instead of reloading */
        e.preventDefault();
        closeMenu();
        /* drop a stale #section from the address, so a reload lands at the top as well (?lang is kept) */
        try {
          if (win.location.hash && win.history && win.history.pushState) {
            win.history.pushState(null, '', win.location.pathname + win.location.search);
          }
        } catch (err5) { /* file:// or sandboxed history */ }
        try { win.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); }
        catch (err4) { win.scrollTo(0, 0); }
      }
    });

    /* cold load of /page#id: the browser jumps natively (no smooth scrolling in CSS). Web fonts and
       the Chinese text swap can move the target afterwards, so re-align once things have settled,
       unless the visitor has already started scrolling. */
    var target = hashTarget(win.location.hash);
    if (!target) { return; }
    /* a reload or a back / forward load: the browser restores the visitor's own scroll position, leave it alone */
    try {
      var navEntry = win.performance && win.performance.getEntriesByType ? win.performance.getEntriesByType('navigation')[0] : null;
      if (navEntry && (navEntry.type === 'reload' || navEntry.type === 'back_forward')) { return; }
    } catch (e0) { /* no Navigation Timing */ }
    var touched = false;
    function touch() { touched = true; }
    ['wheel', 'touchstart', 'pointerdown', 'mousedown', 'keydown', 'click'].forEach(function (t) {
      win.addEventListener(t, touch, { passive: true, capture: true });
    });
    win.addEventListener('hashchange', touch);
    win.addEventListener('popstate', touch);
    function settle(late) {
      if (touched) { return; }
      var top = target.getBoundingClientRect().top;
      var want = parseFloat(win.getComputedStyle(target).scrollMarginTop) || 0;
      var off = Math.abs(top - want);
      if (off <= 2) { return; }
      /* a late font swap moves the target by a few lines at most: further away than one screen means the
         visitor has moved on by some means that fires no input event, so stop re-aligning for good */
      if (late && off > viewportH()) { touched = true; return; }
      try { target.scrollIntoView({ behavior: 'auto', block: 'start' }); } catch (e) { target.scrollIntoView(true); }
    }
    function settleSoon(ev) {
      var late = !!(ev && ev.type === 'loadingdone');
      raf(function () { raf(function () { settle(late); }); });
    }
    if (doc.readyState === 'complete') { settleSoon(); } else { win.addEventListener('load', settleSoon); }
    try { if (doc.fonts && doc.fonts.ready && doc.fonts.ready.then) { doc.fonts.ready.then(settleSoon); } } catch (e) { /* no font loading API */ }
    try { if (doc.fonts && doc.fonts.addEventListener) { doc.fonts.addEventListener('loadingdone', settleSoon); } } catch (e2) { /* no font loading events */ }
  });

  /* ---------- 5. scroll-spy (keys off the hash part of each nav href) ---------- */
  safe(function () {
    if (!('IntersectionObserver' in win)) { return; }
    var here = normPath(win.location.pathname);
    var links = {};
    var ids = [];
    var seen = {};
    all('#site-nav a.lnk[href]').forEach(function (a) {
      var url = parseUrl(a.href);
      if (!url || url.origin !== win.location.origin || normPath(url.pathname) !== here) { return; }
      if (!url.hash || url.hash.length < 2) { return; }
      var id = url.hash.slice(1);
      if (!links[id] && doc.getElementById(id)) { links[id] = a; ids.push(id); }
    });
    if (!ids.length) { return; }

    var spy = new win.IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      var active = null;
      ids.forEach(function (id) { if (seen[id]) { active = id; } });
      ids.forEach(function (id) {
        if (id === active) { links[id].setAttribute('aria-current', 'location'); }
        else { links[id].removeAttribute('aria-current'); }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    ids.forEach(function (id) { spy.observe(doc.getElementById(id)); });
  });

  /* ---------- 6. scroll-armed reveal ---------- */
  safe(function () {
    var items = all('[data-rv],[data-reveal]');
    if (!items.length || reducedMotion() || !('IntersectionObserver' in win)) { return; }

    var pending = [];
    var armed = false;
    var io = null;

    function strip(el) {
      el.classList.remove('rv');
      el.classList.remove('rv-in');
      el.style.removeProperty('--rd');
    }
    function fire(el) {
      var i = pending.indexOf(el);
      if (i === -1) { return; }
      pending.splice(i, 1);
      if (io) { io.unobserve(el); }
      el.classList.add('rv-in');
      /* strip the classes once the transition is over so no reveal rule lingers */
      win.setTimeout(function () { strip(el); }, 1300);
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
      if (armed || scrollY() < 4) { return; }
      armed = true;
      win.removeEventListener('scroll', arm);
      var fold = viewportH();
      var groups = [];
      var counts = [];
      io = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { fire(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
      items.forEach(function (el) {
        if (el.getBoundingClientRect().top <= fold) { return; }
        /* siblings arriving together are staggered a little */
        var g = groups.indexOf(el.parentNode);
        if (g === -1) { g = groups.push(el.parentNode) - 1; counts[g] = 0; }
        el.style.setProperty('--rd', (counts[g]++ % 4) * 90 + 'ms');
        el.classList.add('rv');
        pending.push(el);
        io.observe(el);
      });
      win.addEventListener('scroll', onScrollSweep, { passive: true });
      /* safety net: 2.5s after arming, un-hide anything that should be visible by now */
      win.setTimeout(sweep, 2500);
    }

    win.addEventListener('scroll', arm, { passive: true });
    win.addEventListener('beforeprint', showAllNow);
    onMedia(reduceMq, function () { if (reducedMotion()) { showAllNow(); } });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) { sweep(); } });
  });

  /* ---------- 7. hover spotlight + hero parallax (fine pointers only) ---------- */
  safe(function () {
    var fine = media('(hover:hover) and (pointer:fine)');
    if (!fine || !fine.matches) { return; }
    var hv = doc.getElementById('hv');
    var hero = hv && hv.closest ? hv.closest('.hero') : null;
    if (!hv && !doc.querySelector('.spot')) { return; }
    var queued = false;
    var last = null;

    function frame() {
      queued = false;
      if (!last || reducedMotion()) { return; }
      var t = last.target;
      var card = t && t.closest ? t.closest('.spot') : null;
      if (card) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (last.clientX - r.left) + 'px');
        card.style.setProperty('--my', (last.clientY - r.top) + 'px');
      }
      if (hv && hero && hero.contains(t)) {
        var w = win.innerWidth || 1;
        var h = win.innerHeight || 1;
        hv.style.setProperty('--px', ((last.clientX / w) * 2 - 1).toFixed(3));
        hv.style.setProperty('--py', ((last.clientY / h) * 2 - 1).toFixed(3));
      }
    }
    doc.addEventListener('pointermove', function (e) {
      last = e;
      if (!queued) { queued = true; raf(frame); }
    }, { passive: true });
  });
})();
