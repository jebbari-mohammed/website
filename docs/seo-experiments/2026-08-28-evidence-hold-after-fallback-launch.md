# SEO Experiment: Evidence Hold After Fallback-Workout Launch

- **Date:** 2026-08-28
- **Decision:** no second public SEO change
- **Action class:** experiment protection / evidence-quality hold
- **Owner:** ChatGPT senior SEO lead

## First-party evidence available at decision time

The latest public-safe Search Console snapshot was still the run from 2026-08-27 and covered 2026-07-30 through 2026-08-26:

- 67 private query + landing-page rows;
- 97 impressions;
- 1 click;
- 1.03% aggregate CTR;
- 16 landing pages;
- 24 of 25 monitored URLs indexed;
- 0 URL Inspection API errors.

The current leading landing-page signals in that snapshot were the progressive-overload comparison (26 impressions), gym-accountability guide (13), broad best-AI-fitness-app page (12), workout-reminder guide (7 at average position 25.43), and workout-plus-meal-planning guide (7 at average position 48.57). The AI workout-generator feature page still held the site's first verified organic click.

No newer Search Console workflow run or safe snapshot was available when this decision was made. Therefore today's confidence in any new keyword, CTR, or ranking intervention was intentionally reduced rather than pretending yesterday's data was current.

## Same-day production change already shipped

Earlier on 2026-08-28, commit `1bdd073ba3125c044936dc13556a6856a43e9aa0` rehabilitated the existing English URL:

`/blog/fitness-app-with-fallback-workouts-busy-days`

The change converted a legacy quarantined/noindex page into an indexable support asset, rebuilt its title, description, visible copy, Article/HowTo/FAQ/Breadcrumb structured data, discovery surfaces, and contextual links, while leaving translated legacy copies quarantined. It also registered the page in the active experiment system through 2026-09-17, with preferred review on 2026-09-24.

Deterministic production validation for that commit passed 62/62 SEO tests, TypeScript/Vite production build, structured-data validation, legacy-content audit with zero high-risk indexable pages, critical-route and internal-link checks, sitemap validation with 258 indexable canonical URLs, and News sitemap validation. The optional Gemini smoke was skipped and was not needed.

## Live SERP review

Current fallback/busy-schedule results confirm that the intent exists, but the space is fragmented rather than dominated by one clear page format. Current examples emphasize several distinct solutions:

- adaptive plans that shorten or reshape sessions around schedule/equipment constraints;
- explicit "do not skip, switch" shorter-session logic;
- rolling plans that do not punish a missed calendar day;
- micro-workouts for very short time windows;
- recovery-aware or missed-session recalculation.

This supports the newly launched fallback-workout page's decision-framework angle, but does not create evidence for a second same-day page or rewrite.

## Opportunity shortlist

1. **Protect and measure today's fallback-workout rehabilitation — 9.7/10 — chosen.** A material, relevant search asset already launched today, is mechanically locked, and passed full production validation. The next useful evidence is Google's crawl/index state and early impressions, not another edit.
2. **Workout-reminder title/content improvement — 8.6/10 potential, 4.0/10 actionable today.** The page is the strongest current near-ranking non-branded URL at average position 25.43, but its August 24 material refresh is locked until 2026-09-14.
3. **Progressive-overload comparison refinement — 8.5/10 potential, 3.8/10 actionable today.** It leads the site with 26 impressions, but Google is still recorded as having crawled a version older than the August 16 rehabilitation and the page is locked until 2026-09-06.
4. **Interactive AI workout-generator investment — 8.3/10 potential, 3.5/10 actionable today.** The existing page produced the first organic click, but the sample is only three impressions and the current version is protected until 2026-09-16.
5. **Publish another new low-competition page — 5.8/10 today.** Rejected because first-party evidence is stale for the current morning and a substantial new search asset already launched today.

## Decision

Make no second public SEO change on 2026-08-28.

Do not change another title, H1, body, canonical, robots directive, schema package, sitemap target, or cluster URL merely to create daily output. Preserve attribution for the fallback-workout launch and all other active experiments.

Do not change the Search Console schedule again today either. The earlier-schedule reliability experiment was launched only on 2026-08-27; one delayed/missing morning is not enough evidence to redesign the cron again, and GitHub scheduled workflows are not exact-time guarantees.

## Hypothesis

Holding the site stable after a same-day material launch, when fresh first-party Search Console evidence is unavailable, will produce higher-quality learning and lower cannibalization/experiment noise than forcing another content publication.

## Baseline

- Latest available GSC: 97 impressions, 1 click, 67 query-page rows.
- Fresh same-day GSC snapshot at decision time: unavailable.
- Same-day material SEO launches before this decision: 1 fallback-workout rehabilitation.
- Active protected target URLs: 9.
- Additional public SEO mutations made by this decision: 0.

## Target metrics and decision rules

- Next successful Search Console health run should provide the canonical/index-state baseline for the fallback-workout URL.
- No unapproved edit should touch the fallback-workout target before 2026-09-17.
- If the fallback page is unknown/not crawled after a meaningful discovery window despite being in discovery files and linked contextually, investigate crawl/index architecture before changing copy.
- If it begins earning impressions, evaluate query fit and position before any title or body change.
- A new page tomorrow should be considered only if fresh evidence or SERP research identifies a clearly non-overlapping opportunity with higher expected value than the maturing URLs.

## Earliest reviews

- **Fallback technical/index review:** next successful Search Console health run.
- **Fallback title/snippet review:** 2026-09-10 only if meaningful impressions exist.
- **Fallback material rewrite:** no earlier than 2026-09-17 absent a documented exception.
- **Preferred fallback content decision:** 2026-09-24.

## Risks / limitations

The principal limitation is stale morning Search Console evidence: yesterday's report is reliable, but it cannot reveal changes from the newest reporting day. The counter-risk of doing nothing is missing a newly emerged opportunity for one day. Given the same-day material launch, nine active experiment locks, and several pages still awaiting recrawl/evaluation, that opportunity cost is smaller than the cost of overlapping experiments or publishing speculative content.
