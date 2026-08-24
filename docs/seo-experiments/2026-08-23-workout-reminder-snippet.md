# SEO Experiment: Workout Reminder Snippet Alignment

- **Status:** invalidated by overlapping material refresh on 2026-08-24
- **Launch date:** 2026-08-23
- **Invalidated date:** 2026-08-24
- **Action class:** title/meta CTR and intent-alignment experiment
- **Target URL:** https://youraicoach.life/blog/workout-reminder-app-that-calls-you
- **Owner:** ChatGPT senior SEO lead

## First-party baseline

The private Search Console report for 2026-07-26 through 2026-08-22 contained 44 query + landing-page rows, 64 impressions, and 0 clicks across the site. The target URL had:

- **4 impressions**;
- **0 clicks**;
- **0.00% CTR**;
- **36.25 impression-weighted average position**;
- a best observed private query/page row near **position 11**;
- Google URL Inspection state **PASS / Submitted and indexed**;
- last crawl **2026-08-15T21:25:20Z**.

Exact private query strings and query-to-page pairs are intentionally not recorded in this public repository.

## Intended experiment

The page had been substantially updated on 2026-08-09. This experiment changed only search/social metadata on 2026-08-23 and intentionally left the H1, article body, canonical URL, robots directive, publication date, modification date, internal links, and URL structure unchanged.

Previous title:

`Workout Reminder App That Calls You: The Reminder-Fatigue Rescue Test | IZEM`

Experiment title:

`Workout & Exercise Reminder App That Calls You | IZEM`

The hypothesis was that plain-language workout/exercise reminder terminology would improve query-title alignment while preserving the “Calls You” differentiator.

## Why this experiment is invalidated

On 2026-08-24, before the earliest useful review date, commit `881dbbeeaf0cf9ec5567fbcf8df0bd255c11af71` materially refreshed the same URL. It changed the title, meta description, H1, visible body copy, FAQ content, structured-data headline/description, and modification date.

Because multiple variables changed one day after launch, any future movement cannot be attributed cleanly to the August 23 metadata-only treatment. The original test must therefore be marked invalid rather than presented as an active or conclusive experiment.

This was a process failure, not evidence that the original title treatment won or lost. The August 24 version becomes a new material-refresh baseline and is protected by the machine-readable active experiment lock.

## Original target metrics

1. Target URL remains indexed and self-canonical.
2. Impressions for the reminder-intent cluster increase from the 4-impression baseline.
3. Weighted average position improves from 36.25, or more private rows enter the top 30/top 20.
4. The URL earns its first organic click without a material loss of call-based intent coverage.
5. Google does not consistently rewrite the title into a less useful version after recrawl.

## Original review window

- Earliest technical/recrawl check: 2026-08-27.
- Earliest useful snippet/ranking review: 2026-09-06.
- Preferred first decision date: 2026-09-20.

These dates no longer govern the page because the material August 24 refresh reset the experiment clock. See the August 24 replacement experiment record and `config/seo-active-experiments.json`.
