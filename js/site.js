/* TechPulse — shared site script: layout, live-news ticker, data access, helpers.
   Load order on every page: config.js, render.js, site.js (all deferred). */
(function () {
  'use strict';
  var C = window.TP_CONFIG, R = window.TPR;
  var TP = window.TP = { C: C, R: R };
  var LIST_COLS = 'id,slug,title,excerpt,category,subcategory,kind,tags,cover_image,cover_alt,author,featured,read_minutes,published_at,skill_level,time_estimate,cost_estimate,safety_level,rating';

  /* ---------- tiny helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  TP.$ = $;
  TP.timeAgo = function (ms) {
    var s = Math.max(1, Math.round((Date.now() - ms) / 1000));
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  };
  function cacheGet(k, ttl) {
    try {
      var o = JSON.parse(sessionStorage.getItem('tp_' + k) || 'null');
      return o && Date.now() - o.t < ttl ? o.v : null;
    } catch (e) { return null; }
  }
  function cacheSet(k, v) { try { sessionStorage.setItem('tp_' + k, JSON.stringify({ t: Date.now(), v: v })); } catch (e) {} }
  function fj(url, ms) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, ms || 6000);
    return fetch(url, { signal: ctl.signal }).then(function (r) {
      clearTimeout(t);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ---------- Supabase REST (public reads) ---------- */
  TP.sb = function (path, opts) {
    opts = opts || {};
    return fetch(C.SUPABASE_URL + '/rest/v1/' + path, {
      method: opts.method || 'GET',
      headers: { apikey: C.SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      keepalive: !!opts.keepalive
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.status === 204 ? null : r.json();
    });
  };
  TP.getArticles = function (o) {
    o = o || {};
    var limit = o.limit || 12, q = ['select=' + LIST_COLS, 'published=eq.true'];
    if (o.category) q.push('category=eq.' + encodeURIComponent(o.category));
    if (o.subcategory) q.push('subcategory=eq.' + encodeURIComponent(o.subcategory));
    if (o.kind) q.push('kind=eq.' + encodeURIComponent(o.kind));
    if (o.search) {
      var raw = String(o.search).replace(/[,()*%\\{}"]/g, ' ').replace(/\s+/g, ' ').trim();
      if (raw) {
        var encLike = encodeURIComponent(raw);
        var conds = [
          'title.ilike.*' + encLike + '*',
          'excerpt.ilike.*' + encLike + '*'
        ];
        var tagToken = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (tagToken) {
          conds.push('tags.cs.' + encodeURIComponent('{"' + tagToken + '"}'));
        }
        q.push('or=(' + conds.join(',') + ')');
      }
    }
    if (o.excludeIds && o.excludeIds.length) {
      var cleanIds = o.excludeIds.map(function (id) { return Number(id); }).filter(function (n) { return Number.isFinite(n); });
      if (cleanIds.length) q.push('id=not.in.(' + cleanIds.join(',') + ')');
    }
    if (o.excludeSlug) q.push('slug=neq.' + encodeURIComponent(o.excludeSlug));
    q.push('order=' + (o.order || 'published_at.desc'), 'limit=' + (limit + (o.probe ? 1 : 0)));
    if (o.offset) q.push('offset=' + Number(o.offset));
    return TP.sb('articles?' + q.join('&'));
  };
  TP.getArticle = function (slug) {
    return TP.sb('articles?select=*&published=eq.true&limit=1&slug=eq.' + encodeURIComponent(slug))
      .then(function (r) { return r[0] || null; });
  };
  TP.getFacts = function () { return TP.sb('facts?select=id,text&order=id.desc&limit=200'); };
  TP.trackView = function (slug) {
    try {
      if (sessionStorage.getItem('tp_v_' + slug)) return;
      sessionStorage.setItem('tp_v_' + slug, '1');
    } catch (e) {}
    TP.sb('rpc/increment_views', { method: 'POST', body: { p_slug: slug }, keepalive: true }).catch(function () {});
  };
  TP.trackPageView = function () {
    var body = document.body;
    if (!body || body.getAttribute('data-page') === 'admin') return;
    var path = location.pathname || '/';
    if (path === '/admin.html' || path === '/article.html') return;
    var key = 'tp_pv_' + path;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) {}
    TP.sb('rpc/increment_page_view', { method: 'POST', body: { p_path: path }, keepalive: true }).catch(function () {});
  };

  /* ---------- Live tech news: Hacker News + DEV ---------- */
  var _newsFlight = null;
  var NEWS_TTL       = 15 * 60 * 1000;
  var NEWS_TTL_STALE = 60 * 60 * 1000;
  var NEWS_ITEM_LIMIT = 100;

  function safeExternalUrl(u) {
    u = String(u || '').trim();
    return /^https:\/\//i.test(u) ? u : null;
  }

  function truncTitle(t) {
    t = String(t || '').trim();
    return t.length > NEWS_ITEM_LIMIT ? t.slice(0, NEWS_ITEM_LIMIT - 1) + '…' : t;
  }

  function fetchHN(n) {
    return fj('https://hacker-news.firebaseio.com/v0/topstories.json', 8000)
      .then(function (ids) {
        if (!Array.isArray(ids)) throw new Error('HN: bad response');
        return Promise.all(ids.slice(0, n + 10).map(function (id) {
          return fj('https://hacker-news.firebaseio.com/v0/item/' + id + '.json', 4000)
            .catch(function () { return null; });
        }));
      })
      .then(function (items) {
        return items
          .filter(function (x) { return x && x.title && !x.dead && !x.deleted && x.type === 'story'; })
          .slice(0, n)
          .map(function (x) {
            var url = safeExternalUrl(x.url) || ('https://news.ycombinator.com/item?id=' + x.id);
            return {
              id: 'hn' + x.id, title: truncTitle(x.title), url: url,
              source: 'Hacker News', tag: 'HN', time: x.time * 1000,
              score: x.score || 0, comments: x.descendants || 0,
              discuss: 'https://news.ycombinator.com/item?id=' + x.id
            };
          });
      });
  }

  function fetchDev(n) {
    return fj('https://dev.to/api/articles?top=1&per_page=' + n, 8000)
      .then(function (list) {
        if (!Array.isArray(list)) throw new Error('DEV: bad response');
        return list.map(function (x) {
          var url = safeExternalUrl(x.url);
          if (!url || !x.title) return null;
          var img = safeExternalUrl(x.cover_image) || safeExternalUrl(x.social_image) || null;
          return {
            id: 'dv' + x.id, title: truncTitle(x.title), url: url,
            source: 'DEV', tag: 'DEV', time: Date.parse(x.published_at),
            score: x.public_reactions_count || 0, comments: x.comments_count || 0,
            image: img, topic: (Array.isArray(x.tag_list) && x.tag_list[0]) || ''
          };
        }).filter(Boolean);
      });
  }

  TP.getNews = function () {
    var fresh = cacheGet('news', NEWS_TTL);
    if (fresh) return Promise.resolve(fresh);
    if (_newsFlight) return _newsFlight;

    _newsFlight = Promise.all([
      fetchHN(15).catch(function () { return []; }),
      fetchDev(15).catch(function () { return []; })
    ])
      .then(function (r) {
        _newsFlight = null;
        var out = [], i = 0, max = Math.max(r[0].length, r[1].length);
        for (; i < max; i++) {
          if (r[0][i]) out.push(r[0][i]);
          if (r[1][i]) out.push(r[1][i]);
        }
        if (out.length) {
          cacheSet('news', out);
        } else {
          var stale = cacheGet('news', NEWS_TTL_STALE);
          if (stale) return stale;
        }
        return out;
      })
      .catch(function () {
        _newsFlight = null;
        return cacheGet('news', NEWS_TTL_STALE) || [];
      });

    return _newsFlight;
  };

  var NEWS_PAGES = { 'home': true, 'news': true };

  /* ---------- Layout: header with drop-down menus, footer ---------- */
  function newsletterHtml() {
    return '<form class="tp-news-form" data-newsletter>' +
      '<h3>New guides by email</h3><p>Practical repair and ESP32 guides, straight to your inbox.</p>' +
      '<input type="hidden" name="access_key" value="' + R.esc(C.FORM_KEY) + '">' +
      '<input type="hidden" name="subject" value="TechPulse newsletter signup">' +
      '<input type="hidden" name="from_name" value="TechPulse Newsletter">' +
      '<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" style="display:none">' +
      '<div class="tp-nl-row"><input type="email" name="email" required autocomplete="email" placeholder="you@example.com" aria-label="Email address">' +
      '<button type="submit">Subscribe</button></div>' +
      '<small>We only use your email to send new guides.</small><p class="tp-nl-status" aria-live="polite"></p></form>';
  }
  TP.newsletterHtml = newsletterHtml;

  function layout() {
    var page = document.body.getAttribute('data-page') || '';
    var cat = document.body.getAttribute('data-cat') || '';
    var h = $('#tp-header'), f = $('#tp-footer');
    if (h) {
      var items = C.CATEGORIES.map(function (c) {
        var on = c.name === cat;
        return '<li class="tp-dd' + (on ? ' on' : '') + '"><a href="/c/' + c.slug + '.html">' + c.icon + ' ' + R.esc(c.name) + '</a>' +
          '<button type="button" class="tp-dd-btn" aria-expanded="false" aria-label="Show ' + R.esc(c.name) + ' topics">▾</button>' +
          '<div class="tp-menu">' + c.subs.map(function (s) {
            return '<a href="/c/' + c.slug + '.html?sub=' + encodeURIComponent(s) + '">' + R.esc(s) + '</a>';
          }).join('') + '<a class="tp-menu-all" href="/c/' + c.slug + '.html">All ' + R.esc(c.name) + ' →</a></div></li>';
      }).join('');

      var tickerHtml = NEWS_PAGES[page]
        ? '<div class="ticker" id="tpTicker" role="region" aria-label="Latest tech headlines"><span class="ticker-label">Live</span>' +
          '<div class="ticker-viewport"><div class="ticker-track" id="tpTickerTrack"><span class="ticker-item"><a href="/articles.html">Loading the latest tech headlines…</a></span></div></div>' +
          '<button type="button" class="ticker-close" id="tpTickerClose" aria-label="Hide news bar">×</button></div>'
        : '';

      h.outerHTML =
        tickerHtml +
        '<header class="main-header"><div class="container tp-hbar"><div class="logo"><a href="/" aria-label="TechPulse home">' +
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg><span>TechPulse</span></a></div>' +
        '<nav class="tp-nav" id="tpNav" aria-label="Main navigation"><ul>' + items +
        '<li><a href="/news.html"' + (page === 'news' ? ' class="active"' : '') + '>📰 Tech News</a></li></ul></nav>' +
        '<div class="tp-hbar-right"><button type="button" id="tpNavToggle" class="tp-iconbtn tp-burger" aria-expanded="false" aria-controls="tpNav" aria-label="Open menu">☰</button>' +
        '<button type="button" id="darkModeToggle" aria-pressed="false" aria-label="Toggle dark mode">🌙</button></div></div></header>';
    }
    if (f) {
      f.outerHTML =
        '<footer id="tp-footer" class="main-footer tp-footer"><div class="container tp-foot">' +
        '<div><strong class="tp-foot-logo">' + R.esc(C.SITE_NAME) + '</strong><p>Practical guides for home repair, smart tech, automotive care and electronics projects.</p></div>' +
        '<div><h4>Guides</h4>' + C.CATEGORIES.map(function (c) { return '<a href="/c/' + c.slug + '.html">' + R.esc(c.name) + '</a>'; }).join('') + '</div>' +
        '<div><h4>TechPulse</h4><a href="/about.html">About</a><a href="/editorial-policy.html">Editorial Policy</a><a href="/contact.html">Contact</a><a href="/news.html">Tech News</a></div>' +
        '<div><h4>More</h4><a href="/privacy-policy.html">Privacy Policy</a><a href="/terms.html">Terms</a><a href="/rss.xml">RSS</a><a href="/sitemap.xml">Sitemap</a></div>' +
        '</div><div class="container tp-foot-bottom">&copy; ' + new Date().getFullYear() + ' TechPulse. Guides are for general information — work safely.</div></footer>';
    }
    /* Mobile nav toggle */
    var navBtn = document.getElementById('tpNavToggle'), nav = document.getElementById('tpNav');
    if (navBtn && nav) {
      navBtn.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    /* Drop-down menus */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.tp-dd-btn');
      if (btn) {
        var dd = btn.closest('.tp-dd');
        var open = dd.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.querySelectorAll('.tp-dd.open').forEach(function (el) {
          if (el !== dd) {
            el.classList.remove('open');
            var ob = el.querySelector('.tp-dd-btn');
            if (ob) ob.setAttribute('aria-expanded', 'false');
          }
        });
        return;
      }
      if (!e.target.closest('.tp-dd')) {
        document.querySelectorAll('.tp-dd.open').forEach(function (el) {
          el.classList.remove('open');
          var ob = el.querySelector('.tp-dd-btn');
          if (ob) ob.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  function theme() {
    var btn = $('#darkModeToggle');
    function sync() {
      var d = document.documentElement.classList.contains('dark-theme');
      if (btn) { btn.textContent = d ? '☀️' : '🌙'; btn.setAttribute('aria-pressed', d ? 'true' : 'false'); }
    }
    sync();
    if (btn) btn.addEventListener('click', function () {
      var d = document.documentElement.classList.toggle('dark-theme');
      try { localStorage.setItem('tp_theme', d ? 'dark' : 'light'); } catch (e) {}
      sync();
    });
  }

  /* ---------- Ticker — only runs on home and news pages ---------- */
  function ticker() {
    var box = $('#tpTicker'), track = $('#tpTickerTrack');
    if (!box) return;
    try { if (sessionStorage.getItem('tp_ticker_off')) { box.style.display = 'none'; return; } } catch (e) {}
    var closeBtn = $('#tpTickerClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        box.style.display = 'none';
        try { sessionStorage.setItem('tp_ticker_off', '1'); } catch (e) {}
      });
    }

    Promise.all([TP.getArticles({ limit: 3 }).catch(function () { return []; }), TP.getNews().catch(function () { return []; })])
      .then(function (r) {
        var items = r[0].map(function (a) {
          return '<span class="ticker-item"><a href="' + R.articlePath(a.slug) + '"><b class="tk-tag tk-new">NEW</b>' + R.esc(a.title) + '</a></span>';
        });
        r[1].slice(0, 14).forEach(function (n) {
          items.push('<span class="ticker-item"><a href="' + R.esc(n.url) + '" target="_blank" rel="noopener noreferrer">' +
            '<b class="tk-tag tk-' + n.tag.toLowerCase() + '">' + n.tag + '</b>' + R.esc(n.title) +
            ' <small>· ' + TP.timeAgo(n.time) + '</small></a></span>');
        });
        if (!items.length) { box.style.display = 'none'; return; }
        var html = items.join('');
        track.innerHTML = html + html.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ');
        var dur = Math.max(40, Math.round(track.scrollWidth / 2 / 60));
        track.style.animationDuration = dur + 's';
      });
  }

  /* ---------- Article extras (static pages + article.html) ---------- */
  TP.initRelated = function (slug, category) {
    var box = $('#related');
    if (!box) return;
    TP.getArticles({ category: category, excludeSlug: slug, limit: 3 }).then(function (a) {
      if (a.length >= 3) return a;
      return TP.getArticles({ excludeSlug: slug, limit: 6 }).then(function (more) {
        var seen = {}; a.forEach(function (x) { seen[x.id] = 1; });
        return a.concat(more.filter(function (x) { return !seen[x.id]; })).slice(0, 3);
      });
    }).then(function (list) {
      if (!list.length) return;
      box.innerHTML = '<h2>Keep reading</h2><div class="articles-grid">' + list.map(function (x) { return R.cardHtml(x); }).join('') + '</div>';
    }).catch(function () {});
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]');
    if (!b) return;
    var txt = b.getAttribute('data-copy');
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () {
      b.textContent = 'Copied ✓'; setTimeout(function () { b.textContent = 'Copy link'; }, 1800);
    }).catch(function () { window.prompt('Copy this link:', txt); });
  });

  /* ---------- Sidebar (article pages): most popular + newsletter + topics ---------- */
  TP.initSidebar = function (slug) {
    var box = $('#sidebar');
    if (!box) return;
    var topics = '<section class="tp-side-card"><h3>Explore</h3><div class="tp-chips" style="justify-content:flex-start">' +
      C.CATEGORIES.map(function (c) { return '<a class="tp-chip" href="/c/' + c.slug + '.html">' + c.icon + ' ' + R.esc(c.name) + '</a>'; }).join('') + '</div></section>';
    box.innerHTML = '<section class="tp-side-card">' + newsletterHtml() + '</section>' + topics;
    TP.getArticles({ limit: 6, order: 'views.desc,published_at.desc', excludeSlug: slug }).then(function (list) {
      list = list.slice(0, 5);
      if (!list.length) return;
      box.insertAdjacentHTML('afterbegin', '<section class="tp-side-card"><h3>Most Popular</h3>' + R.popularHtml(list) + '</section>');
    }).catch(function () {});
  };

  /* ---------- Delegated interactions ---------- */
  function playVideo(v) {
    var id = v.getAttribute('data-yt');
    if (!id || v.classList.contains('on')) return;
    v.classList.add('on');
    v.removeAttribute('role');
    v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="Video" ' +
      'allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
  }
  document.addEventListener('click', function (e) {
    var v = e.target.closest && e.target.closest('[data-yt]');
    if (v) return playVideo(v);
    var c = e.target.closest && e.target.closest('[data-copy-code]');
    if (c) {
      var code = c.parentNode.querySelector('code');
      (navigator.clipboard && code ? navigator.clipboard.writeText(code.textContent) : Promise.reject()).then(function () {
        c.textContent = 'Copied ✓'; setTimeout(function () { c.textContent = 'Copy'; }, 1600);
      }).catch(function () { c.textContent = 'Press Ctrl+C'; });
    }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-yt]')) { e.preventDefault(); playVideo(e.target); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.matches || !f.matches('form[data-newsletter]')) return;
    e.preventDefault();
    var st = f.querySelector('.tp-nl-status'), btn = f.querySelector('button[type=submit]');
    btn.disabled = true; st.textContent = 'Sending…';
    fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (d) { st.textContent = d.success ? '✓ Thanks! We\'ll send you new guides when they\'re ready.' : 'Could not subscribe. Please try again later.'; if (d.success) f.reset(); })
      .catch(function () { st.textContent = 'Could not subscribe. Please try again later.'; })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- Analytics (GA4) ---------- */
  function analytics() {
    if (!C.GA_ID || /^(localhost|127\.)/.test(location.hostname) || document.body.getAttribute('data-page') === 'admin') return;
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', C.GA_ID, { anonymize_ip: true });
  }

  layout();
  theme();
  ticker();
  analytics();

  var body = document.body;
  TP.trackPageView();
  if (body.getAttribute('data-slug')) {
    TP.trackView(body.getAttribute('data-slug'));
    TP.initRelated(body.getAttribute('data-slug'), body.getAttribute('data-cat'));
    TP.initSidebar(body.getAttribute('data-slug'));
  }
})();
