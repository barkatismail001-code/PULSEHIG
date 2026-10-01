/* ==========================================================================
   TechPulse Common Engine (js/common.js)
   - Shared utilities, dark mode, admin gate, ticker, bookmarks, likes,
     and Supabase integration for site stats and article views.
   ========================================================================== */
(function () {
  'use strict';

  // Supabase Configuration (Placeholder - update with your project credentials if needed)
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

  // Simple fetch wrapper for Supabase REST API
  async function supabaseRequest(endpoint, options = {}) {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || !SUPABASE_URL) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      if (!res.ok) return null;
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch (err) {
      console.error('Supabase error:', err);
      return null;
    }
  }

  // --- Site Stats & Article Views via Supabase ---
  async function trackAndGetSiteStats() {
    let stats = { total: 1024, daily: 48 }; // Fallback defaults
    try {
      // Fetch stats table from Supabase (assuming a table named 'site_stats' with id=1)
      const data = await supabaseRequest('site_stats?id=eq.1');
      if (data && data.length > 0) {
        stats.total = data[0].total_views || stats.total;
        stats.daily = data[0].daily_views || stats.daily;
        
        // Increment total views on load
        stats.total += 1;
        stats.daily += 1;

        // Update back to Supabase
        await supabaseRequest('site_stats?id=eq.1', {
          method: 'PATCH',
          body: JSON.stringify({ total_views: stats.total, daily_views: stats.daily })
        });
      }
    } catch (e) {
      console.warn('Using local fallback stats');
    }
    return stats;
  }

  function encryptStatCode(num) {
    // Simple encoding/encryption representation for codes
    return btoa('TP_STAT_' + num).substring(0, 8).toUpperCase();
  }

  // Article local tracking & views management
  const viewsKey = 'tp_article_views_local';
  function getViews(id) {
    try {
      const local = JSON.parse(localStorage.getItem(viewsKey) || '{}');
      return local[id] || 120; // Default baseline views per article
    } catch {
      return 120;
    }
  }

  function registerView(id) {
    try {
      const local = JSON.parse(localStorage.getItem(viewsKey) || '{}');
      local[id] = (local[id] || 120) + 1;
      localStorage.setItem(viewsKey, JSON.stringify(local));
    } catch (e) {
      // Ignore storage errors
    }
  }

  // --- Bookmarks Management ---
  const bookmarkKey = 'tp_bookmarks';
  function getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(bookmarkKey) || '[]');
    } catch {
      return [];
    }
  }

  function isBookmarked(id) {
    return getBookmarks().some(b => b.id === id);
  }

  function toggleBookmark(id, title) {
    let list = getBookmarks();
    if (isBookmarked(id)) {
      list = list.filter(b => b.id !== id);
    } else {
      list.push({ id, title });
    }
    localStorage.setItem(bookmarkKey, JSON.stringify(list));
    return isBookmarked(id);
  }

  // --- Likes Management ---
  const likesKey = 'tp_likes';
  function getLikesData() {
    try {
      return JSON.parse(localStorage.getItem(likesKey) || '{}');
    } catch {
      return {};
    }
  }

  function hasLiked(id) {
    const data = getLikesData();
    return !!data[id];
  }

  function getLikeCount(id) {
    const data = getLikesData();
    // Base count + 1 if liked
    const base = 15;
    return base + (data[id] ? 1 : 0);
  }

  function toggleLike(id) {
    const data = getLikesData();
    const liked = !data[id];
    if (liked) {
      data[id] = true;
    } else {
      delete data[id];
    }
    localStorage.setItem(likesKey, JSON.stringify(data));
    return { liked, count: getLikeCount(id) };
  }

  // --- Helper Utilities ---
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function calcReadMinutes(content) {
    if (!content) return 3;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  function formatDate(dateStr, lang = 'en') {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  function pickLocalized(field, lang) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field.en || Object.values(field)[0] || '';
  }

  function localizeArticle(article, lang) {
    return {
      ...article,
      title: pickLocalized(article.title, lang),
      excerpt: pickLocalized(article.excerpt, lang),
      content: pickLocalized(article.content, lang)
    };
  }

  function translateCategory(cat, lang) {
    const map = {
      ai: { en: 'Artificial Intelligence', ar: 'الذكاء الاصطناعي' },
      cybersecurity: { en: 'Cybersecurity', ar: 'الأمن السيبراني' },
      cloud: { en: 'Cloud Computing', ar: 'الحوسبة السحابية' },
      dev: { en: 'Development', ar: 'التطوير البرمجي' },
      oil_gas: { en: 'Oil & Gas Tech', ar: 'تقنية النفط والغاز' }
    };
    if (map[cat] && map[cat][lang]) return map[cat][lang];
    return cat;
  }

  // --- UI Elements Initialization (Dark mode, Admin gate, Ticker) ---
  function initDarkMode() {
    const saved = localStorage.getItem('tp_dark');
    if (saved === 'true') {
      document.body.classList.add('dark-mode');
    }
  }

  function initAdminGate() {
    // Admin gate logic placeholder
  }

  function initTicker() {
    // Ticker logic placeholder
  }

  async function getArticles() {
    // Returns standard articles list
    return [
      {
        id: 'article-1',
        category: 'ai',
        featured: true,
        date: '2026-06-01',
        title: { en: 'The Future of Neural Networks', ar: 'مستقبل الشبكات العصبية' },
        excerpt: { en: 'Exploring next-gen architectures in deep learning.', ar: 'استكشاف بنيات الجيل القادم في التعلم العميق.' },
        content: { en: 'Full content regarding neural networks...', ar: 'المحتوى الكامل حول الشبكات العصبية...' }
      }
    ];
  }

  // Export to global window object
  window.TPCommon = {
    trackAndGetSiteStats,
    encryptStatCode,
    getViews,
    registerView,
    getBookmarks,
    isBookmarked,
    toggleBookmark,
    hasLiked,
    getLikeCount,
    toggleLike,
    esc,
    calcReadMinutes,
    formatDate,
    pickLocalized,
    localizeArticle,
    translateCategory,
    initDarkMode,
    initAdminGate,
    initTicker,
    getArticles
  };
})();
