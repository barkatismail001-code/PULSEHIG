/*
 * ADMIN PANEL — NOT FOR PUBLIC INDEXING (noindex, nofollow)
 * ==========================================================================
 * TechPulse — Admin Controller (admin.js) v20261018
 *
 * Every article is written by a person in six fixed sections (English only):
 *   1. The Problem          2. Possible Causes        3. Tools and Components Needed
 *   4. Step-by-Step Solution 5. Images and Diagrams   6. Common Mistakes
 * (+ an optional "Safety notes & extra sections" box)
 *
 * There is NO AI generation, NO automatic translation and NO automatic publishing.
 * After saving, run  GitHub -> Actions -> "Rebuild Static Pages (manual)"  to publish
 * the static HTML page that search engines and AdSense crawl.
 * Requires js/common.js (TPCommon) and the Supabase client created in admin.html.
 * ========================================================================== */
(function () {
  'use strict';

  var C = window.TPCommon;
  if (!C) { console.warn('[TP] admin.js requires common.js'); return; }

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var supabaseClient = window.adminSb ||
    (window.supabase && window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY));
  if (!supabaseClient) { console.warn('[TP] Admin: no supabase client'); return; }

  var MIN_WORDS = 600;            // below this the static build keeps the page noindex + unlisted
  var MAX_EXCERPT = 155;
  var SECTIONS = [
    { key: 'problem',  head: 'The Problem',                 field: 'sec-problem',  re: /^(the )?problem( faced by the user)?$/i, required: true },
    { key: 'causes',   head: 'Possible Causes',             field: 'sec-causes',   re: /^(possible|potential) causes( of the problem)?$/i, required: true },
    { key: 'tools',    head: 'Tools and Components Needed', field: 'sec-tools',    re: /^(required )?tools (and|&) components( needed| required)?$/i, required: true },
    { key: 'steps',    head: 'Step-by-Step Solution',       field: 'sec-steps',    re: /^(detailed )?step[- ]by[- ]step solution( guide)?$/i, required: true },
    { key: 'images',   head: 'Images and Diagrams',         field: 'sec-images',   re: /^(images (and|or) diagrams|diagrams)$/i, required: false },
    { key: 'mistakes', head: 'Common Mistakes',             field: 'sec-mistakes', re: /^common mistakes( to avoid)?$/i, required: true }
  ];
  var NON_ENGLISH = /[\u0400-\u04FF\u0590-\u06FF\u0700-\u08FF\u0900-\u0DFF\u0E00-\u0EFF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/;
  var ALLOWED_IMG = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

  var articlesCache = [];
  var currentImageData = '';
  var currentImageFile = null;
  var diagrams = [];              // [{ url, alt, caption }]
  var slugEdited = false;

  var form = $('#article-form');
  var el = {
    id: $('#article-id'), title: $('#title'), slug: $('#slug'), category: $('#category'),
    author: $('#author'), date: $('#date'), readTime: $('#readTime'), excerpt: $('#excerpt'),
    tags: $('#tags'), featured: $('#featured'), extra: $('#sec-extra'), legacy: $('#legacy-content'),
    legacyBox: $('#legacy-box'), original: $('#confirm-original'),
    imgFile: $('#image-file'), imgPreview: $('#image-preview'), imgRemove: $('#remove-image'),
    diagramList: $('#diagram-list'), diagramFile: $('#diagram-file'), diagramAdd: $('#diagram-add'),
    formTitle: $('#form-title'), reset: $('#reset-btn'), list: $('#admin-articles-list'),
    wordCount: $('#word-count'), excerptCount: $('#excerpt-count'), checklist: $('#readiness'),
    note: $('#publish-note')
  };
  SECTIONS.forEach(function (s) { s.el = document.getElementById(s.field); });

  function words(t) { return String(t || '').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').split(/\s+/).filter(Boolean).length; }
  function val(node) { return node ? String(node.value || '').trim() : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function readTimeOf(text) { return Math.max(1, Math.round(words(text) / 200)) + ' min read'; }

  /* ---------- Compose the article body (Markdown) from the six sections ---------- */
  function diagramsMarkdown() {
    return diagrams.map(function (d, i) {
      var cap = (d.caption || '').trim();
      return '![' + (d.alt || '').trim() + '](' + d.url + ')' + (cap ? '\n\nFigure ' + (i + 1) + ': ' + cap : '');
    }).join('\n\n');
  }

  function compose() {
    var parts = [];
    SECTIONS.forEach(function (s) {
      var body = val(s.el);
      if (s.key === 'images') body = [diagramsMarkdown(), body].filter(Boolean).join('\n\n');
      if (body) parts.push('## ' + s.head + '\n\n' + body);
    });
    var extra = val(el.extra);
    if (extra) parts.push(extra);
    return parts.join('\n\n').trim();
  }

  /* ---------- Parse an existing article back into the sections ---------- */
  function parseContent(md) {
    var out = { problem: '', causes: '', tools: '', steps: '', images: '', mistakes: '', extra: '', legacy: '', diagrams: [] };
    var text = String(md || '').replace(/\r\n/g, '\n').trim();
    if (!text) return out;
    if (/<\s*(h[1-6]|p|ul|ol|div)\b/i.test(text) || !/^##\s+/m.test(text)) { out.legacy = text; return out; }

    var blocks = [], cur = { head: null, body: [] }, inFence = false;
    text.split('\n').forEach(function (ln) {
      if (/^```/.test(ln)) inFence = !inFence;
      var m = !inFence && /^##\s+(.+?)\s*$/.exec(ln);
      if (m) { blocks.push(cur); cur = { head: m[1], body: [] }; } else { cur.body.push(ln); }
    });
    blocks.push(cur);

    var extras = [];
    blocks.forEach(function (b) {
      var body = b.body.join('\n').trim();
      if (!b.head) { if (body) extras.push(body); return; }
      var clean = b.head.replace(/^\d+\.\s*/, '').trim();
      var sec = SECTIONS.filter(function (s) { return s.re.test(clean); })[0];
      if (!sec || out[sec.key] || (sec.key === 'images' && (out.diagrams.length || out.images))) { extras.push('## ' + b.head + '\n\n' + body); return; }
      if (sec.key === 'images') {
        var rest = [], arr = body.split(/\n{2,}/);
        for (var i = 0; i < arr.length; i++) {
          var im = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(arr[i].trim());
          if (im) {
            var d = { alt: im[1], url: im[2], caption: '' };
            var nx = /^Figure \d+:\s*(.+)$/.exec((arr[i + 1] || '').trim());
            if (nx) { d.caption = nx[1]; i++; }
            out.diagrams.push(d);
          } else { rest.push(arr[i]); }
        }
        out.images = rest.join('\n\n').trim();
      } else { out[sec.key] = body; }
    });
    out.extra = extras.join('\n\n').trim();
    return out;
  }

  /* ---------- Images / diagrams list ---------- */
  function renderDiagrams() {
    if (!el.diagramList) return;
    if (!diagrams.length) {
      el.diagramList.innerHTML = '<p class="sec-hint">No images yet. Add a diagram or photo where it helps the reader (wiring diagram, before/after photo, screenshot).</p>';
    } else {
      el.diagramList.innerHTML = diagrams.map(function (d, i) {
        return '<div class="diagram-item" data-i="' + i + '">' +
          '<img src="' + esc(d.url) + '" alt="' + esc(d.alt || 'Preview') + '">' +
          '<div class="diagram-fields">' +
            '<label>Alt text * <small>(describe what the image shows)</small></label>' +
            '<input type="text" data-f="alt" maxlength="140" value="' + esc(d.alt) + '" placeholder="e.g. ESP32 wired to a relay module with a flyback diode">' +
            '<label>Caption <small>(optional)</small></label>' +
            '<input type="text" data-f="caption" maxlength="160" value="' + esc(d.caption) + '" placeholder="e.g. Wiring for the low-side switch">' +
            '<button type="button" class="btn-secondary" data-rm="' + i + '">Remove</button>' +
          '</div></div>';
      }).join('');
    }
    updateMeta();
  }

  if (el.diagramList) {
    el.diagramList.addEventListener('input', function (e) {
      var item = e.target.closest('.diagram-item'); if (!item) return;
      var d = diagrams[Number(item.dataset.i)]; if (!d) return;
      d[e.target.dataset.f] = e.target.value; updateMeta();
    });
    el.diagramList.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm]'); if (!rm) return;
      diagrams.splice(Number(rm.dataset.rm), 1); renderDiagrams();
    });
  }
  if (el.diagramAdd && el.diagramFile) {
    el.diagramAdd.addEventListener('click', function () { el.diagramFile.value = ''; el.diagramFile.click(); });
    el.diagramFile.addEventListener('change', async function () {
      var f = el.diagramFile.files[0]; if (!f) return;
      C.showToast('⏳ Uploading image...');
      try {
        var url = await uploadToStorage(f, 'fig_');
        diagrams.push({ url: url, alt: '', caption: '' });
        renderDiagrams();
        C.showToast('✅ Image added — now describe it in the alt text');
      } catch (err) { C.showToast('❌ ' + err.message); }
    });
  }

  /* ---------- Hero image ---------- */
  var HERO_HINT = '<span class="image-hint">Click to upload a real photo or diagram (max 3 MB). Do not reuse the same image on every article.</span>';
  if (el.imgPreview && el.imgFile) {
    el.imgPreview.addEventListener('click', function () { el.imgFile.click(); });
    el.imgFile.addEventListener('change', function () {
      var f = el.imgFile.files[0]; if (!f) return;
      if (f.size > 3 * 1024 * 1024) { C.showToast('Image too large (max 3 MB)'); el.imgFile.value = ''; return; }
      currentImageFile = f;
      var r = new FileReader();
      r.onload = function (ev) {
        currentImageData = ev.target.result;
        el.imgPreview.innerHTML = '<img src="' + currentImageData + '" alt="Preview" style="width:150px;height:100px;object-fit:cover;border-radius:4px">';
        if (el.imgRemove) el.imgRemove.style.display = 'inline-block';
      };
      r.readAsDataURL(f);
    });
  }
  if (el.imgRemove) {
    el.imgRemove.addEventListener('click', function (e) {
      e.stopPropagation(); currentImageData = ''; currentImageFile = null;
      if (el.imgFile) el.imgFile.value = '';
      el.imgPreview.innerHTML = HERO_HINT; el.imgRemove.style.display = 'none';
    });
  }

  async function uploadToStorage(file, prefix) {
    if (!file) return '';
    if (!ALLOWED_IMG[file.type]) throw new Error('Unsupported image type (use JPG, PNG, WebP or GIF)');
    if (file.size > 5 * 1024 * 1024) throw new Error('Image too large (max 5 MB)');
    var path = 'articles/' + (prefix || 'img_') + Date.now() + '_' + Math.random().toString(36).substring(2, 9) + '.' + ALLOWED_IMG[file.type];
    var res = await supabaseClient.storage.from('article-images').upload(path, file);
    if (res.error) throw new Error('Upload failed: ' + res.error.message);
    var u = supabaseClient.storage.from('article-images').getPublicUrl(path);
    return (u.data && u.data.publicUrl) || '';
  }

  /* ---------- Slug + validation + live counters ---------- */
  if (el.slug && el.title) {
    el.slug.addEventListener('input', function () { slugEdited = true; });
    el.title.addEventListener('input', function () { if (!slugEdited) el.slug.value = C.slugify(el.title.value); });
  }

  function problems() {
    var list = [], content = compose(), wc = words(content);
    SECTIONS.forEach(function (s) { if (s.required && !val(s.el)) list.push('Section "' + s.head + '" is empty'); });
    if (!val(el.title)) list.push('Title is empty');
    if (val(el.title).length > 70) list.push('Title is ' + val(el.title).length + ' characters (keep it under 70)');
    if (!val(el.category)) list.push('Choose a category');
    if (!val(el.author)) list.push('Enter the author name');
    if (!val(el.excerpt)) list.push('Excerpt is empty');
    if (val(el.excerpt).length > MAX_EXCERPT) list.push('Excerpt is ' + val(el.excerpt).length + '/' + MAX_EXCERPT + ' characters');
    var slug = val(el.slug) || C.slugify(val(el.title));
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) list.push('Slug may only contain lowercase letters, numbers and hyphens');
    if (wc < MIN_WORDS) list.push('Article has ' + wc + ' words (minimum ' + MIN_WORDS + ')');
    var steps = val(SECTIONS[3].el);
    if (steps && (steps.match(/^\s*(\d+[.)]|###)\s+/gm) || []).length < 3) list.push('Step-by-Step Solution needs at least 3 numbered steps (1. 2. 3.) or ### sub-headings');
    diagrams.forEach(function (d, i) { if (!(d.alt || '').trim()) list.push('Image ' + (i + 1) + ' needs alt text'); });
    if (NON_ENGLISH.test(content + ' ' + val(el.title) + ' ' + val(el.excerpt))) list.push('Write everything in English (non-English characters found)');
    if (!el.original || !el.original.checked) list.push('Tick the originality confirmation');
    return list;
  }

  function updateMeta() {
    var content = compose(), wc = words(content);
    if (el.wordCount) {
      el.wordCount.textContent = wc + ' / ' + MIN_WORDS + ' words minimum';
      el.wordCount.style.color = wc >= MIN_WORDS ? '#16a34a' : '#dc2626';
    }
    if (el.excerptCount) {
      var n = val(el.excerpt).length;
      el.excerptCount.textContent = n + ' / ' + MAX_EXCERPT;
      el.excerptCount.style.color = n <= MAX_EXCERPT ? '#16a34a' : '#dc2626';
    }
    if (el.readTime && !el.readTime.dataset.touched) el.readTime.value = readTimeOf(content);
    if (el.checklist) {
      var p = problems();
      el.checklist.innerHTML = p.length
        ? '<strong>Before you can publish:</strong><ul>' + p.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'
        : '<strong style="color:#16a34a">✓ Ready to publish</strong>';
    }
  }
  if (form) {
    form.addEventListener('input', function (e) { if (e.target === el.readTime) el.readTime.dataset.touched = '1'; updateMeta(); });
    form.addEventListener('change', updateMeta);
  }

  /* ---------- Save ---------- */
  async function saveArticle(run, payload) {
    var p = Object.assign({}, payload);
    for (var attempt = 0; attempt < 8; attempt++) {
      var res = await run(p);
      if (!res.error) return res;
      var m = /find the ['"]([A-Za-z0-9_]+)['"] column/i.exec(res.error.message || '');
      if (!m || !(m[1] in p) || m[1] === 'title' || m[1] === 'content') throw res.error;
      delete p[m[1]];                       // optional column missing in the DB: save without it
    }
    throw new Error('Could not save: run database/fix_missing_columns.sql');
  }
  function showNote(html) { if (el.note) { el.note.innerHTML = html; el.note.style.display = 'block'; } }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var id = el.id.value ? Number(el.id.value) : undefined;
      var legacyOnly = !compose() && !!val(el.legacy);
      var list = problems();
      if (legacyOnly) {   // old free-form article: allow small edits without migrating
        list = list.filter(function (x) { return !/^Section |^Step-by-Step|^Article has/.test(x); });
        if (words(val(el.legacy)) < MIN_WORDS && !confirm('This legacy article has fewer than ' + MIN_WORDS + ' words and will stay unlisted. Save anyway?')) return;
      }
      if (list.length) { C.showToast('⚠️ ' + list[0]); updateMeta(); return; }
      if (!legacyOnly && val(el.legacy) && !confirm('The old free-form text will be replaced by the structured sections. Continue?')) return;

      var content = legacyOnly ? val(el.legacy) : compose();
      var title = val(el.title), excerpt = val(el.excerpt);
      var slug = val(el.slug) || C.slugify(title);
      var tags = val(el.tags).split(',').map(function (t) { return t.trim(); }).filter(Boolean);

      try {
        var imageUrl = currentImageData && currentImageData.indexOf('http') === 0 ? currentImageData : '';
        if (currentImageFile) { C.showToast('⏳ Uploading image...'); imageUrl = await uploadToStorage(currentImageFile, 'hero_'); }
        var payload = {
          title: title, excerpt: excerpt, content: content, category: val(el.category),
          author: val(el.author), date: el.date.value || today(),
          readtime: val(el.readTime) || readTimeOf(content), tags: tags,
          featured: !!el.featured.checked, image: imageUrl || '', slug: slug,
          // English only: drop any machine translations so they cannot go out of sync
          title_i18n: { en: title }, excerpt_i18n: { en: excerpt }, content_i18n: { en: content },
          translation_status: 'done', translation_langs: ['en']
        };
        if (id) {
          await saveArticle(function (p) { return supabaseClient.from('articles').update(p).eq('id', id); }, payload);
          C.showToast('✨ Article updated');
        } else {
          payload.likes = 0;
          await saveArticle(function (p) { return supabaseClient.from('articles').insert([p]).select('id'); }, payload);
          C.showToast('🚀 Article saved');
        }
        resetForm();
        showNote('<strong>Saved to the database.</strong> It is <u>not live yet</u>. To publish the static page: ' +
          'GitHub → <em>Actions</em> → <em>Rebuild Static Pages (manual)</em> → <em>Run workflow</em> ' +
          '(or run <code>node scripts/generate-seo.mjs</code> locally and push).');
        await loadArticles(); renderAdminList();
      } catch (err) {
        console.error('[TP] save error', err);
        C.showToast('❌ Error: ' + (err.message || err));
      }
    });
  }

  /* ---------- Load / list / edit / delete / reset ---------- */
  async function loadArticles() {
    var res = await supabaseClient.from('articles').select('*').order('id', { ascending: false }).limit(300);
    if (res.error) { console.error('[TP] loadArticles', res.error); articlesCache = []; C.showToast('Failed to load articles'); }
    else articlesCache = res.data || [];
    return articlesCache;
  }

  function renderAdminList() {
    var arts = articlesCache.slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    var info = arts.map(function (a) { return { a: a, wc: words(a.content), fmt: /^##\s+The Problem/m.test(a.content || '') }; });
    var stats = $('#adminStats');
    if (stats) {
      var ready = info.filter(function (x) { return x.wc >= MIN_WORDS; }).length;
      stats.innerHTML =
        '<div class="stat"><div class="stat-label">Total Articles</div><div class="stat-value">' + arts.length + '</div></div>' +
        '<div class="stat"><div class="stat-label">Indexable (' + MIN_WORDS + '+ words)</div><div class="stat-value" style="color:#16a34a">' + ready + '</div></div>' +
        '<div class="stat"><div class="stat-label">Thin / unlisted</div><div class="stat-value" style="color:#dc2626">' + (arts.length - ready) + '</div></div>' +
        '<div class="stat"><div class="stat-label">Featured</div><div class="stat-value">' + arts.filter(function (a) { return a.featured; }).length + '</div></div>';
    }
    if (!arts.length) { el.list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">No articles yet.</p>'; return; }
    el.list.innerHTML = info.map(function (x) {
      var ok = x.wc >= MIN_WORDS;
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);gap:12px">' +
        '<div style="flex:1;min-width:0"><h4 style="margin:0 0 4px;font-size:0.95rem;word-break:break-word">' + esc(x.a.title) + '</h4>' +
        '<small style="color:var(--text-muted)">' + esc(x.a.category || '—') + ' · ' + esc(x.a.date || '') + ' · ' + x.wc + ' words · ' +
        '<span style="color:' + (ok ? '#16a34a' : '#dc2626') + ';font-weight:600">' + (ok ? 'indexable' : 'thin — expand to ' + MIN_WORDS + '+') + '</span>' +
        (x.fmt ? '' : ' · <span style="color:#f59e0b;font-weight:600">legacy format</span>') + '</small></div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0">' +
        '<button type="button" data-edit="' + esc(x.a.id) + '" style="background:#0284c7;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:0.8rem">Edit</button>' +
        '<button type="button" data-delete="' + esc(x.a.id) + '" style="background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:0.8rem">Delete</button>' +
        '</div></div>';
    }).join('');
  }

  if (el.list) el.list.addEventListener('click', function (e) {
    var ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-delete]');
    if (ed) editArticle(ed.dataset.edit);
    if (del) deleteArticle(del.dataset.delete);
  });

  function editArticle(id) {
    var art = articlesCache.filter(function (a) { return String(a.id) === String(id); })[0];
    if (!art) return;
    resetForm();
    var p = parseContent(art.content);
    el.id.value = art.id; el.title.value = art.title || ''; el.excerpt.value = art.excerpt || '';
    el.slug.value = art.slug || ''; slugEdited = true;
    el.category.value = art.category || ''; el.author.value = art.author || '';
    el.date.value = art.date || today();
    el.readTime.value = art.readtime || ''; if (art.readtime) el.readTime.dataset.touched = '1';
    el.tags.value = Array.isArray(art.tags) ? art.tags.join(', ') : (art.tags || '');
    el.featured.checked = !!art.featured;
    SECTIONS.forEach(function (s) { if (s.el) s.el.value = p[s.key] || ''; });
    el.extra.value = p.extra; el.legacy.value = p.legacy; diagrams = p.diagrams.slice();
    if (el.legacyBox) el.legacyBox.style.display = p.legacy ? 'block' : 'none';
    renderDiagrams();
    currentImageData = art.image || ''; currentImageFile = null;
    if (currentImageData) {
      el.imgPreview.innerHTML = '<img src="' + esc(currentImageData) + '" alt="Preview" style="width:150px;height:100px;object-fit:cover;border-radius:4px">';
      el.imgRemove.style.display = 'inline-block';
    }
    el.formTitle.textContent = p.legacy ? 'Edit Article (legacy format: move the text into the sections)' : 'Edit Article';
    el.reset.style.display = 'inline-block';
    updateMeta();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteArticle(id) {
    if (!confirm('Delete this article permanently?')) return;
    var res = await supabaseClient.from('articles').delete().eq('id', id);
    if (res.error) { C.showToast('❌ ' + res.error.message); return; }
    await loadArticles(); renderAdminList(); C.showToast('🗑 Article deleted');
  }

  function resetForm() {
    form.reset();
    el.id.value = ''; slugEdited = false; currentImageData = ''; currentImageFile = null; diagrams = [];
    if (el.readTime) delete el.readTime.dataset.touched;
    el.imgPreview.innerHTML = HERO_HINT; el.imgRemove.style.display = 'none';
    if (el.legacyBox) el.legacyBox.style.display = 'none';
    if (el.legacy) el.legacy.value = '';
    el.formTitle.textContent = 'Add New Article'; el.reset.style.display = 'none';
    if (el.date) el.date.value = today();
    renderDiagrams(); updateMeta();
  }
  if (el.reset) el.reset.addEventListener('click', function () { resetForm(); if (el.note) el.note.style.display = 'none'; });

  /* ---------- Init ---------- */
  if (el.date) el.date.value = today();
  renderDiagrams();
  updateMeta();
  loadArticles().then(renderAdminList);

  window.TPAdmin = {
    compose: compose, parseContent: parseContent,
    setFeaturedImage: function (u) { currentImageData = u || ''; currentImageFile = null; },
    getFeaturedImage: function () { return currentImageData; }
  };
})();
