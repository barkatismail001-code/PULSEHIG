/* article.html?slug=...  — live renderer used until the static /a/<slug>.html page is built. */
(function () {
  'use strict';
  var TP = window.TP, R = TP.R, $ = TP.$;
  var slug = (new URLSearchParams(location.search).get('slug') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  var root = $('#articleRoot');

  function meta(sel, attr, val) {
    var el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  }
  function notFound() {
    document.title = 'Article not found | TechPulse';
    var sb = $('#sidebar'); if (sb) sb.innerHTML = '';
    meta('meta[name="robots"]', 'content', 'noindex, nofollow');
    root.innerHTML = '<div class="tp-empty"><h1>Article not found</h1><p>It may have been removed or is not published yet.</p>' +
      '<p style="margin-top:16px"><a class="btn-primary" href="/articles.html">Browse all articles</a></p></div>';
  }
  if (!slug) return notFound();

  TP.getArticle(slug).then(function (a) {
    if (!a) return notFound();
    var url = R.absUrl(R.articlePath(a.slug));
    document.title = a.title + ' | TechPulse';
    meta('meta[name="description"]', 'content', a.excerpt || a.title);
    meta('link[rel="canonical"]', 'href', url);
    meta('meta[property="og:title"]', 'content', a.title);
    meta('meta[property="og:description"]', 'content', a.excerpt || a.title);
    meta('meta[property="og:url"]', 'content', url);
    if (a.cover_image) meta('meta[property="og:image"]', 'content', a.cover_image);
    root.innerHTML = R.articleHtml(a);
    TP.trackView(a.slug);
    TP.initRelated(a.slug, a.category);
    TP.initSidebar(a.slug);
  }).catch(function () {
    root.innerHTML = '<div class="tp-empty">Could not load the article. Please refresh.</div>';
  });
})();
