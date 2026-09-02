# 2026-09-02 Search Console evidence recovery

## Decision

No public SEO/content change. The scheduled Search Console health run had not started by the senior SEO decision window, so the last known-good Search Console health job was rerun to recover fresh first-party evidence without changing production pages.

## Evidence baseline

Fresh rerun reporting period: 2026-08-05 through 2026-09-01.

- Private query + landing-page rows: 85
- Distinct landing pages: 17
- Clicks: 1
- Impressions: 138
- Aggregate CTR: 0.72%
- Impression-weighted average position: 55.10
- Priority URLs inspected: 25
- Indexed: 23
- Not indexed: 0
- Unknown: 2
- URL Inspection API errors: 0

Leading public landing-page signals at decision time:

- `/blog/best-app-to-track-progressive-overload-automatically`: 29 impressions, average position 70.93
- `/blog/best-accountability-app-for-gym`: 20 impressions, average position 62.95
- `/blog/best-workout-app-with-meal-planning-included`: 18 impressions, average position 34.44
- `/blog/workout-reminder-app-that-calls-you`: 12 impressions, average position 18.50
- `/features/ai-workout-generator`: 9 impressions, 1 click, 11.11% CTR, average position 24.33

The strongest ranking candidates are still inside active experiment windows, so changing them now would reduce attribution quality. The AI personal-trainer rehabilitation remains technically indexable and internally linked from multiple site pages, but Google still reports the older July 8 noindex crawl; that state remains an awaiting-recrawl observation rather than evidence of a current production noindex defect.

## Hypothesis

When scheduled Search Console delivery is absent at the daily decision window, rerunning the last known-good health job can restore same-day evidence quality without manufacturing a public SEO change or contaminating active experiments.

## Target metric

- Fresh Search Console report endpoint advances to the newest available day.
- 25/25 priority URL inspections complete.
- Final URL Inspection API errors remain at 0.
- No public SEO files are changed solely to obtain evidence.
- Existing experiment locks remain intact.

## Expected direction

Decision confidence improves while ranking-experiment noise and unnecessary URL churn remain flat.

## Earliest review

2026-09-03. Reassess scheduled-delivery reliability and only change the observability architecture if missing/delayed scheduled runs continue beyond the existing evaluation window.

## Risks / blockers

GitHub scheduled workflows can arrive after the senior SEO decision window. A rerun is a recovery mechanism, not proof that the scheduler itself is healthy. Ranking data remains sparse, so low-impression first-page signals should not be overinterpreted.
