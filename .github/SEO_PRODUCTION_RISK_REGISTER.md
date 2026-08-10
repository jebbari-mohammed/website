# SEO Production Risk Register

This file records the failure modes that the automated SEO production path must continue to defend against.

| Risk | Production control | Verification |
|---|---|---|
| Exact Search Console queries leak from a public repository or Actions log | Private report path, totals-only logging, irreversible query hashes | Credentialed CI smoke and workflow summary inspection |
| Missing or unauthorized GSC service account silently falls back to guessed demand | Fail-closed credential and non-empty row checks | `pnpm gsc:private` in production and credentialed CI |
| Expired/invalid Gemini model or key | Current `@google/genai` SDK, stable model/key fallback, live structured-output smoke | `pnpm seo:smoke:gemini` |
| Generic AI content is published | Live SERP research, separate critic pass, repair loop, deterministic information-gain/length/repetition/claim gates | Credentialed non-mutating publisher smoke |
| Overlapping pages cannibalize each other | Semantic clustering, expected-value gate, refresh preference, create cooldown, sibling suppression | Planner regression tests and private experiment state |
| Generated HTML introduces XSS or malformed markup | Strict tag allowlist, no generated links/attributes, balance checks | Sanitizer/idempotency tests plus production build |
| A refresh corrupts metadata or fakes freshness | Additive marked sections, snippet changes only on material CTR gap, dateModified only after substantive content change | Typed JSON-LD sync, schema validation, marker idempotency |
| Destructive merge/redirect loses links or unique content | `MERGE` remains advisory and cannot auto-publish | Action selector accepts only `CREATE` and `REFRESH` |
| New content deploys without discovery files | Rebuild blog index/RSS, synchronize sitemap, validate source and built artifacts | Strict production workflow and Pages deploy |
| GitHub Pages deploy is reported successful while live content is stale | Exact experiment marker polling after push | `verify-live-seo.mjs` |
| Multiple scheduled generators fight each other | One scheduled SEO publisher; comparison and mass-translation generators removed; freshness job is read-only | Workflow inventory review |
| Dependency resolution changes silently | Pinned Node/pnpm, committed lockfile, current action runtimes | CI bootstrap and strict build |
| Production failure is unnoticed | One deduplicated repository health issue is opened/updated and closed on recovery | Daily workflow failure/recovery steps |

No system can guarantee rankings or traffic. The production objective is to maximize expected organic value while bounding downside, preserving evidence, and making every change measurable.
