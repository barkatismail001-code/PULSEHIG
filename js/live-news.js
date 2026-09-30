/* ==========================================================================
   TechPulse — Live News (live-news.js)
   Genuinely live, key-free tech headlines from the Hacker News public API,
   refreshed every hour. Oil & gas PRICES need a real data provider — almost
   all of them (EIA, OilPriceAPI, CommoditiesAPI...) require a free API key
   because they're metered. Paste a free EIA key below to turn that feed on;
   until then the curated data/news.json entries are used so the site never
   shows an empty ticker.

   Get a free EIA Open Data key (takes ~1 minute, no credit card):
   https://www.eia.gov/opendata/register.php
   ========================================================================== */
window.TPLiveNews = (function () {
  'use strict';

  const EIA_API_KEY = ''; // <-- paste your free EIA API key here to enable live oil & gas prices

  const HN_TOP_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  const HN_ITEM_URL = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

  async function fetchLiveTech(limit = 6) {
    const res = await fetch(HN_TOP_URL);
    if (!res.ok) throw new Error('Hacker News request failed');
    const ids = (await res.json()).slice(0, limit);
    const items = await Promise.all(
      ids.map(id => fetch(HN_ITEM_URL(id)).then(r => (r.ok ? r.json() : null)).catch(() => null))
    );
    return items
      .filter(it => it && it.title)
      .map(it => ({
        id: 'hn-' + it.id,
        category: 'tech',
        title: { en: it.title },
        url: it.url || `https://news.ycombinator.com/item?id=${it.id}`,
        live: true
      }));
  }

  async function fetchLiveOilGas() {
    if (!EIA_API_KEY) return [];
    try {
      const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=1`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      const point = json && json.response && json.response.data && json.response.data[0];
      if (!point) return [];
      return [{
        id: 'eia-wti-' + point.period,
        category: 'oil_gas',
        title: { en: `WTI crude spot price: $${point.value}/barrel (${point.period})` },
        url: 'https://www.eia.gov/petroleum/',
        live: true
      }];
    } catch (err) {
      console.warn('EIA live price fetch failed, using curated fallback', err);
      return [];
    }
  }

  async function fetchCurated() {
    try {
      const res = await fetch('data/news.json', { cache: 'no-store' });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn('Could not load data/news.json', err);
      return [];
    }
  }

  async function getFeed() {
    const [curated, liveTech, liveOilGas] = await Promise.all([
      fetchCurated(),
      fetchLiveTech().catch(() => []),
      fetchLiveOilGas().catch(() => [])
    ]);
    // Genuinely live items lead the feed; curated items fill the rest
    // and act as the fallback whenever a live source is unreachable.
    return [...liveTech, ...liveOilGas, ...curated];
  }

  function startAutoRefresh(callback, intervalMs) {
    intervalMs = intervalMs || 60 * 60 * 1000; // 1 hour
    async function tick() {
      try {
        callback(await getFeed());
      } catch (err) {
        console.error('Live news refresh failed', err);
      }
    }
    tick();
    return setInterval(tick, intervalMs);
  }

  return { getFeed, startAutoRefresh, hasLiveOilGas: () => !!EIA_API_KEY };
})();
