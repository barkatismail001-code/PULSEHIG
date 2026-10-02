/* ==========================================================================
   TechPulse — Shared Utilities (common.js) - Supabase Connected
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

  /* ---------- Article data from Supabase Database ---------- */
  let cache = null;
  async function getArticles(force) {
    if (cache && !force) return cache;
    let published = [];

    // الاتصال بقاعدة بيانات Supabase لجلب المقالات الحية
    try {
      const SUPABASE_URL = 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
      const SUPABASE_ANON_KEY = 'sb_publishable_5NcPMPDtyNXRg-oduydRUA_JM6IeV9k';

      if (window.supabase) {
        const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await sb
          .from('articles')
          .select('*')
          .order('id', { ascending: false });

        if (!error && data) {
          published = data;
        }
      }
    } catch (err) {
      console.warn('Could not load from Supabase database, trying fallback...', err);
    }

    // احتياطياً في حال تعذر الاتصال بـ Supabase
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
    }

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

  /* ---------- View counts ---------- */
  function getViews(id) {
    return parseInt(localStorage.getItem('tp_views_' + id) || '0', 10);
  }
  function registerView(id) {
    const seenKey = 'tp_seen_' + id;
    if (sessionStorage.getItem(seenKey)) return getViews(id);
    sessionStorage.setItem(seenKey, '1');
    const v = getViews(id) + 1;
    localStorage.setItem('tp_views_' + id, String(v));
    return v;
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
    getViews, registerView,
    getLikeCount, hasLiked, toggleLike,
    getBookmarks, isBookmarked, toggleBookmark,
    showToast, initDarkMode, initAdminGate, initTicker,
    loadDisqusThread, hasComments
  };
})();