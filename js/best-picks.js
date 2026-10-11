/* ==========================================================================
   TechPulse — Best Picks Engine (best-picks.js) v20261005
   Loads picks from data/best-picks.json and renders categories with tiered
   picks (Best / Also Great / Budget).
   Requires js/common.js and js/i18n.js
   ========================================================================== */
(function () {
  'use strict';

  var C = window.TPCommon;
  var I = window.TPI18N;

  if (!C || !I) {
    console.warn('[TP] best-picks.js requires common.js and i18n.js');
    return;
  }

  var allCategories = [];

  document.addEventListener('DOMContentLoaded', function () {
    C.initDarkMode();
    C.initTicker();
    C.trackAndGetSiteStats();
    initScrollProgress();
    initScrollTopButton();
    loadPicks();
  });

  document.addEventListener('tp:langchange', function () {
    renderPicks();
  });

  /* ---------- Scroll progress ---------- */
  function initScrollProgress() {
    var bar = document.getElementById('readingProgressBar');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var h = document.documentElement;
      var p = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = Math.min(100, Math.max(0, p)) + '%';
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

  /* ---------- Load picks ---------- */
  async function loadPicks() {
    var container = document.getElementById('picksCategories');
    if (!container) return;

    try {
      var res = await fetch('data/best-picks.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      allCategories = await res.json();
      if (!Array.isArray(allCategories)) allCategories = [];
      updateStats();
      renderPicks();
    } catch (err) {
      console.warn('[TP] best picks load failed', err);
      container.innerHTML = '<p class="loading-state">Unable to load picks. Please refresh the page.</p>';
    }
  }

  /* ---------- Stats bar ---------- */
  function updateStats() {
    var box = document.getElementById('picksStatsBar');
    if (!box) return;
    var totalPicks = allCategories.reduce(function (sum, c) {
      return sum + (Array.isArray(c.picks) ? c.picks.length : 0);
    }, 0);
    box.innerHTML =
      '<div class="stat-block"><span class="stat-num">' + allCategories.length + '</span>' +
      '<span class="stat-label">Categories</span></div>' +
      '<div class="stat-block"><span class="stat-num">' + totalPicks + '</span>' +
      '<span class="stat-label">Picks</span></div>' +
      '<div class="stat-block"><span class="stat-num">0</span>' +
      '<span class="stat-label">Sponsored</span></div>';
  }

  /* ---------- Render picks ---------- */
  function renderPicks() {
    var container = document.getElementById('picksCategories');
    if (!container) return;

    if (!allCategories.length) {
      container.innerHTML = '<p class="loading-state">No picks available yet.</p>';
      return;
    }

    var tierLabels = {
      best: I.t('best_pick') || 'Best',
      also_great: I.t('also_great') || 'Also Great',
      budget: I.t('budget_pick') || 'Budget',
      upgrade: I.t('upgrade_pick') || 'Upgrade'
    };

    container.innerHTML = allCategories.map(function (cat) {
      var picks = Array.isArray(cat.picks) ? cat.picks : [];
      if (!picks.length) return '';

      return '<section class="picks-category-section">' +
        '<div class="picks-category-header">' +
          '<h2>' +
            '<span class="picks-icon">' + C.esc(cat.icon || '⭐') + '</span>' +
            C.esc(cat.title || cat.category || '') +
          '</h2>' +
          '<span class="picks-count">' + picks.length + ' picks</span>' +
        '</div>' +
        '<div class="picks-category-grid">' +
          picks.map(function (p) {
            var tier = p.tier || 'best';
            var tierClass = tier === 'also_great' ? 'also-great' : tier;
            var tierLabel = tierLabels[tier] || tierLabels.best;

            return '<div class="pick-card ' + tierClass + '">' +
              '<span class="pick-badge ' + tierClass + '">' + C.esc(tierLabel) + '</span>' +
              '<h4>' + C.esc(p.title || '') + '</h4>' +
              (p.price ? '<div class="pick-price">' + C.esc(p.price) + '</div>' : '') +
              '<p class="pick-why">' + C.esc(p.why || '') + '</p>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</section>';
    }).join('');
  }
})();