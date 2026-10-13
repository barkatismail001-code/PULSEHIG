import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { appendFileSync } from 'node:fs';

/*
 * Translate articles (fr, es, zh, hi, pt) with Gemini and save them to Supabase.
 *
 * Safety rules (so a run can never hang for hours again):
 *  - every Gemini request has a hard timeout (REQUEST_TIMEOUT_MS)
 *  - the whole run has a time budget (MAX_RUNTIME_MIN) and stops cleanly when it is used up
 *  - LIMIT counts articles that were ATTEMPTED, not only the ones that succeeded
 *  - already translated articles are skipped instantly (no sleeping)
 *  - if Gemini fails several times in a row (quota / bad key) the run stops early
 *  - long articles are translated in chunks, and a truncated answer is never saved
 */

if (!process.env.GEMINI_API_KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(1); }
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY'); process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const LANGS = [
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Simplified Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'pt', name: 'Portuguese' }
];

const LIMIT = parseInt(process.env.TRANSLATE_LIMIT || '0', 10) || 0;            // 0 = no limit
const MAX_RUNTIME_MIN = parseInt(process.env.MAX_RUNTIME_MIN || '20', 10) || 20;  // stop before the workflow timeout
const REQUEST_TIMEOUT_MS = 90 * 1000;     // one Gemini request
const MAX_ATTEMPTS = 3;                   // per request
const MAX_CONSECUTIVE_FAILS = 4;          // then stop the whole run
const CHUNK_CHARS = 6000;                 // content is sent in pieces of about this size
const PAUSE_MS = 4500;                    // about 13 requests / minute (free tier friendly)

const START = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const outOfTime = () => Date.now() - START > MAX_RUNTIME_MIN * 60 * 1000;
const has = (v) => typeof v === 'string' && v.trim().length > 0;

let consecutiveFails = 0;
let failures = 0;
let stopReason = '';
const errorsSeen = [];
class StopRun extends Error {}

function summary(lines) {
  const f = process.env.GITHUB_STEP_SUMMARY;
  if (!f) return;
  try { appendFileSync(f, lines.join('\n') + '\n'); } catch (e) { /* ignore */ }
}

/* ---------- one Gemini call with hard timeout ---------- */
async function callOnce(text, langName) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let hardTimer;
  const hardTimeout = new Promise((_, rej) => {
    // safety net in case the SDK ignores the abort signal
    hardTimer = setTimeout(
      () => rej(Object.assign(new Error('Request timed out'), { status: 'TIMEOUT' })),
      REQUEST_TIMEOUT_MS + 5000
    );
  });
  try {
    const res = await Promise.race([
      ai.models.generateContent({
        model: MODEL,
        contents: text,
        config: {
          systemInstruction:
            `Translate the user's text to ${langName}. Preserve ALL HTML tags, markdown syntax, URLs and code blocks exactly. ` +
            `Do not translate code. Return ONLY the translation, with no comments and no code fences around it.`,
          temperature: 0.3,
          abortSignal: ctrl.signal
        }
      }),
      hardTimeout
    ]);
    const out = (res.text || '').trim();
    const finish = res.candidates && res.candidates[0] && res.candidates[0].finishReason;
    if (!out) throw Object.assign(new Error('Empty response' + (finish ? ' (' + finish + ')' : '')), { status: 'EMPTY' });
    if (finish && finish !== 'STOP') throw Object.assign(new Error('Incomplete response: ' + finish), { status: 'INCOMPLETE' });
    return out;
  } finally {
    clearTimeout(timer);
    clearTimeout(hardTimer);
  }
}

function isDailyQuota(e) {
  const m = String((e && e.message) || '');
  return /per ?day|daily/i.test(m) && /quota|RESOURCE_EXHAUSTED|429/i.test(m);
}
function isAuthError(e) {
  const m = String((e && e.message) || '');
  return (e && (e.status === 401 || e.status === 403)) || /API key|PERMISSION_DENIED|UNAUTHENTICATED/i.test(m);
}

async function translate(text, lang) {
  if (!has(text)) return text;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (outOfTime()) throw new StopRun('time budget used up');
    try {
      const out = await callOnce(text, lang.name);
      consecutiveFails = 0;
      return out;
    } catch (e) {
      if (isAuthError(e) || isDailyQuota(e)) throw new StopRun('Gemini rejected the request: ' + (e.message || e.status));
      const retryable = [429, 500, 503, 504, 'TIMEOUT', 'EMPTY', 'INCOMPLETE'].includes(e.status) ||
        /UNAVAILABLE|overloaded|timed out|abort|fetch failed|ECONNRESET|ETIMEDOUT/i.test(String(e.message || ''));
      if (retryable && attempt < MAX_ATTEMPTS) {
        const wait = Math.min(3000 * 2 ** (attempt - 1), 20000);
        console.log(`  ⏳ ${lang.code}: retry ${attempt}/${MAX_ATTEMPTS - 1} in ${wait}ms (${e.status || e.message})`);
        await sleep(wait);
        continue;
      }
      consecutiveFails++;
      if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) throw new StopRun(`${consecutiveFails} failures in a row, stopping`);
      throw e;
    }
  }
}

/* ---------- split long content without breaking code fences / <pre> blocks ---------- */
function splitContent(text) {
  if (text.length <= CHUNK_CHARS) return [text];
  const blocks = text.split(/\n{2,}/);
  const chunks = [];
  let cur = '';
  let buf = '';          // a protected block (code) is accumulated here until it is closed
  let inFence = false;
  let preDepth = 0;

  const push = (b) => {
    if (cur && (cur.length + b.length + 2) > CHUNK_CHARS) { chunks.push(cur); cur = ''; }
    cur = cur ? cur + '\n\n' + b : b;
  };

  for (const b of blocks) {
    if (((b.match(/^```/gm) || []).length % 2) === 1) inFence = !inFence;
    preDepth += (b.match(/<pre[\s>]/gi) || []).length - (b.match(/<\/pre>/gi) || []).length;
    if (preDepth < 0) preDepth = 0;
    buf = buf ? buf + '\n\n' + b : b;
    if (!inFence && preDepth === 0) { push(buf); buf = ''; }
  }
  if (buf) push(buf);
  if (cur) chunks.push(cur);
  return chunks;
}

async function translateContent(text, lang) {
  const parts = splitContent(text);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    out.push(await translate(parts[i], lang));
    if (i < parts.length - 1) await sleep(PAUSE_MS);
  }
  return out.join('\n\n');
}

/* ---------- save progress to Supabase ---------- */
async function save(id, ti, ei, ci) {
  const done = LANGS.filter((l) => has(ti[l.code]) && has(ei[l.code]) && has(ci[l.code])).map((l) => l.code);
  const full = {
    title_i18n: ti, excerpt_i18n: ei, content_i18n: ci,
    translation_langs: ['en'].concat(done),
    translation_status: done.length === LANGS.length ? 'done' : 'pending'
  };
  let { error } = await supabase.from('articles').update(full).eq('id', id);
  if (error && /translation_(langs|status)/i.test(error.message || '')) {
    // optional columns missing: save the translations anyway
    ({ error } = await supabase.from('articles').update({ title_i18n: ti, excerpt_i18n: ei, content_i18n: ci }).eq('id', id));
  }
  if (error) throw new Error('Supabase save failed for ' + id + ': ' + error.message);
}

function missingLangs(a) {
  const ti = a.title_i18n || {}, ei = a.excerpt_i18n || {}, ci = a.content_i18n || {};
  return LANGS.filter((l) => !(has(ti[l.code]) && has(ei[l.code]) && has(ci[l.code])));
}

async function main() {
  const { data, error } = await supabase
    .from('articles')
    .select('id,title,excerpt,content,title_i18n,excerpt_i18n,content_i18n')
    .order('id', { ascending: false });
  if (error) { console.error('Supabase read failed:', error.message); process.exit(1); }

  const arts = data || [];
  const todo = arts.filter((a) => has(a.title) && has(a.content) && missingLangs(a).length > 0);
  console.log(`Total articles: ${arts.length} | need translation: ${todo.length} | limit: ${LIMIT || 'none'} | budget: ${MAX_RUNTIME_MIN} min`);

  console.log(`Supabase: ${new URL(process.env.SUPABASE_URL).host} | model: ${MODEL}`);
  todo.slice(0, 10).forEach((a) => console.log(`  - #${a.id} "${String(a.title).slice(0, 60)}" missing: ${missingLangs(a).map((l) => l.code).join(',')}`));

  let attempted = 0, completed = 0;
  try {
    if (todo.length) {                            // preflight: one tiny request tells us at once if key/model/quota work
      try { await callOnce('Hello', 'French'); console.log('Gemini preflight OK'); }
      catch (e) { throw new StopRun('Gemini preflight failed: ' + (e.status || '') + ' ' + String(e.message || '').slice(0, 300)); }
    }
    for (const a of todo) {                       // newest articles first
      if (LIMIT && attempted >= LIMIT) { console.log(`Limit reached (${LIMIT})`); break; }
      if (outOfTime()) { console.log('Time budget used up, stopping cleanly'); break; }
      attempted++;

      const ti = Object.assign({}, a.title_i18n);
      const ei = Object.assign({}, a.excerpt_i18n);
      const ci = Object.assign({}, a.content_i18n);
      let ok = true;

      for (const L of missingLangs(a)) {
        try {
          const c = L.code;
          if (!has(ti[c])) { ti[c] = await translate(a.title, L); await sleep(PAUSE_MS); }
          if (!has(ei[c])) {
            if (has(a.excerpt)) { ei[c] = await translate(a.excerpt, L); await sleep(PAUSE_MS); }
            else ei[c] = ti[c];
          }
          if (!has(ci[c])) { ci[c] = await translateContent(a.content, L); await sleep(PAUSE_MS); }
          await save(a.id, ti, ei, ci);           // save after every language, progress is never lost
          console.log(`  ✔ ${a.id}/${c}`);
        } catch (e) {
          if (e instanceof StopRun) throw e;
          ok = false;
          failures++;
          const msg = `${a.id}/${L.code}: ${e.status || ''} ${String(e.message || '').slice(0, 300)}`;
          if (errorsSeen.length < 8) errorsSeen.push(msg);
          console.error(`  ❌ ${msg}`);
        }
      }
      if (ok) { completed++; console.log(`✅ Translated: ${a.id}`); }
      else console.log(`⚠️  Partly translated: ${a.id} (will be retried next run)`);
    }
  } catch (e) {
    if (e instanceof StopRun) { stopReason = e.message; console.error(`🛑 Stopped: ${e.message}`); }
    else throw e;
  }

  console.log(`Done. attempted=${attempted} completed=${completed} failures=${failures} time=${Math.round((Date.now() - START) / 1000)}s`);
  summary([
    '### Translate articles',
    `- need translation: ${todo.length} | attempted: ${attempted} | completed: ${completed} | failures: ${failures}`,
    stopReason ? `- STOPPED: ${stopReason}` : '',
    ...errorsSeen.map((m) => '- ' + m)
  ]);

  // Never report "success" when the work did not happen.
  if (stopReason || (attempted > 0 && completed === 0)) {
    console.error('❌ Translation did not complete. See the errors above.');
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
