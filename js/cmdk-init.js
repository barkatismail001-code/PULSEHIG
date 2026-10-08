/* TechPulse CmdK Init + Auto-Dark Mode v20261010 */
(function () {
  'use strict';

  // --- Command Palette ---
  if (window.TPCommandPalette) {
    // دعم ?q= في URL
    try {
      var params = new URLSearchParams(location.search);
      var q = params.get('q');
      if (q && location.pathname.match(/\/(index|articles)\.html$/)) {
        setTimeout(function () { var inp = document.getElementById('searchInput'); if (inp) { inp.value = q; inp.dispatchEvent(new Event('input')); } }, 500);
      }
    } catch (e) {}

    // Hint dismiss
    var hint = document.getElementById('tpCmdkHint');
    if (hint) {
      if (localStorage.getItem('tp_cmdk_hint_seen') === '1') hint.classList.add('hidden');
      hint.addEventListener('click', function () {
        window.TPCommandPalette.open();
        hint.classList.add('hidden');
        try { localStorage.setItem('tp_cmdk_hint_seen', '1'); } catch (e) {}
      });
      // أخفِ تلقائياً بعد أول فتح
      document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          hint.classList.add('hidden');
          try { localStorage.setItem('tp_cmdk_hint_seen', '1'); } catch (e) {}
        }
      });
    }

    // حمِّل الفهرس
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { window.TPCommandPalette.load(); });
    } else {
      window.TPCommandPalette.load();
    }
  }

  // --- Auto Dark Mode ---
  var autoKey = 'tp_auto_theme';
  if (localStorage.getItem(autoKey) === 'off') return;
  // لا تعمل إن كان المستخدم قد اختار يدوياً
  if (localStorage.getItem('tp_theme')) return;

  function applyByTime() {
    var h = new Date().getHours();
    var wantDark = (h >= 19 || h < 7);
    var root = document.documentElement;
    var isDark = root.classList.contains('dark-theme');
    if (wantDark !== isDark) {
      root.classList.toggle('dark-theme', wantDark);
      var btn = document.getElementById('darkModeToggle');
      if (btn) { btn.textContent = wantDark ? '\u2600\uFE0F' : '\u{1F319}'; btn.setAttribute('aria-pressed', String(wantDark)); }
    }
  }
  applyByTime();
  setInterval(applyByTime, 10 * 60 * 1000); // كل 10 دقائق
})();
