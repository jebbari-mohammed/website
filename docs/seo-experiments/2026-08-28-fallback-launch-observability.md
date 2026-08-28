# SEO Experiment: Fallback Guide Launch Observability

- **Status:** implementation
- **Decision date:** 2026-08-28
- **Target URL:** `https://youraicoach.life/blog/fitness-app-with-fallback-workouts-busy-days`
- **Action class:** technical SEO / launch observability / indexability guard
- **Owner:** ChatGPT senior SEO lead

## Fresh first-party evidence

The Search Console health run `33195784218` completed successfully on 2026-08-28 after the morning SEO hold. Its reporting window is 2026-07-31 through 2026-08-27 with 76 private query+landing-page rows, 114 impressions, 1 click, 17 landing pages, aggregate CTR 0.88%, and impression-weighted average position 59.63.

URL Inspection checked 25 priority URLs with 24 indexed, 0 explicitly not indexed, 1 neutral/unknown, and 0 API errors. The intentionally noindexed legacy `/blog/ai-personal-trainer-that-actually-works` was still consuming a fixed inspection slot while the newly rehabilitated fallback-workout guide had no guaranteed URL Inspection slot.

## Existing same-day change

Earlier today, commit `1bdd073ba3125c044936dc13556a6856a43e9aa0` rehabilitated the fallback-workout page from a legacy noindex asset into an indexable search page. The launch added a self-canonical, index/follow robots directive, useful structured data, sitemap/blog discovery, contextual internal links, and a 21-day experiment lock through 2026-09-17.

Because that was already a material content change today, a second content rewrite would reduce attribution quality. The safer opportunity is to improve measurement and release protection around the new asset.

## Opportunity shortlist

1. **9.6/10 — reallocate one fixed URL Inspection slot to the new fallback guide and add live indexability protection — chosen.** High confidence, immediate feedback, no cannibalization, and no public-content churn.
2. **8.9/10 — optimize the workout-reminder page.** It has 11 impressions at average position 20.00, but the August 24 material refresh is locked through 2026-09-14.
3. **8.7/10 — optimize the workout+meal-planning guide.** It has 14 impressions at average position 32.86 and has improved materially, but its August 17 rehabilitation is locked through 2026-09-07.
4. **8.5/10 — refine the progressive-overload comparison.** It leads the site with 27 impressions, but Google still has not recrawled the August 16 source version and the experiment is locked through 2026-09-06.
5. **6.2/10 — publish another page.** Rejected because today already contains a substantial new indexable asset and stronger existing URLs are accumulating evidence.

## Change

- Remove the intentionally noindexed legacy `/blog/ai-personal-trainer-that-actually-works` from the fixed Search Console URL Inspection priority list.
- Add `/blog/fitness-app-with-fallback-workouts-busy-days` in its place, preserving the same number of fixed slots and the remaining adaptive GSC-driven capacity.
- Add the fallback page to the live SEO compliance protected-asset set.
- Make future changes to that page trigger the live compliance workflow.

The legacy noindex page remains protected by its actual noindex/quarantine behavior and can still enter adaptive inspection if Search Console evidence ever makes it relevant. Repeatedly inspecting a known intentional noindex page does not currently create as much decision value as directly measuring a newly released indexable asset.

## Hypothesis

Reallocating a fixed inspection slot from a known intentional noindex state to the newly indexable fallback guide will produce faster, more useful evidence about Google discovery/crawl/indexing without increasing the 25-URL inspection budget. Adding the page to live compliance will prevent silent regressions in HTTP status, robots state, canonicalization, quarantine markers, or sitemap inclusion.

## Baseline

- Site Search Console: 114 impressions, 1 click, 0.88% aggregate CTR.
- URL Inspection: 24/25 indexed, 0 API errors.
- Fallback guide: newly indexable; no guaranteed direct URL Inspection result yet.
- Legacy AI-personal-trainer page: known intentional noindex, repeatedly returning NEUTRAL / excluded by noindex.

## Target metrics

1. The next successful Search Console health run directly inspects the fallback guide with zero API errors.
2. The fallback guide receives an authoritative Google discovery/crawl/index state.
3. Live compliance confirms HTTP 200, indexability, self-canonicalization, no legacy quarantine marker, and sitemap membership.
4. The total inspection cap remains 25 and adaptive capacity is not reduced by this reallocation.
5. No public content or active ranking experiment is modified.

## Expected direction

- Time to detect fallback-guide discovery/index state: down.
- Wasted inspection capacity on a stable intentional noindex state: down.
- Launch regression protection: up.
- Cannibalization/content experiment noise: unchanged.

## Review window

- **Immediate technical review:** deterministic PR validation and live compliance after merge.
- **First Search Console review:** next successful health run after merge.
- **Earliest content/snippet review for the fallback page:** 2026-09-10 if meaningful impressions exist.
- **Material rewrite lock:** 2026-09-17.
- **Preferred content decision:** 2026-09-24.

## Risks

The removed legacy noindex page will no longer be guaranteed a daily direct inspection. That is acceptable because its current exclusion is intentional and already known. If its robots policy changes or it becomes a release candidate, it should be re-added or protected through a dedicated state-specific guard rather than consuming a permanent slot indefinitely.
