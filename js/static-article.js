/* ==========================================================================
   TechPulse — static-article.js v20261005
   Interactivity for static SEO pages at /a/<slug>.html
   Adds: view counter, like, save, share, lazy comments, TOC, progress bar,
   scroll-to-top, and language switching via ?lang=xx.
   Requires js/common.js and js/toc.js
   ========================================================================== */
(function () {
  'use strict';

  var C = window.TPCommon;
  var art = document.querySelector('article.single-article') ||
            document.querySelector('article') ||
            document.querySelector('main') ||
            document.body;

  if (!C || !art) return;

  var pm = location.pathname.match(/\/a\/([^\/]+?)(?:\.html)?\/?$/);
  var id = art.getAttribute('data-id') || (pm ? 'm-' + decodeURIComponent(pm[1]) : '');
  if (!id) return;

  var h1 = art.querySelector('h1') || document.querySelector('h1');
  var title = h1 ? h1.textContent : document.title;
  var canonEl = document.querySelector('link[rel="canonical"]');
  var pageUrl = canonEl ? canonEl.href : location.origin + location.pathname;

  C.initDarkMode();
  C.trackAndGetSiteStats();

  /* ---------- View counter ---------- */
  var wrap = document.getElementById('tpViewsWrap');
  var num = document.getElementById('tpViews');
  C.registerView(id).then(function (v) {
    if (num) num.textContent = v;
    if (wrap) wrap.hidden = false;
  });

  /* ---------- Language switching via ?lang=xx ---------- */
  function applyUrlLang() {
    var params = new URLSearchParams(location.search);
    var lang = params.get('lang');
    if (!lang || lang === 'en') return;
    var supported = ['zh', 'es', 'hi', 'fr', 'pt'];
    if (supported.indexOf(lang) === -1) return;

    document.documentElement.setAttribute('lang', lang);

    if (window.TPI18N && window.TPI18N.setLang) {
      window.TPI18N.setLang(lang);
    }

    C.getArticles().then(function (all) {
      var article = all.find(function (a) {
        return String(a.id) === String(id) || String(a.slug) === String(id);
      });
      if (!article) return;

      var tI18n = article.title_i18n || {};
      var eI18n = article.excerpt_i18n || {};
      var cI18n = article.content_i18n || {};

      // ================================
      // 1) TITLE
      // ================================
      var newTitle = tI18n[lang];
      if (newTitle && h1) {
        h1.textContent = newTitle;
        document.title = newTitle + ' | TechPulse';
      }

      // ================================
      // 2) EXCERPT
      // ================================
      var newExcerpt = eI18n[lang];
      var excerptEl = art.querySelector('.article-excerpt p');
      if (newExcerpt && excerptEl) excerptEl.textContent = newExcerpt;

      // ================================
      // 3) CONTENT + FAQ
      // ================================
      var newContent = cI18n[lang];
      var contentEl = art.querySelector('.article-content');
      if (newContent && contentEl) {
        var faqRegex = /(?:^|\n)##\s+Frequently Asked Questions\s*\n([\s\S]*?)(?=\n##\s+|$)/i;
        var faqMatch = newContent.match(faqRegex);

        var mainContent = newContent;
        var translatedFaqItems = [];

        if (faqMatch) {
          var faqBody = faqMatch[1];
          var qRe = /###\s+(.+?)\s*\n+([\s\S]*?)(?=\n###\s|$)/g;
          var m;
          while ((m = qRe.exec(faqBody))) {
            var q = m[1].trim();
            var a = m[2].trim();
            if (q && a) translatedFaqItems.push({ q: q, a: a });
          }
          mainContent = newContent.replace(faqRegex, '');
        }

        contentEl.innerHTML = renderMarkdown(mainContent);
        rebuildToc();

        if (translatedFaqItems.length) {
          var faqSection = art.querySelector('.faq-section');
          var faqHeading = (window.TPI18N && window.TPI18N.t) ? window.TPI18N.t('faq_heading') : 'FAQ';
          var faqHTML = '<h2>' + C.esc(faqHeading) + '</h2>' +
            translatedFaqItems.map(function (f) {
              return '<details class="faq-item"><summary><strong>' + C.esc(f.q) + '</strong></summary><p>' + C.esc(f.a) + '</p></details>';
            }).join('');
          if (faqSection) {
            faqSection.innerHTML = faqHTML;
          } else {
            var newSection = document.createElement('section');
            newSection.className = 'faq-section';
            newSection.innerHTML = faqHTML;
            contentEl.parentNode.insertBefore(newSection, contentEl.nextSibling);
          }
        }
      }

      // ================================
      // 4) RELATED ARTICLES (translate titles, excerpts, categories)
      // ================================
      var relatedCards = art.parentNode.querySelectorAll('.related-section .article-card');
      relatedCards.forEach(function (card) {
        var link = card.querySelector('h3 a');
        if (!link) return;
        var href = link.getAttribute('href') || '';
        var match = href.match(/\/a\/([^\/]+?)\.html/);
        if (!match) return;
        var relatedSlug = match[1];
        var relatedArticle = all.find(function (x) { return x.slug === relatedSlug; });
        if (!relatedArticle) return;

        // Translate category
        var catEl = card.querySelector('.card-category');
        if (catEl && relatedArticle.category) {
          catEl.textContent = C.translateCategory(relatedArticle.category, lang);
        }

        // Translate title
        if (relatedArticle.title_i18n && relatedArticle.title_i18n[lang]) {
          link.textContent = relatedArticle.title_i18n[lang];
        }

        // Translate excerpt
        var pEl = card.querySelector('p');
        if (pEl && relatedArticle.excerpt_i18n && relatedArticle.excerpt_i18n[lang]) {
          pEl.textContent = relatedArticle.excerpt_i18n[lang];
        }

        // Translate "Read More" link
        var readMore = card.querySelector('.read-more');
        if (readMore && window.TPI18N && window.TPI18N.t) {
          var t = window.TPI18N.t('read_more') || 'Read More';
          readMore.textContent = t + ' →';
        }
      });

      // Translate "Related Articles" heading
      var relatedHeading = art.parentNode.querySelector('.related-section .section-heading');
      if (relatedHeading && window.TPI18N && window.TPI18N.t) {
        relatedHeading.textContent = window.TPI18N.t('related_heading') || '📚 Related Articles';
      }

      // ================================
      // 5) SECTION HEADINGS (Comments, Share, Tags)
      // ================================
      if (window.TPI18N && window.TPI18N.t) {
        // Comments heading
        var commentsHeading = art.querySelector('.comments-section .section-heading');
        if (commentsHeading) commentsHeading.textContent = window.TPI18N.t('comments_title') || '💬 Comments';

        // Share buttons
        var shareLabel = art.querySelector('.share-label');
        if (shareLabel) shareLabel.textContent = window.TPI18N.t('share_label') || 'Share:';

        var saveBtn = document.getElementById('tpSave');
        if (saveBtn) {
          var saveIcon = saveBtn.textContent.indexOf('📌') !== -1 ? '📌' : '🔖';
          saveBtn.textContent = saveIcon + ' ' + (lang === 'zh' ? '保存' : lang === 'es' ? 'Guardar' : lang === 'hi' ? 'सहेजें' : lang === 'fr' ? 'Sauvegarder' : lang === 'pt' ? 'Salvar' : 'Save');
        }

        var copyBtn = art.querySelector('.share-btn[data-share="copy"]');
        if (copyBtn) {
          var copyIcon = '🔗';
          copyBtn.textContent = copyIcon + ' ' + (window.TPI18N.t('share_copy') || 'Copy Link');
        }
      }

      // ================================
      // 6) META TAGS
      // ================================
      var ogT = document.querySelector('meta[property="og:title"]');
      var ogD = document.querySelector('meta[property="og:description"]');
      var desc = document.querySelector('meta[name="description"]');
      if (ogT && newTitle) ogT.setAttribute('content', newTitle);
      if (ogD && newExcerpt) ogD.setAttribute('content', newExcerpt);
      if (desc && newExcerpt) desc.setAttribute('content', newExcerpt);

      // ================================
      // 7) LANGUAGE BANNER
      // ================================
      showLangBanner(lang);
    }).catch(function (e) {
      console.warn('[TP] translation load failed', e);
    });
  }
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
      if (i % 2) {
        out.push('<pre><code>' + esc(chunk.replace(/\n$/, '')) + '</code></pre>');
        return;
      }
      var blocks = chunk
        .replace(/^(#{1,3} .+)$/gm, '\n$1\n')
        .split(/\n\n+/)
        .map(function (b) { return b.trim(); })
        .filter(Boolean);

      blocks.forEach(function (b) {
        var m;
        if ((m = b.match(/^###\s+(.+)$/))) {
          out.push('<h3>' + inline(m[1]) + '</h3>');
        } else if ((m = b.match(/^#{1,2}\s+(.+)$/))) {
          out.push('<h2>' + inline(m[1]) + '</h2>');
        } else if (b.split('\n').every(function (l) { return /^\s*[-*•]\s+/.test(l); })) {
          out.push('<ul>' + b.split('\n').map(function (l) {
            return '<li>' + inline(l.replace(/^\s*[-*•]\s+/, '')) + '</li>';
          }).join('') + '</ul>');
        } else if (b.split('\n').every(function (l) { return /^\s*\d+[.)]\s+/.test(l); })) {
          out.push('<ol>' + b.split('\n').map(function (l) {
            return '<li>' + inline(l.replace(/^\s*\d+[.)]\s+/, '')) + '</li>';
          }).join('') + '</ol>');
        } else {
          out.push('<p>' + inline(b).replace(/\n/g, '<br>') + '</p>');
        }
      });
    });
    return out.join('\n');
  }

  function showLangBanner(lang) {
    if (document.getElementById('tpLangBanner')) return;
    var names = { zh: '中文', es: 'Español', hi: 'हिन्दी', fr: 'Français', pt: 'Português' };
    var flags = { zh: '🇨🇳', es: '🇪🇸', hi: '🇮🇳', fr: '🇫🇷', pt: '🇵🇹' };
    var banner = document.createElement('div');
    banner.id = 'tpLangBanner';
    banner.className = 'tp-lang-banner';
    banner.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:var(--primary-soft);border:1px solid var(--border);border-radius:8px;margin:16px 0 8px;font-size:0.9rem';
    banner.innerHTML =
      '<span>' + flags[lang] + ' Reading in <strong>' + names[lang] + '</strong></span>' +
      '<a href="' + location.pathname + '" style="font-weight:600;padding:4px 12px;background:var(--bg-alt);border-radius:999px;border:1px solid var(--border)">Read in English</a>';
    var container = document.querySelector('main.container') || document.body;
    var firstArticle = container.querySelector('article');
    if (firstArticle) container.insertBefore(banner, firstArticle);
    else container.insertBefore(banner, container.firstChild);
  }

  /* ---------- TOC ---------- */
  var tocInstance = null;
  function buildToc() {
    if (!window.TPToc) return;
    var contentEl = art.querySelector('.article-content');
    if (!contentEl) return;

    var slot = document.getElementById('articleToc');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'articleToc';
      slot.className = 'article-toc-slot';
      contentEl.parentNode.insertBefore(slot, contentEl);
    }
    tocInstance = window.TPToc.build(contentEl, {
      minHeadings: 3,
      containerSelector: '#articleToc',
      scrollOffset: 90
    });
  }

  function rebuildToc() {
    var slot = document.getElementById('articleToc');
    if (slot) slot.innerHTML = '';
    buildToc();
  }

  /* ---------- Like ---------- */
  var likeBtn = document.getElementById('tpLike');
  function paintLike() {
    if (!likeBtn) return;
    var liked = C.hasLiked(id);
    likeBtn.classList.toggle('liked', liked);
    likeBtn.innerHTML = (liked ? '\u2764\uFE0F' : '\uD83E\uDD0D') +
      ' <span class="like-count">' + C.getLikeCount(id) + '</span>';
  }
  if (likeBtn) {
    paintLike();
    likeBtn.addEventListener('click', function () {
      C.toggleLike(id);
      paintLike();
    });
  }

  /* ---------- Save ---------- */
  var saveBtn = document.getElementById('tpSave');
  function paintSave() {
    if (saveBtn) {
      saveBtn.textContent = (C.isBookmarked(id) ? '\uD83D\uDCCC' : '\uD83D\uDD16') + ' Save';
    }
  }
  if (saveBtn) {
    paintSave();
    saveBtn.addEventListener('click', function () {
      C.toggleBookmark(id, title);
      paintSave();
    });
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
        if (entries.some(function (e) { return e.isIntersecting; })) {
          io.disconnect();
          loadComments();
        }
      }, { rootMargin: '400px 0px' });
      io.observe(box);
    } else {
      loadComments();
    }
  }

  /* ---------- Progress bar ---------- */
  var progressBar = document.getElementById('readingProgressBar');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'readingProgressBar';
    document.body.insertBefore(progressBar, document.body.firstChild);
  }

  /* ---------- Scroll-to-top ---------- */
  var topBtn = document.getElementById('scrollTopBtn');
  if (!topBtn) {
    topBtn = document.createElement('button');
    topBtn.id = 'scrollTopBtn';
    topBtn.type = 'button';
    topBtn.setAttribute('aria-label', 'Scroll to top');
    topBtn.textContent = '\u2191';
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
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    applyUrlLang();
    setTimeout(buildToc, 150);
  });

  if (document.readyState !== 'loading') {
    applyUrlLang();
    setTimeout(buildToc, 150);
  }
})();