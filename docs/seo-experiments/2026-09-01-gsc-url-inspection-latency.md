# SEO Experiment: Search Console URL Inspection Latency

- **Status:** implementation
- **Launch date:** 2026-09-01
- **Action class:** SEO observability / crawl-state reliability
- **Target surface:** `tools/ai-marketing/gsc-index-inspection.mjs`
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

No September 1 Search Console Actions run was available when the SEO decision cycle began, so the last known-good Search Console verification job was rerun rather than changing public content from stale evidence.

The recovered report covers 2026-08-04 through 2026-08-31 and contains 85 private query + landing-page rows, 136 impressions, 1 click, 17 landing pages, and 0 URL Inspection API errors. The landing-page aggregate is materially unchanged from the prior reporting endpoint. High-leverage URLs such as workout reminders, workout + meal planning, progressive overload, and the AI workout generator remain inside active experiment locks.

The recovered URL Inspection step inspected 25 URLs successfully, but execution was serial. It started at 2026-09-01T08:26:59Z and completed at 2026-09-01T08:29:41Z: approximately 162 seconds for 25 URLs. Each request has a 45-second timeout while the workflow itself has a 15-minute timeout, so serial execution creates avoidable evidence latency and a poor worst-case failure envelope.

## Competing explanations checked

A stale Google `noindex` state on `/blog/ai-personal-trainer-that-actually-works` was investigated as a possible higher-value crawl defect. The current page is indexable and self-canonical, the sitemap contains the current URL and August 13 lastmod, and repository search finds multiple internal links. That makes additional speculative linking or another page rewrite lower confidence than improving the measurement system itself.

The Search Console cron is also being evaluated separately for GitHub scheduling delays. This experiment deliberately does not change the cron so it does not contaminate that reliability test.

## External constraint validation

Google's official Search Console API limits list URL Inspection quotas of 2,000 requests/day and 600 requests/minute per site, plus much higher project quotas. A fixed concurrency of 5 for a 25-URL batch is therefore intentionally conservative and remains far below the documented per-site rate limit.

## Change

- Keep the existing 25-URL inspection cap and priority selection unchanged.
- Execute URL inspections with a fixed bounded concurrency of 5 instead of serially.
- Preserve result and error ordering by original URL index.
- Keep the existing per-request timeout, API-error fail-closed behavior, privacy controls, report format, and workflow outputs unchanged.
- Add a deterministic regression assertion preventing accidental return to the serial loop or unbounded parallelism.

No public URL, page content, title, H1, canonical, schema, robots directive, sitemap entry, internal link, or active ranking experiment is changed.

## Hypothesis

A conservative five-worker URL Inspection pool will reduce the crawl-state phase from roughly 162 seconds to under 60 seconds while preserving 25/25 inspection coverage, output ordering, and zero API errors.

## Baseline

- Reporting period: 2026-08-04 to 2026-08-31
- Private query + page rows: 85
- Site impressions: 136
- Site clicks: 1
- URL Inspection requested: 25
- URL Inspection completed: 25
- API errors: 0
- Indexed: 24
- Neutral/unknown: 1
- URL Inspection phase runtime: ~162 seconds

## Target metrics

1. 25/25 priority URLs inspected.
2. 0 URL Inspection API errors.
3. URL Inspection phase runtime <= 60 seconds on the first normal post-change run, or at minimum a >=50% reduction versus the 162-second baseline.
4. Result ordering remains identical to priority URL ordering.
5. Encrypted private evidence generation and safe public snapshot persistence remain successful.

## Expected direction

- Evidence latency: decrease substantially.
- Workflow timeout risk: decrease.
- Search/content state: unchanged.
- API error rate: unchanged at zero.

## Review window

- **Immediate validation:** first Search Console health run triggered by the merged script change.
- **Next-day reliability check:** 2026-09-02.
- **Preferred combined observability decision:** 2026-09-03, alongside the existing scheduled-delivery reliability review.

## Risks

The main risk is increasing simultaneous calls to Google's URL Inspection API. Concurrency is capped at five, far below Google's documented 600 requests/minute per-site quota. The implementation remains fail-closed if any inspection request errors. No ranking/content experiment is exposed to this change.
