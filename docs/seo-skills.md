# SEO skills integration

The owner authorized all four skills on October 5, 2026. They are installed locally, and the repository's `AGENTS.md` makes them part of complete SEO decision cycles. The ChatGPT senior SEO lead retains strategy, review and release authority.

## Installed versions

| Skill | Source | Pinned commit | Role |
| --- | --- | --- | --- |
| `seo-audit` | [Anthropic](https://github.com/anthropics/knowledge-work-plugins/tree/da38ec1ee89d41e5380e652a97382695003396e7/marketing/skills/seo-audit) | `da38ec1ee89d41e5380e652a97382695003396e7` | Technical, on-page, architecture and competitor review |
| `seo-analysis` | [Nowork](https://github.com/nowork-studio/notfair-plugin/tree/5094263b522165647789e9594406bb3ce096c5fe/seo/seo-analysis) | `5094263b522165647789e9594406bb3ce096c5fe` | Search Console, indexing and performance diagnosis |
| `seo-topic-research-pipeline` | [Swan](https://github.com/swan-gtm/gtm-skills/tree/3a9ca7fbc64f07b942b2f889c36c5c6dfb815384/skills/sam-dunning/seo-topic-research-pipeline) | `3a9ca7fbc64f07b942b2f889c36c5c6dfb815384` | Opportunity research and qualified content planning |
| `humanizer` | [Blader](https://github.com/blader/humanizer/tree/225a6f39ac85f76ee48dbad772ea4abe4ed6c9d8) | `225a6f39ac85f76ee48dbad772ea4abe4ed6c9d8` | Final editorial review |

Each local skill has an IZEM integration reference. Standalone installation also includes the audit connector reference and the analysis skill's shared preamble, business-context reference and connection documentation. Their relative links were repaired. The local `seo-installed-versions.json` manifest records source commits and hashes of the installed skill files.

## Decision cycle

Read `config/seo-agent-policy.json`, `config/seo-active-experiments.json`, recent experiments and the working-tree status. Preserve unrelated work. Identify today's completed material action before adding another.

Fetch the latest public issue #34, named encrypted workflow artifact and connected private vault manifest. Verify the artifact digest, key fingerprint, authenticated decryption, query/page dimensions, row count and reporting dates. Analyze exact rows only in an authorized private directory outside the public repository, then delete the plaintext. Keep exact query/page pairs and query-derived persona language out of persistent skill caches, external research tools and public reports. Report reduced confidence if verification fails.

Use `seo-audit` to inspect crawlability, canonicalization, metadata, structured data, internal links, mobile rendering and conversion routes. Use `seo-analysis` to interpret current evidence and distinguish an actual indexing blocker from an inspection result that predates the current page. Field Core Web Vitals and synthetic measurements should be reported separately.

Use `seo-topic-research-pipeline` to compare credible opportunities. The existing business is consumer fitness coaching; B2B roles, sales transcripts and company-size segments are optional source material. Verify demand and inspect live search results. Use the repository's 30/25/20/10/10/5 opportunity weights and its publication gates. The upstream 100-keyword minimum does not justify filler or speculative volume. Ahrefs is optional; use authorized evidence sources that are actually available and name missing metrics.

Use `humanizer` after research and fact-checking. Remove staged openings, repeated contrasts, forced symmetry and generic filler. Preserve citations, product availability, health qualifications and every supported fact. Never add invented testing, first-hand experience, testimonials or outcomes. Read the edited version again for factual drift and repeated cadence.

Review the diff and run the relevant build, sitemap, critical-route, link, structured-data and live checks. Respect existing evaluation windows. Rendering corrections should state the observed failure and verification separately from a material editorial experiment.

## Corrections to generic skill guidance

- Title character counts and minimum article lengths are heuristics. Google has no fixed limit on the length of a title element; visible title links are truncated to the available width. [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link).
- FAQ rich results stopped appearing on May 7, 2026. Google removed the feature documentation in June. Missing FAQ markup is therefore not a Google rich-result opportunity. Useful visible FAQs and valid semantic markup can remain. [Google documentation updates](https://developers.google.com/search/updates).
- HowTo rich results and the sitelinks search box are retired. Check current supported features before recommending markup. [HowTo changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes), [sitelinks search box retirement](https://developers.google.com/search/blog/2024/10/sitelinks-search-box).
- Multiple pages appearing for a query do not establish harmful cannibalization. Check intent, canonical ownership and current evidence before proposing consolidation. Redirects or deletions need a specific justification.
- Sparse impressions do not support a confident click-uplift forecast. Preserve recent experiments and allow recrawling before attributing a result to the new version.

The first combined review is recorded in [the October 5 audit](seo-audits/2026-10-05-skills-review.md).
