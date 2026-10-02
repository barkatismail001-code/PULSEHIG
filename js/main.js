/* ==========================================================================
   TechPulse Global Engine (main.js)
   - Ticker, dark mode, admin gate, code copy → js/common.js + js/i18n.js
   - Homepage article engine: filters, tags, search, trending, cards
   - Reader interaction: bookmarks (sidebar) + likes + real view counts
   Requires js/common.js and js/i18n.js to be loaded first.
   ========================================================================== */
(function () {
  'use strict';
  const C = window.TPCommon;
  const I = window.TPI18N;

  let allArticles = [];
  let activeCategory = 'all';
  let searchTerm = '';

  document.addEventListener('DOMContentLoaded', () => {
    C.initDarkMode();
    C.initAdminGate();
    C.initTicker();
    initNewsWidget();
    initScrollProgress();
    initScrollTopButton();
    enableCodeCopying();
    initNewsletterForm();
    renderBookmarksList();
    initArticlesEngine();
  });

  document.addEventListener('tp:langchange', () => {
    renderBookmarksList();
    renderNewsWidget();
    if (document.getElementById('articles-container')) {
      renderSiteStats();
      renderFeatured();
      renderFilters();
      renderArticlesUI();
      renderTrending();
    }
  });

  /* ---------- Homepage "Latest News" widget (real, hourly-refreshed) ---------- */
  let newsFeedCache = [];
  function initNewsWidget() {
    const list = document.getElementById('newsWidgetList');
    if (!list) return;
    if (window.TPLiveNews) {
      window.TPLiveNews.startAutoRefresh(feed => { newsFeedCache = feed; renderNewsWidget(); });
    }
  }

  function renderNewsWidget() {
    const list = document.getElementById('newsWidgetList');
    if (!list || !newsFeedCache.length) return;
    const lang = I.getLang();
    const items = newsFeedCache.slice(0, 6);
    list.innerHTML = items.map(item => {
      const titleText = (item.title && item.title[lang]) ? item.title[lang] : (item.title.en || item.title);
      const tagKey = item.category === 'oil_gas' ? 'news_oil_label' : 'news_tech_label';
      const href = item.url && item.url !== '#' ? item.url : '#';
      return `<a class="news-widget-item" href="${C.esc(href)}"${href !== '#' ? ' target="_blank" rel="noopener"' : ''}>
        <span class="news-widget-tag">${C.esc(I.t(tagKey))}</span>${C.esc(titleText)}
      </a>`;
    }).join('');
  }

  /* ---------- Bookmarks widget ---------- */
  function renderBookmarksList() {
    const container = document.getElementById('bookmarksList');
    if (!container) return;
    const bookmarks = C.getBookmarks();
    if (bookmarks.length === 0) {
      container.innerHTML = `<li>${C.esc(I.t('no_bookmarks'))}</li>`;
      return;
    }
    container.innerHTML = bookmarks.map(b => `
      <li style="margin-bottom:6px;">📌 <a href="article.html?id=${encodeURIComponent(b.id)}" style="color:var(--text-color,#33b3ae);text-decoration:none;">${C.esc(b.title)}</a></li>
    `).join('');
  }

  /* ---------- Scroll progress + back-to-top (index/about/etc.) ---------- */
  function initScrollProgress() {
    const bar = document.getElementById('readingProgressBar');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (height > 0 ? (winScroll / height) * 100 : 0) + '%';
    });
  }

  function initScrollTopButton() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Code copy button ---------- */
  function enableCodeCopying() {
    document.querySelectorAll('pre').forEach(block => {
      if (block.querySelector('.copy-code-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.type = 'button';
      btn.innerText = 'Copy';
      block.appendChild(btn);
      btn.addEventListener('click', () => {
        const code = block.querySelector('code') ? block.querySelector('code').innerText : block.innerText;
        navigator.clipboard.writeText(code).then(() => {
          btn.innerText = 'Copied!';
          setTimeout(() => btn.innerText = 'Copy', 2000);
        });
      });
    });
  }

  /* ---------- Newsletter form (Netlify Forms, same pattern as contact.html) ---------- */
  function initNewsletterForm() {
    const form = document.querySelector('.newsletter-form');
    if (!form) return;
    const msg = form.querySelector('.newsletter-msg');

    function encode(data) {
      return Object.keys(data).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k])).join('&');
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]');
      if (!email || !email.value) return;

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode({ 'form-name': 'newsletter', email: email.value })
      })
        .then(() => {
          if (msg) msg.textContent = I.t('newsletter_success');
          form.reset();
        })
        .catch(() => {
          if (msg) msg.textContent = I.t('newsletter_error');
        });
    });
  }

  /* ==========================================================================
     Homepage article engine — the part of the site that was never wired up:
     #articles-container, #filters, #tagList and #trendingList existed in the
     markup but nothing ever populated them. Fixed here.
     ========================================================================== */
  async function initArticlesEngine() {
    const grid = document.getElementById('articles-container');
    if (!grid) return; // not the homepage

    allArticles = await C.getArticles();
    // Register a view for every article the moment its card enters the grid,
    // matching how a real "articles listing" page is usually counted.
    allArticles.forEach(a => C.registerView(a.id));

    renderSiteStats();
    renderFeatured();
    renderFilters();
    renderTags();
    renderArticlesUI();
    renderTrending();
    wireSearch();
  }

  function renderSiteStats() {
    const box = document.getElementById('siteStatsBar');
    if (!box) return;
    const lang = I.getLang();
    const cats = categoriesOf(allArticles).length;
    box.innerHTML = `
      <div class="stat-block"><span class="stat-num">${allArticles.length}</span><span class="stat-label">${C.esc(I.t('stats_articles'))}</span></div>
      <div class="stat-block"><span class="stat-num">${cats}</span><span class="stat-label">${C.esc(I.t('stats_categories'))}</span></div>
    `;
  }

  function renderFeatured() {
    const section = document.getElementById('featuredSection');
    const box = document.getElementById('featuredSpotlight');
    if (!section || !box) return;
    const lang = I.getLang();
    const featured = allArticles.filter(a => a.featured).slice(0, 3);
    if (!featured.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    box.innerHTML = featured.map(a => renderCard(C.localizeArticle(a, lang), lang)).join('');
    wireCardInteractions(box);
  }

  function categoriesOf(articles) {
    return [...new Set(articles.map(a => a.category).filter(Boolean))].sort();
  }

  function renderFilters() {
    const box = document.getElementById('filters');
    if (!box) return;
    const lang = I.getLang();
    const cats = categoriesOf(allArticles);
    const chip = (cat, label) =>
      `<button type="button" class="filter-chip${activeCategory === cat ? ' active' : ''}" data-cat="${C.esc(cat)}">${C.esc(label)}</button>`;
    box.innerHTML = chip('all', I.t('filter_all')) +
      cats.map(c => chip(c, C.translateCategory(c, lang))).join('');

    box.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        box.querySelectorAll('.filter-chip').forEach(b => b.classList.toggle('active', b === btn));
        renderArticlesUI();
      });
    });
  }

  function renderTags() {
    const box = document.getElementById('tagList');
    if (!box) return;
    const tags = [...new Set(allArticles.flatMap(a => Array.isArray(a.tags) ? a.tags : []))].slice(0, 20);
    if (!tags.length) { box.innerHTML = ''; return; }
    box.innerHTML = tags.map(tag => `<button type="button" class="tag" data-tag="${C.esc(tag)}">${C.esc(tag)}</button>`).join('');
    box.querySelectorAll('.tag').forEach(btn => {
      btn.addEventListener('click', () => {
        searchTerm = btn.dataset.tag;
        const search = document.getElementById('searchInput');
        if (search) search.value = searchTerm;
        renderArticlesUI();
      });
    });
  }

  function renderTrending() {
    const list = document.getElementById('trendingList');
    if (!list) return;
    const lang = I.getLang();
    const top = [...allArticles]
      .sort((a, b) => C.getViews(b.id) - C.getViews(a.id))
      .slice(0, 5);
    if (!top.length) { list.innerHTML = ''; return; }
    list.innerHTML = top.map((a, i) => `
      <li>
        <span class="popular-num">${i + 1}</span>
        <a href="article.html?id=${encodeURIComponent(a.id)}">${C.esc(C.pickLocalized(a.title, lang))}</a>
      </li>
    `).join('');
  }

  function wireSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', () => {
      searchTerm = input.value.trim();
      renderArticlesUI();
    });
  }

  function matchesFilters(a, lang) {
    const inCategory = activeCategory === 'all' || a.category === activeCategory;
    if (!inCategory) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const title = C.pickLocalized(a.title, lang);
    const excerpt = C.pickLocalized(a.excerpt, lang);
    const haystack = [title, excerpt, a.category, ...(a.tags || [])].join(' ').toLowerCase();
    return haystack.includes(term);
  }

  function renderArticlesUI() {
    const grid = document.getElementById('articles-container');
    if (!grid) return;
    const lang = I.getLang();
    const visible = allArticles
      .filter(a => matchesFilters(a, lang))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (!visible.length) {
      grid.innerHTML = `<p class="loading-state">${C.esc(I.t('no_results'))}</p>`;
      return;
    }

    grid.innerHTML = visible.map(a => renderCard(C.localizeArticle(a, lang), lang)).join('');
    wireCardInteractions(grid);
  }

  function renderCard(a, lang) {
    const readMin = C.calcReadMinutes(a.content);
    const views = C.getViews(a.id);
    const liked = C.hasLiked(a.id);
    const likeCount = C.getLikeCount(a.id);
    const imgHTML = a.image
      ? `<img src="${C.esc(a.image)}" alt="${C.esc(a.title)}" style="width:100%;height:160px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:4px;" loading="lazy">`
      : '';
    return `
      <article class="article-card" data-id="${C.esc(a.id)}">
        ${imgHTML}
        <span class="card-category">${C.esc(C.translateCategory(a.category, lang))}</span>
        <h3><a href="article.html?id=${encodeURIComponent(a.id)}">${C.esc(a.title)}</a></h3>
        <p>${C.esc(a.excerpt || '')}</p>
        <div class="card-meta">
          <span>📅 ${C.esc(C.formatDate(a.date, lang))}</span>
          <span>⏱️ ${readMin} ${C.esc(I.t('read_time'))}</span>
          <span>👁️ ${views} ${C.esc(I.t('views'))}</span>
        </div>
        <div class="card-meta" style="border-top:none;padding-top:0;align-items:center;justify-content:space-between">
          <a href="article.html?id=${encodeURIComponent(a.id)}" class="read-more">${C.esc(I.t('read_more'))} →</a>
          <span style="display:flex;gap:10px;align-items:center">
            <button type="button" class="like-btn${liked ? ' liked' : ''}" data-like="${C.esc(a.id)}" aria-label="Like">
              ${liked ? '❤️' : '🤍'} <span class="like-count">${likeCount}</span>
            </button>
            <button type="button" class="bookmark-btn" data-bookmark="${C.esc(a.id)}" data-title="${C.esc(a.title)}" aria-label="Bookmark">
              ${C.isBookmarked(a.id) ? '📌' : '🔖'}
            </button>
          </span>
        </div>
      </article>
    `;
  }

  function wireCardInteractions(grid) {
    grid.querySelectorAll('[data-like]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.like;
        const { liked, count } = C.toggleLike(id);
        btn.classList.toggle('liked', liked);
        btn.innerHTML = `${liked ? '❤️' : '🤍'} <span class="like-count">${count}</span>`;
      });
    });
    grid.querySelectorAll('[data-bookmark]').forEach(btn => {
      btn.addEventListener('click', () => {
        C.toggleBookmark(btn.dataset.bookmark, btn.dataset.title);
        btn.innerHTML = C.isBookmarked(btn.dataset.bookmark) ? '📌' : '🔖';
        renderBookmarksList();
      });
    });
  }
})();
