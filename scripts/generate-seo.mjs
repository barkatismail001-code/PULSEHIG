// TechPulse â€” SEO Build Step (generate-seo.mjs) v20261006
// Generates article pages, series pages, sitemaps, RSS feeds.
// Reads from Supabase (published) + data/manual-articles.json (manual)
// Run: node scripts/generate-seo.mjs

import { readFile, writeFile, mkdir, access, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';
const SITE_NAME = 'TechPulse';
const SITE_DESC = 'Engineering platform for embedded systems, microcontrollers, home repair, and programming.';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
const ASSET_V = '20261006';
const DEFAULT_IMG = SITE + '/assets/og-default.png';

const LANGS = {
  en: { name: 'English', htmlLang: 'en' },
  zh: { name: 'ن¸­و–‡', htmlLang: 'zh-CN' },
  es: { name: 'Espaأ±ol', htmlLang: 'es' },
  hi: { name: 'à¤¹à¤؟à¤¨à¥چà¤¦à¥€', htmlLang: 'hi' },
  fr: { name: 'Franأ§ais', htmlLang: 'fr' },
  pt: { name: 'Portuguأھs', htmlLang: 'pt' }
};

const SERIES = [
  { slug: 'esp32-essential-fixes', title: 'ESP32 Essential Fixes', description: 'The most common ESP32 problems with practical solutions tested on real hardware.', icon: 'ًں”§',
    matchSlugs: ['esp32-deep-sleep-fix', 'esp32-mosfet-dc-motor-control', 'esp32-relay-chatter-fix', 'esp32-wifi-dropping-fix',
                 'how-to-fix-esp32-upload-failures-in-under-5-minutes', 'how-to-fix-hc-sr04-ultrasonic-sensor-connection-issues-with',
                 'fixing-i2c-clock-stretching-timeouts-in-esp32-why-your-sensor-data-fre', 'fixing-i2c-clock-stretching-timeouts-in-esp32-why-your'] },
  { slug: 'home-repair-guides', title: 'Home Repair & Maintenance', description: 'Fix common household problems with clear technical guidance.', icon: 'ًںڈ ',
    matchSlugs: ['how-to-fix-an-overheating-dryer-before-it-becomes-a-fire', 'diy-dishwasher-troubleshooting-and-repair-guide-fix-common',
                 'diy-dishwasher-troubleshooting-and-repair-guide-fix-common-household-a', 'topic-how-to-fix-a-clogged-drain-without-harsh-chemicals',
                 'how-to-fix-a-clogged-drain-without-harsh-chemicals', 'mechanical-engineering-principles-in-sanitary-piping-a-technical-analy'] },
  { slug: 'pc-and-laptop-upgrades', title: 'PC & Laptop Upgrades', description: 'Speed up old hardware and troubleshoot boot problems.', icon: 'ًں’»',
    matchSlugs: ['old-laptop-ssd-upgrade-guide', 'pc-wont-boot-fix', 'why-your-laptop-is-overheating-and-how-to-fix-it',
                 'how-to-speed-up-a-slow-computer-in-10-minutes-no-new-hardware'] },
  { slug: 'energy-and-smart-home', title: 'Energy & Smart Home', description: 'Cut your bills with telemetry and home automation.', icon: 'âڑ،',
    matchSlugs: ['how-to-spot-energy-vampires-draining-your-bill-silently', 'smart-energy-audits-how-telemetry-can-slash-your-power-bills',
                 'solving-high-household-energy-bills-using-smart-home-automation', 'solving-high-household-energy-bills-using-smart-home'] },
  { slug: 'embedded-fundamentals', title: 'Embedded Systems Fundamentals', description: 'Core knowledge every embedded engineer needs.', icon: 'ًں”Œ',
    matchSlugs: ['led-strip-flicker-fix', 'raspberry-pi-overheating-fix', 'how-to-write-code-that-anyone-can-read-and-maintain'] }
];

const STATIC_PAGES = [
  ['/', 'daily', '1.0'],
  ['/academy.html', 'weekly', '0.9'],
  ['/tools.html', 'weekly', '0.9'],
  ['/best-picks.html', 'weekly', '0.8'],
  ['/guides.html', 'weekly', '0.8'],
  ['/qa.html', 'daily', '0.7'],
  ['/forum.html', 'daily', '0.6'],
  ['/news.html', 'hourly', '0.6'],
  ['/glossary.html', 'monthly', '0.5'],
  ['/pinout.html', 'monthly', '0.5'],
  ['/about.html', 'monthly', '0.4'],
  ['/contact.html', 'monthly', '0.4'],
  ['/privacy-policy.html', 'yearly', '0.2'],
  ['/terms.html', 'yearly', '0.2']
];

const today = new Date().toISOString().slice(0, 10);
const esc = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' }[c]));
const plain = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const TITLE_MAX = 60;
const DESC_MAX = 155;
function cutWords(str, max) {
  let t = String(str).trim();
  if (t.length <= max) return t;
  t = t.slice(0, max + 1);
  const i = t.lastIndexOf(' ');
  t = i > max * 0.6 ? t.slice(0, i) : t.slice(0, max);
  return t.replace(/[\s,;:\-â€“â€”(\[]+$/, '');
}
function seoTitle(title) {
  const t = plain(title);
  const full = t + ' | ' + SITE_NAME;
  if (full.length <= TITLE_MAX) return full;
  if (t.length <= TITLE_MAX) return t;
  return cutWords(t, TITLE_MAX);
}
function seoDesc(desc) {
  const d = plain(desc);
  if (d.length <= DESC_MAX) return d;
  return cutWords(d, DESC_MAX - 1) + 'â€¦';
}
const toDate = (d) => { const t = new Date(d); return isNaN(t) ? new Date(today) : t; };
const iso = (d) => d.toISOString().slice(0, 10);

function slugOf(a) {
  const en = plain(typeof a.title === 'object' ? (a.title.en || Object.values(a.title).find(Boolean)) : a.title);
  let slug = en.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/^topic-/, '');
  if (slug.length > 60) { slug = slug.slice(0, 60); const i = slug.lastIndexOf('-'); if (i > 30) slug = slug.slice(0, i); }
  return slug.replace(/-+$/g, '') || ('article-' + encodeURIComponent(String(a.id)));
}

function tagsOf(v) {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') { try { const a = JSON.parse(v); if (Array.isArray(a)) return a.map(String); } catch {} return v.split(',').map((x) => x.trim()).filter(Boolean); }
  return [];
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function loadFromSupabase() {
  if (!SUPABASE_KEY) { console.warn('No SUPABASE_KEY â€” skipping Supabase'); return []; }
  try {
    const url = SUPABASE_URL + '/rest/v1/articles?select=id,title,excerpt,content,category,author,date,image,images,tags,title_i18n,excerpt_i18n,content_i18n&order=date.desc&limit=1000';
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        console.log('Supabase: ' + data.length + ' articles');
        return data;
      }
    }
    console.warn('Supabase HTTP', res.status);
  } catch (e) { console.warn('Supabase unreachable:', e.message); }
  return [];
}

async function loadManual() {
  try {
    const list = JSON.parse(await readFile(join(ROOT, 'data/manual-articles.json'), 'utf8'));
    if (!Array.isArray(list)) return [];
    const filtered = list.filter((m) => m && m.slug && m.title);
    console.log('Manual: ' + filtered.length + ' articles');
    return filtered;
  } catch (e) {
    console.warn('No manual-articles.json:', e.message);
    return [];
  }
}

async function resolveImage(img) {
  if (!img || typeof img !== 'string') return '';
  if (/^https?:\/\//.test(img)) return img;
  if (img.startsWith('data:')) return '';
  const rel = img.replace(/^\/+/, '');
  if (await exists(join(ROOT, rel))) return SITE + '/' + rel;
  return '';
}

function inlineMd(s) {
  return esc(s).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`\n]+)`/g, '<code>$1</code>');
}

function renderContent(text) {
  const src = String(text || '').replace(/\r\n/g, '\n');
  const chunks = src.split(/```[a-zA-Z0-9+#-]*\n([\s\S]*?)```/);
  const out = [];
  chunks.forEach((chunk, i) => {
    if (i % 2) { out.push('<pre><code>' + esc(chunk.replace(/\n$/, '')) + '</code></pre>'); return; }
    const blocks = chunk.replace(/^(#{1,3} .+)$/gm, '\n$1\n').split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
    for (const b of blocks) {
      let m;
      if ((m = b.match(/^###\s+(.+)$/))) out.push('<h3>' + inlineMd(m[1]) + '</h3>');
      else if ((m = b.match(/^#{1,2}\s+(.+)$/))) out.push('<h2>' + inlineMd(m[1]) + '</h2>');
      else if (b.split('\n').every((l) => /^\s*[-*â€¢]\s+/.test(l)))
        out.push('<ul>' + b.split('\n').map((l) => '<li>' + inlineMd(l.replace(/^\s*[-*â€¢]\s+/, '')) + '</li>').join('') + '</ul>');
      else if (b.split('\n').every((l) => /^\s*\d+[.)]\s+/.test(l)))
        out.push('<ol>' + b.split('\n').map((l) => '<li>' + inlineMd(l.replace(/^\s*\d+[.)]\s+/, '')) + '</li>').join('') + '</ol>');
      else out.push('<p>' + inlineMd(b).replace(/\n/g, '<br>') + '</p>');
    }
  });
  return out.join('\n      ');
}

function parseFaq(content) {
  const text = String(content || '');
  const m = text.match(/(^|\n)##\s+Frequently Asked Questions\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  if (!m) return null;
  const items = [];
  const re = /###\s+(.+?)\s*\n+([\s\S]*?)(?=\n###\s|$)/g;
  let x;
  while ((x = re.exec(m[2]))) {
    const q = plain(x[1]); const ans = plain(x[2]);
    if (q && ans) items.push({ q, a: ans.slice(0, 800) });
  }
  return items.length ? { items, rest: text.replace(m[0], '\n') } : null;
}

function relatedFor(a, all, n) {
  n = n || 3;
  const tagSet = new Set((a.tags || []).map((t) => t.toLowerCase()));
  const wordsOf = (t) => plain(t).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const titleWords = new Set(wordsOf(a.title));
  return all.filter((x) => x.slug !== a.slug).map((x) => {
    let score = x.category === a.category ? 3 : 0;
    for (const t of (x.tags || [])) if (tagSet.has(t.toLowerCase())) score += 2;
    for (const w of wordsOf(x.title)) if (titleWords.has(w)) score += 1;
    return { x, score };
  }).sort((p, q) => q.score - p.score || q.x.date - p.x.date).slice(0, n).map((p) => p.x);
}

function seriesFor(a) {
  return SERIES.filter((s) => s.matchSlugs.includes(a.slug));
}

const NAV = '<a href="/index.html">Home</a><a href="/academy.html">Academy</a><a href="/tools.html">Tools</a><a href="/best-picks.html">Best Picks</a><a href="/guides.html">Guides</a><a href="/qa.html">Q&amp;A</a><a href="/forum.html">Forum</a><a href="/news.html">News</a><button id="darkModeToggle" type="button" aria-pressed="false" aria-label="Switch theme">ًںŒ™</button>';

function page(a, all) {
  const url = SITE + '/a/' + a.slug + '.html';
  const img = a.image || DEFAULT_IMG;
  const desc = seoDesc(a.excerpt || plain((a.content || '').replace(/[#*`]/g, '')));
  const words = plain(a.content || '').split(/\s+/).filter(Boolean).length;
  const mins = a.minutes || Math.max(1, Math.round(words / 200));
  const faqParsed = parseFaq(a.content);
  const faqs = faqParsed ? faqParsed.items : [];
  const body = renderContent(faqParsed ? faqParsed.rest : a.content);
  const related = relatedFor(a, all, 3);
  const inSeries = seriesFor(a);

  const availableLangs = ['en'].concat(Object.keys(LANGS).filter((l) => l !== 'en' && a.title_i18n && a.title_i18n[l]));
  const hreflangTags = availableLangs.map((lang) => {
    const href = lang === 'en' ? url : url + '?lang=' + lang;
    return '  <link rel="alternate" hreflang="' + (LANGS[lang] ? LANGS[lang].htmlLang : lang) + '" href="' + href + '">';
  }).join('\n');

  const faqLd = faqs.length ? {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
  } : null;

  const graph = [
    { '@type': 'Article', headline: a.title, description: desc, image: [img],
      datePublished: iso(a.date), dateModified: iso(a.date), mainEntityOfPage: url,
      author: { '@type': 'Person', name: a.author || SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: SITE + '/assets/og-default.png' } },
      keywords: (a.tags || []).join(', '), articleSection: a.category, wordCount: words, inLanguage: 'en' },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: a.category, item: SITE + '/' },
      { '@type': 'ListItem', position: 3, name: a.title, item: url }
    ]}
  ];
  if (faqLd) graph.push(faqLd);
  const ld = { '@context': 'https://schema.org', '@graph': graph };

  const faqHTML = faqs.length ? '\n    <section class="faq-section"><h2>Frequently Asked Questions</h2>' +
    faqs.map((f) => '<details class="faq-item"><summary><strong>' + esc(f.q) + '</strong></summary><p>' + esc(f.a) + '</p></details>').join('') +
    '</section>' : '';

  const seriesHTML = inSeries.length ? '\n        <div class="article-series-nav" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
    inSeries.map((s) => '<a href="/series/' + s.slug + '.html" style="padding:5px 12px;background:var(--primary-soft);border:1px solid var(--primary);border-radius:999px;font-size:0.82rem;color:var(--primary);text-decoration:none">' + s.icon + ' Part of: <strong>' + esc(s.title) + '</strong></a>').join('') + '</div>' : '';

  const relatedHTML = related.length ? '\n    <section class="related-section"><h2 class="section-heading">ًں“ڑ Related Articles</h2><div class="articles-grid">' +
    related.map((r) => '<article class="article-card"><span class="card-category">' + esc(r.category) + '</span><h3><a href="/a/' + r.slug + '.html">' + esc(r.title) + '</a></h3><p>' + esc(r.excerpt) + '</p><a href="/a/' + r.slug + '.html" class="read-more">Read More â†’</a></article>').join('') +
    '</div></section>' : '';

  return '<!DOCTYPE html>\n<html lang="en" dir="ltr" translate="no">\n<head>\n' +
    '<meta charset="UTF-8">
<meta name="google" content="notranslate">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(seoTitle(a.title)) + '</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<link rel="canonical" href="' + url + '">\n' + hreflangTags + '\n' +
    '<link rel="alternate" hreflang="x-default" href="' + url + '">\n' +
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">\n' +
    '<meta property="og:type" content="article">\n<meta property="og:site_name" content="' + SITE_NAME + '">\n' +
    '<meta property="og:title" content="' + esc(a.title) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:url" content="' + url + '">\n' +
    '<meta property="og:image" content="' + esc(img) + '">\n' +
    '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' +
    '<meta property="article:published_time" content="' + iso(a.date) + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="icon" href="/favicon.ico" type="image/x-icon">\n<link rel="manifest" href="/manifest.json">\n' +
    '<meta name="theme-color" content="#2563eb">\n<link rel="llms" href="/llms.txt">\n' +
    '<link rel="alternate" type="application/rss+xml" title="' + SITE_NAME + '" href="/rss.xml">\n' +
    '<link rel="stylesheet" href="/css/style.css?v=' + ASSET_V + '">\n    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>\n' +
    '<script>try{if(localStorage.getItem("tp_theme")==="dark")document.documentElement.classList.add("dark-theme")}catch(e){}</script>\n' +
    '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>\n</head>\n<body>\n' +
    '<div id="readingProgressBar"></div>\n<header class="main-header"><div class="container">\n' +
    '<div class="logo"><a href="/index.html" aria-label="' + SITE_NAME + ' Home"><span>' + SITE_NAME + '</span></a></div>\n' +
    '<nav class="nav-links" aria-label="Main navigation">' + NAV + '</nav>\n</div></header>\n<main class="container">\n' +
    '<nav class="breadcrumb" style="margin:16px 0;font-size:0.9rem;color:var(--text-muted)" aria-label="Breadcrumb"><a href="/index.html">Home</a> &gt; <span>' + esc(a.category) + '</span></nav>\n' +
    '<article class="single-article" data-id="' + esc(a.id) + '">\n<header class="article-header">\n' +
    '<span class="article-category">' + esc(a.category) + '</span>\n<h1>' + esc(a.title) + '</h1>\n<div class="article-meta">\n' +
    '<span>ًں‘¤ ' + esc(a.author || SITE_NAME) + '</span>\n<span>ًں“… ' + iso(a.date) + '</span>\n' +
    '<span>âڈ± ' + mins + ' min read</span>\n<span id="tpViewsWrap" hidden>ًں‘پï¸ڈ <span id="tpViews">0</span> views</span>\n</div>' +
    seriesHTML + '\n</header>\n' +
    (a.image ? '<img src="' + esc(a.image) + '" alt="' + esc(a.title) + '" class="article-hero-img" width="1200" height="630" loading="eager" fetchpriority="high">\n' : '') +
    '<div class="article-excerpt"><p>' + esc(a.excerpt) + '</p></div>\n' +
    '<div id="articleToc" class="article-toc-slot"></div>\n' +
    '<div class="article-content">\n' + body + '\n</div>\n' + faqHTML + '\n' +
    ((a.tags && a.tags.length) ? '<p class="tags-list">' + a.tags.map((t) => '<span class="tag">#' + esc(t) + '</span>').join(' ') + '</p>\n' : '') +
    '<div class="share-buttons" id="tpActions">\n' +
    '<button class="like-btn" id="tpLike" type="button" aria-label="Like">ًں¤چ <span class="like-count">0</span></button>\n' +
    '<button class="share-btn" id="tpSave" type="button">ًں”– Save</button>\n' +
    '<button class="share-btn" data-share="twitter" type="button">ً‌•ڈ Twitter</button>\n' +
    '<button class="share-btn" data-share="facebook" type="button">Facebook</button>\n' +
    '<button class="share-btn" data-share="linkedin" type="button">LinkedIn</button>\n' +
    '<button class="share-btn" data-share="whatsapp" type="button">WhatsApp</button>\n' +
    '<button class="share-btn" data-share="copy" type="button">ًں”— Copy Link</button>\n</div>\n' +
    '<section class="comments-section" id="tpComments"><h2 class="section-heading">Comments</h2><div id="commentsContainer"></div></section>\n' +
    '<div class="back-row" style="text-align:center;margin-top:24px"><a href="/index.html" class="btn-secondary">â†گ All articles</a></div>\n' +
    '</article>\n' + relatedHTML + '\n</main>\n<footer class="main-footer"><div class="container">\n' +
    '<p>&copy; ' + new Date().getFullYear() + ' ' + SITE_NAME + '. All rights reserved.</p>\n' +
    '<div class="footer-links"><a href="/about.html">About</a><a href="/contact.html">Contact</a><a href="/privacy-policy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/rss.xml">RSS</a><a href="/sitemap.xml">Sitemap</a></div>\n' +
    '</div></footer>\n<button id="scrollTopBtn" type="button" aria-label="Scroll to top">â†‘</button>\n' +
    '<script src="/js/common.js?v=' + ASSET_V + '" defer></script>\n' +
    '<script src="/js/i18n.js?v=' + ASSET_V + '" defer></script>\n' +
    '<script src="/js/toc.js?v=' + ASSET_V + '" defer></script>\n' +
    '<script src="/js/static-article.js?v=' + ASSET_V + '" defer></script>\n' +
    '</body>\n</html>\n';
}

function seriesPage(s, all) {
  const items = s.matchSlugs.map((slug) => all.find((a) => a.slug === slug)).filter(Boolean);
  const url = SITE + '/series/' + s.slug + '.html';
  return '<!DOCTYPE html>\n<html lang="en"><head>\n<meta charset="UTF-8">
<meta name="google" content="notranslate">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(s.title) + ' â€” Series | ' + SITE_NAME + '</title>\n' +
    '<meta name="description" content="' + esc(s.description) + '">\n<link rel="canonical" href="' + url + '">\n' +
    '<link rel="icon" href="/favicon.ico">\n<link rel="stylesheet" href="/css/style.css?v=' + ASSET_V + '">\n    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>\n' +
    '</head><body>\n<header class="main-header"><div class="container">\n' +
    '<div class="logo"><a href="/index.html"><span>' + SITE_NAME + '</span></a></div>\n' +
    '<nav class="nav-links">' + NAV + '</nav>\n</div></header>\n<main class="container">\n' +
    '<section class="hero-section" style="text-align:center;padding:40px 20px">\n' +
    '<div style="font-size:3.5rem;line-height:1">' + s.icon + '</div>\n<h1>' + esc(s.title) + '</h1>\n' +
    '<p style="color:var(--text-muted);max-width:640px;margin:12px auto">' + esc(s.description) + '</p>\n' +
    '<div style="display:inline-block;padding:5px 14px;background:var(--primary-soft);color:var(--primary);border-radius:999px;font-size:0.85rem;font-weight:600">' + items.length + ' articles</div>\n' +
    '</section>\n<section class="articles-grid" style="padding-bottom:60px">\n' +
    items.map((a) => '<article class="article-card"><span class="card-category">' + esc(a.category) + '</span><h3><a href="/a/' + a.slug + '.html">' + esc(a.title) + '</a></h3><p>' + esc(a.excerpt) + '</p><a href="/a/' + a.slug + '.html" class="read-more">Read More â†’</a></article>').join('\n') +
    '\n</section>\n</main>\n<footer class="main-footer"><div class="container"><p>&copy; ' + new Date().getFullYear() + ' ' + SITE_NAME + '.</p></div></footer>\n' +
    '<script src="/js/common.js?v=' + ASSET_V + '" defer></script>\n</body></html>\n';
}

async function main() {
  await mkdir(join(ROOT, 'a'), { recursive: true });
  await mkdir(join(ROOT, 'series'), { recursive: true });
  await mkdir(join(ROOT, 'rss'), { recursive: true });

  // Load from Supabase
  const raw = (await loadFromSupabase()).filter((a) => a && a.id);
  const articles = [];
  const seenSlugs = new Set();

  for (const a of raw) {
    let slug = slugOf(a);
    if (seenSlugs.has(slug)) slug += '-' + String(a.id).replace(/[^a-z0-9]/gi, '').slice(-4);
    seenSlugs.add(slug);
    articles.push({
      id: String(a.id), slug,
      title: plain(typeof a.title === 'object' ? (a.title.en || Object.values(a.title).find(Boolean)) : a.title),
      excerpt: plain(typeof a.excerpt === 'object' ? (a.excerpt.en || Object.values(a.excerpt).find(Boolean)) : a.excerpt).slice(0, 300),
      content: String(a.content || ''),
      title_i18n: a.title_i18n || {}, excerpt_i18n: a.excerpt_i18n || {}, content_i18n: a.content_i18n || {},
      category: a.category || 'Technology',
      author: a.author || SITE_NAME,
      tags: tagsOf(a.tags),
      date: toDate(a.date),
      image: await resolveImage(a.image),
      manual: false
    });
  }

  // Load manual articles
  const manualList = await loadManual();
  for (const m of manualList) {
    if (seenSlugs.has(m.slug)) continue;
    seenSlugs.add(m.slug);
    const file = join(ROOT, 'a', m.slug + '.html');
    const hasContent = !!String(m.content || '').trim();
    const fileExists = await exists(file);
    if (!hasContent && !fileExists) {
      console.warn('Skip (no content + no file):', m.slug);
      continue;
    }
    articles.push({
      id: 'm-' + m.slug, slug: m.slug,
      title: plain(m.title),
      excerpt: plain(m.excerpt || '').slice(0, 300),
      content: hasContent ? String(m.content) : '',
      title_i18n: m.title_i18n || {}, excerpt_i18n: m.excerpt_i18n || {}, content_i18n: m.content_i18n || {},
      category: m.category || 'Technology',
      author: m.author || SITE_NAME,
      tags: Array.isArray(m.tags) ? m.tags : [],
      date: toDate(m.date),
      image: m.image || '',
      minutes: m.minutes || 5,
      manual: true,
      hasContent: hasContent,
      preserveFile: !hasContent && fileExists
    });
  }

  // Sort by date
  articles.sort((x, y) => y.date - x.date);

  // Write article pages
  let written = 0;
  for (const a of articles) {
    // Skip writing if it's a manual article WITH a file that we should preserve
    if (a.preserveFile) continue;
    await writeFile(join(ROOT, 'a', a.slug + '.html'), page(a, articles));
    written++;
  }
  console.log('âœ“ ' + written + ' article pages written');

  // Write series pages
  for (const s of SERIES) {
    await writeFile(join(ROOT, 'series', s.slug + '.html'), seriesPage(s, articles));
  }
  console.log('âœ“ ' + SERIES.length + ' series pages written');

  // Save static-slugs.json (only Supabase articles, not manual)
  const slugMap = {};
  articles.filter((a) => !a.manual).forEach((a) => { slugMap[a.id] = a.slug; });
  await writeFile(join(ROOT, 'data', 'static-slugs.json'), JSON.stringify(slugMap, null, 1) + '\n');

  // Sitemap index
  await writeFile(join(ROOT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <sitemap><loc>' + SITE + '/sitemap-pages.xml</loc><lastmod>' + today + '</lastmod></sitemap>\n' +
    '  <sitemap><loc>' + SITE + '/sitemap-posts.xml</loc><lastmod>' + today + '</lastmod></sitemap>\n' +
    '  <sitemap><loc>' + SITE + '/sitemap-series.xml</loc><lastmod>' + today + '</lastmod></sitemap>\n' +
    '</sitemapindex>\n');

  // Pages sitemap
  const pagesUrls = STATIC_PAGES.map(([p, f, pr]) =>
    '  <url><loc>' + SITE + p + '</loc><lastmod>' + today + '</lastmod><changefreq>' + f + '</changefreq><priority>' + pr + '</priority></url>'
  ).join('\n');
  await writeFile(join(ROOT, 'sitemap-pages.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + pagesUrls + '\n</urlset>\n');

  // Posts sitemap
  const postsUrls = articles.map((a) =>
    '  <url><loc>' + SITE + '/a/' + a.slug + '.html</loc><lastmod>' + iso(a.date) + '</lastmod><changefreq>monthly</changefreq><priority>0.8</priority>' +
    (a.image ? '<image:image><image:loc>' + esc(a.image) + '</image:loc><image:caption>' + esc(a.title) + '</image:caption></image:image>' : '') +
    '</url>'
  ).join('\n');
  await writeFile(join(ROOT, 'sitemap-posts.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + postsUrls + '\n</urlset>\n');

  // Series sitemap
  const seriesUrls = SERIES.map((s) =>
    '  <url><loc>' + SITE + '/series/' + s.slug + '.html</loc><lastmod>' + today + '</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>'
  ).join('\n');
  await writeFile(join(ROOT, 'sitemap-series.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + seriesUrls + '\n</urlset>\n');

  // RSS
  const rssItems = articles.slice(0, 50).map((a) =>
    '    <item>\n      <title>' + esc(a.title) + '</title>\n      <link>' + SITE + '/a/' + a.slug + '.html</link>\n' +
    '      <guid isPermaLink="true">' + SITE + '/a/' + a.slug + '.html</guid>\n' +
    '      <pubDate>' + a.date.toUTCString() + '</pubDate>\n      <category>' + esc(a.category) + '</category>\n' +
    '      <description><![CDATA[' + esc(a.excerpt) + ']]></description>\n    </item>'
  ).join('\n');
  await writeFile(join(ROOT, 'rss.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n' +
    '<title>' + SITE_NAME + '</title>\n<link>' + SITE + '/</link>\n<description>' + esc(SITE_DESC) + '</description>\n' +
    '<language>en</language>\n<lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>\n' +
    '<atom:link href="' + SITE + '/rss.xml" rel="self" type="application/rss+xml"/>\n' + rssItems + '\n</channel>\n</rss>\n');

  // Per-category RSS
  const cats = [...new Set(articles.map((a) => a.category).filter(Boolean))];
  for (const cat of cats) {
    const catSlug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const catItems = articles.filter((a) => a.category === cat).slice(0, 30).map((a) =>
      '    <item>\n      <title>' + esc(a.title) + '</title>\n      <link>' + SITE + '/a/' + a.slug + '.html</link>\n      <pubDate>' + a.date.toUTCString() + '</pubDate>\n      <description>' + esc(a.excerpt) + '</description>\n    </item>'
    ).join('\n');
    await writeFile(join(ROOT, 'rss', catSlug + '.xml'),
      '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>' + SITE_NAME + ' â€” ' + esc(cat) + '</title>\n<link>' + SITE + '/</link>\n' + catItems + '\n</channel>\n</rss>\n');
  }

  // robots.txt
  await writeFile(join(ROOT, 'robots.txt'),
    'User-agent: *\nAllow: /\nDisallow: /admin.html\n\n' +
    'User-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\n' +
    'User-agent: PerplexityBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\n\n' +
    'Sitemap: ' + SITE + '/sitemap.xml\nSitemap: ' + SITE + '/sitemap-posts.xml\n');

  // llms.txt
  await writeFile(join(ROOT, 'llms.txt'),
    '# ' + SITE_NAME + '\n\n> ' + SITE_DESC + '\n\n' +
    '## Featured Articles\n' + articles.slice(0, 15).map((a) => '- [' + a.title + '](' + SITE + '/a/' + a.slug + '.html)').join('\n') + '\n\n' +
    '## Contact\n- Website: ' + SITE + '\n- Email: contact@pulsehig.com\n');

  console.log('âœ“ sitemap.xml, sub-sitemaps, rss.xml, per-category rss, robots.txt, llms.txt written');
  console.log('âœ… Done. Total: ' + articles.length + ' articles, ' + SERIES.length + ' series');
}

main().catch((e) => { console.error('â‌Œ', e); process.exit(1); });