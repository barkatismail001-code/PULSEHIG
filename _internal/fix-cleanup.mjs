// fix-cleanup.mjs — comprehensive cleanup + workflow fixes
import { readdir, readFile, writeFile, rename, mkdir, access, unlink } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const INTERNAL = join(ROOT, '_internal');
const DRY = process.argv.includes('--dry-run');

console.log(DRY ? '=== DRY RUN (no changes) ===' : '=== LIVE RUN ===\n');

const stats = { moved: 0, deleted: 0, patched: 0, skipped: 0 };

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function walk(dir, exts = []) {
  const out = [];
  const entries = await readdir(join(ROOT, dir), { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name === '_internal' || e.name.startsWith('_trash')) continue;
    const rel = dir ? dir + '/' + e.name : e.name;
    if (e.isDirectory()) {
      out.push(...await walk(rel, exts));
    } else if (exts.length === 0 || exts.includes(extname(e.name).toLowerCase())) {
      out.push(rel);
    }
  }
  return out;
}

// ────────────────────────────────────────────────
// 1. Remove duplicate workflows
// ────────────────────────────────────────────────
console.log('[1/9] Remove duplicate workflows');
const wfDir = join(ROOT, '.github', 'workflows');
const wfFiles = await exists(wfDir) ? await readdir(wfDir) : [];
console.log('  existing: ' + (wfFiles.join(', ') || '(none)'));

if (wfFiles.includes('translate.yml') && wfFiles.includes('translate-articles.yml')) {
  if (!DRY) await unlink(join(wfDir, 'translate.yml'));
  console.log('  removed: translate.yml (dup of translate-articles.yml)');
  stats.deleted++;
} else {
  console.log('  skip: translate pair not both present');
}

if (wfFiles.includes('seo-rebuild.yml') && wfFiles.includes('seo.yml')) {
  if (!DRY) await unlink(join(wfDir, 'seo-rebuild.yml'));
  console.log('  removed: seo-rebuild.yml (dup of seo.yml)');
  stats.deleted++;
} else {
  console.log('  skip: seo pair not both present');
}

// ────────────────────────────────────────────────
// 2. Patch daily-bot.yml
// ────────────────────────────────────────────────
console.log('\n[2/9] Patch daily-bot.yml');
const dbPath = join(wfDir, 'daily-bot.yml');
if (await exists(dbPath)) {
  let y = await readFile(dbPath, 'utf8');
  const orig = y;

  if (!y.includes('permissions:')) {
    y = y.replace(/^jobs:/m, 'permissions:\n  contents: write\n\njobs:');
    console.log('  + added permissions: contents: write');
  }

  if (!y.includes('Rebuild static pages')) {
    const rebuild = `      - name: Rebuild static pages
        env:
          SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: \${{ secrets.SUPABASE_SERVICE_KEY }}
        run: node scripts/generate-seo.mjs

      - name: Commit regenerated files
        run: |
          if git diff --quiet; then
            echo "No changes"
          else
            git config user.name "TechPulse Bot"
            git config user.email "bot@pulsehig.com"
            git add -A
            git commit -m "Bot: rebuild SEO after daily article"
            git push
          fi

`;
    y = y.replace(/(\n\s+- name: Summary)/, '\n' + rebuild + '$1');
    console.log('  + added rebuild + commit steps');
  }

  if (y !== orig) {
    if (!DRY) await writeFile(dbPath, y);
    stats.patched++;
    console.log('  patched');
  } else {
    console.log('  no changes needed');
  }
} else {
  console.log('  daily-bot.yml not found');
}

// ────────────────────────────────────────────────
// 3. Move one-off scripts to _internal
// ────────────────────────────────────────────────
console.log('\n[3/9] Move one-off scripts to _internal/');
const oneOff = ['setup-actions.mjs', 'patch-admin.mjs', 'harden-deploy.mjs'];
for (const f of oneOff) {
  const src = join(ROOT, f);
  if (await exists(src)) {
    if (!DRY) {
      await mkdir(INTERNAL, { recursive: true });
      await rename(src, join(INTERNAL, f));
    }
    console.log('  moved: ' + f);
    stats.moved++;
  }
}

// ────────────────────────────────────────────────
// 4. Move unused scripts
// ────────────────────────────────────────────────
console.log('\n[4/9] Move unused scripts');
const unused = [
  'delete-dupes.mjs',
  'diag-escaped.mjs',
  'fix-duration.mjs',
  'seed-6-0001.mjs',
  'seed-rest-courses.mjs'
];
for (const s of unused) {
  const src = join(ROOT, 'scripts', s);
  if (await exists(src)) {
    if (!DRY) {
      await mkdir(join(INTERNAL, 'scripts'), { recursive: true });
      await rename(src, join(INTERNAL, 'scripts', s));
    }
    console.log('  moved: scripts/' + s);
    stats.moved++;
  }
}

// ────────────────────────────────────────────────
// 5. Patch sync-articles.mjs (skip stubs, do NOT move)
// ────────────────────────────────────────────────
console.log('\n[5/9] Patch sync-articles.mjs');
const saPath = join(ROOT, 'scripts', 'sync-articles.mjs');
if (await exists(saPath)) {
  let sa = await readFile(saPath, 'utf8');
  if (sa.includes('SKIP_STUBS')) {
    console.log('  already patched');
  } else {
    const anchors = [
      /for\s*\(\s*const\s+(\w+)\s+of\s+files\s*\)\s*\{/,
      /for\s*\(\s*const\s+(\w+)\s+of\s+htmlFiles\s*\)\s*\{/,
      /for\s*\(\s*const\s+(\w+)\s+of\s+await\s+readdir\([^)]*a[^)]*\)\s*\)\s*\{/,
      /for\s*\(\s*const\s+(\w+)\s+of\s+await\s+listHtml\(['"]a['"]\)\s*\)\s*\{/
    ];
    let patched = false;
    for (const re of anchors) {
      const m = sa.match(re);
      if (m) {
        const v = m[1];
        const inject = m[0] + `
    // SKIP_STUBS: ignore noindex + redirect stubs
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
      // ensure readFile imported
      if (!/import\s*\{[^}]*readFile[^}]*\}\s*from\s*['"]node:fs\/promises['"]/.test(sa)) {
        sa = sa.replace(
          /import\s*\{([^}]+)\}\s*from\s*['"]node:fs\/promises['"]/,
          (full, inner) => {
            const names = inner.split(',').map(x => x.trim()).filter(Boolean);
            if (!names.includes('readFile')) names.push('readFile');
            return `import { ${names.join(', ')} } from 'node:fs/promises'`;
          }
        );
      }
      if (!DRY) await writeFile(saPath, sa);
      console.log('  + added SKIP_STUBS guard');
      stats.patched++;
    } else {
      console.log('  WARN: no file loop found -- manual review needed');
    }
  }
} else {
  console.log('  sync-articles.mjs not found');
}

// ────────────────────────────────────────────────
// 6. Clean assets/articles/ duplicates
// ────────────────────────────────────────────────
console.log('\n[6/9] Clean assets/articles/');
const imgDir = join(ROOT, 'assets', 'articles');
if (await exists(imgDir)) {
  const imgs = (await readdir(imgDir)).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
  console.log('  found ' + imgs.length + ' images');

  // Scan for references
  const sources = await walk('', ['.html', '.js', '.json', '.xml', '.md']);
  const refs = new Set();
  for (const f of sources) {
    const c = await readFile(join(ROOT, f), 'utf8');
    for (const img of imgs) {
      if (c.includes(img)) refs.add(img);
    }
  }
  console.log('  referenced: ' + refs.size + ', unreferenced: ' + (imgs.length - refs.size));

  for (const img of imgs) {
    if (refs.has(img)) continue;
    if (!DRY) await unlink(join(imgDir, img));
    stats.deleted++;
  }
  console.log('  deleted: ' + (imgs.length - refs.size));
} else {
  console.log('  assets/articles/ not present');
}

// ────────────────────────────────────────────────
// 7. Fix package.json clean script
// ────────────────────────────────────────────────
console.log('\n[7/9] Fix package.json clean script');
const pkgPath = join(ROOT, 'package.json');
const pkgRaw = await readFile(pkgPath, 'utf8');
const pkg = JSON.parse(pkgRaw.replace(/^\uFEFF/, ''));
if (pkg.scripts && pkg.scripts.clean) {
  const safe = `node -e "const fs=require('fs');['rss','series'].forEach(d=>{try{fs.rmSync(d,{recursive:true,force:true})}catch(e){}})"`;
  if (pkg.scripts.clean !== safe) {
    pkg.scripts.clean = safe;
    if (!DRY) await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('  + clean now only removes rss/ + series/');
    stats.patched++;
  } else {
    console.log('  already safe');
  }
}

// ────────────────────────────────────────────────
// 8. Extend topics-queue.json
// ────────────────────────────────────────────────
console.log('\n[8/9] Extend topics queue');
const tqPath = join(ROOT, 'data', 'topics-queue.json');
if (await exists(tqPath)) {
  const tq = JSON.parse((await readFile(tqPath, 'utf8')).replace(/^\uFEFF/, ''));
  console.log('  current: ' + tq.length);
  if (tq.length < 15) {
    const extras = [
      'How to calibrate an ESP32 ADC for accurate battery voltage reading',
      'Why relay modules click twice when driven by 3.3V logic',
      'Fixing I2C bus lockups caused by slave devices holding SDA low',
      'Designing a 12V to 3.3V buck converter for ESP32 projects',
      'Understanding inrush current when switching AC loads with relays',
      'Safe techniques for measuring mains voltage with an oscilloscope',
      'Choosing pull-up resistor values for I2C buses at different speeds',
      'How to detect water leaks with ESP32 and a conductivity sensor',
      'ESP32 deep sleep current: why your battery drains in days',
      'Common mistakes when driving LEDs directly from GPIO pins',
      'Reading a 4-20mA industrial sensor with an ESP32 and ADS1115',
      'Why your 5V relay module browns out the ESP32 and how to fix it',
      'Setting up OTA updates for ESP32 without exposing credentials',
      'Building a reliable water tank level monitor with ultrasonic sensors',
      'Gas leak detection with MQ-2 and MQ-5: calibration and false alarms'
    ];
    const merged = [...new Set([...tq, ...extras])];
    if (!DRY) await writeFile(tqPath, JSON.stringify(merged, null, 2) + '\n');
    console.log('  + added ' + (merged.length - tq.length) + ' topics (total: ' + merged.length + ')');
    stats.patched++;
  } else {
    console.log('  sufficient topics');
  }
}

// ────────────────────────────────────────────────
// 9. Extend .gitignore
// ────────────────────────────────────────────────
console.log('\n[9/9] Extend .gitignore');
const giPath = join(ROOT, '.gitignore');
let gi = await exists(giPath) ? await readFile(giPath, 'utf8') : '';
const additions = [
  '',
  '# Cleanup auto-added',
  'setup-actions.mjs',
  'patch-admin.mjs',
  'harden-deploy.mjs',
  'fix-cleanup.mjs',
  'scripts/delete-dupes.mjs',
  'scripts/diag-escaped.mjs',
  'scripts/fix-duration.mjs',
  'scripts/seed-6-0001.mjs',
  'scripts/seed-rest-courses.mjs',
  'assets/articles/*.png',
  'assets/articles/*.jpg',
  'PULSETECH-backup-*/'
];
let added = 0;
const lines = gi.split('\n').map(l => l.trim());
for (const line of additions) {
  const t = line.trim();
  if (!t || t.startsWith('#')) { gi += line + '\n'; continue; }
  if (!lines.includes(t)) { gi += line + '\n'; added++; }
}
if (added > 0) {
  if (!DRY) await writeFile(giPath, gi);
  console.log('  + added ' + added + ' patterns');
  stats.patched++;
} else {
  console.log('  already up to date');
}

// ────────────────────────────────────────────────
// Summary
// ────────────────────────────────────────────────
console.log('\n=== SUMMARY ===');
console.log('  moved:   ' + stats.moved);
console.log('  deleted: ' + stats.deleted);
console.log('  patched: ' + stats.patched);
console.log('  skipped: ' + stats.skipped);
console.log(DRY ? '\nDRY RUN done. Run with no flag to apply changes.' : '\nDone.');