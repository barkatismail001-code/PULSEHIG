// node import-to-supabase.mjs
// Usage: put this file in the repo root (next to the a/ folder)
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;          // https://xxxx.supabase.co
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;  // service_role key (local only, never publish it)
const DRY_RUN = process.argv.includes('--dry');          // test without inserting

const dir = './a';
const pick = (re, s) => (s.match(re) || [])[1]?.trim() || '';
const decode = s => s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");

function parse(file) {
  const html = fs.readFileSync(path.join(dir, file), 'utf8');
  const slug = file.replace(/\.html$/, '');
  const title = decode(pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html).replace(/<[^>]+>/g,''));
  const excerpt = decode(pick(/<meta name="description" content="([^"]*)"/i, html));
  const category = decode(pick(/<meta property="article:section" content="([^"]*)"/i, html));
  const published_at = pick(/<meta property="article:published_time" content="([^"]*)"/i, html);
  const author = decode(pick(/<meta name="author" content="([^"]*)"/i, html)) || 'TechPulse Team';
  const read = pick(/(\d+)\s*min read/i, html);
  // article body
  const start = html.search(/<div class="article-content">/i);
  let content = '';
  if (start !== -1) {
    const rest = html.slice(start).replace(/^<div class="article-content">/i, '');
    const end = rest.search(/<\/div>\s*<\/article>/i);
    content = (end !== -1 ? rest.slice(0, end) : rest).trim();
  }
  // cover image: images/<slug>.(webp|jpg|png) if it exists
  let cover_image = null;
  for (const ext of ['webp','jpg','png']) {
    if (fs.existsSync(`./images/${slug}.${ext}`)) { cover_image = `/images/${slug}.${ext}`; break; }
  }
  return { slug, title, excerpt, category, author, published_at: published_at || null,
           read_time: read ? Number(read) : null, content, cover_image };
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html');
const rows = files.map(parse);

if (DRY_RUN) {
  rows.forEach(r => console.log({ ...r, content: r.content.slice(0, 80) + '... (' + r.content.length + ' chars)' }));
  process.exit(0);
}

const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?on_conflict=slug`, {
  method: 'POST',
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal'
  },
  body: JSON.stringify(rows)
});
console.log(res.ok ? `✅ ${rows.length} articles imported` : `❌ ${res.status} ${await res.text()}`);
