# Daily-review refresh observability — 2026-09-06

## Decision

Do not make a second material ranking/content change on 2026-09-06. The automated editorial system already rejuvenated `/blog/fitness-app-that-reviews-your-day` and locked that content experiment through 2026-09-27. Instead, add direct technical observability for the refreshed URL.

## First-party baseline

Fresh Search Console window: 2026-08-09 through 2026-09-05.

- 96 private query + landing-page rows
- 18 distinct landing pages
- 186 impressions
- 1 click
- 0.54% aggregate CTR
- 46.92 impression-weighted average position
- 25/25 priority URLs inspected
- 22 indexed, 0 explicit failures, 3 neutral/unknown, 0 API errors

The refreshed daily-review URL is absent from the current public landing-page aggregate, while its active experiment record says the rejuvenation was selected from decaying historical visibility (-19 impressions, -3 clicks). That makes recrawl/discovery measurement more valuable than another rewrite today.

## Change

- Add `/blog/fitness-app-that-reviews-your-day` to fixed Search Console URL Inspection priorities.
- Release `/blog/workout-accountability-checklist` from the fixed list because it is crawl-current and has no visibility in the current 18-page Search Analytics aggregate. It remains eligible for the adaptive GSC-visible slot if visibility returns.
- Preserve 24 fixed priorities so one of the 25 Inspection slots remains adaptive.
- Add the refreshed daily-review URL to the live indexable-asset compliance guard and its path trigger.
- Do not alter the refreshed page, metadata, schema, canonical, sitemap, or internal links.

## Hypothesis

Direct URL Inspection plus live indexability/canonical/sitemap checks will distinguish normal post-refresh recrawl latency from a real technical problem without contaminating the content experiment.

## Metrics

Baseline:
- refreshed URL source modified: 2026-09-06
- current Search Analytics aggregate: no visible landing-page row for the URL
- direct URL Inspection baseline: not yet captured by the fixed monitor
- sitewide Inspection errors: 0

Targets:
- obtain a direct Google crawl/index status for the refreshed URL on the next successful Search Console health run;
- maintain 0 URL Inspection API errors;
- keep the page HTTP 200, indexable, self-canonical, quarantine-free, and sitemap-listed;
- preserve one adaptive Inspection slot;
- no ranking-page mutation during the active experiment window.

Expected direction: Google recrawls the 2026-09-06 source and the page returns to relevant Search Analytics visibility without needing another material edit.

## Review window

- Technical status: next successful Search Console health run.
- Earliest useful ranking read: 2026-09-20.
- Content lock ends: 2026-09-27.
- Preferred content decision: 2026-10-04.

## Risk

The fixed 25-URL Inspection budget is scarce. Releasing the crawl-current, currently zero-visibility accountability checklist minimizes the opportunity cost while retaining dynamic re-entry if Search Console visibility returns.
