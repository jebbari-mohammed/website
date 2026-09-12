# Free Workout Plan Generator launch — 2026-09-12

## Decision

Launch a new, genuinely interactive search-entry asset at `/workout-plan-generator/` instead of publishing another informational article or rewriting the protected `/features/ai-workout-generator` experiment.

## Evidence reviewed

- Fresh Search Console health run: 2026-09-12, reporting period 2026-08-15 through 2026-09-11.
- Public-safe site aggregate: 215 impressions, 1 click, 0.47% CTR, 23 landing pages, impression-weighted average position 32.80.
- Priority URL Inspection: 25/25 completed, 22 indexed, 0 explicit failures, 3 neutral/unknown, 0 API errors.
- The private exact-query handoff was verified against the encrypted artifact digest, key fingerprint, authenticated decryption, row count, dimensions, and reporting period. Exact queries and query-to-page pairs remain private and are not recorded here.
- The workout-generator cluster contains the site's strongest verified organic signal. The existing feature page is protected through 2026-09-16 and is not modified by this launch.

## SERP finding

Current results for free workout-plan-generator intent are utility-first. Multiple ranking pages let the searcher choose goal, equipment, training days, experience and/or session length, then return a complete plan with exercises, sets, reps, rest, and progression. That task is materially different from IZEM's existing feature explainer, beginner guide, and generator-vs-planner comparison.

Representative live results reviewed on 2026-09-12 included BodyBuddy, FitCraft, Simple Muscle, Lift, FORMA, Iron Works Fitness, GentleTools, FitnessGrid, and other no-signup plan builders.

## Hypothesis

A free browser-based workout-plan generator that solves the searcher's task immediately will create a new non-branded organic entry point and strengthen IZEM's workout-planning topical cluster without cannibalizing or rewriting the protected AI-workout-generator feature page.

## Baseline

- New URL: 0 impressions / 0 clicks at launch.
- Site-wide public-safe baseline: 215 impressions / 1 click / 0.47% CTR over the current 28-day Search Console window.
- Existing `/features/ai-workout-generator`: 38 impressions / 1 click / 2.63% CTR / average position 13.13 in the public-safe landing-page aggregate.

## Target metrics

Primary:
- Google discovers and indexes `/workout-plan-generator/`.
- At least 25 organic impressions and the first non-branded organic click within the first 28 days.

Guardrail:
- `/features/ai-workout-generator` should hold or improve its established visibility rather than lose impressions to the new utility page.

Secondary:
- New page earns impressions for workout-plan-builder / free-workout-plan-generator style intent and sends qualified internal traffic toward IZEM's adaptive workout-planning feature.

## Expected direction

Positive for total non-branded impressions, indexed search-entry coverage, and workout-planning topical relevance. Neutral-to-positive for the existing feature page if intent separation works as designed.

## Review window

- Earliest discovery/indexing review: 2026-09-19.
- Earliest useful ranking review: 2026-09-26.
- Preferred first 28-day decision date: 2026-10-10.
- Do not materially rewrite the new page before 2026-10-03 except for factual, safety, accessibility, canonical, rendering, indexing, or deployment corrections.

## Release design

The tool is deterministic and runs fully in the browser. It does not call OpenAI, Gemini, or another external LLM/API. It asks for goal, experience, training days, equipment, and session length, then generates a weekly split with exercises, sets, reps, rest guidance, and a progression rule. It explicitly labels itself as rules-based and links to IZEM's adaptive AI workout-planning feature for the ongoing-coaching use case.
