# SEO Experiment: Adaptive Workout and Meal Plan Rehabilitation

- **Date:** 2026-08-30
- **Target URL:** https://youraicoach.life/blog/adaptive-workout-and-meal-plan-app
- **Action class:** legacy noindex rehabilitation / supporting search asset
- **Owner:** ChatGPT senior SEO lead

## Evidence Used

The public Search Console handoff in issue #34 was current on 2026-08-30 and pointed to workflow run `33306987296`, encrypted artifact `private-gsc-evidence-v1`, 79 private query + landing-page rows, period 2026-08-02 through 2026-08-29, and public-key fingerprint `56ec78e9ac6187e930cbb4f9e0cea1dad84791287120ce9360a1afcb457352de`.

The encrypted artifact was downloaded and decrypted through the connected private vault path in an authorized scratch directory. Fingerprint, AES-GCM authentication, query/page dimensions, row count, and reporting period matched. Exact query rows were used only for private decisioning and were not copied into this public repository.

Public-safe observations:

- Workout + meal-planning intent is one of the stronger current clusters by average position and is protected by an active lock on the primary comparison page.
- Calls / voice intent is closer to page one, but the best call-reminder URL is locked through 2026-09-14 and should not be given an overlapping checklist page yet.
- The adaptive workout-and-meal URL already had contextual internal links from relevant IZEM pages, useful product fit, a video block, and a clear angle, but remained excluded from search by legacy quarantine tags.
- Rehabilitating this URL creates one distinct supporting asset without rewriting the locked workout + meal-planning comparison page.

## Live SERP Review

Live SERP review showed the workout-and-meal-plan space is active but not fully answered by the exact IZEM angle. Current visible pages include Strongr Fastr's combined workout and meal planner, TRL/ACTIVE's workout-app-with-meal-planning article, Apple's TrainAI listing, and Budy's AI workout-and-meal planner page. The common pattern is plan generation plus nutrition targets. The gap IZEM can own is what happens after the plan drifts: missed sessions, messy meals, busy gyms, proactive calls, day reviews, and weekly adaptation.

A second same-day review found the broader live market continuing to emphasize connected workout + nutrition workflows and adaptation rather than static one-time plans. Current examples include Rizin's weekly Autopilot adjustments, Lumer's next-day adaptation after logged reality, Milo's plan changes after skipped sessions or messages, and FitRoutine's workout + meal + recovery planning. This supports measuring the newly rehabilitated Plan Drift Audit rather than publishing another overlapping page today.

## Opportunity Score

Keyword/action: **adaptive workout and meal plan app**

- Evidence of demand: 4/5
- Low competition / exact gap: 4/5
- Product fit: 5/5
- Conversion fit: 5/5
- Cluster fit: 5/5
- Linkability: 4/5
- Cannibalization risk: -1
- **Total: 26/30**

The primary workout + meal-planning page remains protected. This page is framed as a Plan Drift Audit, not another best-app comparison, so it supports the cluster while preserving the active experiment.

## Change

- Removed legacy `noindex` / Googlebot noindex tags and quarantine messaging from `/blog/adaptive-workout-and-meal-plan-app`.
- Updated title, meta description, robots, Open Graph, Twitter metadata, Article metadata, and `dateModified`.
- Reframed the hook from a generic adaptation checklist to the **Plan Drift Audit**.
- Added trust language, author/about/editorial-policy references, safe fitness/nutrition boundaries, and a clearer distinction from the locked best-app comparison page.
- Added a contextual source link from `/features/ai-meal-planner` to the rehabilitated page.
- Refreshed the OG image to match the Plan Drift Audit hook.
- Added an active experiment lock through 2026-09-20, preferred review 2026-09-27.

## Same-Day Measurement Guard

Because this rehabilitation removed a legacy `noindex`, the most valuable second action today is technical measurement rather than another content change.

- Added the target URL to the fixed Search Console URL Inspection set so its pre/post-rehabilitation Google crawl state is measured even before it earns Search Analytics impressions.
- Reallocated the fixed slot from `/blog/weekly-nutrition-check-in-template`, which is crawl-current and has no current landing-page impressions. It remains indexable and can re-enter inspection automatically through adaptive GSC prioritization if it gains visibility.
- Added the target URL to the live SEO compliance protected-asset set. It must remain HTTP 200, indexable, self-canonical, free of legacy quarantine markers, and present in the sitemap.
- Added the target file to the compliance workflow trigger so a future regression to `noindex`, wrong canonical, quarantine markup, or sitemap exclusion is checked after deployment.

This measurement change does not alter the target page's title, H1, copy, schema, canonical, robots directive, internal links, or experiment lock.

## Post-Change Measurement Baseline

The first post-guard production checks completed successfully on 2026-08-30:

- Live SEO compliance passed **40/40** checks on the first attempt. The adaptive page returned HTTP 200, was indexable, self-canonical, quarantine-free, and present in the sitemap.
- Search Console health run `33332368346` retrieved **83 private query + landing-page rows, 129 impressions, 1 click**, period 2026-08-02 through 2026-08-29, and completed URL Inspection with **0 API errors**.
- Direct URL Inspection for the adaptive page returned **NEUTRAL — URL is unknown to Google — no crawl recorded**.

Because the live page is technically healthy and was only made indexable earlier the same day, this is classified as **discovery pending**, not a technical indexing failure. Do not respond with another rewrite, canonical change, or additional speculative SEO URL. The next decision depends on whether Google discovers/crawls the current version during the protected experiment window.

## Hypothesis

Publishing the adaptive workout-and-meal support asset should help Google understand IZEM's combined coaching cluster while giving backlink outreach a clearer non-comparison hook. The page should earn impressions adjacent to workout + meal planning and adaptive-app intent without materially cannibalizing `/blog/best-workout-app-with-meal-planning-included`.

The measurement hypothesis is that direct URL Inspection plus live compliance guards will distinguish normal recrawl lag from a genuine indexing/canonical regression without contaminating the content experiment.

## Target Metrics

- Target page remains HTTP 200, self-canonical, indexable, sitemap-listed, and free of legacy quarantine markers.
- Google crawls the post-rehabilitation version after 2026-08-30.
- URL Inspection completes with zero API errors and reports the target URL directly.
- Relevant impressions begin without a drop in the locked workout + meal-planning comparison page.
- Internal-link flow from the meal-planner feature page and existing cluster links supports discovery.

## Review Rules

Do not materially rewrite the target page before 2026-09-20 unless correcting a factual, legal, safety, rendering, indexing, canonical, or deployment issue.

- **Earliest crawl/index review:** next successful Search Console health run after deployment.
- **Earliest useful Search Analytics review:** 2026-09-13 if meaningful impressions exist.
- **Material rewrite lock:** 2026-09-20.
- **Preferred first content decision:** 2026-09-27.
