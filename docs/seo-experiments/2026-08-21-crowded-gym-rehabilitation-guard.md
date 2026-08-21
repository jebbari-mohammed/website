# SEO Experiment: Crowded-Gym Rehabilitation Guard

- **Status:** launched
- **Launch date:** 2026-08-21
- **Target URL:** https://youraicoach.life/blog/fitness-app-crowded-gyms-adapts-workout
- **Action class:** released-page monitoring and index observability
- **Owner:** ChatGPT senior SEO lead

## First-party baseline

The 2026-08-21 Search Console health run covers 2026-07-24 through 2026-08-20 and returned 38 private query + landing-page rows, 54 impressions, and 0 clicks. URL Inspection checked 22 priority URLs: 16 indexed, 6 neutral/unknown, and 0 API errors.

Earlier today the crowded-gym guide was materially rehabilitated from a legacy `noindex` page into an indexable, self-canonical search asset. The page was not yet in the released-rehabilitation live compliance set or the fixed URL Inspection priority list.

## Why this action won

A material content change already landed today, so another article or rewrite would create unnecessary experiment churn. The highest-confidence separate action is to protect and measure the page that was just released:

1. require the live URL to stay HTTP 200, indexable, self-canonical, free of legacy quarantine markers, and present in the sitemap;
2. trigger Live SEO compliance whenever the page changes;
3. make the URL a fixed Search Console URL Inspection priority so recrawl/index state is measured even before it earns impressions.

## Opportunity shortlist

- **9.6/10 — Guard and inspect today's crowded-gym rehabilitation.** Immediate safety and measurement value, zero cannibalization, low implementation risk, fast feedback.
- **8.8/10 — Further optimize the progressive-overload cluster.** It has the strongest current landing-page visibility (16 impressions), but the app guide and tracker are both inside active cooldown windows.
- **8.3/10 — Improve `/blog/workout-reminder-app-that-calls-you`.** It has 2 impressions at average position 57.5, but the sample is too small for a same-day content rewrite.
- **7.8/10 — Publish another new low-competition page.** Normally appropriate during cold start, but inferior after a material content rehabilitation already landed today.

## Hypothesis

Protecting and inspecting every released rehabilitation immediately after launch will reduce the chance that a later accidental `noindex`, canonical, quarantine, or sitemap regression silently erases the SEO work, while shortening the delay until we know whether Google has recrawled the new state.

## Baseline

- Crowded-gym released-page guard: absent.
- Crowded-gym fixed URL Inspection priority: absent.
- Latest site URL Inspection: 16/22 indexed, 6 neutral/unknown, 0 API errors.
- Target page's post-rehabilitation Google index state: not yet measured in the stable snapshot.

## Target metrics

1. Live compliance passes with the crowded-gym page included.
2. Search Console URL Inspection returns a state for the crowded-gym URL with zero API errors.
3. The target eventually changes to a current crawl/index state that reflects the rehabilitation.
4. No future accidental noindex/canonical/quarantine/sitemap regression survives a compliance run.

## Expected direction

- Protected released rehabilitations: 4 → 5.
- Fixed URL Inspection priorities: 19 → 20 before dynamic GSC-visible additions.
- API errors: remain 0.
- Target index state: unknown/stale → recrawled → indexed if Google accepts the page.

## Review window

- **Immediate technical review:** first post-merge Live SEO compliance and Search Console health runs.
- **Earliest useful URL Inspection review:** 2026-08-24.
- **Content cooldown remains governed by the underlying rehabilitation:** do not materially rewrite the page before 2026-09-10 unless correcting a factual, safety, accessibility, canonical, rendering, indexing, or deployment defect.

## Risks

- URL Inspection can show stale historical state until Google recrawls the page; this is measurement, not an indexing guarantee.
- The fixed list remains below the 25-URL cap, preserving room for dynamic GSC-visible landing pages.
- This action changes no page copy, title, description, canonical, robots directive, schema, or internal links.
