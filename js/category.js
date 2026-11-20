/* Category page (/c/<slug>.html): sub-topic chips + article grid with "load more". */
(function () {
  'use strict';
  var TP = window.TP, R = TP.R, C = TP.C, $ = TP.$;
  var cat = C.CATEGORIES.filter(function (c) { return c.name === document.body.getAttribute('data-cat'); })[0];
  if (!cat) return;
  var PAGE = 12, offset = 0, busy = false;
  var sub = new URLSearchParams(location.search).get('sub') || '';
  if (cat.subs.indexOf(sub) < 0) sub = '';
  var list = $('#list'), more = $('#more');

  function chips() {
    var all = [''].concat(cat.subs);
    $('#subChips').innerHTML = all.map(function (s) {
      return '<button type="button" class="tp-chip' + (sub === s ? ' active' : '') + '" data-sub="' + R.esc(s) + '">' + R.esc(s || 'All ' + cat.name) + '</button>';
    }).join('');
  }
  function load(reset) {
    if (busy) return;
    busy = true;
    if (reset) { offset = 0; list.innerHTML = '<div class="loading-state" role="status">Loading…</div>'; more.hidden = true; }
    TP.getArticles({ limit: PAGE, probe: true, offset: offset, category: cat.name, subcategory: sub })
      .then(function (rows) {
        var hasMore = rows.length > PAGE;
        rows = rows.slice(0, PAGE);
        if (reset) list.innerHTML = '';
        if (reset && !rows.length) {
          list.innerHTML = '<div class="tp-empty" style="grid-column:1/-1">No articles here yet — new guides are added regularly.</div>';
        } else {
          list.insertAdjacentHTML('beforeend', rows.map(function (a) { return R.cardHtml(a); }).join(''));
        }
        offset += rows.length;
        more.hidden = !hasMore;
      })
      .catch(function () { list.innerHTML = '<div class="tp-empty" style="grid-column:1/-1">Could not load articles. Please refresh.</div>'; })
      .then(function () { busy = false; });
  }
  $('#subChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sub]');
    if (!b) return;
    sub = b.getAttribute('data-sub');
    history.replaceState(null, '', location.pathname + (sub ? '?sub=' + encodeURIComponent(sub) : ''));
    $('#subTitle').textContent = sub || 'Latest in ' + cat.name;
    chips(); load(true);
  });
  more.addEventListener('click', function () { load(false); });
  $('#subTitle').textContent = sub || 'Latest in ' + cat.name;
  chips(); load(true);
})();
