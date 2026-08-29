# SEO Experiment: Search Console Rerun Recovery

- **Status:** completed successfully; reliability observation remains open
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

The fresh Search Analytics aggregate remains **114 impressions, 1 click, 0.88% CTR, 17 landing pages, and weighted average position 59.63**. The page-level aggregate is materially unchanged from the prior snapshot, so the evidence does not justify overriding any active content experiment lock.

## Recovery result

The re-run completed successfully end to end:

- Search Console ownership/API access: verified;
- private evidence gate: 76 query + page rows available;
- priority URLs inspected: 25;
- indexed: 24;
- explicitly not indexed: 0;
- unknown/neutral: 1;
- URL Inspection API errors: 0;
- public-safe issue #34 refreshed to the August 1–28 reporting period;
- exact queries remained private.

The rerun also surfaced a useful crawl-state change that the stale morning snapshot could not show: Google crawled `/blog/best-app-to-track-progressive-overload-automatically` on **2026-08-29T01:32:52Z**, so the August 16 rehabilitation is now in Google's crawl state. The page remains protected through September 6, and the newly crawled version should accumulate Search Analytics evidence before another material edit.

Four monitored pages still await Google recrawl after source changes: the gym-machines-vs-free-weights article, the AI personal-trainer rehabilitation, the fallback-workout rehabilitation, and the beginner AI-workout-generator article. Awaiting recrawl is an observation state, not an indexing failure.

## Opportunity shortlist

1. **9.8/10 — recover same-day GSC evidence with a deterministic workflow re-run — chosen.** Highest confidence, no cannibalization, no public crawl churn, immediate feedback, and foundational to every later ranking decision.
2. **8.9/10 — optimize `/blog/workout-reminder-app-that-calls-you`.** Strongest near-ranking candidate at 11 impressions and average position 20, but it is intentionally locked through September 14 after its August 24 material refresh.
3. **8.7/10 — optimize `/blog/best-workout-app-with-meal-planning-included`.** 14 impressions at average position 32.86, but its rehabilitation is protected through September 7.
4. **8.6/10 — evaluate the newly recrawled progressive-overload comparison.** It leads the site at 27 impressions and is now crawl-current, but the fresh crawl happened only today and the page is protected through September 6. The correct next step is measurement, not an immediate rewrite.
5. **7.4/10 — expand the comparison hub after an early Fitbod first-page impression.** Interesting but based on one impression; the existing comparison hub already has clear methodology, category organization, internal links, and a product CTA.

## Hypothesis

When GitHub's scheduled event is delayed or missing before the SEO decision window, re-running the last known-good Search Console job can safely restore same-day first-party evidence without manufacturing a repository mutation or weakening experiment discipline.

## Target metrics and outcome

1. **Fresh encrypted artifact on recovery date — achieved.**
2. **Reporting endpoint advances to newest available day — achieved, August 28.**
3. **Private query + page evidence remains protected — achieved.**
4. **URL Inspection completes with zero API errors — achieved.**
5. **No public SEO mutation solely to refresh evidence — achieved.**
6. **No active experiment lock overridden — achieved.**

## Expected direction

- Same-day evidence availability: increased for this run.
- Search Console decision confidence: increased.
- Public crawl/content churn caused by observability: remained zero.
- Exact-query leakage: remained zero.
- Experiment contamination: avoided.

## Review window

- **Next scheduled-run review:** 2026-08-30.
- **Reliability review:** after several additional scheduled runs, rather than reacting to one delayed event.
- **Progressive-overload earliest material-edit date:** 2026-09-06; evaluate post-recrawl Search Analytics before changing it.

If scheduled runs repeatedly fail to arrive before the daily decision window, evaluate a more durable evidence-delivery architecture. Do not keep making small cron adjustments without evidence that a different minute materially improves GitHub's scheduling reliability.

## Risks and controls

- Re-running a workflow is an operational fallback, not proof that scheduled Actions are reliable.
- Search Console itself has reporting latency; a successful re-run cannot force Google to finalize newer data.
- Re-running URL Inspection consumes normal API quota, so it should be used only when fresh evidence materially improves a decision.
- The fallback must continue to use the existing encrypted artifact path and public-safe issue rather than exposing exact queries in logs or repository files.
