# SEO Decision Record: Evidence Hold While Active Experiments Mature

- **Status:** active observation / intentional no-public-change decision
- **Decision date:** 2026-08-22
- **Action class:** experiment discipline / evidence preservation
- **Owner:** ChatGPT senior SEO lead

## First-party evidence reviewed

The successful Search Console health run on 2026-08-22 covers 2026-07-25 through 2026-08-21 and returned:

- **44** private query + landing-page rows;
- **64** impressions;
- **0** clicks;
- **13** distinct landing pages;
- **70.77** impression-weighted average position;
- **25/25** priority URLs inspected;
- **18** indexed;
- **7** neutral/unknown;
- **0** URL Inspection API errors.

The encrypted exact-query artifact was authenticated and privately decrypted before this decision. Exact query strings and query-to-page pairs remain private and are intentionally omitted from this public record.

The strongest public landing-page aggregates are currently:

| Landing page | Impressions | Avg. position | Decision state |
| --- | ---: | ---: | --- |
| `/blog/best-app-to-track-progressive-overload-automatically` | 19 | 70.21 | Hold: rehabilitated 2026-08-16 and still awaiting recrawl of the new source version |
| `/blog/best-accountability-app-for-gym` | 13 | 90.00 | Observe: early overlap exists with another accountability guide; avoid rewriting both sides at once |
| `/blog/id/progressive-overload-explained-simple-guide-for-beginners` | 6 | 93.17 | Observe only |
| `/blog/gym-machines-vs-free-weights` | 5 | 79.00 | Hold: Google has not yet recrawled the 2026-08-12 source update |
| `/blog/workout-reminder-app-that-calls-you` | 4 | 36.25 | Best near-term rank-leverage candidate; 14-day title/snippet review window opens 2026-08-23 |
| `/blog/best-workout-app-with-meal-planning-included` | 4 | 69.50 | Hold: rehabilitated 2026-08-17 and awaiting recrawl |
| `/izem-ai-fitness-coach/` | 3 | 6.00 | Hold: branded sample is still too small for a title/CTR experiment and homepage trust work launched 2026-08-21 |

Two recent accountability assets were crawled by Google early on 2026-08-22 but remain currently not indexed: `/blog/weekly-fitness-check-in-template` and `/blog/workout-accountability-agreement-template`. That is another reason not to expand or materially rework the accountability cluster today.

## Recent changes and cooldowns respected

No new SEO/content commit had landed on 2026-08-22 before this decision. The newest material work is from 2026-08-21:

- homepage comparison/trust cleanup;
- deterministic private Search Console evidence handoff;
- stale-crawl observability improvements;
- crowded-gym guide rehabilitation and release guard.

The progressive-overload comparison was rehabilitated on 2026-08-16, the workout + meal-planning guide and beginner workout-generator guide on 2026-08-17, and a new progressive-overload tracker template launched on 2026-08-20. These are active experiments, not stale pages that should be rewritten again.

The repository's `daily-blog.yml` is manual-only Gemini fallback infrastructure. It is not a scheduled production brain and was not invoked for this decision.

## Live SERP findings

A current SERP review was performed using non-private semantic variants rather than transmitting private Search Console query strings.

### Accountability-app intent

Current ranking comparison pages increasingly use an explicit accountability mechanism and real named-product methodology. Examples group products by coaching, social accountability, commitment contracts, gamification, or verified activity and disclose when the publisher participates in the comparison. This indicates that `/blog/best-accountability-app-for-gym` may eventually benefit from a more rigorous source-checked product-comparison layer.

However, the page is still at an early average position, another IZEM URL already touches the same broad intent, and two new accountability assets are currently crawled-but-not-indexed. A major rewrite or consolidation today would increase attribution and cannibalization risk.

### Workout-reminder intent

The live result set remains fragmented between fitness-specific reminder products, general reminder utilities, and workout notification apps. IZEM's call-based reminder page is already the site's best non-branded near-ranking public landing page by average position. Its current source was substantially updated on 2026-08-09, so the policy-compliant 14-day title/snippet evaluation window opens tomorrow rather than today.

### Progressive-overload intent

Current winners use progression-specific comparison rubrics and explain how training history becomes the next target. IZEM's 2026-08-16 rehabilitation moved in that direction and already has the site's largest landing-page impression count. Google has not yet recrawled the new source version, and a complementary tracker template launched only two days ago. Additional changes now would be premature.

## Opportunity shortlist

| Score | Opportunity | Decision |
| ---: | --- | --- |
| **9.3/10** | Intentional one-day evidence hold to preserve active experiments and reopen the workout-reminder review with fresh data | **Chosen** |
| **8.8/10** | Evaluate a title/meta-only refinement for `/blog/workout-reminder-app-that-calls-you` | Hold until **2026-08-23** at the earliest |
| **8.3/10** | Rebuild `/blog/best-accountability-app-for-gym` into a source-checked named-product comparison and clarify its boundary with `/blog/accountability-apps-for-working-out` | Hold until **2026-08-29** at the earliest unless a technical defect appears |
| **7.2/10** | Add another discovery/internal-link push to `/workout-consistency-calculator` | Hold until the existing internal-link experiment has had at least 14–21 days |
| **6.6/10** | Publish another new cold-start page today | Rejected: no clearly superior non-overlapping intent justifies adding another experiment while current assets are still being crawled/evaluated |

## Chosen action

**No user-facing SEO page is changed today.** This is an intentional production decision, not a skipped run.

The highest expected-value action is to preserve clean attribution for the active experiments and review the workout-reminder page after its 14-day metadata window opens with one additional day of Search Console evidence.

No title, copy, canonical, robots directive, schema, sitemap entry, internal link, or public URL was changed.

## Hypothesis

Holding material site changes for one day will produce a higher-quality next decision than stacking another experiment now. It preserves attribution, avoids resetting pages that Google has not recrawled, and lets the strongest near-ranking candidate enter its planned metadata review window with fresher evidence.

## Baseline

- Search Console rows: **44**
- Impressions: **64**
- Clicks: **0**
- Indexed monitored URLs: **18/25**
- Workout-reminder landing page: **4 impressions, average position 36.25**
- Progressive-overload comparison: **19 impressions, average position 70.21**, source update still awaiting recrawl
- Accountability comparison: **13 impressions, average position 90.00**, with early broad-intent overlap elsewhere on the site

## Target metrics and decision triggers

At the next review, prefer a small metadata experiment on the workout-reminder page only if:

1. it remains the strongest non-branded near-ranking candidate;
2. new Search Console evidence does not show a stronger page-level opportunity;
3. its live result intent still matches the page's call-based differentiator;
4. the change can be limited to title/description/snippet alignment without rewriting the body;
5. no newer technical/indexing failure takes priority.

For accountability content, wait for more evidence before consolidation or a major comparison rewrite. For progressive-overload pages, wait for recrawl and the existing 21–30 day experiment windows.

## Expected direction

- Experiment attribution quality: **increase**
- Same-page churn: **decrease**
- Cannibalization risk: **decrease**
- Confidence of the next metadata/content action: **increase**
- Public URL count today: **unchanged**

## Review window

- Workout-reminder title/snippet: **earliest 2026-08-23**
- Workout-consistency internal-link experiment: **earliest 2026-08-25**, preferably after a full 21-day signal if no crawl occurs
- Accountability comparison substantial review: **earliest 2026-08-29**
- Progressive-overload rehabilitation content review: **earliest 2026-09-06**
- Homepage comparison/trust experiment: **earliest 2026-09-04**

## Risks

The cost of this decision is one day without a new public content asset. The benefit is avoiding a lower-confidence publication or rewrite while Google is actively processing several recent URLs and while the strongest near-ranking page is only one day away from its planned review window.

A no-change decision should be overridden immediately if production indexability, canonicalization, rendering, schema, sitemap integrity, or another site-wide technical issue fails.
