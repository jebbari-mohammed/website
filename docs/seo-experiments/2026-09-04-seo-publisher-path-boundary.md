# SEO publisher path-boundary remediation — 2026-09-04

## Decision
Harden `resolvePublicFile()` so SEO automation can only resolve existing files inside the intended `public/` tree.

## Why this action today
A material internal-link SEO experiment already landed today, so another content/ranking change would reduce attribution quality. Fresh Search Console data is healthy and improving, which lowers the urgency of a second content intervention. A repository audit identified a separate automation-safety risk: the publisher normalizes/decodes URL paths and then maps them to filesystem paths without an explicit containment boundary.

## Hypothesis
If publisher file resolution rejects traversal segments and verifies both lexical and real filesystem containment, refresh automation cannot be coerced into selecting files outside the public site tree while normal public URL resolution continues to work unchanged.

## Baseline
- `resolvePublicFile()` decodes the normalized pathname and joins it to `publicDir`.
- No explicit `path.relative()` containment check existed.
- A double-encoded parent segment such as `%252e%252e` could become `..` by the time filesystem candidates were constructed.
- Normal extensionless and `.html` public URL resolution already had tests and must remain green.

## Target metrics
- Encoded parent traversal returns no file.
- Cross-platform backslash traversal returns no file.
- Existing valid public-file mappings remain unchanged.
- Full SEO production test/build/schema/link/sitemap validation remains green.
- No public ranking page, metadata, canonical, robots, schema, sitemap entry, or internal-link experiment changes.

## Expected direction
Automation safety improves with zero change to organic search inventory or ranking-page content.

## Earliest review
Immediate deterministic CI review before merge. Re-check on 2026-09-11 during the weekly technical SEO/security review to confirm no resolver regression or bypass surfaced.
