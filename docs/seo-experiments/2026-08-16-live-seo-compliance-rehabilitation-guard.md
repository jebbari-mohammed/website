# SEO Experiment: Live SEO Compliance Rehabilitation Guard

- **Status:** launched
- **Launch date:** 2026-08-16
- **Action class:** technical SEO observability / regression guard
- **Affected URL:** https://youraicoach.life/blog/ai-personal-trainer-that-actually-works
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

The scheduled Live SEO compliance run on 2026-08-16 failed after 20 attempts. Every attempt passed 30 of 31 checks. The sole failure was `/blog/ai-personal-trainer-that-actually-works`: the live page returned HTTP 200 and was indexable, but the monitor still expected the old quarantined/noindex state. GitHub issue #26 was opened automatically.

That expectation was stale. The page was intentionally rehabilitated on 2026-08-13 and its current source is indexable, self-canonical, and free of the legacy quarantine markers. Search Console URL Inspection still reports the older `Excluded by ‘noindex’ tag` state because Google’s recorded crawl is from 2026-07-08, before the rehabilitation.

The freshest Search Console health run for 2026-07-19 through 2026-08-15 returned 25 query+landing-page rows, 33 impressions, 0 clicks, and 5 of 11 monitored priority URLs indexed. The compliance failure is therefore a monitoring defect, not evidence that the rehabilitated page should be re-quarantined.

## Change

Replace the stale `representative quarantine` invariant for the rehabilitated page with the intended released-state invariant. The live guard now requires the page to:

1. Return HTTP 200.
2. Remain indexable (no `noindex`).
3. Remain self-canonical at its clean production URL.
4. Remain free of legacy quarantine markers.
5. Remain included in the normal sitemap.

The guard intentionally does not require News sitemap inclusion because the article is an older page with a recent rehabilitation, not a newly published news article.

The workflow also now triggers when this monitored page changes, so a future accidental noindex, canonical regression, re-quarantine, or sitemap removal can be caught promptly.

## Hypothesis

Aligning the live compliance test with the approved SEO state will eliminate the current false-positive failure while preserving a meaningful regression guard for the rehabilitated page. This should make future red compliance runs actionable rather than permanently noisy.

## Baseline

- Scheduled compliance run: failed.
- Attempts: 20/20 failed on the same stale invariant.
- Checks passing per attempt: 30/31.
- Open compliance issue: #26.
- Live rehabilitated page: HTTP 200, indexable, not quarantined.
- Current GSC aggregate: 25 query/page rows, 33 impressions, 0 clicks.

## Target metrics

1. Post-merge Live SEO compliance run passes all checks.
2. GitHub issue #26 closes automatically on recovery.
3. Future edits to the rehabilitated page trigger the compliance workflow.
4. False-positive compliance failures from the retired quarantine expectation fall to zero.

## Expected direction

- Live compliance: red → green.
- Alert quality: stale false positive → current-state regression signal.
- Monitoring coverage: workflow-only/city-page changes → also includes the released rehabilitation page.

## Review window

- **Earliest review:** immediately after the post-merge push-triggered compliance run.
- **Next scheduled confirmation:** the next weekly Live SEO compliance run.
- Revisit only if the intended indexing state of the page changes again or the monitor produces another reproducible false positive.

## Risks

- A sitemap-string check can become stale if sitemap architecture changes; if that architecture is intentionally changed, update the invariant in the same change.
- Do not add a News sitemap requirement without confirming the site’s News eligibility and recency policy.
- Do not re-add `noindex` merely to make a stale monitor green; the monitor must describe the intended production state, not dictate it.
