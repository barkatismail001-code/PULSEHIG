await import('dotenv/config').catch(() => {});   // optional: only needed for a local .env file
// TechPulse — SEO Build Step (generate-seo.mjs) v20261006
// Generates article pages, series pages, sitemaps, RSS feeds.
// Reads from Supabase (published) + data/manual-articles.json (manual)
// Run: node scripts/generate-seo.mjs

import { readFile, writeFile, mkdir, access, readdir, stat, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';
const SITE_NAME = 'TechPulse';
const SITE_DESC = 'Engineering platform for embedded systems, microcontrollers, home repair, and programming.';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cescfarawvpzmilteufq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
const ASSET_V = '20261010';
const DEFAULT_IMG = SITE + '/assets/og-default.png';

const LANGS = {
  en: { name: 'English', htmlLang: 'en' },
  zh: { name: '中文', htmlLang: 'zh-CN' },
  es: { name: 'Español', htmlLang: 'es' },
  hi: { name: 'हिन्दी', htmlLang: 'hi' },
  fr: { name: 'Français', htmlLang: 'fr' },
  pt: { name: 'Português', htmlLang: 'pt' }
};

const SERIES = [
  { slug: 'esp32-essential-fixes', title: 'ESP32 Essential Fixes', description: 'The most common ESP32 problems with practical solutions tested on real hardware.', icon: '🔧',
    matchSlugs: ['esp32-i2c-clock-stretching-timeout-fix', 'esp32-deep-sleep-fix', 'esp32-mosfet-dc-motor-control', 'esp32-relay-chatter-fix', 'esp32-wifi-dropping-fix',
                 'how-to-fix-esp32-upload-failures-in-under-5-minutes', 'how-to-fix-hc-sr04-ultrasonic-sensor-connection-issues-with',
                 'fixing-i2c-clock-stretching-timeouts-in-esp32-why-your-sensor-data-fre', 'fixing-i2c-clock-stretching-timeouts-in-esp32-why-your'] },
  { slug: 'home-repair-guides', title: 'Home Repair & Maintenance', description: 'Fix common household problems with clear technical guidance.', icon: '🏠',
    matchSlugs: ['how-to-fix-an-overheating-dryer-before-it-becomes-a-fire', 'diy-dishwasher-troubleshooting-and-repair-guide-fix-common',
                 'diy-dishwasher-troubleshooting-and-repair-guide-fix-common-household-a', 'topic-how-to-fix-a-clogged-drain-without-harsh-chemicals',
                 'how-to-fix-a-clogged-drain-without-harsh-chemicals', 'mechanical-engineering-principles-in-sanitary-piping-a-technical-analy'] },
  { slug: 'pc-and-laptop-upgrades', title: 'PC & Laptop Upgrades', description: 'Speed up old hardware and troubleshoot boot problems.', icon: '💻',
    matchSlugs: ['old-laptop-ssd-upgrade-guide', 'pc-wont-boot-fix', 'why-your-laptop-is-overheating-and-how-to-fix-it',
                 'how-to-speed-up-a-slow-computer-in-10-minutes-no-new-hardware'] },
  { slug: 'energy-and-smart-home', title: 'Energy & Smart Home', description: 'Cut your bills with telemetry and home automation.', icon: '⚡',
    matchSlugs: ['how-to-spot-energy-vampires-draining-your-bill-silently', 'smart-energy-audits-how-telemetry-can-slash-your-power-bills',
                 'solving-high-household-energy-bills-using-smart-home-automation', 'solving-high-household-energy-bills-using-smart-home'] },
  { slug: 'embedded-fundamentals', title: 'Embedded Systems Fundamentals', description: 'Core knowledge every embedded engineer needs.', icon: '🔌',
    matchSlugs: ['led-strip-flicker-fix', 'raspberry-pi-overheating-fix', 'how-to-write-code-that-anyone-can-read-and-maintain'] }
];

const STATIC_PAGES = [
  ['/', 'daily', '1.0'],
  ['/academy.html', 'weekly', '0.9'],
  ['/tools.html', 'weekly', '0.9'],
  ['/best-picks.html', 'weekly', '0.8'],
  ['/guides.html', 'weekly', '0.8'],
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
  return t.replace(/[\s,;:\-–—(\[]+$/, '');
}
function seoTitle(title) {
  const t = plain(title);
  const full = t + ' | ' + SITE_NAME;
  if (full.length <= TITLE_MAX) return full;
  if (t.length <= TITLE_MAX) return t;
  let r = cutWords(t, TITLE_MAX);
  for (;;) {
    const w = r.split(' ');
    if (w.length > 3 && TITLE_STOP_END.has(w[w.length - 1].toLowerCase().replace(/[^a-z]/g, ''))) { w.pop(); r = w.join(' ').replace(/[\s,;:\-–—(\[]+$/, ''); } else break;
  }
  return r;
}
function seoDesc(desc) {
  const d = plain(desc);
  if (d.length <= DESC_MAX) return d;
  return cutWords(d, DESC_MAX - 1) + '…';
}
const toDate = (d) => { const t = new Date(d); return isNaN(t) ? new Date(today) : t; };
const iso = (d) => d.toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Quality gates (AdSense-friendly): short articles stay online but are NOT indexed,
// NOT listed and NOT in the sitemap until they reach MIN_INDEX_WORDS.
// ---------------------------------------------------------------------------
const MIN_INDEX_WORDS = 600;
const TITLE_STOP_END = new Set(['and', 'or', 'to', 'of', 'the', 'a', 'an', 'in', 'for', 'with', 'on', 'at', 'by', 'from', 'vs', 'your', 'is', 'are']);
const wordCount = (t) => plain(String(t || '').replace(/[#*`>|_-]{1,}/g, ' ')).split(/\s+/).filter(Boolean).length;

const SECTION_TITLES = [
  [/^the problem( faced by the user)?$/i, 'The Problem'],
  [/^(potential|possible) causes( of the problem)?$/i, 'Possible Causes'],
  [/^(required )?tools and components( needed| required)?$/i, 'Tools and Components Needed'],
  [/^(detailed )?step[- ]by[- ]step solution( guide)?$/i, 'Step-by-Step Solution'],
  [/^(images or diagrams|images and diagrams|diagrams)$/i, 'Images and Diagrams'],
  [/^common mistakes( to avoid)?$/i, 'Common Mistakes'],
  [/^(electrical and mechanical )?safety precautions$/i, 'Safety Precautions'],
  [/^how to (test the solution and )?verify( the fix| success)?$/i, 'How to Verify the Fix']
];
const FLAT_TITLES = 'The Problem Faced by the User|Potential Causes of the Problem|Possible Causes|Required Tools and Components|Tools and Components Needed|Detailed Step-by-Step Solution Guide|Step-by-Step Solution|Images or Diagrams|Common Mistakes to Avoid|Common Mistakes|Electrical and Mechanical Safety Precautions|Safety Precautions|How to Test the Solution and Verify Success|How to Verify the Fix';

// Repairs content that was saved with literal "\n" text, or as one flat line with glued numbered headings.
function normalizeContent(raw) {
  let src = String(raw || '').replace(/\r\n/g, '\n');
  const literal = (src.match(/\\n/g) || []).length;
  const real = (src.match(/\n/g) || []).length;
  if (literal > real) src = src.replace(/\\n/g, '\n');
  if (!/\n/.test(src.trim()) && !/<\s*(h[1-6]|p|ul|li)\b/i.test(src)) {
    const re = new RegExp('(?:^|\\s)\\d+\\.\\s*(' + FLAT_TITLES + ')\\s*', 'g');
    src = src.replace(re, (m, t) => '\n\n## ' + t + '\n\n');
    src = src.replace(/\s{3,}/g, '\n\n').replace(/([.!?)])(?=[A-Z][a-z])/g, '$1\n- ').trim();
  }
  // unify section names to the standard structure
  src = src.replace(/^(#{2})\s+(?:\d+\.\s*)?(.+?)\s*$/gm, (m, h, t) => {
    const hit = SECTION_TITLES.find(([re]) => re.test(t.trim()));
    return hit ? '## ' + hit[1] : m;
  });
  return src;
}
function cleanExcerpt(e) {
  return plain(e).replace(/^Summary of the Article\s*/i, '').replace(/\s+/g, ' ').trim();
}

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
  if (!SUPABASE_KEY) { console.warn('No SUPABASE_KEY — skipping Supabase'); return []; }
  try {
    const url = SUPABASE_URL + '/rest/v1/articles?select=id,title,excerpt,content,category,author,date,image,images,tags,slug,title_i18n,excerpt_i18n,content_i18n&order=date.desc&limit=1000';
    const res = await fetch(url, { headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'User-Agent': 'techpulse-build/1.0 (server)',
      'X-Client-Info': 'techpulse-build'
    }});
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

async function loadLocal() {
  // Offline / no-key mode: data/articles-source.json holds ALL articles (including thin drafts).
  // (a/articles.json is only the public feed of indexable articles and is regenerated.)
  try {
    const j = JSON.parse(await readFile(join(ROOT, 'data/articles-source.json'), 'utf8'));
    console.log('Local mode: ' + j.length + ' articles from data/articles-source.json');
    return Array.isArray(j) ? j : [];
  } catch (e) { return []; }
}
async function loadRedirects() {
  try { return JSON.parse(await readFile(join(ROOT, 'data/redirects.json'), 'utf8')); } catch { return {}; }
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

function looksLikeHtml(s) {
  return /<\s*(h[1-6]|p|ul|ol|li|pre|code|strong|em|a|img|blockquote|table|div|section)\b/i.test(String(s || ''));
}

function inlineMd(s) {
  return esc(s)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" loading="lazy" decoding="async" ' +
      'style="max-width:100%;height:auto;border-radius:8px;margin:16px 0;display:block">')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>');
}

function htmlToMarkdown(html) {
  return String(html || '')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function renderContent(text) {
  const src = normalizeContent(text);
  // Real HTML tags → convert first
  if (/<\s*(h[1-6]|p|ul|ol|li|pre|code|strong|em|a|img|blockquote|table|div|section)\b/i.test(src)) {
    return renderMarkdown(htmlToMarkdown(src));
  }
  return renderMarkdown(src);
}

function renderMarkdown(text) {
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
      else if (b.split('\n').every((l) => /^\s*[-*•]\s+/.test(l)))
        out.push('<ul>' + b.split('\n').map((l) => '<li>' + inlineMd(l.replace(/^\s*[-*•]\s+/, '')) + '</li>').join('') + '</ul>');
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

const NAV = '<a href="/index.html">Home</a><a href="/academy.html">Academy</a><a href="/tools.html">Tools</a><a href="/best-picks.html">Best Picks</a><a href="/guides.html">Guides</a><a href="/qa.html">Q&amp;A</a><a href="/forum.html">Forum</a><button id="darkModeToggle" type="button" aria-pressed="false" aria-label="Switch theme">🌙</button>';

function page(a, all) {
  const url = SITE + '/a/' + a.slug + '.html';
  const img = a.image || DEFAULT_IMG;
  const desc = seoDesc(a.excerpt || plain((a.content || '').replace(/[#*`]/g, '')));
  const words = a.words || wordCount(normalizeContent(a.content));
  const mins = a.minutes || Math.max(1, Math.round(words / 200));
  const faqParsed = parseFaq(normalizeContent(a.content));
  const faqs = faqParsed ? faqParsed.items : [];
  const body = renderContent(faqParsed ? faqParsed.rest : a.content);
  const related = relatedFor(a, all, 3);
  const inSeries = seriesFor(a);

  const hreflangTags = '';

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

  const relatedHTML = related.length ? '\n    <section class="related-section"><h2 class="section-heading">📚 Related Articles</h2><div class="articles-grid">' +
    related.map((r) => '<article class="article-card"><span class="card-category">' + esc(r.category) + '</span><h3><a href="/a/' + r.slug + '.html">' + esc(r.title) + '</a></h3><p>' + esc(r.excerpt) + '</p><a href="/a/' + r.slug + '.html" class="read-more">Read More →</a></article>').join('') +
    '</div></section>' : '';

  return '<!DOCTYPE html>\n<html lang="en" dir="ltr" translate="no">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="google" content="notranslate">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(seoTitle(a.title)) + '</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<link rel="canonical" href="' + url + '">\n' +
    '<meta name="robots" content="' + (a.indexable === false ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1') + '">\n' +
    '<meta property="og:type" content="article">\n<meta property="og:site_name" content="' + SITE_NAME + '">\n' +
    '<meta property="og:title" content="' + esc(a.title) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:url" content="' + url + '">\n' +
    '<meta property="og:image" content="' + esc(img) + '">\n' +
    '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' +
    '<meta property="article:published_time" content="' + iso(a.date) + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="stylesheet" href="/css/style.css?v=' + ASSET_V + '">\n' +
    '<link rel="icon" href="/favicon.ico" type="image/x-icon">\n<link rel="manifest" href="/manifest.json">\n' +
    '<meta name="theme-color" content="#2563eb">\n<link rel="llms" href="/llms.txt">\n' +
    '<link rel="alternate" type="application/rss+xml" title="' + SITE_NAME + '" href="/rss.xml">\n' +
    '<script>try{if(localStorage.getItem("tp_theme")==="dark")document.documentElement.classList.add("dark-theme")}catch(e){}</script>\n' +
    '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>\n</head>\n<body>\n' +
    '<div id="readingProgressBar"></div>\n<header class="main-header"><div class="container">\n' +
    '<div class="logo"><a href="/index.html" aria-label="' + SITE_NAME + ' Home"><span>' + SITE_NAME + '</span></a></div>\n' +
    '<nav class="nav-links" aria-label="Main navigation">' + NAV + '</nav>\n</div></header>\n<main class="container">\n' +
    '<nav class="breadcrumb" style="margin:16px 0;font-size:0.9rem;color:var(--text-muted)" aria-label="Breadcrumb"><a href="/index.html">Home</a> &gt; <span>' + esc(a.category) + '</span></nav>\n' +
    '<article class="single-article" data-id="' + esc(a.id) + '">\n<header class="article-header">\n' +
    '<span class="article-category">' + esc(a.category) + '</span>\n<h1>' + esc(a.title) + '</h1>\n<div class="article-meta">\n' +
    '<span>👤 ' + esc(a.author || SITE_NAME) + '</span>\n<span>📅 ' + iso(a.date) + '</span>\n' +
    '<span>⏱ ' + mins + ' min read</span>\n<span id="tpViewsWrap" hidden>👁️ <span id="tpViews">0</span> views</span>\n</div>' +
    seriesHTML + '\n</header>\n' +
    (a.image ? '<img src="' + esc(a.image) + '" alt="' + esc(a.title) + '" class="article-hero-img" width="1200" height="630" loading="eager" fetchpriority="high">\n' : '') +
    '<div class="article-excerpt"><p>' + esc(a.excerpt) + '</p></div>\n' +
    '<div id="articleToc" class="article-toc-slot"></div>\n' +
    '<div class="article-content">\n' + body + '\n</div>\n' + faqHTML + '\n' +
    ((a.tags && a.tags.length) ? '<p class="tags-list">' + a.tags.map((t) => '<span class="tag">#' + esc(t) + '</span>').join(' ') + '</p>\n' : '') +
    '<div class="share-buttons" id="tpActions">\n' +
    '<button class="like-btn" id="tpLike" type="button" aria-label="Like">🤍 <span class="like-count">0</span></button>\n' +
    '<button class="share-btn" id="tpSave" type="button">🔖 Save</button>\n' +
    '<button class="share-btn" data-share="twitter" type="button">𝕏 Twitter</button>\n' +
    '<button class="share-btn" data-share="facebook" type="button">Facebook</button>\n' +
    '<button class="share-btn" data-share="linkedin" type="button">LinkedIn</button>\n' +
    '<button class="share-btn" data-share="whatsapp" type="button">WhatsApp</button>\n' +
    '<button class="share-btn" data-share="copy" type="button">🔗 Copy Link</button>\n</div>\n' +
    '<section class="comments-section" id="tpComments"><h2 class="section-heading">Comments</h2><div id="commentsContainer"></div></section>\n' +
    '<div class="back-row" style="text-align:center;margin-top:24px"><a href="/index.html" class="btn-secondary">← All articles</a></div>\n' +
    '</article>\n' + relatedHTML + '\n</main>\n<footer class="main-footer"><div class="container">\n' +
    '<p>&copy; ' + new Date().getFullYear() + ' ' + SITE_NAME + '. All rights reserved.</p>\n' +
    '<div class="footer-links"><a href="/about.html">About</a><a href="/contact.html">Contact</a><a href="/privacy-policy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/rss.xml">RSS</a><a href="/sitemap.xml">Sitemap</a></div>\n' +
    '</div></footer>\n<button id="scrollTopBtn" type="button" aria-label="Scroll to top">↑</button>\n' +
    '<script src="/js/cookie-consent.js?v=' + ASSET_V + '" defer></script>\n' +
    '<script src="/js/common.js?v=' + ASSET_V + '" defer></script>\n' +
    '<script src="/js/i18n.js?v=' + ASSET_V + '" defer></script>\n' +
    '<script src="/js/toc.js?v=' + ASSET_V + '" defer></script>\n' +
    '<script src="/js/static-article.js?v=' + ASSET_V + '" defer></script>\n' +
    '</body>\n</html>\n';
}

function seriesPage(s, all) {
  const items = s.matchSlugs.map((slug) => all.find((a) => a.slug === slug)).filter(Boolean);
  const url = SITE + '/series/' + s.slug + '.html';
  return '<!DOCTYPE html>\n<html lang="en"><head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(s.title) + ' — Series | ' + SITE_NAME + '</title>\n' +
    '<meta name="description" content="' + esc(s.description) + '">\n<link rel="canonical" href="' + url + '">\n' +
    '<link rel="stylesheet" href="/css/style.css?v=' + ASSET_V + '">\n' +
    '</head><body>\n<header class="main-header"><div class="container">\n' +
    '<div class="logo"><a href="/index.html"><span>' + SITE_NAME + '</span></a></div>\n' +
    '<nav class="nav-links">' + NAV + '</nav>\n</div></header>\n<main class="container">\n' +
    '<section class="hero-section" style="text-align:center;padding:40px 20px">\n' +
    '<div style="font-size:3.5rem;line-height:1">' + s.icon + '</div>\n<h1>' + esc(s.title) + '</h1>\n' +
    '<p style="color:var(--text-muted);max-width:640px;margin:12px auto">' + esc(s.description) + '</p>\n' +
    '<div style="display:inline-block;padding:5px 14px;background:var(--primary-soft);color:var(--primary);border-radius:999px;font-size:0.85rem;font-weight:600">' + items.length + ' articles</div>\n' +
    '</section>\n<section class="articles-grid" style="padding-bottom:60px">\n' +
    items.map((a) => '<article class="article-card"><span class="card-category">' + esc(a.category) + '</span><h3><a href="/a/' + a.slug + '.html">' + esc(a.title) + '</a></h3><p>' + esc(a.excerpt) + '</p><a href="/a/' + a.slug + '.html" class="read-more">Read More →</a></article>').join('\n') +
    '\n</section>\n</main>\n<footer class="main-footer"><div class="container"><p>&copy; ' + new Date().getFullYear() + ' ' + SITE_NAME + '.</p></div></footer>\n' +
    '<script src="/js/common.js?v=' + ASSET_V + '" defer></script>\n</body></html>\n';
}


// ---------- tools / guides / courses for the sitemap index ----------
async function loadTools() {
  try { const j = JSON.parse(await readFile(join(ROOT, 'data', 'tools.json'), 'utf8')); return Array.isArray(j) ? j : []; } catch { return []; }
}
async function loadGuides() {
  try { const j = JSON.parse(await readFile(join(ROOT, 'data', 'guides.json'), 'utf8')); return Array.isArray(j) ? j : []; } catch { return []; }
}
async function loadCourses() {
  if (!SUPABASE_KEY) return [];
  try {
    const url = SUPABASE_URL + '/rest/v1/courses?select=slug,code&order=code.asc&limit=500';
    const res = await fetch(url, { headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'User-Agent': 'techpulse-build/1.0 (server)',
      'X-Client-Info': 'techpulse-build'
    }});
    return res.ok ? (await res.json()) : [];
  } catch { return []; }
}
async function buildToolsSitemap() {
  const items = await loadTools();
  const urls = items.filter(t => t && (t.slug || t.id))
    .map(t => '  <url><loc>' + SITE + '/tools/' + (t.slug || t.id) + '.html</loc><lastmod>' + today + '</lastmod><changefreq>monthly</changefreq><priority>0.85</priority></url>')
    .join('\n');
  await writeFile(join(ROOT, 'sitemap-tools.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n');
  console.log('✓ sitemap-tools.xml (' + items.length + ')');
  return items.length;
}
async function buildGuidesSitemap() {
  const items = await loadGuides();
  const urls = items.filter(g => g && (g.slug || g.id))
    .map(g => '  <url><loc>' + SITE + '/guides/' + (g.slug || g.id) + '.html</loc><lastmod>' + today + '</lastmod><changefreq>monthly</changefreq><priority>0.85</priority></url>')
    .join('\n');
  await writeFile(join(ROOT, 'sitemap-guides.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n');
  console.log('✓ sitemap-guides.xml (' + items.length + ')');
  return items.length;
}
async function buildCoursesSitemap() {
  const items = await loadCourses();
  const urls = items.filter(c => c && c.slug)
    .map(c => '  <url><loc>' + SITE + '/course/' + c.slug + '.html</loc><lastmod>' + today + '</lastmod><changefreq>monthly</changefreq><priority>0.85</priority></url>')
    .join('\n');
  await writeFile(join(ROOT, 'sitemap-courses.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n');
  console.log('✓ sitemap-courses.xml (' + items.length + ')');
  return items.length;
}

// POST-BUILD-CONSISTENCY v1
// Rewrites deprecated links, injects slug-map + analytics on every generated
// HTML. Required because GitHub Pages is static-only: the generators rebuild
// HTML from scratch each run and would otherwise wipe these injection fixes.
async function postBuildConsistency() {
  const depMap = {};
  try {
    const aFiles = (await readdir(join(ROOT, 'a'))).filter((f) => f.endsWith('.html'));
    const aSet = new Set(aFiles);
    for (const f of aFiles) {
      const base = f.replace(/\.html$/, '');
      const m = base.match(/^(.+)-(\d{1,2})$/);
      if (!m) continue;
      const canonFile = m[1] + '.html';
      if (!aSet.has(canonFile)) continue;
      try {
        const h = await readFile(join(ROOT, 'a', f), 'utf8');
        if (/<meta\s+name="robots"[^>]*noindex/i.test(h)) depMap[base] = m[1];
      } catch {}
    }
  } catch (e) {
    console.warn('post-build: could not build depMap:', e.message);
  }

  async function walk(dir) {
    const out = [];
    let entries = [];
    try { entries = await readdir(join(ROOT, dir), { withFileTypes: true }); } catch { return out; }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.') || e.name.startsWith('_trash')) continue;
      const rel = dir ? dir + '/' + e.name : e.name;
      if (e.isDirectory()) out.push(...await walk(rel));
      else if (e.name.endsWith('.html')) out.push(rel);
    }
    return out;
  }

  const files = await walk('');
  let fixed = 0, addedSlug = 0, addedAna = 0;
  const tpAna = '  <script>window.TP_ANALYTICS = { plausible: \'pulsehig.com\' };</script>';

  for (const f of files) {
    let html = await readFile(join(ROOT, f), 'utf8');
    const before = html;

    for (const [oldSlug, newSlug] of Object.entries(depMap)) {
      const esc = oldSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('/a/' + esc + '\\.html(?=["\'?#>\\s)]|$)', 'g');
      html = html.replace(re, '/a/' + newSlug + '.html');
    }

    if (!html.includes('slug-map.js') && html.includes('js/common.js')) {
      const i = html.indexOf('js/common.js');
      const ls = html.lastIndexOf('\n', i);
      const at = ls < 0 ? 0 : ls + 1;
      html = html.slice(0, at) + '  <script src="/js/slug-map.js?v=' + ASSET_V + '"></script>\n' + html.slice(at);
      addedSlug++;
    }

    if (!html.includes('js/analytics.js')) {
      const idx = html.lastIndexOf('</body>');
      if (idx >= 0) {
        html = html.slice(0, idx) + tpAna + '\n  <script src="/js/analytics.js?v=' + ASSET_V + '" defer></script>\n' + html.slice(idx);
        addedAna++;
      }
    } else if (!html.includes('TP_ANALYTICS')) {
      const i = html.indexOf('js/analytics.js');
      const ls = html.lastIndexOf('\n', i);
      const at = ls < 0 ? 0 : ls + 1;
      html = html.slice(0, at) + tpAna + '\n' + html.slice(at);
    }

    if (html !== before) {
      await writeFile(join(ROOT, f), html);
      fixed++;
    }
  }
  console.log('post-build: ' + fixed + ' files updated (slug-map +' + addedSlug + ', analytics +' + addedAna + ')');
}

async function loadCanonicalOverrides() {
  try {
    const j = JSON.parse(await readFile(join(ROOT, 'data', 'canonical-overrides.json'), 'utf8'));
    const out = {};
    for (const [k, v] of Object.entries(j)) {
      if (k.startsWith('_')) continue;
      out[String(k)] = String(v);
    }
    return out;
  } catch { return {}; }
}

async function loadExistingSlugs() {
  try {
    const j = JSON.parse(await readFile(join(ROOT, 'data', 'static-slugs.json'), 'utf8'));
    return (j && typeof j === 'object') ? j : {};
  } catch { return {}; }
}

function depStubPage(title, canonicalSlug) {
  const t = String(title).replace(/[<>&'"]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&#39;','"':'&quot;'})[c]);
  return '<!DOCTYPE html>\n<html lang="en"><head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
    '<meta name="robots" content="noindex, follow">\n' +
    '<link rel="canonical" href="https://www.pulsehig.com/a/' + canonicalSlug + '.html">\n' +
    '<meta http-equiv="refresh" content="0; url=/a/' + canonicalSlug + '.html">\n' +
    '<title>' + t + '</title>\n' +
    '<script>location.replace("/a/' + canonicalSlug + '.html");<\/script>\n' +
    '</head><body><p>Redirecting to <a href="/a/' + canonicalSlug + '.html">/a/' + canonicalSlug + '.html</a></p></body></html>\n';
}

// Reads visit counters from Supabase (when a key is available) and bakes them into index.html.
async function bakeSiteStats() {
  const file = join(ROOT, 'data/site-stats.json');
  let stats = { total: 0, daily: 0 };
  try { stats = JSON.parse(await readFile(file, 'utf8')); } catch {}
  if (SUPABASE_KEY) {
    try {
      const r = await fetch(SUPABASE_URL + '/rest/v1/site_stats?select=total_visits,daily_visits,last_visit_date&id=eq.global',
        { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } });
      const rows = r.ok ? await r.json() : [];
      if (rows[0]) stats = { total: rows[0].total_visits || 0, daily: rows[0].last_visit_date === iso(new Date()) ? (rows[0].daily_visits || 0) : 0, date: iso(new Date()) };
    } catch (e) { console.warn('site_stats fetch failed:', e.message); }
  }
  await writeFile(file, JSON.stringify(stats, null, 1) + '\n');
  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  let h = await readFile(join(ROOT, 'index.html'), 'utf8');
  const re = /<!--TP_STATS_START-->[\s\S]*?<!--TP_STATS_END-->/;
  if (re.test(h)) {
    h = h.replace(re, () => '<!--TP_STATS_START--><span>👁️ Visits today: <strong>' + fmt(stats.daily) + '</strong></span><span style="margin:0 12px;opacity:.5">|</span><span>📊 Total visits: <strong>' + fmt(stats.total) + '</strong></span><!--TP_STATS_END-->');
    await writeFile(join(ROOT, 'index.html'), h);
    console.log('✓ visit counters baked into index.html (total ' + fmt(stats.total) + ')');
  }
}

// Puts real article links into the HTML (no JavaScript needed) between the TP_ARTICLES markers.
async function injectStatic(listed) {
  const card = (a) => '<article class="article-card"><span class="card-category">' + esc(a.category) + '</span><h3><a href="/a/' + a.slug + '.html">' + esc(a.title) + '</a></h3><p>' + esc(a.excerpt) + '</p><a href="/a/' + a.slug + '.html" class="read-more">Read more →</a></article>';
  for (const f of ['index.html', 'articles.html']) {
    let h; try { h = await readFile(join(ROOT, f), 'utf8'); } catch { continue; }
    const re = /<!--TP_ARTICLES_START-->[\s\S]*?<!--TP_ARTICLES_END-->/;
    if (!re.test(h)) { console.warn('No TP_ARTICLES markers in ' + f); continue; }
    const list = (f === 'index.html' ? listed.slice(0, 9) : listed).map(card).join('\n');
    h = h.replace(re, () => '<!--TP_ARTICLES_START-->\n' + list + '\n<!--TP_ARTICLES_END-->');
    // real counts instead of JS placeholders
    let courseCount = 0;
    try { courseCount = (await readdir(join(ROOT, 'course'))).filter((x) => x.endsWith('.html')).length; } catch {}
    h = h.replace(/(<strong id="previewCourses">)[^<]*(<\/strong>)/, '$1' + courseCount + '$2');
    await writeFile(join(ROOT, f), h);
  }
  console.log('✓ static article lists injected (' + listed.length + ' articles)');
}

// Course pages with too little text are kept but marked noindex and left out of the sitemap.
async function gateCourses() {
  let files = [];
  try { files = (await readdir(join(ROOT, 'course'))).filter((x) => x.endsWith('.html')); } catch { return; }
  const ok = [];
  for (const f of files) {
    const p = join(ROOT, 'course', f);
    let h = await readFile(p, 'utf8');
    const text = h.replace(/<(script|style|nav|header|footer)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
    const words = plain(text).split(/\s+/).filter(Boolean).length;
    const robots = /<meta\s+name="robots"[^>]*>/i;
    const want = words >= MIN_INDEX_WORDS ? 'index, follow, max-image-preview:large' : 'noindex, follow';
    if (robots.test(h)) h = h.replace(robots, '<meta name="robots" content="' + want + '">');
    else h = h.replace('</head>', '<meta name="robots" content="' + want + '">\n</head>');
    await writeFile(p, h);
    if (words >= MIN_INDEX_WORDS) ok.push(f.replace(/\.html$/, ''));
  }
  await writeFile(join(ROOT, 'sitemap-courses.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ok.map((slug) => '  <url><loc>' + SITE + '/course/' + slug + '.html</loc><lastmod>' + today + '</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>').join('\n') + '\n</urlset>\n');
  console.log('✓ courses: ' + ok.length + ' indexable of ' + files.length);
}

async function main() {
  await mkdir(join(ROOT, 'a'), { recursive: true });
  await mkdir(join(ROOT, 'series'), { recursive: true });
  await mkdir(join(ROOT, 'rss'), { recursive: true });

  // Load from Supabase
  let rawAll = (await loadFromSupabase()).filter((a) => a && a.id);
  if (rawAll.length === 0 && !SUPABASE_KEY) rawAll = (await loadLocal()).filter((a) => a && a.id);

  // SAFETY-GUARD: refuse to wipe when Supabase is empty
  if (rawAll.length === 0 && !process.env.SUPABASE_ALLOW_EMPTY) {
    console.error('');
    console.error('SAFETY ABORT: Supabase returned 0 articles. Refusing to wipe.');
    console.error('If this is a dry run: SUPABASE_ALLOW_EMPTY=1');
    console.error('');
    process.exit(1);
  }

  const overrides = await loadCanonicalOverrides();
  const existingSlugs = await loadExistingSlugs();
  rawAll.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
  const raw = rawAll.filter((a) => !overrides[String(a.id)]);
  let articles = [];
  const seenSlugs = new Set();

  for (const a of raw) {
    let slug = existingSlugs[String(a.id)];
    if (!slug) {
      slug = slugOf(a);
      if (seenSlugs.has(slug)) slug += '-' + String(a.id).replace(/[^a-z0-9]/gi, '').slice(-4);
    }
    seenSlugs.add(slug);
    articles.push({
      id: String(a.id), slug,
      title: plain(typeof a.title === 'object' ? (a.title.en || Object.values(a.title).find(Boolean)) : a.title),
      excerpt: cleanExcerpt(typeof a.excerpt === 'object' ? (a.excerpt.en || Object.values(a.excerpt).find(Boolean)) : a.excerpt).slice(0, 300),
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

  // Collect deprecated articles
  const deprecatedArticles = [];
  for (const a of rawAll) {
    const canId = overrides[String(a.id)];
    if (!canId) continue;
    const canon = articles.find((x) => x.id === canId);
    if (!canon) { console.warn('overrides: canonical ' + canId + ' missing for ' + a.id); continue; }
    deprecatedArticles.push({ id: String(a.id), canonicalSlug: canon.slug, raw: a });
  }

  // Load manual articles
  const manualList = [];
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

  // Quality gate: only articles with enough original depth are indexed / listed
  for (const a of articles) { a.words = wordCount(normalizeContent(a.content)); a.indexable = a.words >= MIN_INDEX_WORDS; }
  const listed = articles.filter((a) => a.indexable);
  const hiddenIds = [...Object.keys(overrides), ...articles.filter((a) => !a.indexable).map((a) => a.id)];
  console.log('Indexable: ' + listed.length + ' / ' + articles.length + ' (min ' + MIN_INDEX_WORDS + ' words). Hidden thin: ' + (articles.length - listed.length));

  // Write article pages
  let written = 0;
  for (const a of articles) {
    // Skip writing if it's a manual article WITH a file that we should preserve
    if (a.preserveFile) continue;
    await writeFile(join(ROOT, 'a', a.slug + '.html'), page(a, listed));
    written++;
  }
  console.log('✓ ' + written + ' article pages written');
  for (const d of deprecatedArticles) {
    const depSlug = d.canonicalSlug + '-' + d.id;
    const r = d.raw;
    const title = plain(typeof r.title === 'object' ? (r.title.en || Object.values(r.title).find(Boolean)) : r.title);
    await writeFile(join(ROOT, 'a', depSlug + '.html'), depStubPage(title, d.canonicalSlug));
    written++;
  }
  console.log('OK +' + deprecatedArticles.length + ' deprecated noindex pages');
  // Redirect stubs for old / duplicate URLs + removal of stale duplicate pages
  const produced = new Set(articles.map((x) => x.slug + '.html'));
  deprecatedArticles.forEach((d) => produced.add(d.canonicalSlug + '-' + d.id + '.html'));
  const redirects = await loadRedirects();
  for (const [oldSlug, newSlug] of Object.entries(redirects)) {
    if (!articles.some((x) => x.slug === newSlug) || produced.has(oldSlug + '.html')) continue;
    await writeFile(join(ROOT, 'a', oldSlug + '.html'), depStubPage(oldSlug, newSlug));
    produced.add(oldSlug + '.html');
  }
  for (const f of await readdir(join(ROOT, 'a'))) {
    if (f.endsWith('.html') && !produced.has(f)) { await unlink(join(ROOT, 'a', f)); console.log('removed stale a/' + f); }
  }
  const allArticles = articles;
  articles = listed;   // everything below (feeds, sitemaps, series, lists) uses only indexable articles
  // a/articles.json — fallback feed consumed by common.js loadFromA()
  const aIndex = articles.map((a) => ({
    id: a.id, slug: a.slug, title: a.title, excerpt: a.excerpt, content: a.content,
    category: a.category, author: a.author,
    date: a.date instanceof Date ? a.date.toISOString().slice(0, 10) : a.date,
    image: a.image || '',
    tags: a.tags || [], featured: !!a.featured,
    title_i18n: a.title_i18n || {},
    excerpt_i18n: a.excerpt_i18n || {},
    content_i18n: a.content_i18n || {}
  }));
  await writeFile(join(ROOT, 'a', 'articles.json'), JSON.stringify(aIndex, null, 2) + '\n');
  console.log('✓ a/articles.json written (' + aIndex.length + ')');

  // Write series pages
  for (const s of SERIES) {
    await writeFile(join(ROOT, 'series', s.slug + '.html'), seriesPage(s, articles));
  }
  console.log('✓ ' + SERIES.length + ' series pages written');

  // Save static-slugs.json (only Supabase articles, not manual)
  const slugMap = {};
  allArticles.filter((a) => !a.manual).forEach((a) => { slugMap[a.id] = a.slug; });
  await writeFile(join(ROOT, 'data', 'static-slugs.json'), JSON.stringify(slugMap, null, 1) + '\n');

  // write synchronous slug-map for GitHub Pages static-only hosting
  await mkdir(join(ROOT, 'js'), { recursive: true });
  await writeFile(join(ROOT, 'js', 'slug-map.js'),
    'window.TP_SLUG_MAP = ' + JSON.stringify(slugMap) + ';\nwindow.TP_HIDDEN_IDS = ' + JSON.stringify(hiddenIds) + ';\n');
  console.log('OK js/slug-map.js written (' + Object.keys(slugMap).length + ' entries)');
  await buildToolsSitemap();
  await buildGuidesSitemap();
  await buildCoursesSitemap();
  // Sitemap index — includes tools/guides/courses so nothing is missing
  await writeFile(join(ROOT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <sitemap><loc>' + SITE + '/sitemap-pages.xml</loc><lastmod>' + today + '</lastmod></sitemap>\n' +
    '  <sitemap><loc>' + SITE + '/sitemap-posts.xml</loc><lastmod>' + today + '</lastmod></sitemap>\n' +
    '  <sitemap><loc>' + SITE + '/sitemap-series.xml</loc><lastmod>' + today + '</lastmod></sitemap>\n' +
    '  <sitemap><loc>' + SITE + '/sitemap-tools.xml</loc><lastmod>' + today + '</lastmod></sitemap>\n' +
    '  <sitemap><loc>' + SITE + '/sitemap-guides.xml</loc><lastmod>' + today + '</lastmod></sitemap>\n' +
    '  <sitemap><loc>' + SITE + '/sitemap-courses.xml</loc><lastmod>' + today + '</lastmod></sitemap>\n' +
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
      '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>' + SITE_NAME + ' — ' + esc(cat) + '</title>\n<link>' + SITE + '/</link>\n' + catItems + '\n</channel>\n</rss>\n');
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

  console.log('✓ sitemap.xml, sub-sitemaps, rss.xml, per-category rss, robots.txt, llms.txt written');
  console.log('✅ Done. Total: ' + articles.length + ' articles, ' + SERIES.length + ' series');

  await injectStatic(articles);
  await bakeSiteStats();
  await gateCourses();
  await postBuildConsistency();
}

main().catch((e) => { console.error('❌', e); process.exit(1); });