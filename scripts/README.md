# Scripts Documentation

Node.js automation scripts for TechPulse (Node >= 20, run `npm install` first).

- `daily-bot.mjs` : Generates one long article (1500–2500 words) with **Gemini** and saves it to Supabase.
  Topic comes from the `TOPIC` env var (optional `TOPIC_CATEGORY`) or from the first line of `data/topics-queue.json`.
- `generate-courses.mjs` : Builds static course pages from Supabase.
- `generate-seo.mjs` : Generates article pages, series, sitemaps, RSS feeds.
- `generate-tools-guides.mjs` : Builds tool and guide pages.
- `translate-articles.mjs` : Translates articles with **Gemini** into 5 languages (fr, es, zh, hi, pt). `TRANSLATE_LIMIT` caps articles per run.
- `update-sitemap.mjs` : Updates extended sitemaps.

## Environment Variables

| Variable | Used by |
|---|---|
| `GEMINI_API_KEY` | daily-bot, translate-articles |
| `GEMINI_MODEL` | optional, default `gemini-flash-latest` |
| `SUPABASE_URL` | all scripts |
| `SUPABASE_SERVICE_KEY` | all write scripts |
