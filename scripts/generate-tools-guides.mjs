// TechPulse — Generate static pages for Tools + Guides
// Run: node scripts/generate-tools-guides.mjs
//
// Creates:
//   /tools/<slug>.html     (one per tool from data/tools.json)
//   /guides/<slug>.html    (one per guide from data/guides.json)
//
// Each page has:
//   - Full Schema.org (HowTo for guides, SoftwareApplication for tools)
//   - hreflang for all languages
//   - Full meta tags (OG, Twitter, canonical)
//   - Interactive JavaScript loaded with defer

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';
const SITE_NAME = 'TechPulse';
const ASSET_V = '20261007';
const DEFAULT_IMG = SITE + '/assets/og-default.png';

const LANGS = {
  en: { name: 'English', htmlLang: 'en' },
  zh: { name: '中文', htmlLang: 'zh-CN' },
  es: { name: 'Español', htmlLang: 'es' },
  hi: { name: 'हिन्दी', htmlLang: 'hi' },
  fr: { name: 'Français', htmlLang: 'fr' },
  pt: { name: 'Português', htmlLang: 'pt' }
};

const NAV = '<a href="/index.html">Home</a><a href="/academy.html">Academy</a><a href="/tools.html">Tools</a><a href="/best-picks.html">Best Picks</a><a href="/guides.html">Guides</a><a href="/qa.html">Q&amp;A</a><a href="/forum.html">Forum</a><a href="/news.html">News</a><button id="darkModeToggle" type="button" aria-pressed="false" aria-label="Switch theme">🌙</button>';

const esc = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' }[c]));

const plain = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function exists(p) { try { await access(p); return true; } catch { return false; } }

function buildHreflang(url, titleI18n) {
  const availableLangs = ['en'].concat(Object.keys(LANGS).filter((l) => l !== 'en' && titleI18n && titleI18n[l]));
  const tags = availableLangs.map((lang) => {
    const href = lang === 'en' ? url : url + '?lang=' + lang;
    return '  <link rel="alternate" hreflang="' + (LANGS[lang] ? LANGS[lang].htmlLang : lang) + '" href="' + href + '">';
  }).join('\n');
  return tags + '\n  <link rel="alternate" hreflang="x-default" href="' + url + '">';
}

/* ==========================================================
   TOOL PAGE
   ========================================================== */
function toolPage(tool) {
  const slug = tool.slug || tool.id;
  const url = SITE + '/tools/' + slug + '.html';
  const title = tool.title || '';
  const description = tool.description || '';
  const category = tool.category || 'Engineering';
  const icon = tool.icon || '🔧';

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: title,
        description: description,
        url: url,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web Browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: SITE + '/assets/og-default.png' }
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Tools', item: SITE + '/tools.html' },
          { '@type': 'ListItem', position: 3, name: title, item: url }
        ]
      }
    ]
  };

  const hreflang = buildHreflang(url, tool.title_i18n);

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | Free Online Calculator | ${SITE_NAME}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="${esc((tool.keywords || []).join(', '))}">
  <link rel="canonical" href="${url}">
${hreflang}
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${DEFAULT_IMG}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#2563eb">
  <link rel="stylesheet" href="/css/style.css?v=${ASSET_V}">
  <script>try{if(localStorage.getItem("tp_theme")==="dark")document.documentElement.classList.add("dark-theme")}catch(e){}</script>
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <div class="ticker" aria-label="Tools ticker">
    <span class="ticker-label">🛠️ Tool</span>
    <div class="ticker-track" id="tickerTrack" aria-hidden="true"></div>
  </div>

  <header class="main-header">
    <div class="container">
      <div class="logo">
        <a href="/index.html" aria-label="${SITE_NAME} Home">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>${SITE_NAME}</span>
        </a>
      </div>
      <nav class="nav-links" aria-label="Main navigation">${NAV}</nav>
    </div>
  </header>

  <main class="container">
    <div class="tool-page-wrap" style="max-width:780px;margin:24px auto 60px">
      <nav class="breadcrumb" style="margin-bottom:16px" aria-label="Breadcrumb">
        <a href="/index.html">Home</a> &gt; <a href="/tools.html">Tools</a> &gt; <span>${esc(title)}</span>
      </nav>

      <div class="tool-hero" style="background:var(--bg-alt);border:1px solid var(--border);border-radius:16px;padding:32px;margin-bottom:24px">
        <div style="font-size:3rem;line-height:1;margin-bottom:8px">${icon}</div>
        <span class="tool-cat-badge" style="display:inline-block;background:var(--primary-soft);color:var(--primary);font-size:0.72rem;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase">${esc(category)}</span>
        <h1 style="font-size:clamp(1.4rem,3vw,1.9rem);margin:10px 0">${esc(title)}</h1>
        <p style="color:var(--text-muted);line-height:1.6">${esc(description)}</p>
      </div>

      <div class="tool-card" id="toolContainer" style="background:var(--bg-alt);border:1px solid var(--border);border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <p class="loading-state">Loading calculator...</p>
      </div>
    </div>
  </main>

  <footer class="main-footer">
    <div class="container">
      <p>&copy; 2026 ${SITE_NAME}. All rights reserved.</p>
      <div class="footer-links">
        <a href="/about.html">About</a>
        <a href="/contact.html">Contact</a>
        <a href="/privacy-policy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
      </div>
    </div>
  </footer>

  <button id="scrollTopBtn" type="button" aria-label="Scroll to top">↑</button>

  <script src="/js/live-news.js?v=${ASSET_V}"></script>
  <script src="/js/common.js?v=${ASSET_V}"></script>
  <script src="/js/i18n.js?v=${ASSET_V}"></script>
  <script src="/js/tool-engine.js?v=${ASSET_V}" defer></script>
  <script>
    // Auto-render the calculator for this tool
    (function () {
      var SLUG = ${JSON.stringify(slug)};
      document.addEventListener('DOMContentLoaded', function () {
        // Prefill the tool loader with this slug
        if (window.location.search.indexOf('slug=') === -1) {
          history.replaceState(null, '', '/tool.html?slug=' + encodeURIComponent(SLUG));
        }
      });
    })();
  </script>
  <script src="/tool.html?v=${ASSET_V}" type="text/html" id="redirect-note"></script>
  <script>
    // Redirect to the working dynamic page while keeping URL clean for SEO
    // The static page provides SEO; users land on the interactive version.
    (function () {
      var SLUG = ${JSON.stringify(slug)};
      var target = '/tool.html?slug=' + encodeURIComponent(SLUG);
      // We keep this static page for Google, but if JS is enabled, redirect on click
      document.querySelectorAll('a[href="/tool.html"]').forEach(function (a) { a.href = target; });
    })();
  </script>
</body>
</html>
`;
}

/* ==========================================================
   GUIDE PAGE
   ========================================================== */
function guidePage(guide) {
  const slug = guide.slug || guide.id;
  const url = SITE + '/guides/' + slug + '.html';
  const title = guide.title || '';
  const description = guide.description || '';
  const category = guide.category || 'DIY';
  const icon = guide.icon || '📖';
  const difficulty = guide.difficulty || 'Beginner';
  const time = guide.time_minutes || 0;
  const cost = guide.cost_usd || 0;
  const tools = Array.isArray(guide.tools) ? guide.tools : [];
  const parts = Array.isArray(guide.parts) ? guide.parts : [];

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        name: title,
        description: description,
        url: url,
        image: DEFAULT_IMG,
        totalTime: 'PT' + time + 'M',
        estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: cost },
        tool: tools.map((t) => ({ '@type': 'HowToTool', name: t })),
        supply: parts.map((p) => ({ '@type': 'HowToSupply', name: p })),
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: SITE + '/assets/og-default.png' }
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: SITE + '/guides.html' },
          { '@type': 'ListItem', position: 3, name: title, item: url }
        ]
      }
    ]
  };

  const hreflang = buildHreflang(url, guide.title_i18n);

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | Step-by-Step DIY Guide | ${SITE_NAME}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="${esc((guide.keywords || []).join(', '))}">
  <link rel="canonical" href="${url}">
${hreflang}
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${DEFAULT_IMG}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#2563eb">
  <link rel="stylesheet" href="/css/style.css?v=${ASSET_V}">
  <script>try{if(localStorage.getItem("tp_theme")==="dark")document.documentElement.classList.add("dark-theme")}catch(e){}</script>
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <div class="ticker" aria-label="Guides ticker">
    <span class="ticker-label">🛠️ Guide</span>
    <div class="ticker-track" id="tickerTrack" aria-hidden="true"></div>
  </div>

  <header class="main-header">
    <div class="container">
      <div class="logo">
        <a href="/index.html" aria-label="${SITE_NAME} Home">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>${SITE_NAME}</span>
        </a>
      </div>
      <nav class="nav-links" aria-label="Main navigation">${NAV}</nav>
    </div>
  </header>

  <main class="container">
    <div class="guide-page-wrap" style="max-width:900px;margin:24px auto 60px">
      <nav class="breadcrumb" style="margin-bottom:16px" aria-label="Breadcrumb">
        <a href="/index.html">Home</a> &gt; <a href="/guides.html">Guides</a> &gt; <span>${esc(title)}</span>
      </nav>

      <div style="background:linear-gradient(135deg,#1e3a8a 0%,#4c1d95 100%);color:#fff;border-radius:16px;padding:36px 32px;margin-bottom:24px">
        <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px">
          <div style="font-size:3.5rem;line-height:1">${icon}</div>
          <div style="flex:1">
            <span style="display:inline-block;background:rgba(255,255,255,0.15);color:#fff;font-size:0.75rem;font-weight:700;padding:5px 12px;border-radius:6px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.2)">${esc(category)} · ${esc(difficulty)}</span>
            <h1 style="font-size:clamp(1.4rem,3vw,2rem);margin:0 0 12px;line-height:1.2">${esc(title)}</h1>
            <p style="opacity:0.92;line-height:1.6;margin:0">${esc(description)}</p>
          </div>
        </div>
        <div style="display:flex;gap:28px;flex-wrap:wrap;padding-top:24px;margin-top:20px;border-top:1px solid rgba(255,255,255,0.2)">
          <div><div style="font-size:1.6rem;font-weight:900;color:#fbbf24">${time}</div><div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;opacity:0.85">minutes</div></div>
          <div><div style="font-size:1.6rem;font-weight:900;color:#fbbf24">$${cost}</div><div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;opacity:0.85">estimated cost</div></div>
          <div><div style="font-size:1.6rem;font-weight:900;color:#fbbf24">${parts.length}</div><div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;opacity:0.85">parts</div></div>
        </div>
      </div>

      <div class="guide-container" id="guideContainer">
        <p class="loading-state">Loading guide...</p>
      </div>
    </div>
  </main>

  <footer class="main-footer">
    <div class="container">
      <p>&copy; 2026 ${SITE_NAME}. All rights reserved.</p>
      <div class="footer-links">
        <a href="/about.html">About</a>
        <a href="/contact.html">Contact</a>
        <a href="/privacy-policy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
      </div>
    </div>
  </footer>

  <button id="scrollTopBtn" type="button" aria-label="Scroll to top">↑</button>

  <script src="/js/live-news.js?v=${ASSET_V}"></script>
  <script src="/js/common.js?v=${ASSET_V}"></script>
  <script src="/js/i18n.js?v=${ASSET_V}"></script>
  <script src="/js/tool-engine.js?v=${ASSET_V}" defer></script>
  <script>
    // Redirect to interactive version while keeping clean URL for SEO
    (function () {
      var SLUG = ${JSON.stringify(slug)};
      if (!new URLSearchParams(location.search).has('slug')) {
        history.replaceState(null, '', '/guide.html?slug=' + encodeURIComponent(SLUG));
        // Now load the interactive guide engine
        var s = document.createElement('script');
        s.src = '/js/guide-page.js?v=${ASSET_V}';
        s.defer = true;
        document.head.appendChild(s);
      }
    })();
  </script>
</body>
</html>
`;
}

/* ==========================================================
   MAIN
   ========================================================== */
async function main() {
  // Ensure directories exist
  await mkdir(join(ROOT, 'tools'), { recursive: true });
  await mkdir(join(ROOT, 'guides'), { recursive: true });

  // Load data
  let tools = [];
  let guides = [];

  try {
    tools = JSON.parse(await readFile(join(ROOT, 'data/tools.json'), 'utf8'));
    if (!Array.isArray(tools)) tools = [];
  } catch (e) {
    console.warn('Could not load data/tools.json:', e.message);
  }

  try {
    guides = JSON.parse(await readFile(join(ROOT, 'data/guides.json'), 'utf8'));
    if (!Array.isArray(guides)) guides = [];
  } catch (e) {
    console.warn('Could not load data/guides.json:', e.message);
  }

  // Generate tool pages
  let toolCount = 0;
  for (const tool of tools) {
    const slug = tool.slug || tool.id;
    if (!slug) continue;
    const html = toolPage(tool);
    await writeFile(join(ROOT, 'tools', slug + '.html'), html);
    toolCount++;
  }
  console.log('✓ ' + toolCount + ' tool pages written');

  // Generate guide pages
  let guideCount = 0;
  for (const guide of guides) {
    const slug = guide.slug || guide.id;
    if (!slug) continue;
    const html = guidePage(guide);
    await writeFile(join(ROOT, 'guides', slug + '.html'), html);
    guideCount++;
  }
  console.log('✓ ' + guideCount + ' guide pages written');

  console.log('\n✅ Done. Total: ' + toolCount + ' tools, ' + guideCount + ' guides');
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});