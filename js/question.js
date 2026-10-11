/* TechPulse — single Q&A question page (question.html)
   Reads qa_questions / qa_answers only. Independent from the forum. */
(function () {
  'use strict';
  var C = window.TPCommon;
  if (!C) { console.warn('[TP] question.js needs common.js'); return; }

  var SB = C.SUPABASE_URL;
  var KEY = C.SUPABASE_ANON_KEY;
  var sb = null;
  var user = null;
  var qid = new URLSearchParams(location.search).get('id');

  function headers() { return { apikey: KEY, Authorization: 'Bearer ' + KEY }; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function body(text) {
    var e = esc(text || '');
    e = e.replace(/`([^`]+)`/g, '<code>$1</code>');
    return e.split(/\n\n+/).map(function (p) {
      return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function initClient() {
    if (window.supabaseClient) sb = window.supabaseClient;
    else if (window.supabase && window.supabase.createClient) {
      sb = window.supabase.createClient(SB, KEY, { auth: { persistSession: true, autoRefreshToken: true } });
      window.supabaseClient = sb;
    }
    if (!sb) return Promise.resolve();
    return sb.auth.getSession().then(function (r) {
      user = (r.data && r.data.session && r.data.session.user) || null;
    });
  }

  async function fetchJson(url) {
    var res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function loadAnswers() {
    var box = document.getElementById('qAnswers');
    var cnt = document.getElementById('qAnswersCount');
    var list = await fetchJson(SB + '/rest/v1/qa_answers?select=*&question_id=eq.' + encodeURIComponent(qid) + '&order=created_at.asc');
    if (!Array.isArray(list)) list = [];
    if (cnt) cnt.textContent = list.length + (list.length === 1 ? ' Answer' : ' Answers');
    box.innerHTML = list.length ? list.map(function (a) {
      return '<article class="topic-reply"><div class="reply-head"><strong>' + esc(a.author || 'Guest') +
        '</strong><span>' + esc(new Date(a.created_at).toLocaleString()) + '</span></div>' +
        '<div class="reply-body">' + body(a.content) + '</div></article>';
    }).join('') : '<p class="loading-state">No answers yet. Be the first to answer!</p>';
  }

  function renderForm() {
    var box = document.getElementById('qAnswerForm');
    if (!user) {
      box.innerHTML = '<p>Please <a href="/qa.html">sign in on the Q&amp;A page</a>, then come back to answer.</p>';
      return;
    }
    box.innerHTML = '<textarea id="qAnswerText" rows="6" maxlength="10000" placeholder="Write your answer..." ' +
      'style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-alt);color:var(--text)"></textarea>' +
      '<button type="button" id="qAnswerBtn" class="btn-primary" style="margin-top:10px;padding:10px 20px">Post answer</button>';
    document.getElementById('qAnswerBtn').addEventListener('click', postAnswer);
  }

  async function postAnswer() {
    var ta = document.getElementById('qAnswerText');
    var btn = document.getElementById('qAnswerBtn');
    var text = (ta.value || '').trim();
    if (text.length < 2) { C.showToast('Write your answer first'); return; }
    btn.disabled = true; btn.textContent = 'Posting...';
    var res = await sb.from('qa_answers').insert([{
      question_id: qid,
      content: text,
      author: (user.email || 'user').split('@')[0],
      author_id: user.id
    }]);
    btn.disabled = false; btn.textContent = 'Post answer';
    if (res.error) { C.showToast('Error: ' + res.error.message); return; }
    ta.value = '';
    C.showToast('Answer posted');
    loadAnswers().catch(function (e) { console.warn(e); });
  }

  async function load() {
    var box = document.getElementById('topicContainer');
    if (!box) return;
    if (!qid) { box.innerHTML = '<p class="loading-state">No question specified.</p>'; return; }
    try {
      await initClient();
      var rows = await fetchJson(SB + '/rest/v1/qa_questions?select=*&id=eq.' + encodeURIComponent(qid));
      if (!rows.length) { box.innerHTML = '<p class="loading-state">Question not found.</p>'; return; }
      var q = rows[0];
      document.title = q.title + ' | TechPulse';
      box.innerHTML =
        '<nav class="breadcrumb" style="margin:16px 0;font-size:0.9rem;color:var(--text-muted)">' +
          '<a href="/index.html">Home</a> &gt; <a href="/qa.html">Q&amp;A</a> &gt; <span>' + esc(q.title.slice(0, 50)) + '</span></nav>' +
        '<header class="topic-header"><span class="topic-badge topic-badge-question">QUESTION</span>' +
          '<h1>' + esc(q.title) + '</h1>' +
          '<div class="topic-meta"><span>By <strong>' + esc(q.author || 'Guest') + '</strong></span>' +
          '<span>' + esc(new Date(q.created_at).toLocaleDateString()) + '</span></div></header>' +
        '<div class="topic-body">' + body(q.content) + '</div>' +
        '<section class="topic-replies-section"><h2 id="qAnswersCount">Answers</h2>' +
          '<div class="topic-replies" id="qAnswers"><p class="loading-state">Loading...</p></div></section>' +
        '<section style="margin-top:28px"><h3>Your answer</h3><div id="qAnswerForm"></div></section>' +
        '<div style="text-align:center;margin:32px 0"><a href="/qa.html" class="btn-secondary">&larr; Back to Q&amp;A</a></div>';
      renderForm();
      await loadAnswers();
    } catch (e) {
      console.error('[TP] question load failed', e);
      box.innerHTML = '<p class="loading-state">Failed to load: ' + esc(e.message) + '</p>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
