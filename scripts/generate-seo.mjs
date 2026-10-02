// TechPulse â€” SEO build step.
// Generates (1) a static, crawlable HTML page per article in /a/<slug>.html,
// (2) sitemap.xml, (3) rss.xml, (4) robots.txt.
// Source: Supabase (same table the site uses), falling back to data/articles.json.
// Run:  node scripts/generate-seo.mjs
import { readFile, writeFile, mkdir, rm, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';
const SITE_NAME = 'TechPulse';
const SUPABASE_URL = 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5NcPMPDtyNXRg-oduydRUA_JM6IeV9k';
const DEFAULT_IMG = `${SITE}/assets/og-default.png`;

const STATIC_PAGES = [
  ['/', 'daily', '1.0'],
  ['/news.html', 'hourly', '0.6'],
  ['/forum.html', 'daily', '0.6'],
  ['/about.html', 'monthly', '0.4'],
  ['/contact.html', 'monthly', '0.4'],
  ['/privacy-policy.html', 'yearly', '0.2'],
  ['/terms.html', 'yearly', '0.2'],
];

const today = new Date().toISOString().slice(0, 10);
const esc = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' }[c]));
const pick = (f) => {
  if (f == null) return '';
  if (typeof f === 'string') {
    try { const o = JSON.parse(f); if (o && typeof o === 'object') return pick(o); } catch {}
    return f;
  }
  if (typeof f === 'object') return f.en || Object.values(f).find(Boolean) || '';
  return String(f);
};
const plain = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const toDate = (d) => { const t = new Date(d); return isNaN(t) ? new Date(today) : t; };
const iso = (d) => d.toISOString().slice(0, 10);

// MUST stay identical to articleSlug() in js/common.js
function slugOf(a) {
  const en = plain(pick(a.title));
  const slug = en.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/g, '');
  return slug || `article-${encodeURIComponent(String(a.id))}`;
}
function tagsOf(v) {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') { try { const a = JSON.parse(v); if (Array.isArray(a)) return a.map(String); } catch {} return v.split(',').map((x) => x.trim()).filter(Boolean); }
  return [];
}
async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function loadArticles() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/articles?select=id,title,excerpt,content,category,author,date,image,tags&order=date.desc&limit=1000`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) { console.log(`Supabase: ${data.length} articles`); return data; }
    } else console.warn('Supabase HTTP', res.status);
  } catch (e) { console.warn('Supabase unreachable:', e.message); }
  const json = JSON.parse(await readFile(join(ROOT, 'data/articles.json'), 'utf8'));
  console.log(`Fallback data/articles.json: ${json.length} articles`);
  return json;
}

async function resolveImage(img) {
  if (!img || typeof img !== 'string') return '';
  if (/^https?:\/\//.test(img)) return img;
  if (img.startsWith('data:')) return '';                       // base64 is useless for SEO
  const rel = img.replace(/^\/+/, '');
  if (await exists(join(ROOT, rel))) return `${SITE}/${rel}`;
  return '';
}

const raw = (await loadArticles()).filter((a) => a && a.id);
const articles = [];
const seen = new Set();
for (const a of raw) {
  let slug = slugOf(a);
  if (seen.has(slug)) { console.warn('Duplicate slug, rename one title:', slug); slug += '-' + String(a.id).replace(/[^a-z0-9]/gi, '').slice(-4); }
  seen.add(slug);
  const content = String(pick(a.content) || '');
  articles.push({
    id: String(a.id), slug,
    title: plain(pick(a.title)),
    excerpt: plain(pick(a.excerpt)).slice(0, 300),
    content,
    category: a.category || 'Tech',
    author: a.author || SITE_NAME,
    tags: tagsOf(a.tags),
    date: toDate(a.date),
    image: await resolveImage(a.image),
  });
}
articles.sort((x, y) => y.date - x.date);
const urlOf = (a) => `${SITE}/a/${a.slug}.html`;

// ---------------- static article pages ----------------
const NAV = `<a href="/index.html">Home</a><a href="/forum.html">Forum</a><a href="/news.html">News</a><a href="/about.html">About</a><a href="/contact.html">Contact</a>`;
function page(a) {
  const url = urlOf(a);
  const img = a.image || DEFAULT_IMG;
  const desc = a.excerpt || plain(a.content).slice(0, 155);
  const words = plain(a.content).split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  const body = a.content.split(/\n\n+/).filter((p) => p.trim())
    .map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('\n      ');
  const related = [...articles.filter((x) => x.id !== a.id && x.category === a.category),
                   ...articles.filter((x) => x.id !== a.id && x.category !== a.category)].slice(0, 3);
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Article', headline: a.title, description: desc, image: [img],
        datePublished: iso(a.date), dateModified: iso(a.date), mainEntityOfPage: url,
        author: { '@type': 'Person', name: a.author },
        publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE}/assets/og-default.png` } },
        keywords: a.tags.join(', '), articleSection: a.category, wordCount: words },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: a.category, item: `${SITE}/` },
        { '@type': 'ListItem', position: 3, name: a.title, item: url } ] },
    ],
  };
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(a.title)} | ${SITE_NAME}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${esc(a.title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${esc(img)}">
  <meta property="article:published_time" content="${iso(a.date)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/favicon.ico" type="image/x-icon">
  <link rel="alternate" type="application/rss+xml" title="${SITE_NAME}" href="/rss.xml">
  <link rel="stylesheet" href="/css/style.css">
  <script>try{if(localStorage.getItem('tp_theme')==='dark')document.documentElement.classList.add('dark-theme')}catch(e){}</script>
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <header class="main-header">
    <div class="container">
      <div class="logo"><a href="/index.html" aria-label="${SITE_NAME} Home"><span>${SITE_NAME}</span></a></div>
      <nav class="nav-links" aria-label="Main navigation">${NAV}</nav>
    </div>
  </header>
  <main class="container">
    <div class="breadcrumb" style="margin:16px 0;font-size:.9rem;color:var(--text-muted)">
      <a href="/index.html">Home</a> &gt; <span>${esc(a.category)}</span>
    </div>
    <article class="single-article">
      <header class="article-header">
        <span class="article-category">${esc(a.category)}</span>
        <h1>${esc(a.title)}</h1>
        <div class="article-meta"><span>ðŸ‘¤ ${esc(a.author)}</span> <span>ðŸ“… ${iso(a.date)}</span> <span>â± ${mins} min read</span></div>
      </header>
      ${a.image ? `<img src="${esc(a.image)}" alt="${esc(a.title)}" class="article-hero-img" width="1200" height="630">` : ''}
      <div class="article-excerpt"><p>${esc(a.excerpt)}</p></div>
      <div class="article-content">
      ${body}
      </div>
      ${a.tags.length ? `<p class="tags">${a.tags.map((t) => `<span class="tag">#${esc(t)}</span>`).join(' ')}</p>` : ''}
      <div class="back-row">
        <a class="btn-secondary" href="/article.html?id=${encodeURIComponent(a.id)}">â¤ï¸ Like, save &amp; comment</a>
        <a class="btn-secondary" href="/index.html">â† All articles</a>
      </div>
    </article>
    ${related.length ? `<section class="related-section">
      <h2 class="section-heading">ðŸ“š Related Articles</h2>
      <div class="articles-grid">
        ${related.map((r) => `<article class="article-card">
          <span class="card-category">${esc(r.category)}</span>
          <h3><a href="/a/${r.slug}.html">${esc(r.title)}</a></h3>
          <p>${esc(r.excerpt)}</p>
          <a href="/a/${r.slug}.html" class="read-more">Read More â†’</a>
        </article>`).join('\n        ')}
      </div>
    </section>` : ''}
  </main>
  <footer class="main-footer"><div class="container">
    <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</p>
    <div class="footer-links"><a href="/privacy-policy.html">Privacy Policy</a><a href="/terms.html">Terms of Service</a><a href="/rss.xml">RSS</a><a href="/sitemap.xml">Sitemap</a></div>
  </div></footer>
</body>
</html>
`;
}

await rm(join(ROOT, 'a'), { recursive: true, force: true });
await mkdir(join(ROOT, 'a'), { recursive: true });
for (const a of articles) await writeFile(join(ROOT, 'a', `${a.slug}.html`), page(a));

// ---------------- sitemap.xml ----------------
const urls = [
  ...STATIC_PAGES.map(([p, f, pr]) =>
    `  <url>\n    <loc>${SITE}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${f}</changefreq>\n    <priority>${pr}</priority>\n  </url>`),
  ...articles.map((a) =>
    `  <url>\n    <loc>${esc(urlOf(a))}</loc>\n    <lastmod>${iso(a.date)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>${
      a.image ? `\n    <image:image><image:loc>${esc(a.image)}</image:loc></image:image>` : ''}\n  </url>`),
];
await writeFile(join(ROOT, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`);

// ---------------- rss.xml ----------------
const items = articles.slice(0, 50).map((a) =>
  `    <item>\n      <title>${esc(a.title)}</title>\n      <link>${esc(urlOf(a))}</link>\n      <guid isPermaLink="true">${esc(urlOf(a))}</guid>\n      <pubDate>${a.date.toUTCString()}</pubDate>\n      <category>${esc(a.category)}</category>\n      <description>${esc(a.excerpt)}</description>\n    </item>`);
await writeFile(join(ROOT, 'rss.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE}/</link>
    <description>Embedded systems, Arduino/ESP32 projects and home &amp; car repair guides.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>
`);

// ---------------- robots.txt ----------------
await writeFile(join(ROOT, 'robots.txt'),
`User-agent: *
Allow: /
Disallow: /admin.html

Sitemap: ${SITE}/sitemap.xml
`);

console.log(`Done: ${articles.length} article pages, sitemap.xml, rss.xml, robots.txt`);
