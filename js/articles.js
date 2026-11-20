/* Articles page: search + topic filter + load more. */
(function () {
  'use strict';
  var TP = window.TP, R = TP.R, C = TP.C, $ = TP.$;
  var PAGE = 12, offset = 0, busy = false;
  var params = new URLSearchParams(location.search);
  var state = { q: params.get('q') || '', cat: params.get('cat') || '', kind: params.get('kind') || '' };

  var qEl = $('#q'), list = $('#list'), more = $('#more');
  qEl.value = state.q;

  function chips() {
    var all = [{ name: '', icon: '📚', label: 'All' }].concat(C.CATEGORIES.map(function (c) { return { name: c.name, icon: c.icon, label: c.name }; }));
    $('#catChips').innerHTML = all.map(function (c) {
      return '<button type="button" class="tp-chip' + (state.cat === c.name ? ' active' : '') + '" data-cat="' + R.esc(c.name) + '">' + c.icon + ' ' + R.esc(c.label) + '</button>';
    }).join('');
  }
  function sync() {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.cat) p.set('cat', state.cat);
    if (state.kind) p.set('kind', state.kind);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    document.title = (state.cat ? state.cat + ' — ' : '') + 'Articles | TechPulse';
  }
  function load(reset) {
    if (busy) return;
    busy = true;
    if (reset) { offset = 0; list.innerHTML = '<div class="loading-state" role="status">Loading…</div>'; more.hidden = true; }
    TP.getArticles({ limit: PAGE, probe: true, offset: offset, category: state.cat, search: state.q, kind: state.kind })
      .then(function (rows) {
        var hasMore = rows.length > PAGE;
        rows = rows.slice(0, PAGE);
        if (reset) list.innerHTML = '';
        if (reset && !rows.length) {
          list.innerHTML = '<div class="tp-empty" style="grid-column:1/-1">No articles found. Try another word or topic.</div>';
        } else {
          list.insertAdjacentHTML('beforeend', rows.map(function (a) { return R.cardHtml(a); }).join(''));
        }
        offset += rows.length;
        more.hidden = !hasMore;
      })
      .catch(function () { list.innerHTML = '<div class="tp-empty" style="grid-column:1/-1">Could not load articles. Please refresh.</div>'; })
      .then(function () { busy = false; });
  }

  var timer;
  qEl.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { state.q = qEl.value.trim(); sync(); load(true); }, 300);
  });
  $('#catChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    state.cat = b.getAttribute('data-cat');
    chips(); sync(); load(true);
  });
  more.addEventListener('click', function () { load(false); });

  chips(); sync(); load(true);
})();
