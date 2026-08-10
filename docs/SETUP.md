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

LLM keys are optional. Without keys, the system still runs and produces deterministic local drafts.

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

They are not intentionally committed by the daily marketing workflow.

If no Search Console export is available, `pnpm seo:plan` produces a `needs-gsc-data` plan and refuses to invent a content opportunity. Use `pnpm seo:plan:strict` when missing GSC data should fail the command instead.

### GitHub Actions setup

Add the service-account JSON as this repository secret:

```text
GOOGLE_SERVICE_ACCOUNT_JSON
```

The daily marketing workflow then:

1. pulls fresh 28-day `query,page` Search Console data;
2. inventories the existing website and builds the SEO action queue;
3. tests the decision logic;
4. selects the highest-leverage `REFRESH`, `CREATE`, or `MERGE` opportunity;
5. feeds the complete GSC brief into the content writer;
6. skips content generation when no strong GSC-backed action exists;
7. saves the plan/report and continues the existing social/reporting workflow.

The heuristic keyword roadmap is still generated for ideation/dashboard context, but it no longer decides which daily article should be drafted.

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
