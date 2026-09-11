# AI meal planner feature refresh — measurement lock

Date: 2026-09-11
Target: `/features/ai-meal-planner`
Launch commit: `5e0f459a230fedb89d269beb35e2da51849cc14b`

## Decision

Protect the September 11 AI meal-planner feature refresh from overlapping material rewrites while Google discovers and evaluates the new version. This is a measurement/governance action only; it does not change the public page.

## Evidence at launch

The Search Console snapshot covering 2026-08-14 through 2026-09-10 shows the pre-refresh `/features/ai-meal-planner` with 1 impression, 0 clicks, and average position 153. The site overall had 209 impressions, 1 click, 0.48% CTR, and a 34.69 impression-weighted average position across 99 private query+landing-page rows.

The September 11 refresh materially changed the page: title/meta, visible content, visible FAQ answers, Article/FAQ/Breadcrumb structured data, image/social metadata, product explanation, safety language, and supporting discovery links. The production SEO validation and Pages deployment completed successfully after that release.

Live search results for AI meal-planner intent are utility-led: leading pages typically turn goals, calorie/macro targets, dietary constraints, schedule or preferences into a weekly plan, then support grocery lists, swaps, food logging/scanning, workout context, or ongoing adaptation. The refreshed IZEM page is therefore an intentional intent-alignment experiment, not a cosmetic edit.

## Hypothesis

A clearer workout-aware meal-planning explanation that connects macros, preferences, schedule, food scans, day review, and weekly adaptation will earn more relevant impressions and improve average position relative to the pre-refresh baseline without creating a new competing URL.

## Baseline

- Reporting window: 2026-08-14 to 2026-09-10
- Landing-page impressions: 1
- Landing-page clicks: 0
- Landing-page CTR: 0%
- Landing-page average position: 153
- Public URL: unchanged
- Material refresh released: 2026-09-11

## Success metrics

Primary:
- relevant Search Console impressions increase from the one-impression baseline;
- average position improves directionally from 153;
- clicks begin to appear as visibility grows.

Safety:
- URL remains indexable and self-canonical;
- no competing meal-planner URL is introduced;
- structured data continues to match visible content;
- build, link, schema, sitemap, and live checks remain green.

## Measurement window

- Material rewrite lock: through 2026-10-02
- Earliest safe material rewrite: 2026-10-03 unless a documented factual, legal, rendering, indexing, canonical, deployment, or safety correction is required
- Preferred review: 2026-10-09

Do not interpret a few early impressions or temporary rank volatility as a reason to rewrite the page again. Compare the post-refresh Search Console trend with the launch baseline and inspect Google's crawl state before choosing the next action.

## Risk notes

The launch baseline is extremely small, so percentage changes will be noisy. Evaluate absolute impressions, query/intent quality where private evidence is available, average-position direction, crawl/index state, and downstream clicks together. The strongest current organic opportunity remains `/features/ai-workout-generator`, but that page has its own active experiment and must not be modified as part of this measurement action.
