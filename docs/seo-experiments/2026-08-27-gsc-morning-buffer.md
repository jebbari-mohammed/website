# SEO Experiment: Search Console Morning Evidence Buffer

- **Status:** implementation
- **Launch date:** 2026-08-27
- **Action class:** SEO observability / evidence reliability
- **Owner:** ChatGPT senior SEO lead

## Problem

The Search Console health workflow was scheduled for `07:07 UTC`, leaving too little margin before the morning SEO decision process.

On 2026-08-26 the scheduled run did not start until `07:51:18 UTC`, a 44-minute delay. On 2026-08-27 there was still no GitHub Actions run for the repository after the normal morning evidence window had already opened. GitHub documents that scheduled workflows can be delayed during periods of Actions load and recommends scheduling away from heavily loaded times.

This creates an avoidable race: the SEO decision process can start before the newest Search Console query/page evidence and URL Inspection results exist.

## Change

Move the daily Search Console health schedule from:

- `07:07 UTC`

to:

- `05:37 UTC`

The minute remains away from the top of the hour, while the earlier time creates a substantially wider buffer for queue delays and the workflow's roughly three-minute URL Inspection phase.

No Search Console dimensions, date logic, query handling, index-inspection set, artifact encryption, public snapshot format, or public site content is changed.

The workflow remains push-triggered for its own implementation files, so merging this change should also execute an immediate production health check and refresh the evidence snapshot.

## Hypothesis

Running the Search Console health workflow earlier will materially reduce mornings where SEO decisions begin without a same-day successful evidence snapshot, while preserving the same data quality and privacy boundary.

## Baseline

- Previous scheduled cron: `07:07 UTC`.
- 2026-08-26 scheduled run start: `07:51:18 UTC` (+44 minutes versus nominal schedule).
- 2026-08-26 run result: successful; 63 private query+page rows, 91 impressions, 1 click; 24/25 monitored URLs indexed; zero URL Inspection API errors.
- 2026-08-27 morning state before this change: zero repository Actions runs recorded for the date, so no same-day Search Console snapshot was available.

## Target metrics

1. A successful same-day Search Console health snapshot is available before the morning SEO decision window on at least 6 of the next 7 daily runs.
2. Encrypted exact-query artifact generation remains successful.
3. Search Console evidence gate remains available.
4. URL Inspection continues with zero API errors under normal conditions.
5. No plaintext exact query or query-to-page pair is exposed publicly.

## Expected direction

- Same-day evidence availability before SEO decisions: increase.
- Evidence-race / stale-snapshot mornings: decrease.
- Search Console query/page coverage: unchanged.
- Public privacy exposure: unchanged at zero.

## Earliest review

- **Immediate technical review:** first push-triggered health run after merge.
- **First scheduled-run check:** 2026-08-28.
- **Preferred reliability review:** 2026-09-03 after seven daily opportunities.

## Risks and limitations

- GitHub does not guarantee exact execution time for scheduled workflows; this change adds buffer rather than pretending cron is exact.
- Search Console itself can have reporting latency, so a same-day workflow does not guarantee that the Search Analytics reporting end date advances every calendar day.
- Running earlier could occasionally retrieve the same reporting window as the prior day. That is acceptable: the purpose is to make the latest available evidence and index-inspection state reliably present before SEO decisions, not to force Google to finalize data earlier.
- If delayed or dropped scheduled runs continue despite the wider buffer, the next step should be a separate reliability design using an independent trigger or explicit freshness gate rather than repeatedly changing the cron.
