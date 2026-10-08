# Homepage questions and entity consistency — October 8, 2026

## Scope and observed gaps

The homepage did not render a FAQ. Its Organization lacked the stable identifier already referenced by the product overview, and its application used an anonymous author node. The linked product overview retained an older exact-price statement and did not state the homepage's current store-review status.

The existing `llms.txt`, permitted crawler access, HTML/Markdown negotiation, distinct cache representations and real Markdown 404 responses already worked. This change preserves that release and serving architecture.

## Changes

- Add seven visible homepage questions about identity, workout adaptation, calls, nutrition, availability, coaching limits and the free generator. Keep answers in ordinary headings and paragraphs so they remain accessible without interaction and survive Markdown conversion.
- Use `src/content/homepage-faq.json` as the FAQ copy source for React, the static fallback and FAQPage markup. Run `node tools/sync-homepage-faq.mjs` after editing that data. The build rejects an unsynchronized fallback or schema. The experiment lock protects the shared copy and React component; the synchronization check also prevents independent changes to generated FAQ text in `index.html`.
- Connect the application, organization, website, homepage, software coaching service and FAQ through stable identifiers. Name the application consistently as **IZEM. Your AI Personal Trainer** and explicitly identify its SoftwareApplication and MobileApplication types.
- State the current store-review status in the product overview. Remove its unverified exact-price sentence while preserving storefront authority. The existing discovery guide continues to link to this canonical product page and the homepage's generated Markdown.
- Explicitly list `OAI-SearchBot`; keep existing crawler/training permissions unchanged.
- Record the real homepage modification date and synchronize both changed pages' sitemap dates. The homepage previously retained a July date despite later changes.

## Evidence and limits

Product statements come from the current first-party homepage, `data/brand/product-facts.json`, `public/llms.txt`, and the existing free generator. No reviews, downloads, exercise counts, results, scientific frameworks, store URLs or membership prices are invented.

The complete homepage and corrected product overview passed the owner's editorial and actual Sapling release gate before publication. Detector evidence remains private. A proposed discovery-guide rewrite is excluded from this change because its review could not be completed within the available provider capacity. The existing `llms.txt` remains unchanged. FAQPage markup describes the visible answers; it does not promise a Google FAQ rich result. Google retired that feature in May 2026. Google also says that llms.txt has no positive or negative effect on its search rankings.

Primary references:

- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/updates
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.google.com/search/docs/appearance/structured-data/software-app
- https://developers.openai.com/api/docs/bots
- https://schema.org/SoftwareApplication
- https://schema.org/Service

## Validation and review

Validate the source and built homepage with `tools/agent-metadata.test.mjs`. Checks require matching visible/schema answers, resolvable entity references, current availability, preserved product limits, valid local FAQ links and all seven Q&A pairs in generated Markdown. Use the existing build, JSON-LD, critical-route, link, sitemap, experiment and agent-response checks before release, then verify the live HTML and Markdown.

The measurable immediate outcome is consistent, accessible product answers across representations. No third-party GEO score or search-visibility uplift is claimed. Preserve the FAQ during a 21-day observation window, through October 29, except for documented factual, safety, rendering, indexing or deployment corrections. Review search performance only after recrawling and sufficient observations; a change in an external scanner score is not evidence of traffic growth.
