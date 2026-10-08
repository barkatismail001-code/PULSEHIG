/* ==========================================================================
   TechPulse — Live News (live-news.js) v20261008
   Multi-source live news feed:
   - Hacker News (tech) — no API key needed
   - Curated fallback from data/news.json
   Refreshes every hour by default.
   ========================================================================== */
window.TPLiveNews = (function () {
  'use strict';

  var HN_TOP_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  var HN_ITEM_URL = function (id) { return 'https://hacker-news.firebaseio.com/v0/item/' + id + '.json'; };

  function safeFetch(url, opts) {
    return fetch(url, opts || {}).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).catch(function (e) {
      console.warn('[TPLN] fetch failed for', url, e.message);
      return null;
    });
  }

  /* ---------- Hacker News ---------- */
  async function fetchLiveTech(limit) {
    limit = limit || 8;
    var ids = await safeFetch(HN_TOP_URL);
    if (!ids || !Array.isArray(ids)) return [];

    var items = await Promise.all(ids.slice(0, limit * 2).map(function (id) {
      return safeFetch(HN_ITEM_URL(id));
    }));

    return items
      .filter(function (it) { return it && it.title && (it.url || it.id); })
      .slice(0, limit)
      .map(function (it) {
        return {
          id: 'hn-' + it.id,
          category: 'tech',
          title: { en: it.title },
          url: it.url || ('https://news.ycombinator.com/item?id=' + it.id),
          source: 'Hacker News',
          live: true
        };
      });
  }

  /* ---------- Curated fallback ---------- */
  async function fetchCurated() {
    try {
      var res = await fetch('data/news.json', { cache: 'no-store' });
      if (!res.ok) return [];
      var json = await res.json();
      return Array.isArray(json) ? json : [];
    } catch (e) {
      console.warn('[TPLN] curated news failed', e.message);
      return [];
    }
  }

  /* ---------- Aggregate feed ---------- */
  async function getFeed() {
    var results = await Promise.all([
      fetchLiveTech(8).catch(function () { return []; }),
      fetchCurated().catch(function () { return []; })
    ]);

    var live = results[0];
    var curated = results[1];

    /* Deduplicate by title */
    var seen = new Set();
    var merged = [];
    live.concat(curated).forEach(function (item) {
      var key = typeof item.title === 'string' ? item.title : (item.title && item.title.en) || '';
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });

    return merged;
  }

  /* ---------- Auto-refresh ---------- */
  function startAutoRefresh(callback, intervalMs) {
    intervalMs = intervalMs || 60 * 60 * 1000;

    var tick = async function () {
      try {
        var feed = await getFeed();
        callback(feed);
      } catch (err) {
        console.error('[TPLN] refresh failed', err);
      }
    };

    tick();
    return setInterval(tick, intervalMs);
  }

  return {
    getFeed: getFeed,
    startAutoRefresh: startAutoRefresh,
    fetchLiveTech: fetchLiveTech,
    fetchCurated: fetchCurated
  };
})();