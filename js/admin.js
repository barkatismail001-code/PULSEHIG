/* ==========================================================================
   TechPulse — Admin Controller (admin.js) v20261005
   Handles: article CRUD, image upload to Supabase Storage, Groq AI generation
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
    var ext = file.name.split('.').pop().toLowerCase();
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
          title_i18n: { en: title },
          excerpt_i18n: { en: excerpt },
          content_i18n: { en: content },
          translation_status: 'pending',
          translation_langs: ['en']
        };

        if (id) {
          var upd = await supabaseClient.from('articles').update(payload).eq('id', id);
          if (upd.error) throw upd.error;
          C.showToast('✨ Article updated successfully');
        } else {
          var ins = await supabaseClient.from('articles').insert([payload]);
          if (ins.error) throw ins.error;
          C.showToast('🚀 Article published successfully');
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
      var statusColor = status === 'completed' ? '#16a34a' : status === 'in_progress' ? '#f59e0b' : '#64748b';
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
     Groq AI Generation
     ============================================ */
  var GROQ_MODEL = 'qwen/qwen3.8-27b';
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

  async function callGroq(apiKey, messages, maxTokens) {
    var res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        max_tokens: maxTokens || 8000,
        temperature: 0.5,
        stream: false
      })
    });
    var d = await res.json();
    if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
    var txt = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    if (!txt) throw new Error('Empty response from Groq');
    return String(txt).replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  /* AI generate button */
  var generateBtn = $('#ai-generate-btn');
  var aiStatus = $('#ai-status');
  var aiKeyInput = $('#ai-api-key');
  var aiTitleInput = $('#ai-custom-title');
  var aiImagesInput = $('#ai-images-input');
  var aiCategorySelect = $('#ai-category');
  var aiThumbs = $('#aiImageThumbs');

  if (aiKeyInput) {
    var savedKey = localStorage.getItem('tp_groq_key');
    if (savedKey) aiKeyInput.value = savedKey;
  }

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

      if (!apiKey) { C.showToast('Please enter your Groq API Key'); return; }
      if (!customTitle) { C.showToast('Please enter an article title'); return; }
      if (!aiImageFiles || aiImageFiles.length < 1) { C.showToast('Please select at least 1 image'); return; }

      localStorage.setItem('tp_groq_key', apiKey);
      generateBtn.disabled = true;

      try {
        aiStatus.style.color = '#38bdf8';
        aiStatus.innerText = '⏳ Compressing images...';
        var imageDataUrls = await Promise.all(aiImageFiles.map(function (f) { return compressImage(f); }));

        aiStatus.innerText = '⏳ Analyzing images and writing article (this may take 30–60 seconds)...';

        var prompt = 'You are a senior technical writer for TechPulse, an engineering platform about ESP32/Arduino, embedded systems, and home repair.\n\n' +
          'Write a long, deep, professional technical article titled: "' + customTitle + '"\n\n' +
          'Analyze the provided ' + aiImageFiles.length + ' image(s) carefully and use what you see to inform the article.\n\n' +
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

        var contentParts = imageDataUrls.map(function (url) {
          return { type: 'image_url', image_url: { url: url } };
        });
        contentParts.push({ type: 'text', text: prompt });

        var rawText = await callGroq(apiKey, [{ role: 'user', content: contentParts }], 9000);
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
          var extra = await callGroq(apiKey, [{
            role: 'user',
            content: 'Article titled "' + parsed.title + '":\n\n' + parsed.content + '\n\nWrite ' + need + ' to ' + (need + 200) + ' words of NEW material as 1-2 additional sections. Each section starts with "## Heading". Do not repeat existing content. Output only the new sections as plain markdown.'
          }], 5000);

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