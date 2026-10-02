// TechPulse — SEO build step (Professional Edition)
// Generates:
//   1. Static crawlable HTML per article in /a/<slug>.html (with FAQ schema)
//   2. sitemap.xml (with image tags)
//   3. rss.xml
//   4. robots.txt (with AI bots)
//   5. llms.txt (for AI agents)
// Run: node scripts/generate-seo.mjs
import { readFile, writeFile, mkdir, rm, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';
const SITE_NAME = 'TechPulse';
const SITE_DESC = 'Engineering platform for embedded systems, microcontrollers, petroleum, natural gas, and programming.';
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

function slugOf(a) {
  const en = plain(pick(a.title));
  const slug = en.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/g, '');
  return slug || `article-${encodeURIComponent(String(a.id))}`;
}

function tagsOf(v) {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') {
    try { const a = JSON.parse(v); if (Array.isArray(a)) return a.map(String); } catch {}
    return v.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function loadArticles() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/articles?select=id,title,excerpt,content,category,author,date,image,tags&order=date.desc&limit=1000`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        console.log(`Supabase: ${data.length} articles`);
        return data;
      }
    } else console.warn('Supabase HTTP', res.status);
  } catch (e) { console.warn('Supabase unreachable:', e.message); }
  const json = JSON.parse(await readFile(join(ROOT, 'data/articles.json'), 'utf8'));
  console.log(`Fallback data/articles.json: ${json.length} articles`);
  return json;
}

async function resolveImage(img) {
  if (!img || typeof img !== 'string') return '';
  if (/^https?:\/\//.test(img)) return img;
  if (img.startsWith('data:')) return '';
  const rel = img.replace(/^\/+/, '');
  if (await exists(join(ROOT, rel))) return `${SITE}/${rel}`;
  return '';
}

function extractFAQs(content) {
  const sentences = plain(content).split(/(?<=[.!?])\s+/);
  const questions = sentences.filter(s => s.trim().endsWith('?') && s.length > 20 && s.length < 200);
  return questions.slice(0, 5).map(q => {
    const idx = sentences.indexOf(q);
    const answer = idx >= 0 && sentences[idx + 1] ? sentences[idx + 1].slice(0, 300) : '';
    return { q: q.trim(), a: answer };
  }).filter(item => item.a);
}

const raw = (await loadArticles()).filter((a) => a && a.id);
const articles = [];
const seen = new Set();
for (const a of raw) {
  let slug = slugOf(a);
  if (seen.has(slug)) {
    console.warn('Duplicate slug, renaming:', slug);
    slug += '-' + String(a.id).replace(/[^a-z0-9]/gi, '').slice(-4);
  }
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

  const faqs = extractFAQs(a.content);
  const faqLd = faqs.length ? {
    '@type': 'FAQPage',
    'mainEntity': faqs.map(f => ({
      '@type': 'Question',
      'name': f.q,
      'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
    }))
  } : null;

  const graphItems = [
    {
      '@type': 'Article',
      headline: a.title,
      description: desc,
      image: [img],
      datePublished: iso(a.date),
      dateModified: iso(a.date),
      mainEntityOfPage: url,
      author: { '@type': 'Person', name: a.author },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: `${SITE}/assets/og-default.png` }
      },
      keywords: a.tags.join(', '),
      articleSection: a.category,
      wordCount: words,
      inLanguage: ['en', 'zh', 'es', 'hi', 'fr']
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: a.category, item: `${SITE}/` },
        { '@type': 'ListItem', position: 3, name: a.title, item: url }
      ]
    }
  ];
  if (faqLd) graphItems.push(faqLd);

  const ld = { '@context': 'https://schema.org', '@graph': graphItems };

  const faqHTML = faqs.length ? `
    <section class="faq-section">
      <h2>Frequently Asked Questions</h2>
      ${faqs.map(f => `
        <details class="faq-item">
          <summary><strong>${esc(f.q)}</strong></summary>
          <p>${esc(f.a)}</p>
        </details>
      `).join('\n      ')}
    </section>` : '';

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(a.title)} | ${SITE_NAME}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${esc(a.title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${esc(img)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="article:published_time" content="${iso(a.date)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/favicon.ico" type="image/x-icon">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#2563eb">
  <link rel="llms" href="/llms.txt">
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
    <nav class="breadcrumb" style="margin:16px 0;font-size:.9rem;color:var(--text-muted)" aria-label="Breadcrumb">
      <a href="/index.html">Home</a> &gt; <span>${esc(a.category)}</span>
    </nav>
    <article class="single-article">
      <header class="article-header">
        <span class="article-category">${esc(a.category)}</span>
        <h1>${esc(a.title)}</h1>
        <div class="article-meta">
          <span>👤 ${esc(a.author)}</span>
          <span>📅 ${iso(a.date)}</span>
          <span>⏱ ${mins} min read</span>
        </div>
      </header>
      ${a.image ? `<img src="${esc(a.image)}" alt="${esc(a.title)}" class="article-hero-img" width="1200" height="630" loading="eager">` : ''}
      <div class="article-excerpt"><p>${esc(a.excerpt)}</p></div>
      <div class="article-content">
      ${body}
      </div>
      ${faqHTML}
      ${a.tags.length ? `<p class="tags">${a.tags.map((t) => `<span class="tag">#${esc(t)}</span>`).join(' ')}</p>` : ''}
      <div class="back-row">
        <a class="btn-secondary" href="/article.html?id=${encodeURIComponent(a.id)}">❤️ Like, save &amp; comment</a>
        <a class="btn-secondary" href="/index.html">← All articles</a>
      </div>
    </article>
    ${related.length ? `<section class="related-section">
      <h2 class="section-heading">📚 Related Articles</h2>
      <div class="articles-grid">
        ${related.map((r) => `<article class="article-card">
          <span class="card-category">${esc(r.category)}</span>
          <h3><a href="/a/${r.slug}.html">${esc(r.title)}</a></h3>
          <p>${esc(r.excerpt)}</p>
          <a href="/a/${r.slug}.html" class="read-more">Read More →</a>
        </article>`).join('\n        ')}
      </div>
    </section>` : ''}
  </main>
  <footer class="main-footer"><div class="container">
    <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</p>
    <div class="footer-links">
      <a href="/privacy-policy.html">Privacy Policy</a>
      <a href="/terms.html">Terms of Service</a>
      <a href="/rss.xml">RSS</a>
      <a href="/sitemap.xml">Sitemap</a>
    </div>
  </div></footer>
</body>
</html>
`;
}

await rm(join(ROOT, 'a'), { recursive: true, force: true });
await mkdir(join(ROOT, 'a'), { recursive: true });
for (const a of articles) await writeFile(join(ROOT, 'a', `${a.slug}.html`), page(a));

const urls = [
  ...STATIC_PAGES.map(([p, f, pr]) =>
    `  <url>\n    <loc>${SITE}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${f}</changefreq>\n    <priority>${pr}</priority>\n  </url>`),
  ...articles.map((a) =>
    `  <url>\n    <loc>${esc(urlOf(a))}</loc>\n    <lastmod>${iso(a.date)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>${
      a.image ? `\n    <image:image><image:loc>${esc(a.image)}</image:loc><image:caption>${esc(a.title)}</image:caption></image:image>` : ''}\n  </url>`),
];
await writeFile(join(ROOT, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`);

const items = articles.slice(0, 50).map((a) =>
  `    <item>\n      <title>${esc(a.title)}</title>\n      <link>${esc(urlOf(a))}</link>\n      <guid isPermaLink="true">${esc(urlOf(a))}</guid>\n      <pubDate>${a.date.toUTCString()}</pubDate>\n      <category>${esc(a.category)}</category>\n      <description>${esc(a.excerpt)}</description>\n    </item>`);
await writeFile(join(ROOT, 'rss.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE}/</link>
    <description>${esc(SITE_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>
`);

await writeFile(join(ROOT, 'robots.txt'),
`User-agent: *
Allow: /
Disallow: /admin.html

# AI Agents — welcome
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

# Sitemaps
Sitemap: ${SITE}/sitemap.xml
`);

const llmsContent = `# ${SITE_NAME}

> ${SITE_DESC}

TechPulse publishes deep technical articles in 5 languages (English, Chinese, Spanish, Hindi, French) covering:
- Embedded systems & microcontrollers (ESP32, ESP8266, STM32, Arduino)
- IoT hardware & firmware development
- Petroleum engineering (upstream, midstream, downstream)
- Natural gas processing & LNG technology
- Programming (Python, C, Embedded C, Git, APIs)

## Essential Pages
- [Home](${SITE}/index.html): Latest technical articles
- [Forum](${SITE}/forum.html): Live engineering community discussions
- [Live News](${SITE}/news.html): Tech & oil/gas headlines refreshed hourly
- [About](${SITE}/about.html): About TechPulse
- [Contact](${SITE}/contact.html): Reach the editorial team

## Featured Articles
${articles.slice(0, 15).map(a => `- [${a.title}](${urlOf(a)})`).join('\n')}

## Technical Standards
- All articles are original, technically reviewed, and cite real engineering principles.
- Content is structured with FAQ sections for AI citation.
- Images are optimized (1200x630 minimum) for Google Discover.
- Schema.org markup: Article, FAQPage, BreadcrumbList, Organization.

## Contact
- Website: ${SITE}
- Email: contact@pulsehig.com
`;

await writeFile(join(ROOT, 'llms.txt'), llmsContent);

console.log(`✅ Done: ${articles.length} article pages, sitemap.xml, rss.xml, robots.txt, llms.txt`);
