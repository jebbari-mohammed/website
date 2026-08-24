# SEO Experiment: Workout Reminder Material Refresh

- **Status:** active
- **Launch date:** 2026-08-24
- **Action class:** material content + title/snippet intent alignment
- **Target URL:** https://youraicoach.life/blog/workout-reminder-app-that-calls-you
- **Source commit:** `881dbbeeaf0cf9ec5567fbcf8df0bd255c11af71`
- **Owner:** IZEM SEO

## First-party baseline

The freshest verified Search Console report available before the refresh covers 2026-07-27 through 2026-08-23 and contains 54 private query + landing-page rows, 79 impressions, and 0 clicks across the site.

The target URL had:

- **5 impressions**;
- **0 clicks**;
- **0.00% CTR**;
- **30.80 impression-weighted average position**;
- Google URL Inspection state **PASS / Submitted and indexed**;
- last recorded Google crawl **2026-08-15T21:25:20Z**.

The authenticated private rows show that Google is testing the page for reminder-related and call-related intent. Exact queries and query-to-page pairs remain private and are not copied into this repository.

## Change already launched

The August 24 refresh changed multiple variables on the same URL:

- title and meta description;
- Open Graph and Twitter metadata;
- BlogPosting headline/description and `dateModified`;
- H1 and lead copy;
- visible decision guidance about alarm vs push vs call vs human support;
- FAQ coverage and corresponding visible answers;
- surrounding discovery text in the blog index and call-focused landing page.

The current title is:

`Workout Reminder App That Calls You Before the Gym | IZEM`

The page remains on the same URL and canonical, remains indexable, and continues to serve the same core reminder/call intent rather than creating a competing URL.

## Live SERP context

Current reminder-intent results are utility-heavy. App-store and product pages commonly emphasize exercise alarms, workout reminders, schedules, notifications, streaks, timers, location triggers, and persistent reminders. The dominant user task is practical: get a cue at the moment a workout is likely to be skipped.

The useful differentiation for IZEM is therefore not “more notifications.” It is the decision support inside a proactive call: full workout, smaller fallback, or explicit reschedule, followed by later review.

## Hypothesis

A page that leads with the plain-language pre-gym reminder task and clearly explains when a phone call is more useful than an alarm or push notification will improve reminder-intent alignment and move more impressions into stronger ranking bands while preserving the call-based product distinction.

## Target metrics

1. The URL remains indexed and self-canonical.
2. Google recrawls the August 24 source version.
3. Reminder-cluster impressions increase from the 5-impression baseline.
4. Weighted average position improves from 30.80 or more private rows enter the top 20.
5. The page earns its first organic click without losing call-based intent coverage.
6. Google does not consistently rewrite the title into a materially different framing after recrawl.

## Expected direction

- Crawl freshness: current source replaces the August 15 crawl snapshot.
- Reminder-intent impressions: increase.
- Average position: improve.
- CTR: establish a non-zero baseline when impression volume is sufficient.
- Cannibalization: unchanged; no new URL was created.

## Review window

- **Earliest technical recrawl check:** 2026-08-28.
- **Earliest material rewrite review:** 2026-09-14 (21 days).
- **Preferred first content decision:** 2026-09-21.
- Do not change the target file before 2026-09-14 unless correcting a documented factual, legal, safety, rendering, indexing, canonical, or deployment defect.

## Experiment-control lesson

This refresh invalidated the metadata-only experiment launched one day earlier. To prevent the same failure mode, the target is now registered in `config/seo-active-experiments.json`, and the repository has a deterministic workflow that fails changes touching locked target files inside their evaluation window.

The purpose of the lock is attribution, not bureaucracy: a test that changes again before Google processes it cannot teach us what worked.

## Risks

- Five impressions remain a small baseline, so short-term CTR conclusions would be weak.
- Google may rewrite the supplied title.
- Broader reminder phrasing can attract users who only want a simple alarm; visible copy must keep qualifying when a call is actually useful.
- Because the August 24 refresh changed several variables at once, future movement can be attributed only to the material-refresh package, not to any one copy element in isolation.
