# Homepage FAQ structured-data remediation — 2026-09-05

## Decision

Remove the homepage `FAQPage` JSON-LD block because the nine marked-up questions and answers are not present in the user-visible homepage content.

## Evidence

- Fresh same-day Search Console evidence was not available at the SEO decision window, so ranking/content confidence is reduced.
- The latest verified Search Console snapshot (2026-08-07 through 2026-09-03) shows 91 private query+page rows, 167 impressions, 1 click, and 25/25 URL Inspection requests completed with zero API errors.
- Current `index.html` contained a nine-question `FAQPage` block.
- The homepage application route renders the product landing sections but no FAQ section, and repository search finds the homepage question text only in JSON-LD rather than visible homepage content.
- Google Search Central's general structured-data guidelines say not to mark up content that is not visible to readers.

## Hypothesis

Removing unsupported hidden FAQ markup will bring the homepage structured data into alignment with visible content, reducing structured-data policy risk without changing the page's visible copy, title, canonical, robots state, internal links, or search intent.

## Baseline

- Homepage: indexed.
- Homepage visible FAQ section: none.
- Homepage `FAQPage` JSON-LD: 1 block containing 9 questions.
- Latest verified sitewide Search Console totals: 167 impressions, 1 click, 0.60% CTR, weighted average position 50.43.
- Priority URL Inspection: 25/25 inspected, 22 indexed, 0 explicit not-indexed verdicts, 3 neutral/unknown, 0 API errors.

## Target metric / expected direction

Primary:
- zero homepage FAQ structured-data items that lack visible matching content;
- structured-data validation remains green;
- homepage remains indexable and self-canonical.

Secondary:
- no regression in production build, critical-route, link, sitemap, or deployment checks.

Expected direction: neutral ranking impact, lower structured-data compliance risk.

## Earliest review

- Immediate: deterministic CI and exact deployment smoke test.
- 2026-09-12: confirm homepage remains indexed and no structured-data/manual-action signal appears.

## Guardrail

Do not re-add `FAQPage` markup to the homepage unless the corresponding questions and answers are actually rendered for users and still comply with current Google structured-data guidance.
