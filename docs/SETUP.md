# Setup

## Requirements

- Node 22+
- pnpm 9.15.9

## Install

```bash
corepack enable
pnpm install --ignore-scripts
```

Puppeteer is configured as an ignored build dependency. Do not approve third-party install scripts unless you understand why they are required.

## Environment

Copy `.env.example` to `.env` and configure only the providers you use.

```bash
cp .env.example .env
```

Never commit `.env`, a service-account JSON file, Search Console exports, expert opportunity plans, experiment state, or API keys.

## Production SEO system

The production SEO system is an evidence-driven decision pipeline, not a daily article queue. Its normal sequence is:

1. pull private Google Search Console `query,page` evidence;
2. inventory the current public site;
3. classify opportunities as `REFRESH`, `CREATE`, `MERGE`, `MONITOR`, or `SKIP`;
4. apply senior-level expected-value, confidence, business-fit, risk, and cannibalization gates;
5. research the live search landscape with Google Search grounding;
6. produce a draft, run a separate critic pass, and repair it until deterministic quality gates pass;
7. apply only a safe `REFRESH` or `CREATE` automatically;
8. rebuild discovery files, validate JSON-LD/routes/links, build the site, and commit only public files;
9. wait for GitHub Pages and verify the exact experiment marker on the live URL;
10. save private cooldown and experiment state so the same idea is not repeated before it can be measured.

`MERGE`, redirects, deletions, broad pruning, and destructive consolidation remain human-reviewed because backlink and unique-content loss cannot be assessed safely from Search Console alone.

### Search Console credentials

Create a Google service account, give its email read-only access to the Search Console property `sc-domain:youraicoach.life`, and store the complete JSON credential in the GitHub Actions repository secret:

```text
GOOGLE_SERVICE_ACCOUNT_JSON
```

The production workflow fails visibly when this secret is missing, malformed, unauthorized, or returns no query+page evidence. It never falls back to guessed demand.

For local use, put the raw JSON into the environment variable. Do not point production at a committed credential file.

### Gemini credentials

Configure one or more repository secrets:

```text
GEMINI_API_KEY
GEMINI_API_KEY_2
GEMINI_API_KEY_3
```

The publisher uses the current `@google/genai` SDK and attempts these stable models in order unless overridden:

```text
gemini-3.6-flash
gemini-3.5-flash
gemini-3.5-flash-lite
```

A live structured-output smoke test runs before content work. Exact API keys and Search Console queries are never printed.

## Local verification

Pull private GSC evidence:

```bash
pnpm gsc:private
```

Build the base and expert plans:

```bash
pnpm seo:plan:strict -- --gsc tools/ai-marketing/search-console-reports/latest-28d.json
pnpm seo:expert
```

Run all deterministic planner, clustering, sanitizer, metadata, and idempotency tests:

```bash
pnpm test:seo-growth
```

Verify the configured Gemini model/key combination:

```bash
pnpm seo:smoke:gemini
```

Run the full research, draft, critic, repair, renderer, and quality-gate path without modifying public files:

```bash
pnpm seo:publish:dry
```

A real publication is intentionally explicit:

```bash
pnpm seo:publish
```

Do not run the real publisher in a working tree you are not prepared to validate and commit.

## Private artifacts

These paths are gitignored and must stay private:

```text
tools/ai-marketing/search-console-reports/
data/marketing-employee/seo-growth/
```

The public repository contains only implementation code and website output. Production logs use irreversible query hashes rather than exact GSC queries.

## GitHub Actions

### Daily SEO Production

`.github/workflows/daily-blog.yml` is the only scheduled workflow allowed to create or materially refresh an SEO page. It runs once daily, validates credentials and deterministic tests, then performs at most one evidence-backed action. It may also decide that no publication is justified.

A manual dispatch supports:

- `dry_run=true`: exercise the real private GSC and Gemini pipeline without changing the site;
- `force=true`: bypass cooldowns only for a supervised diagnostic run.

Failures open or update one repository health issue. A later successful run closes it.

### SEO production validation

`.github/workflows/seo-growth-engine-ci.yml` has two layers:

- deterministic tests plus a strict production build;
- a credentialed same-repository smoke test that verifies real Search Console access, current Gemini access, live Google Search grounding, the critic/repair loop, and the renderer without publishing.

### Pages deployment

`.github/workflows/deploy.yml` blocks success when source/built JSON-LD is invalid, required pages are missing, critical internal routes or links fail, deployment fails, or live core pages do not return HTTP 200. The SEO production workflow additionally verifies the exact experiment marker after a content change.

### Retired automatic generators

The old daily hard-coded keyword publisher, daily comparison generator, daily mass-translation workflow, and fake weekly `dateModified` refresher are not part of production. Comparison or multilingual expansion should happen only when first-party evidence and a reviewed brief justify it.

## Marketing dashboard

```bash
pnpm dev
```

Open:

```text
http://localhost:5173/marketing-dashboard
```

The separate weekly marketing-health workflow may generate sanitized audits and reports. It is not allowed to publish editorial pages.

## Other local tools

```bash
pnpm audit:site -- --url=https://youraicoach.life --max-pages=100
pnpm report:weekly
pnpm sitemap:check
pnpm video:check
pnpm check:links
pnpm build
```

## Docker Compose

```bash
docker compose up
```

The worker health endpoint is:

```text
http://localhost:4317/health
```
