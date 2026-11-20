/* TechPulse admin: sign-in, article editor (images, preview, checklist), article list, facts. */
(function () {
  'use strict';
  var TP = window.TP, R = TP.R, C = TP.C, $ = TP.$;
  var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY);
  var cur = { id: null, published_at: null, wasPublished: false, cover: '' };
  var slugTouched = false, dirty = false, listRows = [], timer;
  var DRAFT_KEY = 'tp_admin_draft';
  var SAFETY_TOPICS = ['Home Repair', 'Smart Tech', 'Auto'];

  function msg(el, type, html) { el.className = 'adm-msg ' + type; el.innerHTML = html; el.hidden = false; }
  function isAdmin(u) {
    if (!u || !u.email) return false;
    return u.email.trim().toLowerCase() === String(C.ADMIN_EMAIL || '').trim().toLowerCase();
  }
  function lines(v) { return String(v || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 30); }
  function opts(list, blank) {
    return (blank ? '<option value="">' + blank + '</option>' : '') + list.map(function (x) { return '<option>' + R.esc(x) + '</option>'; }).join('');
  }
  function fillSubs(selected) {
    var c = R.catBy($('#category').value), subs = c ? c.subs.slice() : [];
    if (selected && subs.indexOf(selected) < 0) subs.push(selected);
    $('#subcategory').innerHTML = opts(subs, '— none —');
    $('#subcategory').value = selected || '';
  }
  function toggleReview() { $('#reviewBox').hidden = $('#kind').value !== 'review'; }
  function words(t) { return String(t || '').trim().split(/\s+/).filter(Boolean).length; }

  /* ---------------- auth ---------------- */
  function enter(user) {
    $('#login').hidden = true;
    $('#app').hidden = false;
    $('#who').textContent = user.email;
    $('#category').innerHTML = opts(C.CATEGORIES.map(function (c) { return c.name; }));
    $('#kind').innerHTML = C.KINDS.map(function (k) { return '<option value="' + k.id + '">' + R.esc(k.label) + '</option>'; }).join('');
    $('#skill').innerHTML = opts(C.SKILLS, '— not set —');
    $('#safety').innerHTML = opts(C.SAFETY, '— not set —');
    fillSubs('');
    try { $('#author').value = localStorage.getItem('tp_author') || 'TechPulse'; } catch (e) {}
    loadFacts();
    restoreDraft();
    check();
  }
  async function boot() {
    var s = (await sb.auth.getSession()).data.session;
    if (s && isAdmin(s.user)) return enter(s.user);
    if (s) await sb.auth.signOut();
    $('#login').hidden = false;
  }
  $('#loginBtn').addEventListener('click', async function () {
    var m = $('#loginMsg'); m.hidden = true;
    var r = await sb.auth.signInWithPassword({ email: $('#email').value.trim(), password: $('#password').value });
    if (r.error) return msg(m, 'err', 'Wrong email or password.');
    if (!isAdmin(r.data.user)) { await sb.auth.signOut(); return msg(m, 'err', 'This account is not the site admin.'); }
    enter(r.data.user);
  });
  $('#password').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#loginBtn').click(); });
  $('#logout').addEventListener('click', async function () { await sb.auth.signOut(); location.reload(); });

  /* ---------------- tabs ---------------- */
  document.querySelector('.adm-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]');
    if (!b) return;
    showTab(b.getAttribute('data-tab'));
  });
  function showTab(name) {
    ['write', 'list', 'facts'].forEach(function (t) { $('#tab-' + t).hidden = t !== name; });
    document.querySelectorAll('.adm-tabs button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === name); });
    if (name === 'list') loadList();
  }

  /* ---------------- form state ---------------- */
  function readForm() {
    var seen = {}, tags = $('#tags').value.split(',').map(function (t) { return t.trim().toLowerCase(); })
      .filter(function (t) { if (!t || seen[t]) return false; seen[t] = 1; return true; }).slice(0, 10);
    return {
      title: $('#title').value.trim(), slug: $('#slug').value.trim(), category: $('#category').value,
      author: $('#author').value.trim() || 'TechPulse', excerpt: $('#excerpt').value.trim(), tags: tags,
      cover: cur.cover, coverAlt: $('#coverAlt').value.trim(), content: $('#content').value,
      featured: $('#featured').checked, published: $('#published').checked,
      subcategory: $('#subcategory').value, kind: $('#kind').value || 'guide',
      skill: $('#skill').value, safety: $('#safety').value, time: $('#timeEst').value.trim(), cost: $('#costEst').value.trim(),
      tools: lines($('#toolsList').value), parts: lines($('#partsList').value), video: $('#videoUrl').value.trim(),
      rating: $('#rating').value.trim() === '' ? null : Number($('#rating').value.replace(',', '.')),
      pros: lines($('#pros').value), cons: lines($('#cons').value), verdict: $('#verdict').value.trim()
    };
  }
  function setCover(url) {
    cur.cover = url || '';
    $('#coverBox').innerHTML = url ? '<img src="' + R.esc(url) + '" alt="">' : 'No cover yet';
    $('#coverBox').className = url ? '' : 'adm-drop';
    $('#coverRemove').hidden = !url;
  }
  function setForm(f) {
    $('#title').value = f.title || ''; $('#slug').value = f.slug || '';
    $('#category').value = f.category || C.CATEGORIES[0].name;
    fillSubs(f.subcategory || '');
    $('#kind').value = f.kind || 'guide';
    $('#skill').value = f.skill || ''; $('#safety').value = f.safety || '';
    $('#timeEst').value = f.time || ''; $('#costEst').value = f.cost || '';
    $('#toolsList').value = (f.tools || []).join('\n'); $('#partsList').value = (f.parts || []).join('\n');
    $('#videoUrl').value = f.video || '';
    $('#rating').value = f.rating == null ? '' : f.rating;
    $('#pros').value = (f.pros || []).join('\n'); $('#cons').value = (f.cons || []).join('\n');
    $('#verdict').value = f.verdict || '';
    toggleReview();
    $('#author').value = f.author || 'TechPulse'; $('#excerpt').value = f.excerpt || '';
    $('#tags').value = Array.isArray(f.tags) ? f.tags.join(', ') : (f.tags || '');
    $('#coverAlt').value = f.coverAlt || ''; $('#content').value = f.content || '';
    $('#featured').checked = !!f.featured;
    $('#published').checked = (typeof f.published === 'boolean') ? f.published : false;
    setCover(f.cover);
    check();
  }
  function resetForm() {
    cur = { id: null, published_at: null, wasPublished: false, cover: '' };
    slugTouched = false; dirty = false;
    setForm({});
    try { $('#author').value = localStorage.getItem('tp_author') || 'TechPulse'; } catch (e) {}
    $('#slug').disabled = false; $('#slugHint').textContent = '';
    $('#formTitle').textContent = 'New article';
    $('#msg').hidden = true;
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }
  function loadArticle(a) {
    cur = { id: a.id, published_at: a.published_at, wasPublished: !!a.published, cover: a.cover_image || '' };
    setForm({ title: a.title, slug: a.slug, category: a.category, author: a.author, excerpt: a.excerpt, tags: a.tags,
      cover: a.cover_image, coverAlt: a.cover_alt, content: a.content, featured: a.featured, published: a.published,
      subcategory: a.subcategory, kind: a.kind, skill: a.skill_level, safety: a.safety_level, time: a.time_estimate, cost: a.cost_estimate,
      tools: a.tools, parts: a.parts, video: a.video_url, rating: a.rating, pros: a.pros, cons: a.cons, verdict: a.verdict });
    slugTouched = true; dirty = false;
    $('#slug').disabled = true;
    $('#slugHint').textContent = 'The URL is locked after creation so existing links and Google rankings keep working.';
    $('#formTitle').textContent = 'Edit article';
    $('#msg').hidden = true;
    showTab('write'); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* draft safety net (new articles only) */
  function snapshot() {
    if (cur.id) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var f = readForm();
      try { if (f.title || f.content) localStorage.setItem(DRAFT_KEY, JSON.stringify(f)); } catch (e) {}
    }, 800);
  }
  function restoreDraft() {
    try {
      var f = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (f && (f.title || f.content) && confirm('Restore your unsaved draft "' + (f.title || 'untitled') + '"?')) { setForm(f); slugTouched = true; }
    } catch (e) {}
  }
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------------- live counters + checklist ---------------- */
  function check() {
    var f = readForm(), n = words(f.content), md = R.md(f.content);
    var imgs = (f.content.match(/!\[[^\]]*\]\([^)]+\)/g) || []);
    var noAlt = imgs.filter(function (x) { return /^!\[\s*\]/.test(x); }).length;
    $('#titleCount').textContent = f.title.length + ' characters (ideal 30–65)';
    $('#excerptCount').textContent = f.excerpt.length + '/160';
    $('#wordCount').textContent = n + ' words · ~' + R.readMinutes(f.content) + ' min read';
    var wordTarget = f.kind === 'tip' ? 200 : (f.kind === 'review' ? 400 : 500);
    var wordNote = n < wordTarget
      ? n + ' words — aim for at least ' + wordTarget + ' for this type'
      : n + ' words (' + R.readMinutes(f.content) + ' min read) ✓';
    var items = [
      [f.title.length >= 20 && f.title.length <= 70, 'Title is 20–70 characters (' + f.title.length + ')'],
      [f.excerpt.length >= 90 && f.excerpt.length <= 160, 'Summary is 90–160 characters (' + f.excerpt.length + ')'],
      [!!f.cover && !!f.coverAlt, 'Cover image with an alt description'],
      [n >= wordTarget, wordNote],
      [md.toc.length >= 2, 'At least 2 sections with ## headings (' + md.toc.length + ')'],
      [noAlt === 0, imgs.length === 0 ? 'No inline images yet' : 'All ' + imgs.length + ' inline image(s) have alt text ✓'],
      [f.tags.length >= 2, 'At least 2 tags (' + f.tags.length + ')']
    ];
    if (f.kind === 'review') {
      items.push([f.rating != null && f.rating >= 0 && f.rating <= 5, 'Rating between 0 and 5']);
      items.push([f.pros.length >= 2 && f.cons.length >= 1, 'At least 2 pros and 1 con']);
      items.push([f.verdict.length >= 20, 'A clear verdict (20+ characters)']);
    } else {
      items.push([!!f.skill && !!f.time && !!f.cost, 'At a glance: skill level, time and cost filled in']);
      items.push([f.tools.length >= 1, 'Tools required listed']);
    }
    if (f.kind === 'project') {
      items.push([f.parts.length >= 2, 'Parts list filled in (at least 2 items)']);
      items.push([/```/.test(f.content), 'Includes copyable code block']);
    }
    if (f.kind !== 'review') items.push([!!f.safety, 'Safety level chosen']);
    if (SAFETY_TOPICS.indexOf(f.category) > -1) {
      var firstStep = f.content.search(/^\d+\.\s/m);
      var safetyKeywords = /(?:^|\n)>\s*\*{0,2}\s*(warning|danger|caution|safety|switch off|turn off|unplug|power off)/im;
      var safetyPos = f.content.search(safetyKeywords);
      var safetyOk = safetyKeywords.test(f.content) && (firstStep < 0 || safetyPos < firstStep);
      items.push([safetyOk, 'Safety callout (> Warning / > Caution) placed before the first step']);
    }
    $('#check').innerHTML = items.map(function (i) { return '<li>' + (i[0] ? '✅' : '⚠️') + ' ' + R.esc(i[1]) + '</li>'; }).join('');
    if ($('#preview').hidden === false) renderPreview();
  }
  ['title', 'slug', 'excerpt', 'tags', 'coverAlt', 'content', 'category', 'author', 'subcategory', 'kind', 'skill', 'safety',
   'timeEst', 'costEst', 'toolsList', 'partsList', 'videoUrl', 'rating', 'pros', 'cons', 'verdict'].forEach(function (id) {
    $('#' + id).addEventListener('input', function () { dirty = true; check(); snapshot(); });
  });
  $('#title').addEventListener('input', function () {
    if (!slugTouched && !cur.id) $('#slug').value = R.slugify($('#title').value);
  });
  $('#slug').addEventListener('input', function () { slugTouched = true; });
  $('#category').addEventListener('change', function () { fillSubs(''); });
  $('#kind').addEventListener('change', toggleReview);
  $('#slug').addEventListener('blur', function () { if (!$('#slug').disabled) $('#slug').value = R.slugify($('#slug').value); });

  /* ---------------- images ---------------- */
  /* Every uploaded picture (JPG, PNG, WebP, GIF, AVIF, BMP, SVG, HEIC on Safari...) is re-encoded
     to WebP at a fixed size. Nothing is cropped away: if the shape differs from the target,
     the picture is centred over a blurred copy of itself. Target weight: about 120 KB. */
  var IMG = { cover: { w: 1200, h: 630 }, body: { w: 1200, h: 800 }, maxBytes: 120 * 1024, maxInput: 30 * 1024 * 1024 };

  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function viaImg(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), i = new Image();
      i.onload = function () { URL.revokeObjectURL(u); res(i); };
      i.onerror = function () { URL.revokeObjectURL(u); rej(new Error('This browser cannot read that image format. Export it as JPG or PNG and try again.')); };
      i.src = u;
    });
  }
  function decode(file) {
    var p = window.createImageBitmap ? createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return viaImg(file); }) : viaImg(file);
    return p.then(function (im) {
      var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
      if (!w || !h) throw new Error('Could not read the size of this image.');
      return { src: im, w: w, h: h };
    });
  }
  /* Halve step by step so large photos stay sharp (one big jump looks jagged). */
  function shrink(src, sw, sh, tw, th) {
    var cur = src, cw = sw, ch = sh;
    while (cw / 2 >= tw && ch / 2 >= th) {
      var c = mkCanvas(cw / 2, ch / 2), g = c.getContext('2d');
      g.imageSmoothingQuality = 'high'; g.drawImage(cur, 0, 0, c.width, c.height);
      cur = c; cw = c.width; ch = c.height;
    }
    return cur;
  }
  function compose(d, W, H) {
    var out = mkCanvas(W, H), g = out.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    var sw = d.w, sh = d.h, near = Math.abs((sw / sh) / (W / H) - 1) <= 0.08, s, dw, dh;
    if (near) {
      s = Math.max(W / sw, H / sh); dw = sw * s; dh = sh * s;
      g.drawImage(shrink(d.src, sw, sh, dw, dh), (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      var f = Math.max(W / sw, H / sh), small = mkCanvas(sw * f / 24, sh * f / 24);
      small.getContext('2d').drawImage(d.src, 0, 0, small.width, small.height);
      g.drawImage(small, (W - sw * f) / 2, (H - sh * f) / 2, sw * f, sh * f);       /* blurred backdrop */
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, W, H);
      s = Math.min(W / sw, H / sh, 1); dw = sw * s; dh = sh * s;
      g.drawImage(shrink(d.src, sw, sh, dw, dh), (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
    return out;
  }
  function enc(c, type, q) { return new Promise(function (r) { c.toBlob(r, type, q); }); }
  async function smallest(c) {
    var type = 'image/webp', q = 0.86, best = null;
    var probe = await enc(c, type, q);
    if (!probe || probe.type !== 'image/webp') type = 'image/jpeg';
    for (var i = 0; i < 7; i++) {
      var b = await enc(c, type, q);
      if (!b) throw new Error('Image conversion failed.');
      best = b;
      if (b.size <= IMG.maxBytes) break;
      q -= 0.06;
    }
    return best;
  }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }

  async function upload(file, kind) {
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|avif|bmp|svg|heic|heif)$/i.test(file.name)) throw new Error('Please choose an image file.');
    if (file.size > IMG.maxInput) throw new Error('Image is larger than 30 MB.');
    var size = IMG[kind === 'cover' ? 'cover' : 'body'];
    var blob = await smallest(compose(await decode(file), size.w, size.h));
    var ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    var d = new Date(), base = R.slugify($('#slug').value || $('#title').value) || 'img';
    var path = d.getFullYear() + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + base + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    var r = await sb.storage.from(C.BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
    if (r.error) throw new Error('Upload failed: ' + r.error.message);
    upload.last = size.w + '×' + size.h + ' · ' + kb(file.size) + ' → ' + kb(blob.size);
    return sb.storage.from(C.BUCKET).getPublicUrl(path).data.publicUrl;
  }

  $('#coverBtn').addEventListener('click', function () { $('#coverFile').click(); });
  $('#coverFile').addEventListener('change', async function () {
    var f = this.files[0]; this.value = '';
    if (!f) return;
    msg($('#msg'), 'ok', 'Uploading cover…');
    try { setCover(await upload(f, 'cover')); dirty = true; msg($('#msg'), 'ok', 'Cover optimised: ' + upload.last); check(); snapshot(); }
    catch (e) { msg($('#msg'), 'err', R.esc(e.message)); }
  });
  $('#coverRemove').addEventListener('click', function () { setCover(''); dirty = true; check(); });

  async function addImages(files) {
    var validFiles = Array.prototype.filter.call(files || [], function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|avif|bmp|svg|heic|heif)$/i.test(f.name); });
    if (!validFiles.length) return;
    var batchAlt = null;
    if (validFiles.length > 1) {
      batchAlt = window.prompt('Describe all ' + validFiles.length + ' images (or leave blank to describe each one):', '');
      if (batchAlt === null) return;
      batchAlt = batchAlt.replace(/[\[\]]/g, '').trim();
    }
    for (var i = 0; i < validFiles.length; i++) {
      var f = validFiles[i];
      var alt = batchAlt;
      if (!alt) {
        var p = window.prompt('Describe image ' + (i + 1) + ' of ' + validFiles.length + ' (caption + alt text):', '');
        if (p === null) continue;
        alt = p.replace(/[\[\]]/g, '').trim();
      }
      msg($('#msg'), 'ok', 'Uploading image ' + (i + 1) + ' of ' + validFiles.length + '…');
      try {
        var url = await upload(f, 'body');
        insertBlock('![' + alt + '](' + url + ')');
        msg($('#msg'), 'ok', 'Image optimised: ' + upload.last);
      } catch (e) { msg($('#msg'), 'err', R.esc(e.message)); }
    }
  }
  $('#imgFile').addEventListener('change', function () { var fs = Array.prototype.slice.call(this.files); this.value = ''; addImages(fs); });
  $('#content').addEventListener('paste', function (e) {
    var fs = Array.prototype.filter.call((e.clipboardData && e.clipboardData.files) || [], function (f) { return /^image\//.test(f.type); });
    if (fs.length) { e.preventDefault(); addImages(fs); }
  });
  $('#content').addEventListener('dragover', function (e) { e.preventDefault(); });
  $('#content').addEventListener('drop', function (e) {
    var fs = Array.prototype.filter.call((e.dataTransfer && e.dataTransfer.files) || [], function (f) { return /^image\//.test(f.type); });
    if (fs.length) { e.preventDefault(); addImages(fs); }
  });

  /* ---------------- editor toolbar ---------------- */
  var TEMPLATES = {
    repair: [
      '## The problem', 'Describe exactly what happens: the symptoms, any error message, when it started and what you already tried.', '',
      '## Possible causes', '- **Most likely cause:** why it produces the symptom.', '- **Second cause:** how to recognise it.', '',
      '## Tools and parts you need', '- Tool or part (size, rating or model)', '',
      '> **Warning:** Switch off the power (breaker or plug) before touching any wiring. If you are not sure, call a qualified professional.', '',
      '## Step-by-step fix', '1. **First step.** What to do and what you should see or measure.', '',
      '![Describe what this photo shows](paste-image-here)', '',
      '2. **Second step.** Give real values and measurements.', '3. **Third step.** Test before you close everything up.', '',
      '## How to check it worked', 'Say exactly what a successful repair looks like.', '',
      '## Common mistakes', '- **Mistake:** how to avoid or fix it.', '',
      '## Frequently asked questions', '### First question?', 'Short, direct answer.'
    ],
    diagnosis: [
      '## Symptoms', '- What you see, hear or measure (for example: the engine cranks but does not start).', '',
      '## Quick checks (2 minutes)', '1. Check the simplest thing first.', '',
      '> **Warning:** Say what can hurt the reader here: moving parts, hot surfaces, fuel, mains voltage.', '',
      '## Likely causes, most likely first', '### 1. First cause', 'How to recognise it, how to test it (expected reading), how to fix it.', '',
      '### 2. Second cause', 'Same structure.', '',
      '## Tests and expected readings', '| Test | Expected reading | If it is different |', '|------|------------------|---------------------|',
      '| Battery voltage at rest | 12.4–12.7 V | Charge or replace the battery |', '',
      '## The fix', '1. **Step.** What to do.', '', '![Describe what this photo shows](paste-image-here)', '',
      '## How to confirm it is fixed', 'What you should see, hear or measure afterwards.', '',
      '## When to call a professional', 'Be specific about the limits of a DIY repair.'
    ],
    project: [
      '## What you will build', 'One short paragraph: what it does and why it is useful.', '',
      '## Parts list', '| Part | Quantity | Notes |', '|------|----------|-------|', '| ESP32 DevKit | 1 | any 30-pin board |', '',
      '## Wiring', '![Wiring diagram](paste-image-here)', '',
      '| ESP32 pin | Connects to |', '|-----------|-------------|', '| GPIO 26 | Relay IN |', '| GND | Relay GND |', '',
      '> **Warning:** Keep mains voltage away from the ESP32. Use a relay module with an optocoupler and proper insulation.', '',
      '## The code', '```cpp', '// paste your tested code here', '```', '',
      '## How it works', 'Explain the important lines in plain words.', '',
      '## Testing step by step', '1. Upload the code.', '2. Open the Serial Monitor at 115200 baud.', '3. Check what you should see.', '',
      '## Troubleshooting', '- **Symptom:** cause and fix.', '',
      '## Ideas to extend it', '- One useful upgrade.'
    ],
    review: [
      '## Who is this for?', 'Say who should buy it and who should not.', '',
      '## What it is', '| Spec | Value |', '|------|-------|', '| Example | 10 kΩ |', '',
      '## What we liked', '- A real strength, with a concrete example.', '',
      '## What we did not like', '- A real weakness, with a concrete example.', '',
      '## How we tested it', 'Describe exactly what you did. If you did not test it yourself, say so.', '',
      '![Describe what this photo shows](paste-image-here)', '',
      '## Alternatives', '- Another option and when it is the better choice.', '',
      '## Verdict', 'A clear recommendation in two or three sentences.'
    ]
  };
  var TEMPLATE_KIND = { diagnosis: 'diagnosis', project: 'project', review: 'review', repair: 'guide' };

  function ta() { return $('#content'); }
  function setText(t, v, s, e) { t.value = v; t.focus(); t.setSelectionRange(s, e); dirty = true; check(); snapshot(); }
  function wrap(a, b, ph) {
    var t = ta(), s = t.selectionStart, e = t.selectionEnd, mid = t.value.slice(s, e) || ph;
    setText(t, t.value.slice(0, s) + a + mid + b + t.value.slice(e), s + a.length, s + a.length + mid.length);
  }
  function prefixLines(prefixFn, ph) {
    var t = ta(), s = t.selectionStart, e = t.selectionEnd, v = t.value;
    var ls = v.lastIndexOf('\n', s - 1) + 1, le = v.indexOf('\n', e); if (le < 0) le = v.length;
    var chunk = v.slice(ls, le) || ph;
    var out = chunk.split('\n').map(function (l, i) { return prefixFn(i) + l; }).join('\n');
    setText(t, v.slice(0, ls) + out + v.slice(le), ls, ls + out.length);
  }
  function insertBlock(text) {
    var t = ta(), s = t.selectionStart, e = t.selectionEnd, before = t.value.slice(0, s), after = t.value.slice(e).replace(/^\n+/, '');
    var lead = before ? (/\n\n$/.test(before) ? '' : /\n$/.test(before) ? '\n' : '\n\n') : '';
    var pos = (before + lead + text + '\n\n').length;
    setText(t, before + lead + text + '\n\n' + after, pos, pos);
  }
  function renderPreview() {
    var f = readForm();
    $('#preview').innerHTML = R.articleHtml({
      slug: f.slug || 'preview', title: f.title || 'Untitled', excerpt: f.excerpt, content: f.content, category: f.category,
      subcategory: f.subcategory, kind: f.kind, tags: f.tags, cover_image: f.cover, cover_alt: f.coverAlt, author: f.author,
      published_at: cur.published_at || new Date().toISOString(), updated_at: cur.id ? new Date().toISOString() : null,
      skill_level: f.skill, safety_level: f.safety, time_estimate: f.time, cost_estimate: f.cost,
      tools: f.tools, parts: f.parts, video_url: f.video, rating: f.rating, pros: f.pros, cons: f.cons, verdict: f.verdict
    });
  }
  $('#toolbar').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'preview') {
      var showing = $('#preview').hidden;
      if (showing) renderPreview();
      $('#preview').hidden = !showing; ta().hidden = showing;
      $('#previewBtn').textContent = showing ? '✏️ Edit' : '👁 Preview';
      return;
    }
    if ($('#preview').hidden === false) return;
    if (act === 'h2') prefixLines(function () { return '## '; }, 'Section title');
    else if (act === 'h3') prefixLines(function () { return '### '; }, 'Sub-heading');
    else if (act === 'bold') wrap('**', '**', 'bold text');
    else if (act === 'italic') wrap('*', '*', 'italic text');
    else if (act === 'ul') prefixLines(function () { return '- '; }, 'List item');
    else if (act === 'ol') prefixLines(function (i) { return (i + 1) + '. '; }, 'First step');
    else if (act === 'link') {
      var u = window.prompt('Link address (https://…):', 'https://');
      if (u && u !== 'https://') {
        var cleanU = u.trim();
        if (/^(https?:\/\/|\/|[a-zA-Z0-9_-]+\.html)/i.test(cleanU)) {
          wrap('[', '](' + cleanU.replace(/[()\s]/g, '') + ')', 'link text');
        } else {
          msg($('#msg'), 'err', 'Use a safe http(s) or relative link.');
        }
      }
    }
    else if (act === 'code') insertBlock('```cpp\n// your code here\n```');
    else if (act === 'warn') insertBlock('> **Warning:** Switch off the power before you start.');
    else if (act === 'tip') insertBlock('> **Tip:** A short helpful hint.');
    else if (act === 'table') insertBlock('| Part | Value |\n|------|-------|\n| Example | 10 kΩ |');
    else if (act === 'image') $('#imgFile').click();
  });
  $('#tplSel').addEventListener('change', function () {
    var key = this.value; this.value = '';
    if (!key || $('#preview').hidden === false) return;
    var empty = !ta().value.trim();
    if (!empty && !confirm('Insert this outline at the cursor?')) return;
    insertBlock(TEMPLATES[key].join('\n'));
    if (empty && !cur.id) { $('#kind').value = TEMPLATE_KIND[key]; toggleReview(); check(); }
  });

  /* ---------------- save ---------------- */
  function validate(f) {
    if (f.title.length < 5) return 'Please write a title (at least 5 characters).';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) return 'The URL slug can only contain lowercase letters, numbers and single hyphens.';
    if (!f.excerpt) return 'Please add a short summary.';
    if (f.excerpt.length > 200) return 'The summary is too long (max 200 characters, 160 is ideal).';
    if (f.content.trim().length < 50) return 'The article text is empty.';
    if (f.video && !R.ytId(f.video)) return 'The video link must be a YouTube address.';
    if (f.rating != null && !(f.rating >= 0 && f.rating <= 5)) return 'The rating must be a number from 0 to 5.';
    return '';
  }
  $('#saveBtn').addEventListener('click', async function () {
    var f = readForm(), err = validate(f), m = $('#msg');
    if (err) return msg(m, 'err', R.esc(err));
    var btn = this; btn.disabled = true; btn.textContent = 'Saving…';
    var nowIso = new Date().toISOString();
    var payload = { title: f.title, excerpt: f.excerpt, content: f.content, category: f.category, tags: f.tags,
      cover_image: f.cover || null, cover_alt: f.coverAlt || null, author: f.author, featured: f.featured,
      published: f.published, read_minutes: Math.min(120, R.readMinutes(f.content)),
      subcategory: f.subcategory || null, kind: f.kind, skill_level: f.skill || null, safety_level: f.safety || null,
      time_estimate: f.time || null, cost_estimate: f.cost || null, tools: f.tools, parts: f.parts, video_url: f.video || null,
      rating: f.kind === 'review' ? f.rating : null, pros: f.kind === 'review' ? f.pros : [], cons: f.kind === 'review' ? f.cons : [],
      verdict: f.kind === 'review' && f.verdict ? f.verdict : null, updated_at: nowIso };
    if (f.published && !cur.published_at) payload.published_at = nowIso;
    var res;
    if (cur.id) res = await sb.from('articles').update(payload).eq('id', cur.id).select('id,slug,published,published_at').single();
    else { payload.slug = f.slug; res = await sb.from('articles').insert(payload).select('id,slug,published,published_at').single(); }
    btn.disabled = false; btn.textContent = 'Save article';
    if (res.error) {
      return msg(m, 'err', res.error.code === '23505' ? 'This URL slug already exists. Change the slug and save again.' : 'Could not save: ' + R.esc(res.error.message));
    }
    cur.id = res.data.id;
    cur.wasPublished = !!res.data.published;
    if (res.data.published_at) cur.published_at = res.data.published_at;
    dirty = false;
    $('#slug').disabled = true; $('#formTitle').textContent = 'Edit article';
    try { localStorage.setItem('tp_author', f.author); localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    var s = encodeURIComponent(res.data.slug);
    msg(m, 'ok', res.data.published
      ? '✅ Saved and live. <a href="/article.html?slug=' + s + '" target="_blank" rel="noopener">Open the article</a>.<br>' +
        '<small>Permanent URL: <code>/a/' + R.esc(res.data.slug) + '.html</code> — the static page for Google builds automatically within 30 minutes. For instant indexing: GitHub → Actions → "Build pages" → Run workflow.</small>'
      : '✅ Saved as a draft. Tick "Published" and save again to make it visible.');
    listRows = [];
  });
  $('#newBtn').addEventListener('click', function () { if (!dirty || confirm('Discard the changes in the editor?')) resetForm(); });

  /* ---------------- article list ---------------- */
  async function loadList() {
    var box = $('#listBox'); box.innerHTML = '<p class="hint">Loading…</p>';
    var r = await sb.from('articles').select('id,slug,title,category,published,featured,views,published_at').order('id', { ascending: false }).limit(300);
    if (r.error) { box.innerHTML = '<p class="adm-msg err">' + R.esc(r.error.message) + '</p>'; return; }
    listRows = r.data; drawList();
  }
  function drawList() {
    var q = $('#listSearch').value.trim().toLowerCase(), fl = $('#listFilter').value;
    var rows = listRows.filter(function (a) {
      return (!q || a.title.toLowerCase().indexOf(q) > -1) && (!fl || (fl === 'pub') === a.published);
    });
    $('#listBox').innerHTML = rows.length ? rows.map(function (a) {
      var safeSlug = encodeURIComponent(a.slug);
      return '<div class="adm-item"><span class="t">' + R.esc(a.title) + '<span class="m">' + R.esc(a.category) + ' · ' + R.fmtDate(a.published_at) + ' · 👁 ' + Number(a.views || 0) + '</span></span>' +
        '<span class="adm-badge' + (a.published ? '' : ' draft') + '">' + (a.published ? 'LIVE' : 'DRAFT') + '</span>' +
        '<button class="adm-mini" data-do="edit" data-id="' + a.id + '">Edit</button>' +
        (a.published ? '<a class="adm-mini" href="/a/' + safeSlug + '.html" target="_blank" rel="noopener">View</a>' : '') +
        '<button class="adm-mini" data-do="feat" data-id="' + a.id + '">' + (a.featured ? '★ Featured' : '☆ Feature') + '</button>' +
        '<button class="adm-mini" data-do="pub" data-id="' + a.id + '">' + (a.published ? 'Unpublish' : 'Publish') + '</button>' +
        '<button class="adm-mini danger" data-do="del" data-id="' + a.id + '">Delete</button></div>';
    }).join('') : '<p class="hint">No articles yet.</p>';
  }
  $('#listSearch').addEventListener('input', drawList);
  $('#listFilter').addEventListener('change', drawList);
  $('#listBox').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-do]');
    if (!b) return;
    var id = +b.getAttribute('data-id'), row = listRows.filter(function (a) { return a.id === id; })[0], act = b.getAttribute('data-do'), r;
    if (!row) return;
    if (act === 'edit') {
      r = await sb.from('articles').select('*').eq('id', id).single();
      if (r.error) return alert(r.error.message);
      if (dirty && !confirm('Discard the changes in the editor?')) return;
      return loadArticle(r.data);
    }
    if (act === 'feat') r = await sb.from('articles').update({ featured: !row.featured, updated_at: new Date().toISOString() }).eq('id', id);
    if (act === 'pub') {
      var pubPatch = row.published
        ? { published: false, updated_at: new Date().toISOString() }
        : { published: true, published_at: row.published_at || new Date().toISOString(), updated_at: new Date().toISOString() };
      r = await sb.from('articles').update(pubPatch).eq('id', id);
    }
    if (act === 'del') {
      if (!confirm('Delete "' + row.title + '" permanently?')) return;
      r = await sb.from('articles').delete().eq('id', id);
      if (!r.error && cur.id === id) resetForm();
    }
    if (r && r.error) return alert(r.error.message);
    loadList();
  });

  /* ---------------- facts ---------------- */
  async function loadFacts() {
    var r = await sb.from('facts').select('id,text').order('id', { ascending: false });
    if (r.error) { msg($('#factMsg'), 'err', R.esc(r.error.message)); return; }
    $('#factList').innerHTML = r.data.map(function (x) {
      return '<div class="adm-item"><span class="t" style="font-weight:500">' + R.esc(x.text) + '</span><button class="adm-mini danger" data-id="' + x.id + '">Delete</button></div>';
    }).join('') || '<p class="hint">No facts yet.</p>';
  }
  $('#factAdd').addEventListener('click', async function () {
    var t = $('#factText').value.trim(), m = $('#factMsg');
    if (t.length < 10) return msg(m, 'err', 'Write at least 10 characters.');
    var r = await sb.from('facts').insert({ text: t });
    if (r.error) return msg(m, 'err', R.esc(r.error.message));
    $('#factText').value = ''; m.hidden = true; loadFacts();
  });
  $('#factList').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-id]');
    if (!b || !confirm('Delete this fact?')) return;
    var r = await sb.from('facts').delete().eq('id', +b.getAttribute('data-id'));
    if (r.error) return alert(r.error.message);
    loadFacts();
  });

  boot();
})();
