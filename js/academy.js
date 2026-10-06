/* ==========================================================================
   TechPulse — Academy Engine (academy.js) v20261005
   Loads courses from Supabase, renders grid, handles path and category filters,
   renders Did You Know section.
   Requires js/common.js and js/i18n.js
   ========================================================================== */
(function () {
  'use strict';

  var C = window.TPCommon;
  var I = window.TPI18N;

  if (!C || !I) {
    console.warn('[TP] academy.js requires common.js and i18n.js');
    return;
  }

  var allCourses = [];
  var activeFilter = 'all';

  /* ---------- Bootstrap ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    C.initDarkMode();
    C.initTicker();
    C.trackAndGetSiteStats();
    initScrollProgress();
    initScrollTopButton();
    initDyk();
    initFilters();
    initUrlParams();
    loadCourses();
  });

  document.addEventListener('tp:langchange', function () {
    renderCourses();
    renderDyk();
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

  /* ---------- URL params (path=electrical) ---------- */
  function initUrlParams() {
    var params = new URLSearchParams(location.search);
    var path = params.get('path');
    if (path) {
      activeFilter = path;
    }
  }

  /* ---------- Filters ---------- */
  function initFilters() {
    var filters = document.getElementById('coursesFilters');
    if (!filters) return;
    filters.querySelectorAll('.filter-chip').forEach(function (btn) {
      if (btn.dataset.filter === activeFilter) {
        filters.querySelectorAll('.filter-chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      }
      btn.addEventListener('click', function () {
        activeFilter = btn.dataset.filter;
        filters.querySelectorAll('.filter-chip').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        renderCourses();
      });
    });
  }

  /* ---------- Load courses from Supabase ---------- */
  async function loadCourses() {
    var grid = document.getElementById('coursesGrid');
    if (!grid) return;

    grid.innerHTML = '<p class="loading-state">' + C.esc(I.t('loading')) + '</p>';

    try {
      var url = C.SUPABASE_URL + '/rest/v1/courses?select=*&order=university.asc,code.asc&limit=200';
      var res = await fetch(url, {
        headers: {
          apikey: C.SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY
        }
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      allCourses = await res.json();
      if (!Array.isArray(allCourses)) allCourses = [];

      updateStats();
      renderCourses();
    } catch (err) {
      console.warn('[TP] courses load failed', err);
      grid.innerHTML = '<p class="loading-state">Unable to load courses. Please refresh the page.</p>';
    }
  }

  /* ---------- Update stats bar ---------- */
  function updateStats() {
    var totalCoursesEl = document.getElementById('statTotalCourses');
    var totalLecturesEl = document.getElementById('statTotalLectures');
    var totalProblemsEl = document.getElementById('statTotalProblems');
    var totalSolutionsEl = document.getElementById('statTotalSolutions');

    var totalCourses = allCourses.length;
    var totalLectures = allCourses.reduce(function (sum, c) { return sum + (Number(c.lectures_count) || 0); }, 0);
    var totalAssignments = allCourses.reduce(function (sum, c) { return sum + (Number(c.assignments_count) || 0); }, 0);
    var totalExams = allCourses.reduce(function (sum, c) { return sum + (Number(c.exams_count) || 0); }, 0);
    var totalProblems = totalAssignments + totalExams;

    if (totalCoursesEl) totalCoursesEl.textContent = String(totalCourses);
    if (totalLecturesEl) totalLecturesEl.textContent = String(totalLectures);
    if (totalProblemsEl) totalProblemsEl.textContent = String(totalProblems);
    if (totalSolutionsEl) {
      totalSolutionsEl.textContent = totalProblems > 0 ? String(totalProblems) : '0';
    }
  }

  /* ---------- Render courses grid ---------- */
  function renderCourses() {
    var grid = document.getElementById('coursesGrid');
    if (!grid) return;

    var lang = I.getLang();
    var courses = allCourses.filter(function (c) {
      return activeFilter === 'all' || c.path === activeFilter;
    });

    if (!courses.length) {
      grid.innerHTML = '<p class="loading-state">No courses match this filter.</p>';
      return;
    }

    grid.innerHTML = courses.map(function (c) {
      var title = (c.title_i18n && c.title_i18n[lang]) || c.title || '';
      var description = (c.description_i18n && c.description_i18n[lang]) || c.description || '';
      var codeClass = getCodeClass(c.university);
      var href = 'course.html?slug=' + encodeURIComponent(c.slug);

      return '<a href="' + C.esc(href) + '" class="course-card">' +
        '<div class="course-card-header">' +
          '<span class="course-code ' + codeClass + '">' + C.esc(c.code || '') + '</span>' +
          '<span class="course-icon">' + C.esc(c.icon || '📘') + '</span>' +
        '</div>' +
        '<h3>' + C.esc(title) + '</h3>' +
        '<p class="course-desc">' + C.esc(description) + '</p>' +
        '<div class="course-meta">' +
          '<span>📹 ' + (c.lectures_count || 0) + '</span>' +
          '<span>📝 ' + (c.assignments_count || 0) + '</span>' +
          '<span>🎯 ' + (c.exams_count || 0) + '</span>' +
          '<span>⏱ ' + (c.duration_hours || 0) + 'h</span>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  function getCodeClass(university) {
    var u = String(university || '').toLowerCase();
    if (u.indexOf('mit') !== -1) return 'course-code mit';
    if (u.indexOf('stanford') !== -1) return 'course-code stanford';
    if (u.indexOf('berkeley') !== -1) return 'course-code berkeley';
    if (u.indexOf('cmu') !== -1 || u.indexOf('carnegie') !== -1) return 'course-code cmu';
    if (u.indexOf('princeton') !== -1) return 'course-code princeton';
    if (u.indexOf('caltech') !== -1) return 'course-code caltech';
    return 'course-code';
  }

  /* ---------- Did You Know ---------- */
  function initDyk() {
    if (C.getDidYouKnow) {
      renderDyk();
    }
  }

  function renderDyk() {
    var contentEl = document.getElementById('dykContent');
    var sourceEl = document.getElementById('dykSource');
    if (!contentEl) return;
    var fact = C.getDidYouKnow();
    if (!fact) return;
    contentEl.textContent = fact.text;
    if (sourceEl) sourceEl.textContent = '— ' + fact.source;
  }
})();