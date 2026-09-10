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

## First observation — 2026-09-03
- A scheduled Search Console health run (`33742242526`) was eventually created at 10:03:31 UTC and completed successfully at 10:04:59 UTC on the unchanged fallback-schedule production SHA.
- This first observation did **not** satisfy the decision-window objective: the run arrived 4h26m after the 05:37 UTC primary slot and 2h26m after the 07:37 UTC fallback slot.
- The run recovered fresh evidence for 2026-08-06 through 2026-09-02: 89 private query+landing-page rows, 153 impressions, 1 click, 0.65% CTR, 17 landing pages, and weighted average position 52.94.
- URL Inspection completed 25/25 with 22 indexed, 0 explicitly not indexed, 3 neutral/unknown, and 0 final API errors.
- There was no overlap-related failure, no plaintext-query leakage, and no public SEO/content mutation.
- Treat this as one data point only. Do not move the cron slots again before the planned seven-day review unless a separate deterministic failure is discovered.

## Second observation — 2026-09-04
- At the September 4 SEO decision window (08:07 UTC), GitHub reported zero Actions workflow runs created on 2026-09-04, even though both the 05:37 UTC primary slot and 07:37 UTC fallback slot had passed.
- Therefore day two also did **not** satisfy the decision-window objective. No deterministic workflow failure is visible yet because neither scheduled run had been created by the decision window.
- The freshest verified Search Console evidence remains the successful September 3 run covering 2026-08-06 through 2026-09-02: 89 private query+landing-page rows, 153 impressions, 1 click, 0.65% CTR, 17 landing pages, weighted average position 52.94, with 25/25 priority URLs inspected and 0 final API errors.
- Per the experiment rule, do not move the cron slots or add a third schedule before the planned seven-day review unless a separate deterministic failure is discovered. Today’s SEO decision should therefore reduce confidence and avoid speculative public ranking changes based on stale evidence.

## Third observation — 2026-09-05
- The scheduled Search Console health run (`33963153658`) was created at 11:22:21 UTC and completed successfully at 11:23:41 UTC.
- The run was healthy end-to-end: private query+page retrieval, encrypted evidence artifact, evidence gate, URL Inspection, safe summary, and safe snapshot persistence all succeeded.
- It still missed the morning decision objective by a wide margin: creation occurred 5h45m after the 05:37 UTC primary slot and 3h45m after the 07:37 UTC fallback slot.
- The recovered 2026-08-08 through 2026-09-04 window contained 92 private query+landing-page rows, 174 impressions, 1 click, 0.57% CTR, 17 landing pages, and weighted average position 48.91.
- URL Inspection completed 25/25 with 22 indexed, 0 explicitly not indexed, 3 neutral/unknown, and 0 final API errors.
- The strongest public landing-page signal was `/features/ai-workout-generator` at 22 impressions, 1 click, 4.55% CTR, and average position 14.82. Its active experiment remains locked through 2026-09-16, so this improving signal is evidence to preserve the current version rather than rewrite it.

## Fourth observation — 2026-09-06
- At the September 6 SEO decision window (approximately 08:45 UTC), GitHub reported zero workflow runs created on 2026-09-06 even though both scheduled slots had passed.
- Day four therefore also fails the before-decision-window target. The freshest verified first-party snapshot remains the successful September 5 run.
- No separate deterministic workflow failure is visible. Preserve the experiment unchanged until the planned September 10 review instead of adding more cron slots mid-test.
- Because same-day Search Console data is unavailable, reduce confidence for ranking/content changes. Favor observation and non-overlapping technical work; do not rewrite active ranking experiments from yesterday’s aggregate data alone.

## Additional observation — 2026-09-08
- The scheduled Search Console health run (`34225113796`) was created at 12:16:00 UTC and completed successfully at 12:17:26 UTC.
- The run was healthy, but creation occurred 6h39m after the 05:37 UTC primary slot and 4h39m after the 07:37 UTC fallback slot, so it did **not** satisfy the morning decision-window objective.
- The recovered 2026-08-11 through 2026-09-07 window contained 101 private query+landing-page rows, 202 impressions, 1 click, 0.50% CTR, 21 landing pages, and weighted average position 42.79.
- URL Inspection completed 25/25 with 22 indexed, 0 explicitly not indexed, 3 neutral/unknown, and 0 final API errors.
- `/features/ai-workout-generator` remained the strongest near-page-one asset at 30 impressions, 1 click, 3.33% CTR, and average position 13.73. Preserve its active experiment rather than changing an improving URL from delayed evidence.

## Decision-window observation — 2026-09-09
- At 08:12 UTC, GitHub reported zero workflow runs created on 2026-09-09 even though both the 05:37 UTC primary slot and 07:37 UTC fallback slot had passed.
- Fresh same-day Search Console evidence is therefore unavailable for today's SEO decision. Use the September 8 successful snapshot only as delayed context, not as justification for a new ranking-page mutation.
- This is another failure of the before-decision-window target. Do not add another cron slot one day before the precommitted review; preserve the experiment through the 2026-09-10 decision date.
- If the formal review confirms the target was missed, prefer a freshness-gated recovery architecture rather than accumulating more scheduled triggers.

## Formal review — 2026-09-10
- At 08:15 UTC, GitHub reported zero workflow runs created on 2026-09-10 even though both configured schedule slots had passed.
- The seven-day experiment therefore failed its primary availability objective by a wide margin. Multiple observed runs were healthy once created, but GitHub created them several hours late; the failure mode is scheduler latency rather than Search Console/API execution.
- The most recent healthy scheduled run (`34351151632`) was created on 2026-09-09 at 12:27:45 UTC, 6h50m after the 05:37 primary slot and 4h50m after the 07:37 fallback slot. It recovered the 2026-08-12 through 2026-09-08 window with 101 private query+landing-page rows, 199 impressions, 1 click, 0.50% CTR, weighted average position 42.12, and 25/25 URL Inspection requests with 0 API errors.
- GitHub's own documentation states that scheduled workflows may be delayed during high load and can be dropped. Because both existing slots use minute 37 already, the remaining controllable variable with the best evidence is lead time rather than adding more schedules.

## Replacement decision — 2026-09-10
- Retire the 05:37/07:37 UTC pair and move the same two-run ceiling to 00:37/02:37 UTC.
- This is not a third trigger and does not increase the maximum scheduled-run count. It preserves the existing `search-console-health` concurrency group with `cancel-in-progress: true`.
- The new primary slot provides about 7h38m of lead time before the observed ~08:15 UTC SEO decision window; the fallback provides about 5h38m.
- Using the worst observed delay in this experiment (~6h50m), the 00:37 primary would still be expected to appear around 07:27 UTC. Using the worst observed delay from the fallback slot (~4h50m), the 02:37 fallback would also land around 07:27 UTC. These are evidence-derived buffers, not guarantees.
- Do not alter Search Console retrieval, encryption, URL Inspection, safe snapshot, or ranking content as part of this timing correction.

## Replacement hypothesis
Moving the existing two scheduled opportunities earlier will materially improve the probability of fresh first-party evidence being available before the SEO decision window without increasing workflow frequency or changing SEO evidence semantics.

## Replacement baseline
- Old schedule: 05:37 and 07:37 UTC.
- Repeated creation delays of roughly 2h26m to 6h50m were observed.
- September 10 decision window: no same-day Search Console run.
- Latest safe snapshot (September 9 run): 101 private query+landing-page rows, 199 impressions, 1 click, 0.50% CTR, 21 landing pages, weighted average position 42.12; 25/25 priority URLs inspected with 0 API errors.

## Replacement target metrics
- Fresh successful Search Console evidence available before the daily SEO decision window on >= 6 of the next 7 days.
- Zero final URL Inspection API errors.
- No plaintext query leakage.
- No overlap-related duplicate execution failures.
- No increase above two configured daily schedule opportunities.
- No public SEO/content mutation caused by the reliability change.

## Replacement expected direction
Higher same-day evidence availability; unchanged rankings/content because the intervention changes timing only.

## Replacement earliest review date
2026-09-17, after seven daily opportunities on the earlier schedule.

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
- If GitHub experiences a broader scheduler outage, both schedules can still be delayed or dropped; timing earlier creates buffer but cannot guarantee delivery.
- Earlier execution does not make Search Console itself more current; Google notes that Search Console reporting can lag. The purpose is to have the latest available evidence ready before the SEO decision, not to eliminate Google reporting latency.

## Follow-up rule
Review the 00:37/02:37 UTC timing on 2026-09-17. If availability still misses the target, stop treating cron timing as the primary lever and design a different recovery path tied to an independent repository event or external scheduler; do not accumulate more cron entries.
