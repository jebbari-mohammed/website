# SEO Experiment: Personal Trainer Cost Calculator

- **Status:** launched
- **Launch date:** 2026-08-22
- **Action class:** new linkable search asset
- **Primary URL:** `/blog/personal-trainer-cost-calculator`
- **Owner:** ChatGPT senior SEO lead

## Evidence reviewed

The fresh public-safe Search Console snapshot in issue #34 covers 2026-07-25 through 2026-08-21 and reports 44 private query + landing-page rows, 64 impressions, 0 clicks, and 13 distinct landing pages. Exact private rows were not available locally because the Google service-account environment is not configured and the connected private decryptor/key for the encrypted GitHub artifact was not mounted in this workspace.

The strongest landing-page evidence remains:

- `/blog/best-app-to-track-progressive-overload-automatically`: 19 impressions, average position 70.21, awaiting recrawl after the 2026-08-16 rehabilitation.
- `/blog/best-accountability-app-for-gym`: 13 impressions, average position 90.00, still early and overlapping with another accountability page.
- `/blog/workout-reminder-app-that-calls-you`: 4 impressions, average position 36.25, current crawl state, but the 14-day title/snippet review window opens 2026-08-23.
- `/izem-ai-fitness-coach/`: 3 impressions, average position 6.00, too small for a title/CTR experiment.

Live SERP review for trainer-cost and trainer-alternative variants showed a split result set: trainer-facing pricing calculators, generic AI-vs-trainer posts, personal training app lists, and cost guides. Few results give the buyer a simple client-side calculator that uses the visitor's actual quote while explaining which coaching job a human trainer, online coach, basic app, or premium AI coach is suited for.

## Keyword scoring

Target: **personal trainer cost calculator**

| Factor | Score | Rationale |
| --- | ---: | --- |
| Search intent fit | 4 | The query is cost-led, but it strongly precedes a personal-trainer alternative decision. |
| Product uniqueness | 4 | IZEM's call-based accountability, day reviews, scans, meals, and weekly adaptation create a distinct comparison angle. |
| Ranking difficulty | 4 | Current results are fragmented between trainer-business calculators and broad AI-vs-trainer articles. |
| Traffic potential | 4 | The head term and adjacent variants have broader demand than niche feature queries. |
| Conversion potential | 5 | A visitor comparing monthly coaching cost can plausibly consider a premium app. |
| Internal authority | 4 | The product page and personal-trainer-alternative guide can link naturally. |
| Linkability | 5 | A private browser calculator and copyable comparison result are more referenceable than another opinion article. |
| Cannibalization risk | -1 | It overlaps lightly with human-trainer comparison pages, but the calculator intent is distinct. |

**Opportunity score:** 29/35.

## Chosen action

Published one new indexable blog asset: `/blog/personal-trainer-cost-calculator`.

The page includes:

- unique metadata, canonical, Open Graph, Twitter metadata, and article dates;
- Article, WebApplication, BreadcrumbList, and FAQPage JSON-LD;
- a client-side calculator with editable inputs and copyable result;
- the COACH fit test for comparing correction, outreach, adaptation, context, and habit support;
- careful safety and scope boundaries;
- natural IZEM positioning at around $24.99/month with annual plan as best value;
- internal links to the product page, call-based trainer alternative, workout reminder, adaptive plan, and Coach Loop guides.

## Video status

Local NotebookLM generation was attempted with `NOTEBOOKLM_POST_SLUG=personal-trainer-cost-calculator node tools/ai-marketing/daily-notebooklm-video.mjs`, but failed because the `notebooklm` CLI is not installed locally (`spawn notebooklm ENOENT`).

The GitHub workflow path exists as **Daily IZEM YouTube Video** and should trigger automatically on the push because this run adds one top-level English blog post. The workflow installs `notebooklm-py`, generates the NotebookLM video, uploads to YouTube when secrets are available, embeds it on the page, refreshes video pages, and triggers Pages deployment.

## Hypothesis

A buyer-facing calculator will earn more qualified organic visits and links than another generic "AI vs trainer" article because it helps the reader use their own trainer quote and then decide what support job they are actually buying.

## Review window

- Initial indexing and crawl check: 2026-08-24 or later.
- Do not materially rewrite the page before 2026-09-12 unless there is a factual, indexability, schema, or rendering defect.
- Evaluate title/snippet only after at least 14 days of Search Console evidence.

## Backlink hook

Pitch the calculator as: "Use your actual trainer quote, not a made-up average, then decide whether you are buying form correction, accountability, adaptation, or convenience."
