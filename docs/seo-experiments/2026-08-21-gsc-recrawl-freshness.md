# SEO Experiment: Search Console Recrawl Freshness

- **Status:** launched
- **Launch date:** 2026-08-21
- **Action class:** SEO observability / crawl-state interpretation
- **Owner:** ChatGPT senior SEO lead

## First-party baseline

The freshest Search Console safe snapshot covers 2026-07-24 through 2026-08-20 and contains 38 private query + landing-page rows, 54 impressions, 0 clicks, and 23 URL Inspection results. Seventeen inspected URLs are indexed and six are neutral/unknown.

Several released pages have a Google `lastCrawlTime` that predates a material source rehabilitation. Examples in the current snapshot include:

- `/blog/fitness-app-crowded-gyms-adapts-workout`: source materially updated 2026-08-21; Google last crawl 2026-07-09.
- `/blog/ai-personal-trainer-that-actually-works`: source materially updated 2026-08-13; Google last crawl 2026-07-08 and still reports the historical noindex state.
- `/blog/best-app-to-track-progressive-overload-automatically`: source materially updated 2026-08-16; Google last crawl 2026-07-21.
- `/blog/best-workout-app-with-meal-planning-included`: source materially updated 2026-08-17; Google last crawl 2026-07-28.

The previous safe snapshot exposed both source-independent URL Inspection state and `lastCrawlTime`, but required a human to infer whether Google had actually seen the current page version. That can make a stale inspection state look like a current indexing failure and encourage premature rewrites.

## Why this action won today

A material content rehabilitation for the crowded-gym guide already landed today. Another content change would create same-day experiment churn. The strongest GSC landing-page opportunities are also inside active cooldown windows, while the workout-consistency calculator remains inside its earlier discovery/internal-link evaluation window.

This change is non-overlapping, has zero cannibalization risk, improves every later SEO decision, and provides immediate feedback on whether an inspection state describes the current source version.

## Implementation

The public-safe Search Console snapshot now reads only source-backed modification dates from the checked-out page HTML (`article:modified_time` and JSON-LD `dateModified`) and compares them with Google URL Inspection `lastCrawlTime`.

Each inspected URL is classified as:

- **Crawl current** — Google crawled on or after the current source modification date.
- **Awaiting recrawl** — Google has a recorded crawl, but it predates the current source version.
- **Discovery pending** — the source has a modification date but Google has no crawl recorded.
- **Source date unavailable** — the page does not expose a defensible modification date, so the system refuses to guess.

The snapshot also reports aggregate counts for `Awaiting recrawl` and `Discovery pending`. No Search Console query strings or query-to-page pairs are exposed.

## Hypothesis

Explicit crawl-freshness classification will reduce false SEO interventions caused by stale URL Inspection state. In particular, a historical noindex or old page state will be recognized as `Awaiting recrawl` when Google has not yet crawled the rehabilitated source.

## Target metrics

1. Every monitored URL with reliable source modification metadata receives a deterministic crawl-freshness classification.
2. Known rehabilitations with pre-update crawls are labeled `Awaiting recrawl` rather than treated as current failures.
3. No exact Search Console query strings leak into the safe snapshot.
4. Future content changes are not triggered solely by an inspection state that predates the current source version.

## Expected direction

- False-positive indexing interventions: down.
- Time-to-understand recrawl state: down.
- Experiment integrity / cooldown adherence: up.
- Query privacy regressions: remain at zero.

## Review window

- **Immediate technical review:** first successful post-merge Search Console health run.
- **Operational review:** 2026-08-24, after another scheduled inspection cycle.
- Revisit the architecture only if source dates are missing/misclassified or a real production run shows incorrect freshness states.

## Risks and controls

- Source dates can be absent. The system reports `Source date unavailable` rather than inventing a date.
- Source dates can be day-granular. The classifier compares the published timestamp conservatively and does not claim that a stale crawl is an indexing failure.
- The change affects only observability output. It does not change page content, robots directives, canonicals, sitemap membership, redirects, or internal links.
