/* TechPulse — Academy Engine v20261007
   Loads courses from Supabase with REAL counts from lectures/assignments/exams tables. */
(function () {
  'use strict';
  var C = window.TPCommon;
  var I = window.TPI18N;
  if (!C || !I) return;

  var allCourses = [];
  var activeFilter = 'all';

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

  function initUrlParams() {
    var params = new URLSearchParams(location.search);
    var path = params.get('path');
    if (path) activeFilter = path;
  }

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

  function sbHeaders() {
    return { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY };
  }

  async function loadCourses() {
    var grid = document.getElementById('coursesGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="loading-state">Loading courses...</p>';

    try {
      // Fetch all data in parallel
      var [coursesRes, lecturesRes, assignmentsRes, examsRes] = await Promise.all([
        fetch(C.SUPABASE_URL + '/rest/v1/courses?select=*&order=university.asc,code.asc&limit=200', { headers: sbHeaders() }),
        fetch(C.SUPABASE_URL + '/rest/v1/lectures?select=course_slug', { headers: sbHeaders() }),
        fetch(C.SUPABASE_URL + '/rest/v1/assignments?select=course_slug', { headers: sbHeaders() }),
        fetch(C.SUPABASE_URL + '/rest/v1/exams?select=course_slug', { headers: sbHeaders() })
      ]);

      allCourses = await coursesRes.json();
      var lectures = await lecturesRes.json();
      var assignments = await assignmentsRes.json();
      var exams = await examsRes.json();

      if (!Array.isArray(allCourses)) allCourses = [];
      if (!Array.isArray(lectures)) lectures = [];
      if (!Array.isArray(assignments)) assignments = [];
      if (!Array.isArray(exams)) exams = [];

      // Count real per-course totals
      var lectureCounts = {};
      var assignmentCounts = {};
      var examCounts = {};

      lectures.forEach(function (l) {
        if (l.course_slug) lectureCounts[l.course_slug] = (lectureCounts[l.course_slug] || 0) + 1;
      });
      assignments.forEach(function (a) {
        if (a.course_slug) assignmentCounts[a.course_slug] = (assignmentCounts[a.course_slug] || 0) + 1;
      });
      exams.forEach(function (e) {
        if (e.course_slug) examCounts[e.course_slug] = (examCounts[e.course_slug] || 0) + 1;
      });

      // Override course counts with REAL numbers
      allCourses.forEach(function (c) {
        c.lectures_count = lectureCounts[c.slug] || 0;
        c.assignments_count = assignmentCounts[c.slug] || 0;
        c.exams_count = examCounts[c.slug] || 0;
        // Duration = lectures * 50 min, rounded up to hours
        c.duration_hours = Math.max(0, Math.round((c.lectures_count * 50) / 60));
      });

      updateStats();
      renderCourses();
    } catch (err) {
      console.warn('[TP] courses load failed', err);
      grid.innerHTML = '<p class="loading-state">Unable to load courses.</p>';
    }
  }

  function updateStats() {
    var totalCoursesEl = document.getElementById('statTotalCourses');
    var totalLecturesEl = document.getElementById('statTotalLectures');
    var totalProblemsEl = document.getElementById('statTotalProblems');
    var totalSolutionsEl = document.getElementById('statTotalSolutions');

    var totalCourses = allCourses.length;
    var totalLectures = allCourses.reduce(function (s, c) { return s + (Number(c.lectures_count) || 0); }, 0);
    var totalAssignments = allCourses.reduce(function (s, c) { return s + (Number(c.assignments_count) || 0); }, 0);
    var totalExams = allCourses.reduce(function (s, c) { return s + (Number(c.exams_count) || 0); }, 0);
    var totalProblems = totalAssignments + totalExams;

    if (totalCoursesEl) totalCoursesEl.textContent = String(totalCourses);
    if (totalLecturesEl) totalLecturesEl.textContent = String(totalLectures);
    if (totalProblemsEl) totalProblemsEl.textContent = String(totalProblems);
    if (totalSolutionsEl) totalSolutionsEl.textContent = String(totalProblems);
  }

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
      var hasContent = c.lectures_count > 0;

      return '<a href="' + C.esc(href) + '" class="course-card' + (hasContent ? '' : ' empty') + '">' +
        '<div class="course-card-header">' +
          '<span class="course-code ' + codeClass + '">' + C.esc(c.code || '') + '</span>' +
          '<span class="course-icon">' + C.esc(c.icon || '📘') + '</span>' +
        '</div>' +
        '<h3>' + C.esc(title) + '</h3>' +
        '<p class="course-desc">' + C.esc(description) + '</p>' +
        '<div class="course-meta">' +
          '<span title="Lectures">📹 ' + c.lectures_count + '</span>' +
          '<span title="Assignments">📝 ' + c.assignments_count + '</span>' +
          '<span title="Exams">🎯 ' + c.exams_count + '</span>' +
          '<span title="Duration">⏱ ' + c.duration_hours + 'h</span>' +
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

  function initDyk() { if (C.getDidYouKnow) renderDyk(); }

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