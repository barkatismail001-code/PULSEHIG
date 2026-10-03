/* ==========================================================================
   TechPulse - interactivity for the static SEO pages (/a/<slug>.html)
   The article text is plain HTML (fast + crawlable). This script only adds:
   real view counter, visit counter, like, save, share and (lazy) comments.
   Requires js/common.js.
   ========================================================================== */
(function () {
  'use strict';
  var C = window.TPCommon;
  var art = document.querySelector('article.single-article') || document.querySelector('article') || document.querySelector('main') || document.body;
  if (!C || !art) return;

  // Generated pages carry data-id. A hand-written page without it gets "m-<slug>" from its URL.
  var pm = location.pathname.match(/\/a\/([^\/]+?)(?:\.html)?\/?$/);
  var id = art.getAttribute('data-id') || (pm ? 'm-' + decodeURIComponent(pm[1]) : '');
  if (!id) return;
  var h1 = art.querySelector('h1') || document.querySelector('h1');
  var title = h1 ? h1.textContent : document.title;
  var canonEl = document.querySelector('link[rel="canonical"]');
  var pageUrl = canonEl ? canonEl.href : location.origin + location.pathname;

  C.initDarkMode();
  C.trackAndGetSiteStats(); // visit counted once per session, also for visitors arriving from Google

  // Real view counter (one view per session)
  var wrap = document.getElementById('tpViewsWrap');
  var num = document.getElementById('tpViews');
  C.registerView(id).then(function (v) {
    if (num) num.textContent = v;
    if (wrap) wrap.hidden = false;
  });

  // Like
  var likeBtn = document.getElementById('tpLike');
  function paintLike() {
    if (!likeBtn) return;
    var liked = C.hasLiked(id);
    likeBtn.classList.toggle('liked', liked);
    likeBtn.innerHTML = (liked ? '\u2764\uFE0F' : '\uD83E\uDD0D') + ' <span class="like-count">' + C.getLikeCount(id) + '</span>';
  }
  if (likeBtn) {
    paintLike();
    likeBtn.addEventListener('click', function () { C.toggleLike(id); paintLike(); });
  }

  // Save (bookmark)
  var saveBtn = document.getElementById('tpSave');
  function paintSave() {
    if (saveBtn) saveBtn.textContent = (C.isBookmarked(id) ? '\uD83D\uDCCC' : '\uD83D\uDD16') + ' Save';
  }
  if (saveBtn) {
    paintSave();
    saveBtn.addEventListener('click', function () { C.toggleBookmark(id, title); paintSave(); });
  }

  // Share
  document.querySelectorAll('.share-btn[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.dataset.share;
      var url = encodeURIComponent(pageUrl);
      var t = encodeURIComponent(title);
      if (type === 'copy') {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(pageUrl).then(function () {
            btn.textContent = '\u2713 Copied!';
            setTimeout(function () { btn.textContent = '\uD83D\uDD17 Copy Link'; }, 1800);
          });
        }
        return;
      }
      var map = {
        twitter: 'https://twitter.com/intent/tweet?text=' + t + '&url=' + url,
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
        whatsapp: 'https://wa.me/?text=' + t + '%20' + url
      };
      if (map[type]) window.open(map[type], '_blank', 'noopener,noreferrer,width=600,height=500');
    });
  });

  // Comments: loaded only when the reader scrolls near them (keeps the page fast)
  var box = document.getElementById('commentsContainer');
  var loaded = false;
  function loadComments() {
    if (loaded || !box || !C.hasComments()) return;
    loaded = true;
    C.loadDisqusThread(box, { identifier: id, url: pageUrl, title: title });
  }
  if (box) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); loadComments(); }
      }, { rootMargin: '400px 0px' });
      io.observe(box);
    } else {
      loadComments();
    }
  }
})();
