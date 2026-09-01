# SEO Experiment: Daily Fitness Check-In Launch Observability

- **Status:** implementation
- **Launch date:** 2026-09-01
- **Action class:** indexation observability and production SEO guard
- **Target URL:** `/blog/daily-fitness-check-in-app`
- **Content experiment:** `daily-fitness-check-in-app-launch-2026-09-01`
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

The latest verified Search Console run available today covers 2026-08-04 through 2026-08-31:

- 85 private query + landing-page rows;
- 136 impressions;
- 1 click;
- 0.74% aggregate CTR;
- 17 distinct landing pages;
- impression-weighted average position 55.63;
- 24 of 25 inspected URLs indexed;
- 0 URL Inspection API errors.

The new daily fitness check-in page was published after that Search Analytics window was retrieved, so it has no Search Analytics baseline yet.

A material content launch already occurred today. The new page is indexable, self-canonical in source, sitemap-listed, included in the blog/feed discovery graph, internally linked from related accountability content, and protected from material edits through 2026-09-22. Another content change today would contaminate the launch experiment.

## SERP / intent review

Current results around daily fitness check-ins split into several jobs:

1. logging a completed workout and maintaining a streak;
2. short daily coaching or accountability check-ins;
3. reminder systems that prompt the user to act;
4. unrelated facility/client check-in software.

The launched IZEM page targets the coaching/accountability interpretation with a distinct `Call → Answer → Adjust` mechanism. It should therefore be measured before its title, copy, or internal-link package is changed again.

## Chosen action

Add the target URL to the fixed Search Console URL Inspection set and the live SEO compliance protected-asset set.

To preserve one adaptive Search Analytics-driven inspection slot under the 25-URL cap, remove `/blog/workout-accountability-agreement-template` from the fixed set. That page is currently crawl-current and has no landing-page impressions in the latest public-safe GSC aggregate; it remains eligible for adaptive inspection if it starts earning visibility.

The live guard now requires the new page to remain:

- HTTP 200;
- indexable;
- self-canonical;
- free of legacy quarantine markers;
- included in the XML sitemap.

## Hypothesis

Direct URL Inspection plus live production guards will distinguish normal launch discovery/crawl latency from a genuine indexability, canonical, deployment, or sitemap defect without modifying the content experiment.

## Baseline

- Target Search Analytics rows/impressions/clicks: none yet; published after the latest reporting evidence was retrieved.
- Target source date: 2026-09-01.
- Site-wide Search Analytics: 136 impressions / 1 click / 0.74% CTR.
- Site-wide priority inspection: 24/25 indexed, 0 final API errors.
- Content package: locked through 2026-09-22.

## Target metrics

1. Direct URL Inspection returns with zero API errors.
2. Google discovers/crawls the canonical target URL.
3. The live production guard remains fully green.
4. Relevant Search Analytics impressions appear without an obvious decline on the distinct weekly check-in template or primary accountability pages.
5. No unapproved material edits occur before the content lock expires.

## Expected direction

- Index-state certainty: increase.
- Time to detect deployment/indexing regressions: decrease.
- Content experiment contamination: unchanged at zero.
- Adaptive inspection capacity: preserved at one slot.

## Review window

- **First technical review:** next successful Search Console health run.
- **Earliest useful Search Analytics review:** 2026-09-15 if impressions exist.
- **Material content lock ends:** 2026-09-22.
- **Preferred first content decision:** 2026-09-29.

## Risks / limitations

- Same-day `URL unknown to Google` would be normal discovery latency, not proof of a defect.
- The fixed URL budget is capped at 25, so one low-signal crawl-current template is released back to adaptive monitoring.
- The adjacent weekly check-in template targets a different weekly review/template job, but cannibalization should still be watched once the daily page begins receiving impressions.
- Today's NotebookLM/YouTube video workflow failed during external video generation. That is a separate media-production reliability issue and is intentionally not mixed into this index-observability change.
