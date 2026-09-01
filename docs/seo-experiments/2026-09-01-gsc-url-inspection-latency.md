# SEO Experiment: Search Console URL Inspection Latency

- **Status:** repair validation
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

Google's official Search Console API limits list URL Inspection quotas of 2,000 requests/day and 600 requests/minute per site, plus much higher project quotas. Google API guidance also recommends retrying transient 5xx responses with exponential backoff. The repair therefore uses conservative bounded concurrency plus truncated retry behavior rather than treating a single backend 5xx as a permanent inspection failure.

## First production attempt

The initial five-worker implementation reduced the 25-URL phase from roughly 162 seconds to roughly 39 seconds, but one inspection returned an HTTP 502 for `/blog/ai-workout-generator-beginners`. The script correctly failed closed, so the safe snapshot was not published and a health issue was opened. This version was not accepted as the final result.

The failure was a transient 502 rather than a quota response. Even though five concurrent requests are far below Google's documented per-site quota, reliability is more important than maximizing speed.

## Repair

- Reduce bounded concurrency from 5 workers to 3.
- Retry transient network failures, HTTP 429, and HTTP 5xx responses up to 3 total attempts.
- Use short exponential backoff with jitter between retries.
- Preserve the existing 25-URL cap and priority selection.
- Preserve result and error ordering by original URL index.
- Keep the existing per-request timeout, privacy controls, report format, workflow outputs, and final fail-closed behavior after retries are exhausted.
- Keep deterministic regression assertions against serial execution and require the bounded retry constants.

No public URL, page content, title, H1, canonical, schema, robots directive, sitemap entry, internal link, or active ranking experiment is changed.

## Hypothesis

A conservative three-worker URL Inspection pool with bounded retries will materially reduce crawl-state latency while restoring 25/25 inspection reliability when Google returns occasional transient backend errors.

## Baseline

- Reporting period: 2026-08-04 to 2026-08-31
- Private query + page rows: 85
- Site impressions: 136
- Site clicks: 1
- Serial URL Inspection requested/completed: 25/25
- Serial API errors: 0
- Indexed: 24
- Neutral/unknown: 1
- Serial phase runtime: ~162 seconds
- Initial five-worker phase runtime: ~39 seconds
- Initial five-worker result: 24/25 completed, 1 transient HTTP 502, workflow failed closed

## Target metrics

1. 25/25 priority URLs inspected.
2. 0 final URL Inspection API errors after bounded retries.
3. URL Inspection phase runtime materially below the 162-second serial baseline; target <= 90 seconds, with >=50% reduction preferred on no-retry runs.
4. Result ordering remains identical to priority URL ordering.
5. Encrypted private evidence generation and safe public snapshot persistence remain successful.
6. Any transient retry is visible in logs without exposing private query data.

## Expected direction

- Evidence latency: decrease materially.
- Workflow timeout risk: decrease.
- Transient backend-error resilience: increase.
- Search/content state: unchanged.
- Final API error rate: return to zero.

## Review window

- **Immediate validation:** first Search Console health run triggered by the repair merge.
- **Next-day reliability check:** 2026-09-02.
- **Preferred combined observability decision:** 2026-09-03, alongside the existing scheduled-delivery reliability review.

## Risks

Retries can increase runtime when Google is degraded, but the workflow remains bounded and fail-closed after three attempts. Concurrency is capped at three, far below Google's documented 600 requests/minute per-site quota. No ranking/content experiment is exposed to this change.
