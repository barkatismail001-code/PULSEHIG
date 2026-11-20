/* Tech news page: Hacker News + DEV, with a source filter. */
(function () {
  'use strict';
  var TP = window.TP, R = TP.R, $ = TP.$;
  var all = [], src = '';

  function draw() {
    var items = all.filter(function (n) { return !src || n.source === src; });
    if (!items.length) { $('#newsGrid').innerHTML = '<div class="tp-empty" style="grid-column:1/-1">News is unavailable right now. Please try again later.</div>'; return; }
    $('#newsGrid').innerHTML = items.map(function (n) {
      return '<article class="tp-news-card">' +
        (n.image ? '<img src="' + R.esc(n.image) + '" alt="" loading="lazy" decoding="async">' : '') +
        '<div class="body"><div><b class="tk-tag tk-' + n.tag.toLowerCase() + '">' + n.tag + '</b></div>' +
        '<a class="t" href="' + R.esc(n.url) + '" target="_blank" rel="noopener noreferrer">' + R.esc(n.title) + '</a>' +
        '<div class="tp-news-meta">' + R.esc(n.source) + ' · ' + TP.timeAgo(n.time) +
        (n.score != null ? ' · ▲ ' + n.score : '') + (n.comments ? ' · 💬 ' + n.comments : '') +
        (n.discuss ? ' · <a href="' + R.esc(n.discuss) + '" target="_blank" rel="noopener noreferrer">discussion</a>' : '') + '</div></div></article>';
    }).join('');
  }
  function chips() {
    var s = [['', 'All'], ['Hacker News', 'Hacker News'], ['DEV', 'DEV']];
    $('#srcChips').innerHTML = s.map(function (x) {
      return '<button type="button" class="tp-chip' + (src === x[0] ? ' active' : '') + '" data-src="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
  }
  $('#srcChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-src]');
    if (!b) return;
    src = b.getAttribute('data-src'); chips(); draw();
  });
  chips();
  TP.getNews().then(function (r) { all = r; draw(); }).catch(function () { draw(); });
})();
