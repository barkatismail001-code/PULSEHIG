// scripts/translate-articles.mjs
// Translates Supabase articles into 4 additional languages using Groq.
// Stores translations in title_i18n, excerpt_i18n, content_i18n (jsonb columns).
//
// Usage:
//   node scripts/translate-articles.mjs           # translate next 5 untranslated
//   node scripts/translate-articles.mjs --limit=3
//   node scripts/translate-articles.mjs --id=36   # specific article
//   node scripts/translate-articles.mjs --dry     # preview only

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const LANGS = {
  zh: 'Simplified Chinese (简体中文)',
  es: 'Spanish (Español)',
  hi: 'Hindi (हिन्दी)',
  fr: 'French (Français)',
};

const args = process.argv.slice(2);
const LIMIT = Number(args.find(a => a.startsWith('--limit='))?.split('=')[1] || 5);
const SPECIFIC_ID = args.find(a => a.startsWith('--id='))?.split('=')[1];
const DRY = args.includes('--dry');

if (!SUPABASE_KEY) { console.error('❌ SUPABASE_SERVICE_KEY required'); process.exit(1); }
if (!GROQ_API_KEY) { console.error('❌ GROQ_API_KEY required'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function groqTranslate(text, targetLang, context = '') {
  if (!text || !text.trim()) return '';

  const sys = `You are a professional technical translator. You translate technical articles about embedded systems, ESP32, Arduino, petroleum, gas, and programming into ${targetLang}.

RULES:
- Preserve ALL code blocks (\`\`\`...\`\`\`) EXACTLY as-is. Do NOT translate code.
- Preserve ALL markdown formatting (##, ###, **, -, 1., etc.).
- Keep technical terms like "ESP32", "Arduino", "MOSFET", "GPIO", "PWM", "I2C", "SPI", "UART" in English.
- Keep units and numbers unchanged (5V, 100Ω, 20 kHz, 470 µF, etc.).
- Natural, fluent, native-level translation. Not literal.
- Return ONLY the translated text. No explanations, no preamble.`;

  const user = context
    ? `Context (article title): "${context}"\n\nTranslate the following to ${targetLang}:\n\n${text}`
    : `Translate the following to ${targetLang}:\n\n${text}`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: user },
          ],
          temperature: 0.2,
          max_completion_tokens: 8000,
        }),
      });

      if (res.status === 429 || res.status >= 500) {
        const wait = (Number(res.headers.get('retry-after')) || 5 * attempt) * 1000;
        console.warn(`   Groq HTTP ${res.status}, waiting ${wait / 1000}s (attempt ${attempt})`);
        await sleep(wait);
        continue;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);

      const text = String(data?.choices?.[0]?.message?.content || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim();

      if (!text) { await sleep(2000); continue; }
      return text;
    } catch (e) {
      console.warn(`   Attempt ${attempt} failed: ${e.message}`);
      await sleep(3000 * attempt);
    }
  }
  throw new Error('Groq translation failed after 5 attempts');
}

async function translateArticle(article) {
  console.log(`\n📄 Article #${article.id}: "${article.title.slice(0, 60)}..."`);

  const titleI18n = { en: article.title, ...(article.title_i18n || {}) };
  const excerptI18n = { en: article.excerpt, ...(article.excerpt_i18n || {}) };
  const contentI18n = { en: article.content, ...(article.content_i18n || {}) };

  for (const [code, langName] of Object.entries(LANGS)) {
    if (titleI18n[code] && contentI18n[code]) {
      console.log(`   ✓ ${code} already translated`);
      continue;
    }

    console.log(`   🌐 Translating to ${code} (${langName})...`);

    try {
      // 1) Title (short)
      if (!titleI18n[code]) {
        titleI18n[code] = await groqTranslate(article.title, langName);
        await sleep(800);
      }

      // 2) Excerpt (medium)
      if (!excerptI18n[code]) {
        excerptI18n[code] = await groqTranslate(article.excerpt, langName, article.title);
        await sleep(800);
      }

      // 3) Content (long) — split into chunks if > 6000 chars to avoid truncation
      if (!contentI18n[code]) {
        const MAX_CHUNK = 6000;
        if (article.content.length <= MAX_CHUNK) {
          contentI18n[code] = await groqTranslate(article.content, langName, article.title);
        } else {
          // Split by paragraphs, group into chunks
          const paras = article.content.split(/\n\n+/);
          const chunks = [];
          let current = '';
          for (const p of paras) {
            if ((current + '\n\n' + p).length > MAX_CHUNK && current) {
              chunks.push(current);
              current = p;
            } else {
              current = current ? current + '\n\n' + p : p;
            }
          }
          if (current) chunks.push(current);

          console.log(`      Content split into ${chunks.length} chunks`);
          const translated = [];
          for (let i = 0; i < chunks.length; i++) {
            console.log(`      chunk ${i + 1}/${chunks.length}`);
            translated.push(await groqTranslate(chunks[i], langName, article.title));
            await sleep(1200);
          }
          contentI18n[code] = translated.join('\n\n');
        }
      }

      console.log(`   ✅ ${code} done`);
      await sleep(1500);
    } catch (e) {
      console.error(`   ❌ ${code} failed: ${e.message}`);
    }
  }

  return { title_i18n: titleI18n, excerpt_i18n: excerptI18n, content_i18n: contentI18n };
}

async function main() {
  console.log('🌍 TechPulse Translation Worker');
  console.log(`   Model: ${GROQ_MODEL}`);
  console.log(`   Limit: ${LIMIT}`);

  let query = supabase.from('articles').select('id,title,excerpt,content,title_i18n,excerpt_i18n,content_i18n');

  if (SPECIFIC_ID) {
    query = query.eq('id', SPECIFIC_ID);
  } else {
    // Only articles without any translations yet
    query = query.or('title_i18n.is.null,title_i18n.eq.{}').limit(LIMIT);
  }

  const { data: articles, error } = await query;
  if (error) throw error;

  if (!articles?.length) {
    console.log('✅ Nothing to translate.');
    return;
  }

  console.log(`📚 Found ${articles.length} article(s) to translate`);

  let done = 0;
  for (const art of articles) {
    try {
      const translations = await translateArticle(art);

      if (DRY) {
        console.log(`\n[DRY RUN] Would update article #${art.id} with keys:`, Object.keys(translations.title_i18n));
        continue;
      }

      const { error: updErr } = await supabase
        .from('articles')
        .update(translations)
        .eq('id', art.id);

      if (updErr) throw updErr;
      console.log(`   💾 Saved translations for #${art.id}`);
      done++;
    } catch (e) {
      console.error(`❌ Failed #${art.id}: ${e.message}`);
    }
  }

  console.log(`\n✅ Done: ${done}/${articles.length} articles translated`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
