/* ==========================================================================
   TechPulse - interactivity for the static SEO pages (/a/<slug>.html)
   The article text is plain HTML (fast + crawlable). This script adds:
   - real view counter, visit counter
   - like, save, share buttons
   - (lazy) comments via Disqus
   - reading progress bar + scroll-to-top button
   - automatic Table of Contents (TOC) via js/toc.js
   - live language translation from Supabase (via ?lang=xx in URL)
   Requires js/common.js (and optionally js/toc.js for TOC).
   ========================================================================== */
(function () {
  'use strict';
  var C = window.TPCommon;
  var art = document.querySelector('article.single-article') || document.querySelector('article') || document.querySelector('main') || document.body;
  if (!C || !art) return;

  // Generated pages carry data-id. A hand-written page without it gets "m-<slug>" from its URL.
  var pm = location.pathname.match(/\/a\/([^\/]+?)(?:\.html)?\/?$/);
  var id = art.getAttribute('data-id') || (pm ? 'm-' + decodeURIComponent(pm[1]) : '');
  if (!id) return;
  var h1 = art.querySelector('h1') || document.querySelector('h1');
  var title = h1 ? h1.textContent : document.title;
  var canonEl = document.querySelector('link[rel="canonical"]');
  var pageUrl = canonEl ? canonEl.href : location.origin + location.pathname;

  C.initDarkMode();
  C.trackAndGetSiteStats(); // visit counted once per session, also for visitors arriving from Google

  // Real view counter (one view per session)
  var wrap = document.getElementById('tpViewsWrap');
  var num = document.getElementById('tpViews');
  C.registerView(id).then(function (v) {
    if (num) num.textContent = v;
    if (wrap) wrap.hidden = false;
  });

  /* ---------- Live language translation from Supabase ----------
     If the URL contains ?lang=zh (or es/hi/fr), fetch the translation from Supabase
     and replace the English text on the page in-place. The page stays crawlable in
     English for Google, but human readers get their chosen language instantly. */
  (function applyUrlLang() {
    var params = new URLSearchParams(location.search);
    var lang = params.get('lang');
    if (!lang || lang === 'en') return;
    var supported = ['zh', 'es', 'hi', 'fr'];
    if (supported.indexOf(lang) === -1) return;

    // Change <html lang="...">
    document.documentElement.setAttribute('lang', lang);

    C.getArticles().then(function (all) {
      var article = all.find(function (a) { return String(a.id) === String(id) || String(a.slug) === String(id); });
      if (!article) return;

      var tI18n = article.title_i18n || {};
      var eI18n = article.excerpt_i18n || {};
      var cI18n = article.content_i18n || {};

      // 1) Title (h1 + document.title)
      var newTitle = tI18n[lang];
      if (newTitle && h1) {
        h1.textContent = newTitle;
        document.title = newTitle + ' | TechPulse';
      }

      // 2) Excerpt
      var newExcerpt = eI18n[lang];
      var excerptEl = art.querySelector('.article-excerpt p');
      if (newExcerpt && excerptEl) excerptEl.textContent = newExcerpt;

      // 3) Content
      var newContent = cI18n[lang];
      var contentEl = art.querySelector('.article-content');
      if (newContent && contentEl) {
        // Render the translated markdown into HTML using the same rules as generate-seo
        contentEl.innerHTML = renderMarkdown(newContent);
      }

      // 4) Update og:title and description meta
      var ogT = document.querySelector('meta[property="og:title"]');
      var ogD = document.querySelector('meta[property="og:description"]');
      var desc = document.querySelector('meta[name="description"]');
      if (ogT && newTitle) ogT.setAttribute('content', newTitle);
      if (ogD && newExcerpt) ogD.setAttribute('content', newExcerpt);
      if (desc && newExcerpt) desc.setAttribute('content', newExcerpt);

      // 5) Show a small banner confirming the language
      showLangBanner(lang);

      // 6) Rebuild TOC (headings changed)
      rebuildToc();
    }).catch(function (e) { console.warn('Translation load failed', e); });
  })();

  function showLangBanner(lang) {
    if (document.getElementById('tpLangBanner')) return;
    var names = { zh: '中文', es: 'Español', hi: 'हिन्दी', fr: 'Français' };
    var flags = { zh: '🇨🇳', es: '🇪🇸', hi: '🇮🇳', fr: '🇫🇷' };
    var banner = document.createElement('div');
    banner.id = 'tpLangBanner';
    banner.className = 'tp-lang-banner';
    banner.innerHTML =
      '<span>' + flags[lang] + ' Reading in <strong>' + names[lang] + '</strong></span>' +
      '<a href="' + location.pathname + '">Read in English</a>';
    var container = document.querySelector('main.container') || document.body;
    var firstArticle = container.querySelector('article');
    if (firstArticle) container.insertBefore(banner, firstArticle);
    else container.insertBefore(banner, container.firstChild);
  }

  // Minimal markdown renderer (same as generate-seo.mjs) for translated content
  function renderMarkdown(text) {
    var esc = C.esc;
    var inline = function (s) {
      return esc(s)
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`\n]+)`/g, '<code>$1</code>');
    };
    var src = String(text || '').replace(/\r\n/g, '\n');
    var chunks = src.split(/```[a-zA-Z0-9+#-]*\n([\s\S]*?)```/);
    var out = [];
    chunks.forEach(function (chunk, i) {
      if (i % 2) { out.push('<pre><code>' + esc(chunk.replace(/\n$/, '')) + '</code></pre>'); return; }
      var blocks = chunk.replace(/^(#{1,3} .+)$/gm, '\n$1\n').split(/\n\n+/).map(function (b) { return b.trim(); }).filter(Boolean);
      blocks.forEach(function (b) {
        var m;
        if ((m = b.match(/^###\s+(.+)$/))) out.push('<h3>' + inline(m[1]) + '</h3>');
        else if ((m = b.match(/^#{1,2}\s+(.+)$/))) out.push('<h2>' + inline(m[1]) + '</h2>');
        else if (b.split('\n').every(function (l) { return /^\s*[-*•]\s+/.test(l); }))
          out.push('<ul>' + b.split('\n').map(function (l) { return '<li>' + inline(l.replace(/^\s*[-*•]\s+/, '')) + '</li>'; }).join('') + '</ul>');
        else if (b.split('\n').every(function (l) { return /^\s*\d+[.)]\s+/.test(l); }))
          out.push('<ol>' + b.split('\n').map(function (l) { return '<li>' + inline(l.replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; }).join('') + '</ol>');
        else out.push('<p>' + inline(b).replace(/\n/g, '<br>') + '</p>');
      });
    });
    return out.join('\n');
  }

  /* ---------- Table of Contents ---------- */
  var tocInstance = null;
  function buildToc() {
    if (!window.TPToc) return;
    var contentEl = art.querySelector('.article-content');
    if (!contentEl) return;

    // Prefer placing the TOC in a container in the article if present
    var slot = document.getElementById('articleToc');
    if (!slot) {
      // Create a slot right before the article content
      slot = document.createElement('div');
      slot.id = 'articleToc';
      slot.className = 'article-toc-slot';
      contentEl.parentNode.insertBefore(slot, contentEl);
    }
    tocInstance = window.TPToc.build(contentEl, {
      minHeadings: 3,
      containerSelector: '#articleToc',
      scrollOffset: 90,
    });
  }

  function rebuildToc() {
    var slot = document.getElementById('articleToc');
    if (slot) slot.innerHTML = '';
    buildToc();
  }

  // Wait a tick so the page has a chance to load translations first
  setTimeout(buildToc, 100);

  /* ---------- Like ---------- */
  var likeBtn = document.getElementById('tpLike');
  function paintLike() {
    if (!likeBtn) return;
    var liked = C.hasLiked(id);
    likeBtn.classList.toggle('liked', liked);
    likeBtn.innerHTML = (liked ? '\u2764\uFE0F' : '\uD83E\uDD0D') + ' <span class="like-count">' + C.getLikeCount(id) + '</span>';
  }
  if (likeBtn) {
    paintLike();
    likeBtn.addEventListener('click', function () { C.toggleLike(id); paintLike(); });
  }

  /* ---------- Save ---------- */
  var saveBtn = document.getElementById('tpSave');
  function paintSave() {
    if (saveBtn) saveBtn.textContent = (C.isBookmarked(id) ? '\uD83D\uDCCC' : '\uD83D\uDD16') + ' Save';
  }
  if (saveBtn) {
    paintSave();
    saveBtn.addEventListener('click', function () { C.toggleBookmark(id, title); paintSave(); });
  }

  /* ---------- Share ---------- */
  document.querySelectorAll('.share-btn[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.dataset.share;
      var url = encodeURIComponent(pageUrl);
      var t = encodeURIComponent(title);
      if (type === 'copy') {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(pageUrl).then(function () {
            btn.textContent = '\u2713 Copied!';
            setTimeout(function () { btn.textContent = '\uD83D\uDD17 Copy Link'; }, 1800);
          });
        }
        return;
      }
      var map = {
        twitter: 'https://twitter.com/intent/tweet?text=' + t + '&url=' + url,
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
        whatsapp: 'https://wa.me/?text=' + t + '%20' + url
      };
      if (map[type]) window.open(map[type], '_blank', 'noopener,noreferrer,width=600,height=500');
    });
  });

  /* ---------- Comments (lazy) ---------- */
  var box = document.getElementById('commentsContainer');
  var loaded = false;
  function loadComments() {
    if (loaded || !box || !C.hasComments()) return;
    loaded = true;
    C.loadDisqusThread(box, { identifier: id, url: pageUrl, title: title });
  }
  if (box) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); loadComments(); }
      }, { rootMargin: '400px 0px' });
      io.observe(box);
    } else {
      loadComments();
    }
  }

  /* ---------- Reading progress bar ---------- */
  var progressBar = document.getElementById('readingProgressBar');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'readingProgressBar';
    document.body.insertBefore(progressBar, document.body.firstChild);
  }

  /* ---------- Scroll-to-top button ---------- */
  var topBtn = document.getElementById('scrollTopBtn');
  if (!topBtn) {
    topBtn = document.createElement('button');
    topBtn.id = 'scrollTopBtn';
    topBtn.type = 'button';
    topBtn.setAttribute('aria-label', 'Scroll to top');
    topBtn.textContent = '↑';
    document.body.appendChild(topBtn);
  }

  function onScroll() {
    var h = document.documentElement;
    var scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
    progressBar.style.width = Math.min(100, Math.max(0, scrolled)) + '%';
    topBtn.classList.toggle('visible', window.scrollY > 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
})();
