/* ==========================================================================
   TechPulse — Analytics (analytics.js) v20261005
   Privacy-friendly analytics: Plausible or Umami.
   Loads only on production domain, only after 'load' event.
   Configure by adding BEFORE this file:
     <script>window.TP_ANALYTICS = { plausible: 'pulsehig.com' };</script>
   Or:
     <script>window.TP_ANALYTICS = { umami: 'https://analytics.example.com', umamiId: 'xxx' };</script>
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.TP_ANALYTICS || {};
  if (!CFG.plausible && !CFG.umami) return;

  var allowedHosts = ['pulsehig.com', 'www.pulsehig.com'];
  if (allowedHosts.indexOf(location.hostname) === -1 && !CFG.force) return;

  function loadScript(src, attrs) {
    var s = document.createElement('script');
    s.src = src;
    s.defer = true;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        s.setAttribute(k, attrs[k]);
      });
    }
    document.head.appendChild(s);
  }

  function loadPlausible(domain) {
    loadScript('https://plausible.io/js/script.tagged-events.outbound-links.js', {
      'data-domain': domain
    });
  }

  function loadUmami(url, websiteId) {
    loadScript(url.replace(/\/$/, '') + '/script.js', {
      'data-website-id': websiteId
    });
  }

  window.addEventListener('load', function () {
    if (CFG.plausible) loadPlausible(CFG.plausible);
    if (CFG.umami && CFG.umamiId) loadUmami(CFG.umami, CFG.umamiId);
  });

  window.TPAnalytics = {
    event: function (name, props) {
      if (window.plausible) {
        window.plausible(name, { props: props });
      } else if (window.umami && window.umami.track) {
        window.umami.track(name, props);
      }
    }
  };
})();