// TechPulse — pre-publish checks
// Runs automatically in GitHub Actions after build-feeds.mjs.
// Also runnable locally: node scripts/checks.mjs
//
// Exit code 0 = all checks passed (build proceeds and commits).
// Exit code 1 = at least one CRITICAL check failed (build is blocked).
//
// Add new checks at the bottom. Keep each check focused on one thing.

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CFG  = require('../js/config.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0, warned = 0, failed = 0;

function ok(msg)   { console.log('  ✅ ' + msg); passed++; }
function warn(msg) { console.warn('  ⚠️  ' + msg); warned++; }
function fail(msg) { console.error('  ❌ ' + msg); failed++; }

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function readFile(rel)   { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function fileSize(rel)   { return fs.statSync(path.join(ROOT, rel)).size; }

// ── Helpers ─────────────────────────────────────────────────────────────────

function checkHtml(rel) {
  if (!fileExists(rel)) return null;
  return readFile(rel);
}

// ── 1. Required files exist ──────────────────────────────────────────────────
console.log('\n1. Required files');
const REQUIRED = [
  'index.html', 'sitemap.xml', 'rss.xml', 'robots.txt', 'favicon.ico',
  'manifest.json', 'CNAME', 'sw.js',
  'js/config.js', 'js/render.js', 'js/site.js',
  'css/style.css', 'css/extra.css',
  'assets/icon.svg', 'assets/og-default.png',
  ...CFG.CATEGORIES.map(c => `c/${c.slug}.html`)
];
for (const f of REQUIRED) {
  fileExists(f) ? ok(f) : fail('Missing: ' + f);
}

// ── 2. Sitemap ───────────────────────────────────────────────────────────────
console.log('\n2. Sitemap');
if (fileExists('sitemap.xml')) {
  const sm = readFile('sitemap.xml');
  const urls = (sm.match(/<loc>/g) || []).length;
  if (urls >= CFG.CATEGORIES.length + 3) ok('sitemap.xml has ' + urls + ' URLs');
  else fail('sitemap.xml looks too small (' + urls + ' URLs)');

  if (sm.includes(CFG.SITE_URL)) ok('Site URL in sitemap');
  else fail('Site URL (' + CFG.SITE_URL + ') not found in sitemap.xml');

  if (!sm.includes('undefined') && !sm.includes('null')) ok('No undefined/null values in sitemap');
  else fail('sitemap.xml contains "undefined" or "null"');
} else {
  fail('sitemap.xml not found');
}

// ── 3. RSS ──────────────────────────────────────────────────────────────────
console.log('\n3. RSS feed');
if (fileExists('rss.xml')) {
  const rss = readFile('rss.xml');
  if (rss.includes('<rss') && rss.includes('</channel>')) ok('rss.xml is well-formed');
  else fail('rss.xml looks malformed');

  if (!rss.includes('undefined') && !rss.includes('null')) ok('No undefined/null in rss.xml');
  else fail('rss.xml contains "undefined" or "null"');
} else {
  warn('rss.xml not found (expected after first real build)');
}

// ── 4. robots.txt ───────────────────────────────────────────────────────────
console.log('\n4. robots.txt');
if (fileExists('robots.txt')) {
  const rb = readFile('robots.txt');
  if (rb.includes('Sitemap:')) ok('robots.txt has Sitemap directive');
  else warn('robots.txt missing Sitemap: directive');
  const blocksRoot = rb.split(/\r?\n/).some(line => /^\s*Disallow:\s*\/(?:\s*#.*)?\s*$/i.test(line));
  if (!blocksRoot) ok('robots.txt does not block all pages (specific paths may be disallowed)');
  else fail('robots.txt blocks all pages with a root Disallow: / directive');
}

// ── 5. Category pages ────────────────────────────────────────────────────────
console.log('\n5. Category pages');
for (const c of CFG.CATEGORIES) {
  const rel = `c/${c.slug}.html`;
  const html = checkHtml(rel);
  if (!html) { fail('Missing: ' + rel); continue; }
  if (html.includes(c.name)) ok(`c/${c.slug}.html contains category name`);
  else warn(`c/${c.slug}.html may be missing category name "${c.name}"`);
  if (html.includes('<meta name="description"')) ok(`c/${c.slug}.html has meta description`);
  else fail(`c/${c.slug}.html missing meta description`);
}

// ── 6. Index page ────────────────────────────────────────────────────────────
console.log('\n6. index.html');
const idx = checkHtml('index.html');
if (idx) {
  if (idx.includes('application/ld+json')) ok('index.html has Schema.org JSON-LD');
  else fail('index.html missing Schema.org JSON-LD');
  if (idx.includes('og:title')) ok('index.html has Open Graph tags');
  else fail('index.html missing Open Graph tags');
  if (idx.includes('canonical')) ok('index.html has canonical tag');
  else fail('index.html missing canonical tag');
  if (!idx.includes('src="http://'))  ok('index.html has no non-HTTPS src');
  else fail('index.html loads resources over HTTP (mixed content)');
}

// ── 7. Article pages (sample check) ─────────────────────────────────────────
console.log('\n7. Article pages');
const aDir = path.join(ROOT, 'a');
if (fs.existsSync(aDir)) {
  const files = fs.readdirSync(aDir).filter(f => f.endsWith('.html'));
  if (files.length === 0) {
    warn('No article pages built yet (a/ is empty) — this is expected before the first real build');
  } else {
    ok(files.length + ' article page(s) found');
    // Spot-check the first 5 articles
    let artOk = 0, artFail = 0;
    for (const f of files.slice(0, 5)) {
      const html = readFile('a/' + f);
      const checks = [
        html.includes('<h1'),
        html.includes('application/ld+json'),
        html.includes('og:title'),
        html.includes('canonical'),
        html.includes('data-slug='),
        !html.includes('undefined'),
        !html.includes('null"')
      ];
      if (checks.every(Boolean)) artOk++;
      else { fail('Article page may be malformed: a/' + f); artFail++; }
    }
    if (artOk > 0) ok(artOk + ' spot-checked article(s) look well-formed');
    if (artFail > 0) fail(artFail + ' article(s) failed spot-check');
  }
} else {
  warn('a/ directory does not exist — expected after first full build');
}

// ── 8. File sizes ────────────────────────────────────────────────────────────
console.log('\n8. Asset sizes');
const SIZE_LIMITS = {
  'favicon.ico':         20  * 1024,   // 20 KB  (was 165 KB — now fixed)
  'css/style.css':       120 * 1024,   // 120 KB
  'css/extra.css':       60  * 1024,   // 60 KB
  'js/site.js':          80  * 1024,   // 80 KB
  'js/render.js':        60  * 1024,   // 60 KB
  'assets/og-default.png': 300 * 1024, // 300 KB (social sharing image)
};
for (const [rel, limit] of Object.entries(SIZE_LIMITS)) {
  if (!fileExists(rel)) continue;
  const size = fileSize(rel);
  const kb = Math.round(size / 1024);
  if (size <= limit) ok(`${rel}: ${kb} KB (within ${Math.round(limit/1024)} KB limit)`);
  else warn(`${rel}: ${kb} KB — over recommended ${Math.round(limit/1024)} KB`);
}

// ── 9. CNAME ─────────────────────────────────────────────────────────────────
console.log('\n9. CNAME');
if (fileExists('CNAME')) {
  const cname = readFile('CNAME').trim();
  const cfgHost = CFG.SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (cname === cfgHost) ok('CNAME matches SITE_URL in config.js');
  else warn(`CNAME (${cname}) does not match SITE_URL host (${cfgHost})`);
}

// ── 10. No secrets in client-visible files ───────────────────────────────────
console.log('\n10. Secret scan');
const CLIENT_JS = ['js/config.js', 'js/site.js', 'js/admin.js', 'js/render.js', 'js/home.js'];
const SECRET_PATTERNS = [
  /(?:SUPABASE_)?SERVICE_ROLE(?:_KEY)?\s*[:=]\s*['"][^'"]{20,}['"]/i,
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}/,  // JWT-shaped credential
];
let secretsOk = true;
for (const f of CLIENT_JS) {
  if (!fileExists(f)) continue;
  const src = readFile(f);
  for (const pat of SECRET_PATTERNS) {
    if (pat.test(src)) {
      fail(`Possible secret found in ${f} — do not commit service_role or private keys`);
      secretsOk = false;
    }
  }
}
if (secretsOk) ok('No obvious secrets found in client-side JS');

// ── 11. Page-view analytics wiring ──────────────────────────────────────────
console.log('\n11. Page-view analytics');
if (fileExists('sql/migrations/004_page_views.sql')) {
  const migration = readFile('sql/migrations/004_page_views.sql');
  if (/create\s+or\s+replace\s+function\s+public\.increment_page_view/i.test(migration)) ok('Page-view RPC migration exists');
  else fail('Page-view RPC migration is missing increment_page_view');
  if (/security\s+definer/i.test(migration) && /revoke\s+all\s+on\s+function\s+public\.increment_page_view/i.test(migration)) ok('Page-view RPC has restricted execution privileges');
  else fail('Page-view RPC privilege hardening is incomplete');
} else {
  fail('Missing sql/migrations/004_page_views.sql');
}
const siteJs = fileExists('js/site.js') ? readFile('js/site.js') : '';
if (siteJs.includes('TP.trackPageView') && siteJs.includes('rpc/increment_page_view')) ok('Public pages are wired to page-view RPC');
else fail('Public page-view tracking is not wired in js/site.js');

// ── 12. npm test entry point ──────────────────────────────────────────────────
console.log('\n12. Test command');
if (fileExists('package.json')) {
  try {
    const pkg = JSON.parse(readFile('package.json'));
    if (pkg.scripts && pkg.scripts.test === 'node scripts/checks.mjs') ok('npm test runs the pre-publish checks');
    else fail('npm test is not connected to scripts/checks.mjs');
  } catch (e) { fail('package.json is invalid JSON'); }
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log(`Results: ${passed} passed  |  ${warned} warnings  |  ${failed} failed`);
if (failed > 0) {
  console.error('\nBuild blocked: ' + failed + ' critical check(s) failed. Fix the issues above.');
  process.exit(1);
} else if (warned > 0) {
  console.log('\nBuild can proceed. Review the warnings above when you have a moment.');
} else {
  console.log('\nAll checks passed. 🎉');
}
