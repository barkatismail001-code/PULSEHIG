// patch-seo.mjs v2
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const GS = join(ROOT, 'scripts', 'generate-seo.mjs');
const CO = join(ROOT, 'data', 'canonical-overrides.json');

async function exists(p) { try { await access(p); return true; } catch { return false; } }

console.log('[1/6] canonical-overrides.json');
if (!await exists(CO)) {
  await mkdir(join(ROOT, 'data'), { recursive: true });
  await writeFile(CO, JSON.stringify({
    _comment: 'Deprecated article ID -> canonical ID.',
    '3': 32, '4': 24, '5': 25, '16': 28, '17': 29, '18': 30, '19': 31,
    '23': 2, '26': 7, '27': 14
  }, null, 2));
  console.log('  created');
} else {
  console.log('  present');
}

let g = await readFile(GS, 'utf8');
let changed = 0;

console.log('[2/6] Helpers');
if (!g.includes('loadCanonicalOverrides')) {
  const helpers = `
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
  return '<!DOCTYPE html>\\n<html lang="en"><head>\\n' +
    '<meta charset="UTF-8">\\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">\\n' +
    '<meta name="robots" content="noindex, follow">\\n' +
    '<link rel="canonical" href="https://www.pulsehig.com/a/' + canonicalSlug + '.html">\\n' +
    '<meta http-equiv="refresh" content="0; url=/a/' + canonicalSlug + '.html">\\n' +
    '<title>' + t + '</title>\\n' +
    '<script>location.replace("/a/' + canonicalSlug + '.html");<\\/script>\\n' +
    '</head><body><p>Redirecting to <a href="/a/' + canonicalSlug + '.html">/a/' + canonicalSlug + '.html</a></p></body></html>\\n';
}

`;
  const idx = g.indexOf('async function main() {');
  if (idx < 0) { console.error('  ERROR: main not found'); process.exit(1); }
  g = g.slice(0, idx) + helpers + g.slice(idx);
  changed++;
  console.log('  inserted');
} else {
  console.log('  present');
}

console.log('[3/6] Safety guard + overrides');
if (!g.includes('SAFETY-GUARD')) {
  const oldBlock = `  // Load from Supabase
  const raw = (await loadFromSupabase()).filter((a) => a && a.id);
  const articles = [];
  const seenSlugs = new Set();

  for (const a of raw) {
    let slug = slugOf(a);
    if (seenSlugs.has(slug)) slug += '-' + String(a.id).replace(/[^a-z0-9]/gi, '').slice(-4);
    seenSlugs.add(slug);`;
  const newBlock = `  // Load from Supabase
  const rawAll = (await loadFromSupabase()).filter((a) => a && a.id);

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
  const articles = [];
  const seenSlugs = new Set();

  for (const a of raw) {
    let slug = existingSlugs[String(a.id)];
    if (!slug) {
      slug = slugOf(a);
      if (seenSlugs.has(slug)) slug += '-' + String(a.id).replace(/[^a-z0-9]/gi, '').slice(-4);
    }
    seenSlugs.add(slug);`;
  if (!g.includes(oldBlock)) { console.error('  ERROR: raw block not found'); process.exit(1); }
  g = g.replace(oldBlock, newBlock);
  changed++;
  console.log('  replaced');
} else {
  console.log('  present');
}

console.log('[4/6] Deprecated collection');
if (!g.includes('deprecatedArticles')) {
  const oldM = `  // Load manual articles
  const manualList = [];`;
  const newM = `  // Collect deprecated articles
  const deprecatedArticles = [];
  for (const a of rawAll) {
    const canId = overrides[String(a.id)];
    if (!canId) continue;
    const canon = articles.find((x) => x.id === canId);
    if (!canon) { console.warn('overrides: canonical ' + canId + ' missing for ' + a.id); continue; }
    deprecatedArticles.push({ id: String(a.id), canonicalSlug: canon.slug, raw: a });
  }

  // Load manual articles
  const manualList = [];`;
  if (!g.includes(oldM)) { console.error('  ERROR: manual block not found'); process.exit(1); }
  g = g.replace(oldM, newM);
  changed++;
  console.log('  inserted');
} else {
  console.log('  present');
}

console.log('[5/6] slug-map writer');
if (!g.includes('slug-map.js written')) {
  const oldS = `  await writeFile(join(ROOT, 'data', 'static-slugs.json'), JSON.stringify(slugMap, null, 1) + '\\n');`;
  const newS = `  for (const d of deprecatedArticles) slugMap[d.id] = d.canonicalSlug;
  await writeFile(join(ROOT, 'data', 'static-slugs.json'), JSON.stringify(slugMap, null, 1) + '\\n');
  await mkdir(join(ROOT, 'js'), { recursive: true });
  await writeFile(join(ROOT, 'js', 'slug-map.js'),
    'window.TP_SLUG_MAP = ' + JSON.stringify(slugMap) + ';\\n');
  console.log('OK js/slug-map.js written (' + Object.keys(slugMap).length + ' entries)');`;
  if (!g.includes(oldS)) { console.error('  ERROR: static-slugs line not found'); process.exit(1); }
  g = g.replace(oldS, newS);
  changed++;
  console.log('  inserted');
} else {
  console.log('  present');
}

console.log('[6/6] Deprecated stubs');
if (!g.includes('deprecated noindex pages')) {
  // Regex: match any console.log(...) line containing "article pages written"
  const re = /\n(\s*)console\.log\([^\n]*article pages written[^\n]*\);/;
  const m = g.match(re);
  if (!m) {
    console.error('  ERROR: article-written log line not found');
    console.error('  Try: node -e "const fs=require(\'fs\');const g=fs.readFileSync(\'scripts/generate-seo.mjs\',\'utf8\');const i=g.indexOf(\'article pages written\');console.log(g.slice(i-100,i+100));"');
    process.exit(1);
  }
  const indent = m[1];
  const oldLine = m[0].slice(1); // drop leading \n
  const stubs = `
${indent}for (const d of deprecatedArticles) {
${indent}  const depSlug = d.canonicalSlug + '-' + d.id;
${indent}  const r = d.raw;
${indent}  const title = plain(typeof r.title === 'object' ? (r.title.en || Object.values(r.title).find(Boolean)) : r.title);
${indent}  await writeFile(join(ROOT, 'a', depSlug + '.html'), depStubPage(title, d.canonicalSlug));
${indent}  written++;
${indent}}
${indent}console.log('OK +' + deprecatedArticles.length + ' deprecated noindex pages');`;
  g = g.replace(oldLine, oldLine + stubs);
  changed++;
  console.log('  inserted');
} else {
  console.log('  present');
}

await writeFile(GS, g);
console.log(`\nDone. ${changed} patches applied.\n`);