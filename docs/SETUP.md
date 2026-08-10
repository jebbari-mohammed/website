# Setup

## Requirements

- Node 22+
- pnpm

## Install

```bash
pnpm install --ignore-scripts
```

Puppeteer is already configured as an ignored build dependency for this project. Do not approve third-party install scripts unless you know why the script is needed.

## Environment

Copy `.env.example` to `.env` and fill only the providers you use.

```bash
cp .env.example .env
```

LLM keys are optional for the deterministic planning/draft pipeline. Production GSC publication requires a Gemini key because the publisher writes or refreshes site content.

## Search Console SEO Growth Engine

The SEO growth engine is intentionally driven by Google Search Console instead of guessed keyword volume. It inventories the existing site, groups query variants, checks the ranking URL, and returns one of these actions:

- `REFRESH`: improve the existing ranking page, especially when it is already within striking distance.
- `CREATE`: create one substantial page for a missing search intent only when the current ranking URL is a poor match.
- `MERGE`: flag likely query cannibalization for consolidation review.
- `MONITOR`: relevant, but not a high-leverage action yet.
- `SKIP`: outside IZEM's topic/product focus.

### Local Search Console setup

Use a Google service account that has read-only access to the `youraicoach.life` Search Console property. Either put the raw JSON in `GOOGLE_SERVICE_ACCOUNT_JSON` or point `GOOGLE_APPLICATION_CREDENTIALS` at the credential file. Never commit the credential.

Pull the latest query + page data and build the plan:

```bash
pnpm gsc -- --days 28 --dimensions query,page --row-limit 2500 --output latest-28d.json
pnpm seo:plan
pnpm test:seo-growth
```

The latest derived plan is written to:

```text
data/marketing-employee/seo-growth/latest.json
data/marketing-employee/seo-growth/latest.md
```

Raw Search Console exports stay under:

```text
tools/ai-marketing/search-console-reports/
```

They are gitignored and should remain private.

If no Search Console export is available, `pnpm seo:plan` produces a `needs-gsc-data` plan and refuses to invent a content opportunity. Use `pnpm seo:plan:strict` when missing GSC data should fail the command instead.

### GitHub Actions setup

Add the service-account JSON as this repository secret:

```text
GOOGLE_SERVICE_ACCOUNT_JSON
```

The marketing planning workflow then:

1. pulls fresh 28-day `query,page` Search Console data;
2. inventories the existing website and builds the SEO action queue;
3. tests the decision logic;
4. selects the highest-leverage `REFRESH`, `CREATE`, or `MERGE` opportunity for brief/social planning;
5. feeds the complete GSC brief into the content writer;
6. skips content generation when no strong GSC-backed action exists;
7. keeps the detailed GSC opportunity queue out of the public Git repository.

The heuristic keyword roadmap is still generated for ideation/dashboard context, but it no longer decides which daily page should be published.

## Production GSC Publication Loop

The existing `Daily Blog Post` GitHub Action no longer publishes from the old giant hard-coded keyword queue. It now pulls its own fresh Search Console report, runs the growth planner, and calls `tools/ai-marketing/gsc-publish.mjs`.

The publisher deliberately auto-applies only two action types:

- `CREATE`: writes one new substantial English blog page when GSC shows a relevant missing intent and the ranking page is a poor match.
- `REFRESH`: preserves the existing HTML page and adds/replaces a marked improvement section. It only changes title/meta description when the current CTR is materially below the planner's internal position-based heuristic.

`MERGE` stays advisory because deleting, redirecting, or consolidating pages safely requires a backlink and unique-content review.

Before any production commit, the loop:

1. rejects missing GSC data instead of falling back to the old queue;
2. selects the highest-scoring eligible GSC opportunity;
3. enforces 14-day refresh and 60-day create cooldowns;
4. cools down sibling queries / the same target page after a publication so stale GSC data does not create near-duplicates the next day;
5. uses a low-temperature Gemini generation step with explicit no-fabrication and health-safety rules;
6. rejects thin content, unsafe HTML, keyword stuffing, unsupported guarantee/medical claim patterns, and malformed title/meta ranges;
7. rebuilds the blog archive and RSS feed;
8. synchronizes the sitemap;
9. validates all JSON-LD across `public/`;
10. commits only `public/` website changes, deploys Pages, and pings Google;
11. triggers the existing IZEM video workflow only for a genuinely new `CREATE` page.

The detailed query plan remains gitignored. Publication cooldown state persists in the private GitHub Actions cache rather than in the public repository.

For a local production-style run:

```bash
cd tools/ai-marketing && npm install && cd ../..
node tools/ai-marketing/search-console.mjs --days 28 --dimensions query,page --row-limit 2500 --output latest-28d.json
node tools/ai-marketing/seo-growth-engine.mjs --require-gsc
GEMINI_API_KEY=... GEMINI_MODEL=gemini-3.5-flash node tools/ai-marketing/gsc-publish.mjs
node tools/ai-marketing/rebuild-blog-index.mjs
node tools/sync-sitemap.mjs
node tools/validate-jsonld.mjs public
```

Do not run the final publisher command against a working tree you are not prepared to review/commit; it can modify a real page or create a new one.

## Run Dashboard

```bash
pnpm dev
```

Open:

```text
http://localhost:5173/marketing-dashboard
```

## Generate Data

```bash
pnpm audit:site -- --url=https://youraicoach.life --max-pages=25
pnpm keywords:generate -- --seed="AI personal trainer accountability"
pnpm blog:create -- --keyword="fitness app that calls you"
pnpm social:repurpose
pnpm report:weekly
```

Artifacts are written to:

```text
data/marketing-employee/
```

Dashboard snapshot is written to:

```text
public/marketing-data/index.json
```

## Docker Compose

```bash
docker compose up
```

This starts the Vite dashboard and the worker health service. The worker health endpoint is:

```text
http://localhost:4317/health
```
