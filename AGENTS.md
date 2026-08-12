# IZEM Repository Agent Policy

## SEO authority

The ChatGPT senior SEO lead is the strategy, research, implementation-review, and release decision-maker for `youraicoach.life`. GitHub is repository, CI, and deployment infrastructure only. GitHub Copilot, Gemini, and external LLM APIs are optional fallbacks and must never be required for a daily SEO decision, code review, approval, or release.

Read `config/seo-agent-policy.json` before doing SEO work.

## Cold-start default

Until at least 30 days of useful Search Console query/page data exist, the normal daily action is to create one new, indexable search entry targeting a new, low-competition, business-relevant intent. Across a representative month, aim for roughly:

- 65–75% new articles, landing pages, calculators, templates, checklists, or other search-entry assets.
- 15–20% discovery and architecture work such as internal links, hubs, sitemap/indexing fixes, and orphan-page repair.
- 10–15% technical, trust, conversion, or existing-page optimization work.

This is a portfolio target, not permission to publish filler. A no-change decision remains valid when no safe opportunity passes the gates.

## New-page gates

A new URL may be published only when all of these are true:

1. The intent is meaningfully different from every existing indexable IZEM URL.
2. Live SERP review shows attainable competition or a clear task gap.
3. The query is relevant to IZEM’s accountability, adaptive training, meal planning, coaching, or consistency value.
4. The page adds concrete information gain: a framework, decision tree, calculator, template, checklist, worked example, comparison method, original product explanation, useful table, or another real utility.
5. Claims are supportable, health language is careful, and no studies, prices, testing, testimonials, outcomes, or competitor details are fabricated.
6. The page is indexable, self-canonical, included in discovery files, linked contextually from relevant pages, and validated before release.

## Experiment discipline

- Make at most one material SEO change per day by default.
- Do not materially rewrite a newly published page for 21–30 days unless fixing an error or technical/indexing blocker.
- Allow 14–28 days for title/snippet experiments and 14–21 days for internal-link experiments.
- Never update the same page every day.
- Preserve recent experiments and unrelated newer work.
- Prefer a new non-overlapping keyword opportunity over repeatedly polishing a page that Google has not yet recrawled.

## Exceptions to the new-post default

Technical or existing-page work may win when it has clearly higher expected value, especially when deployment, indexability, crawlability, canonicalization, rendering, schema, safety, legal accuracy, or site-wide discovery is broken; when GSC shows a strong near-ranking or CTR opportunity; when a mature experiment needs evaluation; or when no new keyword passes the publication gates.

## Release safety

Review the diff yourself. Do not wait for Copilot or Gemini review. Run the relevant build, structured-data validation, sitemap checks, critical-route checks, internal-link checks, and live verification. Use a branch/PR for substantial, architectural, destructive, or uncertain changes; small safe changes may use the established direct-publish path.
