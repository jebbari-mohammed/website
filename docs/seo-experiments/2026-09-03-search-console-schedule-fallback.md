# Search Console schedule fallback — 2026-09-03

## Decision
Add a second independent scheduled trigger to the Search Console health workflow at 07:37 UTC while preserving the existing 05:37 UTC primary schedule. Keep the existing `concurrency` group with `cancel-in-progress: true` so overlapping executions do not run in parallel.

## Evidence
- At the September 3 SEO decision window there were zero GitHub Actions runs created on 2026-09-03.
- The latest public-safe Search Console snapshot was still the September 2 run, covering 2026-08-05 through 2026-09-01.
- This follows repeated prior mornings where the scheduled Search Console workflow was delayed beyond the SEO decision window and required manual recovery.
- The current workflow already documents that GitHub scheduled workflows can be delayed under load.

## Hypothesis
Two independent morning schedule opportunities will materially increase the probability that fresh first-party Search Console evidence exists before the daily SEO decision window, without changing public SEO content or the evidence/inspection logic.

## Baseline
- Primary schedule only: `37 5 * * *`.
- September 3 decision window: no same-day Actions run available.
- Latest safe snapshot: 89 private query+landing-page rows, 153 impressions, 1 click, 0.65% CTR, 17 landing pages, weighted average position 52.94, 25/25 priority URLs inspected, 0 URL Inspection API errors.

## Target metrics
- At least one successful Search Console health run available before the daily SEO decision window on >= 6 of the next 7 days.
- Zero final URL Inspection API errors.
- No plaintext query leakage.
- No overlap-related duplicate execution failures.
- No public SEO/content mutation caused by this reliability change.

## Expected direction
Higher same-day evidence availability and fewer manual recovery runs; unchanged rankings/content because this is observability-only.

## Earliest review date
2026-09-10, after seven daily opportunities.

## Risks
- When both schedules execute normally, the workflow may run twice in one morning. This adds modest CI/API usage but does not change site content. The existing concurrency group prevents overlapping executions.
- If GitHub experiences a broader scheduler outage, both schedules can still be delayed or dropped; this experiment reduces single-slot fragility rather than guaranteeing delivery.

## Follow-up rule
If same-day evidence availability remains unreliable after the seven-day window, prefer a true freshness-gated recovery architecture rather than adding more cron slots.
