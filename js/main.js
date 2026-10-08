/* ==========================================================================
   TechPulse Global Engine (main.js) v20261005
   Homepage article engine + Trending + Best Picks + Did You Know
   Requires js/common.js and js/i18n.js to be loaded first.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.TPCommon;
  var I = window.TPI18N;

  if (!C || !I) {
    console.warn('[TP] main.js requires common.js and i18n.js');
    return;
  }

  var allArticles = [];
  var activeCategory = 'all';
  var searchTerm = '';
  var siteStats = null;
  var newsFeedCache = [];

  var VISIT_LABELS = {
    en: ['Visits today', 'Total visits'],
    zh: ['今日访问', '总访问量'],
    es: ['Visitas hoy', 'Visitas totales'],
    hi: ['आज के विज़िट', 'कुल विज़िट'],
    fr: ["Visites aujourd'hui", 'Visites totales'],
    pt: ['Visitas hoje', 'Visitas totais']
  };

  /* ---------- Bootstrap ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    C.initDarkMode();
    C.initAdminGate();
    C.initTicker();
    initNewsWidget();
    initScrollProgress();
    initScrollTopButton();
    enableCodeCopying();
    initNewsletterForm();
    renderBookmarksList();
    renderDidYouKnow();
    renderBestPicks();
    renderTrendingToday();
    initArticlesEngine();
  });

  document.addEventListener('tp:langchange', function () {
    renderBookmarksList();
    renderNewsWidget();
    renderDidYouKnow();
    renderBestPicks();
    renderTrendingToday();
    if (document.getElementById('articles-container')) {
      renderSiteStats();
    loadAcademyPreviewStats();
      renderGlobalStats();
      renderFeatured();
      renderFilters();
      renderTags();
      renderArticlesUI();
      renderTrending();
      renderLanguageCoverage();
      renderSiteStatus();
    }
  });

  /* ---------- Trending Today (Hacker News) ---------- */
  async function renderTrendingToday() {
    var list = document.getElementById('trendingList');
    if (!list) return;
    var updatedEl = document.getElementById('trendingUpdated');

    try {
      var items = await C.loadTrending(5);
      if (!items || !items.length) {
        list.innerHTML = '<li class="trending-item" style="justify-content:center;color:var(--text-muted);padding:30px"><span>No trending topics available.</span></li>';
        return;
      }

      list.innerHTML = items.map(function (it, i) {
        var cls = 'trending-item' + (i < 3 ? ' top-3' : '');
        return '<li class="' + cls + '">' +
          '<span class="trending-rank">' + (i + 1) + '</span>' +
          '<div class="trending-content">' +
            '<h3><a href="' + C.esc(it.url) + '" target="_blank" rel="noopener">' + C.esc(it.title) + '</a></h3>' +
            '<div class="trending-meta">' +
              '<span class="source-tag">' + C.esc(it.source) + '</span>' +
              '<span>▲ ' + (it.score || 0) + ' points</span>' +
              '<span>💬 ' + (it.comments || 0) + ' comments</span>' +
            '</div>' +
          '</div>' +
        '</li>';
      }).join('');

      if (updatedEl) {
        var now = new Date();
        updatedEl.textContent = 'Updated ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      console.warn('[TP] trending failed', e);
      list.innerHTML = '<li class="trending-item" style="justify-content:center;color:var(--text-muted);padding:30px"><span>Unable to load trending topics.</span></li>';
    }
  }

  /* ---------- Did You Know ---------- */
  function renderDidYouKnow() {
    var contentEl = document.getElementById('dykContent');
    var sourceEl = document.getElementById('dykSource');
    if (!contentEl) return;
    var fact = C.getDidYouKnow();
    if (!fact) return;
    contentEl.textContent = fact.text;
    if (sourceEl) sourceEl.textContent = '— ' + fact.source;
  }

  /* ---------- Best Picks ---------- */
  async function renderBestPicks() {
    var grid = document.getElementById('picksGrid');
    if (!grid) return;

    var picks = await C.loadBestPicks();
    if (!picks || !picks.length) {
      grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;grid-column:1/-1">Best picks coming soon.</p>';
      return;
    }

    var labels = {
      best: I.t('best_pick') || 'Best',
      also_great: I.t('also_great') || 'Also Great',
      budget: I.t('budget_pick') || 'Budget',
      upgrade: I.t('upgrade_pick') || 'Upgrade'
    };

    grid.innerHTML = picks.map(function (p) {
      var tier = p.tier || 'best';
      var tierClass = tier === 'also_great' ? 'also-great' : tier;
      var tierLabel = labels[tier] || labels.best;
      return '<div class="pick-card ' + tierClass + '">' +
        '<span class="pick-badge ' + tierClass + '">' + C.esc(tierLabel) + '</span>' +
        '<h4>' + C.esc(p.title || '') + '</h4>' +
        (p.price ? '<div class="pick-price">' + C.esc(p.price) + '</div>' : '') +
        '<p class="pick-why">' + C.esc(p.why || '') + '</p>' +
      '</div>';
    }).join('');
  }

  /* ---------- News widget (sidebar) ---------- */
  function initNewsWidget() {
    var list = document.getElementById('newsWidgetList');
    if (!list) return;
    if (window.TPLiveNews) {
      window.TPLiveNews.startAutoRefresh(function (feed) {
        newsFeedCache = feed;
        renderNewsWidget();
      });
    }
  }

  function renderNewsWidget() {
    var list = document.getElementById('newsWidgetList');
    if (!list || !newsFeedCache.length) return;
    var lang = I.getLang();
    var items = newsFeedCache.slice(0, 6);
    list.innerHTML = items.map(function (item) {
      var titleText = (item.title && item.title[lang]) ? item.title[lang] : (item.title.en || item.title);
      var tagKey = item.category === 'oil_gas' ? 'news_oil_label' : 'news_tech_label';
      var href = item.url && item.url !== '#' ? item.url : '#';
      return '<a class="news-widget-item" href="' + C.esc(href) + '"' +
        (href !== '#' ? ' target="_blank" rel="noopener"' : '') + '>' +
        '<span class="news-widget-tag">' + C.esc(I.t(tagKey)) + '</span>' +
        C.esc(titleText) +
      '</a>';
    }).join('');
  }

  /* ---------- Bookmarks widget ---------- */
  function renderBookmarksList() {
    var container = document.getElementById('bookmarksList');
    if (!container) return;
    var bookmarks = C.getBookmarks();
    if (!bookmarks.length) {
      container.innerHTML = '<li>' + C.esc(I.t('no_bookmarks')) + '</li>';
      return;
    }
    container.innerHTML = bookmarks.map(function (b) {
      return '<li style="margin-bottom:6px">📌 <a href="article.html?id=' +
        encodeURIComponent(b.id) + '" style="color:var(--primary);text-decoration:none">' +
        C.esc(b.title) + '</a></li>';
    }).join('');
  }

  /* ---------- Scroll progress + back to top ---------- */
  function initScrollProgress() {
    var bar = document.getElementById('readingProgressBar');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var winScroll = document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (height > 0 ? (winScroll / height) * 100 : 0) + '%';
    }, { passive: true });
  }

  function initScrollTopButton() {
    var btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Code copy button ---------- */
  function enableCodeCopying() {
    document.querySelectorAll('pre').forEach(function (block) {
      if (block.querySelector('.copy-code-btn')) return;
      var btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.type = 'button';
      btn.innerText = 'Copy';
      block.appendChild(btn);
      btn.addEventListener('click', function () {
        var codeEl = block.querySelector('code');
        var code = codeEl ? codeEl.innerText : block.innerText;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(code).then(function () {
            btn.innerText = 'Copied!';
            setTimeout(function () { btn.innerText = 'Copy'; }, 2000);
          });
        }
      });
    });
  }

  /* ---------- Newsletter form (Buttondown via common.js) ---------- */
  function initNewsletterForm() {
    document.querySelectorAll('.newsletter-form').forEach(function (form) {
      if (form.dataset.wired) return;
      form.dataset.wired = '1';
      var msg = form.querySelector('.newsletter-msg');
      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn ? btn.textContent : '';

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var emailInput = form.querySelector('input[type="email"]');
        if (!emailInput) return;
        var email = emailInput.value.trim();

        if (btn) { btn.disabled = true; btn.textContent = '...'; }
        if (msg) { msg.textContent = ''; msg.className = 'newsletter-msg'; }

        try {
          await C.subscribeNewsletter(email);
          if (msg) { msg.textContent = I.t('newsletter_success'); msg.className = 'newsletter-msg'; }
          C.showToast(I.t('newsletter_success'));
          form.reset();
        } catch (err) {
          if (msg) { msg.textContent = I.t('newsletter_error'); msg.className = 'newsletter-msg error'; }
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = originalText; }
        }
      });
    });
  }

  /* ---------- Site stats bar ---------- */
  function renderSiteStats() {
    var box = document.getElementById('siteStatsBar');
    if (!box) return;

    // ???? ??? ???????? ????????
    var langs = ['zh', 'es', 'hi', 'fr', 'pt'];
    var translated = allArticles.filter(function (a) {
      if (!a.title_i18n) return false;
      return langs.some(function (l) { return a.title_i18n[l]; });
    });

    box.innerHTML =
      '<div class="stat-block"><span class="stat-num">' + translated.length + '</span>' +
      '<span class="stat-label">' + C.esc(I.t('stats_articles')) + '</span></div>';
  }

  /* ---------- Global visits footer ---------- */
  function renderGlobalStats() {
    var box = document.getElementById('globalSiteStats');
    if (!box || !siteStats) return;
    var labels = VISIT_LABELS[I.getLang()] || VISIT_LABELS.en;
    var fmt = function (n) { return Number(n || 0).toLocaleString(); };
    box.innerHTML =
      '<span>👁️ ' + C.esc(labels[0]) + ': <strong>' + fmt(siteStats.daily) + '</strong></span>' +
      '<span style="margin:0 12px;opacity:.5">|</span>' +
      '<span>📊 ' + C.esc(labels[1]) + ': <strong>' + fmt(siteStats.total) + '</strong></span>';
  }

  /* ---------- Language coverage ---------- */
  function renderLanguageCoverage() {
    var box = document.getElementById('langCoverage');
    if (!box) return;
    var langs = ['zh', 'es', 'hi', 'fr', 'pt'];
    var flags = { zh: '🇨🇳', es: '🇪🇸', hi: '🇮🇳', fr: '🇫🇷', pt: '🇵🇹' };
    var names = { zh: '中文', es: 'ES', hi: 'हिन्दी', fr: 'FR', pt: 'PT' };

    // احسب فقط المقالات المترجمة (التي لها ترجمة واحدة على الأقل)
    var translatedArticles = allArticles.filter(function (a) {
      if (!a.title_i18n) return false;
      return langs.some(function (l) { return a.title_i18n[l]; });
    });

    var articleCount = translatedArticles.length;
    var translatedCounts = { zh: 0, es: 0, hi: 0, fr: 0, pt: 0 };
    translatedArticles.forEach(function (a) {
      langs.forEach(function (l) {
        if (a.title_i18n[l]) translatedCounts[l]++;
      });
    });

    var totalTranslations = Object.keys(translatedCounts).reduce(function (s, k) { return s + translatedCounts[k]; }, 0);
    var totalPossible = articleCount * langs.length;
    var coverage = totalPossible > 0 ? Math.round((totalTranslations / totalPossible) * 100) : 0;

    box.innerHTML = '<span><strong>' + articleCount + '</strong> 📚 articles</span>' +
      '<span><strong>' + coverage + '%</strong> 🌍 translated</span>' +
      langs.map(function (code) {
        var c = translatedCounts[code];
        return '<span>' + flags[code] + ' ' + names[code] + ' <strong>' + c + '</strong></span>';
      }).join('');
  }

  /* ---------- Site status ---------- */
  function renderSiteStatus() {
    var el = document.getElementById('siteStatusUpdated');
    if (!el) return;
    var now = new Date();
    var localeMap = { en: 'en-US', zh: 'zh-CN', es: 'es-ES', hi: 'hi-IN', fr: 'fr-FR', pt: 'pt-PT' };
    var loc = localeMap[I.getLang()] || 'en-US';
    el.textContent = 'Updated: ' + now.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- Homepage article engine ---------- */
  async function initArticlesEngine() {
    var grid = document.getElementById('articles-container');
    if (!grid) return;

    var statsPromise = C.trackAndGetSiteStats().then(function (s) {
      siteStats = s;
      renderGlobalStats();
    });

    var results = await Promise.all([C.getArticles(), C.loadStaticSlugs()]);
    allArticles = results[0];

    renderSiteStats();
    loadAcademyPreviewStats();
    renderFeatured();
    renderFilters();
    renderTags();
    renderArticlesUI();
    renderTrending();
    renderLanguageCoverage();
    renderSiteStatus();
    wireSearch();
    wireCategoryDropdown();

    C.refreshViews().then(function () {
      renderFeatured();
      renderArticlesUI();
      renderTrending();
    });

    await statsPromise;
    renderGlobalStats();
  }

  /* ---------- Featured ---------- */
  function renderFeatured() {
    var section = document.getElementById('featuredSection');
    var box = document.getElementById('featuredSpotlight');
    if (!section || !box) return;
    var lang = I.getLang();
    var featured = allArticles.filter(function (a) { return a.featured; }).slice(0, 3);
    if (!featured.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    box.innerHTML = featured.map(function (a) {
      return renderCard(C.localizeArticle(a, lang), lang);
    }).join('');
    wireCardInteractions(box);
  }

  function categoriesOf(articles) {
    var set = {};
    articles.forEach(function (a) { if (a.category) set[a.category] = 1; });
    return Object.keys(set).sort();
  }

  /* ---------- Filters (hidden container for compatibility) ---------- */
  function renderFilters() {
    var box = document.getElementById('filters');
    if (!box) return;
    var lang = I.getLang();
    var cats = categoriesOf(allArticles);
    var chip = function (cat, label) {
      return '<button type="button" class="filter-chip' + (activeCategory === cat ? ' active' : '') + '" data-cat="' + C.esc(cat) + '">' + C.esc(label) + '</button>';
    };
    box.innerHTML = chip('all', I.t('filter_all')) +
      cats.map(function (c) { return chip(c, C.translateCategory(c, lang)); }).join('');

    box.querySelectorAll('.filter-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeCategory = btn.dataset.cat;
        box.querySelectorAll('.filter-chip').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        renderArticlesUI();
      });
    });
  }

  /* ---------- Tags ---------- */
  function renderTags() {
    var box = document.getElementById('tagList');
    if (!box) return;
    var tagSet = {};
    allArticles.forEach(function (a) {
      if (Array.isArray(a.tags)) a.tags.forEach(function (t) { tagSet[t] = (tagSet[t] || 0) + 1; });
    });
    var tags = Object.keys(tagSet).sort(function (a, b) { return tagSet[b] - tagSet[a]; }).slice(0, 20);
    if (!tags.length) { box.innerHTML = ''; return; }
    box.innerHTML = tags.map(function (tag) {
      return '<button type="button" class="tag" data-tag="' + C.esc(tag) + '">' + C.esc(tag) + '</button>';
    }).join('');
    box.querySelectorAll('.tag').forEach(function (btn) {
      btn.addEventListener('click', function () {
        searchTerm = btn.dataset.tag;
        var search = document.getElementById('searchInput');
        if (search) search.value = searchTerm;
        renderArticlesUI();
      });
    });
  }

  /* ---------- Trending sidebar ---------- */
  function renderTrending() {
    var list = document.getElementById('trendingListSidebar');
    if (!list) return;
    var lang = I.getLang();
    var top = allArticles.slice().sort(function (a, b) {
      return C.getViews(b.id) - C.getViews(a.id);
    }).slice(0, 5);
    if (!top.length) { list.innerHTML = ''; return; }
    list.innerHTML = top.map(function (a, i) {
      return '<li>' +
        '<span class="popular-num">' + (i + 1) + '</span>' +
        '<a href="' + C.esc(C.articleUrl(a, lang)) + '">' + C.esc(C.pickLocalized(a.title, lang)) + '</a>' +
      '</li>';
    }).join('');
  }

  /* ---------- Search ---------- */
  function wireSearch() {
    var input = document.getElementById('searchInput');
    if (!input) return;
    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        searchTerm = input.value.trim();
        renderArticlesUI();
      }, 200);
    });
  }

  /* ---------- Category dropdown ---------- */
  function wireCategoryDropdown() {
    var dropdown = document.getElementById('categoryDropdown');
    if (!dropdown) return;
    dropdown.addEventListener('change', function (e) {
      var val = e.target.value.toLowerCase();
      var articles = document.querySelectorAll('#articles-container article, .article-card');
      articles.forEach(function (article) {
        var catEl = article.querySelector('.card-category, .category, .badge');
        var catText = catEl ? catEl.textContent.trim().toLowerCase() : '';
        article.style.display = (val === 'all' || catText === val) ? '' : 'none';
      });
    });
  }

  /* ---------- Matches filter ---------- */
  function matchesFilters(a, lang) {
    var inCategory = activeCategory === 'all' || a.category === activeCategory;
    if (!inCategory) return false;
    if (!searchTerm) return true;
    var term = searchTerm.toLowerCase();
    var title = C.pickLocalized(a.title, lang);
    var excerpt = C.pickLocalized(a.excerpt, lang);
    var haystack = [title, excerpt, a.category].concat(a.tags || []).join(' ').toLowerCase();
    return haystack.indexOf(term) !== -1;
  }

  /* ---------- Render articles UI ---------- */
  function renderArticlesUI() {
    var grid = document.getElementById('articles-container');
    if (!grid) return;
    var lang = I.getLang();
    var visible = allArticles
      .filter(function (a) { return matchesFilters(a, lang); })
      .sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });

    if (!visible.length) {
      grid.innerHTML = '<p class="loading-state">' + C.esc(I.t('no_results')) + '</p>';
      return;
    }

    grid.innerHTML = visible.map(function (a) {
      return renderCard(C.localizeArticle(a, lang), lang);
    }).join('');
    wireCardInteractions(grid);
  }

  /* ---------- Card renderer ---------- */
  function renderCard(a, lang) {
    var readMin = C.calcReadMinutes(a.content);
    var url = C.articleUrl(a, lang);
    var views = C.getViews(a.id);
    var liked = C.hasLiked(a.id);
    var likeCount = C.getLikeCount(a.id);
    var bookmarked = C.isBookmarked(a.id);
    var imgHTML = a.image
      ? '<img src="' + C.esc(a.image) + '" alt="' + C.esc(a.title) + '" style="width:100%;height:160px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:4px" loading="lazy">'
      : '';

    return '<article class="article-card" data-id="' + C.esc(a.id) + '">' +
      imgHTML +
      '<span class="card-category">' + C.esc(C.translateCategory(a.category, lang)) + '</span>' +
      '<h3><a href="' + C.esc(url) + '">' + C.esc(a.title) + '</a></h3>' +
      '<p>' + C.esc(a.excerpt || '') + '</p>' +
      '<div class="card-meta">' +
        '<span>📅 ' + C.esc(C.formatDate(a.date, lang)) + '</span>' +
        '<span>⏱️ ' + readMin + ' ' + C.esc(I.t('read_time')) + '</span>' +
        '<span>👁️ ' + views + ' ' + C.esc(I.t('views')) + '</span>' +
      '</div>' +
      '<div class="card-meta" style="border-top:none;padding-top:0;align-items:center;justify-content:space-between">' +
        '<a href="' + C.esc(url) + '" class="read-more">' + C.esc(I.t('read_more')) + ' →</a>' +
        '<span style="display:flex;gap:10px;align-items:center">' +
          '<button type="button" class="like-btn' + (liked ? ' liked' : '') + '" data-like="' + C.esc(a.id) + '" aria-label="Like">' +
            (liked ? '❤️' : '🤍') + ' <span class="like-count">' + likeCount + '</span>' +
          '</button>' +
          '<button type="button" class="bookmark-btn" data-bookmark="' + C.esc(a.id) + '" data-title="' + C.esc(a.title) + '" aria-label="Bookmark">' +
            (bookmarked ? '📌' : '🔖') +
          '</button>' +
        '</span>' +
      '</div>' +
    '</article>';
  }

  /* ---------- Card interactions ---------- */
  function wireCardInteractions(grid) {
    grid.querySelectorAll('[data-like]').forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', function () {
        var id = btn.dataset.like;
        var result = C.toggleLike(id);
        btn.classList.toggle('liked', result.liked);
        btn.innerHTML = (result.liked ? '❤️' : '🤍') + ' <span class="like-count">' + result.count + '</span>';
      });
    });
    grid.querySelectorAll('[data-bookmark]').forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', function () {
        C.toggleBookmark(btn.dataset.bookmark, btn.dataset.title);
        btn.innerHTML = C.isBookmarked(btn.dataset.bookmark) ? '📌' : '🔖';
        renderBookmarksList();
      });
    });
  }
  /* ---------- Academy Preview Stats (real data from Supabase) ---------- */
  async function loadAcademyPreviewStats() {
    var previewCourses = document.getElementById('previewCourses');
    var previewLectures = document.getElementById('previewLectures');
    var previewProblems = document.getElementById('previewProblems');
    if (!previewCourses && !previewLectures && !previewProblems) return;

    try {
      var baseUrl = C.SUPABASE_URL;
      var headers = { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY };

      var res = await fetch(baseUrl + '/rest/v1/courses?select=lectures_count,assignments_count,exams_count', { headers: headers });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var courses = await res.json();
      if (!Array.isArray(courses)) courses = [];

      var totalCourses = courses.length;
      var totalLectures = courses.reduce(function (s, c) { return s + (Number(c.lectures_count) || 0); }, 0);
      var totalAssignments = courses.reduce(function (s, c) { return s + (Number(c.assignments_count) || 0); }, 0);
      var totalExams = courses.reduce(function (s, c) { return s + (Number(c.exams_count) || 0); }, 0);
      var totalProblems = totalAssignments + totalExams;

      if (previewCourses) previewCourses.textContent = String(totalCourses);
      if (previewLectures) previewLectures.textContent = String(totalLectures);
      if (previewProblems) previewProblems.textContent = String(totalProblems);
    } catch (e) {
      console.warn('[TP] academy preview stats failed', e);
      if (previewCourses) previewCourses.textContent = '0';
      if (previewLectures) previewLectures.textContent = '0';
      if (previewProblems) previewProblems.textContent = '0';
    }
  }
})();