# SEO Experiment: Beginner Workout Generator Live Guard

- **Status:** launched
- **Launch date:** 2026-08-17
- **Target URL:** https://youraicoach.life/blog/ai-workout-generator-beginners
- **Action class:** production SEO observability / regression prevention
- **Owner:** ChatGPT senior SEO lead

## First-party baseline

The 2026-08-17 Search Console health run returned 27 query + landing-page rows, 37 impressions, and 0 clicks for 2026-07-20 through 2026-08-16. URL Inspection reported 5 of 11 monitored URLs indexed, 6 neutral/unknown, and 0 API errors.

Two material content rehabilitations were already merged on 2026-08-17: the workout + meal-planning guide and the beginner AI workout generator guide. The latter was deployed successfully but was not included in the released-page live SEO compliance guard, so a future accidental noindex, canonical drift, re-quarantine, or sitemap removal could pass without a page-specific alert.

## Problem

`/blog/ai-workout-generator-beginners` was rehabilitated on 2026-08-17 and is intended to remain a released, indexable search asset. The live compliance checker protected three earlier rehabilitations, but not this one. The compliance workflow also did not trigger when this page changed.

## Change

- Add `/blog/ai-workout-generator-beginners` to the `RELEASED_REHABILITATIONS` invariant set.
- Trigger the live SEO compliance workflow whenever the beginner page changes.
- Require the live page to remain HTTP 200, indexable, self-canonical, free of legacy quarantine markers, and present in the normal sitemap.

No page content, title, description, canonical, robots directive, schema, or sitemap entry is changed by this experiment.

## Hypothesis

Protecting every rehabilitated search asset with the same live invariant guard will catch accidental SEO regressions before they silently erase the value of the rehabilitation work.

## Baseline

- Released rehabilitations protected by live compliance: **3**.
- Newly rehabilitated beginner URL protected: **no**.
- Page-change trigger present for beginner URL: **no**.
- Current intended page state: HTTP 200, indexable, self-canonical, no quarantine marker, in sitemap.

## Target metrics

1. Released rehabilitations protected: **4/4**.
2. A push touching the beginner page triggers live SEO compliance.
3. The first post-merge live compliance run passes all checks including the beginner URL.
4. False-negative risk for accidental noindex/canonical/quarantine/sitemap regressions on this URL drops from unguarded to guarded.

## Expected direction

- Regression observability: increase.
- Content churn: none.
- Cannibalization risk: none.
- Time to feedback: immediate after merge/deployment.

## Review window

- **Immediate:** first live SEO compliance run after merge.
- **Next scheduled confirmation:** next weekly live compliance run.
- No further change is needed unless the intended indexing/canonical state changes or the guard produces a reproducible false positive.

## Risks

- Live deployment propagation can briefly expose an older cached version; the compliance script already retries before failing.
- This guard verifies release invariants, not ranking performance. Search Console ranking/indexing evaluation remains separate.
