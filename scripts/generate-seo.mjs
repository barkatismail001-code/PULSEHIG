// TechPulse â€” generates sitemap.xml and rss.xml from ALL articles.
// Source: Supabase (same table the site uses). Falls back to data/articles.json.
// Run:  node scripts/generate-seo.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';
const SUPABASE_URL = 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5NcPMPDtyNXRg-oduydRUA_JM6IeV9k';

const STATIC_PAGES = [
  ['/', 'daily', '1.0'],
  ['/news.html', 'hourly', '0.8'],
  ['/forum.html', 'daily', '0.7'],
  ['/about.html', 'monthly', '0.5'],
  ['/contact.html', 'monthly', '0.5'],
  ['/privacy-policy.html', 'yearly', '0.3'],
  ['/terms.html', 'yearly', '0.3'],
];

const today = new Date().toISOString().slice(0, 10);
const xml = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
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
const toDate = (d) => {
  const t = new Date(d);
  return isNaN(t) ? new Date(today) : t;
};

async function loadArticles() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/articles?select=id,title,excerpt,category,author,date,image&order=date.desc&limit=1000`;
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

const articles = (await loadArticles())
  .filter((a) => a && a.id)
  .map((a) => ({
    id: String(a.id),
    title: plain(pick(a.title)),
    excerpt: plain(pick(a.excerpt)).slice(0, 300),
    category: a.category || '',
    author: a.author || 'TechPulse',
    date: toDate(a.date),
    image: a.image && /^https?:\/\//.test(a.image) ? a.image : '',
  }))
  .sort((a, b) => b.date - a.date);

const link = (a) => `${SITE}/article.html?id=${encodeURIComponent(a.id)}`;
const iso = (d) => d.toISOString().slice(0, 10);

// ---- sitemap.xml ----
const urls = [
  ...STATIC_PAGES.map(([p, f, pr]) =>
    `  <url>\n    <loc>${SITE}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${f}</changefreq>\n    <priority>${pr}</priority>\n  </url>`),
  ...articles.map((a) =>
    `  <url>\n    <loc>${xml(link(a))}</loc>\n    <lastmod>${iso(a.date)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>${
      a.image ? `\n    <image:image><image:loc>${xml(a.image)}</image:loc></image:image>` : ''}\n  </url>`),
];
await writeFile(join(ROOT, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`);

// ---- rss.xml (latest 50) ----
const items = articles.slice(0, 50).map((a) =>
`    <item>
      <title>${xml(a.title)}</title>
      <link>${xml(link(a))}</link>
      <guid isPermaLink="true">${xml(link(a))}</guid>
      <pubDate>${a.date.toUTCString()}</pubDate>
      <author>contact@pulsehig.com (${xml(a.author)})</author>${a.category ? `\n      <category>${xml(a.category)}</category>` : ''}
      <description>${xml(a.excerpt)}</description>${a.image ? `\n      <enclosure url="${xml(a.image)}" type="image/jpeg" length="0"/>` : ''}
    </item>`);
await writeFile(join(ROOT, 'rss.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TechPulse</title>
    <link>${SITE}/</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Technical tutorials, embedded systems, programming, oil and gas engineering.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`);

// ---- robots.txt ----
await writeFile(join(ROOT, 'robots.txt'),
`User-agent: *
Allow: /
Disallow: /admin.html

Sitemap: ${SITE}/sitemap.xml
`);
console.log(`Done: sitemap (${urls.length} urls), rss (${items.length} items)`);
