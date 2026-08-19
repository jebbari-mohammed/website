# SEO Experiment: Persistent Public-Safe Search Console Snapshot

- **Status:** launched
- **Launch date:** 2026-08-19
- **Action class:** SEO observability / first-party evidence architecture
- **Owner:** ChatGPT senior SEO lead

## Evidence and problem

The Search Console health workflow already retrieves exact private query + landing-page rows, encrypts them for private review, and checks URL Inspection state. However, the connected GitHub reader available to the daily SEO lead cannot reliably enumerate scheduled workflow runs after they finish. Without a known run ID, the freshest aggregate and URL-level evidence can become inaccessible even though the workflow succeeded.

The current public workflow already prints aggregate row/index counts and per-URL index state in its logs, so preserving those same non-query signals in one stable issue does not weaken the existing privacy boundary. Exact query strings and query-to-page pairs remain encrypted and are never copied into the issue.

## Opportunity decision

This action beat a speculative new page today because the freshest exact Search Console run could not be safely recovered through the connected reader. Publishing a keyword page without that evidence would reduce confidence, while a stable safe snapshot improves every later decision and creates a durable pointer to the exact workflow run.

## Hypothesis

If every successful Search Console health check updates one stable public-safe issue with aggregate Search Analytics metrics, priority URL index status, and the exact workflow-run URL, the SEO lead will be able to recover the freshest first-party state on future runs without exposing private queries or depending on GitHub Actions run-list access.

## Baseline

- Search Console health workflow: scheduled and retrieving private evidence.
- Exact queries: encrypted/private.
- Stable post-run safe snapshot discoverable by issue search: **none**.
- Reliable run-ID pointer available to the connected daily SEO reader: **none**.
- Current monitored URL set: **18 URLs**.

## Target metrics

1. One stable issue titled `[SEO Observability] Latest Search Console safe snapshot` exists and is updated after every successful health run.
2. The issue contains reporting dates, private-row count, aggregate clicks, impressions, CTR, impression-weighted average position, URL Inspection totals, each monitored URL's verdict/coverage/last-crawl state, and the workflow-run URL.
3. The issue contains **zero plaintext Search Console query strings and zero private query-to-landing-page pairs**.
4. The normal Search Console health workflow remains green with zero URL Inspection API errors.
5. Future daily SEO runs can recover the latest run ID and safe evidence from issue search without guessing.

## Expected direction

- First-party evidence accessibility: intermittent after workflow completion → deterministic.
- Public query leakage: remains zero.
- Time spent reconstructing run IDs: reduced substantially.
- Confidence in future daily SEO decisions: increased.

## Validation and privacy guard

A deterministic unit test seeds unmistakable private query strings and private landing-page pairs, renders the safe snapshot, and asserts that those values never appear while aggregate metrics and configured URL Inspection rows do appear.

## Earliest review

- **Immediate technical validation:** first Search Console health run triggered by the merged workflow change.
- **Operational confirmation:** 2026-08-20 scheduled health run should update the same issue rather than create a duplicate.
- Revisit the architecture only if the issue fails to update, leaks a private query, or becomes materially insufficient for SEO decision-making.

## Risks

- GitHub issue API availability becomes one additional dependency of the health workflow; failure is intentionally surfaced instead of silently losing observability.
- Aggregate metrics and monitored URL index states remain visible in the public repository issue, but those categories are already exposed by the public workflow logs. Exact query evidence stays encrypted/private.
