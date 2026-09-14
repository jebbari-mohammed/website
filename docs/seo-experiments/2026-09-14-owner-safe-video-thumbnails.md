# Owner-safe video thumbnail migration - 2026-09-14

## Decision

Replace every unverified remote YouTube thumbnail published by IZEM with a deterministic, repository-owned, people-free SVG thumbnail generated from typography and abstract geometric graphics.

## Evidence

- The owner requires every website/blog image to be visibly verified and modest; when uncertain, use people-free visuals.
- Repository search on 2026-09-14 found YouTube CDN thumbnail references across article video cards, the video hub, dedicated watch-page social metadata/schema, and the video sitemap.
- The generator itself emitted those remote URLs, so deleting individual references would not be durable.
- Google video documentation requires a crawlable thumbnail URL and supports SVG image files; this migration preserves a dedicated thumbnail URL per video instead of removing video thumbnail metadata.

## Change

- Generate `/youtube/<video-id>/thumbnail.svg` for every catalogued video.
- The SVG template contains only typography and abstract geometry; it embeds no photographs, raster images, remote resources, people, silhouettes, or screenshots.
- Re-render existing article video cards so legacy YouTube CDN thumbnails are replaced, not only new embeds.
- Keep `VideoObject.thumbnailUrl`, Open Graph/Twitter image metadata, and the video sitemap pointed at the new local thumbnail URL.
- Expand the owner-image CI guard to fail on `i.ytimg.com` or `img.youtube.com` references in published HTML/XML/JSON/SVG.

## Hypothesis and measurement

Hypothesis: local people-free thumbnails will bring every generated video-image surface under the owner's publishing policy while preserving video discoverability and rich-result eligibility.

Baseline: remote YouTube thumbnail references were present across the generated video surface before this migration.

Targets:
- zero YouTube CDN thumbnail references in published text assets;
- `video:check`, owner-image policy, structured-data validation, sitemap/link checks, and production build remain green;
- no material decline in indexed video/watch-page coverage attributable to the thumbnail migration.

Immediate technical review: 2026-09-14.
Earliest SEO safety review: 2026-09-21.
Preferred richer video-search review: 2026-09-28.
