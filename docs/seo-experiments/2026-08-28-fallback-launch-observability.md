# SEO Experiment: Fallback Guide Launch Observability

- **Status:** implementation
- **Decision date:** 2026-08-28
- **Target URL:** `https://youraicoach.life/blog/fitness-app-with-fallback-workouts-busy-days`
- **Action class:** technical SEO / launch observability / indexability guard
- **Owner:** ChatGPT senior SEO lead

## Fresh first-party evidence

The Search Console health run `33195784218` completed successfully on 2026-08-28 after the morning SEO hold. Its reporting window is 2026-07-31 through 2026-08-27 with 76 private query+landing-page rows, 114 impressions, 1 click, 17 landing pages, aggregate CTR 0.88%, and impression-weighted average position 59.63.

URL Inspection checked 25 priority URLs with 24 indexed, 0 explicitly not indexed, 1 neutral/unknown, and 0 API errors. The newly rehabilitated fallback-workout guide had no guaranteed URL Inspection slot.

A post-merge live compliance check surfaced an important distinction in another monitored URL: `/blog/ai-personal-trainer-that-actually-works` is currently indexable in production, while Search Console is still reporting its historical pre-rehabilitation noindex crawl. That URL therefore still needs fixed recrawl monitoring and must not be sacrificed to make room for the fallback guide.

## Existing same-day change

Earlier today, commit `1bdd073ba3125c044936dc13556a6856a43e9aa0` rehabilitated the fallback-workout page from a legacy noindex asset into an indexable search page. The launch added a self-canonical, index/follow robots directive, useful structured data, sitemap/blog discovery, contextual internal links, and a 21-day experiment lock through 2026-09-17.

Because that was already a material content change today, a second content rewrite would reduce attribution quality. The safer opportunity is to improve measurement and release protection around the new asset.

## Opportunity shortlist

1. **9.6/10 — give the new fallback guide a fixed URL Inspection slot and live indexability protection — chosen.** High confidence, immediate feedback, no cannibalization, and no public-content churn.
2. **8.9/10 — optimize the workout-reminder page.** It has 11 impressions at average position 20.00, but the August 24 material refresh is locked through 2026-09-14.
3. **8.7/10 — optimize the workout+meal-planning guide.** It has 14 impressions at average position 32.86 and has improved materially, but its August 17 rehabilitation is locked through 2026-09-07.
4. **8.5/10 — refine the progressive-overload comparison.** It leads the site with 27 impressions, but Google still has not recrawled the August 16 source version and the experiment is locked through 2026-09-06.
5. **6.2/10 — publish another page.** Rejected because today already contains a substantial new indexable asset and stronger existing URLs are accumulating evidence.

## Change

- Add `/blog/fitness-app-with-fallback-workouts-busy-days` to the fixed Search Console URL Inspection priority list.
- Preserve `/blog/ai-personal-trainer-that-actually-works` because its current production state is indexable while Google still needs to recrawl that rehabilitation.
- Remove `/blog/workout-accountability-calendar` from the fixed list instead. It is crawl-current, not present in the current top landing-page aggregate, and remains eligible to return through adaptive Search Analytics prioritization if it starts earning visibility.
- Add the fallback page to the live SEO compliance protected-asset set.
- Make future changes to that page trigger the live compliance workflow.

This preserves the same fixed-list size and remaining adaptive GSC-driven capacity while concentrating fixed monitoring on pages where direct crawl-state evidence can change an active SEO decision.

## Hypothesis

Giving the newly indexable fallback guide a fixed inspection slot while retaining recrawl monitoring for the rehabilitated AI-personal-trainer page will produce faster, more useful evidence about current launch states without increasing the 25-URL inspection budget. Adding the fallback page to live compliance will prevent silent regressions in HTTP status, robots state, canonicalization, quarantine markers, or sitemap inclusion.

## Baseline

- Site Search Console: 114 impressions, 1 click, 0.88% aggregate CTR.
- URL Inspection: 24/25 indexed, 0 API errors.
- Fallback guide: newly indexable; no guaranteed direct URL Inspection result before this change.
- AI-personal-trainer page: production is indexable, but Google still reports a stale historical noindex crawl; retain fixed monitoring until recrawled.
- Workout-accountability calendar: crawl-current and absent from the current top 17 landing-page aggregate.

## Target metrics

1. The next successful Search Console health run directly inspects the fallback guide with zero API errors.
2. The fallback guide receives an authoritative Google discovery/crawl/index state.
3. Live compliance confirms HTTP 200, indexability, self-canonicalization, no legacy quarantine marker, and sitemap membership.
4. The AI-personal-trainer rehabilitation remains directly monitored until Google processes its current indexable version.
5. The total inspection cap remains 25 and adaptive capacity is not reduced.
6. No public content or active ranking experiment is modified.

## Expected direction

- Time to detect fallback-guide discovery/index state: down.
- Fixed inspection relevance: up.
- Recrawl visibility for active rehabilitations: preserved.
- Launch regression protection: up.
- Cannibalization/content experiment noise: unchanged.

## Validation finding

The first implementation incorrectly characterized the AI-personal-trainer URL as intentionally noindexed based only on Search Console's stale crawl state. The post-merge live compliance run proved the current production page is HTTP 200, indexable, self-canonical, quarantine-cleared, and sitemap-included. The monitoring allocation was immediately corrected rather than allowing a stale inspection state to drive a persistent observability mistake.

## Review window

- **Immediate technical review:** deterministic PR validation and live compliance after merge.
- **First Search Console review:** next successful health run after the corrected allocation is merged.
- **Earliest content/snippet review for the fallback page:** 2026-09-10 if there are meaningful impressions.
- **Material rewrite lock:** 2026-09-17.
- **Preferred content decision:** 2026-09-24.

## Risks

The workout-accountability calendar will no longer be guaranteed a daily direct inspection. That is acceptable because it is crawl-current and has no current landing-page visibility in the public-safe aggregate. If it begins earning Search Analytics impressions, the adaptive prioritizer can bring it back into the 25-URL set; if it becomes an active release or experiment, it can be restored as a fixed priority.
