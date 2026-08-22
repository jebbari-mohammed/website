# SEO Experiment: Personal Trainer Cost Calculator Launch Guard

- **Status:** launched
- **Launch date:** 2026-08-22
- **Action class:** measurement / production SEO guard
- **Protected URL:** `/blog/personal-trainer-cost-calculator`
- **Owner:** ChatGPT senior SEO lead

## First-party evidence reviewed

The latest Search Console health run for 2026-07-25 through 2026-08-21 completed successfully with:

- 44 private query + landing-page rows;
- 64 impressions;
- 0 clicks;
- 13 distinct landing pages;
- 25 URL Inspection requests;
- 18 indexed URLs;
- 7 neutral/unknown states;
- 0 URL Inspection API errors.

The encrypted private report was authenticated and decrypted for this decision cycle. Exact query strings and query-to-page pairs remain private. The strongest current signals continue to be concentrated in the progressive-overload, accountability, workout-reminder, and branded IZEM clusters.

The workout-reminder page remains the strongest near-ranking non-branded candidate, but its current title/content experiment does not reach the earliest 14-day metadata review point until 2026-08-23. The progressive-overload and accountability pages are also inside active evaluation windows.

## Material change already made today

A separate SEO run published `/blog/personal-trainer-cost-calculator` on 2026-08-22, then the video workflow added a supporting YouTube asset and a follow-up commit corrected the video embed placement. Because a material search-entry asset already launched today, this cycle intentionally avoids another article, title test, or body rewrite.

## Live SERP review

Personal-trainer cost-calculator results are currently fragmented across:

- trainer-facing session-rate calculators;
- buyer-facing budget calculators;
- cost guides with embedded calculators;
- AI-trainer comparison calculators.

The strongest current pages make the calculation immediate and explain assumptions. Several competitors publish generic market ranges, while the new IZEM asset deliberately starts from the visitor's actual quote and keeps every price input editable. That is a useful differentiation and does not justify a same-day rewrite.

For exercise/workout reminder intent, current results are dominated by app-store listings and reminder-focused guides. The page-level GSC signal is promising enough to review tomorrow, but not strong enough to justify breaking the existing experiment window today.

## Opportunity shortlist

| Action | Score | Why |
| --- | ---: | --- |
| Add the new cost calculator to fixed URL Inspection and production SEO invariants | **9.4/10** | High-confidence measurement/protection action, no content overlap, immediate feedback, protects today's new asset. |
| Run a title/meta experiment on the workout-reminder page | **8.9/10 tomorrow; 7.1/10 today** | Strongest near-ranking non-branded signal, but the 14-day review window opens 2026-08-23. |
| Publish another new low-competition search page | **6.2/10** | A material content asset already launched today; another page would add experiment noise and URL growth without stronger evidence. |
| Rewrite the progressive-overload or accountability pages | **4.8/10** | Both are already earning impressions but remain inside active experiment/recrawl windows; changing them now would damage attribution. |

Scoring considered traffic upside, current GSC visibility, rank/CTR leverage, intent fit, business relevance, attainable competition, information gain, linkability, implementation cost, destructive/cannibalization risk, time-to-feedback, and confidence.

## Chosen action

Protect and measure today's new calculator instead of making another content change.

### Search Console monitoring

Add `/blog/personal-trainer-cost-calculator` to the fixed URL Inspection priority set. The 25-URL cap remains unchanged; the adaptive GSC-visible fill simply has one fewer slot until the site graduates another fixed experiment.

### Live production guard

Generalize the existing rehabilitation guard into a protected indexable-asset guard and add the calculator. The live check now requires the calculator to remain:

1. HTTP 200;
2. indexable (no `noindex` on robots or Googlebot);
3. self-canonical;
4. free of legacy quarantine markers;
5. present in the normal sitemap.

The compliance workflow now triggers whenever the calculator page changes.

## Immediate launch result

The post-merge Search Console health run `32593804761` completed and included the calculator in the fixed 25-URL inspection set with **0 URL Inspection API errors**.

The site-wide inspection state improved to **20 indexed / 5 neutral-or-unknown / 0 API errors**. For the new calculator specifically, Google currently reports:

- verdict: **NEUTRAL**;
- coverage: **URL is unknown to Google**;
- source modified: **2026-08-22**;
- last crawl: **none**;
- crawl state: **Discovery pending**.

That is the expected launch baseline for a same-day URL, not a reason to rewrite the page. The next decision should measure discovery and crawl progression rather than change content.

## Hypothesis

A new linkable calculator should not be materially rewritten before Google has had time to discover and test it, but its crawl/index state and critical SEO invariants should be observable immediately. Protecting the URL now will catch accidental noindex/canonical/sitemap regressions and give the next SEO cycle direct Google state without creating a second content experiment today.

## Baseline

- Calculator publication date: 2026-08-22.
- Search Console rows for the new URL: 0 expected at launch.
- Fixed URL Inspection coverage before this action: calculator absent.
- Live SEO invariant coverage before this action: calculator absent.
- First post-launch Google state: URL unknown to Google / no crawl recorded / discovery pending.
- Production source state: indexable, self-canonical, included in sitemap.

## Target metrics

1. The post-merge Search Console health run inspects the calculator with 0 API errors. **Achieved.**
2. The live compliance guard continues to enforce HTTP 200, indexable, self-canonical, quarantine-free, and sitemap-included state.
3. Google changes the URL from unknown/discovery state to crawled/indexed over the normal discovery window.
4. The calculator begins receiving impressions without cannibalizing the existing trainer-alternative guide.
5. No material content rewrite before 2026-09-12 unless a factual, rendering, canonical, schema, or indexing defect appears.

## Review window

- **Immediate technical review:** completed for fixed URL Inspection; production invariant guard is merged and active.
- **First discovery/index review:** 2026-08-24 or later.
- **Earliest title/snippet review:** 14 days after first meaningful Search Console impressions.
- **Earliest material content review:** 2026-09-12.

## Risks

- Fixed monitoring consumes one of the 25 URL Inspection slots, leaving four adaptive slots instead of five while all current fixed experiments remain active.
- A neutral/unknown URL Inspection result immediately after launch is normal and must not trigger a rewrite by itself.
- This guard verifies search invariants, not the calculator's business/conversion performance.

These are lower risks than making another content change today or leaving a newly launched search asset outside the site's production SEO protections.
