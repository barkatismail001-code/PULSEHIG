/* ==========================================================================
   TechPulse — Shared Utilities (common.js) - Encrypted Stats & Daily Views
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

  /* ---------- دالة تشفير الأرقام إلى رموز لا يفهمها الزوار ---------- */
  function encryptStatCode(num) {
    if (isNaN(num)) num = 0;
    // تحويل الرقم إلى رموز عشوائية تبدو تقنية أو مشفرة
    const salt = "TP-SEC";
    let encoded = btoa(num + "-" + salt).split('').reverse().join('');
    return "⚡[" + encoded.substring(0, 6) + "::" + (num * 3 + 7) + "]";
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
  const ARTICLES_CACHE_KEY = 'tp_articles_v3';
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

    if (!published.length) {
      try {
        const res = await fetch('data/articles.json', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) published = json;
        }
      } catch (err) {
        console.warn('Could not load data/articles.json', err);
      }
    } else {
      try { sessionStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify({ t: Date.now(), d: published })); } catch (e) {}
    }
    return published;
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
            fetchAndUpdateAllViews();
            return cache;
          }
        }
      } catch (e) {}
    }

    if (!inflight) inflight = loadArticles().finally(() => { inflight = null; });
    const published = await inflight;
    cache = published;
    fetchAndUpdateAllViews();
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

  /* ---------- Site-wide visit counter (stored in Supabase: site_stats, id='global') ----------
     Counted once per browser session via the hit_site() SQL function.
     Later page loads in the same session only read the current values. */
  async function trackAndGetSiteStats() {
    const fallback = { total: 0, daily: 0 };
    const sb = getClient();
    if (!sb) return fallback;
    try {
      if (!sessionStorage.getItem('tp_site_hit')) {
        const { data, error } = await sb.rpc('hit_site', { p_today: todayStr() });
        if (!error && data) {
          sessionStorage.setItem('tp_site_hit', '1');
          return { total: data.total || 0, daily: data.daily || 0 };
        }
        if (error) console.warn('hit_site failed:', error.message);
      }
      const { data, error } = await sb
        .from('site_stats')
        .select('total_visits, daily_visits, last_visit_date')
        .eq('id', 'global')
        .maybeSingle();
      if (!error && data) {
        return {
          total: data.total_visits || 0,
          daily: data.last_visit_date === todayStr() ? (data.daily_visits || 0) : 0
        };
      }
    } catch (e) {
      console.warn('Could not load site stats:', e);
    }
    return fallback;
  }

  /* ---------- Per-article views (stored in Supabase: article_views) ---------- */
  let viewCache = {};
  let dailyViewCache = {};
  const freshIds = new Set(); // ids already updated this page-load (don't overwrite with older data)

  async function fetchAndUpdateAllViews() {
    try {
      const sb = getClient();
      if (!sb) return;
      const { data, error } = await sb
        .from('article_views')
        .select('article_id, views_count, daily_views, last_visit_date');
      if (error || !data) return;
      const today = todayStr();
      data.forEach(row => {
        const id = String(row.article_id);
        if (freshIds.has(id)) return;
        viewCache[id] = row.views_count || 0;
        dailyViewCache[id] = row.last_visit_date === today ? (row.daily_views || 0) : 0;
      });
    } catch (e) {
      console.warn('Could not fetch views table:', e);
    }
  }

  function getViews(id) {
    return viewCache[String(id)] || 0;
  }

  function getDailyViews(id) {
    return dailyViewCache[String(id)] || 0;
  }

  // Counts one view per browser session per article, via the hit_article() SQL function.
  async function registerView(id) {
    id = String(id);
    const seenKey = 'tp_seen_' + id;
    const sb = getClient();
    try {
      if (sb && !sessionStorage.getItem(seenKey)) {
        const { data, error } = await sb.rpc('hit_article', { p_id: id, p_today: todayStr() });
        if (!error && data) {
          sessionStorage.setItem(seenKey, '1');
          freshIds.add(id);
          viewCache[id] = data.views || 0;
          dailyViewCache[id] = data.daily || 0;
        } else if (error) {
          console.warn('hit_article failed:', error.message);
        }
      } else if (sb) {
        // already counted in this session: just read the current number
        const { data } = await sb
          .from('article_views')
          .select('views_count, daily_views, last_visit_date')
          .eq('article_id', id)
          .maybeSingle();
        if (data) {
          viewCache[id] = data.views_count || 0;
          dailyViewCache[id] = data.last_visit_date === todayStr() ? (data.daily_views || 0) : 0;
        }
      }
    } catch (err) {
      console.warn('Could not update article views:', err);
    }
    return getViews(id);
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
  function translateCategory(category, lang) {
    const entry = CATEGORY_LABELS[category];
    if (!entry) return category || '';
    return entry[lang] || entry.en;
  }

  return {
    esc, slugify, formatDate, calcReadMinutes,
    pickLocalized, localizeArticle, translateCategory,
    getArticles, getArticlesVersion,
    getViews, getDailyViews, registerView, trackAndGetSiteStats, encryptStatCode,
    getLikeCount, hasLiked, toggleLike,
    getBookmarks, isBookmarked, toggleBookmark,
    showToast, initDarkMode, initAdminGate, initTicker,
    loadDisqusThread, hasComments
  };
})();
