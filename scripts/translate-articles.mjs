import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Translates articles into fr, es, zh, hi, pt with Gemini and stores them in Supabase.
// ONLY_PENDING=true  -> only articles whose translation_status = 'pending' (used every 5 minutes)
// TRANSLATE_LIMIT=N  -> max articles per run (0 = no limit)
// Failed languages (Gemini busy) are simply left empty and retried on the next run.

if (!process.env.GEMINI_API_KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(1); }
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LANGS = ['fr', 'es', 'zh', 'hi', 'pt'];
const ONLY_PENDING = process.env.ONLY_PENDING === 'true';
const LIMIT = parseInt(process.env.TRANSLATE_LIMIT || '0', 10); // 0 = no limit
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function translateWithRetry(text, lang, attempt = 1) {
  if (!text) return text;
  const maxAttempts = 5;

  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: text,
      config: {
        systemInstruction: `Translate to ${lang}. Preserve HTML tags and code blocks. Return only the translation.`,
        temperature: 0.3
      }
    });
    return res.text;
  } catch (e) {
    const isRetryable = e.status === 503 || e.status === 429 || e.message?.includes('UNAVAILABLE');
    if (isRetryable && attempt < maxAttempts) {
      const wait = Math.min(2000 * Math.pow(2, attempt - 1), 30000); // 2s,4s,8s,16s
      console.log(`  ⏳ ${lang}: retry ${attempt}/${maxAttempts} after ${wait}ms (${e.status})`);
      await sleep(wait);
      return translateWithRetry(text, lang, attempt + 1);
    }
    throw e;
  }
}

// Update a row; if the live table lacks an optional column, drop it and retry.
async function safeUpdate(id, fields) {
  const f = { ...fields };
  for (let i = 0; i < 6; i++) {
    const { error } = await supabase.from('articles').update(f).eq('id', id);
    if (!error) return;
    const m = /find the ['"]([A-Za-z0-9_]+)['"] column/i.exec(error.message || '');
    if (!m || !(m[1] in f)) throw error;
    console.warn(`  ⚠️ column missing in DB, saving without it: ${m[1]}`);
    delete f[m[1]];
  }
}

async function main() {
  let query = supabase
    .from('articles')
    .select('id,title,excerpt,content,title_i18n,excerpt_i18n,content_i18n,translation_status')
    .order('id', { ascending: false });
  if (ONLY_PENDING) query = query.eq('translation_status', 'pending');
  const { data: arts, error } = await query;
  if (error) {
    console.error('❌ Could not read articles:', error.message || error);
    process.exit(1);
  }

  console.log(`Articles to check: ${arts?.length || 0}${ONLY_PENDING ? ' (pending only)' : ''}`);

  let translated = 0;
  for (const a of arts || []) {
    if (LIMIT && translated >= LIMIT) { console.log(`Limit reached (${LIMIT})`); break; }
    const ti = a.title_i18n || {};
    const ei = a.excerpt_i18n || {};
    const ci = a.content_i18n || {};
    let changed = false;

    for (const L of LANGS) {
      let calls = 0;
      try {
        if (!ti[L]) { ti[L] = await translateWithRetry(a.title, L); changed = true; calls++; }
        if (!ei[L]) { ei[L] = await translateWithRetry(a.excerpt, L); changed = true; calls++; }
        if (!ci[L]) { ci[L] = await translateWithRetry(a.content, L); changed = true; calls++; }
      } catch (e) {
        console.error(`  ❌ ${a.id}/${L}:`, e.status || e.message);
      }
      if (calls) await sleep(4500); // ~13 req/min
    }

    const done = LANGS.filter(L => ti[L] && ei[L] && ci[L]);
    const complete = done.length === LANGS.length;
    const fields = {};
    if (changed) Object.assign(fields, { title_i18n: ti, excerpt_i18n: ei, content_i18n: ci });
    if (changed || (complete && a.translation_status !== 'done')) {
      fields.translation_status = complete ? 'done' : 'pending';
      fields.translation_langs = ['en', ...done];
    }

    if (Object.keys(fields).length) {
      await safeUpdate(a.id, fields);
      if (changed) {
        translated++;
        console.log(`✅ Translated: ${a.id} (${done.length}/${LANGS.length} languages complete${complete ? '' : ' — rest will be retried'})`);
      } else {
        console.log(`✔️  Marked as done: ${a.id}`);
      }
    } else {
      console.log(`⏭️  Skipped (already translated): ${a.id}`);
    }
  }
  console.log('🎉 Done');
}

main().catch(e => { console.error(e); process.exit(1); });
