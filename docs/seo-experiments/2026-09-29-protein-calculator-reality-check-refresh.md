# Protein calculator reality check refresh - 2026-09-29

- **Target URL:** https://youraicoach.life/protein-calculator/
- **Action:** Existing-page improvement
- **Primary intent:** protein calculator
- **Secondary angle:** daily protein target, meal split, and weekly meal-planning review
- **Launch date:** 2026-09-29
- **Lock until:** 2026-10-20
- **Preferred review:** 2026-10-27

## Evidence used

- Public Search Console issue `jebbari-mohammed/website#34` was current for 2026-09-01 to 2026-09-28: 122 private query plus landing-page rows, 303 impressions, 2 clicks, 0.66% CTR, and 23.25 impression-weighted average position.
- Public-safe landing-page aggregate showed `/protein-calculator/` with 8 impressions, 0 clicks, and 67.00 average position.
- Exact query rows were not used because the private evidence vault was not mounted at `/Users/Apple/Documents/AI-Gym-Coach/.private-seo/gsc-evidence/vault.json`. The encrypted artifact metadata was verified from the GitHub artifact API, and the artifact was downloaded locally, but plaintext decryption was unavailable in this run.
- The stronger landing-page signals were mostly locked: `/features/ai-workout-generator`, `/best-ai-fitness-app`, `/blog/best-workout-app-with-meal-planning-included`, `/blog/best-accountability-app-for-gym`, `/blog/best-app-to-track-progressive-overload-automatically`, `/blog/personal-trainer-alternative-phone-call-accountability`, `/features/ai-voice-calls`, and `/tdee-calculator/`.
- The existing protein calculator was thin, metric-only, and used overconfident wording such as "exactly" while lacking source notes and a realistic meal-planning bridge. Improving it had cleaner expected value than launching another overlapping workout or meal-planning article immediately after several locked cluster changes.

## Candidate score

| Factor | Score | Notes |
| --- | ---: | --- |
| Search intent fit | 3.6 | Protein-calculator users are solving nutrition math, not necessarily buying coaching yet, but the next problem is meal execution. |
| Product uniqueness | 3.8 | IZEM can connect protein targets with meal planning, food scans, workout context, daily reviews, coach memory, and weekly adaptation. |
| Ranking difficulty | 2.2 | Broad protein-calculator SERPs are highly competitive and utility-led, but the existing URL is already discovered. |
| Traffic potential | 4.2 | Protein calculator demand is materially larger than a narrow long-tail blog variant. |
| Conversion potential | 3.1 | Some visitors will remain tool-only, but high-friction meal execution maps to IZEM's premium coaching value. |
| Internal authority | 3.5 | The tools hub already links to `/protein-calculator/`; the refreshed page now links into the nutrition and meal-planning cluster. |
| Linkability | 3.4 | The Protein Reality Check and meal-split output give outreach a useful planning hook. |
| Cannibalization risk | -0.2 | The existing canonical URL was preserved; no new protein URL was created. |

**Overall score:** 3.45/5

## What changed

- Replaced thin "exact protein" language with a safer range-first, meals-second positioning.
- Updated title, meta description, robots snippet settings, Open Graph, Twitter metadata, and `dateModified`.
- Added an object-only Open Graph image at `/og/protein-calculator.svg`.
- Added WebPage, WebApplication, FAQPage, and BreadcrumbList JSON-LD.
- Upgraded the calculator to support metric and imperial units, goal-based ranges, meals per day, eating pattern notes, anchor target, per-meal split, and copyable summary.
- Added the Protein Reality Check framework, a goal-range comparison table, safer scope boundaries, and food-first planning guidance.
- Added source notes for the National Academies Dietary Reference Intake baseline, the International Society of Sports Nutrition position stand, and USDA MyPlate protein-food guidance.
- Added contextual links from the page to `/tdee-calculator/`, `/macro-calculator/`, `/features/ai-meal-planner`, `/blog/food-scanner-app-with-meal-planning-and-workout-coaching`, `/blog/weekly-nutrition-check-in-template`, and `/blog/workout-day-meal-planner-app`.
- Added one support link from `/macro-calculator/` back to `/protein-calculator/` so adjacent macro-intent visitors can set a realistic protein floor before splitting the rest of the day.

## Hypothesis

Improving the existing indexed protein calculator will produce cleaner upside than launching a new nutrition post today. The refreshed page should earn better trust and future position-aware CTR by satisfying calculator intent while showing how IZEM turns a protein target into practical meal planning.

## Measurement

- Primary: `/protein-calculator/` impressions, clicks, CTR, and average position.
- Secondary: internal navigation from `/protein-calculator/` to meal-planning and IZEM AI coach pages.
- Guardrail: no medical nutrition claims, exact-outcome promises, or material rewrite before 2026-10-20 unless factual, safety, rendering, indexing, canonical, or deployment correction requires it.
