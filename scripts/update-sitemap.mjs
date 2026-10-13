// TechPulse — Build sitemaps from the files on disk.
// Disk state = what's actually deployed = source of truth for SEO.
// Runs after generate-seo.mjs, generate-courses.mjs, generate-tools-guides.mjs.

import { readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';
const TODAY = new Date().toISOString().slice(0, 10);

async function listHtml(dir) {
  try {
    return (await readdir(join(ROOT, dir))).filter(f => f.endsWith('.html') && f !== 'index.html').sort();
  } catch { return []; }
}

function wrapUrlset(urls) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n';
}

const DIR_TO_SITEMAP = {
  'a':      'sitemap-posts.xml',
  'course': 'sitemap-courses.xml',
  'tools':  'sitemap-tools.xml',
  'guides': 'sitemap-guides.xml',
  'series': 'sitemap-series.xml'
};

async function buildFromDir(dir, urlPrefix, priority) {
  const files = await listHtml(dir);
  const urls = files.map(f => {
    const slug = f.replace(/\.html$/, '');
    return '  <url><loc>' + SITE + urlPrefix + slug + '.html</loc><lastmod>' + TODAY + '</lastmod><changefreq>monthly</changefreq><priority>' + priority + '</priority></url>';
  }).join('\n');
  const out = DIR_TO_SITEMAP[dir] || ('sitemap-' + dir + '.xml');
  await writeFile(join(ROOT, out), wrapUrlset(urls));
  console.log('  ' + out + ' (' + files.length + ')');
  return files.length;
}

async function main() {
  console.log('Building sitemaps from disk...');

  await buildFromDir('a',      '/a/',      '0.8');
  await buildFromDir('course', '/course/', '0.85');
  await buildFromDir('tools',  '/tools/',  '0.85');
  await buildFromDir('guides', '/guides/', '0.85');
  await buildFromDir('series', '/series/', '0.7');

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
      '  <sitemap><loc>' + SITE + '/' + name + '</loc><lastmod>' + TODAY + '</lastmod></sitemap>'
    ).join('\n') + '\n</sitemapindex>\n';

  await writeFile(join(ROOT, 'sitemap.xml'), indexXml);
  console.log('  sitemap.xml (index: ' + subSitemaps.length + ' sub-sitemaps)');
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });