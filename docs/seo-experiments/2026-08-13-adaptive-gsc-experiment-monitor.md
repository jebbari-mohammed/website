# SEO Experiment: Adaptive Search Console Experiment Monitoring

- **Status:** launched
- **Launch date:** 2026-08-13
- **Action class:** technical SEO observability / index monitoring
- **Owner:** ChatGPT senior SEO lead

## Evidence and rationale

The 2026-08-13 Search Console health run returned 7 private query+landing-page rows, 10 impressions, and 0 clicks for 2026-07-16 through 2026-08-12. URL Inspection checked 7 hard-coded priority URLs: 4 were indexed and 3 were not yet crawled/indexed or were unknown to Google.

A new search-entry experiment, `/blog/weekly-fitness-check-in-template`, launched on 2026-08-12, but the hard-coded inspection list did not include it. This created an observability gap: the SEO lead could publish experiments faster than the URL-level monitor learned to watch them.

## Change

The Search Console evidence gate now builds an adaptive inspection set before the existing URL Inspection step. It keeps a small core set of strategic URLs and automatically adds the newest launched/active experiment target URLs recorded in `docs/seo-experiments/`. The generated set is passed to the existing inspection script through the GitHub Actions environment and remains capped well below the existing 25-URL safety limit.

The core set also explicitly includes `/izem-ai-fitness-coach/` alongside `/ai-fitness-coach` so the product/entity URL pair can be observed before any consolidation decision is made.

## Hypothesis

Automatically monitoring recent experiment URLs will shorten the time between publishing an SEO asset and knowing whether Google has discovered, crawled, canonicalized, or indexed it, while preventing daily decisions from relying on a stale hard-coded URL list.

## Baseline

- Private GSC query+page rows: 7.
- Private GSC impressions: 10.
- Private GSC clicks: 0.
- Hard-coded URL Inspection set: 7 URLs.
- Indexed among that set: 4.
- Unknown/discovered-but-not-indexed among that set: 3.
- Recent launched experiment URLs automatically included: 0.
- `/blog/weekly-fitness-check-in-template` was not part of the inspection set.

## Target metrics

1. 100% of recent launched experiments with a recorded target URL are automatically included in the daily inspection set until the rolling limit is reached.
2. No URL Inspection API errors are introduced.
3. New experiments receive a URL-level discovery/indexing baseline without manual edits to the inspection script.
4. The SEO lead can distinguish discovery/indexing lag from content-performance lag before deciding to alter a fresh page.

## Expected direction

- Recent-experiment inspection coverage: 0% → 100% for the current experiment set.
- Manual maintenance of the hard-coded inspection list: lower.
- Time to first URL-level index-status observation after launch: lower.
- Unnecessary rewrites of fresh pages caused by missing crawl/index evidence: lower.

## Review window

- **Integration review:** 2026-08-13 immediately after merge via the Search Console health workflow.
- **Earliest behavior review:** 2026-08-14, after the next normal health cycle.
- **First indexing-learning review:** 2026-08-20, while respecting the separate 21–30 day content cooldown for newly launched pages.

## Risks

- Experiment records without the expected `Status` and `Target URL` fields cannot be discovered automatically.
- The rolling set intentionally caps recent experiments so old experiments eventually age out of URL-level monitoring.
- URL Inspection reports Google's indexed version and status; it does not request live indexing or guarantee crawl timing.
