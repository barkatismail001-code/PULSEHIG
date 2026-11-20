// Builds, from Supabase (the single source of truth):
//   a/<slug>.html   one static, SEO-ready page per published article
//   sitemap.xml     every page of the site
//   rss.xml         the 30 newest articles
// Run by .github/workflows/build.yml. No dependencies, no secrets (public read only).
// Local test:  node scripts/build-feeds.mjs

import { createRequire } from 'node:module';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CFG = require('../js/config.js');
const R = require('../js/render.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = R.esc;
const OFFLINE = process.argv.includes('--offline');   // only category pages + sitemap, no database needed

async function fetchAll() {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const url = `${CFG.SUPABASE_URL}/rest/v1/articles?select=*&published=eq.true&order=published_at.desc`;
    const res = await fetch(url, { headers: { apikey: CFG.SUPABASE_KEY, Range: `${from}-${from + 999}`, 'Range-Unit': 'items' } });
    if (!res.ok) throw new Error(`Supabase answered HTTP ${res.status}: ${await res.text()}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

const jsonLd = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

function pageHtml(a) {
  const url = R.absUrl(R.articlePath(a.slug));
  const img = a.cover_image || R.absUrl('/assets/og-default.png');
  const desc = a.excerpt || a.title;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', headline: a.title, description: desc, image: [img],
        datePublished: a.published_at, dateModified: a.updated_at || a.published_at,
        author: { '@type': 'Person', name: a.author || CFG.SITE_NAME },
        publisher: { '@type': 'Organization', name: CFG.SITE_NAME, logo: { '@type': 'ImageObject', url: R.absUrl('/assets/icon-512.png') } },
        mainEntityOfPage: url
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: R.absUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Articles', item: R.absUrl('/articles.html') },
          { '@type': 'ListItem', position: 3, name: a.title, item: url }
        ]
      }
    ]
  };
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'sha256-bhV/zGziN4P1gIM8lkwif7zwp0uXqZV0dEpCNP7uaz4=' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.web3forms.com https://hacker-news.firebaseio.com https://dev.to https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src https://www.youtube-nocookie.com; form-action 'self' https://api.web3forms.com; base-uri 'self'; object-src 'none'">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(a.title)} | ${CFG.SITE_NAME}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${CFG.SITE_NAME}">
  <meta property="og:title" content="${esc(a.title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${esc(img)}">
  <meta property="article:published_time" content="${esc(a.published_at)}">
  <meta property="article:section" content="${esc(a.category)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/assets/icon-192.png">
  <link rel="manifest" href="/manifest.json">
  <link rel="alternate" type="application/rss+xml" title="TechPulse RSS" href="/rss.xml">
  <script>try{if(localStorage.getItem("tp_theme")==="dark")document.documentElement.classList.add("dark-theme")}catch(e){}</script>
  <link rel="stylesheet" href="/css/style.css?v=2">
  <link rel="stylesheet" href="/css/extra.css?v=2">
  <script type="application/ld+json">${jsonLd(ld)}</script>
</head>
<body data-page="article" data-slug="${esc(a.slug)}" data-cat="${esc(a.category)}">
  <div id="tp-header"></div>
  <main class="container">
    <div class="tp-layout">
      <div><div id="articleRoot">${R.articleHtml(a)}</div><section id="related"></section></div>
      <aside id="sidebar" aria-label="Sidebar"></aside>
    </div>
  </main>
  <div id="tp-footer"></div>
  <script src="/js/config.js?v=2" defer></script>
  <script src="/js/render.js?v=2" defer></script>
  <script src="/js/site.js?v=2" defer></script>
</body>
</html>
`;
}

function catPageHtml(c) {
  const url = `${CFG.SITE_URL}/c/${c.slug}.html`;
  const title = `${c.name} — Guides, Fixes & Reviews | ${CFG.SITE_NAME}`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: c.name, description: c.desc, url },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: R.absUrl('/') },
        { '@type': 'ListItem', position: 2, name: c.name, item: url } ] }
    ]
  };
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'sha256-bhV/zGziN4P1gIM8lkwif7zwp0uXqZV0dEpCNP7uaz4=' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.web3forms.com https://hacker-news.firebaseio.com https://dev.to https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src https://www.youtube-nocookie.com; form-action 'self' https://api.web3forms.com; base-uri 'self'; object-src 'none'">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(c.desc)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${CFG.SITE_NAME}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(c.desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${R.absUrl('/assets/og-default.png')}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/assets/icon-192.png">
  <link rel="manifest" href="/manifest.json">
  <link rel="alternate" type="application/rss+xml" title="TechPulse RSS" href="/rss.xml">
  <script>try{if(localStorage.getItem("tp_theme")==="dark")document.documentElement.classList.add("dark-theme")}catch(e){}</script>
  <link rel="stylesheet" href="/css/style.css?v=2">
  <link rel="stylesheet" href="/css/extra.css?v=2">
  <script type="application/ld+json">${jsonLd(ld)}</script>
</head>
<body data-page="category" data-cat="${esc(c.name)}">
  <div id="tp-header"></div>
  <main class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> › ${esc(c.name)}</nav>
    <section class="tp-cat-hero">
      <h1>${c.icon} ${esc(c.name)}</h1>
      <p>${esc(c.desc)}</p>
      <div class="tp-chips" id="subChips" style="justify-content:flex-start;margin-top:18px"></div>
    </section>
    <div class="tp-section-head" style="margin-top:28px"><h2 id="subTitle">Latest in ${esc(c.name)}</h2></div>
    <div class="articles-grid" id="list" style="padding:0"></div>
    <div class="tp-more"><button type="button" class="btn-secondary" id="more" hidden>Load more</button></div>
  </main>
  <div id="tp-footer"></div>
  <script src="/js/config.js?v=2" defer></script>
  <script src="/js/render.js?v=2" defer></script>
  <script src="/js/site.js?v=2" defer></script>
  <script src="/js/category.js?v=2" defer></script>
</body>
</html>
`;
}

const STATIC_PAGES = ['/', '/articles.html', '/news.html', '/about.html', '/editorial-policy.html', '/contact.html', '/privacy-policy.html', '/terms.html',
  ...CFG.CATEGORIES.map((c) => `/c/${c.slug}.html`)];

/* Static pages that change whenever a new article is published (home, category pages, feeds) */
const DYNAMIC_STATIC = new Set(['/', ...CFG.CATEGORIES.map((c) => `/c/${c.slug}.html`)]);

function sitemap(articles) {
  const day = (d) => new Date(d).toISOString().slice(0, 10);
  /* For pages that list articles, use the latest article date.
     For truly static pages (about, privacy, etc.), omit lastmod rather than lie. */
  const latestArticleDay = articles.length ? day(articles[0].published_at) : day(Date.now());
  const urls = STATIC_PAGES.map((p) => {
    const freq = p === '/' ? 'daily' : 'monthly';
    const lastmod = DYNAMIC_STATIC.has(p) ? `<lastmod>${latestArticleDay}</lastmod>` : '';
    return `  <url><loc>${CFG.SITE_URL}${p}</loc>${lastmod}<changefreq>${freq}</changefreq></url>`;
  });
  for (const a of articles) {
    urls.push(`  <url><loc>${R.absUrl(R.articlePath(a.slug))}</loc><lastmod>${day(a.updated_at || a.published_at)}</lastmod><changefreq>monthly</changefreq></url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function rss(articles) {
  const items = articles.slice(0, 30).map((a) => {
    const url = R.absUrl(R.articlePath(a.slug));
    return `    <item>
      <title>${esc(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
      <category>${esc(a.category)}</category>
      <description>${esc(a.excerpt || '')}</description>
    </item>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${CFG.SITE_NAME}</title>
    <link>${CFG.SITE_URL}/</link>
    <description>Practical guides for home repair, ESP32 projects, electronics, car care and everyday tech.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

// Cache-busting: every CSS/JS reference gets a short hash of the file content (?v=xxxx),
// so browsers and CDNs fetch a new file the moment it changes and keep old ones cached otherwise.
const hashes = {};
for (const dirName of ['css', 'js']) {
  for (const f of fs.readdirSync(path.join(ROOT, dirName))) {
    if (!/\.(css|js)$/.test(f)) continue;
    hashes[`/${dirName}/${f}`] = crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, dirName, f))).digest('hex').slice(0, 8);
  }
}
const stamp = (html) => html.replace(/(["'])(\/(?:css|js)\/[\w.-]+)\?v=[\w]+/g, (m, q, p) => (hashes[p] ? `${q}${p}?v=${hashes[p]}` : m));

// 1) Category pages (come from js/config.js, no database needed)
const catDir = path.join(ROOT, 'c');
fs.rmSync(catDir, { recursive: true, force: true });
fs.mkdirSync(catDir, { recursive: true });
for (const c of CFG.CATEGORIES) fs.writeFileSync(path.join(catDir, `${c.slug}.html`), stamp(catPageHtml(c)));

// 2) Article pages, sitemap, RSS
let articles = [];
if (!OFFLINE) {
  articles = await fetchAll();                      // if this fails nothing below is touched
  const dir = path.join(ROOT, 'a');
  fs.rmSync(dir, { recursive: true, force: true }); // rebuilt from scratch every time: no stale or duplicate pages
  if (articles.length) fs.mkdirSync(dir, { recursive: true });
  for (const a of articles) fs.writeFileSync(path.join(dir, `${a.slug}.html`), stamp(pageHtml(a)));
  fs.writeFileSync(path.join(ROOT, 'rss.xml'), rss(articles));
  /* Only write sitemap when we have real data — avoids overwriting production sitemap
     with an empty article list during local --offline runs. */
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap(articles));
} else {
  /* --offline: category pages only. Never touch sitemap.xml or rss.xml so the
     production versions built from real data are preserved. */
  console.warn('[offline] Skipping sitemap.xml and rss.xml — using existing files.');
}

// 3) Re-stamp the hand-written root pages
for (const f of fs.readdirSync(ROOT).filter((n) => n.endsWith('.html'))) {
  const p = path.join(ROOT, f), before = fs.readFileSync(p, 'utf8'), after = stamp(before);
  if (after !== before) fs.writeFileSync(p, after);
}
console.log(`Built ${CFG.CATEGORIES.length} category page(s)` + (OFFLINE ? ' (offline mode)' : `, ${articles.length} article page(s), sitemap.xml and rss.xml`));
