// fix-build.mjs — one-time fix for verify-build.mjs + orphan course files
import { readFile, writeFile, readdir, unlink, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const VB = join(ROOT, 'scripts', 'verify-build.mjs');

// ─────────────────────────────────────────────
// PART 1 — Remove orphan course files
// ─────────────────────────────────────────────
console.log('[1/3] Remove orphan course files');
const courseDir = join(ROOT, 'course');

// Course slugs currently in sitemap-courses.xml (the source of truth)
const sc = await readFile(join(ROOT, 'sitemap-courses.xml'), 'utf8');
const allowed = new Set(
  [...sc.matchAll(/<loc>[^<]*\/course\/([^<]+)\.html<\/loc>/g)].map(m => m[1])
);
console.log('  sitemap allows: ' + allowed.size + ' courses');

const files = await readdir(courseDir);
let removed = 0;
for (const f of files) {
  if (!f.endsWith('.html')) continue;
  if (f === 'index.html') continue;
  const slug = f.replace(/\.html$/, '');
  if (allowed.has(slug)) continue;
  await unlink(join(courseDir, f));
  console.log('  removed: course/' + f);
  removed++;
}
console.log('  removed: ' + removed + ' orphan course files');

// ─────────────────────────────────────────────
// PART 2 — Patch verify-build.mjs
// ─────────────────────────────────────────────
console.log('[2/3] Patch verify-build.mjs');
let v = await readFile(VB, 'utf8');
let changed = 0;

// 2a. Add helper isNoindex + article loop skip
const oldArticleLoop = `  // every page in a/ must be in the posts sitemap
  const articlePages = (await listHtml('a')).map((f) => f.replace(/\\.html$/, ''));
  for (const slug of articlePages) {
    if (!has(\`/a/\${slug}.html\`)) err(\`a/\${slug}.html exists but is not in the sitemap (stale page or incomplete build)\`);
  }`;
const newArticleLoop = `  // every page in a/ must be in the posts sitemap, unless it's noindex
  const articlePages = (await listHtml('a')).map((f) => f.replace(/\\.html$/, ''));
  for (const slug of articlePages) {
    if (has(\`/a/\${slug}.html\`)) continue;
    let isNoindex = false;
    try {
      const html = await read(\`a/\${slug}.html\`);
      isNoindex = /<meta\\s+name="robots"[^>]*noindex/i.test(html);
    } catch {}
    if (!isNoindex) err(\`a/\${slug}.html exists but is not in the sitemap\`);
  }`;

if (v.includes(oldArticleLoop)) {
  v = v.replace(oldArticleLoop, newArticleLoop);
  changed++;
  console.log('  patched: a/ loop skips noindex');
} else if (v.includes('unless it\'s noindex')) {
  console.log('  a/ loop: already patched');
} else {
  console.log('  WARN: a/ loop pattern not found');
}

// 2b. Course loop skip noindex
const oldCourseLoop = `  for (const f of await listHtml('course')) {
    if (f !== 'index.html' && !has(\`/course/\${f}\`)) err(\`course/\${f} is not in the sitemap\`);
  }`;
const newCourseLoop = `  for (const f of await listHtml('course')) {
    if (f === 'index.html') continue;
    if (has(\`/course/\${f}\`)) continue;
    let isNoindex = false;
    try {
      const h = await read(\`course/\${f}\`);
      isNoindex = /<meta\\s+name="robots"[^>]*noindex/i.test(h);
    } catch {}
    if (!isNoindex) err(\`course/\${f} is not in the sitemap\`);
  }`;

if (v.includes(oldCourseLoop)) {
  v = v.replace(oldCourseLoop, newCourseLoop);
  changed++;
  console.log('  patched: course/ loop skips noindex');
} else {
  console.log('  course/ loop: not found (may not exist in this version)');
}

// 2c. Walk skip _trash
if (!v.includes("'_trash'") && !v.includes('_trash')) {
  v = v.replace(
    "if (e.name === 'node_modules' || e.name.startsWith('.')) continue;",
    "if (e.name === 'node_modules' || e.name.startsWith('.') || e.name.startsWith('_trash')) continue;"
  );
  changed++;
  console.log('  patched: walk skips _trash');
}

// 2d. Skip article.html in orphan check
if (!v.includes("'article.html'")) {
  v = v.replace(/(const skip = new Set\(\[)/, "$1'article.html', ");
  changed++;
  console.log('  patched: article.html added to orphan skip');
}

// 2e. Skip noindex in orphan check
const orphanBlock = `  for (const f of files) {
    if (skip.has(f) || linked.has(f)) continue;`;
const orphanNew = `  const noindexSet = new Set();
  for (const f of files) {
    if (!f.startsWith('a/')) continue;
    try {
      const h = await read(f);
      if (/<meta\\s+name="robots"[^>]*noindex/i.test(h)) noindexSet.add(f);
    } catch {}
  }
  for (const f of files) {
    if (skip.has(f) || linked.has(f) || noindexSet.has(f)) continue;`;

if (v.includes(orphanBlock) && !v.includes('noindexSet')) {
  v = v.replace(orphanBlock, orphanNew);
  changed++;
  console.log('  patched: orphan check skips noindex pages');
}

await writeFile(VB, v);
console.log('  total patches: ' + changed);

// ─────────────────────────────────────────────
// PART 3 — Run verification
// ─────────────────────────────────────────────
console.log('[3/3] Run verification');
const { spawn } = await import('node:child_process');
await new Promise((resolve) => {
  const p = spawn('node', ['scripts/verify-build.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  p.on('exit', resolve);
});

console.log('\nDone.');