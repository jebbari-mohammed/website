# SEO Experiment: Body Progress Scanning Scorecard Refresh

- **Date:** 2026-08-31
- **Target URL:** https://youraicoach.life/blog/best-body-progress-scanning-app
- **Action class:** existing-page trust refresh / buyer-intent support asset
- **Owner:** ChatGPT senior SEO lead

## Evidence Used

The public Search Console handoff in issue #34 was current at the start of this run and pointed to workflow run `33332368346`, encrypted artifact `private-gsc-evidence-v1`, 83 private query plus landing-page rows, period 2026-08-02 through 2026-08-29, and public-key fingerprint `56ec78e9ac6187e930cbb4f9e0cea1dad84791287120ce9360a1afcb457352de`.

The connected private vault was not mounted at `/Users/Apple/Documents/AI-Gym-Coach/.private-seo/gsc-evidence/vault.json`, and no alternate `vault.json` path was found under `/Users/Apple`. Exact query rows were therefore unavailable for this run. This decision uses the public-safe landing-page aggregate, live SERP review, repository history, and local page inspection.

Public-safe observations:

- The site has 129 impressions and 1 click across the latest 28-day Search Console window.
- `/blog/best-body-progress-scanning-app` has begun receiving Search Console visibility, with 1 public-safe impression at a weak average position.
- The page was indexable and sitemap-listed, but its title, H1, OG text, video alt text, and JSON-LD still framed the article as a 2024 roundup.
- The old body-scan copy contained unsupported market leadership language, a fabricated first-person anecdote, and overconfident scanning/fitness outcome phrasing.
- The stronger call, workout-plus-meal, progressive-overload, fallback, and accountability URLs are protected by active experiment locks, so rewriting them today would contaminate cleaner tests.

## Live SERP Review

Live review for body progress scanning and body-scan app variants showed active current demand. Visible results include recent app-comparison pages for body scanning and measurement tools, progress-photo and body-measurement app lists, app-store listings for progress-photo trackers, AI body-scan comparison pages, and smart-scale comparison articles.

Most results focus on app lists, measurements, progress photos, or smart scales. The gap IZEM can own is the decision after the scan: whether the visual trend should change workouts, meals, reviews, or accountability timing.

## Opportunity Score

Keyword/action: **best body progress scanning app**

- Evidence of demand: 3/5
- Low competition / exact gap: 3/5
- Product fit: 4/5
- Conversion fit: 4/5
- Cluster fit: 3/5
- Linkability: 4/5
- Cannibalization risk: -1
- **Total: 20/30**

This is not the largest current cluster. It wins the evening slot because it combines first-party visibility with high trust debt on an indexable page, and it supports IZEM's broader scan/context/adaptation narrative without touching locked URLs.

## Change

- Rewrote `/blog/best-body-progress-scanning-app` around the **Scan-to-Coaching Scorecard**.
- Removed stale 2024 title/H1/social metadata.
- Removed fabricated first-person story, unsupported app rankings, unsupported precision language, and broad outcome claims.
- Added safer fitness trend framing, product limitations, privacy/setup evaluation criteria, and an explicit distinction between progress photos, measurement scanners, smart scales, and coach-connected scanners.
- Added Article, HowTo, FAQPage, and BreadcrumbList JSON-LD with 2026-08-31 modification metadata.
- Updated the OG card to match the new scorecard hook.
- Added a contextual internal link from `/features/body-scanning` to the refreshed buyer guide.
- Added an active experiment lock through 2026-09-21, preferred review 2026-09-28.

## Hypothesis

Refreshing the GSC-visible body-progress page should improve trust, relevance, and snippet quality for body progress scanning searches while giving outreach a practical framework to pitch. The scorecard differentiates IZEM from generic progress-photo and body-measurement roundups by showing why scan data matters only when it feeds workouts, meals, reviews, calls, and weekly adaptation.

## Target Metrics

- Target page remains HTTP 200, indexable, self-canonical, sitemap-listed, and free of legacy quarantine markers.
- Google recrawls the updated 2026-08-31 metadata.
- The target gains additional body-progress scanning impressions without replacing the separate `/features/body-scanning` product feature page.
- The page earns cleaner long-tail visibility around body progress scanning, body scan app, visual progress tracker, and coaching-context variants.
- Backlink outreach can use the Scan-to-Coaching Scorecard as a concrete pitch hook.

## Review Rules

Do not materially rewrite the target page before 2026-09-21 unless correcting a factual, legal, safety, rendering, indexing, canonical, or deployment issue.

- **Earliest crawl/index review:** next successful Search Console health run after deployment.
- **Earliest useful Search Analytics review:** 2026-09-14 if meaningful impressions exist.
- **Material rewrite lock:** 2026-09-21.
- **Preferred first content decision:** 2026-09-28.

## Same-Day Measurement Guard

A second material content edit is intentionally avoided on 2026-08-31. The separate technical action is to add this refreshed URL to the live SEO compliance protected-asset set and make future edits to the page trigger that check.

### Measurement hypothesis

If the refreshed page remains HTTP 200, indexable, self-canonical, sitemap-listed, and free of legacy quarantine markers while Google is given time to recrawl it, then any short-term ranking delay is more likely to be normal crawl/evaluation latency than a deployment or canonical defect.

### Measurement baseline

- Pre-refresh Search Analytics: 1 public-safe impression at a weak average position.
- Current source modification date: 2026-08-31.
- Page and feature-page intents are deliberately separated: the blog URL is a buyer/evaluation guide, while `/features/body-scanning` explains IZEM's first-party scanning feature and now links contextually to the guide.
- The Search Console URL Inspection system retains adaptive slots for GSC-visible landing pages, so this URL does not need to consume a new permanent fixed slot unless adaptive monitoring proves unreliable.

### Technical targets

- Live compliance: HTTP 200, indexable, self-canonical, sitemap-listed, quarantine-free.
- Future edits to `public/blog/best-body-progress-scanning-app.html` automatically trigger live compliance validation.
- Google recrawl date advances to 2026-08-31 or later without a canonical/indexing regression.
- No material body-progress content edit before the existing 2026-09-21 lock unless a documented exception applies.

### Earliest measurement review

- **Technical/live check:** immediately after this guard is deployed.
- **Google crawl-state check:** next successful Search Console URL Inspection run that includes the GSC-visible target.
- **Ranking decision:** unchanged — no earlier than 2026-09-14 for meaningful Search Analytics evidence, with the material-edit lock through 2026-09-21.
