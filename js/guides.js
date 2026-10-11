/* ==========================================================================
   TechPulse — Guides Engine (guides.js) v20261005
   Loads DIY guides from data/guides.json, renders grid, handles search,
   category, and difficulty filters.
   Requires js/common.js and js/i18n.js
   ========================================================================== */
(function () {
  'use strict';

  var C = window.TPCommon;
  var I = window.TPI18N;

  if (!C || !I) {
    console.warn('[TP] guides.js requires common.js and i18n.js');
    return;
  }

  var allGuides = [];
  var activeCategory = 'all';
  var activeDifficulty = 'all';
  var searchTerm = '';

  document.addEventListener('DOMContentLoaded', function () {
    C.initDarkMode();
    C.initTicker();
    C.trackAndGetSiteStats();
    initScrollProgress();
    initScrollTopButton();
    wireSearch();
    wireFilters();
    loadGuides();
  });

  document.addEventListener('tp:langchange', function () {
    renderGuides();
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

  /* ---------- Search ---------- */
  function wireSearch() {
    var input = document.getElementById('guideSearch');
    if (!input) return;
    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        searchTerm = input.value.trim();
        renderGuides();
      }, 200);
    });
  }

  /* ---------- Filters ---------- */
  function wireFilters() {
    var catSelect = document.getElementById('guideCategory');
    var diffSelect = document.getElementById('guideDifficulty');

    if (catSelect) {
      catSelect.addEventListener('change', function (e) {
        activeCategory = e.target.value;
        renderGuides();
      });
    }

    if (diffSelect) {
      diffSelect.addEventListener('change', function (e) {
        activeDifficulty = e.target.value;
        renderGuides();
      });
    }
  }

  /* ---------- Load guides ---------- */
  async function loadGuides() {
    var grid = document.getElementById('guidesGrid');
    if (!grid) return;

    try {
      var res = await fetch('data/guides.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      allGuides = await res.json();
      if (!Array.isArray(allGuides)) allGuides = [];
      updateStats();
      renderGuides();
    } catch (err) {
      console.warn('[TP] guides load failed', err);
      grid.innerHTML = '<p class="loading-state">Unable to load guides. Please refresh the page.</p>';
    }
  }

  /* ---------- Stats bar ---------- */
  function updateStats() {
    var box = document.getElementById('guidesStatsBar');
    if (!box) return;
    var beginner = allGuides.filter(function (g) { return g.difficulty === 'Beginner'; }).length;
    var intermediate = allGuides.filter(function (g) { return g.difficulty === 'Intermediate'; }).length;
    var advanced = allGuides.filter(function (g) { return g.difficulty === 'Advanced'; }).length;

    box.innerHTML =
      '<div class="stat-block"><span class="stat-num">' + allGuides.length + '</span>' +
      '<span class="stat-label">Guides</span></div>' +
      '<div class="stat-block"><span class="stat-num">' + beginner + '</span>' +
      '<span class="stat-label">Beginner</span></div>' +
      '<div class="stat-block"><span class="stat-num">' + intermediate + '</span>' +
      '<span class="stat-label">Intermediate</span></div>' +
      '<div class="stat-block"><span class="stat-num">' + advanced + '</span>' +
      '<span class="stat-label">Advanced</span></div>';
  }

  /* ---------- Render guides ---------- */
  function renderGuides() {
    var grid = document.getElementById('guidesGrid');
    if (!grid) return;

    var lang = I.getLang();
    var filtered = allGuides.filter(function (g) {
      if (activeCategory !== 'all' && g.category !== activeCategory) return false;
      if (activeDifficulty !== 'all' && g.difficulty !== activeDifficulty) return false;
      if (!searchTerm) return true;
      var term = searchTerm.toLowerCase();
      var title = (g.title_i18n && g.title_i18n[lang]) || g.title || '';
      var desc = g.description || '';
      var keywords = (g.keywords || []).join(' ');
      var haystack = [title, desc, g.category, keywords].join(' ').toLowerCase();
      return haystack.indexOf(term) !== -1;
    });

    if (!filtered.length) {
      grid.innerHTML = '<p class="loading-state">No guides match your filters.</p>';
      return;
    }

    grid.innerHTML = filtered.map(function (g) {
      var title = (g.title_i18n && g.title_i18n[lang]) || g.title || '';
      var desc = g.description || '';
      var diffClass = String(g.difficulty || 'beginner').toLowerCase();
      var href = 'guide.html?slug=' + encodeURIComponent(g.slug || g.id);

      return '<a href="' + C.esc(href) + '" class="guide-card">' +
        '<div class="guide-header">' +
          '<span class="guide-icon">' + C.esc(g.icon || '📖') + '</span>' +
          '<span class="difficulty-badge ' + C.esc(diffClass) + '">' + C.esc(g.difficulty || '') + '</span>' +
        '</div>' +
        '<h3>' + C.esc(title) + '</h3>' +
        '<p>' + C.esc(desc) + '</p>' +
        '<div class="guide-meta">' +
          '<span>⏱ ' + (g.time_minutes || 0) + ' min</span>' +
          '<span>💰 $' + (g.cost_usd || 0) + '</span>' +
          '<span>📦 ' + (g.parts ? g.parts.length : 0) + ' parts</span>' +
        '</div>' +
      '</a>';
    }).join('');
  }
})();