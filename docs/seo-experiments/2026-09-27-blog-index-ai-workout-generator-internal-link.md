# Blog Index AI Workout Generator Internal Link

Date: 2026-09-27

## Evidence

- Public Search Console issue `jebbari-mohammed/website#34` was current for the 2026-08-30 to 2026-09-26 reporting period.
- Public-safe aggregate: 107 encrypted private query plus landing-page rows, 273 impressions, 2 clicks, 0.73% CTR, and 23.39 impression-weighted average position.
- Highest-impression public landing page: `/features/ai-workout-generator` with 70 impressions, 1 click, 1.43% CTR, and 12.67 average position.
- The exact-query artifact metadata matched GitHub artifact ID `10926934463`, digest `sha256:22a79a6ec03dd37271d022bf2c0fad92ea1a0c8214a83f65b602c5daeb6fa851`, 107 rows, the 2026-08-30 to 2026-09-26 period, and public-key fingerprint `56ec78e9ac6187e930cbb4f9e0cea1dad84791287120ce9360a1afcb457352de`.
- Exact private query rows were not used because `/Users/Apple/Documents/AI-Gym-Coach/.private-seo/gsc-evidence/vault.json` was not mounted in this workspace. No exact query strings were guessed.
- `/features/ai-workout-generator` is locked through 2026-10-14, so the target page itself was intentionally left unchanged.

## Correction

An initial attempt placed this support link on `/tools/`, but CI correctly flagged that file as protected by the September 24 `/fitness-app-that-calls-you/` timing-picker experiment. The tools hub was restored to preserve that measurement window. The final public SEO action is the unlocked blog-index link below.

## Decision

Improve `/blog/` as the single morning SEO action. The blog index already clusters adaptive workout planning articles but did not give the strongest current landing page, `/features/ai-workout-generator`, a direct visible card inside that cluster.

## Change

- Added an "AI workout generator for adaptive plans" card to the adaptive-planning section of `/blog/`.
- Linked that card directly to `/features/ai-workout-generator`.
- Added a 21-day experiment lock for `/blog/`.

## Hypothesis

Clearer internal linking from the blog index will help Google and users connect adaptive-planning articles with IZEM's primary AI workout-generator feature, supporting impressions, average position, and position-aware CTR for `/features/ai-workout-generator` while preserving its active on-page experiment.

## Measurement

- Primary target: `/features/ai-workout-generator` impressions, clicks, CTR, and average position.
- Secondary target: `/blog/` impressions/clicks and internal navigation to `/features/ai-workout-generator`.
- Review no earlier than 2026-10-18; preferred review 2026-10-25.
