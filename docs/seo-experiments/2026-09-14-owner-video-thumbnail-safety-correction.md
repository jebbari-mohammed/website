# Owner image-policy safety correction — video thumbnails

## Decision

Replace every unverifiable YouTube-hosted thumbnail used by the website with a self-hosted, people-free IZEM title card. This is a mandatory owner-safety correction, not a ranking-copy experiment.

## Evidence and scope

- The video catalog contains 51 dedicated watch pages.
- The existing video sync pipeline used `i.ytimg.com` thumbnails in visible blog cards, the video hub, watch-page social metadata, VideoObject markup, and the video sitemap.
- Those third-party images are mutable and were not individually verifiable under the owner requirement.
- The new generated artwork is 1280×720 SVG containing only geometric shapes, a dumbbell glyph, a play glyph, IZEM branding, and the video title. It contains no people, raster image elements, scripts, foreign objects, external image references, or data URLs.
- All 51 generated cards were rendered together and visually reviewed before publication; every card is people-free.

## Experiment-lock governance

Some pages carrying video cards are active SEO experiments. Their ranking copy, titles, H1s, canonicals, dates, structured-content semantics, and internal links are not being changed. The only protected-page difference is an exact remote YouTube-thumbnail URL to the corresponding self-hosted safe artwork URL.

The active-experiment guard receives a narrowly scoped safety override that accepts only this exact semantic no-op replacement. If any additional protected copy changes in the same file, normalization no longer matches and the guard still blocks the PR. Active lock definitions are unchanged.

## Hypothesis and measurement

**Hypothesis:** self-hosted, visually verified people-free video artwork will satisfy the mandatory owner image policy while preserving video discoverability and active SEO experiment attribution.

**Baseline:** 51 catalog videos relied on unverifiable third-party YouTube thumbnail URLs; the owner-image guard blocked only one known local photograph.

**Targets:**

- zero `i.ytimg.com` or `img.youtube.com` references in public HTML/XML;
- 51/51 catalog videos have unique self-hosted people-free artwork;
- deterministic video sync remains current;
- VideoObject/video-sitemap checks and production build remain green;
- no material organic visibility regression attributable to artwork replacement.

**Expected direction:** neutral ranking impact, materially lower publishing-policy risk.

**Earliest technical review:** immediately after CI/deploy.

**First search/media safety review:** 2026-09-21.
