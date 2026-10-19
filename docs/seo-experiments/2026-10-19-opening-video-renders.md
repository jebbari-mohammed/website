# Owner-supplied replacement opening-video renders

Revision ID: `owner-unfair-advantage-renders-2026-10-19`
Kind: `owner-directed-presentation-revision`
Owner request date: `2026-10-19`
Baseline: `8ffbee775413ede909bbf7623f866386414b62f0`

The owner supplied updated portrait and widescreen renders and explicitly requested replacing the opening videos. The existing live-publication authorization continues to apply. This is a presentation intervention; it makes no new search-target, ranking, traffic or conversion claim.

The new web copies preserve all 3,990 video frames (133.000 seconds at 30fps), with complete framing and the full soundtrack. H.264 High 4.1, yuv420p, faststart, and AAC 128 kbps support the existing player. Desktop is 1600 × 900 and phone is 720 × 1280. Output audio/container duration is 133.013 seconds due to AAC padding. Matching first-frame WebP posters use quality 84 with sharp chroma conversion; both are smaller than their v1 counterparts.

Source fingerprints:

| Supplied render | Bytes | SHA-256 |
| --- | ---: | --- |
| `izem-unfair-advantage-16x9.mp4` | 47,341,355 | `bad8d27d39d73ccb38ab2cfa83b01ca05561672d56fca54e970bbd837b64cc7f` |
| `izem-unfair-advantage-9x16.mp4` | 48,849,918 | `affb02369cd7da9901cc3d0748b00eeedf1f4f2772a192377df9418a65910183` |

## Protected source transition

Only the two media references in `src/components/OpeningVideo.tsx` change from v1 to v2:

- Base SHA-256: `c4cfbd972348b3211341e41a7e70b72d190edd5796c6f20bad00c918bcf090b4`
- Reviewed head SHA-256: `ddb5b3d337cc17791b03e4c846dad5f9aac86a20468b6d94d0b6ae98d18c44ed`

Existing locks, dates, file lists, reasons and prior review records stay intact. An exact append-only revision record is added to every existing lock covering the source. The guard recognizes this single code-pinned transition and retains replay, hash, file-scope and lock-mutation rejection. A separate launch lock protects this replacement through November 9, with review preferred November 16. Overlapping owner interventions limit attribution to earlier tests.

## Web assets

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/videos/intro/izem-unfair-advantage-desktop-v2.mp4` | 11,578,074 | `3a11fa1cb0665ab5b0732b85e74ce0139dce522ec9ce990454bee2cf775e2dcc` |
| `public/images/intro/izem-unfair-advantage-desktop-v2.webp` | 15,082 | `11844c0ac61d76fb6e9e41d2820d228d3e1d64f1f6e87556695ef556086bf945` |
| `public/videos/intro/izem-unfair-advantage-mobile-v2.mp4` | 9,387,138 | `3a5217f2f0563e884927f0d378f38852146c4616561ae4cca47372eabb564021` |
| `public/images/intro/izem-unfair-advantage-mobile-v2.webp` | 19,748 | `30c213e6917e52f6a19579e1339b8766c87323e8172cd8649f219f1ca0cee6b5` |

Versioned URLs avoid stale cached video/poster responses. Old assets remain available for cached clients. All four new assets have exact Firebase noindex headers and decorative-media registrations. Player controls, responsive format selection, the download button, app-demo sources, mobile loading behavior, SEO copy, metadata and discovery contracts retain their existing behavior.

## Verification

Both MP4s passed full decode, frame-count/duration checks and faststart atom inspection. Source and web copies were visually compared at the same timestamp. The production build and responsive player/download checks passed. Agent tests: 122 passed with one explicit skip. Security tests: 95 passed, including 56 experiment-guard tests. The final compressed posters passed the opening-video browser suite again. Built critical-route validation covered 486 pages and 10,691 links; built JSON-LD validated 493 blocks across 486 HTML files. Source link checks covered 476 pages and 10,523 links. All 62 watch pages and 294 canonical sitemap URLs were current. The committed-diff guard is required before publication.
