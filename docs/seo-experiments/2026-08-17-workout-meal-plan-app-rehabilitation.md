# SEO Experiment: Workout App With Meal Planning Rehabilitation

- **Status:** launched
- **Launch date:** 2026-08-17
- **Target URL:** https://youraicoach.life/blog/best-workout-app-with-meal-planning-included
- **Primary intent:** best workout app with meal planning included
- **Observed related queries:** best personal trainer app with meal plan; best meal plan app for muscle gain
- **Action class:** existing-URL rehabilitation and indexable release
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

The 2026-08-17 private Search Console pull covers 2026-07-20 through 2026-08-16 and returned 27 query + landing-page rows, 37 impressions, and 0 clicks.

The exact private query evidence showed this URL already receiving two impressions despite being quarantined with `noindex`:

- `best personal trainer app with meal plan`: 1 impression, average position 57.
- `best meal plan app for muscle gain`: 1 impression, average position 78.

This is stronger rank-leverage evidence than creating a brand-new URL with no search history today. The URL was originally published 2026-07-24 and had not received a recent content experiment.

## Why rehabilitation was required

The legacy page was not safe to index. It contained:

- `robots=noindex` and `googlebot=noindex` quarantine directives;
- a legacy editorial-review marker;
- fabricated first-person anecdote language;
- unsupported competitor prices and product assertions;
- unsupported superlatives and broad claims about training/nutrition automation;
- hreflang links to quarantined translations.

Removing `noindex` without rebuilding the page would have released weak and insufficiently supported content.

## SERP and source rationale

The current search landscape mixes:

- dedicated articles comparing apps that combine workouts and meal planning;
- App Store product listings for combined workout + meal-plan products;
- personal-trainer software lists; and
- broader workout-app reviews that treat meal planning as a selection criterion.

The useful information gap is not another generic list of app names. Searchers need a way to distinguish a shared subscription from an actually usable combined workflow.

The rebuilt page therefore adds the **IZEM FUEL test**:

1. **Fitness depth** — is there a real training plan and usable history/next step?
2. **Unified profile** — do goals/preferences shape both sides coherently?
3. **Editability** — can meals, workouts, equipment, and preferences change without starting over?
4. **Life-response loop** — what happens after a miss, schedule change, unavailable food, or goal change?

Competitor descriptions are restricted to current official Centr documentation and official Apple App Store listings for FitFuel and Exerprise. Practical meal-planning criteria are supported with USDA MyPlate guidance. The page explicitly discloses that IZEM did not conduct a hands-on competitor test.

## Cannibalization check

No other maintained IZEM URL targets the exact task of choosing an app that combines workout planning and meal planning. Nearby pages have different primary jobs:

- `/blog/weekly-nutrition-check-in-template`: retrospective nutrition-planning friction check-in.
- `/blog/best-app-to-track-progressive-overload-automatically`: progressive-overload app comparison.
- `/blog/accountability-apps-for-working-out`: accountability mechanism comparison.
- `/izem-ai-fitness-coach/`: canonical IZEM product/entity page.

The existing URL was preserved rather than creating a new competing page.

## Hypothesis

Rebuilding an already-visible but quarantined URL into a trustworthy, indexable, task-specific comparison with a free FUEL scorecard will allow Google to evaluate the page normally and should improve impressions, ranking coverage, and eventually clicks for workout + meal-planning app queries.

## Baseline

- Site GSC window: 27 query/page rows, 37 impressions, 0 clicks.
- Target URL: 2 impressions, 0 clicks.
- Best observed target-query position: 57.
- Target URL state before release: `noindex, follow` plus legacy quarantine marker.

## Target metrics

1. Google recrawls the URL and no longer reports the historical noindex state.
2. Target URL remains self-canonical and present in normal discovery files.
3. Target URL impressions increase from 2.
4. Average position for the observed workout + meal-plan query cluster improves from the initial 57–78 range.
5. Organic clicks increase from 0 after sufficient impressions accumulate.
6. No new cannibalization appears with the canonical IZEM product page or the weekly nutrition check-in.

## Expected direction

- Index state: quarantined/noindex → crawled/indexable → indexed if Google selects the page.
- Impressions: 2 → positive growth.
- Clicks: 0 → positive after ranking visibility improves.
- Search-task quality: promotional legacy article → transparent comparison framework + interactive utility.

## Review window

- **Earliest URL Inspection review:** 2026-08-24.
- **Earliest useful ranking/content review:** 2026-09-07 (21 days).
- **Preferred first decision date:** 2026-09-16 (30 days).
- Do not materially rewrite the page before 2026-09-07 unless correcting a factual, safety, accessibility, canonical, rendering, indexing, or deployment defect.

## Risks

- Google may continue to report a stale historical `noindex` state until recrawl.
- Two impressions are promising but still a very small sample.
- Search intent can split between consumer apps, coach/client software, and meal-planning-only tools.
- Competitor product features can change; the page therefore dates its source check and links to first-party documentation.
