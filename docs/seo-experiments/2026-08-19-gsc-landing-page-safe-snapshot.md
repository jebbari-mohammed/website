# SEO Experiment: Privacy-Safe GSC Landing-Page Aggregates

- **Status:** launched
- **Launch date:** 2026-08-19
- **Action class:** SEO observability / first-party evidence architecture
- **Owner:** ChatGPT senior SEO lead
- **User-facing content changed:** no

## First-party baseline

The latest successful Search Console health run for `main` covers 2026-07-22 through 2026-08-18 and returned:

- 31 private query + landing-page rows
- 42 impressions
- 0 clicks
- 0.00% aggregate CTR
- 83.24 impression-weighted average position
- 18 priority URLs inspected
- 10 indexed
- 8 neutral/unknown
- 0 URL Inspection API errors

The public-safe snapshot preserved only the site-wide aggregate and URL Inspection states. It did not preserve Search Analytics performance by landing page. As a result, the daily SEO strategist could tell that the site had 42 impressions but could not reliably tell which existing public URLs were receiving those impressions without decrypting the private exact-query envelope.

## Why this is the highest-value safe action today

A separate observability change already landed earlier on 2026-08-19, so another speculative content experiment would create unnecessary same-day churn. Several recent content experiments are also still inside their evaluation windows.

Exact Search Console queries should remain private, but public landing-page URLs are already crawlable. Aggregating performance by page lets the strategist prioritize URLs Google is already testing while continuing to withhold every query string and every query-to-page pair.

## Change

Extend the stable Search Console safe snapshot with a landing-page aggregate table, sorted by impressions and capped at the top 25 pages. For each public landing page, persist only:

- clicks
- impressions
- CTR
- impression-weighted average position

Do not include query strings. Do not include query-to-page pairs. Keep exact rows in the encrypted private evidence channel.

## Hypothesis

If the daily SEO strategist can reliably see page-level Search Console performance after every health run, it will make more evidence-backed choices between improving an existing visible URL and creating a new search entry, without weakening query privacy.

## Baseline

- Stable public-safe snapshot: yes
- Site-wide GSC aggregate: available
- URL Inspection states: available
- Search Analytics performance by landing page: unavailable
- Exact plaintext queries publicly exposed: 0

## Target metrics

1. The next Search Console health run updates issue #34 with landing-page clicks, impressions, CTR, and average position.
2. Exact query strings exposed in the safe snapshot: 0.
3. Query-to-page pairs exposed in the safe snapshot: 0.
4. The SEO strategist can identify the highest-impression existing pages from the stable snapshot without decrypting query evidence.
5. Existing Search Console health and URL Inspection checks continue to pass.

## Expected direction

- Page-level decision evidence: unavailable → available.
- Query privacy: unchanged at zero plaintext exposure.
- Time to identify an existing-page opportunity: lower.
- Speculative content decisions caused by missing page-level evidence: lower.

## Review window

- **Immediate technical review:** the first post-merge Search Console health run.
- **Operational confirmation:** the next scheduled Search Console health run on 2026-08-20 should update the same stable issue rather than create a second snapshot issue.
- Revisit the architecture only if query strings leak, the issue becomes too large/noisy, or the landing-page aggregates fail to match the private report totals.

## Risks

- Page-level impressions are business performance data even though the URLs themselves are public. The table is therefore capped at 25 pages and intentionally excludes all query text and query/page pairings.
- Small impression counts can be noisy. The table is evidence for prioritization, not proof that a page should be rewritten immediately.
- Average position is impression-weighted across the page's query rows and should not be interpreted as a single-keyword rank.
