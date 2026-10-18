# Scripts Documentation

Node.js automation scripts for TechPulse (Node >= 20, run `npm install` first).

- `generate-courses.mjs` : Builds static course pages from Supabase.
- `generate-seo.mjs` : Generates article pages, series, sitemaps, RSS feeds.
- `generate-tools-guides.mjs` : Builds tool and guide pages.
- `update-sitemap.mjs` : Updates extended sitemaps.

## Environment Variables

| Variable | Used by |
|---|---|
| `SUPABASE_URL` | all scripts |
| `SUPABASE_SERVICE_KEY` | all write scripts |
