/* ==========================================================================
   TechPulse — Newsletter (newsletter.js) v20261005
   Buttondown-based newsletter subscription with graceful fallbacks.
   Can be loaded standalone or used with common.js's subscribeNewsletter().
   ========================================================================== */
window.TPNewsletter = (function () {
  'use strict';

  var USERNAME = 'jonsrocky';

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  async function subscribe(email) {
    email = String(email || '').trim();
    if (!isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    var res = await fetch('https://buttondown.email/api/emails/embed-subscribe/' + USERNAME, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, tag: 'techpulse-website' })
    });

    if (!res.ok) {
      var text = await res.text().catch(function () { return ''; });
      throw new Error('Subscription failed: ' + (text || res.status));
    }
    return true;
  }

  function initForm(form, msgEl) {
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';

    var msg = msgEl || form.querySelector('.newsletter-msg');
    var btn = form.querySelector('button[type="submit"]');
    var originalText = btn ? btn.textContent : '';

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var emailInput = form.querySelector('input[type="email"]');
      if (!emailInput) return;

      var email = emailInput.value.trim();
      if (btn) { btn.disabled = true; btn.textContent = '...'; }
      if (msg) { msg.textContent = ''; msg.className = 'newsletter-msg'; }

      try {
        await subscribe(email);
        if (msg) {
          msg.textContent = window.TPI18N ? window.TPI18N.t('newsletter_success') : '✓ Thanks for subscribing!';
          msg.className = 'newsletter-msg';
        }
        if (window.TPCommon && window.TPCommon.showToast) {
          window.TPCommon.showToast(window.TPI18N ? window.TPI18N.t('newsletter_success') : 'Subscribed!');
        }
        form.reset();
      } catch (err) {
        if (msg) {
          msg.textContent = window.TPI18N ? window.TPI18N.t('newsletter_error') : '✗ Something went wrong. Try again.';
          msg.className = 'newsletter-msg error';
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
      }
    });
  }

  function autoInit() {
    document.querySelectorAll('.newsletter-form').forEach(function (form) {
      initForm(form, form.querySelector('.newsletter-msg'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  return {
    subscribe: subscribe,
    initForm: initForm,
    autoInit: autoInit
  };
})();