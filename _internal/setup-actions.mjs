// setup-actions.mjs — create GitHub Actions workflows for auto-translate + rebuild
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const WF = join(ROOT, '.github', 'workflows');

await mkdir(WF, { recursive: true });

// ════════════════════════════════════════════════════════
// 1. translate.yml — runs daily, translates any pending articles
// ════════════════════════════════════════════════════════
const translateYml = `name: Auto Translate Articles

on:
  schedule:
    # Runs every day at 03:00 UTC (04:00 Algeria time)
    - cron: '0 3 * * *'
  workflow_dispatch:
    inputs:
      batch_size:
        description: 'Number of articles to translate'
        required: false
        default: '10'

jobs:
  translate:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run translator
        env:
          SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: \${{ secrets.SUPABASE_SERVICE_KEY }}
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          BATCH_SIZE: \${{ github.event.inputs.batch_size || '10' }}
        run: node scripts/translate-articles.mjs

      - name: Summary
        run: echo "Translation job completed at $(date -u)"
`;

// ════════════════════════════════════════════════════════
// 2. daily-bot.yml — generates 1 article per day (optional)
// ════════════════════════════════════════════════════════
const dailyBotYml = `name: Daily Article Generator

on:
  schedule:
    # Runs every day at 06:00 UTC (07:00 Algeria time)
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate one article
        env:
          SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: \${{ secrets.SUPABASE_SERVICE_KEY }}
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          GEMINI_MODEL: 'gemini-flash-latest'
        run: node scripts/daily-bot.mjs

      - name: Commit updated queue
        run: |
          if git diff --quiet data/topics-queue.json; then
            echo "No queue changes"
          else
            git config user.name "TechPulse Bot"
            git config user.email "bot@pulsehig.com"
            git add data/topics-queue.json
            git commit -m "Bot: consume topic from queue"
            git push
          fi

      - name: Summary
        run: echo "Daily article generated at $(date -u)"
`;

// ════════════════════════════════════════════════════════
// 3. seo-rebuild.yml — regenerate sitemaps + slug-map after content changes
// ════════════════════════════════════════════════════════
const seoYml = `name: SEO Rebuild

on:
  push:
    branches: [main]
    paths:
      - 'scripts/generate-seo.mjs'
      - 'scripts/generate-courses.mjs'
      - 'scripts/generate-tools-guides.mjs'
      - 'data/static-slugs.json'
      - 'data/canonical-overrides.json'
      - 'data/manual-articles.json'
  workflow_dispatch:

jobs:
  rebuild:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate SEO files
        env:
          SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: \${{ secrets.SUPABASE_SERVICE_KEY }}
        run: node scripts/generate-seo.mjs

      - name: Verify build
        run: npm run verify

      - name: Commit regenerated files
        run: |
          if git diff --quiet; then
            echo "No changes"
          else
            git config user.name "TechPulse Bot"
            git config user.email "bot@pulsehig.com"
            git add -A
            git commit -m "Bot: rebuild SEO (sitemaps, slug-map)"
            git push
          fi
`;

// ════════════════════════════════════════════════════════
// 4. verify.yml — run on every push to catch regressions
// ════════════════════════════════════════════════════════
const verifyYml = `name: Verify Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run verify
        run: npm run verify
`;

async function writeIfNew(path, content, label) {
  try {
    await access(path);
    console.log('  = ' + label + ' (already exists)');
  } catch {
    await writeFile(path, content);
    console.log('  + ' + label);
  }
}

console.log('[1/4] Writing workflows to .github/workflows/');
await writeIfNew(join(WF, 'translate.yml'), translateYml, 'translate.yml');
await writeIfNew(join(WF, 'daily-bot.yml'), dailyBotYml, 'daily-bot.yml');
await writeIfNew(join(WF, 'seo-rebuild.yml'), seoYml, 'seo-rebuild.yml');
await writeIfNew(join(WF, 'verify.yml'), verifyYml, 'verify.yml');

console.log('\n[2/4] Checking scripts referenced');
const fs = await import('node:fs/promises');
const scripts = ['translate-articles.mjs', 'daily-bot.mjs', 'generate-seo.mjs', 'verify-build.mjs'];
for (const s of scripts) {
  try {
    await fs.access(join(ROOT, 'scripts', s));
    console.log('  OK scripts/' + s);
  } catch {
    console.log('  MISSING scripts/' + s + ' -- some workflows will fail without it');
  }
}

console.log('\nDone.');
console.log('');
console.log('Next: push to GitHub and add secrets (see instructions).');