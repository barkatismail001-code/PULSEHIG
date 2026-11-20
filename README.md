# TechPulse

Static site on GitHub Pages + Supabase. English only.

## Structure
| File | Purpose |
|---|---|
| `js/config.js` | **The only settings file**: domain, Supabase keys, admin e-mail, topics + sub-topics, article types |
| `sql/upgrade.sql` | Keeps your articles, adds the new fields (run this if you already ran the previous setup) |
| `sql/setup.sql` | Fresh start: deletes all articles and creates every table (⚠ destructive) |
| `admin.html` + `js/admin.js` | Write/edit articles: at-a-glance box, review box, video, images, templates, preview |
| `c/*.html` | Category pages (generated from `config.js`) |
| `a/*.html` | One static page per article (generated from Supabase) |
| `scripts/build-feeds.mjs` | Builds `c/`, `a/`, `sitemap.xml`, `rss.xml` and stamps CSS/JS links with a content hash |
| `.github/workflows/build.yml` | Runs every 30 minutes, on selected source changes, or manually via *Run workflow* |
| `css/style.css` | Original design. `css/extra.css` and `css/admin.css` hold the new components |

## Setup
1. Supabase → SQL Editor → run `sql/upgrade.sql` (keeps existing articles) **or** `sql/setup.sql` (fresh install; destructive).
2. Run `sql/migrations/004_page_views.sql` once in Supabase SQL Editor. It is safe to re-run and adds aggregate page-view tracking. Do not run `setup.sql` on a live site.
3. Run `sql/migrations/005_admin_by_uid.sql` once (admin is identified by account ID, not e-mail). Then Authentication → turn **off** "Allow new users to sign up". The admin user must exist under Authentication → Users with a confirmed e-mail equal to `ADMIN_EMAIL`.
4. Upload all files to GitHub (replace the old ones).
5. GitHub → Settings → Pages: the custom domain must equal `SITE_URL` in `js/config.js` and the `CNAME` file.
6. GitHub → Actions → *Build pages* → *Run workflow*.
7. Google Search Console: submit `https://pulsehig.com/sitemap.xml`.

## Images (admin page)
Any image (JPG, PNG, WebP, GIF, AVIF, BMP, SVG, HEIC on Safari) is converted in the browser to **WebP**, at a fixed size: **1200×630** for covers and **1200×800** for pictures inside articles. Nothing is cropped: a different shape is centred over a blurred copy of itself. Quality is lowered step by step until the file is about **120 KB or less**. Animated GIFs become still pictures. Limits are in `IMG` at the top of the images section of `js/admin.js`.

## Security
- Every page ships a Content-Security-Policy `<meta>` (inline scripts are allowed by SHA-256 hash only). If you add a new external service, add its domain to `connect-src` / `script-src` in `scripts/build-feeds.mjs` and re-run the build for `a/` and `c/`; edit the root `*.html` files by hand.
- `.github/workflows/backup.yml` saves a weekly JSON copy of published articles (Actions → Artifacts).

## Adding topics or sub-topics
Edit `CATEGORIES` in `js/config.js`, push, then run the *Build pages* workflow: menus, tiles, category pages and the admin selects all follow.

## Caching
- Images uploaded by the admin get a unique name and a one-year cache header.
- CSS/JS links carry a content hash (`?v=…`), refreshed on every build, so a changed file is fetched immediately.
- GitHub Pages sends a short cache time for HTML, so edited articles show up quickly. For a real CDN, put Cloudflare (free) in front of the domain.


## Local checks
- Run `npm test` to execute the pre-publish checks.
- Run `npm run build:offline` to regenerate category pages without contacting Supabase.
- The scheduled GitHub Actions build runs every 30 minutes. Use the manual workflow trigger after publishing if you want to avoid waiting for the next scheduled run.

## Analytics notes
- `increment_views(p_slug)` records published-article views.
- `increment_page_view(p_path)` records aggregate page views for public pages. The browser deduplicates each path per tab session using `sessionStorage`; this is a lightweight analytics safeguard, not server-side bot protection or a strict rate limit.
- For strong abuse prevention, put a rate-limiting layer (for example, an Edge Function plus a trusted request/IP strategy) in front of public analytics RPCs. Do not expose a Supabase service-role key in browser code.
- 
