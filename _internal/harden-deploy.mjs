// harden-deploy.mjs — one-shot: moves internal files, patches package.json,
// fixes Plausible domain, adds sync-articles guard, re-verifies.
// Run with: node harden-deploy.mjs
import { readFile, writeFile, readdir, rename, mkdir, access, stat } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

async function exists(p) { try { await access(p); return true; } catch { return false; } }

// ────────────────────────────────────────────────────────────
// 1. Move internal files to /_internal/
// ────────────────────────────────────────────────────────────
console.log('[1/5] Move internal files to _internal/');
const internalDir = join(ROOT, '_internal');
await mkdir(internalDir, { recursive: true });

const toMove = [
  'audit-report.txt',
  'verify-errors.txt',
  'fix-build.mjs',
  'fix-env.ps1',
  'fix-legacy.mjs',
  'fix-verify.mjs',
  'patch-seo.mjs',
  'patch-seo.ps1',
  'patch-seo.mjs',
  'patch-verify.mjs',
  '_mojibake.csv',
  '_mojibake-report.csv',
  '_mojibake-files.csv',
  '_canonicals_a.csv',
  '_csp_old.csv',
  '_csp_all.csv',
  '_inventory_a.csv',
  '_inventory_course.csv',
  '_inventory_js.csv',
  '_inventory_sitemap.csv',
  '_supabase_refs.csv',
  '_inventory_tree.txt',
  'harden-deploy.mjs'
];

let moved = 0;
for (const f of toMove) {
  const src = join(ROOT, f);
  const dst = join(internalDir, f);
  if (await exists(src)) {
    try {
      await rename(src, dst);
      console.log('  moved: ' + f);
      moved++;
    } catch (e) {
      console.log('  FAILED: ' + f + ' (' + e.message + ')');
    }
  }
}
console.log('  total: ' + moved + ' files moved');

// ────────────────────────────────────────────────────────────
// 2. Update .gitignore
// ────────────────────────────────────────────────────────────
console.log('[2/5] Update .gitignore');
const giPath = join(ROOT, '.gitignore');
let gi = await exists(giPath) ? await readFile(giPath, 'utf8') : '';
const additions = [
  '',
  '# === Auto-added by harden-deploy.mjs ===',
  '_internal/',
  '.env',
  '.env.*',
  '!.env.example',
  'PULSETECH-backup-*/',
  'node_modules/',
  'fix-*.mjs',
  'fix-*.ps1',
  'patch-*.mjs',
  'patch-*.ps1',
  'verify-errors.txt',
  'audit-report.txt',
  '_mojibake*.csv',
  '_*_a.csv',
  '_*_course.csv',
  '_*_js.csv',
  '_*_sitemap.csv',
  '_*_refs.csv',
  '_inventory*.txt'
];

// Add only lines that aren't already there
const missing = additions.filter(l => {
  const t = l.trim();
  if (!t || t.startsWith('#')) return false;
  return !new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'm').test(gi);
});

if (missing.length) {
  gi = gi.trimEnd() + '\n' + additions.join('\n') + '\n';
  await writeFile(giPath, gi);
  console.log('  added ' + missing.length + ' patterns');
} else {
  console.log('  already up to date');
}

// ────────────────────────────────────────────────────────────
// 3. Patch package.json — add verify scripts
// ────────────────────────────────────────────────────────────
console.log('[3/5] Patch package.json');
const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
pkg.scripts = pkg.scripts || {};
let pkgChanged = false;
if (!pkg.scripts.verify) {
  pkg.scripts.verify = 'node scripts/verify-build.mjs';
  pkgChanged = true;
}
if (!pkg.scripts['verify:full']) {
  pkg.scripts['verify:full'] = 'node scripts/generate-seo.mjs && node scripts/verify-build.mjs';
  pkgChanged = true;
}
if (pkgChanged) {
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('  added: verify, verify:full');
} else {
  console.log('  already present');
}

// ────────────────────────────────────────────────────────────
// 4. Fix Plausible domain (pulsehig.com -> www.pulsehig.com)
// ────────────────────────────────────────────────────────────
console.log('[4/5] Fix Plausible domain');
let plausibleFixed = 0;
async function walk(dir) {
  const entries = await readdir(join(ROOT, dir), { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.') ||
        e.name === '_internal' || e.name.startsWith('_trash')) continue;
    const rel = dir ? dir + '/' + e.name : e.name;
    if (e.isDirectory()) { await walk(rel); continue; }
    const ext = extname(e.name).toLowerCase();
    if (!['.html', '.js'].includes(ext)) continue;
    const p = join(ROOT, rel);
    const c = await readFile(p, 'utf8');
    if (c.includes("plausible: 'pulsehig.com'")) {
      const n = c.replace(/plausible:\s*'pulsehig\.com'/g, "plausible: 'www.pulsehig.com'");
      await writeFile(p, n);
      plausibleFixed++;
    } else if (c.includes('plausible: "pulsehig.com"')) {
      const n = c.replace(/plausible:\s*"pulsehig\.com"/g, 'plausible: "www.pulsehig.com"');
      await writeFile(p, n);
      plausibleFixed++;
    }
  }
}
await walk('');
console.log('  updated: ' + plausibleFixed + ' files');

// ────────────────────────────────────────────────────────────
// 5. Patch sync-articles.mjs — skip stubs
// ────────────────────────────────────────────────────────────
console.log('[5/5] Patch sync-articles.mjs');
const saPath = join(ROOT, 'scripts', 'sync-articles.mjs');
if (!await exists(saPath)) {
  console.log('  sync-articles.mjs not found — skipping');
} else {
  let sa = await readFile(saPath, 'utf8');
  if (sa.includes('SKIP_STUBS')) {
    console.log('  already patched');
  } else {
    // Find any "for (const X of ... )" loop that iterates file names in a/
    // Cover multiple common shapes.
    const candidates = [
      /for\s*\(\s*const\s+(\w+)\s+of\s+files\s*\)\s*\{/,
      /for\s*\(\s*const\s+(\w+)\s+of\s+htmlFiles\s*\)\s*\{/,
      /for\s*\(\s*const\s+(\w+)\s+of\s+await\s+listHtml\(['"]a['"]\)\s*\)\s*\{/,
      /for\s*\(\s*const\s+(\w+)\s+of\s+await\s+readdir\([^)]*['"]a['"][^)]*\)\s*\)\s*\{/
    ];
    let patched = false;
    for (const re of candidates) {
      const m = sa.match(re);
      if (m) {
        const v = m[1];
        const inject = m[0] + `
    // SKIP_STUBS: ignore noindex pages and redirect stubs
    try {
      const _p = join(ROOT, 'a', typeof ${v} === 'string' ? ${v} : ${v}.name);
      const _h = await readFile(_p, 'utf8');
      if (/<meta\\s+name="robots"[^>]*noindex/i.test(_h)) continue;
      if (/TP_REDIRECT_STUB|http-equiv="refresh"/i.test(_h)) continue;
    } catch {}`;
        sa = sa.replace(m[0], inject);
        patched = true;
        break;
      }
    }
    if (patched) {
      // Ensure readFile is imported
      if (!/import\s*\{[^}]*readFile[^}]*\}\s*from\s*['"]node:fs\/promises['"]/.test(sa)) {
        sa = sa.replace(
          /import\s*\{([^}]+)\}\s*from\s*['"]node:fs\/promises['"]/,
          (full, inner) => {
            const names = inner.split(',').map(s => s.trim()).filter(Boolean);
            if (!names.includes('readFile')) names.push('readFile');
            return `import { ${names.join(', ')} } from 'node:fs/promises'`;
          }
        );
      }
      await writeFile(saPath, sa);
      console.log('  patched: sync skips stubs');
    } else {
      console.log('  WARN: no recognizable file-loop found — manual inspection needed');
      console.log('  hint: grep "for (const" scripts/sync-articles.mjs');
    }
  }
}

console.log('\nDone.');

// ────────────────────────────────────────────────────────────
// Auto-run verify
// ────────────────────────────────────────────────────────────
console.log('\nRunning npm run verify...\n');
const { spawn } = await import('node:child_process');
await new Promise((res) => {
  const p = spawn('npm', ['run', 'verify'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true
  });
  p.on('exit', res);
});