/* ==========================================================================
   TechPulse — Q&A Engine (qa.js) v20261005
   Stack Overflow-style Q&A built on Supabase (qa_questions / qa_answers).
   Handles: load, search, filter, sort, ask, sign in/up, modals.
   Requires js/common.js and js/i18n.js and supabase-js v2
   ========================================================================== */
(function () {
  'use strict';

  var C = window.TPCommon;
  var I = window.TPI18N;

  if (!C || !I) {
    console.warn('[TP] qa.js requires common.js and i18n.js');
    return;
  }

  var sb = null;
  var currentUser = null;
  var allQuestions = [];
  var activeCategory = 'all';
  var activeSort = 'newest';
  var searchTerm = '';

  /* ---------- Bootstrap ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    C.initDarkMode();
    C.initTicker();
    C.trackAndGetSiteStats();
    initScrollProgress();
    initScrollTopButton();
    initSupabase();
    initModalHandlers();
    initAuthButtons();
    wireSearch();
    wireFilters();
    loadQuestions();
  });

  /* ---------- Supabase client ---------- */
  function initSupabase() {
    if (window.supabaseClient) {
      sb = window.supabaseClient;
      return;
    }
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('[TP] supabase-js not loaded');
      return;
    }
    sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.supabaseClient = sb;

    sb.auth.getSession().then(function (res) {
      currentUser = (res.data && res.data.session && res.data.session.user) || null;
      updateAuthUI();
    });

    sb.auth.onAuthStateChange(function (_evt, session) {
      currentUser = (session && session.user) || null;
      updateAuthUI();
    });
  }

  function updateAuthUI() {
    var signInBtn = document.getElementById('qaSignInBtn');
    var askBtn = document.getElementById('qaAskBtn');

    if (currentUser) {
      if (signInBtn) {
        signInBtn.textContent = 'Sign Out (' + currentUser.email.split('@')[0] + ')';
        signInBtn.style.display = '';
        signInBtn.classList.remove('primary');
        signInBtn.onclick = async function () {
          await sb.auth.signOut();
          C.showToast('Signed out');
        };
      }
      if (askBtn) askBtn.style.display = '';
    } else {
      if (signInBtn) {
        signInBtn.textContent = 'Sign In';
        signInBtn.style.display = '';
        signInBtn.onclick = openAuthModal;
      }
      if (askBtn) askBtn.style.display = '';
    }
  }

  /* ---------- Modals ---------- */
  function initModalHandlers() {
    var askBtn = document.getElementById('qaAskBtn');
    if (askBtn) {
      askBtn.addEventListener('click', function () {
        if (!currentUser) {
          C.showToast('Please sign in to ask a question');
          openAuthModal();
          return;
        }
        openAskModal();
      });
    }

    var cancelBtn = document.getElementById('qaCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeAskModal);

    var submitBtn = document.getElementById('qaSubmitBtn');
    if (submitBtn) submitBtn.addEventListener('click', submitQuestion);

    var authClose = document.getElementById('qaAuthClose');
    if (authClose) authClose.addEventListener('click', closeAuthModal);

    var signInSubmit = document.getElementById('qaSignInSubmit');
    if (signInSubmit) signInSubmit.addEventListener('click', doSignIn);

    var signUpSubmit = document.getElementById('qaSignUpSubmit');
    if (signUpSubmit) signUpSubmit.addEventListener('click', doSignUp);

    var passInput = document.getElementById('qaAuthPassword');
    if (passInput) {
      passInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doSignIn();
      });
    }

    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(function (m) {
          m.classList.remove('open');
        });
      }
    });
  }

  function initAuthButtons() {
    var signInBtn = document.getElementById('qaSignInBtn');
    if (signInBtn && !signInBtn.onclick) {
      signInBtn.onclick = openAuthModal;
    }
  }

  function openAskModal() {
    var modal = document.getElementById('qaAskModal');
    if (modal) modal.classList.add('open');
  }

  function closeAskModal() {
    var modal = document.getElementById('qaAskModal');
    if (modal) modal.classList.remove('open');
    var t = document.getElementById('qaNewTitle');
    var b = document.getElementById('qaNewBody');
    var tg = document.getElementById('qaNewTags');
    if (t) t.value = '';
    if (b) b.value = '';
    if (tg) tg.value = '';
  }

  function openAuthModal() {
    var modal = document.getElementById('qaAuthModal');
    if (modal) modal.classList.add('open');
  }

  function closeAuthModal() {
    var modal = document.getElementById('qaAuthModal');
    if (modal) modal.classList.remove('open');
    var p = document.getElementById('qaAuthPassword');
    if (p) p.value = '';
  }

  /* ---------- Auth ---------- */
  async function doSignIn() {
    if (!sb) return C.showToast('Service unavailable');
    var email = (document.getElementById('qaAuthEmail') || {}).value || '';
    var pass = (document.getElementById('qaAuthPassword') || {}).value || '';
    email = email.trim();
    if (!email || !pass) return C.showToast('Enter email and password');

    var res = await sb.auth.signInWithPassword({ email: email, password: pass });
    if (res.error) return C.showToast(res.error.message);
    C.showToast('Signed in');
    closeAuthModal();
  }

  async function doSignUp() {
    if (!sb) return C.showToast('Service unavailable');
    var email = (document.getElementById('qaAuthEmail') || {}).value || '';
    var pass = (document.getElementById('qaAuthPassword') || {}).value || '';
    email = email.trim();
    if (!email || !pass) return C.showToast('Enter email and password');
    if (pass.length < 6) return C.showToast('Password must be 6+ chars');

    var res = await sb.auth.signUp({ email: email, password: pass });
    if (res.error) return C.showToast(res.error.message);
    C.showToast('Account created');
    closeAuthModal();
  }

  /* ---------- Ask a question ---------- */
  async function submitQuestion() {
    if (!sb || !currentUser) {
      C.showToast('Please sign in');
      return;
    }

    var title = (document.getElementById('qaNewTitle') || {}).value || '';
    var category = (document.getElementById('qaNewCategory') || {}).value || 'electronics';
    var body = (document.getElementById('qaNewBody') || {}).value || '';
    var tags = (document.getElementById('qaNewTags') || {}).value || '';

    title = title.trim();
    body = body.trim();

    if (!title) return C.showToast('Please enter a title');
    if (title.length > 140) return C.showToast('Title too long');

    var btn = document.getElementById('qaSubmitBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Publishing...'; }

    var insert = {
      title: title,
      category: category,
      content: body + (tags ? '\n\nTags: ' + tags : ''),
      author: currentUser.email.split('@')[0],
      author_id: currentUser.id,
      answers_count: 0
    };

    var res = await sb.from('qa_questions').insert([insert]);

    if (btn) { btn.disabled = false; btn.textContent = 'Publish Question'; }

    if (res.error) return C.showToast('Error: ' + res.error.message);

    C.showToast('Question published');
    closeAskModal();
    loadQuestions();
  }

  /* ---------- Load questions ---------- */
  async function loadQuestions() {
    var list = document.getElementById('qaList');
    if (!list) return;
    list.innerHTML = '<p class="loading-state">Loading questions...</p>';

    var SB = C.SUPABASE_URL;
    var KEY = C.SUPABASE_ANON_KEY;
    var url = SB + '/rest/v1/qa_questions?select=*&order=created_at.desc&limit=200';

    try {
      var res = await fetch(url, {
        headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      allQuestions = Array.isArray(data) ? data : [];
      renderQuestions();
    } catch (err) {
      console.warn('[TP] qa load error', err);
      list.innerHTML = '<p class="loading-state">Failed to load: ' + (err.message || err) + '</p>';
    }
  }

  /* ---------- Filters ---------- */
  function wireSearch() {
    var input = document.getElementById('qaSearch');
    if (!input) return;
    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        searchTerm = input.value.trim().toLowerCase();
        renderQuestions();
      }, 200);
    });
  }

  function wireFilters() {
    var catSelect = document.getElementById('qaCategory');
    var sortSelect = document.getElementById('qaSort');

    if (catSelect) {
      catSelect.addEventListener('change', function (e) {
        activeCategory = e.target.value;
        renderQuestions();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function (e) {
        activeSort = e.target.value;
        renderQuestions();
      });
    }
  }

  /* ---------- Render questions ---------- */
  function renderQuestions() {
    var list = document.getElementById('qaList');
    if (!list) return;

    var filtered = allQuestions.filter(function (q) {
      if (activeCategory !== 'all' && String(q.category || '').toLowerCase() !== activeCategory) {
        return false;
      }
      if (!searchTerm) return true;
      var haystack = [q.title, q.content, q.author, q.category].join(' ').toLowerCase();
      return haystack.indexOf(searchTerm) !== -1;
    });

    /* Sort */
    if (activeSort === 'votes') {
      filtered.sort(function (a, b) { return (b.answers_count || 0) - (a.answers_count || 0); });
    } else if (activeSort === 'answers') {
      filtered.sort(function (a, b) { return (b.answers_count || 0) - (a.answers_count || 0); });
    } else {
      filtered.sort(function (a, b) {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    }

    if (!filtered.length) {
      list.innerHTML = '<p class="loading-state">No questions found. Be the first to ask!</p>';
      return;
    }

    list.innerHTML = filtered.map(function (q) {
      var votes = Number(q.answers_count) || 0;
      var status = votes > 0 ? 'answered' : 'open';
      var statusLabel = votes > 0 ? '✓ ' + votes + ' answers' : 'Open';
      var excerpt = String(q.content || '').replace(/Tags:.*$/m, '').trim();
      if (excerpt.length > 200) excerpt = excerpt.slice(0, 200) + '…';
      var cat = String(q.category || '').toLowerCase();

      return '<a href="question.html?id=' + encodeURIComponent(q.id) + '" class="qa-item">' +
        '<div class="qa-votes">' +
          '<span class="vote-count">' + votes + '</span>' +
          '<span class="vote-label">answers</span>' +
        '</div>' +
        '<div class="qa-content">' +
          '<h3>' + C.esc(q.title || '') + '</h3>' +
          '<p class="qa-excerpt">' + C.esc(excerpt) + '</p>' +
          '<div class="qa-meta">' +
            '<span class="qa-status ' + status + '">' + C.esc(statusLabel) + '</span>' +
            '<span class="qa-tag">' + C.esc(cat) + '</span>' +
            '<span>By <strong>' + C.esc(q.author || 'Member') + '</strong></span>' +
            '<span>' + C.formatDate(q.created_at || '', I.getLang()) + '</span>' +
          '</div>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  /* ---------- Scroll progress + top ---------- */
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
})();