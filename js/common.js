/* ==========================================================================
   TechPulse — Shared Utilities (common.js) v20261005
   All pages depend on this file. Must load BEFORE main.js/article.js.
   ========================================================================== */
window.TPCommon = (function () {
  'use strict';

  // ===== Supabase Config =====
  var SUPABASE_URL = 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_5NcPMPDtyNXRg-oduydRUA_JM6IeV9k';

  // ===== Locales =====
  var LOCALE_MAP = { en: 'en-US', zh: 'zh-CN', es: 'es-ES', hi: 'hi-IN', fr: 'fr-FR', pt: 'pt-PT' };

  // ===== Escape HTML =====
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // ===== Slugify =====
  function slugify(str) {
    return String(str || '').toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // ===== Date formatting =====
  function formatDate(iso, lang) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] || 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (e) { return ''; }
  }

  // ===== Read time =====
  function calcReadMinutes(text) {
    var words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }

  // ===== Localization helpers =====
  function pickLocalized(field, lang) {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      if (field[lang]) return field[lang];
      if (field.en) return field.en;
      var first = Object.values(field).find(Boolean);
      return first || '';
    }
    return String(field);
  }

  function localizeArticle(article, lang) {
    if (!article) return article;
    function fromI18n(i18nField, fallback) {
      if (i18nField && typeof i18nField === 'object' && i18nField[lang]) return i18nField[lang];
      return pickLocalized(fallback, lang);
    }
    return Object.assign({}, article, {
      title: fromI18n(article.title_i18n, article.title),
      excerpt: fromI18n(article.excerpt_i18n, article.excerpt),
      content: fromI18n(article.content_i18n, article.content)
    });
  }

  // ===== Category translations =====
  var CATEGORY_LABELS = {
    'Technology': { en: 'Technology', zh: '科技', es: 'Tecnología', hi: 'तकनीक', fr: 'Technologie', pt: 'Tecnologia' },
    'Petroleum': { en: 'Petroleum', zh: '石油', es: 'Petróleo', hi: 'पेट्रोलियम', fr: 'Pétrole', pt: 'Petróleo' },
    'Gas': { en: 'Natural Gas', zh: '天然气', es: 'Gas Natural', hi: 'प्राकृतिक गैस', fr: 'Gaz Naturel', pt: 'Gás Natural' },
    'Programming': { en: 'Programming', zh: '编程', es: 'Programación', hi: 'प्रोग्रामिंग', fr: 'Programmation', pt: 'Programação' },
    'Embedded Systems': { en: 'Embedded Systems', zh: '嵌入式系统', es: 'Sistemas Embebidos', hi: 'एम्बेडेड सिस्टम', fr: 'Systèmes Embarqués', pt: 'Sistemas Embarcados' },
    'Hardware': { en: 'Hardware', zh: '硬件', es: 'Hardware', hi: 'हार्डवेयर', fr: 'Matériel', pt: 'Hardware' },
    'Networking': { en: 'Networking', zh: '网络', es: 'Redes', hi: 'नेटवर्किंग', fr: 'Réseaux', pt: 'Redes' },
    'Upgrades': { en: 'Upgrades', zh: '升级', es: 'Actualizaciones', hi: 'अपग्रेड', fr: 'Mises à niveau', pt: 'Atualizações' },
    'Windows': { en: 'Windows', zh: 'Windows', es: 'Windows', hi: 'Windows', fr: 'Windows', pt: 'Windows' },
    'Mobile': { en: 'Mobile', zh: '移动', es: 'Móvil', hi: 'मोबाइल', fr: 'Mobile', pt: 'Móvel' },
    'Software': { en: 'Software', zh: '软件', es: 'Software', hi: 'सॉफ़्टवेयर', fr: 'Logiciel', pt: 'Software' },
    'Storage': { en: 'Storage', zh: '存储', es: 'Almacenamiento', hi: 'भंडारण', fr: 'Stockage', pt: 'Armazenamento' },
    'Peripherals': { en: 'Peripherals', zh: '外设', es: 'Periféricos', hi: 'परिधीय', fr: 'Périphériques', pt: 'Periféricos' },
    'Audio': { en: 'Audio', zh: '音频', es: 'Audio', hi: 'ऑडियो', fr: 'Audio', pt: 'Áudio' },
    'Displays': { en: 'Displays', zh: '显示器', es: 'Pantallas', hi: 'डिस्प्ले', fr: 'Écrans', pt: 'Telas' },
    'Home Entertainment': { en: 'Home Entertainment', zh: '家庭娱乐', es: 'Entretenimiento en Casa', hi: 'होम एंटरटेनमेंट', fr: 'Divertissement Maison', pt: 'Entretenimento em Casa' }
  };
  var ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/;

  function normalizeCategory(category) {
    if (!category) return category;
    return ARABIC_RE.test(String(category)) ? 'Technology' : category;
  }

  function translateCategory(category, lang) {
    category = normalizeCategory(category);
    var entry = CATEGORY_LABELS[category];
    if (!entry) return category || '';
    return entry[lang] || entry.en;
  }

  // ===== Supabase client (created once) =====
  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase && window.supabase.createClient) {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return window.supabaseClient;
    }
    return null;
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  // ===== REST headers =====
  function sbHeaders(extra) {
    var h = { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY };
    if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
    return h;
  }

  async function sbRpc(name, args) {
    var res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: sbHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(args || {})
    });
    if (!res.ok) throw new Error(name + ' HTTP ' + res.status);
    return res.json();
  }

  async function sbSelect(query) {
    var res = await fetch(SUPABASE_URL + '/rest/v1/' + query, { headers: sbHeaders() });
    if (!res.ok) throw new Error('select HTTP ' + res.status);
    return res.json();
  }

  // ===== Articles (REST fallback) =====
  async function fetchArticlesREST() {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 8000);
    try {
      var res = await fetch(SUPABASE_URL + '/rest/v1/articles?select=id,title,excerpt,content,category,author,date,image,images,tags,featured,likes,slug,title_i18n,excerpt_i18n,content_i18n&order=id.desc&limit=500', {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
        signal: ctrl.signal
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      return Array.isArray(data) ? data : [];
    } finally { clearTimeout(timer); }
  }

  async function loadManualArticles() {
    try {
      var load = async function (f) {
        try {
          var r = await fetch('/data/' + f);
          var j = r.ok ? await r.json() : [];
          return Array.isArray(j) ? j : [];
        } catch (e) { return []; }
      };
      var results = await Promise.all([load('manual-articles.json'), load('auto-articles.json')]);
      var explicit = results[0], auto = results[1];
      var seenSlugs = new Set(explicit.map(function (m) { return m && m.slug; }));
      var list = explicit.concat(auto.filter(function (m) { return m && !seenSlugs.has(m.slug); }));
      return list.filter(function (m) { return m && m.slug && m.title; }).map(function (m) {
        return {
          id: 'm-' + m.slug,
          slug: m.slug,
          title: String(m.title),
          excerpt: String(m.excerpt || ''),
          content: String(m.content || ''),
          category: normalizeCategory(m.category) || 'Technology',
          author: m.author || 'TechPulse Team',
          date: m.date || '',
          image: m.image || '',
          images: [],
          tags: Array.isArray(m.tags) ? m.tags : [],
          featured: !!m.featured,
          manual: true,
          title_i18n: m.title_i18n || {},
          excerpt_i18n: m.excerpt_i18n || {},
          content_i18n: m.content_i18n || {}
        };
      });
    } catch (e) { return []; }
  }

  // ===== Articles cache =====
  var ARTICLES_CACHE_KEY = 'tp_articles_v8';
  var ARTICLES_CACHE_TTL = 5 * 60 * 1000;
  var articlesCache = null;
  var articlesInflight = null;

  async function loadArticles() {
    var published = [];
    try {
      published = await fetchArticlesREST();
    } catch (err) {
      console.warn('[TP] REST failed, trying SDK...', err);
      try {
        var sb = getClient();
        if (sb) {
          var resp = await sb.from('articles').select('*').order('id', { ascending: false });
          if (!resp.error && resp.data) published = resp.data;
        }
      } catch (err2) {
        console.warn('[TP] SDK failed too', err2);
      }
    }
    published.forEach(function (a) { a.category = normalizeCategory(a.category); });
    var manual = await loadManualArticles();

    if (!published.length) {
      try {
        var res = await fetch('data/articles.json', { cache: 'no-store' });
        if (res.ok) {
          var json = await res.json();
          if (Array.isArray(json)) {
            published = json;
            published.forEach(function (a) { a.category = normalizeCategory(a.category); });
          }
        }
      } catch (err) { console.warn('[TP] data/articles.json failed', err); }
    } else {
      try {
        sessionStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify({ t: Date.now(), d: published.concat(manual) }));
      } catch (e) {}
    }
    return published.concat(manual);
  }

  async function getArticles(force) {
    if (articlesCache && !force) return articlesCache;
    if (!force) {
      try {
        var raw = sessionStorage.getItem(ARTICLES_CACHE_KEY);
        if (raw) {
          var c = JSON.parse(raw);
          if (c && Array.isArray(c.d) && c.d.length && Date.now() - c.t < ARTICLES_CACHE_TTL) {
            articlesCache = c.d;
            return articlesCache;
          }
        }
      } catch (e) {}
    }
    if (!articlesInflight) {
      articlesInflight = loadArticles().finally(function () { articlesInflight = null; });
    }
    var published = await articlesInflight;
    articlesCache = published;
    return published;
  }

  // ===== Static slugs =====
  var staticSlugs = null;

  async function loadStaticSlugs() {
    if (staticSlugs) return staticSlugs;
    try {
      var res = await fetch('/data/static-slugs.json');
      staticSlugs = res.ok ? await res.json() : {};
    } catch (e) { staticSlugs = {}; }
    if (!staticSlugs || typeof staticSlugs !== 'object') staticSlugs = {};
    return staticSlugs;
  }

  function staticSlugFor(id) {
    return (staticSlugs && staticSlugs[String(id)]) || '';
  }

  function articleUrl(a, lang) {
    if (a.manual && a.slug) return '/a/' + a.slug + '.html';
    var s = staticSlugFor(a.id);
    if (s && (!lang || lang === 'en')) return '/a/' + s + '.html';
    if (a.slug) return '/a/' + a.slug + '.html';
    return '/article.html?id=' + encodeURIComponent(a.id);
  }

  function canonicalUrl(a) {
    var s = (a.manual && a.slug) || staticSlugFor(a.id) || a.slug;
    return 'https://www.pulsehig.com' + (s ? '/a/' + s + '.html' : '/article.html?id=' + encodeURIComponent(a.id));
  }

  // ===== Site stats (visits) =====
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  async function trackAndGetSiteStats() {
    var fallback = { total: 0, daily: 0 };
    try {
      if (!ssGet('tp_site_hit')) {
        try {
          var d = await sbRpc('hit_site', { p_today: todayStr() });
          if (d && typeof d === 'object') {
            ssSet('tp_site_hit', '1');
            return { total: d.total || 0, daily: d.daily || 0 };
          }
        } catch (e) { console.warn('[TP] hit_site failed', e.message); }
      }
      var rows = await sbSelect('site_stats?select=total_visits,daily_visits,last_visit_date&id=eq.global');
      var d2 = rows && rows[0];
      if (d2) {
        return {
          total: d2.total_visits || 0,
          daily: d2.last_visit_date === todayStr() ? (d2.daily_visits || 0) : 0
        };
      }
    } catch (e) { console.warn('[TP] site stats failed', e); }
    return fallback;
  }

  // ===== Article views =====
  var viewCache = {};
  var dailyViewCache = {};
  var freshIds = new Set();

  async function refreshViews() {
    try {
      var data = await sbSelect('article_views?select=article_id,views_count,daily_views,last_visit_date');
      var today = todayStr();
      (data || []).forEach(function (row) {
        var id = String(row.article_id);
        if (freshIds.has(id)) return;
        viewCache[id] = row.views_count || 0;
        dailyViewCache[id] = row.last_visit_date === today ? (row.daily_views || 0) : 0;
      });
    } catch (e) { console.warn('[TP] views table failed', e); }
  }

  function getViews(id) { return viewCache[String(id)] || 0; }
  function getDailyViews(id) { return dailyViewCache[String(id)] || 0; }

  async function registerView(id) {
    id = String(id);
    var seenKey = 'tp_seen_' + id;
    try {
      if (!ssGet(seenKey)) {
        var d = await sbRpc('hit_article', { p_id: id, p_today: todayStr() });
        if (d && typeof d === 'object') {
          ssSet(seenKey, '1');
          freshIds.add(id);
          viewCache[id] = d.views || 0;
          dailyViewCache[id] = d.daily || 0;
          return getViews(id);
        }
      }
      var rows = await sbSelect('article_views?select=views_count,daily_views,last_visit_date&article_id=eq.' + encodeURIComponent(id));
      var r = rows && rows[0];
      if (r) {
        viewCache[id] = r.views_count || 0;
        dailyViewCache[id] = r.last_visit_date === todayStr() ? (r.daily_views || 0) : 0;
      }
    } catch (err) { console.warn('[TP] registerView failed', err); }
    return getViews(id);
  }

  // ===== Likes =====
  function readLikeMap() {
    try { return JSON.parse(localStorage.getItem('tp_likes') || '{}'); } catch (e) { return {}; }
  }
  function readLikedIds() {
    try { return JSON.parse(localStorage.getItem('tp_liked') || '[]'); } catch (e) { return []; }
  }
  function getLikeCount(id) { return readLikeMap()[id] || 0; }
  function hasLiked(id) { return readLikedIds().indexOf(id) !== -1; }
  function toggleLike(id) {
    var map = readLikeMap();
    var liked = readLikedIds();
    var already = liked.indexOf(id) !== -1;
    if (already) {
      liked = liked.filter(function (x) { return x !== id; });
      map[id] = Math.max(0, (map[id] || 0) - 1);
    } else {
      liked.push(id);
      map[id] = (map[id] || 0) + 1;
    }
    try {
      localStorage.setItem('tp_likes', JSON.stringify(map));
      localStorage.setItem('tp_liked', JSON.stringify(liked));
    } catch (e) {}
    return { liked: !already, count: map[id] };
  }

  // ===== Bookmarks =====
  function getBookmarks() {
    try { return JSON.parse(localStorage.getItem('tp_bookmarks') || '[]'); } catch (e) { return []; }
  }
  function isBookmarked(id) {
    return getBookmarks().some(function (b) { return b.id === id; });
  }
  function toggleBookmark(id, title) {
    var bookmarks = getBookmarks();
    if (isBookmarked(id)) {
      bookmarks = bookmarks.filter(function (b) { return b.id !== id; });
    } else {
      bookmarks.push({ id: id, title: title });
    }
    try { localStorage.setItem('tp_bookmarks', JSON.stringify(bookmarks)); } catch (e) {}
    return bookmarks;
  }

  // ===== Toast =====
  var toastEl, toastTimer;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }
  if (!window.showToast) window.showToast = showToast;

  // ===== Dark mode =====
  function initDarkMode() {
    var root = document.documentElement;
    var btn = document.getElementById('darkModeToggle');
    var KEY = 'tp_theme';
    function applyTheme(t) {
      root.classList.toggle('dark-theme', t === 'dark');
      if (btn) {
        btn.textContent = t === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      }
    }
    var saved = localStorage.getItem(KEY);
    var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (systemDark ? 'dark' : 'light'));
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', function () {
        var next = root.classList.contains('dark-theme') ? 'light' : 'dark';
        try { localStorage.setItem(KEY, next); } catch (e) {}
        applyTheme(next);
      });
    }
  }

  // ===== Admin gate =====
  var ADMIN_PIN = '123456';

  function ensureAdminModal() {
    if (document.getElementById('adminModal')) return;
    var wrap = document.createElement('div');
    wrap.className = 'admin-modal-overlay';
    wrap.id = 'adminModal';
    wrap.innerHTML =
      '<div class="admin-modal-card">' +
      '<h3>Admin Access</h3>' +
      '<input type="password" id="adminPassInput" placeholder="Enter Security PIN..." autocomplete="off">' +
      '<button type="button" id="adminPassSubmit">Login</button>' +
      '</div>';
    document.body.appendChild(wrap);
  }

  function initAdminGate() {
    var adminBtn = document.getElementById('adminBtn');
    ensureAdminModal();
    var modal = document.getElementById('adminModal');
    var input = document.getElementById('adminPassInput');
    if (adminBtn && sessionStorage.getItem('tp_admin_authenticated') === 'true') {
      adminBtn.style.display = 'inline-block';
    }
    function verify() {
      if (input.value.trim() === ADMIN_PIN) {
        try { sessionStorage.setItem('tp_admin_authenticated', 'true'); } catch (e) {}
        if (adminBtn) adminBtn.style.display = 'inline-block';
        modal.classList.remove('active');
        input.value = '';
        window.location.href = 'admin.html';
      } else {
        alert('Incorrect PIN!');
        input.value = '';
      }
    }
    var submit = document.getElementById('adminPassSubmit');
    if (submit && !submit.dataset.wired) {
      submit.dataset.wired = '1';
      submit.addEventListener('click', verify);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') verify(); });
    }
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        modal.classList.add('active');
        input.focus();
      }
      if (e.key === 'Escape') modal.classList.remove('active');
    });
  }

  // ===== Ticker (News) =====
  var tickerData = [];
  function initTicker() {
    var track = document.getElementById('tickerTrack');
    if (!track) return;

    function render() {
      if (!tickerData.length) return;
      var lang = window.TPI18N ? window.TPI18N.getLang() : 'en';
      var html = '';
      var doubled = tickerData.concat(tickerData);
      doubled.forEach(function (item) {
        var titleText = (item.title && item.title[lang]) ? item.title[lang] : (item.title.en || item.title);
        var href = item.url && item.url !== '#' ? item.url : '#';
        html += '<span class="ticker-item"><a href="' + esc(href) + '"' +
                (href !== '#' ? ' target="_blank" rel="noopener"' : '') + '>' +
                esc(titleText) + '</a></span>';
      });
      track.innerHTML = html;
    }

    document.addEventListener('tp:langchange', render);

    if (window.TPLiveNews) {
      window.TPLiveNews.startAutoRefresh(function (feed) {
        tickerData = feed;
        render();
      });
    } else {
      fetch('data/news.json').then(function (r) { return r.json(); }).then(function (json) {
        tickerData = json;
        render();
      }).catch(function () {});
    }
  }

  // ===== Trending (Hacker News) =====
  async function loadTrending(limit) {
    limit = limit || 5;
    var list = [];
    try {
      var res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      if (!res.ok) throw new Error('HN failed');
      var ids = (await res.json()).slice(0, limit * 2);
      var items = await Promise.all(ids.map(function (id) {
        return fetch('https://hacker-news.firebaseio.com/v0/item/' + id + '.json')
          .then(function (r) { return r.ok ? r.json() : null; })
          .catch(function () { return null; });
      }));
      list = items.filter(function (it) { return it && it.title && it.url; })
        .slice(0, limit)
        .map(function (it, i) {
          return {
            rank: i + 1,
            title: it.title,
            url: it.url,
            score: it.score || 0,
            source: extractDomain(it.url),
            comments: it.descendants || 0
          };
        });
    } catch (e) { console.warn('[TP] trending failed', e); }
    return list;
  }

  function extractDomain(url) {
    try {
      var u = new URL(url);
      return u.hostname.replace(/^www\./, '');
    } catch (e) { return ''; }
  }

  // ===== Best Picks loader =====
  async function loadBestPicks() {
    try {
      var res = await fetch('data/best-picks.json', { cache: 'no-store' });
      if (!res.ok) return [];
      var json = await res.json();
      return Array.isArray(json) ? json.slice(0, 3) : [];
    } catch (e) { return []; }
  }

  // ===== Did You Know (facts) =====
  var FACTS = [
    { text: 'The ESP32 chip family powers over 40% of consumer smart home devices shipped worldwide in 2025.', source: 'Espressif Annual Report' },
    { text: 'Modern CPUs can execute over 5 billion instructions per second while drawing less power than a light bulb.', source: 'Intel Technical Brief' },
    { text: 'CMOS logic gates use less than 1 nanowatt when idle — that is why your laptop battery lasts all day.', source: 'IEEE Solid-State Circuits' },
    { text: 'A standard LED consumes 90% less energy than an incandescent bulb of the same brightness.', source: 'US Department of Energy' },
    { text: 'Home automation can cut heating and cooling costs by up to 30% through smart scheduling.', source: 'ENERGY STAR' },
    { text: 'The first microcontroller, the TMS1000, was released by Texas Instruments in 1974 with 1 KB of ROM.', source: 'IEEE History Center' },
    { text: 'Over 75 billion IoT devices are expected to be connected globally by 2030.', source: 'Statista' },
    { text: 'A Raspberry Pi 5 can run a full web server while consuming under 5 watts.', source: 'Raspberry Pi Foundation' },
    { text: 'Wireless charging was first demonstrated by Nikola Tesla over 100 years ago.', source: 'Smithsonian Magazine' },
    { text: 'Modern solar panels convert about 22% of sunlight into electricity, up from 6% in 1980.', source: 'NREL' }
  ];

  function getDidYouKnow() {
    var day = new Date().getDate();
    var fact = FACTS[day % FACTS.length];
    return fact;
  }

  // ===== Disqus =====
  var DISQUS_SHORTNAME = 'techpulse-1';

  function disqusUnavailableHTML() {
    var msg = window.TPI18N ? window.TPI18N.t('comments_unavailable') : "Comments aren't set up yet.";
    return '<p class="comments-unavailable">💬 ' + esc(msg) + '</p>';
  }

  function loadDisqusThread(container, opts) {
    if (!container) return;
    if (!DISQUS_SHORTNAME) {
      container.innerHTML = disqusUnavailableHTML();
      return;
    }
    container.innerHTML = '';
    var threadDiv = document.createElement('div');
    threadDiv.id = 'disqus_thread';
    container.appendChild(threadDiv);

    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = opts.identifier;
          this.page.url = opts.url;
          this.page.title = opts.title;
        }
      });
      return;
    }

    window.disqus_config = function () {
      this.page.identifier = opts.identifier;
      this.page.url = opts.url;
      this.page.title = opts.title;
    };
    var script = document.createElement('script');
    script.src = 'https://' + DISQUS_SHORTNAME + '.disqus.com/embed.js';
    script.setAttribute('data-timestamp', String(+new Date()));
    (document.head || document.body).appendChild(script);
  }

  function hasComments() { return !!DISQUS_SHORTNAME; }

  // ===== Newsletter config (Buttondown) =====
  var NEWSLETTER_USERNAME = 'jonsrocky';

  async function subscribeNewsletter(email) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email');
    }
    var res = await fetch('https://buttondown.email/api/emails/embed-subscribe/' + NEWSLETTER_USERNAME, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    });
    if (!res.ok) throw new Error('Subscription failed');
    return true;
  }

  // ===== Service Worker registration =====
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').then(function (reg) {
        console.log('[TP] SW registered', reg.scope);
      }).catch(function (err) {
        console.warn('[TP] SW registration failed', err.message);
      });
    });
  }
  registerServiceWorker();

  // ===== Public API =====
  return {
    esc: esc,
    slugify: slugify,
    formatDate: formatDate,
    calcReadMinutes: calcReadMinutes,
    pickLocalized: pickLocalized,
    localizeArticle: localizeArticle,
    translateCategory: translateCategory,
    normalizeCategory: normalizeCategory,
    getArticles: getArticles,
    loadStaticSlugs: loadStaticSlugs,
    articleUrl: articleUrl,
    canonicalUrl: canonicalUrl,
    getViews: getViews,
    getDailyViews: getDailyViews,
    registerView: registerView,
    refreshViews: refreshViews,
    trackAndGetSiteStats: trackAndGetSiteStats,
    getLikeCount: getLikeCount,
    hasLiked: hasLiked,
    toggleLike: toggleLike,
    getBookmarks: getBookmarks,
    isBookmarked: isBookmarked,
    toggleBookmark: toggleBookmark,
    showToast: showToast,
    initDarkMode: initDarkMode,
    initAdminGate: initAdminGate,
    initTicker: initTicker,
    loadTrending: loadTrending,
    loadBestPicks: loadBestPicks,
    getDidYouKnow: getDidYouKnow,
    loadDisqusThread: loadDisqusThread,
    hasComments: hasComments,
    subscribeNewsletter: subscribeNewsletter,
    SUPABASE_URL: SUPABASE_URL,
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY
  };
})();