import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

// Generates ONE article with Gemini and saves it to Supabase (table: articles).
// Topic: TOPIC env var (manual run) or the first entry of data/topics-queue.json.

for (const k of ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY']) {
  if (!process.env[k]) { console.error('Missing ' + k); process.exit(1); }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const QUEUE_FILE = 'data/topics-queue.json';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, attempt = 1) {
  const maxAttempts = 5;
  try {
    return await fn();
  } catch (e) {
    const retryable = e.status === 503 || e.status === 429 || e.message?.includes('UNAVAILABLE');
    if (retryable && attempt < maxAttempts) {
      const wait = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
      console.log(`⏳ Retry ${attempt}/${maxAttempts} after ${wait}ms`);
      await sleep(wait);
      return withRetry(fn, attempt + 1);
    }
    throw e;
  }
}

function slugify(text, max = 60) {
  let s = String(text).toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length > max) {
    s = s.slice(0, max);
    const i = s.lastIndexOf('-');
    if (i > 30) s = s.slice(0, i);
  }
  return s.replace(/-+$/g, '') || 'article-' + Date.now();
}

const wordCount = (html) => String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

async function generateArticle(topic, category) {
  const res = await withRetry(() => ai.models.generateContent({
    model: MODEL,
    contents: `Write a detailed, practical technical article (1500-2500 words) about: "${topic}".
Use concrete component values, units and step-by-step verification. Never invent statistics or quotes.
Structure: short introduction, 5-7 sections with <h2> headings, a FAQ section with 4 questions, a conclusion.
Return JSON only (no markdown fences):
{"title":"...","excerpt":"140-155 characters","content":"<p>HTML content using only p, h2, h3, ul, ol, li, strong, code, pre tags</p>","category":"${category}","tags":["...","..."]}`,
    config: {
      systemInstruction: 'You are a senior technical writer for TechPulse, a website about ESP32/Arduino, embedded systems, home repair and programming. Output valid JSON only.',
      responseMimeType: 'application/json',
      temperature: 0.7
    }
  }));
  return JSON.parse(res.text);
}

async function uniqueSlug(base) {
  let slug = base;
  for (let i = 2; i < 20; i++) {
    const { data, error } = await supabase.from('articles').select('id').eq('slug', slug).limit(1);
    if (error) throw error;
    if (!data || !data.length) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

async function main() {
  const manualTopic = (process.env.TOPIC || '').trim();
  const category = (process.env.TOPIC_CATEGORY || '').trim() || 'Technology';

  let topic = manualTopic;
  let queue = [];
  if (!topic) {
    queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    if (!queue.length) { console.log('No topics in queue'); return; }
    topic = queue[0];
  }

  const art = await generateArticle(topic, category);
  if (!art || !art.title || !art.content) throw new Error('Gemini returned an incomplete article');
  const words = wordCount(art.content);
  if (words < 800) throw new Error(`Article too short (${words} words) - not saved`);

  const slug = await uniqueSlug(slugify(art.title));
  const row = {
    title: art.title,
    slug,
    excerpt: String(art.excerpt || '').slice(0, 300),
    content: art.content,
    category: art.category || category,
    tags: Array.isArray(art.tags) ? art.tags : [],
    author: 'TechPulse Team',
    readtime: Math.max(1, Math.round(words / 200)) + ' min read',
    // new article enters the translation queue (picked up within ~5 minutes)
    title_i18n: { en: art.title },
    excerpt_i18n: { en: String(art.excerpt || '').slice(0, 300) },
    content_i18n: { en: art.content },
    translation_status: 'pending',
    translation_langs: ['en']
  };
  // If an optional column is missing in the live table, drop it and retry.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from('articles').insert(row);
    if (!error) break;
    const m = /find the ['"]([A-Za-z0-9_]+)['"] column/i.exec(error.message || '');
    if (!m || !(m[1] in row) || ['title', 'content'].includes(m[1])) throw error;
    console.warn('Column missing in DB, saving without it:', m[1]);
    delete row[m[1]];
  }

  if (!manualTopic) {
    queue.shift();
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2) + '\n');
  }
  console.log(`✅ Article created: ${slug} (${words} words)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
