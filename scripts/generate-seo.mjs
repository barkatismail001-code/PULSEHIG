// TechPulse — SEO build step (Professional Edition)
// Generates:
//   1. Static crawlable HTML per article in /a/<slug>.html (with FAQ schema)
//   2. sitemap.xml (with image tags)
//   3. rss.xml
//   4. robots.txt (with AI bots)
//   5. llms.txt (for AI agents)
// Run: node scripts/generate-seo.mjs
import { readFile, writeFile, mkdir, rm, access, readdir, stat } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';
const SITE_NAME = 'TechPulse';
const SITE_DESC = 'Engineering platform for embedded systems, microcontrollers, petroleum, natural gas, and programming.';
const SUPABASE_URL = 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5NcPMPDtyNXRg-oduydRUA_JM6IeV9k';
const ASSET_V = '20261004a';
const DEFAULT_IMG = `${SITE}/assets/og-default.png`;
const OFFLINE = process.env.SEO_OFFLINE === '1'; // tests only: skip Supabase, handle hand-made pages only

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

// --- Search-result friendly <title> / meta description (never changes the article's own H1) ---
const TITLE_MAX = 60;
const DESC_MAX = 155;
function cutWords(str, max) {
  let t = String(str).trim();
  if (t.length <= max) return t;
  t = t.slice(0, max + 1);
  const i = t.lastIndexOf(' ');
  t = i > max * 0.6 ? t.slice(0, i) : t.slice(0, max);
  // never leave an unclosed bracket or a dangling connector word
  const open = t.lastIndexOf('(');
  if (open > -1 && t.indexOf(')', open) === -1) t = t.slice(0, open);
  let prev;
  do { prev = t; t = t.replace(/\s+(and|or|to|the|a|an|of|in|for|with|your|how|is|are|new|without|before|after|buying)$/i, ''); } while (t !== prev);
  return t.replace(/[\s,;:\-–—(\[]+$/, '');
}
function seoTitle(title) {
  const t = plain(title);
  const full = `${t} | ${SITE_NAME}`;
  if (full.length <= TITLE_MAX) return full;
  if (t.length <= TITLE_MAX) return t;
  return cutWords(t, TITLE_MAX);
}
function seoDesc(desc) {
  const d = plain(desc);
  if (d.length <= DESC_MAX) return d;
  const head = d.slice(0, DESC_MAX);
  let end = -1;
  for (const m of head.matchAll(/[.!?](?=\s|$)/g)) end = m.index;
  if (end >= 70) return head.slice(0, end + 1);
  return cutWords(d, DESC_MAX - 1) + '…';
}
const toDate = (d) => { const t = new Date(d); return isNaN(t) ? new Date(today) : t; };
const iso = (d) => d.toISOString().slice(0, 10);

function slugOf(a) {
  const en = plain(pick(a.title));
  let slug = en.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').replace(/^topic-/, '');
  if (slug.length > 60) {                       // cut at a whole word, not in the middle of one
    slug = slug.slice(0, 60);
    const i = slug.lastIndexOf('-');
    if (i > 30) slug = slug.slice(0, i);
  }
  slug = slug.replace(/-+$/g, '');
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
  if (OFFLINE) { console.warn('SEO_OFFLINE=1: Supabase skipped'); return []; }
  // Safety: this script deletes and rebuilds /a/. It only runs from live Supabase data;
  // if Supabase is unreachable it stops and leaves the existing pages untouched.
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
  console.error('Supabase returned no articles. Aborting so existing static pages are not deleted.');
  process.exit(1);
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

// Hand-made static articles: data/manual-articles.json (see README). Never deleted by this script.
async function loadManual() {
  try {
    const list = JSON.parse(await readFile(join(ROOT, 'data/manual-articles.json'), 'utf8'));
    return Array.isArray(list) ? list.filter((m) => m && m.slug && m.title) : [];
  } catch { return []; }
}
const manualList = await loadManual();

/* ---------- Automatic discovery of hand-made pages ----------
   Any a/<name>.html that is not a Supabase-generated page and not in manual-articles.json
   is treated as an article: its title, description, image, category and date are read from
   the HTML itself. The page is also made interactive (views, like, save, share, comments)
   and gets canonical/description/JSON-LD when it has none. Safe to run repeatedly. */
const unent = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
const metaOf = (html, attr, name) => {
  // Reads <meta ... attr="name" ... content="..."> in any attribute order. Quotes may be " or ',
  // and an apostrophe inside a double-quoted value (Won't) no longer cuts the text short.
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (!new RegExp(`\\b${attr}\\s*=\\s*(?:"${name}"|'${name}')`, 'i').test(tag)) continue;
    const c = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (c) return unent(c[1] ?? c[2] ?? '').trim();
  }
  return '';
};
const ARABIC = /[\u0600-\u06FF\u0750-\u077F]/;

function gitFirstDate(file) {
  try {
    const out = execSync(`git log --diff-filter=A --format=%cs -- "${file}"`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim().split('\n').filter(Boolean);
    return out.length ? out[out.length - 1] : '';
  } catch { return ''; }
}

const ACTIONS_HTML = `
<!-- tp-auto:actions -->
<div class="share-buttons" id="tpActions">
  <button class="like-btn" id="tpLike" type="button" aria-label="Like">\u{1F90D} <span class="like-count">0</span></button>
  <button class="share-btn" id="tpSave" type="button">\u{1F516} Save</button>
  <button class="share-btn" data-share="twitter" type="button">\u{1D54F} Twitter</button>
  <button class="share-btn" data-share="facebook" type="button">Facebook</button>
  <button class="share-btn" data-share="linkedin" type="button">LinkedIn</button>
  <button class="share-btn" data-share="whatsapp" type="button">WhatsApp</button>
  <button class="share-btn" data-share="copy" type="button">\u{1F517} Copy Link</button>
</div>
<section class="comments-section" id="tpComments">
  <h2 class="section-heading">Comments</h2>
  <div id="commentsContainer"></div>
</section>
<!-- /tp-auto:actions -->
`;

async function discoverManualPages(taken) {
  let files = [];
  try { files = (await readdir(join(ROOT, 'a'))).filter((f) => f.endsWith('.html')); } catch { return []; }
  const found = [];
  for (const f of files.sort()) {
    const slug = f.slice(0, -5);
    if (taken.has(slug)) continue;
    const path = join(ROOT, 'a', f);
    let html = await readFile(path, 'utf8');

    // A page generated for a Supabase article that no longer exists: not an article of ours.
    if (/data-id="(?!m-)[^"]+"/.test(html)) {
      console.warn(`a/${f} belongs to a Supabase article that no longer exists: ignored (delete it if obsolete).`);
      continue;
    }

    const original = html;
    {
      const tt = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (tt && plain(unent(tt[1])).length > TITLE_MAX) {
        const bare = plain(unent(tt[1])).replace(/\s*[|\-–]\s*TechPulse\s*$/i, '');
        html = html.replace(tt[0], () => `<title>${esc(seoTitle(bare))}</title>`);
      }
      const dm = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
      if (dm && unent(dm[1]).length > DESC_MAX + 5) {
        html = html.replace(dm[0], () => dm[0].replace(dm[1], () => esc(seoDesc(unent(dm[1])))));
      }
    }
    const url = `${SITE}/a/${slug}.html`;
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
    const titleTag = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
    const title = plain(unent(metaOf(html, 'property', 'og:title') || h1 || (titleTag || '').replace(/\s*[|\-–]\s*TechPulse\s*$/i, '')));
    if (!title) { console.warn(`a/${f}: no title found, skipped.`); continue; }

    const htmlView = html.replace(/<!-- tp-auto:related -->[\s\S]*?<!-- \/tp-auto:related -->/g, '');
    const bodyHtml = (htmlView.match(/<article[\s\S]*?<\/article>/i) || htmlView.match(/<main[\s\S]*?<\/main>/i) || htmlView.match(/<body[\s\S]*<\/body>/i) || [htmlView])[0]
      .replace(/<(script|style|nav|header|footer)[\s\S]*?<\/\1>/gi, ' ');
    const firstP = (bodyHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
    const excerpt = plain(unent(metaOf(html, 'name', 'description') || metaOf(html, 'property', 'og:description') || firstP || '')).slice(0, 300);
    const words = plain(unent(bodyHtml)).split(/\s+/).filter(Boolean).length;

    let category = metaOf(html, 'property', 'article:section') || metaOf(html, 'name', 'category')
      || plain(unent((html.match(/class=["'][^"']*article-category[^"']*["'][^>]*>([\s\S]*?)</i) || [])[1] || ''));
    if (!category || ARABIC.test(category)) category = 'Technology';

    const image = metaOf(html, 'property', 'og:image')
      || ((bodyHtml.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || '');
    const tags = tagsOf(metaOf(html, 'name', 'keywords'));
    const author = metaOf(html, 'name', 'author') || SITE_NAME;
    const dateStr = metaOf(html, 'property', 'article:published_time')
      || ((html.match(/<time[^>]+datetime=["']([^"']+)["']/i) || [])[1] || '')
      || gitFirstDate(`a/${f}`)
      || iso(new Date((await stat(path)).mtime));
    const date = toDate(dateStr);

    // --- make the page complete (idempotent) ---
    const before = html;
    if (!/<link[^>]+rel=["']canonical["']/i.test(html))
      html = html.replace(/<\/head>/i, `  <link rel="canonical" href="${url}">\n</head>`);
    if (!metaOf(html, 'name', 'description') && excerpt)
      html = html.replace(/<\/head>/i, `  <meta name="description" content="${esc(excerpt)}">\n</head>`);
    if (!/application\/ld\+json/i.test(html)) {
      const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: title, description: excerpt,
        datePublished: iso(date), dateModified: iso(date), mainEntityOfPage: url, author: { '@type': 'Person', name: author },
        publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE}/assets/og-default.png` } },
        ...(image ? { image: [/^https?:/.test(image) ? image : `${SITE}/${image.replace(/^\/+/, '')}`] } : {}) };
      html = html.replace(/<\/head>/i, `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n</head>`);
    }
    if (!html.includes('tp-auto:actions') && !html.includes('id="tpActions"')) {
      if (/<\/article>/i.test(html)) html = html.replace(/<\/article>/i, `${ACTIONS_HTML}</article>`);
      else if (/<\/main>/i.test(html)) html = html.replace(/<\/main>/i, `${ACTIONS_HTML}</main>`);
      else html = html.replace(/<\/body>/i, `${ACTIONS_HTML}</body>`);
    }
    if (!html.includes('/js/static-article.js'))
      html = html.replace(/<\/body>/i, `  <script src="/js/common.js?v=${ASSET_V}" defer></script>\n  <script src="/js/static-article.js?v=${ASSET_V}" defer></script>\n</body>`);
    if (html !== original) { await writeFile(path, html); console.log(`Enhanced hand-made page: a/${f}`); }

    found.push({ slug, title, excerpt, category, date: iso(date), image, tags, author, minutes: Math.max(1, Math.round(words / 200)) });
  }
  return found;
}

let prevSlugs = {};
try { prevSlugs = JSON.parse(await readFile(join(ROOT, 'data/static-slugs.json'), 'utf8')); } catch {}
const raw = (await loadArticles()).filter((a) => a && a.id);
const articles = [];
const seen = new Set(manualList.map((m) => m.slug)); // manual slugs are reserved
for (const a of raw) {
  let slug = prevSlugs[String(a.id)] || slugOf(a); // published URLs never change
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
    category: /[\u0600-\u06FF\u0750-\u077F]/.test(String(a.category || '')) ? 'Technology' : (a.category || 'Technology'),
    author: a.author || SITE_NAME,
    tags: tagsOf(a.tags),
    date: toDate(a.date),
    image: await resolveImage(a.image),
  });
}
for (const m of manualList) {
  const hasContent = !!String(m.content || '').trim();
  const file = join(ROOT, 'a', `${m.slug}.html`);
  if (!hasContent && !(await exists(file))) {
    console.warn(`Manual article "${m.slug}": no content in JSON and a/${m.slug}.html is missing - skipped.`);
    continue;
  }
  articles.push({
    id: `m-${m.slug}`, slug: m.slug, manual: true, hasContent,
    title: plain(m.title),
    excerpt: plain(m.excerpt || '').slice(0, 300),
    content: String(m.content || ''),
    category: m.category || 'Technology',
    author: m.author || SITE_NAME,
    tags: tagsOf(m.tags),
    date: toDate(m.date),
    image: await resolveImage(m.image),
  });
}
// Supabase slugs are known only after the loop above; reserve them before discovery.
const discovered = await discoverManualPages(new Set(seen));
for (const d of discovered) {
  articles.push({
    id: `m-${d.slug}`, slug: d.slug, manual: true, hasContent: false,
    title: d.title, excerpt: d.excerpt, content: '', category: d.category, author: d.author,
    tags: d.tags, date: toDate(d.date), image: await resolveImage(d.image),
  });
}
await writeFile(join(ROOT, 'data', 'auto-articles.json'), JSON.stringify(discovered, null, 1) + '\n');

articles.sort((x, y) => y.date - x.date);
const urlOf = (a) => `${SITE}/a/${a.slug}.html`;

const NAV = `<a href="/index.html">Home</a><a href="/forum.html">Forum</a><a href="/news.html">News</a><a href="/about.html">About</a><a href="/contact.html">Contact</a><button id="darkModeToggle" type="button" aria-pressed="false" aria-label="Switch theme">🌙</button>`;

// ---------- Content rendering (articles written by the Groq bot use light markdown) ----------
function inlineMd(s) {
  return esc(s)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>');
}
function renderContent(text) {
  const src = String(text || '').replace(/\r\n/g, '\n');
  const chunks = src.split(/```[a-zA-Z0-9+#-]*\n([\s\S]*?)```/); // even = prose, odd = code
  const out = [];
  chunks.forEach((chunk, i) => {
    if (i % 2) { out.push(`<pre><code>${esc(chunk.replace(/\n$/, ''))}</code></pre>`); return; }
    const blocks = chunk.replace(/^(#{1,3} .+)$/gm, '\n$1\n').split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
    for (const b of blocks) {
      let m;
      if ((m = b.match(/^###\s+(.+)$/))) out.push(`<h3>${inlineMd(m[1])}</h3>`);
      else if ((m = b.match(/^#{1,2}\s+(.+)$/))) out.push(`<h2>${inlineMd(m[1])}</h2>`);
      else if (b.split('\n').every((l) => /^\s*[-*•]\s+/.test(l)))
        out.push(`<ul>${b.split('\n').map((l) => `<li>${inlineMd(l.replace(/^\s*[-*•]\s+/, ''))}</li>`).join('')}</ul>`);
      else if (b.split('\n').every((l) => /^\s*\d+[.)]\s+/.test(l)))
        out.push(`<ol>${b.split('\n').map((l) => `<li>${inlineMd(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`);
      else out.push(`<p>${inlineMd(b).replace(/\n/g, '<br>')}</p>`);
    }
  });
  return out.join('\n      ');
}

// "## Frequently Asked Questions" followed by "### question" + answer paragraphs.
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

// Most related articles first: same category, shared tags, shared title words.
function relatedFor(a, n = 3) {
  const tagSet = new Set(a.tags.map((t) => t.toLowerCase()));
  const words = (t) => plain(t).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const titleWords = new Set(words(a.title));
  return articles.filter((x) => x.id !== a.id).map((x) => {
    let score = x.category === a.category ? 3 : 0;
    for (const t of x.tags) if (tagSet.has(t.toLowerCase())) score += 2;
    for (const w of words(x.title)) if (titleWords.has(w)) score += 1;
    return { x, score };
  }).sort((p, q) => q.score - p.score || q.x.date - p.x.date).slice(0, n).map((p) => p.x);
}

const relatedBlock = (list) => `<!-- tp-auto:related -->
<section class="related-section">
  <h2 class="section-heading">📚 Related Articles</h2>
  <div class="articles-grid">
    ${list.map((r) => `<article class="article-card">
      <span class="card-category">${esc(r.category)}</span>
      <h3><a href="/a/${r.slug}.html">${esc(r.title)}</a></h3>
      <p>${esc(r.excerpt)}</p>
      <a href="/a/${r.slug}.html" class="read-more">Read More →</a>
    </article>`).join('\n    ')}
  </div>
</section>
<!-- /tp-auto:related -->`;

function page(a) {
  const url = urlOf(a);
  const img = a.image || DEFAULT_IMG;
  const desc = seoDesc(a.excerpt || plain(a.content.replace(/[#*`]/g, '')));
  const words = plain(a.content).split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  const faqParsed = parseFaq(a.content);
  const faqs = faqParsed ? faqParsed.items : extractFAQs(a.content);
  const body = renderContent(faqParsed ? faqParsed.rest : a.content);

  const related = relatedFor(a, 3);

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
      inLanguage: 'en'
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
  <title>${esc(seoTitle(a.title))}</title>
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
  <link rel="stylesheet" href="/css/style.css?v=${ASSET_V}">
  <style>.article-content h2{margin:34px 0 12px;font-size:1.45rem;line-height:1.3}.article-content h3{margin:22px 0 8px;font-size:1.15rem}.article-content ul,.article-content ol{margin:0 0 18px 24px}.article-content li{margin-bottom:6px}.article-content pre{background:#0f172a;color:#e2e8f0;padding:14px 16px;border-radius:8px;overflow-x:auto;margin:0 0 18px;font-size:.9rem;line-height:1.5}.article-content code{font-family:ui-monospace,Menlo,Consolas,monospace}.article-content p code,.article-content li code{background:rgba(100,116,139,.15);padding:1px 5px;border-radius:4px}</style>
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
    <article class="single-article" data-id="${esc(a.id)}">
      <header class="article-header">
        <span class="article-category">${esc(a.category)}</span>
        <h1>${esc(a.title)}</h1>
        <div class="article-meta">
          <span>👤 ${esc(a.author)}</span>
          <span>📅 ${iso(a.date)}</span>
          <span>⏱ ${mins} min read</span>
          <span id="tpViewsWrap" hidden>👁️ <span id="tpViews">0</span> views</span>
        </div>
      </header>
      ${a.image ? `<img src="${esc(a.image)}" alt="${esc(a.title)}" class="article-hero-img" width="1200" height="630" loading="eager">` : ''}
      <div class="article-excerpt"><p>${esc(a.excerpt)}</p></div>
      <div class="article-content">
      ${body}
      </div>
      ${faqHTML}
      ${a.tags.length ? `<p class="tags">${a.tags.map((t) => `<span class="tag">#${esc(t)}</span>`).join(' ')}</p>` : ''}
      <div class="share-buttons" id="tpActions">
        <button class="like-btn" id="tpLike" type="button" aria-label="Like">🤍 <span class="like-count">0</span></button>
        <button class="share-btn" id="tpSave" type="button">🔖 Save</button>
        <button class="share-btn" data-share="twitter" type="button">𝕏 Twitter</button>
        <button class="share-btn" data-share="facebook" type="button">Facebook</button>
        <button class="share-btn" data-share="linkedin" type="button">LinkedIn</button>
        <button class="share-btn" data-share="whatsapp" type="button">WhatsApp</button>
        <button class="share-btn" data-share="copy" type="button">🔗 Copy Link</button>
      </div>
      <section class="comments-section" id="tpComments">
        <h2 class="section-heading">Comments</h2>
        <div id="commentsContainer"></div>
      </section>
      <div class="back-row">
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
  <script src="/js/common.js?v=${ASSET_V}" defer></script>
  <script src="/js/static-article.js?v=${ASSET_V}" defer></script>
</body>
</html>
`;
}

await mkdir(join(ROOT, 'a'), { recursive: true });

// Pages are never deleted automatically (a hand-made file in a/ is never put at risk).
// If an article was removed from Supabase its old page is only reported here.
let previous = {};
try { previous = JSON.parse(await readFile(join(ROOT, 'data/static-slugs.json'), 'utf8')); } catch {}
const currentSlugs = new Set(articles.map((a) => a.slug));
for (const [pid, pslug] of Object.entries(previous)) {
  if (!currentSlugs.has(pslug) && await exists(join(ROOT, 'a', `${pslug}.html`)))
    console.warn(`a/${pslug}.html is not in Supabase or manual-articles.json: left in place, not in sitemap/index. Delete the file if it is obsolete.`);
}

// Supabase articles + manual articles that have text in the JSON are (re)generated.
// A manual article without "content" keeps its hand-written file untouched.
for (const a of articles) {
  if (a.manual && !a.hasContent) continue;
  await writeFile(join(ROOT, 'a', `${a.slug}.html`), page(a));
}

// Hand-made pages (a/*.html written by you) get an auto-updated "Related Articles" block,
// so every article links to others (internal links help Google discover and rank pages).
for (const a of articles) {
  if (!(a.manual && !a.hasContent)) continue;
  const file = join(ROOT, 'a', `${a.slug}.html`);
  if (!(await exists(file))) continue;
  const list = relatedFor(a, 3);
  if (!list.length) continue;
  let html = await readFile(file, 'utf8');
  const block = relatedBlock(list);
  const re = /<!-- tp-auto:related -->[\s\S]*?<!-- \/tp-auto:related -->/;
  let next;
  if (re.test(html)) next = html.replace(re, () => block);
  else if (/<\/main>/i.test(html)) next = html.replace(/<\/main>/i, () => `${block}\n  </main>`);
  else next = html.replace(/<\/body>/i, () => `${block}\n</body>`);
  if (next !== html) await writeFile(file, next);
}

// index.html: plain HTML list of articles between <!-- tp-auto:latest --> markers (crawlable without JavaScript).
try {
  const idxFile = join(ROOT, 'index.html');
  const idx = await readFile(idxFile, 'utf8');
  const re = /<!-- tp-auto:latest -->[\s\S]*?<!-- \/tp-auto:latest -->/;
  if (re.test(idx)) {
    const items = articles.slice(0, 80).map((a) =>
      `<li><a href="/a/${a.slug}.html">${esc(a.title)}</a> <span class="all-articles-cat">${esc(a.category)}</span></li>`).join('\n      ');
    const block = `<!-- tp-auto:latest -->
<section class="all-articles" aria-labelledby="allArticlesHeading">
  <h2 id="allArticlesHeading" class="section-heading">All articles</h2>
  <ul class="all-articles-list">
      ${items}
  </ul>
</section>
<!-- /tp-auto:latest -->`;
    const next = idx.replace(re, () => block);
    if (next !== idx) await writeFile(idxFile, next);
  } else console.warn('index.html has no tp-auto:latest markers: article list not updated.');
} catch (e) { console.warn('index.html list skipped:', e.message); }

await writeFile(join(ROOT, 'data', 'static-slugs.json'),
  JSON.stringify(Object.fromEntries(articles.map((a) => [a.id, a.slug])), null, 1) + '\n');

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

TechPulse publishes practical technical articles in English (the site interface is also available in Chinese, Spanish, Hindi and French) covering:
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

console.log(`✅ Done: ${articles.length} article pages, static-slugs.json, sitemap.xml, rss.xml, robots.txt, llms.txt`);
