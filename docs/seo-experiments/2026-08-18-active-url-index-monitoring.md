# SEO Experiment: Active URL Index Monitoring Expansion

- **Status:** launched
- **Launch date:** 2026-08-18
- **Action class:** technical SEO / measurement / crawl-index observability
- **Owner:** ChatGPT senior SEO lead
- **Affected system:** Search Console URL Inspection health check

## First-party evidence

The latest safely recoverable first-party baseline before this change is the 2026-08-17 Search Console health snapshot: 27 query+page rows, 37 impressions, 0 clicks for 2026-07-20 through 2026-08-16, with 5 of 11 monitored URLs indexed and zero URL Inspection API errors.

The current connected GitHub reader can inspect specific workflow runs and job logs when a run ID is known, but it cannot enumerate today's successful scheduled Search Console run or recover its private encrypted artifact from the current interface. Because today's freshest query-level evidence is not safely retrievable, this run deliberately reduces keyword confidence and does not publish or materially rewrite content.

A separate technical SEO fix already landed today (`74ddb6c514c64fe49eba8d69fb9acc0418fdb20c`) to stop synthetic publication dates in the blog archive/RSS. The monitoring expansion is non-overlapping: it changes no page content, metadata, canonical, robots directive, schema, sitemap target, or internal link.

## Decision

Expand the priority URL Inspection set from 11 to 18 URLs so the health workflow measures the active experiments that now matter most:

1. `/blog/best-accountability-app-for-gym` — prior private GSC evidence showed meaningful early visibility.
2. `/blog/best-app-to-track-progressive-overload-automatically` — rehabilitated 2026-08-16 after prior GSC visibility while quarantined.
3. `/blog/best-workout-app-with-meal-planning-included` — rehabilitated 2026-08-17 after prior GSC impressions.
4. `/blog/ai-workout-generator-beginners` — rehabilitated 2026-08-17 and protected by the released-state compliance guard.
5. `/blog/workout-accountability-calendar` — new interactive search asset launched 2026-08-14.
6. `/blog/weekly-nutrition-check-in-template` — new interactive search asset launched 2026-08-15.
7. `/blog/workout-accountability-checklist` — newest search asset launched 2026-08-17.

The existing 11 monitored URLs remain unchanged.

## Why this beats another content change today

Recent content experiments are still inside their evaluation windows. The live search landscape for the strongest previously observed cluster, progressive-overload apps, remains competitive and methodology-driven; the rehabilitated IZEM page should be allowed to recrawl and accumulate data before another rewrite. Measurement has higher expected value today because it tells us whether recent releases are unknown, discovered, crawled, indexed, canonicalized, or still showing stale historical states.

## Hypothesis

Monitoring every active high-value experiment will shorten the time between a Google crawl/index-state change and the next SEO decision, while reducing unnecessary rewrites made before Google has processed the previous version.

## Baseline

- Priority URLs monitored: 11.
- Indexed in latest safely recoverable snapshot: 5/11.
- Active recent search experiments missing from URL Inspection monitoring: 7.
- URL Inspection API errors in that snapshot: 0.

## Target metrics

1. Priority URLs monitored: 11 → 18.
2. Missing active experiments in the priority monitor: 7 → 0.
3. URL Inspection API errors remain 0.
4. Each recent rehabilitation/new asset obtains a recorded discovery/crawl/index state before its content review window.
5. Future SEO decisions can distinguish recrawl delay from ranking/intent problems.

## Expected direction

- Monitoring coverage: partial → complete for current active experiments.
- Time-to-feedback on discovery/indexing: lower.
- Premature content rewrites caused by unknown crawl state: lower.

## Review window

- **Immediate technical review:** Search Console health workflow after merge.
- **Earliest useful SEO review:** 2026-08-21, when the canonical-consolidation experiment reaches its first inspection checkpoint.
- **Next rehabilitation checkpoints:** 2026-08-23 through 2026-08-24 for progressive-overload and workout+meal pages.
- Do not materially rewrite recent pages solely because they are initially unknown/discovered; use their recorded experiment windows unless a real technical indexing defect appears.

## Risks

- URL Inspection reports Google's current indexed/crawled state, not a guarantee of ranking or future indexing.
- Very new URLs may remain unknown for several days without indicating a defect.
- The API set remains intentionally capped at 25 URLs per run; this change uses 18.
