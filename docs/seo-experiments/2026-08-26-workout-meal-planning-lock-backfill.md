# SEO Experiment Control: Protect Workout + Meal-Planning Rehabilitation

- **Status:** implemented
- **Control date:** 2026-08-26
- **Target URL:** https://youraicoach.life/blog/best-workout-app-with-meal-planning-included
- **Underlying experiment launch:** 2026-08-17
- **Action class:** experiment-control / attribution protection
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

The latest verified Search Console window covers 2026-07-29 through 2026-08-25 and reports 63 private query + landing-page rows, 91 impressions, 1 click, and 16 landing pages.

The target workout + meal-planning guide now has:

- 6 impressions;
- 0 clicks;
- 0% CTR;
- average position 52.83;
- Google URL Inspection verdict PASS / Submitted and indexed;
- last crawl 2026-08-22T08:09:57Z, which is after the 2026-08-17 rehabilitation.

At launch, the page had only 2 impressions. The early direction is therefore positive for visibility, but the sample is still too small for a content verdict.

## Confirmed control gap

The original August 17 experiment explicitly states:

- earliest useful ranking/content review: 2026-09-07;
- preferred first decision: 2026-09-16;
- do not materially rewrite before 2026-09-07 except for factual, safety, accessibility, canonical, rendering, indexing, or deployment corrections.

However, the page was absent from `config/seo-active-experiments.json`. That meant the repository's deterministic experiment guard could not enforce the documented cooldown.

## SERP check

Current results for workout + meal-plan app intent continue to split among:

- first-party product pages claiming combined workout and meal planning;
- comparison/editorial pages ranking multiple products;
- broader fitness-app lists where nutrition is a major selection criterion.

The stronger current pages make the selection job explicit: whether training and meal planning are actually connected, who the workflow fits, and how the user changes the plan when real life changes. This remains consistent with the August 17 FUEL-method rehabilitation. No new SERP evidence justifies replacing that framework before its evaluation window matures.

## Opportunity shortlist

1. **Protect the current meal-planning rehabilitation — chosen.** Strong current GSC visibility relative to its launch baseline, Google has recrawled the new version, zero cannibalization or content churn, immediate attribution protection.
2. **Rewrite or retitle the meal-planning guide now.** Rejected: only 9 days have elapsed and the page's own experiment forbids a material rewrite before September 7.
3. **Build a new workout + meal-planning URL.** Rejected: the existing URL already owns the intent and is gaining impressions; a second URL would create cannibalization risk.
4. **Expand the first-click AI workout-generator page into a full interactive tool.** High upside but rejected today because the first-click page was already protected this morning and one click is not enough evidence for a second material same-day investment.

## Chosen action

Add the target page to the machine-readable active experiment registry with:

- `launchedAt`: 2026-08-17;
- `lockUntil`: 2026-09-07;
- `preferredReviewAt`: 2026-09-16.

No public title, description, H1, body copy, canonical, robots directive, schema, sitemap URL, or internal link is changed.

## Hypothesis

Mechanically enforcing the original cooldown will preserve clean attribution for the August 17 rehabilitation and prevent another automation or PR from overwriting an early positive visibility signal before enough post-recrawl data exists.

## Baseline and target metrics

Baseline on 2026-08-26:

- launch impressions: 2;
- current impressions: 6;
- current clicks: 0;
- current average position: 52.83;
- Google state: submitted and indexed;
- latest crawl: 2026-08-22T08:09:57Z.

Targets:

1. Zero unapproved material edits before 2026-09-07.
2. Preserve indexability, self-canonicalization, sitemap discovery, and the current FUEL comparison framework.
3. Continue growing impressions above the 2-impression launch baseline.
4. Improve average position from the initial 57–78 observed query range as more data accumulates.
5. Evaluate clicks/CTR only after a meaningful impression sample exists.

## Expected direction

- Experiment attribution quality: increase.
- Overlapping edit risk: decrease.
- Public content churn: none.
- Cannibalization risk: unchanged.

## Review window

- **Material-edit lock ends:** 2026-09-07.
- **Preferred first content decision:** 2026-09-16.
- Earlier changes are limited to documented factual, legal, safety, accessibility, canonical, rendering, indexing, or deployment corrections.

## Risks

The primary risk is opportunity cost: a better title or page structure could theoretically exist before September 7. With only 6 impressions, that possibility does not outweigh the value of preserving a clean experiment whose post-rehabilitation version has only recently been crawled.
