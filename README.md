# TechPulse

> Practical guides on ESP32 / Arduino projects and home repair, plus programming tips and free engineering courses.

Live site: https://www.pulsehig.com

## Topics

- Embedded systems: ESP32, Arduino, sensors, relays, MOSFETs, I2C, deep sleep
- Home repair and smart-home energy savings
- Programming and troubleshooting
- Free university-level engineering courses, calculators and project guides

## Languages

English by default, with automatic translations (Chinese, Spanish, Hindi, French, Portuguese)

## Architecture

- Frontend: plain HTML / CSS / JavaScript (no framework)
- Backend: Supabase (articles, article_views, site_stats, forum, auth, storage)
- Hosting: **GitHub Pages only** (custom domain in `CNAME`, `.nojekyll` present)
- SEO: `scripts/generate-seo.mjs` writes `a/`, `series/`, `rss/` and the sitemaps
- PWA: `manifest.json`, `sw.js`, `offline.html`

## Deploying on GitHub Pages

1. Push this folder to your repository (branch `main`).
2. Repository **Settings → Pages**: Source = *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Custom domain: `www.pulsehig.com` (already in `CNAME`) and enable *Enforce HTTPS*.
4. Repository **Settings → Secrets and variables → Actions**, add the secrets below.

GitHub Pages cannot set HTTP headers; the Content-Security-Policy is applied with `<meta>` tags in each page.

## GitHub workflows

| File | Purpose |
|------|---------|
| `seo.yml` | Rebuilds static pages, sitemaps and feeds when `a/`, `data/`, `js/` ... change |
| `db-setup.yml` | One-time: builds ALL tables, policies, storage bucket, courses and recovered articles on a NEW Supabase project |
| `switch-supabase.yml` | One-time: points the whole site (URL + public key + CSP) to the new project and commits |
| `db-migrate.yml` | Runs `database/fix_missing_columns.sql` on Supabase (on push or manually). Needs secret `SUPABASE_ACCESS_TOKEN` |


## Moving to a new Supabase project

1. Create the project, then sign up in it with the admin email used in `database/supabase_security_fix.sql` (function `is_admin()`).
2. Add repository secrets: `SUPABASE_URL` (new), `SUPABASE_SERVICE_KEY` (new secret key), `SUPABASE_ACCESS_TOKEN`.
3. Actions → **Set up a NEW Supabase project** → Run workflow.
4. Actions → **Switch site to a new Supabase project** → enter the new URL and public key.
5. Supabase → Authentication → URL configuration: set the site URL to https://www.pulsehig.com.

Forum posts, Q&A, users, likes and view counters live only in the old project and cannot be recreated from the repository.

## Admin panel (`/admin.html`)

(get one at https://aistudio.google.com/apikey); it is used for that request only and is never stored.

## Security

Only the admin account can write to the content tables. Policies live in
`database/supabase_security_fix.sql` (function `public.is_admin()`); the public key in the front-end
code can only read. Never put the service key or any API key in the repository (`.env` is git-ignored;
use `.env.example` as a template).

## Local development

```
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## License

MIT


## Publishing workflow (manual only)

Nothing is generated or published automatically. There is no AI writer, no machine translation and no scheduled job.

1. Open `admin.html` and sign in.
2. Write the article in English using the six sections: The Problem, Possible Causes, Tools and Components Needed, Step-by-Step Solution, Images and Diagrams, Common Mistakes (plus optional safety notes).
3. Click **Save Article** (minimum 600 words; the form checks this).
4. Publish the static page: GitHub -> Actions -> **Rebuild Static Pages (manual)** -> Run workflow (or `node scripts/generate-seo.mjs` locally, then push).

Quality gates in `scripts/generate-seo.mjs`: articles under 600 words stay `noindex`, are hidden from lists and are left out of the sitemap. Duplicate/old URLs are redirected via `data/redirects.json`.
Offline mode: without `SUPABASE_SERVICE_KEY` the build reads `data/articles-source.json`.
