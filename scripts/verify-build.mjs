// TechPulse — post-build verification (scripts/verify-build.mjs)
// Run after the generators: `npm run verify`. Exit code 1 = do NOT publish.
//
// Checks
//   1. every article that should have a page has one (static-slugs.json + manual-articles.json),
//      every tool / guide in data/*.json has its page, every course page is in the courses sitemap
//   2. no internal link (href/src) points to a missing file
//   3. every sitemap is well-formed XML with a single root, listed in sitemap.xml, free of duplicate
//      URLs, and every <loc> points to a file that exists
//   4. every generated page (a/, series/, tools/, guides/, course/) and every static page is in a sitemap
//   5. feeds only point to existing pages; generated pages that nothing links to are reported as orphans
//
// Errors fail the build; warnings (orphans, stale pages) are printed but do not.

import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, join, normalize, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };
const read = (p) => readFile(join(ROOT, p), 'utf8');

async function listHtml(dir) {
  try { return (await readdir(join(ROOT, dir))).filter((f) => f.endsWith('.html')).sort(); } catch { return []; }
}

async function readJson(p, fallback) {
  try {
    return JSON.parse((await read(p)).replace(/^\uFEFF/, ""));
  } catch (e) {
    // Missing files are OK (they may have been removed). Only error if the file exists but is malformed.
    if (await exists(join(ROOT, p))) {
      err(`${p}: invalid JSON (${e.message})`);
    }
    return fallback;
  }
}

function urlToFile(url) {
  if (!url.startsWith(SITE)) return null;
  let path = url.slice(SITE.length).split('#')[0].split('?')[0];
  if (path === '' || path === '/') return 'index.html';
  path = path.replace(/^\//, '');
  return path.endsWith('/') ? path + 'index.html' : path;
}

// ---------------------------------------------------------------- sitemaps
const SITEMAPS = ['sitemap-pages.xml', 'sitemap-posts.xml', 'sitemap-series.xml', 'sitemap-tools.xml', 'sitemap-guides.xml', 'sitemap-courses.xml'];
const sitemapUrls = new Map(); // file -> [urls]

async function checkXmlShape(file, rootTag) {
  let xml;
  try { xml = await read(file); } catch { err(`${file}: file is missing`); return null; }
  const decl = (xml.match(/<\?xml/g) || []).length;
  const opens = (xml.match(new RegExp(`<${rootTag}[\\s>]`, 'g')) || []).length;
  const closes = (xml.match(new RegExp(`</${rootTag}>`, 'g')) || []).length;
  if (decl !== 1 || opens !== 1 || closes !== 1) {
    err(`${file}: not a single well-formed XML document (xml declarations: ${decl}, <${rootTag}>: ${opens}, </${rootTag}>: ${closes})`);
    return null;
  }
  if (!xml.trimEnd().endsWith(`</${rootTag}>`)) err(`${file}: content found after </${rootTag}>`);
  return xml;
}

async function checkSitemaps() {
  const index = await checkXmlShape('sitemap.xml', 'sitemapindex');
  const listed = index ? [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()) : [];

  for (const name of SITEMAPS) {
    if (!listed.includes(`${SITE}/${name}`)) err(`sitemap.xml does not list ${name}`);
    const xml = await checkXmlShape(name, 'urlset');
    if (!xml) continue;
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    if (urls.length === 0) err(`${name}: contains no URLs`);
    sitemapUrls.set(name, urls);
  }
  for (const l of listed) {
    const f = urlToFile(l);
    if (!f || !(await exists(join(ROOT, f)))) err(`sitemap.xml lists ${l} but that file does not exist`);
  }

  // duplicates (inside one sitemap and across sitemaps) and dead URLs
  const seen = new Map();
  for (const [name, urls] of sitemapUrls) {
    for (const u of urls) {
      if (seen.has(u)) err(`duplicate sitemap URL ${u} (${seen.get(u)} and ${name})`);
      else seen.set(u, name);
      const f = urlToFile(u);
      if (!f) { err(`${name}: ${u} is not on ${SITE}`); continue; }
      if (!(await exists(join(ROOT, f)))) err(`${name}: ${u} has no file (${f})`);
    }
  }
  return seen;
}

// ---------------------------------------------------------------- required pages
async function checkRequiredPages(inSitemap) {
  const has = (path) => inSitemap.has(SITE + path);

  // articles that must have a page
  const staticSlugs = await readJson('data/static-slugs.json', {});
  const manual = await readJson('data/manual-articles.json', []);
  const required = new Set(Object.values(staticSlugs));
  for (const m of manual) if (m && m.slug && m.title) required.add(m.slug);
  for (const slug of required) {
    if (!(await exists(join(ROOT, 'a', slug + '.html')))) err(`article "${slug}" should have a page but a/${slug}.html is missing`);
  }

  // every page in a/ must be in the posts sitemap
  const articlePages = (await listHtml('a')).map((f) => f.replace(/\.html$/, ''));
  for (const slug of articlePages) {
    if (!has(`/a/${slug}.html`)) err(`a/${slug}.html exists but is not in the sitemap (stale page or incomplete build)`);
  }
  if (Object.keys(staticSlugs).length === 0 && articlePages.length > 0) {
    warn('data/static-slugs.json is empty: the last build probably could not read Supabase');
  }

  // series, tools, guides, courses
  for (const f of await listHtml('series')) {
    if (f !== 'index.html' && !has(`/series/${f}`)) err(`series/${f} is not in the sitemap`);
  }
  const tools = await readJson('data/tools.json', []);
  for (const t of tools) {
    const slug = t.slug || t.id;
    if (!slug) continue;
    if (!(await exists(join(ROOT, 'tools', slug + '.html')))) err(`tool "${slug}" has no page`);
    if (!has(`/tools/${slug}.html`)) err(`tool "${slug}" is not in the sitemap`);
  }
  const guides = await readJson('data/guides.json', []);
  for (const g of guides) {
    const slug = g.slug || g.id;
    if (!slug) continue;
    if (!(await exists(join(ROOT, 'guides', slug + '.html')))) err(`guide "${slug}" has no page`);
    if (!has(`/guides/${slug}.html`)) err(`guide "${slug}" is not in the sitemap`);
  }
  for (const f of await listHtml('course')) {
    if (f !== 'index.html' && !has(`/course/${f}`)) err(`course/${f} is not in the sitemap`);
  }
  // static pages listed in sitemap-pages.xml must exist (checked above), and the key hubs must be present
  for (const p of ['/', '/academy.html', '/tools.html', '/guides.html']) {
    if (!has(p)) err(`${p} is missing from sitemap-pages.xml`);
  }
}

// ---------------------------------------------------------------- internal links + orphans
async function walkHtml(dir, out = []) {
  let entries = [];
  try { entries = await readdir(join(ROOT, dir), { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const rel = dir ? posix.join(dir, e.name) : e.name;
    if (e.isDirectory()) await walkHtml(rel, out);
    else if (e.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

async function checkLinks(inSitemap) {
  const files = await walkHtml('');
  const linked = new Set();
  const broken = new Map();

  for (const f of files) {
    const html = await read(f);
    for (const m of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
      let u = m[1].trim();
      if (!u || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u) || u.includes('${') || u.includes('{{')) {
        if (u.startsWith(SITE)) u = u.slice(SITE.length) || '/'; else continue;
      }
      u = u.split('#')[0].split('?')[0];
      if (!u) continue;
      let target = u.startsWith('/') ? u.slice(1) : posix.join(posix.dirname(f), u);
      target = normalize(target).replace(/\\/g, '/');
      if (target === '' || target === '.') target = 'index.html';
      else if (target.endsWith('/')) target += 'index.html';
      if (!(await exists(join(ROOT, target)))) {
        if (!broken.has(target)) broken.set(target, []);
        broken.get(target).push(f);
      } else linked.add(target);
    }
  }
  for (const [t, from] of broken) err(`broken internal link -> ${t} (from ${from.length} file(s), e.g. ${from[0]})`);

  // orphans: generated pages that no page links to
  const sitemapFiles = new Set([...inSitemap.keys()].map(urlToFile).filter(Boolean));
  // question.html is a template opened by js/qa.js with ?id=..., 404/offline are served by the host / service worker
  const skip = new Set(['404.html', 'offline.html', 'admin.html', 'question.html']);
  for (const f of files) {
    if (skip.has(f) || linked.has(f)) continue;
    if (/^(a|series|tools|guides|course)\//.test(f) || !f.includes('/')) {
      warn(`orphan page (nothing links to it${sitemapFiles.has(f) ? ', only the sitemap does' : ''}): ${f}`);
    }
  }
}

// ---------------------------------------------------------------- feeds
async function checkFeeds() {
  const feeds = ['rss.xml'];
  try { for (const f of await readdir(join(ROOT, 'rss'))) if (f.endsWith('.xml')) feeds.push('rss/' + f); } catch { /* none */ }
  for (const f of feeds) {
    let xml;
    try { xml = await read(f); } catch { err(`${f}: missing`); continue; }
    if ((xml.match(/<rss[\s>]/g) || []).length !== 1 || (xml.match(/<\/rss>/g) || []).length !== 1) err(`${f}: not a single RSS document`);
    for (const m of xml.matchAll(/<link>([^<]+)<\/link>/g)) {
      const file = urlToFile(m[1].trim());
      if (file && file !== 'index.html' && !(await exists(join(ROOT, file)))) err(`${f}: links to missing page ${m[1]}`);
    }
  }
}

// ---------------------------------------------------------------- run
const inSitemap = await checkSitemaps();
await checkRequiredPages(inSitemap);
await checkLinks(inSitemap);
await checkFeeds();

for (const w of warnings) console.warn('⚠ ' + w);
for (const e of errors) console.error('✗ ' + e);
if (errors.length) {
  console.error(`\n❌ Build verification FAILED: ${errors.length} error(s), ${warnings.length} warning(s). Do not publish.`);
  process.exit(1);
}
console.log(`✅ Build verification passed (${inSitemap.size} sitemap URLs, ${warnings.length} warning(s)).`);
