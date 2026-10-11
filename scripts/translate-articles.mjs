import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

if (!process.env.GEMINI_API_KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(1); }
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LANGS = ['fr', 'es', 'zh', 'hi', 'pt'];

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

async function main() {
  const { data: arts } = await supabase
    .from('articles')
    .select('id,title,excerpt,content,title_i18n,excerpt_i18n,content_i18n');

  console.log(`Total articles: ${arts?.length || 0}`);

  let translated = 0;
  for (const a of arts || []) {
    if (LIMIT && translated >= LIMIT) { console.log(`Limit reached (${LIMIT})`); break; }
    const ti = a.title_i18n || {};
    const ei = a.excerpt_i18n || {};
    const ci = a.content_i18n || {};
    let changed = false;

    for (const L of LANGS) {
      try {
        if (!ti[L]) { ti[L] = await translateWithRetry(a.title, L); changed = true; }
        if (!ei[L]) { ei[L] = await translateWithRetry(a.excerpt, L); changed = true; }
        if (!ci[L]) { ci[L] = await translateWithRetry(a.content, L); changed = true; }
      } catch (e) {
        console.error(`  ❌ ${a.id}/${L}:`, e.status || e.message);
      }
      await sleep(4500); // 13 req/min
    }

    if (changed) {
      await supabase.from('articles').update({
        title_i18n: ti, excerpt_i18n: ei, content_i18n: ci
      }).eq('id', a.id);
      translated++;
      console.log(`✅ Translated: ${a.id}`);
    } else {
      console.log(`⏭️  Skipped (already translated): ${a.id}`);
    }
  }
  console.log('🎉 Done');
}

main().catch(e => { console.error(e); process.exit(1); });
