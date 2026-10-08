/* ==========================================================================
   TechPulse â€” Auto-Translation Worker (translate-articles.mjs) v20261005
   Reads articles from Supabase, translates title/excerpt/content into
   6 languages via DeepSeek, and saves them back into the i18n JSONB columns.
   Translations do NOT create HTML pages â€” they appear only when the user
   switches language (loaded on-demand by article.js).
   Run: node scripts/translate-articles.mjs
   Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, DEEPSEEK_API_KEY, DEEPSEEK_MODEL, TRANSLATE_LIMIT
   ========================================================================== */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const GROQ_URL = 'https://api.deepseek.com/chat/completions';
const LIMIT = Number(process.env.TRANSLATE_LIMIT || 5);

const LANGS = {
  zh: 'Simplified Chinese (ç®€ن½“ن¸­و–‡)',
  es: 'Spanish (Espaأ±ol)',
  hi: 'Hindi (à¤¹à¤؟à¤¨à¥چà¤¦à¥€)',
  fr: 'French (Franأ§ais)',
  pt: 'Portuguese (Portuguأھs)'
};

if (!SUPABASE_KEY) {
  console.error('â‌Œ SUPABASE_SERVICE_KEY is required');
  process.exit(1);
}
if (!DEEPSEEK_API_KEY) {
  console.error('â‌Œ DEEPSEEK_API_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function wordsCount(text) {
  return String(text || '').split(/\s+/).filter(Boolean).length;
}

/* ---------- DeepSeek translation call with retry ---------- */
async function deepseekTranslate(text, targetLang, contextTitle = '') {
  if (!text || !text.trim()) return '';

  const sys = `You are a professional technical translator. Translate technical articles about embedded systems, ESP32, Arduino, home repair, and programming into ${targetLang}.

STRICT RULES:
- Preserve ALL code blocks (\`\`\`...\`\`\`) EXACTLY as-is. Never translate code.
- Preserve ALL markdown formatting (##, ###, **, -, 1., etc.).
- Keep technical terms in English when they are standard: ESP32, Arduino, MOSFET, GPIO, PWM, I2C, SPI, UART, WiFi, GPIO, RTC, OTA, LED, ADC, DAC.
- Keep units and numbers unchanged (5V, 100خ©, 20 kHz, 470 آµF, etc.).
- Natural, fluent, native-level translation. Not word-for-word.
- Return ONLY the translated text. No explanations, no preamble.`;

  const user = contextTitle
    ? `Context (article title): "${contextTitle}"\n\nTranslate the following to ${targetLang}:\n\n${text}`
    : `Translate the following to ${targetLang}:\n\n${text}`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: user }
          ],
          temperature: 0.2,
          max_tokens: 8000
        })
      });

      if (res.status === 429 || res.status >= 500) {
        const wait = (Number(res.headers.get('retry-after')) || 5 * attempt) * 1000;
        console.warn(`   âڈ¸  DeepSeek HTTP ${res.status}, retrying in ${wait / 1000}s (attempt ${attempt})`);
        await sleep(wait);
        continue;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);

      const out = String(data?.choices?.[0]?.message?.content || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim();

      if (!out) {
        console.warn(`   âڑ ï¸ڈ  Empty response, retrying (attempt ${attempt})`);
        await sleep(2000);
        continue;
      }

      return out;
    } catch (e) {
      console.warn(`   âڑ ï¸ڈ  Attempt ${attempt} failed: ${e.message}`);
      await sleep(3000 * attempt);
    }
  }

  throw new Error('DeepSeek translation failed after 5 attempts');
}

/* ---------- Chunk long content ---------- */
function chunkContent(content, maxLen = 6000) {
  if (content.length <= maxLen) return [content];

  const paras = content.split(/\n\n+/);
  const chunks = [];
  let current = '';

  for (const p of paras) {
    const candidate = current ? current + '\n\n' + p : p;
    if (candidate.length > maxLen && current) {
      chunks.push(current);
      current = p;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/* ---------- Translate one article ---------- */
async function translateArticle(article) {
  console.log(`\nًں“„ #${article.id}: "${article.title.slice(0, 70)}"`);

  const titleI18n = Object.assign({ en: article.title }, article.title_i18n || {});
  const excerptI18n = Object.assign({ en: article.excerpt || '' }, article.excerpt_i18n || {});
  const contentI18n = Object.assign({ en: article.content || '' }, article.content_i18n || {});

  for (const [code, langName] of Object.entries(LANGS)) {
    if (titleI18n[code] && contentI18n[code]) {
      console.log(`   âœ“ ${code} already translated`);
      continue;
    }

    console.log(`   ًںŒگ â†’ ${code} (${langName})`);

    try {
      if (!titleI18n[code]) {
        titleI18n[code] = await deepseekTranslate(article.title, langName);
        await sleep(800);
      }

      if (!excerptI18n[code]) {
        excerptI18n[code] = await deepseekTranslate(article.excerpt || '', langName, article.title);
        await sleep(800);
      }

      if (!contentI18n[code]) {
        const chunks = chunkContent(article.content || '');
        if (chunks.length === 1) {
          contentI18n[code] = await deepseekTranslate(chunks[0], langName, article.title);
        } else {
          console.log(`      â†³ content split into ${chunks.length} chunks`);
          const out = [];
          for (let i = 0; i < chunks.length; i++) {
            console.log(`      â†³ chunk ${i + 1}/${chunks.length}`);
            out.push(await deepseekTranslate(chunks[i], langName, article.title));
            await sleep(1200);
          }
          contentI18n[code] = out.join('\n\n');
        }
      }

      console.log(`   âœ… ${code} done`);
      await sleep(1200);
    } catch (e) {
      console.error(`   â‌Œ ${code} failed: ${e.message}`);
    }
  }

  return {
    title_i18n: titleI18n,
    excerpt_i18n: excerptI18n,
    content_i18n: contentI18n
  };
}

/* ---------- Main ---------- */
async function main() {
  console.log('ًںŒچ TechPulse Translation Worker');
  console.log(`   Model: ${DEEPSEEK_MODEL}`);
  console.log(`   Limit: ${LIMIT}`);
  console.log('');

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id,title,excerpt,content,title_i18n,excerpt_i18n,content_i18n,translation_status')
    .order('id', { ascending: false })
    .limit(LIMIT * 3);

  if (error) {
    console.error('â‌Œ Supabase error:', error);
    process.exit(1);
  }

  if (!articles || !articles.length) {
    console.log('âœ… No articles found.');
    return;
  }

  /* Filter: only articles missing at least one language */
  const toTranslate = articles.filter((a) => {
    const t = a.title_i18n || {};
    const langs = ['zh', 'es', 'hi', 'fr', 'pt'];
    const present = langs.filter((l) => t[l] && t[l].length > 0);
    return present.length < langs.length;
  }).slice(0, LIMIT);

  if (!toTranslate.length) {
    console.log('âœ… Nothing to translate. All articles are complete.');
    return;
  }

  console.log(`ًں“ڑ Found ${toTranslate.length} article(s) needing translation\n`);

  let done = 0;
  for (const art of toTranslate) {
    try {
      const translations = await translateArticle(art);

      const langsPresent = ['zh', 'es', 'hi', 'fr', 'pt'].filter(
        (l) => translations.title_i18n[l] && translations.content_i18n[l]
      );

      const status = langsPresent.length >= 5 ? 'completed' : 'in_progress';

      const { error: updErr } = await supabase
        .from('articles')
        .update({
          title_i18n: translations.title_i18n,
          excerpt_i18n: translations.excerpt_i18n,
          content_i18n: translations.content_i18n,
          translation_langs: ['en'].concat(langsPresent),
          translation_status: status,
          translation_updated_at: new Date().toISOString()
        })
        .eq('id', art.id);

      if (updErr) {
        console.error(`   â‌Œ Save failed for #${art.id}: ${updErr.message}`);
        continue;
      }

      console.log(`   ًں’¾ Saved (#${art.id}) â€” status: ${status} (${langsPresent.length}/5 langs)`);
      done++;
    } catch (e) {
      console.error(`â‌Œ Failed #${art.id}: ${e.message}`);
    }
  }

  console.log(`\nâœ… Done: ${done}/${toTranslate.length} articles translated`);
}

main().catch((e) => {
  console.error('â‌Œ', e);
  process.exit(1);
});