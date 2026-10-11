/* ==========================================================================
   TechPulse - Cookie Consent Banner (GDPR + AdSense compliant)
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'tp_cookie_consent';
  var VERSION = '1';

  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data.version !== VERSION) return null;
      return data;
    } catch (e) { return null; }
  }

  function setConsent(accepted) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: VERSION,
        accepted: accepted,
        ts: Date.now()
      }));
    } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById('tp-cookie-style')) return;
    var s = document.createElement('style');
    s.id = 'tp-cookie-style';
    s.textContent = [
      '#tp-cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:99998;background:#0f172a;color:#e2e8f0;padding:16px 20px;box-shadow:0 -4px 20px rgba(0,0,0,.25);font-family:inherit;font-size:.9rem;display:none;border-top:1px solid #1e293b}',
      '#tp-cookie-banner.show{display:block}',
      '#tp-cookie-banner .tp-cc-inner{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between}',
      '#tp-cookie-banner .tp-cc-text{flex:1;min-width:240px;line-height:1.5}',
      '#tp-cookie-banner a{color:#38bdf8;text-decoration:underline}',
      '#tp-cookie-banner .tp-cc-actions{display:flex;gap:8px;flex-shrink:0}',
      '#tp-cookie-banner button{padding:9px 18px;border-radius:8px;font-weight:600;cursor:pointer;border:0;font-family:inherit;font-size:.88rem}',
      '#tp-cookie-banner .tp-cc-accept{background:#2563eb;color:#fff}',
      '#tp-cookie-banner .tp-cc-accept:hover{background:#1d4ed8}',
      '#tp-cookie-banner .tp-cc-reject{background:transparent;color:#94a3b8;border:1px solid #334155}',
      '#tp-cookie-banner .tp-cc-reject:hover{color:#e2e8f0;border-color:#475569}'
    ].join('');
    document.head.appendChild(s);
  }

  function showBanner() {
    injectStyles();
    if (document.getElementById('tp-cookie-banner')) return;
    var b = document.createElement('div');
    b.id = 'tp-cookie-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-live', 'polite');
    b.innerHTML =
      '<div class="tp-cc-inner">' +
        '<div class="tp-cc-text">' +
          'We use cookies to improve your experience, analyze traffic, and serve personalized ads. ' +
          'By clicking "Accept" you consent to our use of cookies. ' +
          'Read our <a href="privacy-policy.html">Privacy Policy</a> for details.' +
        '</div>' +
        '<div class="tp-cc-actions">' +
          '<button type="button" class="tp-cc-reject" id="tp-cc-reject">Reject</button>' +
          '<button type="button" class="tp-cc-accept" id="tp-cc-accept">Accept</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add('show'); });

    document.getElementById('tp-cc-accept').addEventListener('click', function () {
      setConsent(true);
      b.classList.remove('show');
      setTimeout(function () { b.remove(); }, 300);
      // Enable AdSense / analytics here if needed
      if (window.tpOnConsentAccepted) window.tpOnConsentAccepted();
    });
    document.getElementById('tp-cc-reject').addEventListener('click', function () {
      setConsent(false);
      b.classList.remove('show');
      setTimeout(function () { b.remove(); }, 300);
    });
  }

  function init() {
    var consent = getConsent();
    if (consent === null) {
      // Not yet decided
      setTimeout(showBanner, 800);
    }
    // Else user already decided - do nothing
  }

  window.tpGetCookieConsent = getConsent;
  window.tpResetCookieConsent = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();