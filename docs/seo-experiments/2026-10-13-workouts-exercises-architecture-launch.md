# 2026-10-13: Workouts Hub, 3-Day Dumbbell Workout Plan, Exercise Substitution Library & E-E-A-T Formula Documentation

## Summary

Executed the 6-step Fitbod competitive architecture roadmap within `youraicoach.life` governance rules, active experiment locks, and CI safety gates:

1. **Step 1 — Topic Hubs & Crawl Architecture (`/workouts/`, `/exercises/`):**
   - Created `public/workouts/index.html` (`https://youraicoach.life/workouts/`) with a 2-day to 5-day training split comparison table, an interactive **Weekly Split & Missed-Workout Rescheduler**, and contextual links across IZEM's workout planning cluster.
   - Connected unlocked hub and support pages (`public/glossary/index.html`, `public/1rm-calculator/index.html`, `public/workout-consistency-calculator/index.html`, `public/about.html`, `public/vs-fitbod.html`, `public/editorial-policy.html`, and `public/llms.txt`) to the new hubs without touching any file locked in `config/seo-active-experiments.json`.

2. **Step 2 — Pre-Rendered Programmatic Workout Entry (`/workouts/dumbbell-workout-plan/`):**
   - Created `public/workouts/dumbbell-workout-plan/index.html` (`https://youraicoach.life/workouts/dumbbell-workout-plan/`) targeting high-demand 3-day full-body dumbbell routine intent (`3 day dumbbell workout plan`, `dumbbell workout plan`).
   - Included pre-rendered Workout A, Workout B, and Workout C tables with exact sets, reps, rest intervals, no-bench floor alternatives, a 4-week double-progression protocol, a 45-minute missed-day B+C compression template, and an interactive **Dumbbell Session & Working-Weight Planner**.

3. **Step 3 — Exercise Substitution Cluster & Dual-Formula 1RM Upgrade (`/exercises/`, `/1rm-calculator/`):**
   - Created `public/exercises/index.html` (`https://youraicoach.life/exercises/`) featuring a 6-movement-pattern substitution matrix (knee-dominant, hip hinge, horizontal push, incline/vertical push, vertical pull, horizontal pull) and an interactive **Busy-Gym & Home-Gym Substitution Finder + Load Converter**.
   - Upgraded `public/1rm-calculator/index.html` (`https://youraicoach.life/1rm-calculator/`) to calculate both **Epley (1985)** and **Brzycki (1993)** 1RM estimates, a 60% to 95% working-weight table, and a 3-set warm-up progression ramp.

4. **Step 4 — E-E-A-T Methodology & Product-Fact Corrections (`/editorial-policy.html`, `/about`, `/workout-consistency-calculator/`, `/vs-fitbod`):**
   - Expanded `public/editorial-policy.html` with a mathematical formula and primary-citation table covering Epley (1985), Brzycki (1993), Mifflin-St Jeor et al. (1990), Morton et al. (2018) / ISSN protein ranges, and Schoenfeld et al. (2016, 2017) volume and frequency meta-analyses.
   - Removed legacy unverified `$24.99/month` exact price claims from `public/about.html`, `public/vs-fitbod.html`, and `public/workout-consistency-calculator/index.html` to comply with `data/brand/product-facts.json` (`exactPriceMustNotBeClaimed: true`).

5. **Step 5 — Technical & AI Discovery Hygiene (`og:image`, `llms.txt`, `robots.txt`):**
   - Created people-free (`objects-only-v1`) SVG social preview cards (`public/og/workouts-hub.svg`, `public/og/dumbbell-workout-plan.svg`, `public/og/exercises-hub.svg`) and added `og:image` metadata to the new routes plus `public/editorial-policy.html`, `public/about.html`, `public/vs-fitbod.html`, and `public/glossary/index.html`.
   - Added `/workouts/`, `/workouts/dumbbell-workout-plan/`, `/exercises/`, and `/1rm-calculator/` to `public/llms.txt` and added an `llms.txt` discovery comment to `public/robots.txt`.

6. **Step 6 — Storefront Readiness & Active Experiment Locks:**
   - Preserved `knownDeadUrls` store-link guards while the mobile app awaits live App Store and Google Play storefront release.
   - Added active experiment locks in `config/seo-active-experiments.json` through `2026-11-03` (`2026-10-27` for supporting internal-link/trust updates) while keeping all existing active locks unchanged.

## Four-Skill Workflow Verification

- **`seo-audit`:** Verified sitemap discovery, self-canonical tags, `og:image` coverage on all touched/created pages, JSON-LD graph validity (`CollectionPage`, `ItemList`, `Article`, `HowTo`, `WebApplication`, `FAQPage`, `BreadcrumbList`), and internal link crawl paths.
- **`seo-analysis`:** Verified private Search Console evidence from `jebbari-mohammed/website#34` (run `38378169286`, artifact `private-gsc-evidence-v1`, reporting window `2026-09-15` to `2026-10-12`, 173 exact rows across 26 distinct landing pages, 2 clicks, 582 impressions, average position 23.51) using the private vault decryptor in `/private/tmp` and deleted local plaintext immediately after inspection.
- **`seo-topic-research-pipeline`:** Qualified `3 day dumbbell workout plan` / `dumbbell workout plan` and `exercise substitution chart` against live SERP results, confirming strong task-completion gaps for missed-workout compression and equipment-to-equipment working-weight conversion.
- **`humanizer`:** Verified all new and updated HTML copy contains zero em-dashes or en-dashes in prose, no formulaic contrast clichés, no canned AI transitions, and no fabricated testing, credentials, or pricing claims.
