// fix-legacy.mjs — convert leftover legacy files in a/ to noindex stubs
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const A = join(ROOT, 'a');

async function exists(p) { try { await access(p); return true; } catch { return false; } }

// 1. Read sitemap-posts.xml — source of truth
const sp = await readFile(join(ROOT, 'sitemap-posts.xml'), 'utf8');
const inSitemap = new Set(
  [...sp.matchAll(/<loc>[^<]*\/a\/([^<]+)\.html<\/loc>/g)].map(m => m[1])
);
console.log('Sitemap has ' + inSitemap.size + ' entries\n');

// 2. List all files in a/
const files = await readdir(A);
const htmlFiles = files.filter(f => f.endsWith('.html') && f !== 'index.html');
console.log('Disk has ' + htmlFiles.length + ' html files in a/\n');

// 3. For each file: check if it's in sitemap OR already noindex
let converted = 0, skipped = 0, missingCanon = 0;

for (const f of htmlFiles) {
  const slug = f.replace(/\.html$/, '');
  if (inSitemap.has(slug)) { skipped++; continue; }

  const path = join(A, f);
  const html = await readFile(path, 'utf8');

  if (/<meta\s+name="robots"[^>]*noindex/i.test(html)) {
    skipped++;
    continue;
  }

  // Find canonical: strip trailing -N (or legacy -fix) and check if that file exists
  let canonSlug = slug.replace(/-\d{1,2}$/, '');
  // Handle legacy -fix names: they map via removal of -fix? No, they map to specific targets.
  // We build the -fix map from the filename pattern.
  const FIX_MAP = {
    'esp32-deep-sleep-fix': 'esp32-won-t-wake-from-deep-sleep-causes-and-fixes',
    'esp32-i2c-clock-stretching-timeout-fix': 'i2c-timeouts-when-your-esp32-freezes-in-real-life',
    'esp32-mosfet-dc-motor-control': 'driving-a-dc-motor-from-an-esp32-with-a-low-side-mosfet',
    'esp32-relay-chatter-fix': 'fixing-relay-chatter-when-switching-ac-loads-from-an-esp32',
    'esp32-wifi-dropping-fix': 'why-your-esp32-wi-fi-keeps-dropping-and-how-to-fix-it',
    'led-strip-flicker-fix': 'why-your-led-strip-flickers-pwm-power-and-ground-explained',
    'old-laptop-ssd-upgrade-guide': 'turn-a-2015-laptop-into-a-fast-machine-ssd-ram-upgrade-guide',
    'pc-wont-boot-fix': 'pc-won-t-boot-the-7-step-no-post-checklist',
    'raspberry-pi-overheating-fix': 'stop-your-raspberry-pi-from-overheating-in-a-closed-case',
    'router-keeps-rebooting-fix': 'router-keeps-rebooting-6-causes-you-can-fix-today'
  };
  if (FIX_MAP[slug]) canonSlug = FIX_MAP[slug];

  const canonFile = canonSlug + '.html';
  if (!inSitemap.has(canonSlug) && !await exists(join(A, canonFile))) {
    // No canonical — just add noindex (orphan)
    missingCanon++;
    const newHtml = html.replace(
      /<meta\s+name="robots"[^>]*>/i,
      '<meta name="robots" content="noindex, follow">'
    ).replace(
      '</head>',
      '<meta name="robots" content="noindex, follow">\n</head>'
    );
    // Simpler: if no existing robots meta, add one
    let patched;
    if (/<meta\s+name="robots"/i.test(html)) {
      patched = html.replace(/<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="noindex, follow">');
    } else {
      patched = html.replace('</head>', '  <meta name="robots" content="noindex, follow">\n</head>');
    }
    await writeFile(path, patched);
    console.log('  noindex only: ' + f);
    converted++;
    continue;
  }

  // Canonical exists — write a stub
  const stub = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="https://www.pulsehig.com/a/${canonSlug}.html">
<meta http-equiv="refresh" content="0; url=/a/${canonSlug}.html">
<title>Redirecting to /a/${canonSlug}.html</title>
<script>location.replace('/a/${canonSlug}.html' + (location.search || '') + (location.hash || ''));</script>
</head>
<body>
<p>Redirecting to <a href="/a/${canonSlug}.html">/a/${canonSlug}.html</a>…</p>
</body>
</html>
`;
  await writeFile(path, stub);
  console.log('  stub: ' + f + ' -> ' + canonFile);
  converted++;
}

console.log('\n=== Summary ===');
console.log('converted: ' + converted);
console.log('skipped (in sitemap or already noindex): ' + skipped);
console.log('no canonical (noindex only): ' + missingCanon);

// 4. Re-run verification
console.log('\nRunning verify-build.mjs...\n');
const { spawn } = await import('node:child_process');
await new Promise((res) => {
  const p = spawn(process.execPath, ['scripts/verify-build.mjs'], {
    cwd: ROOT,
    stdio: 'inherit'
  });
  p.on('exit', res);
});