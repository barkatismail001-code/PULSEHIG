/* Home page: top picks, featured + most popular, explore, symptoms & fixes,
   smart tech + live news, gear reviews, did-you-know, more guides.
   Each section hides itself until it has articles, and no article appears twice
   (except in "Most Popular"). */
(function () {
  'use strict';
  var TP = window.TP, R = TP.R, C = TP.C, $ = TP.$;

  var chips = C.CATEGORIES.map(function (c) {
    return '<a class="tp-chip" href="/c/' + c.slug + '.html">' + c.icon + ' ' + R.esc(c.name) + '</a>';
  }).join('');
  if ($('#homeChips')) $('#homeChips').innerHTML = chips;
  if ($('#tiles')) {
    $('#tiles').innerHTML = C.CATEGORIES.map(function (c) {
      return '<a class="tp-tile" href="/c/' + c.slug + '.html"><span class="ic">' + c.icon + '</span><b>' + R.esc(c.name) + '</b><span>' +
        R.esc(c.subs.slice(0, 4).join(' · ')) + '</span></a>';
    }).join('');
  }
  if ($('#nlBand')) $('#nlBand').innerHTML = TP.newsletterHtml();

  function grid(list) { return list.map(function (a) { return R.cardHtml(a); }).join(''); }
  function take(pool, test, n) {
    var out = pool.filter(test).slice(0, n);
    out.forEach(function (x) {
      var idx = pool.indexOf(x);
      if (idx > -1) pool.splice(idx, 1);
    });
    return out;
  }

  var newsPromise = TP.getNews().catch(function () { return []; });

  function renderTech(tech) {
    var techBox = $('#techBox');
    if (!techBox) return;
    newsPromise.then(function (items) {
      var news = items.slice(0, 7).map(function (n) {
        var safeTag = String(n.tag || 'NEWS').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'news';
        return '<div class="tp-news-item"><b class="tk-tag tk-' + safeTag + '">' + R.esc(n.tag || 'NEWS') + '</b><div>' +
          '<a class="t" href="' + R.esc(n.url) + '" target="_blank" rel="noopener noreferrer">' + R.esc(n.title) + '</a>' +
          '<div class="tp-news-meta">' + R.esc(n.source) + ' · ' + TP.timeAgo(n.time) +
          (n.score != null ? ' · ▲ ' + Number(n.score) : '') + (n.comments ? ' · 💬 ' + Number(n.comments) : '') + '</div></div></div>';
      }).join('') || '<div class="tp-empty">News is unavailable right now.</div>';
      var newsListHtml = '<div class="tp-news-list">' + news + '</div>';
      techBox.innerHTML = tech.length
        ? '<div class="tp-2col"><div class="articles-grid">' + grid(tech) + '</div>' + newsListHtml + '</div>'
        : newsListHtml;
    });
  }

  /* ----- Articles ----- */
  Promise.all([
    TP.getArticles({ limit: 5, order: 'featured.desc,published_at.desc' }),
    TP.getArticles({ limit: 40 }),
    TP.getArticles({ limit: 7, order: 'views.desc,published_at.desc' })
  ]).then(function (r) {
    var picks = r[0] || [], seen = {};
    picks.forEach(function (a) { seen[a.id] = 1; });
    var pool = (r[1] || []).filter(function (a) { return !seen[a.id]; });
    var popular = r[2] || [];

    /* Top picks: one big story + headline rows */
    if ($('#picksBox')) {
      if (!picks.length) {
        $('#picksBox').innerHTML = '<div class="tp-empty">The first guides are on their way. Check back soon!</div>';
      } else {
        var side = picks.slice(1).map(function (a) { return R.rowHtml(a); }).join('');
        $('#picksBox').innerHTML = '<div class="tp-picks">' + R.cardHtml(picks[0], true) +
          (side ? '<div class="tp-picks-side">' + side + '</div>' : '') + '</div>';
      }
    }

    /* Featured stories + Most Popular */
    var feat = pool.splice(0, 4);
    if (feat.length && $('#featBox') && $('#featSection')) {
      $('#featBox').innerHTML = grid(feat);
      if (popular.length >= 3 && $('#popBox') && $('#popSide')) {
        $('#popBox').innerHTML = R.popularHtml(popular);
        $('#popSide').hidden = false;
      }
      $('#featSection').hidden = false;
    }

    /* Symptoms & fixes (diagnosis articles) */
    var diag = take(pool, function (a) { return a.kind === 'diagnosis'; }, 4);
    if (diag.length && $('#diagBox') && $('#diagSection')) {
      $('#diagBox').innerHTML = grid(diag);
      $('#diagSection').hidden = false;
    }

    /* Smart tech cards + live news */
    renderTech(take(pool, function (a) { return a.category === 'Smart Tech'; }, 4));

    /* Gear reviews */
    var gear = take(pool, function (a) { return a.kind === 'review'; }, 4);
    if (gear.length && $('#gearBox') && $('#gearSection')) {
      $('#gearBox').innerHTML = grid(gear);
      $('#gearSection').hidden = false;
    }

    /* Everything else, newest first */
    var more = pool.slice(0, 6);
    if (more.length && $('#moreBox') && $('#moreSection')) {
      $('#moreBox').innerHTML = grid(more);
      $('#moreSection').hidden = false;
    }
  }).catch(function () {
    if ($('#picksBox')) {
      $('#picksBox').innerHTML = '<div class="tp-empty">Could not load articles right now. Please refresh in a moment.</div>';
    }
    renderTech([]);
  });

  /* ----- Did you know ----- */
  var FALLBACK = [
    'The first computer "bug" was a real moth, found stuck in a Harvard Mark II relay in 1947.',
    'On long LED strips the voltage drops along the strip, which is why the far end looks dimmer — feeding power from both ends fixes it.',
    'Never mix bleach with ammonia or with acidic cleaners such as vinegar: the mixture releases toxic gases.'
  ];
  var facts = FALLBACK, cur = -1;
  function showFact(i) {
    cur = i;
    if ($('#dykText')) $('#dykText').textContent = facts[i];
  }
  TP.getFacts().then(function (rows) {
    var list = (rows || []).map(function (x) { return x.text; }).filter(Boolean);
    if (list.length) facts = list;
  }).catch(function () {}).then(function () {
    showFact(Math.floor(Date.now() / 864e5) % facts.length);
  });
  var nextBtn = $('#dykNext');
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (facts.length < 2) return;
      var n;
      do { n = Math.floor(Math.random() * facts.length); } while (n === cur);
      showFact(n);
    });
  }
})();
