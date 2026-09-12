# Search Console earlier-schedule observation — 2026-09-12

## Decision
Keep the 00:37 / 02:37 UTC Search Console schedule unchanged and make no public ranking/content change today. This is day 2 of the seven-day replacement-schedule evaluation started on 2026-09-11.

## First-party evidence
- Scheduled run `34674385275` was created at 04:58:33 UTC and completed successfully at 05:00:06 UTC.
- Scheduled run `34680417360` was created at 07:19:14 UTC and completed successfully at 07:20:37 UTC.
- Both runs arrived before today's SEO decision window despite substantial GitHub scheduler latency relative to their 00:37 / 02:37 UTC nominal slots.
- The latest run recovered Search Console data for 2026-08-15 through 2026-09-11: 101 private query+landing-page rows, 23 landing pages, 215 impressions, 1 click, 0.47% CTR, and impression-weighted average position 32.80.
- URL Inspection completed 25/25 priority URLs with 22 indexed, 0 explicitly not indexed, 3 neutral/unknown, and 0 final API errors.
- Exact query strings remained encrypted and were not printed. Artifact `10293632095` was uploaded successfully.

## Landing-page signals
- `/features/ai-workout-generator`: 38 impressions, 1 click, 2.63% CTR, average position 13.13. The current version remains protected through 2026-09-16 and should not be rewritten while this near-page-one signal is still maturing.
- `/blog/workout-reminder-app-that-calls-you`: 15 impressions, 0 clicks, average position 16.13. Google recrawled it on 2026-09-12 at 01:28:52Z, so the page now has a current crawl state; preserve the active refresh through 2026-09-14.
- `/blog/best-workout-app-with-meal-planning-included`: 26 impressions, 0 clicks, average position 26.42. Preferred experiment review remains 2026-09-16.
- `/features/ai-meal-planner`: 1 impression at average position 153.00. A material feature-page refresh landed on 2026-09-11 and is locked through 2026-10-02; this one-impression baseline is far too early for another change.
- `/blog/workout-accountability-call-script` and `/blog/daily-fitness-check-in-app` remain discovered but not yet indexed. Both already have sitemap inclusion and contextual internal links, so another indexing intervention is not justified today.

## Opportunity decision
The highest expected-value growth opportunity remains `/features/ai-workout-generator`, but its improving version is still inside a clean measurement window. A second material content change would reduce attribution quality more than it would increase expected traffic today. The correct action is observation plus experiment integrity.

## Replacement-schedule hypothesis
Moving the same two daily Search Console opportunities earlier should deliver fresh successful evidence before the daily SEO decision window on at least 6 of 7 days, without increasing schedule frequency or changing SEO evidence semantics.

## Current result
- Day 1 (2026-09-11): success before decision window.
- Day 2 (2026-09-12): success before decision window.
- Running result: 2/2 successful observed days.
- Final URL Inspection API errors: 0.
- Plaintext-query leakage: none observed.
- Overlap-related duplicate execution failures: none observed.

## Expected direction and review
- Expected direction: higher same-day first-party evidence availability; no ranking/content effect from the scheduling intervention itself.
- Earliest formal review: 2026-09-17 after seven daily opportunities.
- Do not alter the schedule before that review unless a separate deterministic failure appears.

## Public SEO change today
None. No title, H1, body copy, canonical, structured data, robots directive, sitemap URL, redirect, or internal link was changed by this observation.