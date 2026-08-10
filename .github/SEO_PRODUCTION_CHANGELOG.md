# SEO Production Hardening Changelog

## 2026-08-10

- Replaced public Search Console query logging with private totals-only retrieval.
- Added expert expected-value scoring and semantic query clustering.
- Added live search research, separate critic pass, repair loop, and deterministic renderer gates.
- Migrated production generation to `@google/genai` and stable Gemini model fallbacks.
- Added private cooldown and experiment tracking.
- Added exact post-deployment marker verification.
- Replaced SVG social previews with validated PNG cards.
- Removed ungated daily comparison and mass-translation workflows.
- Replaced fake freshness mutation with a read-only audit.
- Made GitHub Pages deployment strict for schema, routes, links, artifact presence, and live HTTP checks.
- Added deterministic and credentialed end-to-end CI layers.
- Added deduplicated production health issues and recovery closure.
