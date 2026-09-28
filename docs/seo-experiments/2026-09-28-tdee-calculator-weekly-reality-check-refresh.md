# TDEE calculator weekly reality check refresh - 2026-09-28

- **Target URL:** https://youraicoach.life/tdee-calculator/
- **Action:** Existing-page improvement
- **Primary intent:** TDEE calculator
- **Secondary angle:** maintenance calories, weekly adjustment, and meal-plan calibration
- **Launch date:** 2026-09-28
- **Lock until:** 2026-10-19
- **Preferred review:** 2026-10-26

## Evidence used

- Public Search Console issue `jebbari-mohammed/website#34` was current for 2026-08-31 to 2026-09-27: 115 private query plus landing-page rows, 290 impressions, 2 clicks, 0.69% CTR, and 23.31 impression-weighted average position.
- Public-safe landing-page aggregate showed `/tdee-calculator/` with 5 impressions, 0 clicks, and 5.20 average position.
- Exact query rows were not used because the private evidence vault was not mounted at `/Users/Apple/Documents/AI-Gym-Coach/.private-seo/gsc-evidence/vault.json`. The public artifact metadata was read from issue #34, but plaintext decryption was unavailable in this run.
- Live SERP review showed highly competitive calculator results, including Calculator.net and TDEE.co, plus utility-first tools that combine TDEE, macros, and meal planning. The opportunity is not to out-scale those sites on formula breadth, but to improve the already-discovered IZEM page with a safer coaching angle: estimate first, calibrate second.
- Recent repo history had already added `/workout-generator-by-equipment/` on 2026-09-27, so adding another overlapping workout-generator asset this morning had lower expected value than improving an existing indexed nutrition tool.

## Candidate score

| Factor | Score | Notes |
| --- | ---: | --- |
| Search intent fit | 3.5 | TDEE intent is broad, but many users are trying to turn calorie math into a plan. |
| Product uniqueness | 3.8 | IZEM can connect calorie estimates with workouts, meal plans, food scans, day reviews, and weekly adaptation. |
| Ranking difficulty | 2.7 | SERP is competitive, but the existing page already has near-page-one public-safe visibility. |
| Traffic potential | 4.4 | TDEE calculator demand is materially larger than another narrow workout-generator variant. |
| Conversion potential | 3.4 | Some calculator users will stay tool-only, but meal-planning follow-through maps to IZEM's premium value. |
| Internal authority | 4.0 | The tools hub already links to `/tdee-calculator/`, and the page now links into meal-planning assets. |
| Linkability | 3.6 | The TDEE Reality Check is a useful framework for newsletters and meal-planning outreach. |
| Cannibalization risk | -0.4 | The existing canonical URL was preserved; no new calorie/TDEE page was created. |

**Overall score:** 3.6/5

## What changed

- Replaced thin "exact calories" language with a safer estimate-first, calibrate-second positioning.
- Updated title, meta description, robots snippet settings, Open Graph, Twitter metadata, and `dateModified`.
- Added WebPage, WebApplication, FAQPage, and BreadcrumbList JSON-LD.
- Upgraded the calculator to support metric and imperial units, activity levels, maintenance/deficit/surplus targets, BMR, TDEE, first target, copyable summary, and a low-target caution.
- Added the TDEE Reality Check framework and 2-3 week adjustment table.
- Added source notes for the Mifflin-St Jeor equation, NIDDK dynamic weight-planning research, and CDC gradual-change guidance.
- Added contextual links from the page to `/macro-calculator/`, `/features/ai-meal-planner`, `/blog/weekly-nutrition-check-in-template`, `/blog/workout-day-meal-planner-app`, and `/blog/best-workout-app-with-meal-planning-included`.

## Hypothesis

Improving the existing indexed TDEE calculator will produce cleaner upside than launching another top-level workout or meal page today. The refreshed page should earn better position-aware CTR and user trust by matching calculator intent while clearly explaining how IZEM turns the number into a weekly coaching loop.

## Measurement

- Primary: `/tdee-calculator/` impressions, clicks, CTR, and average position.
- Secondary: internal navigation from `/tdee-calculator/` to meal-planning and IZEM AI coach pages.
- Guardrail: no medical or exact-outcome calorie claims; no material rewrite before 2026-10-19 unless factual, safety, rendering, indexing, canonical, or deployment correction requires it.
