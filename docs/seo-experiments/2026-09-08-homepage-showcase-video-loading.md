# Homepage showcase video loading — 2026-09-08

## Decision

Reduce initial homepage media contention introduced by the September 8 redesign without changing ranking copy, metadata, canonicals, structured data, sitemap URLs, or active content experiments.

## Evidence

- The redesigned homepage added a below-the-fold interactive Product Showcase.
- Its initial workout/nutrition web video is 6,551,120 bytes (~6.55 MB) and was rendered with `autoplay` plus `preload="auto"`.
- `preload="auto"` permits the browser to download the whole media resource even before the user is expected to use it; the showcase is below the fold.
- Fresh Search Console evidence for 2026-08-11 through 2026-09-07 is healthy (202 impressions, 1 click, 101 private query+page rows), and separate material SEO changes already shipped today. This change therefore stays strictly technical and non-overlapping.

## Hypothesis

Deferring creation of the below-the-fold video element until its frame approaches the viewport will eliminate unnecessary initial media transfer for visitors who never reach the showcase and protect homepage loading performance after the redesign, while preserving the same visible showcase and CTA behavior once the section is reached.

## Baseline

- `ProductShowcase` video: mounted immediately with `autoplay` and `preload="auto"`.
- Initial source: `/videos/izem-workout-nutrition-dark-web.mp4` (~6.55 MB).
- Homepage redesign shipped on 2026-09-08.

## Change

- Gate the Product Showcase video with `IntersectionObserver` using a 320px root margin so the media element is not created until the section is near the viewport.
- Once mounted, use `preload="metadata"` rather than `preload="auto"`.
- Fall back to loading normally on browsers without `IntersectionObserver`.
- Keep the hero media behavior unchanged because it is above the fold.

## Target metrics

Primary technical target:
- no Product Showcase video request during initial homepage load while the showcase remains more than ~320px outside the viewport.

Guardrails:
- production TypeScript/build passes;
- homepage route and internal links remain valid;
- sitemap and structured-data checks remain green;
- no change to the indexable canonical inventory from this technical patch;
- no ranking-page experiment files are touched.

## Expected direction

- Lower initial transferred media bytes / bandwidth contention on homepage visits that do not reach the showcase.
- Neutral or improved LCP/INP/loading behavior; no expected ranking-content change.

## Review

- Immediate: PR CI and exact production deployment checks.
- Earliest field/performance review: 2026-09-15, allowing several days of post-redesign traffic and browser behavior.

## Risks

- The first frame may appear slightly later when a user scrolls very rapidly to the showcase; the 320px prefetch margin is intended to hide most of that latency.
- Browsers without `IntersectionObserver` intentionally retain the previous eager-loading behavior as a compatibility fallback.
