// TechPulse — Generate sitemaps for tools, guides, courses
// Run: node scripts/update-sitemap.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';
const TODAY = new Date().toISOString().slice(0, 10);
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';

async function loadJson(path) {
  try {
    const raw = await readFile(path, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('  WARN: Could not load ' + path + ': ' + e.message);
    return [];
  }
}

async function fetchCourses() {
  if (!SUPABASE_KEY) {
    console.warn('  WARN: No SUPABASE_KEY, skipping courses');
    return [];
  }
  try {
    const url = SUPABASE_URL + '/rest/v1/courses?select=slug,title,code,university&order=code.asc&limit=500';
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    });
    if (!res.ok) {
      console.warn('  WARN: Supabase HTTP ' + res.status);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('  WARN: ' + e.message);
    return [];
  }
}

function wrapUrlset(urls) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls + '\n</urlset>\n';
}

async function main() {
  console.log('Generating extended sitemaps...\n');

  // 1) Tools sitemap
  const tools = await loadJson(join(ROOT, 'data', 'tools.json'));
  const toolsUrls = tools
    .filter(t => t && (t.slug || t.id))
    .map(t => {
      const slug = t.slug || t.id;
      return '  <url>\n    <loc>' + SITE + '/tools/' + slug + '.html</loc>\n    <lastmod>' + TODAY + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.85</priority>\n  </url>';
    })
    .join('\n');
  await writeFile(join(ROOT, 'sitemap-tools.xml'), wrapUrlset(toolsUrls));
  console.log('  sitemap-tools.xml (' + tools.length + ' tools)');

  // 2) Guides sitemap
  const guides = await loadJson(join(ROOT, 'data', 'guides.json'));
  const guidesUrls = guides
    .filter(g => g && (g.slug || g.id))
    .map(g => {
      const slug = g.slug || g.id;
      return '  <url>\n    <loc>' + SITE + '/guides/' + slug + '.html</loc>\n    <lastmod>' + TODAY + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.85</priority>\n  </url>';
    })
    .join('\n');
  await writeFile(join(ROOT, 'sitemap-guides.xml'), wrapUrlset(guidesUrls));
  console.log('  sitemap-guides.xml (' + guides.length + ' guides)');

  // 3) Courses sitemap
  const courses = await fetchCourses();
  const coursesUrls = courses
    .filter(c => c && c.slug)
    .map(c => {
      return '  <url>\n    <loc>' + SITE + '/course/' + c.slug + '.html</loc>\n    <lastmod>' + TODAY + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.85</priority>\n  </url>';
    })
    .join('\n');
  await writeFile(join(ROOT, 'sitemap-courses.xml'), wrapUrlset(coursesUrls));
  console.log('  sitemap-courses.xml (' + courses.length + ' courses)');

  // 4) Update sitemap.xml index
  const subSitemaps = [
    'sitemap-pages.xml',
    'sitemap-posts.xml',
    'sitemap-series.xml',
    'sitemap-tools.xml',
    'sitemap-guides.xml',
    'sitemap-courses.xml'
  ];

  const indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    subSitemaps.map(name =>
      '  <sitemap>\n    <loc>' + SITE + '/' + name + '</loc>\n    <lastmod>' + TODAY + '</lastmod>\n  </sitemap>'
    ).join('\n') + '\n</sitemapindex>\n';

  await writeFile(join(ROOT, 'sitemap.xml'), indexXml);
  console.log('  sitemap.xml (index updated with ' + subSitemaps.length + ' sub-sitemaps)');

  console.log('\nDone.');
  console.log('  Tools:   ' + tools.length);
  console.log('  Guides:  ' + guides.length);
  console.log('  Courses: ' + courses.length);
  console.log('  Total new URLs: ' + (tools.length + guides.length + courses.length));
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1); });