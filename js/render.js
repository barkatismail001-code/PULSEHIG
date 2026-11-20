/* TechPulse — shared renderer (browser + Node).
   Markdown -> HTML, article page HTML, article cards. */
(function (root, factory) {
  var cfg = (typeof module === 'object' && module.exports) ? require('./config.js') : root.TP_CONFIG;
  var api = factory(cfg);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TPR = api;
})(typeof self !== 'undefined' ? self : this, function (CFG) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slugify(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    return /^(javascript|data|vbscript):/i.test(u) ? '#' : u;
  }
  function readMinutes(text) {
    return Math.max(1, Math.round(String(text || '').trim().split(/\s+/).filter(Boolean).length / 200));
  }
  function fmtDate(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch (e) { return ''; }
  }
  function articlePath(slug) { return '/a/' + encodeURIComponent(slug) + '.html'; }
  function absUrl(path) { return CFG.SITE_URL + path; }
  function catBy(name) {
    return CFG.CATEGORIES.filter(function (x) { return x.name === name; })[0] || null;
  }
  function catIcon(name) { var c = catBy(name); return c ? c.icon : '📄'; }
  function catPath(name, sub) {
    var c = catBy(name);
    return c ? '/c/' + c.slug + '.html' + (sub ? '?sub=' + encodeURIComponent(sub) : '') : '/articles.html?q=' + encodeURIComponent(name);
  }
  function kindLabel(id) {
    var k = CFG.KINDS.filter(function (x) { return x.id === id; })[0];
    return k ? k.label : 'Guide';
  }
  function ytId(url) {
    var m = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  }
  function stars(r) {
    var n = Math.max(0, Math.min(5, Math.round(Number(r) || 0)));
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }
  function list(items) {
    return '<ul>' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
  }

  /* ---------- Inline markdown (input is escaped first) ---------- */
  function inline(s) {
    var codes = [];
    s = String(s).replace(/`([^`]+)`/g, function (_, c) { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) {
      var clean = safeUrl(u);
      var ext = /^https?:/i.test(clean);
      return '<a href="' + esc(clean) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + t + '</a>';
    });
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return '<code>' + esc(codes[+i]) + '</code>'; });
  }

  /* ---------- Block markdown ---------- */
  function md(src) {
    var lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
    var out = [], toc = [], used = {}, i = 0, m;

    function uid(t) {
      var b = slugify(t) || 'section', id = b, n = 2;
      while (used[id]) id = b + '-' + n++;
      used[id] = 1;
      return id;
    }
    function special(l) {
      return /^\s*(#{1,3}\s|```|>|[-*]\s|\d+[.)]\s|!\[|\|)/.test(l) || /^-{3,}\s*$/.test(l);
    }
    function cells(row) { return row.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); }

    while (i < lines.length) {
      var l = lines[i];
      if (!l.trim()) { i++; continue; }

      if (/^\s*```/.test(l)) {
        var lang = l.replace(/^\s*```/, '').trim().replace(/[^\w-]/g, ''), buf = [];
        i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        out.push('<div class="tp-code"><button type="button" class="tp-copy" data-copy-code>Copy</button><pre><code' +
          (lang ? ' class="lang-' + lang + '"' : '') + '>' + esc(buf.join('\n')) + '</code></pre></div>');
        continue;
      }
      if ((m = l.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/))) {
        var lvl = m[1].length === 1 ? 2 : m[1].length;
        var plain = m[2].replace(/[`*]/g, '');
        var id = uid(plain);
        if (lvl === 2) toc.push({ id: id, text: plain });
        out.push('<h' + lvl + ' id="' + id + '">' + inline(m[2]) + '</h' + lvl + '>');
        i++; continue;
      }
      if ((m = l.match(/^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/))) {
        var cap = m[3] || m[1];
        var imgUrl = safeUrl(m[2]);
        out.push('<figure class="tp-figure"><img src="' + esc(imgUrl) + '" alt="' + esc(m[1]) + '" width="1200" height="800" loading="lazy" decoding="async">' +
          (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>');
        i++; continue;
      }
      if (/^-{3,}\s*$/.test(l)) { out.push('<hr>'); i++; continue; }

      if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
        var head = cells(l), rows = [];
        i += 2;
        while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
        out.push('<div class="tp-table-wrap"><table><thead><tr>' + head.map(function (h) { return '<th>' + inline(h) + '</th>'; }).join('') +
          '</tr></thead><tbody>' + rows.map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>');
        continue;
      }
      if (/^>/.test(l)) {
        var q = [];
        while (i < lines.length && /^>/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
        var txt = q.join(' ').trim();
        var kind = /^\**\s*(warning|danger|caution)\b|^⚠/i.test(txt) ? 'warn'
          : /^\**\s*(tip|pro tip)\b|^💡/i.test(txt) ? 'tip'
          : /^\**\s*(note|info)\b|^ℹ/i.test(txt) ? 'note' : 'quote';
        out.push('<blockquote class="tp-callout tp-' + kind + '">' + inline(txt) + '</blockquote>');
        continue;
      }
      if (/^\s*[-*]\s+/.test(l) || /^\s*\d+[.)]\s+/.test(l)) {
        var ordered = /^\s*\d+[.)]\s+/.test(l);
        var re = ordered ? /^\s*(\d+)[.)]\s+(.*)$/ : /^\s*[-*]\s+(.*)$/;
        var start = ordered ? parseInt(l.match(re)[1], 10) : 1, items = [];
        while (i < lines.length) {
          var mm = lines[i].match(re);
          if (mm) { items.push(mm[mm.length - 1]); i++; }
          else if (items.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+[.)])\s+/.test(lines[i])) {
            items[items.length - 1] += ' ' + lines[i].trim(); i++;
          } else if (!lines[i].trim()) {
            var j = i;
            while (j < lines.length && !lines[j].trim()) j++;
            if (j < lines.length && re.test(lines[j])) i = j; else break;
          } else break;
        }
        var tag = ordered ? 'ol' : 'ul';
        out.push('<' + tag + (ordered && start > 1 ? ' start="' + start + '" style="counter-reset:step ' + (start - 1) + '"' : '') + '>' +
          items.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + '</' + tag + '>');
        continue;
      }
      var p = [l.trim()];
      i++;
      while (i < lines.length && lines[i].trim() && !special(lines[i])) p.push(lines[i++].trim());
      out.push('<p>' + inline(p.join(' ')) + '</p>');
    }
    return { html: out.join('\n'), toc: toc };
  }

  /* ---------- Article page building blocks ---------- */
  var SKILL_DOTS = { Beginner: '●○○', Intermediate: '●●○', Advanced: '●●●' };

  function glanceHtml(a) {
    var tools = a.tools || [], parts = a.parts || [];
    if (!a.skill_level && !a.time_estimate && !a.cost_estimate && !a.safety_level && !tools.length && !parts.length) return '';
    var cell = function (label, val, cls) {
      return val ? '<div class="tp-g-cell"><span>' + label + '</span><b' + (cls ? ' class="' + cls + '"' : '') + '>' + val + '</b></div>' : '';
    };
    var grid =
      cell('Skill level', a.skill_level ? '<i>' + (SKILL_DOTS[a.skill_level] || '') + '</i> ' + esc(a.skill_level) : '', 'tp-skill') +
      cell('Estimated time', esc(a.time_estimate || '')) +
      cell('Estimated cost', esc(a.cost_estimate || '')) +
      cell('Safety level', a.safety_level ? esc(a.safety_level) : '', a.safety_level ? 'tp-safety tp-safety-' + String(a.safety_level).toLowerCase() : '');
    var lists =
      (tools.length ? '<div><span>Tools required</span>' + list(tools) + '</div>' : '') +
      (parts.length ? '<div><span>Parts &amp; materials</span>' + list(parts) + '</div>' : '');
    var note = (a.safety_level === 'High' || a.safety_level === 'Medium')
      ? '<p class="tp-g-note">⚠️ Read the safety notes in this article before you start.</p>' : '';
    return '<section class="tp-glance" aria-label="At a glance"><h2>At a glance</h2>' +
      (grid ? '<div class="tp-g-grid">' + grid + '</div>' : '') +
      (lists ? '<div class="tp-g-lists">' + lists + '</div>' : '') + note + '</section>';
  }

  function reviewHtml(a) {
    if (a.kind !== 'review') return '';
    var pros = a.pros || [], cons = a.cons || [];
    if (!a.rating && !pros.length && !cons.length && !a.verdict) return '';
    return '<section class="tp-review" aria-label="Our verdict">' +
      (a.rating ? '<div class="tp-review-head"><span class="tp-stars" aria-hidden="true">' + stars(a.rating) + '</span> <b>' + Number(a.rating).toFixed(1) + ' / 5</b> <span class="tp-muted">our rating</span></div>' : '') +
      ((pros.length || cons.length)
        ? '<div class="tp-proscons"><div class="tp-pros"><h3>Pros</h3>' + list(pros) + '</div><div class="tp-cons"><h3>Cons</h3>' + list(cons) + '</div></div>' : '') +
      (a.verdict ? '<p class="tp-verdict"><b>Verdict:</b> ' + esc(a.verdict) + '</p>' : '') + '</section>';
  }

  function videoHtml(a) {
    var id = ytId(a.video_url);
    if (!id) return '';
    return '<div class="tp-video" data-yt="' + id + '" role="button" tabindex="0" aria-label="Play video">' +
      '<img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="Video thumbnail" loading="lazy" decoding="async">' +
      '<span class="tp-play" aria-hidden="true">▶</span></div>';
  }

  /* ---------- Article page (shared by static pages and article.html) ---------- */
  function articleHtml(a) {
    var body = md(a.content);
    var url = absUrl(articlePath(a.slug));
    var mins = a.read_minutes || readMinutes(a.content);
    var enc = encodeURIComponent(url), t = encodeURIComponent(a.title);
    var updated = a.updated_at && a.published_at && (new Date(a.updated_at) - new Date(a.published_at) > 864e5)
      ? '<span>Updated ' + fmtDate(a.updated_at) + '</span>' : '';

    var toc = body.toc.length >= 3
      ? '<details class="tp-toc" open><summary>In this article</summary><ol>' +
        body.toc.map(function (x) { return '<li><a href="#' + x.id + '">' + esc(x.text) + '</a></li>'; }).join('') + '</ol></details>'
      : '';
    var cover = a.cover_image
      ? '<figure class="tp-figure tp-cover"><img src="' + esc(safeUrl(a.cover_image)) + '" alt="' + esc(a.cover_alt || a.title) + '" width="1200" height="630" fetchpriority="high" decoding="async"></figure>'
      : '';
    var tags = (a.tags && a.tags.length)
      ? '<div class="tags-list">' + a.tags.map(function (x) {
          return '<a class="tag" href="/articles.html?q=' + encodeURIComponent(x) + '">#' + esc(x) + '</a>';
        }).join('') + '</div>' : '';
    var shares = [
      ['WhatsApp', 'https://wa.me/?text=' + t + '%20' + enc],
      ['Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + enc],
      ['X', 'https://twitter.com/intent/tweet?text=' + t + '&url=' + enc],
      ['Telegram', 'https://t.me/share/url?url=' + enc + '&text=' + t]
    ].map(function (s) {
      return '<a class="share-btn" href="' + esc(s[1]) + '" target="_blank" rel="noopener noreferrer">' + s[0] + '</a>';
    }).join('');

    return '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="' + catPath(a.category) + '">' + esc(a.category) + '</a>' +
      (a.subcategory ? ' › <a href="' + catPath(a.category, a.subcategory) + '">' + esc(a.subcategory) + '</a>' : '') + '</nav>' +
      '<article class="single-article">' +
      '<header class="article-header"><div class="tp-head-badges"><a class="article-category" href="' + catPath(a.category) + '">' + catIcon(a.category) + ' ' + esc(a.category) + '</a>' +
      '<span class="tp-badge tp-kind-' + esc(a.kind || 'guide') + '">' + kindLabel(a.kind) + '</span></div>' +
      '<h1>' + esc(a.title) + '</h1>' +
      '<div class="article-meta"><span>By ' + esc(a.author || CFG.SITE_NAME) + '</span><span>' + fmtDate(a.published_at) + '</span>' + updated + '<span>' + mins + ' min read</span></div></header>' +
      (a.excerpt ? '<div class="article-excerpt"><p>' + esc(a.excerpt) + '</p></div>' : '') +
      cover + glanceHtml(a) + reviewHtml(a) + videoHtml(a) + toc +
      '<div class="article-content">' + body.html + '</div>' +
      tags +
      '<div class="share-buttons"><span class="share-label">Share:</span>' + shares +
      '<button type="button" class="share-btn" data-copy="' + esc(url) + '">Copy link</button></div>' +
      '</article>';
  }

  /* ---------- Cards ---------- */
  function badge(a) { return '<span class="tp-badge tp-kind-' + esc(a.kind || 'guide') + '">' + kindLabel(a.kind) + '</span>'; }
  function facts(a) {
    var f = [];
    if (a.kind === 'review' && a.rating) f.push('<span class="tp-stars">' + stars(a.rating) + '</span>');
    if (a.time_estimate) f.push('⏱ ' + esc(a.time_estimate));
    if (a.skill_level) f.push(esc(a.skill_level));
    return f.length ? '<div class="tp-card-facts">' + f.join('<span>·</span>') + '</div>' : '';
  }
  function cardHtml(a, big) {
    var url = articlePath(a.slug);
    var img = a.cover_image
      ? '<a class="tp-card-img" href="' + url + '" tabindex="-1" aria-hidden="true"><img src="' + esc(safeUrl(a.cover_image)) + '" alt="" width="800" height="420" loading="lazy" decoding="async">' + badge(a) + '</a>'
      : '';
    return '<article class="article-card tp-card' + (big ? ' tp-card-big' : '') + '">' + img +
      '<span class="card-category">' + catIcon(a.category) + ' ' + esc(a.subcategory || a.category) + (a.cover_image ? '' : ' ' + badge(a)) + '</span>' +
      '<h3><a href="' + url + '">' + esc(a.title) + '</a></h3>' +
      '<p>' + esc(a.excerpt) + '</p>' + facts(a) +
      '<div class="tp-card-meta"><span>' + fmtDate(a.published_at) + '</span><span>·</span><span>' + (a.read_minutes || 5) + ' min read</span></div>' +
      '</article>';
  }
  function rowHtml(a) {
    var url = articlePath(a.slug);
    return '<a class="tp-row" href="' + url + '">' +
      (a.cover_image ? '<img src="' + esc(safeUrl(a.cover_image)) + '" alt="" width="80" height="56" loading="lazy" decoding="async">' : '<span class="tp-row-ph">' + catIcon(a.category) + '</span>') +
      '<span class="tp-row-txt"><small>' + esc(a.subcategory || a.category) + '</small><b>' + esc(a.title) + '</b></span></a>';
  }
  function popularHtml(list) {
    return '<ol class="tp-pop">' + list.map(function (a) {
      return '<li><a href="' + articlePath(a.slug) + '">' + esc(a.title) + '</a></li>';
    }).join('') + '</ol>';
  }

  return {
    esc: esc, slugify: slugify, md: md, inline: inline, readMinutes: readMinutes, fmtDate: fmtDate,
    articlePath: articlePath, absUrl: absUrl, catBy: catBy, catIcon: catIcon, catPath: catPath, kindLabel: kindLabel,
    ytId: ytId, articleHtml: articleHtml, cardHtml: cardHtml, rowHtml: rowHtml, popularHtml: popularHtml
  };
});
