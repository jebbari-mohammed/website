# Adaptive workout and meal weekly receipt refresh - 2026-09-26

- **Target URL:** https://youraicoach.life/blog/adaptive-workout-and-meal-plan-app
- **Action:** Existing-page improvement
- **Primary intent:** adaptive workout and meal plan app
- **Secondary angle:** weekly plan adaptation after missed workouts, messy meals, busy gyms, and day reviews
- **Launch date:** 2026-09-26
- **Lock until:** 2026-10-17
- **Preferred review:** 2026-10-24

## Evidence used

- Verified issue `jebbari-mohammed/website#34`, workflow run `36228378319`, artifact `private-gsc-evidence-v1`, artifact digest `sha256:f9e1ddf10fb679374459cb6bec6b23abf7ca6e341f1b20fbe3a0efc77ddf9a83`, vault manifest, RSA fingerprint `56ec78e9ac6187e930cbb4f9e0cea1dad84791287120ce9360a1afcb457352de`, authenticated AES-GCM decryption, query/page dimensions, 104 rows, and the 2026-08-29 to 2026-09-25 reporting period. Exact query text and query/page pairs were used only for private reasoning and are not recorded here.
- Public-safe landing-page evidence still shows the workout-and-meal-planning cluster active on `/blog/best-workout-app-with-meal-planning-included`, while `/blog/adaptive-workout-and-meal-plan-app` is indexed but not yet producing top public-safe impressions.
- Live SERP review on 2026-09-26 showed product-heavy results that claim weekly adaptation, workout plus nutrition planning, check-ins, food photo logging, and equipment context. The gap is a buyer-side test that asks whether an app can explain why the weekly plan changed.

## Candidate score

| Factor | Score | Notes |
| --- | ---: | --- |
| Demand evidence | 4.0 | Private-safe cluster aggregation still shows workout-plus-meal-planning activity, and live SERP language confirms demand around weekly adaptation. |
| Low competition | 3.4 | SERP is competitive with app/product pages, but few results give a practical receipt-style evaluation tool. |
| Product fit | 5.0 | IZEM's calls, day reviews, food/body/equipment context, and weekly adaptation directly match the intent. |
| Conversion fit | 4.3 | A user comparing adaptive apps can plausibly choose a premium coach around $24.99/month. |
| Cluster fit | 4.5 | Strengthens the meal-planning and adaptive-coaching cluster without editing locked winner pages. |
| Linkability | 4.0 | The Weekly Adaptation Receipt gives outreach a concrete pitch beyond another app comparison. |
| Cannibalization risk | -0.6 | Kept the existing canonical page and avoided launching a duplicate weekly-adaptation URL. |

**Overall score:** 4.1/5

## What changed

- Updated title, meta description, Open Graph, Twitter copy, Article JSON-LD, FAQ JSON-LD, matching OG artwork copy, and `dateModified` to focus on the Weekly Adaptation Receipt.
- Added the browser-only Weekly Adaptation Receipt with six selectors and a 12-point output that classifies static tracker, personalized planner, or adaptive coach signals.
- Added internal links from the refreshed page to `/blog/workout-day-meal-planner-app` and `/blog/food-scanner-app-with-meal-planning-and-workout-coaching`.
- Updated the blog index cluster card to point readers toward the receipt test.
- Updated sitemap/RSS/blog discovery through the local sync tools.

## Cannibalization control

- `/blog/best-workout-app-with-meal-planning-included` remains the broad comparison page for apps with meal plans.
- `/blog/workout-day-meal-planner-app` remains the narrow training-day/rest-day meal-planning support asset.
- `/features/ai-meal-planner` remains the feature page for IZEM meal-planner capabilities.
- `/blog/ai-coach-adapts-workouts-meals-weekly` remains quarantined/noindex and should not compete with this canonical adaptive page.

## Expected outcome

This refresh gives Google and users a clearer reason for the existing indexed adaptive page to exist: it does not merely describe an adaptive app, it gives a practical way to test whether weekly workout and meal changes are coach-like or just dashboard edits.
