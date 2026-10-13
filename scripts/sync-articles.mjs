import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { GoogleGenAI } from '@google/genai';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const A = join(ROOT, 'a');
const INDEX = join(A, 'articles.json');
const ARGS = process.argv.slice(2);
const TRANSLATE_MISSING = ARGS.includes('--translate') || process.env.TRANSLATE_MISSING === '1';
const MODE = (ARGS.find(a => ['push','pull','both'].includes(a.toLowerCase())) || process.env.SYNC_MODE || 'both').toLowerCase();

if (!['push', 'pull', 'both'].includes(MODE)) { console.error('mode: push|pull|both'); process.exit(1); }
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY'); process.exit(1);
}
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const TR_LANGS = [
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Simplified Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'pt', name: 'Portuguese' }
];
const trSleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateInline(row, id) {
  if (!ai) { console.warn('  (no GEMINI_API_KEY, skipping inline translation)'); return; }
  const ti = row.title_i18n || {};
  const ei = row.excerpt_i18n || {};
  const ci = row.content_i18n || {};
  let changed = false;

  for (const L of TR_LANGS) {
    if (ti[L.code] && ei[L.code] && ci[L.code]) continue;
    const payload = {
      title:   ti[L.code] ? '' : (row.title   || ''),
      excerpt: ei[L.code] ? '' : (row.excerpt || ''),
      content: ci[L.code] ? '' : (row.content || '')
    };
    const prompt =
      'Translate each non-empty field from English to ' + L.name + '.\n' +
      'Keep HTML/markdown tags, code blocks, URLs and product names exactly as-is.\n' +
      'If a field is empty in the input, return an empty string for it.\n' +
      'Return ONLY valid JSON: {"title":"...","excerpt":"...","content":"..."}\n\n' +
      JSON.stringify(payload);

    let ok = false;
    for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
      try {
        const r = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: { responseMimeType: 'application/json', temperature: 0.3 }
        });
        const raw = String(r.text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const o = JSON.parse(raw);
        if (!ti[L.code] && o.title)   ti[L.code] = String(o.title).trim();
        if (!ei[L.code] && o.excerpt) ei[L.code] = String(o.excerpt).trim();
        if (!ci[L.code] && o.content) ci[L.code] = String(o.content).trim();
        if (ti[L.code] && ei[L.code] && ci[L.code]) {
          changed = true; ok = true;
          console.log('  🌍 ' + row.slug + ' → ' + L.code);
        }
      } catch (e) {
        const msg = (e && e.message) || String(e);
        const wait = /429|RESOURCE_EXHAUSTED/.test(msg) ? 20000 * attempt
                   : /503|UNAVAILABLE/.test(msg)        ? 8000  * attempt
                   : 0;
        if (!wait || attempt === 4) {
          console.warn('  ⚠ ' + L.code + ' (' + attempt + '/4): ' + msg.slice(0, 160));
          break;
        }
        console.warn('  ⏳ ' + L.code + ' busy, retry ' + (attempt + 1) + '/4 in ' + Math.round(wait/1000) + 's');
        await trSleep(wait);
      }
    }
    await trSleep(6000);
  }

  if (!changed) return;
  const doneLangs = TR_LANGS.filter((l) => ti[l.code] && ei[l.code] && ci[l.code]).map((l) => l.code);
  const { error } = await supabase.from('articles').update({
    title_i18n: ti, excerpt_i18n: ei, content_i18n: ci,
    translation_langs: ['en'].concat(doneLangs),
    translation_status: doneLangs.length === TR_LANGS.length ? 'done' : 'pending'
  }).eq('id', id);
  if (error) console.warn('  ⚠ save ' + id + ': ' + error.message);
}
function pickOne(a, b) { return (a && String(a).trim()) ? a : b; }
function mergeI18n(oldObj, newObj) {
  const out = Object.assign({}, oldObj || {});
  for (const k of Object.keys(newObj || {})) {
    const has = out[k] && String(out[k]).trim();
    const inc = newObj[k] && String(newObj[k]).trim();
    if (inc && !has) out[k] = newObj[k];
  }
  return out;
}

async function readIndex() {
  try { return JSON.parse(await readFile(INDEX, 'utf8')); } catch { return []; }
}
async function readHtml(slug) {
  let html;
  try { html = await readFile(join(A, slug + '.html'), 'utf8'); } catch { return null; }
  const $ = cheerio.load(html);
  const title = $('h1').first().text().trim() || $('title').text().replace(/\s*\|.*$/, '').trim();
  const excerpt = $('.article-excerpt p').first().text().trim() || $('meta[name="description"]').attr('content') || '';
  const contentHtml = $('.article-content').first().html() || '';
  const content = contentHtml ? td.turndown(contentHtml) : '';
  const image = $('.article-hero-img').attr('src') || $('meta[property="og:image"]').attr('content') || '';
  const category = $('.article-category').first().text().trim() || 'Technology';
  const date = $('meta[property="article:published_time"]').attr('content') || '';
  return { slug, title, excerpt, content, image, category, date: date ? date.slice(0, 10) : '' };
}


// ------------------------------------------------------------
// Upload a local image to Supabase Storage → return public URL
// ------------------------------------------------------------
const BUCKET = 'article-images';
const MIME_BY_EXT = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml'
};

async function uploadImage(localPath, slug) {
  try {
    // already a remote URL → keep as-is
    if (/^https?:\/\//i.test(localPath)) return localPath;
    // data: URL → skip
    if (/^data:/i.test(localPath)) return '';

    // resolve path relative to project root
    const rel = localPath.replace(/^\/+/, '');
    const full = join(ROOT, rel);
    let s;
    try { s = await stat(full); } catch { return ''; }
    if (!s.isFile()) return '';

    const ext = extname(full).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) return '';

    const fileBuf = await readFile(full);
    const objectName = slug + '-' + Date.now() + ext;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectName, fileBuf, { contentType: mime, upsert: true });
    if (error) { console.warn('  ⚠ upload failed ' + rel + ': ' + error.message); return ''; }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectName);
    return (data && data.publicUrl) || '';
  } catch (e) {
    console.warn('  ⚠ upload error ' + localPath + ': ' + e.message);
    return '';
  }
}

async function push() {
  const index = await readIndex();
  const byslug = new Map((index || []).map(x => [x.slug, x]));
  const files = (await readdir(A)).filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, ''));
  const slugs = new Set([...byslug.keys(), ...files]);
  console.log(`push: ${slugs.size} slugs`);
  const LANGS = ['fr', 'es', 'zh', 'hi', 'pt'];

  for (const slug of slugs) {
    const meta = await readHtml(slug);
    if (!meta || !meta.title) { console.warn(`  skip ${slug}`); continue; }
    const idx = byslug.get(slug) || {};
    const row = {
      slug,
      title: pickOne(idx.title, meta.title),
      excerpt: pickOne(idx.excerpt, meta.excerpt),
      content: pickOne(idx.content, meta.content),
      category: pickOne(idx.category, meta.category) || 'Technology',
      author: pickOne(idx.author, 'TechPulse Team'),
      date: pickOne(idx.date, meta.date) || new Date().toISOString().slice(0, 10),
      image: await uploadImage(pickOne(idx.image, meta.image) || "", slug),
      tags: Array.isArray(idx.tags) ? idx.tags : [],
      featured: !!idx.featured,
      title_i18n: idx.title_i18n || {},
      excerpt_i18n: idx.excerpt_i18n || {},
      content_i18n: idx.content_i18n || {}
    };
    const { data: ex } = await supabase.from('articles').select('id,title_i18n,excerpt_i18n,content_i18n').eq('slug', slug).maybeSingle();
    if (ex) {
      row.title_i18n = mergeI18n(ex.title_i18n, row.title_i18n);
      row.excerpt_i18n = mergeI18n(ex.excerpt_i18n, row.excerpt_i18n);
      row.content_i18n = mergeI18n(ex.content_i18n, row.content_i18n);
      const done = LANGS.filter(l => row.title_i18n[l] && row.excerpt_i18n[l] && row.content_i18n[l]);
      row.translation_langs = ['en'].concat(done);
      row.translation_status = done.length === LANGS.length ? 'done' : 'pending';
      const { error } = await supabase.from('articles').update(row).eq('id', ex.id);
      if (error) console.warn(`  ✗ update ${slug}: ${error.message}`);
      else {
        console.log(`  ↻ ${slug}`);
        if (TRANSLATE_MISSING && ai) {
          const missing = TR_LANGS.filter(l => !(row.title_i18n[l.code] && row.excerpt_i18n[l.code] && row.content_i18n[l.code]));
          if (missing.length) await translateInline(row, ex.id);
        }
      }
    } else {
      row.translation_status = 'pending';
      row.translation_langs = ['en'];
      const { data: ins, error } = await supabase.from('articles').insert(row).select('id').single();
      if (error) console.warn(`  ✗ insert ${slug}: ${error.message}`);
      else {
        console.log(`  + ${slug}`);
        if (ins && ins.id) await translateInline(row, ins.id);
      }
    }
  }
}

async function pull() {
  const { data, error } = await supabase.from('articles').select('*').order('id', { ascending: true });
  if (error) { console.error(error); process.exit(1); }
  const arts = data || [];

  // Download images into /assets/articles/ for offline/local builds
  const assetsDir = join(ROOT, 'assets', 'articles');
  try { await mkdir(assetsDir, { recursive: true }); } catch {}

  for (const a of arts) {
    if (!a.image || !/^https?:\/\//i.test(a.image)) continue;
    const ext = (extname(a.image.split('?')[0]) || '.jpg').toLowerCase();
    const outPath = join(assetsDir, a.slug + ext);
    // skip if already downloaded
    try { await stat(outPath); continue; } catch {}
    try {
      const res = await fetch(a.image);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(outPath, buf);
    } catch (e) {
      console.warn('  ⚠ image download ' + a.slug + ': ' + e.message);
    }
  }

  const index = arts.map(a => ({
    id: a.id, slug: a.slug, title: a.title, excerpt: a.excerpt, content: a.content,
    category: a.category, author: a.author, date: a.date, image: a.image,
    tags: a.tags || [], featured: !!a.featured,
    title_i18n: a.title_i18n || {}, excerpt_i18n: a.excerpt_i18n || {}, content_i18n: a.content_i18n || {}
  }));
  await writeFile(INDEX, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log(`pull: wrote a/articles.json (${index.length})`);
}
if (MODE === 'push' || MODE === 'both') await push();
if (MODE === 'pull' || MODE === 'both') await pull();
console.log('done');