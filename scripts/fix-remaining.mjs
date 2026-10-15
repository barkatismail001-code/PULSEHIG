// scripts/fix-remaining.mjs — fix package.json scripts + Plausible domain
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ────────────────────────────────────────────────────────────
// 1. package.json — add verify scripts
// ────────────────────────────────────────────────────────────
console.log('[1/2] Patch package.json');
const pkgPath = join(ROOT, 'package.json');
const raw = await readFile(pkgPath, 'utf8');
const pkg = JSON.parse(raw.replace(/^\uFEFF/, ''));
pkg.scripts = pkg.scripts || {};

let changed = 0;
if (!pkg.scripts.verify) {
  pkg.scripts.verify = 'node scripts/verify-build.mjs';
  changed++;
  console.log('  + scripts.verify');
} else {
  console.log('  = scripts.verify already present');
}
if (!pkg.scripts['verify:full']) {
  pkg.scripts['verify:full'] = 'node scripts/generate-seo.mjs && node scripts/verify-build.mjs';
  changed++;
  console.log('  + scripts.verify:full');
} else {
  console.log('  = scripts.verify:full already present');
}

if (changed > 0) {
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('  saved (' + changed + ' scripts added)');
} else {
  console.log('  no changes needed');
}

// ────────────────────────────────────────────────────────────
// 2. Plausible: pulsehig.com -> www.pulsehig.com
// ────────────────────────────────────────────────────────────
console.log('\n[2/2] Fix Plausible domain');
let fixed = 0;
let checked = 0;

async function walk(dir) {
  const entries = await readdir(join(ROOT, dir), { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.') ||
        e.name === '_internal' || e.name.startsWith('_trash')) continue;
    const rel = dir ? dir + '/' + e.name : e.name;
    if (e.isDirectory()) { await walk(rel); continue; }
    const ext = extname(e.name).toLowerCase();
    if (ext !== '.html' && ext !== '.js') continue;
    checked++;
    const p = join(ROOT, rel);
    let c = await readFile(p, 'utf8');
    const before = c;
    c = c.replace(/plausible:\s*'pulsehig\.com'/g, "plausible: 'www.pulsehig.com'");
    c = c.replace(/plausible:\s*"pulsehig\.com"/g, 'plausible: "www.pulsehig.com"');
    if (c !== before) {
      await writeFile(p, c);
      fixed++;
    }
  }
}

await walk('');
console.log('  checked: ' + checked + ' files');
console.log('  fixed:   ' + fixed + ' files');

console.log('\nDone.');