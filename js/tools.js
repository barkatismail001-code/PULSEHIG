/* ==========================================================================
   TechPulse — Tools Engine (tools.js) v20261005
   Loads engineering calculators from data/tools.json, renders grid,
   handles search and category filters.
   Requires js/common.js and js/i18n.js
   ========================================================================== */
(function () {
  'use strict';

  var C = window.TPCommon;
  var I = window.TPI18N;

  if (!C || !I) {
    console.warn('[TP] tools.js requires common.js and i18n.js');
    return;
  }

  var allTools = [];
  var activeCategory = 'all';
  var searchTerm = '';

  document.addEventListener('DOMContentLoaded', function () {
    C.initDarkMode();
    C.initTicker();
    C.trackAndGetSiteStats();
    initScrollProgress();
    initScrollTopButton();
    wireSearch();
    wireCategory();
    loadTools();
  });

  document.addEventListener('tp:langchange', function () {
    renderTools();
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
    var input = document.getElementById('toolSearch');
    if (!input) return;
    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        searchTerm = input.value.trim();
        renderTools();
      }, 200);
    });
  }

  /* ---------- Category ---------- */
  function wireCategory() {
    var select = document.getElementById('toolCategory');
    if (!select) return;
    select.addEventListener('change', function (e) {
      activeCategory = e.target.value;
      renderTools();
    });
  }

  /* ---------- Load tools ---------- */
  async function loadTools() {
    var grid = document.getElementById('toolsGrid');
    if (!grid) return;

    try {
      var res = await fetch('data/tools.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      allTools = await res.json();
      if (!Array.isArray(allTools)) allTools = [];
      updateStats();
      renderTools();
    } catch (err) {
      console.warn('[TP] tools load failed', err);
      grid.innerHTML = '<p class="loading-state">Unable to load tools. Please refresh the page.</p>';
    }
  }

  /* ---------- Stats bar ---------- */
  function updateStats() {
    var box = document.getElementById('toolsStatsBar');
    if (!box) return;
    var categories = {};
    allTools.forEach(function (t) { if (t.category) categories[t.category] = 1; });
    box.innerHTML =
      '<div class="stat-block"><span class="stat-num">' + allTools.length + '</span>' +
      '<span class="stat-label">Tools</span></div>' +
      '<div class="stat-block"><span class="stat-num">' + Object.keys(categories).length + '</span>' +
      '<span class="stat-label">Categories</span></div>' +
      '<div class="stat-block"><span class="stat-num">100%</span>' +
      '<span class="stat-label">Free</span></div>';
  }

  /* ---------- Render tools ---------- */
  function renderTools() {
    var grid = document.getElementById('toolsGrid');
    if (!grid) return;

    var lang = I.getLang();
    var filtered = allTools.filter(function (t) {
      var inCat = activeCategory === 'all' || t.category === activeCategory;
      if (!inCat) return false;
      if (!searchTerm) return true;
      var term = searchTerm.toLowerCase();
      var title = (t.title_i18n && t.title_i18n[lang]) || t.title || '';
      var desc = t.description || '';
      var keywords = (t.keywords || []).join(' ');
      var haystack = [title, desc, t.category, keywords].join(' ').toLowerCase();
      return haystack.indexOf(term) !== -1;
    });

    if (!filtered.length) {
      grid.innerHTML = '<p class="loading-state">No tools match your search.</p>';
      return;
    }

    grid.innerHTML = filtered.map(function (t) {
      var title = (t.title_i18n && t.title_i18n[lang]) || t.title || '';
      var desc = t.description || '';
      var href = 'tool.html?slug=' + encodeURIComponent(t.slug || t.id);

      return '<a href="' + C.esc(href) + '" class="tool-card">' +
        '<div class="tool-icon">' + C.esc(t.icon || '🔧') + '</div>' +
        '<span class="tool-cat-badge">' + C.esc(t.category || '') + '</span>' +
        '<h3>' + C.esc(title) + '</h3>' +
        '<p>' + C.esc(desc) + '</p>' +
      '</a>';
    }).join('');
  }
})();