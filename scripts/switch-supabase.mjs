#!/usr/bin/env node
// Point the whole site at a NEW Supabase project (no dependencies).
// Usage: node scripts/switch-supabase.mjs https://NEWREF.supabase.co sb_publishable_xxx
// Replaces the old project URL/ref (front-end, CSP meta tags, scripts) and the old public key.
import fs from 'node:fs';
import path from 'node:path';

const OLD_REF = 'cescfarawvpzmilteufq';
const OLD_KEY = 'sb_publishable_OK1bvVPK50JpOlxaNMVQeg_dTKo3Dru';
const [url, key] = process.argv.slice(2);

const m = /^https:\/\/([a-z0-9]{15,30})\.supabase\.co\/?$/.exec(url || '');
if (!m) { console.error('First argument must look like https://abcdefghijklmnop.supabase.co'); process.exit(1); }
if (!key || !(key.startsWith('sb_publishable_') || key.startsWith('eyJ'))) {
  console.error('Second argument must be the PUBLIC key (sb_publishable_... or the anon key). Never use the service/secret key here.');
  process.exit(1);
}
if (key.startsWith('sb_secret_')) { console.error('Refusing a secret key'); process.exit(1); }
const NEW_REF = m[1];

const EXT = new Set(['.html', '.js', '.mjs', '.json', '.xml', '.txt', '.md', '.yml', '.yaml']);
const SKIP = new Set(['.git', 'node_modules']);
let files = 0, changed = 0;

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!EXT.has(path.extname(e.name))) continue;
    files++;
    const s = fs.readFileSync(p, 'utf8');
    if (!s.includes(OLD_REF) && !s.includes(OLD_KEY)) continue;
    fs.writeFileSync(p, s.split(OLD_KEY).join(key).split(OLD_REF).join(NEW_REF));
    changed++;
  }
})('.');

console.log(`Scanned ${files} files, updated ${changed}. New project: ${NEW_REF}`);
