# 2026-09-02 Workout Accountability Call Script Observability

## Decision

Protect and directly measure today's new `/blog/workout-accountability-call-script` launch without changing its public content.

The automated editorial engine already shipped a material content experiment today and locked that page through 2026-09-23. This follow-up is deliberately technical and non-overlapping.

## First-party baseline

Fresh scheduled Search Console health run `33616439970` completed successfully on 2026-09-02 using the 2026-08-05 through 2026-09-01 reporting window.

- Private query + landing-page rows: 85
- Distinct landing pages: 17
- Clicks: 1
- Impressions: 138
- Aggregate CTR: 0.72%
- Impression-weighted average position: 55.10
- Priority URL inspections: 25/25 completed
- Indexed: 23
- Explicitly not indexed: 0
- Neutral/unknown: 2
- URL Inspection API errors: 0

The new call-script URL did not exist at the time of that scheduled Search Console run, so it had no direct Google crawl/index baseline yet.

## Overlap and destructive-risk review

The new page targets a narrow script/template job: what a workout-accountability call should actually say. Existing nearby URLs serve different primary jobs:

- `/fitness-app-that-calls-you/`: call-based product/mechanism discovery.
- `/blog/workout-reminder-app-that-calls-you`: reminder-app comparison and evaluation.
- `/blog/daily-fitness-check-in-app`: daily check-in framework and app-selection intent.
- `/blog/best-accountability-app-for-gym`: broader accountability-app comparison.
- `/blog/workout-accountability-checklist`: checklist/process utility.

The launch commit already added contextual discovery links and a 21-day content lock. No merge, redirect, title rewrite, canonical change, or additional public content edit is warranted today.

## Opportunity shortlist

1. **9.7/10 — direct index observability + production guard for today's call-script launch (chosen).** High confidence, immediate technical feedback, zero content contamination, strong business/cluster relevance, low destructive risk.
2. **9.1/10 — improve `/blog/workout-reminder-app-that-calls-you`.** Strongest near-ranking non-branded page; the post-change snapshot reached 13 impressions and average position 17.69, but its current experiment remains locked through 2026-09-14.
3. **8.9/10 — improve `/blog/best-workout-app-with-meal-planning-included`.** The post-change snapshot reached 20 impressions and average position 32.90, but its current experiment remains locked through 2026-09-07.
4. **8.7/10 — improve `/blog/best-app-to-track-progressive-overload-automatically`.** The post-change snapshot reached 30 impressions, but the current rehabilitation remains protected through 2026-09-06.
5. **8.4/10 — expand the interactive AI workout-generator experience.** The feature page owns the site's only verified click and reached 12 impressions at average position 20.50; the evidence is improving but remains a small sample for a larger product build today.

## Implementation

- Add `/blog/workout-accountability-call-script` to the fixed Search Console URL Inspection priorities.
- Release `/blog/weekly-fitness-check-in-template` from the fixed priority set. It is crawl-current and has zero current landing-page impressions; adaptive GSC prioritization can re-add it automatically if visibility develops.
- Preserve 24 fixed priorities under the 25-URL cap so one adaptive GSC-visible landing-page slot remains available.
- Add the call-script URL to `RELEASED_INDEXABLE_ASSETS` in the live SEO compliance checker.
- Add the page path to the live compliance workflow trigger so future edits automatically verify HTTP 200, indexability, self-canonical, quarantine clearance, and sitemap inclusion.

## Post-launch measurement

After merge, Search Console health run `33675177383` completed successfully on the merged configuration.

- Private query + landing-page rows: 89
- Distinct landing pages: 17
- Clicks: 1
- Impressions: 153
- Aggregate CTR: 0.65%
- Impression-weighted average position: 52.94
- Priority URL inspections: 25/25 completed
- Indexed: 22
- Explicitly not indexed: 0
- Neutral/unknown: 3
- URL Inspection API errors: 0
- Encrypted exact-query artifact ID: `9864061061`

Direct Google URL Inspection baseline for the new page:

- Verdict: `NEUTRAL`
- Coverage: `URL is unknown to Google`
- Last crawl: none
- Source modified: 2026-09-02
- Interpretation: same-day discovery pending; not evidence of a live indexability defect.

Live SEO compliance run `33675177544` passed 43/43 checks on its first attempt. The new page is live with HTTP 200, indexable directives, its expected self-canonical, no legacy quarantine marker, and sitemap inclusion.

## Hypothesis and metrics

**Hypothesis:** fixed URL Inspection plus live production guards will distinguish normal post-launch Google discovery latency from a genuine indexability/canonical/deployment problem without contaminating the content experiment.

**Baseline:** Google currently reports the new URL as unknown with no crawl recorded, while all live technical checks pass. Site-wide post-change Search Console baseline is 153 impressions, 1 click, 0.65% CTR, and weighted average position 52.94.

**Immediate target metrics:**

- call-script page live compliance continues to pass;
- 25/25 priority URL inspections complete with zero API errors;
- Google discovers and crawls the 2026-09-02 source;
- no canonical, robots, sitemap, or deployment regression.

**Ranking target after discovery:** relevant script/template impressions appear without obvious cannibalization of the reminder, daily-check-in, call hub, or broad accountability pages.

**Expected direction:** discovery/crawl status moves from `URL is unknown to Google` toward a successful Google crawl and indexed verdict; later Search Analytics impressions increase from zero.

## Review window

- Earliest technical/indexing review: next successful Search Console health run after 2026-09-02.
- Earliest useful Search Analytics review: 2026-09-16 if impressions exist.
- Material content lock ends: 2026-09-23.
- Preferred first content decision: 2026-09-30.

## Risk control

The fixed inspection budget is capped at 25 URLs. This change reallocates one crawl-current, zero-current-impression fixed slot rather than eliminating adaptive monitoring. No public page content or metadata is changed by this observability experiment.
