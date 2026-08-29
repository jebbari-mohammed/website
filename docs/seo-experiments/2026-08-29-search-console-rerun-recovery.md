# SEO Experiment: Search Console Rerun Recovery

- **Status:** launched
- **Launch date:** 2026-08-29
- **Action class:** first-party evidence reliability / SEO observability
- **Owner:** ChatGPT senior SEO lead

## First-party baseline

At the start of the August 29 SEO decision cycle, no new scheduled Search Console workflow run existed for August 29. The workflow is configured for `37 5 * * *` UTC specifically to leave a morning buffer, but the most recent scheduled run was created on August 28 at 17:40 UTC, far later than its nominal schedule. The latest public-safe snapshot therefore still ended on August 27.

The latest completed evidence before recovery covered 2026-07-31 through 2026-08-27:

- 76 private query + landing-page rows;
- 114 impressions;
- 1 click;
- 17 landing pages;
- 24 of 25 monitored URLs indexed;
- 0 URL Inspection API errors.

No repository commit had landed on August 29 when the decision cycle started, so there was no same-day content experiment to evaluate or preserve beyond the existing active locks.

## Decision

Do not mutate public SEO content merely to trigger Search Console. Do not make another cron-time adjustment after one observation. Instead, re-run the last known-good Search Console `verify` job directly so the same deterministic workflow can retrieve a fresh report, create a fresh encrypted artifact, run URL Inspection, and refresh the public-safe snapshot without changing production code or content.

The recovery used workflow run `33206698794` and re-ran its successful `verify` job. The new attempt created a fresh encrypted artifact:

- artifact name: `private-gsc-evidence-v1`;
- artifact ID: `9712077607`;
- created: 2026-08-29T08:35:35Z;
- SHA-256 digest: `b43b5db04c2109b8c4e86d7508f806675952abac7d3ad635421cbbfbe796af3a`.

Private authenticated decryption verified:

- reporting period: **2026-08-01 through 2026-08-28**;
- dimensions: `query` + `page`;
- exact rows: **76**;
- exact queries remained inside the private evidence boundary.

The page-level aggregate is materially unchanged from the prior snapshot, so the fresh evidence does not justify overriding any active content experiment lock.

## Opportunity shortlist

1. **9.8/10 — recover same-day GSC evidence with a deterministic workflow re-run — chosen.** Highest confidence, no cannibalization, no public crawl churn, immediate feedback, and foundational to every later ranking decision.
2. **8.9/10 — optimize `/blog/workout-reminder-app-that-calls-you`.** Strongest near-ranking unlocked-on-evidence candidate at 11 impressions and average position 20, but it is intentionally locked through September 14 after its August 24 material refresh.
3. **8.7/10 — optimize `/blog/best-workout-app-with-meal-planning-included`.** 14 impressions at average position 32.86, but its rehabilitation is protected through September 7.
4. **8.5/10 — refine `/blog/best-app-to-track-progressive-overload-automatically`.** Highest current impressions at 27, but the August 16 version still awaits recrawl and is protected through September 6.
5. **7.4/10 — expand the comparison hub after an early Fitbod first-page impression.** Interesting but based on one impression; the existing comparison hub already has clear methodology, category organization, internal links, and a product CTA.

## Hypothesis

When GitHub's scheduled event is delayed or missing before the SEO decision window, re-running the last known-good Search Console job can safely restore same-day first-party evidence without manufacturing a repository mutation or weakening experiment discipline.

## Target metrics

1. A fresh encrypted artifact exists on the recovery date.
2. The decrypted report advances the reporting endpoint to the newest available day.
3. Private query + page evidence remains encrypted outside the authorized private working context.
4. URL Inspection completes with zero API errors.
5. No public page, title, H1, schema, canonical, robots directive, sitemap URL, or internal link is changed solely to refresh evidence.
6. No active SEO experiment lock is overridden because of stale morning evidence.

## Expected direction

- Same-day evidence availability: increase.
- Search Console decision confidence: increase.
- Public crawl/content churn caused by observability: remain zero.
- Exact-query leakage: remain zero.
- Experiment contamination: decrease.

## Review window

- **Immediate:** confirm the re-run completes URL Inspection and updates the public-safe snapshot.
- **Next scheduled-run review:** 2026-08-30.
- **Reliability review:** after several additional scheduled runs, rather than reacting to one delayed event.

If scheduled runs repeatedly fail to arrive before the daily decision window, evaluate a more durable evidence-delivery architecture. Do not keep making small cron adjustments without evidence that a different minute materially improves GitHub's scheduling reliability.

## Risks and controls

- Re-running a workflow is an operational fallback, not proof that scheduled Actions are reliable.
- Search Console itself has reporting latency; a successful re-run cannot force Google to finalize newer data.
- Re-running URL Inspection consumes normal API quota, so it should be used only when fresh evidence materially improves a decision.
- The fallback must continue to use the existing encrypted artifact path and public-safe issue rather than exposing exact queries in logs or repository files.
