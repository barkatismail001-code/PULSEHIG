/* TechPulse Command Palette (Ctrl+K) v20261010 */
window.TPCommandPalette = (function () {
  'use strict';
  var items = [], current = [], activeIdx = 0, overlay, input, results;

  var P = '\u{1F3E0}', G = '\u{1F393}', T = '\u{1F527}', S = '\u{2B50}', B = '\u{1F4D6}',
      C = '\u{1F4AC}', N = '\u{1F4E1}', I = '\u{2139}\u{FE0F}', M = '\u{2709}\u{FE0F}', A = '\u{1F4C4}';

  function load() {
    return Promise.all([
      fetch('/data/articles.json').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/data/tools.json').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/data/guides.json').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/data/manual-articles.json').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/data/auto-articles.json').then(r => r.ok ? r.json() : []).catch(() => [])
    ]).then(function (arr) {
      var arts = arr[0], tools = arr[1], guides = arr[2], manual = arr[3], auto = arr[4];

      [
        ['Home', '/index.html', P, 'pages home'],
        ['Academy', '/academy.html', G, 'pages academy courses'],
        ['Tools', '/tools.html', T, 'pages tools calculators'],
        ['Best Picks', '/best-picks.html', S, 'pages best picks'],
        ['Guides', '/guides.html', B, 'pages guides'],
        ['Q&A', '/qa.html', C, 'pages qa'],
        ['Forum', '/forum.html', C, 'pages forum'],
        ['News', '/news.html', N, 'pages news'],
        ['About', '/about.html', I, 'pages about'],
        ['Contact', '/contact.html', M, 'pages contact']
      ].forEach(p => items.push({ title: p[0], url: p[1], icon: p[2], type: 'Page', keywords: p[3] }));

      (tools || []).forEach(t => items.push({
        title: t.title || t.slug, url: '/tool.html?slug=' + (t.slug || t.id),
        icon: t.icon || T, type: 'Tool', keywords: (t.category + ' ' + (t.keywords||[]).join(' ')).toLowerCase()
      }));
      (guides || []).forEach(g => items.push({
        title: g.title || g.slug, url: '/guides/' + (g.slug || g.id) + '.html',
        icon: g.icon || B, type: 'Guide', keywords: (g.category || '').toLowerCase()
      }));

      var all = [].concat(manual || [], auto || [], arts || []);
      var seen = new Set();
      all.forEach(a => {
        var t = a.title;
        if (typeof t === 'object') t = t.en || Object.values(t)[0];
        if (!t || seen.has(t)) return;
        seen.add(t);
        var url = a.slug ? '/a/' + a.slug + '.html' : '/article.html?id=' + (a.id || '');
        items.push({ title: t, url: url, icon: A, type: 'Article', keywords: (a.category || '').toLowerCase() });
      });
    });
  }

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'tp-cmdk-overlay';
    overlay.innerHTML =
      '<div class="tp-cmdk">' +
        '<input class="tp-cmdk-input" placeholder="Search articles, tools, guides, pages..." aria-label="Command palette">' +
        '<div class="tp-cmdk-results"></div>' +
        '<div class="tp-cmdk-footer">' +
          '<span><kbd>\u2191</kbd><kbd>\u2193</kbd> navigate</span>' +
          '<span><kbd>\u21B5</kbd> open</span>' +
          '<span><kbd>esc</kbd> close</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    input = overlay.querySelector('.tp-cmdk-input');
    results = overlay.querySelector('.tp-cmdk-results');
    input.addEventListener('input', function () { activeIdx = 0; render(input.value); });
    input.addEventListener('keydown', onKey);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, current.length - 1); updateActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); updateActive(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (current[activeIdx]) location.href = current[activeIdx].url; }
    else if (e.key === 'Escape') close();
  }

  function render(q) {
    q = (q || '').trim().toLowerCase();
    var list = q ? items.filter(it => it.title.toLowerCase().includes(q) || (it.keywords || '').includes(q)) : items;
    current = list.slice(0, 40);
    if (!current.length) { results.innerHTML = '<div class="tp-cmdk-empty">No results</div>'; return; }
    results.innerHTML = current.map(function (it, i) {
      var cls = 'tp-cmdk-item' + (i === activeIdx ? ' active' : '');
      return '<a class="' + cls + '" href="' + it.url + '">' +
        '<span class="icon">' + it.icon + '</span>' +
        '<span class="title">' + it.title + '</span>' +
        '<span class="type">' + it.type + '</span>' +
      '</a>';
    }).join('');
  }

  function updateActive() {
    var list = results.querySelectorAll('.tp-cmdk-item');
    list.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
    if (list[activeIdx]) list[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  function open() { if (!overlay) build(); overlay.classList.add('open'); input.value = ''; input.focus(); render(''); }
  function close() { if (overlay) overlay.classList.remove('open'); }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      overlay && overlay.classList.contains('open') ? close() : open();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) {
      if (overlay && overlay.classList.contains('open')) return;
      e.preventDefault(); open();
    }
  });

  return { open: open, close: close, load: load };
})();
