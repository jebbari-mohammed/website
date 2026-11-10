# SERP-synthesized article cohort recovery review

**Decision date:** 2026-11-10  
**Scope:** The ten articles staged in commit `4544be50` on 2026-10-13  
**Publication status:** Hold remains active. This review does not authorize an article rewrite, consolidation, removal, or new publication.

## Why this cohort needs intervention

The ten articles were created in one operation by reviewing seven ranking results per topic, combining their coverage, and adding a calculator. Four were published before the site-wide visibility collapse on 2026-10-27. Two more were published before the publication hold stopped the remaining four.

The articles contain useful elements, including calculators, tables, citations, and direct answers. The production method still creates a site-quality risk. Each article follows almost the same structure and length, repeats the same FAQ and references pattern, uses similar internal-link counts, and begins from a synthesis of what already ranks. The result can look mass-produced even when individual facts are cited.

Google's current guidance asks whether a page supplies original information, analysis, or substantial value beyond existing results. Google's spam policy also lists stitching information from several pages without sufficient added value as an example of scaled content abuse. Deleting content is a last resort; salvageable pages should receive meaningful, durable improvements instead of cosmetic SEO edits.

References:

- [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Spam policies for Google Web Search](https://developers.google.com/search/docs/essentials/spam-policies)
- [Google Search core-update recovery guidance](https://developers.google.com/search/docs/appearance/core-updates)

## Verified performance and indexing evidence

Search Console page-level evidence compares the fourteen days before the collapse, 2026-10-13 through 2026-10-26, with 2026-10-27 through 2026-11-09. Query strings and query-to-page pairs remain private.

| Article | Published | Impressions before | Impressions after | Current Google index state | Recovery classification |
| --- | --- | ---: | ---: | --- | --- |
| `/blog/how-long-to-rest-between-sets` | 2026-10-16 | 44 | 0 | Submitted and indexed | Keep URL; rebuild first |
| `/blog/4-day-upper-lower-workout-split` | 2026-10-19 | 18 | 3 | Submitted and indexed | Keep URL; rebuild second |
| `/blog/push-pull-legs-3-day-split` | 2026-10-23 | 4 | 1 | Submitted and indexed | Keep URL; rebuild after overlap review |
| `/blog/reps-in-reserve-rir-chart` | 2026-10-25 | 0 | 0 | Unknown to Google | Rebuild around IZEM autoregulation before further promotion |
| `/blog/romanian-deadlift-vs-deadlift` | 2026-10-28 | 0 | 0 | Unknown to Google | Candidate for retirement or exercise-hub consolidation |
| `/blog/incline-dumbbell-press-angle` | 2026-10-31 | 0 | 0 | Discovered, currently not indexed | Candidate for retirement; low product fit and high claim-review cost |
| `lat-pulldown-alternatives-at-home` draft | Not published | 0 | 0 | Source draft only | Do not publish; reuse only the equipment-substitution utility if useful |
| `how-much-protein-per-meal` draft | Not published | 0 | 0 | Source draft only | Do not publish as written; requires nutrition review and stronger product value |
| `skinny-fat-workout-and-nutrition-guide` draft | Not published | 0 | 0 | Source draft only | Retire; overlaps the body-recomposition guide and carries avoidable health-claim risk |
| `missed-a-week-of-workouts-how-to-return` draft | Not published | 0 | 0 | Source draft only | Consolidate the useful comeback logic into the existing missed-workout coverage |

The first two pages demonstrated real demand before the collapse, including early page-one testing. That evidence supports preserving their URLs. It does not support retaining the current derivative template unchanged.

## Content treatment

### Pages to preserve and rebuild

`how-long-to-rest-between-sets`, `4-day-upper-lower-workout-split`, and `push-pull-legs-3-day-split` have distinct search intent and some first-party demand evidence. Their rewrites should preserve the URL and any verified citations while replacing the seven-result synthesis with a narrower, product-led purpose:

- explain the decision a reader must make;
- use an original IZEM planning or adaptation method;
- keep only calculations whose assumptions are visible and supportable;
- remove precise universal percentages that are not directly established by a cited source;
- show a worked example grounded in a realistic schedule or equipment constraint;
- link to IZEM only where the product genuinely performs the described task.

`reps-in-reserve-rir-chart` has stronger product fit than the exercise-comparison pages because autoregulation is part of adaptive coaching. It should be rebuilt around how a training plan changes after a user's reported effort, with the RIR chart supporting that workflow instead of serving as another generic chart page.

### Pages to consolidate or retire

`romanian-deadlift-vs-deadlift` and `incline-dumbbell-press-angle` have no observed Search Console demand, were not indexed at review time, and have weaker commercial connection to IZEM. They also make precise biomechanical and load-ratio claims that require more source review than their product value justifies. After the hold is cleared, the reviewed options are:

1. retain a small, verified substitution rule inside `/exercises/`; or
2. retire the standalone URL if no unique utility survives review.

The unpublished `skinny-fat` draft overlaps `/blog/body-recomposition-guide-lose-fat-gain-muscle`. The missed-week draft overlaps `/blog/fitness-app-that-adapts-when-you-miss-a-workout` and `/blog/fitness-app-with-fallback-workouts-busy-days`. New indexable URLs are not justified for either intent.

## Technical correction completed in the repository

Five HTML source drafts, including four from this cohort, were being copied into the deployable Hosting artifact. The four checked cohort draft routes returned HTTP 200 and declared `index, follow`, while their intended canonical URLs returned 404.

The corrected deployment path:

- removes `blog/drafts` from `dist-agent-hosting` before deployment;
- adds a `noindex, nofollow, noarchive` HTTP fallback for `/blog/drafts/**`;
- preserves the source files for the reviewed publisher;
- includes a regression test proving drafts remain in the source build but are absent from the Hosting artifact.

This is an indexing correction permitted during the publication hold. It is separate from any editorial recovery experiment.

## Controlled recovery order after manual hold clearance

Only one material SEO change should be released per day, followed by validation and an observation window.

1. Rebuild `/blog/how-long-to-rest-between-sets` because it had the strongest pre-collapse demand signal.
2. Rebuild `/blog/4-day-upper-lower-workout-split`, preserving its distinct scheduling intent and checking overlap with `/blog/best-workout-split` and `/workouts/`.
3. Decide whether `/blog/push-pull-legs-3-day-split` remains distinct enough to justify a separate URL.
4. Rebuild the RIR page only if its adaptive-coaching workflow can provide real product-led value.
5. Review retirement or consolidation of the two weak-fit exercise pages.

The four unpublished cohort drafts stay unpublished. No new topic or replacement article should be selected during this recovery cycle.

## Hold release criteria

The publication hold may be cleared only by an explicit manual decision after this evidence is reviewed. Clearance should name the first permitted URL and action. It must not authorize the full cohort as a batch.
