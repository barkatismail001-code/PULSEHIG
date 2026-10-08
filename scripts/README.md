# Scripts Documentation

Node.js automation scripts for TechPulse.

- `daily-bot.mjs` : Generates one long article (1500–2500 words) via **DeepSeek** and saves it to Supabase.
- `generate-courses.mjs` : Builds static course pages from Supabase.
- `generate-seo.mjs` : Generates article pages, series, sitemaps, RSS feeds.
- `generate-tools-guides.mjs` : Builds tool and guide pages.
- `translate-articles.mjs` : Translates articles via **DeepSeek** into 6 languages.
- `update-sitemap.mjs` : Updates extended sitemaps.

## Environment Variables

| Variable | Used by |
|---|---|
| `DEEPSEEK_API_KEY` | daily-bot, translate-articles |
| `DEEPSEEK_MODEL` | optional, default `deepseek-chat` |
| `SUPABASE_URL` | all scripts |
| `SUPABASE_SERVICE_KEY` | all write scripts |
