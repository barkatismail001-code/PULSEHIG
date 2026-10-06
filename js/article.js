/* ==========================================================================
   TechPulse — Single Article (article.js) v20261005
   Fetches article from Supabase, renders it, adds TOC, likes, bookmarks,
   comments, related articles, structured data, and skeleton loading.
   Requires js/common.js, js/i18n.js, js/toc.js
   ========================================================================== */
(function () {
  'use strict';

  var C = window.TPCommon;
  var I = window.TPI18N;

  if (!C || !I) {
    console.warn('[TP] article.js requires common.js and i18n.js');
    return;
  }

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };

  function getParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function renderSkeleton() {
    var container = $('#articleContainer');
    if (!container) return;
    container.innerHTML =
      '<article class="single-article skeleton-article" aria-busy="true" aria-label="Loading article">' +
        '<header class="article-header">' +
          '<div class="skeleton skeleton-category"></div>' +
          '<div class="skeleton skeleton-title"></div>' +
          '<div class="skeleton skeleton-title short"></div>' +
          '<div class="article-meta">' +
            '<div class="skeleton skeleton-meta"></div>' +
            '<div class="skeleton skeleton-meta"></div>' +
            '<div class="skeleton skeleton-meta"></div>' +
          '</div>' +
        '</header>' +
        '<div class="skeleton skeleton-image"></div>' +
        '<div class="skeleton skeleton-excerpt"></div>' +
        '<div class="skeleton skeleton-line"></div>' +
        '<div class="skeleton skeleton-line"></div>' +
        '<div class="skeleton skeleton-line short"></div>' +
        '<div class="skeleton skeleton-line"></div>' +
        '<div class="skeleton skeleton-line medium"></div>' +
        '<div class="skeleton skeleton-line"></div>' +
        '<div class="skeleton skeleton-line short"></div>' +
      '</article>';
  }

  function renderNotFound() {
    var container = $('#articleContainer');
    if (!container) return;
    container.innerHTML =
      '<div class="not-found">' +
        '<div class="not-found-icon">🔍</div>' +
        '<h1 data-i18n="not_found_title">' + C.esc(I.t('not_found_title')) + '</h1>' +
        '<p data-i18n="not_found_desc">' + C.esc(I.t('not_found_desc')) + '</p>' +
        '<a href="index.html" class="btn-primary" data-i18n="back_home">' + C.esc(I.t('back_home')) + '</a>' +
      '</div>';
    document.title = I.t('not_found_title') + ' | TechPulse';
    I.apply();
  }

  function setMeta(property, content) {
    var el = document.querySelector('meta[property="' + property + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content || '');
  }

  function renderMarkdownContent(raw) {
    var md = function (s) {
      return C.esc(s)
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`\n]+)`/g, '<code>$1</code>');
    };

    var src = String(raw || '').replace(/\r\n/g, '\n');
    var chunks = src.split(/```[a-zA-Z0-9+#-]*\n([\s\S]*?)```/);
    var out = [];

    chunks.forEach(function (chunk, i) {
      if (i % 2) {
        out.push('<pre><code>' + C.esc(chunk.replace(/\n$/, '')) + '</code></pre>');
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
          out.push('<h3>' + md(m[1]) + '</h3>');
        } else if ((m = b.match(/^#{1,2}\s+(.+)$/))) {
          out.push('<h2>' + md(m[1]) + '</h2>');
        } else if (b.split('\n').every(function (l) { return /^\s*[-*•]\s+/.test(l); })) {
          out.push('<ul>' + b.split('\n').map(function (l) {
            return '<li>' + md(l.replace(/^\s*[-*•]\s+/, '')) + '</li>';
          }).join('') + '</ul>');
        } else if (b.split('\n').every(function (l) { return /^\s*\d+[.)]\s+/.test(l); })) {
          out.push('<ol>' + b.split('\n').map(function (l) {
            return '<li>' + md(l.replace(/^\s*\d+[.)]\s+/, '')) + '</li>';
          }).join('') + '</ol>');
        } else {
          out.push('<p>' + md(b).replace(/\n/g, '<br>') + '</p>');
        }
      });
    });

    return out.join('\n');
  }

  function renderArticle(rawArticle, rawAllArticles) {
    var lang = I.getLang();
    var article = C.localizeArticle(rawArticle, lang);

    document.title = article.title + ' | TechPulse';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', article.excerpt || '');

    setMeta('og:title', article.title);
    setMeta('og:description', article.excerpt || '');
    setMeta('og:type', 'article');

    var crumb = $('#breadcrumbTitle');
    if (crumb) {
      crumb.textContent = article.title.length > 40
        ? article.title.slice(0, 40) + '…'
        : article.title;
    }

    var readMin = C.calcReadMinutes(article.content);
    var liked = C.hasLiked(article.id);
    var likeCount = C.getLikeCount(article.id);
    var bookmarked = C.isBookmarked(article.id);

    var related = rawAllArticles
      .filter(function (a) {
        return String(a.id) !== String(rawArticle.id) && a.category === rawArticle.category;
      })
      .concat(rawAllArticles.filter(function (a) {
        return String(a.id) !== String(rawArticle.id) && a.category !== rawArticle.category;
      }))
      .slice(0, 3)
      .map(function (a) { return C.localizeArticle(a, lang); });

    var relatedHTML = related.length
      ? '<section class="related-section">' +
          '<h2 class="section-heading">' + C.esc(I.t('related_heading')) + '</h2>' +
          '<div class="articles-grid">' +
            related.map(function (r) {
              return '<article class="article-card">' +
                '<span class="card-category">' + C.esc(C.translateCategory(r.category, lang)) + '</span>' +
                '<h3><a href="' + C.esc(C.articleUrl(r, lang)) + '">' + C.esc(r.title) + '</a></h3>' +
                '<p>' + C.esc(r.excerpt) + '</p>' +
                '<a href="' + C.esc(C.articleUrl(r, lang)) + '" class="read-more">' + C.esc(I.t('read_more')) + ' →</a>' +
              '</article>';
            }).join('') +
          '</div>' +
        '</section>'
      : '';

    var contentHTML = renderMarkdownContent(article.content);

    var imgHTML = article.image
      ? '<img src="' + C.esc(article.image) + '" alt="' + C.esc(article.title) + '" class="article-hero-img" loading="eager" fetchpriority="high" width="1200" height="630">'
      : '';

    var galleryImages = Array.isArray(article.images) ? article.images.filter(Boolean) : [];
    var galleryHTML = galleryImages.length
      ? '<div class="article-gallery">' +
          galleryImages.map(function (src) {
            return '<img src="' + C.esc(src) + '" alt="' + C.esc(article.title) + '" loading="lazy" class="gallery-img">';
          }).join('') +
        '</div>'
      : '';

    var container = $('#articleContainer');
    container.innerHTML =
      '<article class="single-article" data-id="' + C.esc(article.id) + '">' +
        '<header class="article-header">' +
          '<span class="article-category">' + C.esc(C.translateCategory(article.category, lang)) + '</span>' +
          '<h1>' + C.esc(article.title) + '</h1>' +
          '<div class="article-meta">' +
            '<span>👤 ' + C.esc(article.author || 'TechPulse Team') + '</span>' +
            '<span>📅 ' + C.esc(C.formatDate(article.date, lang) || C.formatDate(new Date().toISOString(), lang)) + '</span>' +
            '<span>⏱ ' + readMin + ' ' + C.esc(I.t('read_time')) + '</span>' +
            '<span>👁️ <span id="articleViews">' + C.getViews(article.id) + '</span> ' + C.esc(I.t('views')) + '</span>' +
          '</div>' +
        '</header>' +
        imgHTML +
        '<div class="article-excerpt"><p>' + C.esc(article.excerpt) + '</p></div>' +
        '<div id="articleToc" class="article-toc-slot"></div>' +
        '<div class="article-content">' + contentHTML + '</div>' +
        galleryHTML +
        '<div class="share-buttons">' +
          '<span class="share-label">' + C.esc(I.t('share_label')) + '</span>' +
          '<button class="like-btn' + (liked ? ' liked' : '') + '" id="articleLikeBtn" type="button" aria-label="Like">' +
            (liked ? '❤️' : '🤍') + ' <span class="like-count">' + likeCount + '</span>' +
          '</button>' +
          '<button class="share-btn" id="articleBookmarkBtn" type="button">' + (bookmarked ? '📌' : '🔖') + ' Save</button>' +
          '<button class="share-btn" data-share="twitter" type="button">𝕏 Twitter</button>' +
          '<button class="share-btn" data-share="facebook" type="button">Facebook</button>' +
          '<button class="share-btn" data-share="linkedin" type="button">LinkedIn</button>' +
          '<button class="share-btn" data-share="whatsapp" type="button">WhatsApp</button>' +
          '<button class="share-btn" data-share="copy" type="button">🔗 ' + C.esc(I.t('share_copy')) + '</button>' +
        '</div>' +
        '<div class="back-row">' +
          '<a href="index.html" class="btn-secondary">' + C.esc(I.t('back_all')) + '</a>' +
        '</div>' +
        '<section class="comments-section">' +
          '<h2 class="section-heading">' + C.esc(I.t('comments_title')) + '</h2>' +
          '<div id="commentsContainer"></div>' +
        '</section>' +
      '</article>' +
      relatedHTML;

    if (window.TPToc) {
      var contentEl = document.querySelector('.article-content');
      if (contentEl) {
        window.TPToc.build(contentEl, {
          minHeadings: 3,
          containerSelector: '#articleToc',
          scrollOffset: 90
        });
      }
    }

    var commentsContainer = document.getElementById('commentsContainer');
    if (commentsContainer) {
      C.loadDisqusThread(commentsContainer, {
        identifier: article.id,
        url: location.href,
        title: article.title
      });
    }

    var likeBtn = $('#articleLikeBtn');
    if (likeBtn) {
      likeBtn.addEventListener('click', function () {
        var res = C.toggleLike(article.id);
        likeBtn.classList.toggle('liked', res.liked);
        likeBtn.innerHTML = (res.liked ? '❤️' : '🤍') + ' <span class="like-count">' + res.count + '</span>';
      });
    }

    var bmBtn = $('#articleBookmarkBtn');
    if (bmBtn) {
      bmBtn.addEventListener('click', function () {
        C.toggleBookmark(article.id, article.title);
        bmBtn.innerHTML = (C.isBookmarked(article.id) ? '📌' : '🔖') + ' Save';
      });
    }

    document.querySelectorAll('.share-btn[data-share]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var type = btn.dataset.share;
        var url = encodeURIComponent(location.href);
        var title = encodeURIComponent(article.title);

        if (type === 'copy') {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(location.href).then(function () {
              btn.textContent = '✓ Copied!';
              setTimeout(function () { btn.textContent = '🔗 ' + I.t('share_copy'); }, 1800);
            });
          }
          return;
        }

        var map = {
          twitter: 'https://twitter.com/intent/tweet?text=' + title + '&url=' + url,
          facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
          linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
          whatsapp: 'https://wa.me/?text=' + title + '%20' + url
        };
        if (map[type]) window.open(map[type], '_blank', 'noopener,noreferrer,width=600,height=500');
      });
    });
  }

  function injectStructuredData(article) {
    var old = document.getElementById('article-jsonld');
    if (old) old.remove();

    var lang = I.getLang();
    var data = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: C.pickLocalized(article.title, lang),
      description: C.pickLocalized(article.excerpt, lang),
      datePublished: article.date || '',
      author: { '@type': 'Person', name: article.author || 'TechPulse Team' },
      image: article.image ? [new URL(article.image, location.href).href] : undefined,
      mainEntityOfPage: location.href,
      publisher: {
        '@type': 'Organization',
        name: 'TechPulse',
        logo: { '@type': 'ImageObject', url: 'https://www.pulsehig.com/assets/og-default.png' }
      }
    };

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'article-jsonld';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function initReadingProgress() {
    var bar = $('#readingProgressBar');
    var top = $('#scrollTopBtn');
    function onScroll() {
      if (bar) {
        var h = document.documentElement;
        var p = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
        bar.style.width = Math.min(100, p) + '%';
      }
      if (top) top.classList.toggle('visible', window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (top) {
      top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  var currentArticle = null;
  var currentAllArticles = [];

  document.addEventListener('tp:langchange', function () {
    if (currentArticle) renderArticle(currentArticle, currentAllArticles);
  });

  function slugOf(a) {
    var t = a.title;
    if (typeof t === 'string' && t.trim()[0] === '{') {
      try { t = JSON.parse(t); } catch (e) {}
    }
    var en = String(C.pickLocalized(t, 'en'))
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return en.toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70)
      .replace(/-+$/g, '');
  }

  document.addEventListener('DOMContentLoaded', async function () {
    C.initDarkMode();
    C.initAdminGate();
    C.initTicker();
    initReadingProgress();

    var id = getParam('id') || getParam('slug');
    if (!id) {
      renderNotFound();
      return;
    }

    renderSkeleton();

    C.trackAndGetSiteStats();

    var results = await Promise.all([C.getArticles(), C.loadStaticSlugs()]);
    var articles = results[0];

    var article = articles.find(function (a) {
      return String(a.id) === String(id) ||
             String(a.slug) === String(id) ||
             slugOf(a) === id;
    });

    if (!article) {
      renderNotFound();
      return;
    }

    currentArticle = article;
    currentAllArticles = articles;
    renderArticle(article, articles);
    injectStructuredData(article);

    var canonHref = C.canonicalUrl(article);
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.href = canonHref;
    setMeta('og:url', canonHref);

    C.registerView(article.id).then(function (v) {
      var el = document.getElementById('articleViews');
      if (el) el.textContent = v;
    });
  });
})();