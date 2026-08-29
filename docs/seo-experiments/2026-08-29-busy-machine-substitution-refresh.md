# SEO Experiment: Busy-Machine Exercise Substitution Refresh

- **Date:** 2026-08-29
- **Target URL:** https://youraicoach.life/blog/workout-app-exercise-substitutions-busy-machines
- **Action class:** existing-page refresh / discovery support / recrawl observability
- **Owner:** ChatGPT senior SEO lead

## Evidence Used

The public Search Console handoff in issue #34 was current on 2026-08-29 and pointed to workflow run `33250898003`, encrypted artifact `private-gsc-evidence-v1`, 76 private query + landing-page rows, period 2026-08-01 through 2026-08-28, and public-key fingerprint `56ec78e9ac6187e930cbb4f9e0cea1dad84791287120ce9360a1afcb457352de`.

The private artifact was downloaded, authenticated, and decrypted in a private scratch directory. Row count, report period, query/page dimensions, and fingerprint matched the public handoff. Exact query rows were used only for private decisioning and were not copied into the public repository.

Safe aggregate observations:

- Progressive-overload and workout + meal-planning pages have the most visible current demand, but those targets are locked active experiments.
- Calls / voice reminder / day-review intent is ranking closer to page one, but its strongest URLs were refreshed within the active cooldown window.
- Equipment / scanning / substitution intent remains relevant to IZEM's product advantage and has multiple internal support pages.
- The busy-machine substitution URL had a clean refresh window since its July 29 update and was not previously earning enough Search Analytics visibility to enter the adaptive URL Inspection slots.

## Live SERP Review

Live SERP checks showed exercise-substitution demand split across focused busy-gym tools, equipment-aware strength apps, gym-exercise alternative lists, and broader adaptive workout products. Several current products make the task concrete: when equipment is occupied, they offer an immediate replacement rather than forcing the user to abandon or rebuild the workout. The useful content gap remains the decision quality of the replacement—preserving the job of the movement, not merely matching a muscle label.

## Opportunity Score

Keyword/action: **workout app with exercise substitutions for busy gyms**

- Search intent fit: 4/5
- Product uniqueness: 5/5
- Ranking difficulty: 4/5
- Traffic potential: 3/5
- Conversion potential: 4/5
- Internal authority: 5/5
- Linkability: 4/5
- Cannibalization risk: -1
- **Total: 28/40**

Higher-scoring near-ranking opportunities were rejected today because the target pages are locked active experiments and rewriting them would weaken attribution.

## Change

The refresh preserved the URL and existing video embed while updating:

- SEO title, meta description, Open Graph, Twitter metadata, H1, lead copy, Article headline, and `dateModified`.
- A new decision table separating one-machine substitution, equipment scanning, and whole-gym crowding intent.
- Contextual internal links to the equipment scanner and crowded-gym adaptation pages.
- Blog index discovery via a top-cluster card.
- Sitemap and RSS source files after regeneration.
- Active experiment lock through 2026-09-19, preferred review 2026-09-26.

The same-day senior review added measurement protection without changing the refreshed page:

- Added the target to fixed Search Console URL Inspection so its crawl/index state is measured even before it earns new impressions.
- Reallocated that fixed slot from the crawl-current, zero-current-impression `strength-training-after-40-guide`; adaptive GSC prioritization can still select that page if it earns visibility.
- Added the refreshed target to the live SEO compliance protected-asset set and workflow path triggers, requiring HTTP 200, indexability, self-canonicalization, quarantine clearance, and sitemap inclusion.

## Hypothesis

Making the page's title/snippet and above-the-fold answer match exercise-substitution intent, while clarifying boundaries with nearby equipment pages, should improve relevance for busy-gym substitution queries without cannibalizing the equipment scanner or broader crowded-gym guide.

The measurement extension tests a second hypothesis: direct URL Inspection plus live deployment guards will distinguish a normal post-refresh recrawl wait from a real indexability/canonical/deployment defect without requiring another content edit.

## Baseline and Target Metrics

- Site baseline: 114 impressions, 1 click, 76 private query+landing-page rows for 2026-08-01 through 2026-08-28.
- Target page: no public landing-page impressions in the current safe aggregate, so early success should be judged first by crawl/index state rather than ranking movement.
- Technical target: zero URL Inspection API errors; page remains indexable, self-canonical, sitemap-listed, and free of legacy quarantine markers.
- Recrawl target: Google records a crawl on or after the 2026-08-29 source modification.
- Search target after recrawl: relevant impressions begin or increase without obvious cannibalization of `/blog/gym-equipment-scanner-workout-app` or `/blog/fitness-app-crowded-gyms-adapts-workout`.
- Expected direction: crawl observability and relevant impressions up; deployment/indexability failures remain zero.

## Review Rules

Do not materially rewrite the target page before 2026-09-19 unless correcting a factual, legal, safety, rendering, indexing, canonical, or deployment issue.

- **Earliest crawl/index review:** next successful Search Console health run after the measurement change.
- **Earliest useful Search Analytics review:** 2026-09-12 if meaningful impressions exist.
- **Material rewrite lock:** 2026-09-19.
- **Preferred first content decision:** 2026-09-26.
