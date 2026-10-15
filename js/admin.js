/*
 * ADMIN PANEL — NOT FOR PUBLIC INDEXING
 * X-Robots-Tag: noindex, nofollow
 * This file is protected via robots.txt and admin.html noindex meta.
 */
/* ==========================================================================
   TechPulse — Admin Controller (admin.js) v20261005
   Handles: article CRUD, image upload to Supabase Storage, Gemini AI generation
   from 3 images + title, translation queue trigger.
   Requires js/common.js and js/i18n.js
   ========================================================================== */
(function () {
  'use strict';

  var C = window.TPCommon;
  if (!C) {
    console.warn('[TP] admin.js requires common.js');
    return;
  }

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  var SUPABASE_URL = C.SUPABASE_URL;
  var SUPABASE_ANON_KEY = C.SUPABASE_ANON_KEY;
  var supabaseClient = window.adminSb || (window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  if (!supabaseClient) {
    console.warn('[TP] Admin: no supabase client');
    return;
  }

  // ---- Gemini API Key: save to localStorage so it persists ----
  var GEMINI_KEY_STORAGE = 'tp_gemini_key';
  function loadGeminiKey() {
    try { return localStorage.getItem(GEMINI_KEY_STORAGE) || ''; } catch (e) { return ''; }
  }
  function saveGeminiKey(val) {
    try {
      if (val && val.trim()) localStorage.setItem(GEMINI_KEY_STORAGE, val.trim());
      else localStorage.removeItem(GEMINI_KEY_STORAGE);
    } catch (e) {}
  }
  var articlesCache = [];
  var currentImageData = '';
  var currentImageFile = null;
  var aiImageFiles = [];

  /* ============================================
     Load Articles
     ============================================ */
  async function loadArticles() {
    var res = await supabaseClient.from('articles').select('*').order('id', { ascending: false }).limit(200);
    if (res.error) {
      console.error('[TP] loadArticles error', res.error);
      articlesCache = [];
      C.showToast('Failed to load articles');
    } else {
      articlesCache = res.data || [];
    }
    return articlesCache;
  }

  function getArticles() { return articlesCache; }

  /* ============================================
     UI Elements
     ============================================ */
  var form = $('#article-form');
  var articleIdInput = $('#article-id');
  var titleInput = $('#title');
  var slugInput = $('#slug');
  var excerptInput = $('#excerpt');
  var contentInput = $('#content');
  var categoryInput = $('#category');
  var authorInput = $('#author');
  var dateInput = $('#date');
  var readTimeInput = $('#readTime');
  var tagsInput = $('#tags');
  var featuredInput = $('#featured');
  var imageInput = $('#image-file');
  var imagePreview = $('#image-preview');
  var removeImageBtn = $('#remove-image');
  var formTitle = $('#form-title');
  var resetBtn = $('#reset-btn');
  var listContainer = $('#admin-articles-list');

  /* ============================================
     Hero image upload
     ============================================ */
  if (imagePreview && imageInput) {
    imagePreview.addEventListener('click', function () { imageInput.click(); });

    imageInput.addEventListener('change', function () {
      var file = imageInput.files[0];
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) {
        C.showToast('Image too large (max 3 MB)');
        imageInput.value = '';
        return;
      }
      currentImageFile = file;
      var reader = new FileReader();
      reader.onload = function (ev) {
        currentImageData = ev.target.result;
        imagePreview.innerHTML = '<img src="' + currentImageData + '" alt="Preview" style="width:150px;height:100px;object-fit:cover;border-radius:4px">';
        if (removeImageBtn) removeImageBtn.style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      currentImageData = '';
      currentImageFile = null;
      if (imageInput) imageInput.value = '';
      imagePreview.innerHTML = '<span class="image-hint">Click to upload an image (max 3 MB)</span>';
      removeImageBtn.style.display = 'none';
    });
  }

  /* ============================================
     Slug generation
     ============================================ */
  var slugEdited = false;
  if (slugInput && titleInput) {
    slugInput.addEventListener('input', function () { slugEdited = true; });
    titleInput.addEventListener('input', function () {
      if (!slugEdited) slugInput.value = C.slugify(titleInput.value);
    });
  }

  /* ============================================
     Upload image to Supabase Storage
     ============================================ */
  async function uploadToStorage(file, prefix) {
    if (!file) return '';
    var ALLOWED = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    if (!ALLOWED[file.type]) throw new Error('Unsupported image type (use JPG, PNG, WebP or GIF)');
    if (file.size > 5 * 1024 * 1024) throw new Error('Image too large (max 5 MB)');
    var ext = ALLOWED[file.type];
    var fileName = (prefix || 'img_') + Date.now() + '_' + Math.random().toString(36).substring(2, 9) + '.' + ext;
    var filePath = 'articles/' + fileName;

    var res = await supabaseClient.storage.from('article-images').upload(filePath, file);
    if (res.error) {
      console.warn('[TP] upload error', res.error);
      throw new Error('Upload failed: ' + res.error.message);
    }
    var urlRes = supabaseClient.storage.from('article-images').getPublicUrl(filePath);
    return (urlRes.data && urlRes.data.publicUrl) || '';
  }

  /* ============================================
     Save article
     ============================================ */
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var id = articleIdInput.value ? Number(articleIdInput.value) : undefined;
      var title = titleInput.value.trim();
      var excerpt = excerptInput.value.trim();
      var content = contentInput.value.trim();
      var category = categoryInput.value;
      var author = authorInput.value.trim() || 'TechPulse Team';
      var date = dateInput.value || new Date().toISOString().slice(0, 10);
      var readTime = readTimeInput.value.trim() || calcReadTime(content);
      var tags = tagsInput.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
      var featured = featuredInput.checked;
      var slug = slugInput.value.trim() || C.slugify(title);

      if (!title || !excerpt || !content || !category) {
        C.showToast('⚠️ Please fill all required fields');
        return;
      }

      try {
        var imageUrl = currentImageData && currentImageData.indexOf('http') === 0 ? currentImageData : '';

        if (currentImageFile) {
          C.showToast('⏳ Uploading image...');
          imageUrl = await uploadToStorage(currentImageFile, 'hero_');
        }

        var existing = id ? articlesCache.find(function (a) { return String(a.id) === String(id); }) : null;
        function mergeI18n(oldObj, enVal, oldEn) {
          if (oldEn !== undefined && oldEn !== enVal) return { en: enVal };
          var out = Object.assign({}, oldObj || {});
          out.en = enVal;
          return out;
        }
        var titleI18n   = mergeI18n(existing && existing.title_i18n,   title,   existing && existing.title);
        var excerptI18n = mergeI18n(existing && existing.excerpt_i18n, excerpt, existing && existing.excerpt);
        var contentI18n = mergeI18n(existing && existing.content_i18n, content, existing && existing.content);
        var keptLangs = ['en'].concat(['fr','es','zh','hi','pt'].filter(function (l) {
          return titleI18n[l] && excerptI18n[l] && contentI18n[l];
        }));

        // SEO pre-publish validation
        var seoWc = content.split(/\s+/).filter(Boolean).length;
        var seoFails = [];
        if (seoWc < 800) seoFails.push('Content is ' + seoWc + ' words (min 800)');
        if (title.length > 60) seoFails.push('Title is ' + title.length + '/60 chars');
        if (excerpt.length > 155) seoFails.push('Excerpt is ' + excerpt.length + '/155 chars');
        if (!slug || !/^[a-z0-9-]+$/.test(slug)) seoFails.push('Invalid slug (lowercase/numbers/hyphens)');
        if (seoFails.length > 0) {
          var seoMsg = 'SEO warnings:' + String.fromCharCode(10) + String.fromCharCode(10) + seoFails.join(String.fromCharCode(10)) + String.fromCharCode(10) + String.fromCharCode(10) + 'Publish anyway?';
          if (!confirm(seoMsg)) return;
        }

        var payload = {
          title: title,
          excerpt: excerpt,
          content: content,
          category: category,
          author: author,
          date: date,
          readtime: readTime,
          tags: tags,
          featured: featured,
          image: imageUrl || '',
          likes: 0,
          slug: slug,
          title_i18n: titleI18n,
          excerpt_i18n: excerptI18n,
          content_i18n: contentI18n,
          translation_status: keptLangs.length === 6 ? 'done' : 'pending',
          translation_langs: keptLangs
        };

        if (id) {
          await saveArticle(function (p) { return supabaseClient.from('articles').update(p).eq('id', id); }, payload);
          C.showToast('✨ Article updated successfully');
          startTranslation(id, { title: title, excerpt: excerpt, content: content });
        } else {
          var insRes = await saveArticle(function (p) { return supabaseClient.from('articles').insert([p]).select('id'); }, payload);
          C.showToast('🚀 Article published successfully');
          var newId = insRes && insRes.data && insRes.data[0] && insRes.data[0].id;
          startTranslation(newId, { title: title, excerpt: excerpt, content: content });
        }

        resetForm();
        await loadArticles();
        renderAdminList();
      } catch (err) {
        console.error('[TP] save error', err);
        C.showToast('❌ Error: ' + err.message);
      }
    });
  }

  /* Save with automatic fallback: if Supabase says a column does not exist in the
     table (e.g. "readtime"), drop that field from the payload and retry, so a missing
     optional column never blocks publishing. Run database/fix_missing_columns.sql to add them. */
  async function saveArticle(run, payload) {
    var p = Object.assign({}, payload);
    for (var attempt = 0; attempt < 8; attempt++) {
      var res = await run(p);
      if (!res.error) return res;
      var m = /find the ['"]([A-Za-z0-9_]+)['"] column/i.exec(res.error.message || '');
      if (!m || !(m[1] in p) || m[1] === 'title' || m[1] === 'content') throw res.error;
      console.warn('[TP] column missing in DB, saving without it:', m[1]);
      delete p[m[1]];
    }
    throw new Error('Could not save: too many missing columns - run database/fix_missing_columns.sql');
  }

  /* ============================================
     Instant translation (Gemini, straight from this page)
     The article is already saved in Supabase. Right after saving, each missing language
     (fr, es, zh, hi, pt) is translated and written back to the same row, so readers get
     it immediately. If Gemini is busy, the page retries every 5 minutes while it stays open.
     The server (GitHub Actions) also translates anything still "pending" every day at 03:00 UTC (or when you run it manually).
     ============================================ */
  var TR_LANGS = [
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'zh', name: 'Simplified Chinese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'pt', name: 'Portuguese' }
  ];
  var TR_RETRY_MS = 5 * 60 * 1000;
  var TR_MAX_PASSES = 12;           // about one hour of page-side retries
  var trTimers = {};

  function trSay(msg) {
    var el = document.getElementById('translate-status');
    if (el) el.textContent = msg;
  }
  function trSleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function trParse(raw) {
    var t = String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    return JSON.parse(t);
  }

  async function translateFields(apiKey, lang, src) {
    var prompt = 'Translate these article fields from English to ' + lang.name + '.\n' +
      'Rules: keep every HTML tag and attribute exactly as written; do NOT translate code inside <pre> or <code>, ' +
      'URLs, file names, or part/product names; keep the same structure. ' +
      'Return ONLY valid JSON: {"title":"...","excerpt":"...","content":"..."}\n\n' +
      JSON.stringify({ title: src.title, excerpt: src.excerpt, content: src.content });
    var o = trParse(await callGemini(apiKey, [{ text: prompt }], 24000, true));
    if (!o || !o.title || !o.excerpt || !o.content) throw new Error('Incomplete translation');
    return o;
  }

  function trPending(state) {
    return TR_LANGS.filter(function (l) { return !(state.ti[l.code] && state.ei[l.code] && state.ci[l.code]); });
  }

  async function trSave(id, state) {
    var left = trPending(state).length;
    var done = TR_LANGS.filter(function (l) { return state.ti[l.code] && state.ei[l.code] && state.ci[l.code]; })
      .map(function (l) { return l.code; });
    var payload = {
      title_i18n: state.ti, excerpt_i18n: state.ei, content_i18n: state.ci,
      translation_langs: ['en'].concat(done),
      translation_status: left === 0 ? 'done' : 'pending'
    };
    await saveArticle(function (p) { return supabaseClient.from('articles').update(p).eq('id', id); }, payload);
  }

  async function runTranslation(id, src, apiKey, state, pass) {
    var todo = trPending(state);
    var fatal = false;
    for (var i = 0; i < todo.length && !fatal; i++) {
      var lang = todo[i];
      trSay('⏳ Translating article #' + id + ' → ' + lang.name + ' (' + (TR_LANGS.length - todo.length + i + 1) + '/' + TR_LANGS.length + ')…');
      try {
        var o = await translateFields(apiKey, lang, src);
        state.ti[lang.code] = o.title;
        state.ei[lang.code] = o.excerpt;
        state.ci[lang.code] = o.content;
        await trSave(id, state);
      } catch (e) {
        console.warn('[TP] translation failed for', lang.code, e);
        // A bad key / no permission will not fix itself: stop and let the server handle it.
        if (/API key|permission|PERMISSION_DENIED|not valid|unauthenticated/i.test(e.message || '')) fatal = true;
      }
      await trSleep(1500);
    }

    var left = trPending(state).length;
    if (left === 0) {
      trSay('✅ Article #' + id + ' translated into all 5 languages and saved.');
      C.showToast('🌍 Translations saved');
      return;
    }
    if (fatal) {
      trSay('⚠️ Gemini rejected the request (check the API key). The server will translate this article automatically daily at 03:00 UTC.');
      return;
    }
    if (pass >= TR_MAX_PASSES) {
      trSay('⚠️ ' + left + ' language(s) still missing. The server will finish them automatically (daily at 03:00 UTC, or run "Translate Articles (Auto)" manually).');
      return;
    }
    trSay('⏳ Gemini is busy: ' + left + ' language(s) left. Retrying in 5 minutes (keep this page open; the server also translates daily).');
    trTimers[id] = setTimeout(function () { runTranslation(id, src, apiKey, state, pass + 1); }, TR_RETRY_MS);
  }

  function startTranslation(id, src) {
    if (!id) return;
    var keyEl = document.getElementById('ai-api-key');
    var apiKey = keyEl ? keyEl.value.trim() : '';
    clearTimeout(trTimers[id]);
    if (!apiKey) {
      trSay('ℹ️ Saved. No Gemini key entered here, so the server will translate this article automatically daily at 03:00 UTC.');
      return;
    }
    var state = { ti: { en: src.title }, ei: { en: src.excerpt }, ci: { en: src.content } };
    runTranslation(id, src, apiKey, state, 1);   // runs in the background
  }

  function calcReadTime(text) {
    var words = String(text || '').trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200)) + ' min read';
  }

  /* ============================================
     Edit + Delete
     ============================================ */
  if (listContainer) {
    listContainer.addEventListener('click', function (e) {
      var editBtn = e.target.closest('[data-edit]');
      var delBtn = e.target.closest('[data-delete]');
      if (editBtn) editArticle(editBtn.dataset.edit);
      if (delBtn) deleteArticle(delBtn.dataset.delete);
    });
  }

  function editArticle(id) {
    var art = getArticles().find(function (a) { return String(a.id) === String(id); });
    if (!art) return;

    articleIdInput.value = art.id;
    titleInput.value = art.title || '';
    excerptInput.value = art.excerpt || '';
    contentInput.value = art.content || '';
    slugInput.value = art.slug || '';
    slugEdited = true;
    categoryInput.value = art.category || '';
    authorInput.value = art.author || '';
    dateInput.value = art.date || '';
    readTimeInput.value = art.readtime || '';
    tagsInput.value = Array.isArray(art.tags) ? art.tags.join(', ') : (art.tags || '');
    featuredInput.checked = !!art.featured;

    currentImageData = art.image || '';
    currentImageFile = null;
    if (currentImageData) {
      imagePreview.innerHTML = '<img src="' + currentImageData + '" alt="Preview" style="width:150px;height:100px;object-fit:cover;border-radius:4px">';
      if (removeImageBtn) removeImageBtn.style.display = 'inline-block';
    } else {
      imagePreview.innerHTML = '<span class="image-hint">Click to upload an image (max 3 MB)</span>';
      if (removeImageBtn) removeImageBtn.style.display = 'none';
    }

    formTitle.textContent = 'Edit Article';
    resetBtn.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteArticle(id) {
    if (!confirm('Delete this article permanently?')) return;
    var res = await supabaseClient.from('articles').delete().eq('id', id);
    if (res.error) {
      C.showToast('❌ ' + res.error.message);
      return;
    }
    await loadArticles();
    renderAdminList();
    C.showToast('🗑 Article deleted');
  }

  function resetForm() {
    form.reset();
    articleIdInput.value = '';
    slugEdited = false;
    currentImageData = '';
    currentImageFile = null;
    imagePreview.innerHTML = '<span class="image-hint">Click to upload an image (max 3 MB)</span>';
    if (removeImageBtn) removeImageBtn.style.display = 'none';
    formTitle.textContent = 'Add New Article';
    resetBtn.style.display = 'none';
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  // Auto-load Gemini API key from localStorage
  var _aiKeyEl = document.getElementById('ai-api-key');
  if (_aiKeyEl) {
    var saved = loadGeminiKey();
    if (saved && !_aiKeyEl.value) _aiKeyEl.value = saved;
    // Save on change
    _aiKeyEl.addEventListener('change', function () { saveGeminiKey(this.value); });
    _aiKeyEl.addEventListener('blur', function () { saveGeminiKey(this.value); });
  }
  }

  if (resetBtn) resetBtn.addEventListener('click', resetForm);

  /* ============================================
     Render admin list
     ============================================ */
  function renderAdminList() {
    var articles = getArticles().slice().sort(function (a, b) {
      return (b.date || '').localeCompare(a.date || '');
    });

    var stats = $('#adminStats');
    if (stats) {
      var cats = {};
      articles.forEach(function (a) { if (a.category) cats[a.category] = 1; });
      var featured = articles.filter(function (a) { return a.featured; }).length;
      var pending = articles.filter(function (a) { return a.translation_status === 'pending'; }).length;
      stats.innerHTML =
        '<div class="stat"><div class="stat-label">Total Articles</div><div class="stat-value">' + articles.length + '</div></div>' +
        '<div class="stat"><div class="stat-label">Categories</div><div class="stat-value">' + Object.keys(cats).length + '</div></div>' +
        '<div class="stat"><div class="stat-label">Featured</div><div class="stat-value">' + featured + '</div></div>' +
        '<div class="stat"><div class="stat-label">Pending Translation</div><div class="stat-value" style="color:#f59e0b">' + pending + '</div></div>';
    }

    if (!articles.length) {
      listContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">No articles yet.</p>';
      return;
    }

    listContainer.innerHTML = articles.map(function (art) {
      var status = art.translation_status || 'pending';
      var statusColor = (status === 'done' || status === 'completed') ? '#16a34a' : status === 'in_progress' ? '#f59e0b' : '#64748b';
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);gap:12px">' +
        '<div style="flex:1;min-width:0">' +
          '<h4 style="margin:0 0 4px;font-size:0.95rem;color:var(--text);word-break:break-word">' + C.esc(art.title) + '</h4>' +
          '<p style="margin:0 0 6px;font-size:0.83rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + C.esc(art.excerpt || '') + '</p>' +
          '<small style="color:var(--text-muted);font-size:0.75rem">' + C.esc(art.category || '—') + ' · ' + C.esc(art.date || '') + ' · <span style="color:' + statusColor + ';font-weight:600">' + status + '</span></small>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0">' +
          '<button type="button" data-edit="' + art.id + '" style="background:#0284c7;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:0.8rem">Edit</button>' +
          '<button type="button" data-delete="' + art.id + '" style="background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:0.8rem">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /* ============================================
     Gemini AI Generation
     ============================================ */
  var GEMINI_MODEL = 'gemini-flash-latest';
  var MIN_WORDS = 1800;
  var MAX_WORDS = 2800;

  function compressImage(file, maxWidth, quality) {
    maxWidth = maxWidth || 1200;
    quality = quality || 0.85;
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          try {
            var canvas = document.createElement('canvas');
            var scale = Math.min(1, maxWidth / img.width);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (err) { reject(err); }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function tpWords(t) { return String(t || '').split(/\s+/).filter(Boolean).length; }

  /* Convert a data: URL (from compressImage) to a Gemini inlineData part */
  function dataUrlToPart(dataUrl) {
    var m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
    if (!m) return null;
    return { inlineData: { mimeType: m[1], data: m[2] } };
  }

  /* Call Gemini (generateContent). `parts` = array of {text} / {inlineData} parts. */
  async function callGemini(apiKey, parts, maxTokens, wantJson) {
    var cfg = { temperature: 0.75, maxOutputTokens: maxTokens || 8192 };
    if (wantJson) cfg.responseMimeType = 'application/json';
    var res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: parts }],
        generationConfig: cfg
      })
    });
    var d = await res.json();
    if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
    if (d.promptFeedback && d.promptFeedback.blockReason) {
      throw new Error('Gemini blocked the request: ' + d.promptFeedback.blockReason);
    }
    var cand = d.candidates && d.candidates[0];
    var txt = cand && cand.content && cand.content.parts
      ? cand.content.parts.map(function (p) { return p.text || ''; }).join('')
      : '';
    if (!txt) throw new Error('Empty response from Gemini' + (cand && cand.finishReason ? ' (' + cand.finishReason + ')' : ''));
    return String(txt).trim();
  }

  /* AI generate button */
  var generateBtn = $('#ai-generate-btn');
  var aiStatus = $('#ai-status');
  var aiKeyInput = $('#ai-api-key');
  var aiTitleInput = $('#ai-custom-title');
  var aiImagesInput = $('#ai-images-input');
  var aiCategorySelect = $('#ai-category');
  var aiThumbs = $('#aiImageThumbs');

  if (aiImagesInput) {
    aiImagesInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(aiImagesInput.files);
      if (files.length > 3) {
        C.showToast('Maximum 3 images');
        aiImagesInput.value = '';
        aiThumbs.innerHTML = '';
        return;
      }
      aiImageFiles = files;
      aiThumbs.innerHTML = '';
      files.forEach(function (f) {
        var reader = new FileReader();
        reader.onload = function (ev) {
          var img = document.createElement('img');
          img.src = ev.target.result;
          img.className = 'image-thumb';
          aiThumbs.appendChild(img);
        };
        reader.readAsDataURL(f);
      });
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', async function () {
      var apiKey = aiKeyInput.value.trim();
      var customTitle = aiTitleInput ? aiTitleInput.value.trim() : '';
      var category = aiCategorySelect ? aiCategorySelect.value : 'Technology';

      if (!apiKey) { C.showToast('Please enter your Gemini API Key'); return; }
      if (!customTitle) { C.showToast('Please enter an article title'); return; }
      if (!aiImageFiles || aiImageFiles.length < 1) { C.showToast('Please select at least 1 image'); return; }
      generateBtn.disabled = true;

      try {
        aiStatus.style.color = '#38bdf8';
        aiStatus.innerText = '⏳ Compressing images...';
        var imageDataUrls = await Promise.all(aiImageFiles.map(function (f) { return compressImage(f); }));

        aiStatus.innerText = '⏳ Analyzing images and writing article (this may take 30–60 seconds)...';

        var prompt = 'You are a senior technical writer for TechPulse, an engineering platform about ESP32/Arduino, embedded systems, and home repair.\n\n' +
          'Write a long, deep, professional technical article titled: "' + customTitle + '"\n\n' +
          'Write a detailed engineering tutorial based on real experience. Use concrete component values, units, and step-by-step verification. Use the attached images as real context for what the project looks like.\n\n' +
          'AVOID these AI-typical phrases: delve, navigate the complexities, leverage, seamless, robust solution, game-changer, in today\'s fast-paced world. Never use them.\n\n' +
          'USE specific numbers with units (4.7k ohm, 3.3V, 12.4mA), first-person experience (I tested, we measured), one real failure story (what broke and how you debugged it), and a Sources section with 3-5 verifiable URLs at the end. Include one markdown table of real measurements.\n\n' +
          'STRUCTURE (mandatory):\n' +
          '- Introduction: 120-180 words (no heading)\n' +
          '- Then 6 sections, each starting with "## Heading" and containing 220-300 words\n' +
          '- Then "## Frequently Asked Questions" with 4 entries (each as "### Question?" followed by 50-80 word answer)\n' +
          '- Then "## Conclusion" of 100-140 words\n' +
          'Total: 2000-2500 words. Separate blocks with \\n\\n.\n\n' +
          'Use real component values, units, and how-to-verify steps. No fluff. Never invent statistics or quotes.\n\n' +
          'Return ONLY a raw JSON object (no markdown fences):\n' +
          '{\n' +
          '  "title": "' + customTitle + '",\n' +
          '  "category": "' + category + '",\n' +
          '  "excerpt": "value-driven abstract, 140-155 chars",\n' +
          '  "tags": "embedded-systems, hardware, ESP32, tutorial",\n' +
          '  "content": "the full article in markdown format as described"\n' +
          '}';

        var genParts = imageDataUrls.map(dataUrlToPart).filter(Boolean);
        genParts.push({ text: prompt });
        var rawText = await callGemini(apiKey, genParts, 16000, true);
        var cleanJson = rawText.replace(/```json|```/g, '').trim();
        cleanJson = cleanJson.slice(cleanJson.indexOf('{'), cleanJson.lastIndexOf('}') + 1);

        var parsed = JSON.parse(cleanJson);

        if (!parsed.content || parsed.content.length < 500) {
          throw new Error('Generated content is too short');
        }

        aiStatus.innerText = '⏳ Checking word count...';
        var wc = tpWords(parsed.content);

        if (wc < MIN_WORDS) {
          var need = MIN_WORDS - wc + 150;
          aiStatus.innerText = '⏳ Expanding article (' + wc + ' words → ' + MIN_WORDS + '+)...';
          var extra = await callGemini(apiKey, [{ text: 'Article titled "' + parsed.title + '":\n\n' + parsed.content + '\n\nWrite ' + need + ' to ' + (need + 200) + ' words of NEW material as 1-2 additional sections. Each section starts with "## Heading". Do not repeat existing content. Output only the new sections as plain markdown.' }], 8000, false);

          var faqIndex = parsed.content.search(/\n##\s+(Frequently Asked Questions|Conclusion)/i);
          if (faqIndex > -1) {
            parsed.content = parsed.content.slice(0, faqIndex) + '\n\n' + extra + '\n\n' + parsed.content.slice(faqIndex);
          } else {
            parsed.content += '\n\n' + extra;
          }
          wc = tpWords(parsed.content);
        }

        /* Fill form */
        titleInput.value = parsed.title || customTitle;
        excerptInput.value = parsed.excerpt || '';
        contentInput.value = parsed.content || '';
        tagsInput.value = parsed.tags || '';
        readTimeInput.value = Math.max(1, Math.round(wc / 200)) + ' min read';
        if (!authorInput.value) authorInput.value = 'TechPulse Engineering Team';
        if (!dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
        categoryInput.value = parsed.category || category;

        /* Set hero image + upload to storage */
        aiStatus.innerText = '⏳ Uploading hero image to Supabase Storage...';
        try {
          var heroFile = aiImageFiles[0];
          var heroUrl = await uploadToStorage(heroFile, 'hero_');
          currentImageData = heroUrl;
          currentImageFile = null;
          imagePreview.innerHTML = '<img src="' + heroUrl + '" alt="Preview" style="width:150px;height:100px;object-fit:cover;border-radius:4px">';
          if (removeImageBtn) removeImageBtn.style.display = 'inline-block';
        } catch (uploadErr) {
          console.warn('[TP] hero upload failed', uploadErr);
          currentImageData = imageDataUrls[0];
          currentImageFile = null;
          imagePreview.innerHTML = '<img src="' + currentImageData + '" alt="Preview" style="width:150px;height:100px;object-fit:cover;border-radius:4px">';
        }

        if (titleInput) titleInput.dispatchEvent(new Event('input'));
        slugEdited = false;

        aiStatus.style.color = '#4ade80';
        aiStatus.innerText = '✅ Article generated (' + wc + ' words). Review the form below and click "Save Article to Database".';
      } catch (err) {
        console.error('[TP] AI generation error', err);
        aiStatus.style.color = '#f87171';
        aiStatus.innerText = '❌ Error: ' + err.message;
      } finally {
        generateBtn.disabled = false;
      }
    });
  }

  /* ============================================
     Initial load
     ============================================ */
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
  loadArticles().then(renderAdminList);

  /* ============================================
     Expose helpers (used by external scripts if needed)
     ============================================ */
  window.TPAdmin = {
    setFeaturedImage: function (dataUrl) {
      currentImageData = dataUrl || '';
      currentImageFile = null;
      if (currentImageData) {
        imagePreview.innerHTML = '<img src="' + currentImageData + '" alt="Preview" style="width:150px;height:100px;object-fit:cover;border-radius:4px">';
        if (removeImageBtn) removeImageBtn.style.display = 'inline-block';
      }
    },
    getFeaturedImage: function () { return currentImageData; }
  };
})();