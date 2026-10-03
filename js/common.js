/* ==========================================================================
   TechPulse — Shared Utilities (common.js) - Stats & Daily Views
   ========================================================================== */
window.TPCommon = (function () {
  'use strict';

  const LOCALE_MAP = { en: 'en-US', zh: 'zh-CN', es: 'es-ES', hi: 'hi-IN', fr: 'fr-FR' };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function slugify(str) {
    return String(str).toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function formatDate(iso, lang) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] || 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return ''; }
  }

  function calcReadMinutes(text) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }

  function pickLocalized(field, lang) {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      if (field[lang]) return field[lang];
      if (field.en) return field.en;
      const first = Object.values(field).find(Boolean);
      return first || '';
    }
    return String(field);
  }

  function localizeArticle(article, lang) {
    return Object.assign({}, article, {
      title: pickLocalized(article.title, lang),
      excerpt: pickLocalized(article.excerpt, lang),
      content: pickLocalized(article.content, lang)
    });
  }

  /* ---------- Supabase client (shared, created once) ---------- */
  const SUPABASE_URL = 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_5NcPMPDtyNXRg-oduydRUA_JM6IeV9k';

  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase && window.supabase.createClient) {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return window.supabaseClient;
    }
    return null;
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  }

  /* ---------- Article data from Supabase Database ---------- */
  const ARTICLES_CACHE_KEY = 'tp_articles_v7';
  const ARTICLES_CACHE_TTL = 5 * 60 * 1000; // 5 min, per browser session
  let cache = null;
  let inflight = null;

  // Plain REST call: works even if the Supabase SDK has not finished loading.
  async function fetchArticlesREST() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/articles?select=*&order=id.desc&limit=500', {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
        signal: ctrl.signal
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } finally { clearTimeout(timer); }
  }

  // data/manual-articles.json (optional) + data/auto-articles.json (generated): [{ slug, title, excerpt, category, date, image, tags, author, minutes, content }]
  // Each entry has a page at /a/<slug>.html (hand-written, or generated from "content").
  async function loadManualArticles() {
    try {
      // manual-articles.json = optional hand-written entries; auto-articles.json = files discovered in a/.
      const load = async f => { try { const r = await fetch('/data/' + f); const j = r.ok ? await r.json() : []; return Array.isArray(j) ? j : []; } catch (e) { return []; } };
      const [explicit, auto] = await Promise.all([load('manual-articles.json'), load('auto-articles.json')]);
      const seenSlugs = new Set(explicit.map(m => m && m.slug));
      const list = explicit.concat(auto.filter(m => m && !seenSlugs.has(m.slug)));
      return list.filter(m => m && m.slug && m.title).map(m => ({
        id: 'm-' + m.slug,
        slug: m.slug,
        title: String(m.title),
        excerpt: String(m.excerpt || ''),
        content: String(m.content || ''),
        category: normalizeCategory(m.category) || 'Technology',
        author: m.author || 'TechPulse Team',
        date: m.date || '',
        image: m.image || '',
        tags: Array.isArray(m.tags) ? m.tags : [],
        minutes: Number(m.minutes) || 0,
        featured: !!m.featured,
        manual: true
      }));
    } catch (e) { return []; }
  }

  async function loadArticles() {
    let published = [];
    try {
      published = await fetchArticlesREST();
    } catch (err) {
      console.warn('REST load failed, trying SDK...', err);
      try {
        const sb = getClient();
        if (sb) {
          const { data, error } = await sb.from('articles').select('*').order('id', { ascending: false });
          if (!error && data) published = data;
        }
      } catch (err2) {
        console.warn('Could not load from Supabase database, trying fallback...', err2);
      }
    }

    published.forEach(a => { a.category = normalizeCategory(a.category); });

    // Hand-made static articles (data/manual-articles.json) are shown next to the Supabase ones.
    const manual = await loadManualArticles();

    if (!published.length) {
      try {
        const res = await fetch('data/articles.json', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            published = json;
            published.forEach(a => { a.category = normalizeCategory(a.category); });
          }
        }
      } catch (err) {
        console.warn('Could not load data/articles.json', err);
      }
    } else {
      try { sessionStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify({ t: Date.now(), d: published.concat(manual) })); } catch (e) {}
    }
    return published.concat(manual);
  }

  async function getArticles(force) {
    if (cache && !force) return cache;

    if (!force) {
      try {
        const raw = sessionStorage.getItem(ARTICLES_CACHE_KEY);
        if (raw) {
          const c = JSON.parse(raw);
          if (c && Array.isArray(c.d) && c.d.length && Date.now() - c.t < ARTICLES_CACHE_TTL) {
            cache = c.d;
            return cache;
          }
        }
      } catch (e) {}
    }

    if (!inflight) inflight = loadArticles().finally(() => { inflight = null; });
    const published = await inflight;
    cache = published;
    return published;
  }

  let cachedVersion = null;
  async function getArticlesVersion() {
    if (cachedVersion !== null) return cachedVersion;
    try {
      const res = await fetch('data/meta.json', { cache: 'no-store' });
      cachedVersion = res.ok ? ((await res.json()).articlesVersion || '') : '';
    } catch { cachedVersion = ''; }
    return cachedVersion;
  }

  /* ---------- Supabase over plain REST (no SDK needed: faster pages, fewer failure points) ---------- */
  function sbHeaders(extra) {
    return Object.assign({ apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }, extra || {});
  }
  async function sbRpc(name, args) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: sbHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(args || {})
    });
    if (!res.ok) throw new Error(name + ' HTTP ' + res.status);
    return res.json();
  }
  async function sbSelect(query) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + query, { headers: sbHeaders() });
    if (!res.ok) throw new Error('select HTTP ' + res.status);
    return res.json();
  }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  /* ---------- Site-wide visit counter (Supabase: site_stats, id='global') ----------
     Counted once per browser session (any page: home, article, static /a/ page)
     through the hit_site() SQL function. Later loads only read the values. */
  async function trackAndGetSiteStats() {
    const fallback = { total: 0, daily: 0 };
    try {
      if (!ssGet('tp_site_hit')) {
        try {
          const d = await sbRpc('hit_site', { p_today: todayStr() });
          if (d && typeof d === 'object') {
            ssSet('tp_site_hit', '1');
            return { total: d.total || 0, daily: d.daily || 0 };
          }
        } catch (e) { console.warn('hit_site failed:', e.message); }
      }
      const rows = await sbSelect('site_stats?select=total_visits,daily_visits,last_visit_date&id=eq.global');
      const d = rows && rows[0];
      if (d) {
        return {
          total: d.total_visits || 0,
          daily: d.last_visit_date === todayStr() ? (d.daily_visits || 0) : 0
        };
      }
    } catch (e) {
      console.warn('Could not load site stats:', e);
    }
    return fallback;
  }

  /* ---------- Per-article views (Supabase: article_views) ---------- */
  let viewCache = {};
  let dailyViewCache = {};
  const freshIds = new Set(); // ids updated during this page-load (never overwrite with older data)

  // Reads every article's counters in ONE request. Does not count a view.
  async function refreshViews() {
    try {
      const data = await sbSelect('article_views?select=article_id,views_count,daily_views,last_visit_date');
      const today = todayStr();
      (data || []).forEach(row => {
        const id = String(row.article_id);
        if (freshIds.has(id)) return;
        viewCache[id] = row.views_count || 0;
        dailyViewCache[id] = row.last_visit_date === today ? (row.daily_views || 0) : 0;
      });
    } catch (e) {
      console.warn('Could not fetch views table:', e);
    }
  }

  function getViews(id) { return viewCache[String(id)] || 0; }
  function getDailyViews(id) { return dailyViewCache[String(id)] || 0; }

  // Counts ONE view per browser session per article (hit_article() SQL function).
  // Only call this where the article is actually opened.
  async function registerView(id) {
    id = String(id);
    const seenKey = 'tp_seen_' + id;
    try {
      if (!ssGet(seenKey)) {
        const d = await sbRpc('hit_article', { p_id: id, p_today: todayStr() });
        if (d && typeof d === 'object') {
          ssSet(seenKey, '1');
          freshIds.add(id);
          viewCache[id] = d.views || 0;
          dailyViewCache[id] = d.daily || 0;
          return getViews(id);
        }
      }
      const rows = await sbSelect('article_views?select=views_count,daily_views,last_visit_date&article_id=eq.' + encodeURIComponent(id));
      const d = rows && rows[0];
      if (d) {
        viewCache[id] = d.views_count || 0;
        dailyViewCache[id] = d.last_visit_date === todayStr() ? (d.daily_views || 0) : 0;
      }
    } catch (err) {
      console.warn('Could not update article views:', err);
    }
    return getViews(id);
  }

  /* ---------- Static SEO pages (/a/<slug>.html) ----------
     data/static-slugs.json maps article id -> slug of an existing static page.
     Links use the static URL when it really exists (real HTTP 200 for Google),
     and fall back to article.html?id=... for newer articles. */
  let staticSlugs = null;
  async function loadStaticSlugs() {
    if (staticSlugs) return staticSlugs;
    try {
      const res = await fetch('/data/static-slugs.json');
      staticSlugs = res.ok ? await res.json() : {};
    } catch (e) { staticSlugs = {}; }
    if (!staticSlugs || typeof staticSlugs !== 'object') staticSlugs = {};
    return staticSlugs;
  }
  function staticSlugFor(id) { return (staticSlugs && staticSlugs[String(id)]) || ''; }
  // English visitors (and Google) get the static page; other languages keep the localized reader.
  function articleUrl(a, lang) {
    if (a.manual && a.slug) return '/a/' + a.slug + '.html'; // hand-made pages exist in every language
    const s = staticSlugFor(a.id);
    if (s && (!lang || lang === 'en')) return '/a/' + s + '.html';
    return '/article.html?id=' + encodeURIComponent(a.id);
  }
  function canonicalUrl(a) {
    const s = (a.manual && a.slug) || staticSlugFor(a.id);
    return 'https://www.pulsehig.com' + (s ? '/a/' + s + '.html' : '/article.html?id=' + encodeURIComponent(a.id));
  }

  /* ---------- Likes ---------- */
  function readLikeMap() {
    try { return JSON.parse(localStorage.getItem('tp_likes') || '{}'); } catch { return {}; }
  }
  function readLikedIds() {
    try { return JSON.parse(localStorage.getItem('tp_liked') || '[]'); } catch { return []; }
  }
  function getLikeCount(id) { return readLikeMap()[id] || 0; }
  function hasLiked(id) { return readLikedIds().includes(id); }
  function toggleLike(id) {
    const map = readLikeMap();
    let liked = readLikedIds();
    const already = liked.includes(id);
    if (already) {
      liked = liked.filter(x => x !== id);
      map[id] = Math.max(0, (map[id] || 0) - 1);
    } else {
      liked.push(id);
      map[id] = (map[id] || 0) + 1;
    }
    localStorage.setItem('tp_likes', JSON.stringify(map));
    localStorage.setItem('tp_liked', JSON.stringify(liked));
    return { liked: !already, count: map[id] };
  }

  /* ---------- Bookmarks ---------- */
  function getBookmarks() {
    try { return JSON.parse(localStorage.getItem('tp_bookmarks') || '[]'); } catch { return []; }
  }
  function isBookmarked(id) { return getBookmarks().some(b => b.id === id); }
  function toggleBookmark(id, title) {
    let bookmarks = getBookmarks();
    if (isBookmarked(id)) {
      bookmarks = bookmarks.filter(b => b.id !== id);
    } else {
      bookmarks.push({ id, title });
    }
    localStorage.setItem('tp_bookmarks', JSON.stringify(bookmarks));
    return bookmarks;
  }

  /* ---------- Toast ---------- */
  let toastEl, toastTimer;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }
  if (!window.showToast) window.showToast = showToast;

  /* ---------- Dark mode ---------- */
  function initDarkMode() {
    const root = document.documentElement;
    const btn = document.getElementById('darkModeToggle');
    const KEY = 'tp_theme';
    function apply(t) {
      root.classList.toggle('dark-theme', t === 'dark');
      if (btn) {
        btn.textContent = t === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      }
    }
    const saved = localStorage.getItem(KEY);
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(saved || (systemDark ? 'dark' : 'light'));
    if (btn) {
      btn.addEventListener('click', () => {
        const next = root.classList.contains('dark-theme') ? 'light' : 'dark';
        localStorage.setItem(KEY, next);
        apply(next);
      });
    }
  }

  /* ---------- Admin access gate ---------- */
  const ADMIN_PIN = '123456';
  function ensureAdminModal() {
    if (document.getElementById('adminModal')) return;
    const wrap = document.createElement('div');
    wrap.className = 'admin-modal-overlay';
    wrap.id = 'adminModal';
    wrap.innerHTML = `
      <div class="admin-modal-card">
        <h3>Admin Access</h3>
        <input type="password" id="adminPassInput" placeholder="Enter Security PIN..." autocomplete="off">
        <button type="button" id="adminPassSubmit">Login</button>
      </div>`;
    document.body.appendChild(wrap);
  }
  function initAdminGate() {
    const adminBtn = document.getElementById('adminBtn');
    ensureAdminModal();
    const modal = document.getElementById('adminModal');
    const input = document.getElementById('adminPassInput');

    if (adminBtn && sessionStorage.getItem('tp_admin_authenticated') === 'true') {
      adminBtn.style.display = 'inline-block';
    }

    function verify() {
      if (input.value.trim() === ADMIN_PIN) {
        sessionStorage.setItem('tp_admin_authenticated', 'true');
        if (adminBtn) adminBtn.style.display = 'inline-block';
        modal.classList.remove('active');
        input.value = '';
        window.location.href = 'admin.html';
      } else {
        alert('Incorrect PIN!');
        input.value = '';
      }
    }

    document.getElementById('adminPassSubmit').addEventListener('click', verify);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') verify(); });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        modal.classList.add('active');
        input.focus();
      }
      if (e.key === 'Escape') modal.classList.remove('active');
    });
  }

  /* ---------- News ticker ---------- */
  let tickerData = [];
  function initTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;

    function render() {
      if (!tickerData.length) return;
      const lang = window.TPI18N ? window.TPI18N.getLang() : 'en';
      track.innerHTML = '';
      [...tickerData, ...tickerData].forEach(item => {
        const titleText = (item.title && item.title[lang]) ? item.title[lang] : (item.title.en || item.title);
        const href = item.url && item.url !== '#' ? item.url : '#';
        const span = document.createElement('span');
        span.className = 'ticker-item';
        span.innerHTML = `<a href="${esc(href)}"${href !== '#' ? ' target="_blank" rel="noopener"' : ''}>${esc(titleText)}</a>`;
        track.appendChild(span);
      });
    }
    document.addEventListener('tp:langchange', render);

    if (window.TPLiveNews) {
      window.TPLiveNews.startAutoRefresh(feed => { tickerData = feed; render(); });
    } else {
      fetch('data/news.json').then(r => r.json()).then(json => { tickerData = json; render(); }).catch(() => {});
    }
  }

  /* ---------- Disqus Comments ---------- */
  const DISQUS_SHORTNAME = 'techpulse-2';

  function disqusUnavailableHTML() {
    const msg = window.TPI18N ? window.TPI18N.t('comments_unavailable') : "Comments aren't set up on this preview yet.";
    return `<p class="comments-unavailable">💬 ${esc(msg)}</p>`;
  }

  function loadDisqusThread(container, { identifier, url, title }) {
    if (!DISQUS_SHORTNAME) {
      container.innerHTML = disqusUnavailableHTML();
      return;
    }
    container.innerHTML = '';
    const threadDiv = document.createElement('div');
    threadDiv.id = 'disqus_thread';
    container.appendChild(threadDiv);

    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = identifier;
          this.page.url = url;
          this.page.title = title;
        }
      });
      return;
    }

    window.disqus_config = function () {
      this.page.identifier = identifier;
      this.page.url = url;
      this.page.title = title;
    };
    const script = document.createElement('script');
    script.src = `https://${DISQUS_SHORTNAME}.disqus.com/embed.js`;
    script.setAttribute('data-timestamp', String(+new Date()));
    (document.head || document.body).appendChild(script);
  }

  function hasComments() { return !!DISQUS_SHORTNAME; }

  /* ---------- Category translations ---------- */
  const CATEGORY_LABELS = {
    Technology:  { en: 'Technology',  zh: '科技',   es: 'Tecnología',   hi: 'तकनीक',        fr: 'Technologie' },
    Petroleum:   { en: 'Petroleum',   zh: '石油',   es: 'Petróleo',     hi: 'पेट्रोलियम',    fr: 'Pétrole' },
    Gas:         { en: 'Natural Gas', zh: '天然气', es: 'Gas Natural',  hi: 'प्राकृतिक गैस', fr: 'Gaz Naturel' },
    Programming: { en: 'Programming', zh: '编程',   es: 'Programación', hi: 'प्रोग्रामिंग',  fr: 'Programmation' }
  };
  // The site is English-only: any category stored with non-Latin Arabic letters
  // (legacy rows in Supabase) is displayed as "Technology".
  const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/;
  function normalizeCategory(category) {
    if (!category) return category;
    return ARABIC_RE.test(String(category)) ? 'Technology' : category;
  }
  function translateCategory(category, lang) {
    category = normalizeCategory(category);
    const entry = CATEGORY_LABELS[category];
    if (!entry) return category || '';
    return entry[lang] || entry.en;
  }

  return {
    esc, slugify, formatDate, calcReadMinutes,
    pickLocalized, localizeArticle, translateCategory, normalizeCategory,
    getArticles, getArticlesVersion,
    getViews, getDailyViews, registerView, refreshViews, trackAndGetSiteStats,
    loadStaticSlugs, articleUrl, canonicalUrl,
    getLikeCount, hasLiked, toggleLike,
    getBookmarks, isBookmarked, toggleBookmark,
    showToast, initDarkMode, initAdminGate, initTicker,
    loadDisqusThread, hasComments
  };
})();
