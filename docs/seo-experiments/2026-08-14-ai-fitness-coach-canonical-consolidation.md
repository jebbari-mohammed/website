# SEO Experiment: AI Fitness Coach Canonical Consolidation

- **Status:** launched
- **Launch date:** 2026-08-14
- **Primary URL:** https://youraicoach.life/izem-ai-fitness-coach/
- **Alternate URL:** https://youraicoach.life/ai-fitness-coach
- **Action class:** technical SEO / canonical consolidation
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

The 2026-08-14 Search Console health run returned 13 query + landing-page rows, 17 impressions, and 0 clicks for 2026-07-17 through 2026-08-13. Exact query strings are not printed by the public workflow.

URL Inspection reported materially different states for two highly overlapping product pages:

- `/izem-ai-fitness-coach/`: **PASS — Submitted and indexed**, last recorded crawl 2026-08-04T15:22:15Z.
- `/ai-fitness-coach`: **NEUTRAL — Discovered, currently not indexed**, with no recorded crawl.

The alternate page already tells readers to use `/izem-ai-fitness-coach/` as the canonical entity page, but its HTML still self-canonicalized to `/ai-fitness-coach`. Both URLs were therefore sending mixed canonical signals.

## Overlap and cannibalization review

Both URLs satisfy the same core commercial/entity intent: understanding IZEM as an AI fitness coach / AI personal trainer. Both describe the same product capabilities: workout plans, meal plans, food/body/equipment scans, reviews, weekly adaptation, coach memory, and accountability calls.

The `/izem-ai-fitness-coach/` page is the stronger representative because it:

1. Is already indexed by Google.
2. Is explicitly positioned in visible copy as the canonical answer/entity page.
3. Uses richer WebPage + MobileApplication + Organization structured data.
4. Is linked from core site navigation and product surfaces.
5. Has the clearer branded entity URL.

The alternate `/ai-fitness-coach` page is not being deleted or redirected in this experiment. Its visible content remains available to users. Only the canonical preference is being aligned, which is materially less destructive than a permanent redirect.

## Action

Change the alternate page's `rel="canonical"` from:

`https://youraicoach.life/ai-fitness-coach`

to:

`https://youraicoach.life/izem-ai-fitness-coach/`

The repository's sitemap synchronizer builds the sitemap from each indexable page's canonical URL and deduplicates identical canonicals, so the deployed sitemap should retain the primary URL and stop presenting the alternate URL as a separate canonical candidate.

## Hypothesis

Aligning the alternate product page's canonical with the already indexed entity page will reduce duplicate/cannibalization ambiguity, consolidate product-page signals, simplify performance attribution, and help Google spend discovery/crawl attention on distinct search-entry pages instead of two near-duplicate IZEM product URLs.

## Baseline

- Site GSC summary: 13 query/page rows, 17 impressions, 0 clicks.
- `/izem-ai-fitness-coach/`: indexed.
- `/ai-fitness-coach`: discovered, not indexed.
- Both URLs currently exist as self-canonical indexable pages before this change.

## Target metrics

1. `/izem-ai-fitness-coach/` remains indexed and continues to be the representative product URL.
2. `/ai-fitness-coach` is eventually recognized as an alternate/canonicalized URL rather than a competing canonical candidate.
3. Product-query impressions and clicks consolidate on the primary URL as GSC volume grows.
4. The deployed sitemap contains the primary canonical URL and does not advertise the alternate as a separate canonical.
5. No regression in internal links, schema validation, build, or live availability.

## Expected direction

- Canonical ambiguity: two self-canonical product URLs → one preferred canonical.
- Indexed representative: `/izem-ai-fitness-coach/` remains the indexed product entity page.
- Crawl/index efficiency: duplicate candidate pressure decreases.
- Performance attribution: product search data becomes easier to interpret as volume grows.

## Review window

- **Earliest useful URL Inspection review:** 2026-08-21.
- **Preferred first decision date:** 2026-08-28.
- Do not add a permanent redirect or delete the alternate URL before the review unless stronger evidence emerges that the redirect is safe and beneficial.

## Risks

- Google canonical selection is not guaranteed and can take time to re-evaluate.
- Exact query-level GSC evidence is still unavailable to the ChatGPT SEO brain from the public workflow, so there is not yet query-by-query attribution for either product URL.
- The alternate URL may have unknown external links. Keeping it live with `rel="canonical"` limits destructive risk while we observe the result.
