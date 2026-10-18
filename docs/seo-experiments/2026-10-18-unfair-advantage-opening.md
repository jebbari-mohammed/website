# Owner-requested replacement opening films and larger download action

Revision ID: `owner-unfair-advantage-opening-2026-10-18`
Kind: `owner-directed-presentation-revision`
Owner direction and source review date: `2026-10-18`
Baseline: `acd8987d70fc19d6b663c26523806a38b41bdfab`

The owner explicitly requested replacing the opening films with the supplied `izem-unfair-advantage-9x16.mp4` for phones and `izem-unfair-advantage-16x9.mp4` for laptops, and making the download button larger and more distinctive. This is an owner-directed presentation revision. No keyword selection, ranking-content rewrite, new search entry or Search Console performance inference is part of this change.

The opening uses new versioned media URLs, responsive posters and the existing format rule: portrait phones through 767px receive the 9:16 edit; landscape phones and wider screens receive 16:9. Both full sequences and soundtracks remain intact. MP4s retain 133.000 seconds of video and 133.100 seconds of audio/container duration at 30fps, using H.264 High, yuv420p, AAC and faststart. Desktop is 1600 × 900; mobile is 720 × 1280. The first authored frame supplies each lossless WebP poster. Complete framing remains visible with `object-fit: contain`.

The lime download action is 68px tall, with a smooth pill silhouette, clean 20px mixed-case typography, a lightweight download icon, a circular arrow affordance and subtle hover feedback that respects reduced motion. Narrow layouts give it a separate full-width row; short landscape layouts keep controls inside the viewport. Existing platform routing, accessible labels and download hooks are retained.

## Observation and review boundary

Original lock IDs, URLs, files, launch dates, lock deadlines, review dates and reasons are preserved. Append-only `ownerDirectedRevisions` identify the exact three protected-file transitions below. A separate new lock observes this revision until November 8, with review preferred on November 15. This intervention overlaps the earlier opening/download tests; subsequent engagement cannot be attributed solely to those releases. No ranking, traffic or conversion improvement is asserted.

The guard recognizes a second code-pinned owner revision. It requires matching committed documentation/configuration records in every covering lock and complete-file hashes. It keeps the previous revision intact and rejects replay, altered records, other source files, changed bytes and weakened original locks. No general approval flag or lock removal is introduced.

| Protected file | Base SHA-256 | Reviewed head SHA-256 |
| --- | --- | --- |
| `src/components/OpeningVideo.tsx` | `606adca1bcdefdcd5fccd47c0700d7eb33d3fec7c520340050ada748736614ef` | `c4cfbd972348b3211341e41a7e70b72d190edd5796c6f20bad00c918bcf090b4` |
| `src/components/StoreDownloadButton.tsx` | `942000023777c5e0a81d1925483cb9c0412336102b332846e6053f01f0d59a5e` | `ec59c36c783c110435002591950b4a4c70246632b30d4798be954f3ea12c07ca` |
| `src/components/StoreDownloadButton.css` | `95635f4db2cfa9d9bce11fef1c3bb180aa6d47f45847725c915bf914b787d21e` | `e7f4106c4dc0946b1370e06141e4cb59f58b906bde6dfd40f07c807b0dc65372` |

## Web assets

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/videos/intro/izem-unfair-advantage-desktop-v1.mp4` | 12,697,895 | `3e3b291ae9c0fa96b08d65cf8a76f723acae794e19f4aa028c828bf015207cb1` |
| `public/videos/intro/izem-unfair-advantage-mobile-v1.mp4` | 10,246,839 | `cc31f69026281bf7750e9d844f6cae5c8fafb8e8e583ab22184ae50292eccf79` |
| `public/images/intro/izem-unfair-advantage-desktop-v1.webp` | 16,794 | `29de69362ee131b802a908658e0d6fb7fb03f63c5a31b1d889ca45036411060b` |
| `public/images/intro/izem-unfair-advantage-mobile-v1.webp` | 20,472 | `979991ad62450b3a6da80bcbe3406eee0a0e6f2675f5a3e8a0978c1b8170cd82` |

Old versioned assets and their noindex rules remain available for cached clients. Each new asset has an exact `X-Robots-Tag: noindex` header and is registered as decorative media. Search-facing metadata, canonicals, structured data, discovery URLs, existing FAQ and store destinations retain their prior behavior.

## Verification

Both final MP4s passed full audio/video decode. Source contact sheets and responsive local previews were visually inspected. The final production build passed, including the existing opening-film, store-download, homepage-presentation and dedicated watch-page browser checks. Format selection, one initial video request, complete framing, autoplay fallback, sound activation, pause/replay/scroll/resize, slow/failed media, Save-Data, reduced motion and no-JavaScript fallback passed. Store routing checks passed for simulated Apple, Android, Windows and Linux profiles. Browser previews covered 320, 390, 768 and 1440px plus 480 × 320, 568 × 320 and 620 × 360 landscape edge cases; the enlarged action and all controls were visible without clipping or horizontal overflow.

Component lint and 50 experiment-guard regression tests passed. Source sitemap/video discovery were current. Built critical-route validation checked 485 pages and 10,644 internal links; built JSON-LD validation checked 492 blocks across 485 HTML files. The source link check passed for 474 pages and 10,459 links, recognizing only the two existing narrowly approved pending-store destinations. The existing dedicated-video release contract passed for all seven covered posts. MP4 atom checks confirmed that `moov` precedes `mdat` in both encodes.

The committed release guard validates the exact base/head transition, accepts only the three reviewed protected source transitions and the new launch lock, and preserves every prior lock definition. Publication and physical-device testing are separate from local browser validation; no public store availability is inferred from routing tests.
