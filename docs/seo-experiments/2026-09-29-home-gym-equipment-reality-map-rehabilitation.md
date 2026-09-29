# Home gym equipment reality map rehabilitation - 2026-09-29

- **Target URL:** https://youraicoach.life/blog/adaptive-workout-app-home-gym
- **Action:** Existing-page rehabilitation from noindex quarantine to indexable support asset
- **Primary intent:** adaptive workout app for home gym equipment
- **Cluster:** AI workout generator, workout generator by equipment, gym equipment scanner, fallback workouts
- **Launch date:** 2026-09-29
- **Lock until:** 2026-10-20
- **Preferred review:** 2026-10-27

## Evidence used

- Public Search Console issue `jebbari-mohammed/website#34` was current for 2026-08-31 to 2026-09-27: 115 private query plus landing-page rows, 290 impressions, 2 clicks, 0.69% CTR, and 23.31 impression-weighted average position.
- Public-safe landing-page aggregate showed `/features/ai-workout-generator` as the strongest page with 77 impressions, 1 click, and 12.43 average position. It also showed equipment-adjacent discovery on `/blog/gym-machines-vs-free-weights` and recently refreshed equipment/generator URLs.
- Exact query rows were not used because `/Users/Apple/Documents/AI-Gym-Coach/.private-seo/gsc-evidence/vault.json` was not mounted and no Google Search Console service-account environment variable was configured. The encrypted artifact metadata was read from issue #34, but plaintext decryption was unavailable in this run.
- Recent repo history showed the morning 2026-09-28 action refreshed `/tdee-calculator/`; the previous evening action launched `/workout-generator-by-equipment/`. The evening opportunity needed to support the winning equipment-aware workout cluster without editing locked winner pages.
- Live source review included Fitbod's equipment/gym profile documentation, Future's home-workout guidance, and Freeletics' home-workout guidance. The web search tool did not return a usable ranked SERP list in this run, so competition confidence is reduced and no exact SERP rank ordering is claimed.

## Candidate score

| Factor | Score | Notes |
| --- | ---: | --- |
| Evidence of demand | 3.8 | Public-safe GSC shows the AI workout-generator cluster as the largest current signal; home-gym equipment is an adjacent equipment-aware intent. |
| Low competition | 3.4 | The precise home-gym/equipment/adaptive-app angle appears less directly served than broad home-workout or equipment-list content, but the live SERP list was unavailable. |
| Product fit | 4.7 | IZEM's adaptive workout planning, equipment context, calls, day reviews, and weekly adaptation map directly to the problem. |
| Conversion fit | 4.1 | Home-gym users who keep rebuilding plans are plausible premium-app buyers. |
| Cluster fit | 4.5 | Supports locked `/features/ai-workout-generator`, `/workout-generator-by-equipment/`, and gym-equipment-scanner pages without editing them. |
| Linkability | 4.0 | The Home Gym Reality Map gives outreach a concise checklist/tool angle. |
| Cannibalization risk | -0.8 | Distinct from the equipment generator tool because this page targets choosing/evaluating an adaptive home-gym app; the generator tool builds a session from selected gear. |

**Overall score:** 4.0/5

## What changed

- Removed noindex/quarantine metadata and legacy editorial-review banner from `/blog/adaptive-workout-app-home-gym`.
- Replaced fabricated first-person/anecdote-style prose with a direct, product-reviewed guide.
- Reframed the page around the Home Gym Reality Map: gear, dependencies, load ceiling, setup friction, fallback sessions, and weekly adaptation.
- Added a browser-only checklist builder that outputs a copyable app-evaluation card.
- Refreshed title, meta description, canonical, robots, Open Graph, Twitter metadata, Article/FAQ/Breadcrumb JSON-LD, and `dateModified`.
- Added two deterministic local object-only SVG visuals under `/blog/assets/adaptive-workout-app-home-gym/` and pointed article/social image metadata to the approved local hero asset.
- Reattached the existing home-gym video card to the refreshed English source and synced generated video metadata, thumbnail text, video sitemap, and the video hub title away from the old "random gear" framing.
- Added contextual internal links from the rehabilitated page to `/features/ai-workout-generator`, `/workout-generator-by-equipment/`, `/blog/gym-equipment-scanner-workout-app`, `/blog/fitness-app-with-fallback-workouts-busy-days`, `/blog/best-fitness-app-for-beginners`, and `/features/ai-meal-planner`.
- Preserved locked winner pages by not editing `/features/ai-workout-generator`, `/workout-generator-by-equipment/`, `/blog/gym-equipment-scanner-workout-app`, `/blog/index.html`, or `/tools/`.

## Hypothesis

Turning the quarantined home-gym equipment URL into an indexable support asset will strengthen the equipment-aware AI workout cluster while keeping intent distinct from the active equipment-generator tool. The page should help Google understand the full path from "what gear do I have?" to "how should a coach adapt next week?"

## Measurement

- Primary: impressions, clicks, CTR, and average position for `/blog/adaptive-workout-app-home-gym`.
- Secondary: contribution to `/features/ai-workout-generator`, `/workout-generator-by-equipment/`, and equipment-aware cluster impressions.
- Guardrail: no material rewrite before 2026-10-20 unless factual, safety, rendering, indexing, canonical, or deployment correction requires it.

## Media-policy correction

The first pushed launch commit failed the content-integrity workflow because the strict object-only media policy requires at least two approved local article SVGs under `/blog/assets/...` and does not allow an `/og/*.svg` social image for strict articles. The follow-up commit is a deployment/content-integrity correction only: it adds the local deterministic SVGs, points the article and social metadata to the approved hero asset, wraps the attached video card in the established `IZEM_VIDEO_START`/`IZEM_VIDEO_END` release markers, and expands the lock file list to include those protected visuals. The active-experiment guard may report the protected target changed; this section is the reviewed governance exception for the release correction, not a second SEO experiment.
