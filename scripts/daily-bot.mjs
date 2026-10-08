// TechPulse — daily article generator (DeepSeek)
// Writes ONE long article (1500–2500 words) per run and saves it to Supabase.
//
// Why several calls instead of one: a single request rarely produces more than ~900 words.
// So we ask for an outline first, then write each section separately, then check the word count
// and expand / shorten the shortest / longest section until the total is inside the target range.
//
// Env vars (GitHub Secrets / workflow env):
//   DEEPSEEK_API_KEY   required
//   DEEPSEEK_MODEL     optional, default deepseek-chat (llama-3.3-70b was retired on 16 Aug 2026)
//   SUPABASE_URL / SUPABASE_SERVICE_KEY   service key needed to save (not needed with DRY_RUN=1)
//   TOPIC          optional, force a topic for this run (workflow_dispatch input)
//   TOPIC_CATEGORY optional, category used with TOPIC (default "Technology")
//   ARTICLE_AUTHOR optional, default "TechPulse Team"
//   DRY_RUN=1      print the article instead of saving it (no Supabase needed)
//   DEEPSEEK_BASE_URL  optional, for tests

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const USED_FILE = join(ROOT, 'data', 'used-topics.json');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/chat/completions';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY; // service key: RLS only lets the admin write articles
const AUTHOR = process.env.ARTICLE_AUTHOR || 'TechPulse Team';
const DRY_RUN = process.env.DRY_RUN === '1';
if (!DRY_RUN && !SUPABASE_KEY) { console.error('SUPABASE_SERVICE_KEY is required to save articles'); process.exit(1); }

const MIN_WORDS = 1500;
const MAX_WORDS = 2500;
const SECTION_COUNT = 6;
const FAQ_COUNT = 4;

// Edit this list freely. One topic is used per run and is not repeated until all are used.
const TOPICS = [
  { topic: "ESP32 WiFi power consumption: real numbers and how to cut them", category: "Embedded Systems" },
  { topic: "Why your ESP32 draws 10 mA in deep sleep and how to fix it", category: "Embedded Systems" },
  { topic: "Fixing ESP32 brownout resets caused by weak USB power", category: "Embedded Systems" },
  { topic: "Safe OTA firmware updates on ESP32 with rollback and signing", category: "Embedded Systems" },
  { topic: "Connecting an ESP32 to Home Assistant over MQTT in 20 minutes", category: "Smart Home" },
  { topic: "Replacing delay() with millis() for non-blocking Arduino code", category: "Programming" },
  { topic: "Picking a logic-level MOSFET for a 3.3V GPIO", category: "Embedded Systems" },
  { topic: "Fixing I2C clock stretching timeouts on the ESP32", category: "Embedded Systems" },
  { topic: "Choosing the right I2C pull-up resistor value with math", category: "Electronics" },
  { topic: "Stopping WS2812 LED flicker: power, ground, and level shifting", category: "Embedded Systems" },
  { topic: "ESP32 ADC calibration for accurate voltage readings", category: "Embedded Systems" },
  { topic: "ESP32 vs ESP8266 vs Arduino Uno: which board for which project", category: "Embedded Systems" },
  { topic: "LiPo battery safety practices for hobby projects", category: "Power" },
  { topic: "Buck converter vs LDO: when to use each", category: "Power" },
  { topic: "Stopping relay arcing with an RC snubber", category: "Electronics" },
  { topic: "Opto-isolated relays: real safety or marketing?", category: "Electronics" },
  { topic: "555 timer in astable mode: formula, example, and common mistakes", category: "Electronics" },
  { topic: "Using a BJT as a switch with proper base resistor calculation", category: "Electronics" },
  { topic: "PCB trace width vs current: IPC-2221 explained in plain English", category: "PCB" },
  { topic: "Fixing ESP32 servo jitter with a separate 5V rail", category: "Embedded Systems" },
  { topic: "Driving a NEMA 17 stepper motor with ESP32 and A4988", category: "Motion" },
  { topic: "Building a smart thermostat with ESP32 and Home Assistant", category: "Smart Home" },
  { topic: "Smart plugs with energy monitoring: worth it in 2026?", category: "Smart Home" },
  { topic: "Keeping a Raspberry Pi cool inside a sealed enclosure", category: "Hardware" },
  { topic: "Upgrading a 2015 laptop with an SSD and more RAM", category: "Upgrades" },
  { topic: "PC will not boot: the 7-step no-POST checklist", category: "Hardware" },
  { topic: "Router keeps rebooting: six causes you can fix today", category: "Networking" },
  { topic: "Finding energy vampires silently draining your power bill", category: "Energy" },
  { topic: "MQTT vs HTTP for IoT devices: which one to pick", category: "Programming" },
  { topic: "Matter vs Zigbee vs Thread: which smart home protocol?", category: "Smart Home" }
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const words = (s) => String(s || '').split(/\s+/).filter(Boolean).length;

async function deepseek(messages, { json = false, maxTokens = 3500, temperature = 0.6 } = {}) {
  if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY is missing (add it in GitHub → Settings → Secrets).');
  for (let attempt = 1; attempt <= 5; attempt++) {
    const body = { model: DEEPSEEK_MODEL, messages, temperature, max_tokens: maxTokens };
        if (json) body.response_format = { type: 'json_object' };

    let res;
    try {
      res = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.warn(`DeepSeek network error (try ${attempt}): ${e.message}`);
      await sleep(3000 * attempt);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = (Number(res.headers.get('retry-after')) || 5 * attempt) * 1000;
      console.warn(`DeepSeek HTTP ${res.status} (try ${attempt}), waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
    const text = String(data?.choices?.[0]?.message?.content || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (!text) { console.warn(`DeepSeek returned empty text (try ${attempt})`); await sleep(2000); continue; }
    await sleep(Number(process.env.DEEPSEEK_PAUSE_MS ?? 1500)); // be gentle with free-tier rate limits
    return text;
  }
  throw new Error('DeepSeek failed after 5 attempts');
}

function parseJson(text) {
  const cleaned = text.replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No JSON object in model output');
  return JSON.parse(cleaned.slice(start, end + 1));
}

// Section bodies must be plain text: the script adds the "## heading" lines itself.
function cleanBody(text) {
  return String(text || '')
    .replace(/^\s*#{1,6}\s.*$/gm, '')          // drop any headings the model added anyway
    .replace(/^\s*(in conclusion|to sum up|in summary)[,:]?\s*/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const SYSTEM = `You are a senior technical writer for TechPulse, a site about ESP32/Arduino electronics, programming and practical home repair. Write accurate, concrete, practical English for hobbyists and technicians. Use real component values, units, tools, typical symptoms and common mistakes. Never invent statistics, studies, quotes, product claims or personal anecdotes. No filler such as "in today's fast-paced world".`;

async function pickTopic() {
  if (process.env.TOPIC && process.env.TOPIC.trim()) {
    return { topic: process.env.TOPIC.trim(), category: process.env.TOPIC_CATEGORY || 'Technology', forced: true };
  }
  let used = [];
  try { used = JSON.parse(await readFile(USED_FILE, 'utf8')); } catch {}
  let pool = TOPICS.filter((t) => !used.includes(t.topic));
  if (!pool.length) { used = []; pool = TOPICS; }
  return { ...pool[Math.floor(Math.random() * pool.length)], used };
}

async function markUsed(t) {
  if (t.forced || DRY_RUN) return;
  const used = [...(t.used || []), t.topic];
  await writeFile(USED_FILE, JSON.stringify(used, null, 1) + '\n');
}

async function buildArticle(t) {
  // 1) Outline + metadata
  console.log('1/4 outline');
  const outline = parseJson(await deepseek([
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Plan an in-depth tutorial article about: "${t.topic}".
Return ONLY a JSON object:
{
  "title": "SEO title, max 65 characters, contains the main keyword",
  "excerpt": "meta description, 140-155 characters, promises a concrete outcome",
  "tags": ["4 to 6 lowercase keyword phrases"],
  "sections": [ { "heading": "specific H2 heading", "brief": "what this section must cover, with concrete items" } ],
  "faq": ["a real question readers search for, ending with ?"]
}
Exactly ${SECTION_COUNT} sections in a logical order (no intro, conclusion or FAQ section among them) and exactly ${FAQ_COUNT} FAQ questions.` },
  ], { json: true, maxTokens: 1800, temperature: 0.5 }));

  const sections = (outline.sections || []).filter((s) => s?.heading).slice(0, SECTION_COUNT);
  if (!outline.title || sections.length < 5) throw new Error('Outline is incomplete');
  const faq = (outline.faq || []).filter((q) => typeof q === 'string' && q.trim()).slice(0, FAQ_COUNT);
  const headingList = sections.map((s, i) => `${i + 1}. ${s.heading}`).join('\n');

  const style = `Format rules: plain paragraphs separated by blank lines. You may use "- " bullet lists, "1. " numbered steps, and ONE fenced code block (\`\`\`cpp ... \`\`\`) only where code really helps. **bold** sparingly. Do NOT write headings, titles or the words "In conclusion".`;

  // 2) Intro + sections
  console.log('2/4 sections');
  const intro = cleanBody(await deepseek([
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Article: "${outline.title}".\nWrite the introduction: 120-180 words. State the problem, who it is for and what the reader will be able to do afterwards. ${style}` },
  ], { maxTokens: 700 }));

  const parts = [];
  for (const [i, s] of sections.entries()) {
    console.log(`   section ${i + 1}/${sections.length}: ${s.heading}`);
    const body = cleanBody(await deepseek([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Article: "${outline.title}".\nFull outline (do not repeat what other sections cover):\n${headingList}\n\nWrite ONLY the body of section ${i + 1}, "${s.heading}". It must cover: ${s.brief || s.heading}.\nLength: 220-300 words of prose (code does not count). Be specific: values, steps, pitfalls, how to verify it worked. ${style}` },
    ], { maxTokens: 1800 }));
    parts.push({ heading: s.heading, body });
  }

  // 3) FAQ + conclusion
  console.log('3/4 faq + conclusion');
  let faqItems = [];
  if (faq.length) {
    try {
      const f = parseJson(await deepseek([
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Article: "${outline.title}". Answer each question in 50-80 words, plain text, no markdown.\nReturn ONLY JSON: {"answers": ["answer 1", "answer 2", ...]} in the same order as these questions:\n${faq.map((q, i) => `${i + 1}. ${q}`).join('\n')}` },
      ], { json: true, maxTokens: 1200, temperature: 0.4 }));
      faqItems = faq.map((q, i) => ({ q: q.trim(), a: cleanBody(f.answers?.[i] || '') })).filter((x) => x.a);
    } catch (e) { console.warn('FAQ step failed, article published without FAQ:', e.message); }
  }
  const conclusion = cleanBody(await deepseek([
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Article: "${outline.title}". Sections: ${sections.map((s) => s.heading).join('; ')}.\nWrite the closing section: 100-140 words with the 3-4 key takeaways and one concrete next step. ${style}` },
  ], { maxTokens: 600 }));

  const assemble = () => [
    intro,
    ...parts.map((p) => `## ${p.heading}\n\n${p.body}`),
    ...(faqItems.length ? [`## Frequently Asked Questions\n\n${faqItems.map((x) => `### ${x.q}\n\n${x.a}`).join('\n\n')}`] : []),
    `## Conclusion\n\n${conclusion}`,
  ].join('\n\n');

  // 4) Word-count control
  console.log('4/4 word count');
  let content = assemble();
  let total = words(content);
  console.log(`   ${total} words`);

  for (let i = 0; i < 3 && total < MIN_WORDS; i++) {
    const idx = parts.reduce((m, p, k) => (words(p.body) < words(parts[m].body) ? k : m), 0);
    const cur = words(parts[idx].body);
    const target = Math.min(480, cur + (MIN_WORDS - total) + 60);
    console.log(`   too short -> expanding section "${parts[idx].heading}" ${cur} -> ~${target} words`);
    parts[idx].body = cleanBody(await deepseek([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Article: "${outline.title}". Section: "${parts[idx].heading}".\nCurrent text:\n\n${parts[idx].body}\n\nRewrite this section to about ${target} words by adding practical detail (extra steps, exact values, troubleshooting cases, common mistakes, how to test). Keep everything correct, do not repeat other sections, ${style}\nOutput ONLY the body.` },
    ], { maxTokens: 2200 }));
    content = assemble(); total = words(content);
    console.log(`   ${total} words`);
  }
  for (let i = 0; i < 4 && total > MAX_WORDS; i++) {
    const idx = parts.reduce((m, p, k) => (words(p.body) > words(parts[m].body) ? k : m), 0);
    const cur = words(parts[idx].body);
    const target = Math.max(180, cur - (total - MAX_WORDS) - 40);
    console.log(`   too long -> shortening section "${parts[idx].heading}" ${cur} -> ~${target} words`);
    parts[idx].body = cleanBody(await deepseek([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Shorten this section to about ${target} words, keep the most useful facts, ${style}\n\n${parts[idx].body}\n\nOutput ONLY the body.` },
    ], { maxTokens: 1500 }));
    content = assemble(); total = words(content);
    console.log(`   ${total} words`);
  }

  if (total < 1200) throw new Error(`Article too short (${total} words) — not published.`);
  if (total < MIN_WORDS || total > MAX_WORDS) console.warn(`⚠️ ${total} words is outside ${MIN_WORDS}-${MAX_WORDS}, published anyway.`);

  return {
    title: String(outline.title).trim().slice(0, 140),
    excerpt: String(outline.excerpt || '').trim().slice(0, 300),
    content,
    category: t.category || 'Technology',
    tags: (outline.tags || []).map((x) => String(x).trim()).filter(Boolean).slice(0, 8),
    total,
  };
}

async function main() {
  const t = await pickTopic();
  console.log(`🤖 Topic: ${t.topic} [${t.category}] — model ${DEEPSEEK_MODEL}`);
  const a = await buildArticle(t);

  if (DRY_RUN) {
    console.log(`\n=== DRY RUN: "${a.title}" (${a.total} words) ===\n${a.excerpt}\n\n${a.content}`);
    return;
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error } = await supabase.from('articles').insert([{
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    author: AUTHOR,
    date: new Date().toISOString().slice(0, 10),
    readTime: `${Math.max(1, Math.round(a.total / 200))} min read`,
    tags: a.tags,
    image: 'https://www.pulsehig.com/assets/og-default.png',
    featured: false,
    likes: 0,
  }]);

  if (error) {
    console.error('❌ Error saving to Supabase:', error);
    process.exit(1); // make the workflow run visibly fail instead of silently continuing
  }
  await markUsed(t);
  console.log(`✅ Published "${a.title}" (${a.total} words)`);
}

main().catch((e) => { console.error('❌', e.message || e); process.exit(1); });
