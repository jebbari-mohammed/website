# Owner-requested mobile performance correction

Revision ID: `owner-mobile-performance-2026-10-18`
Kind: `owner-directed-presentation-revision`
Review date: `2026-10-18`
Published Git base: `acd8987d70fc19d6b663c26523806a38b41bdfab`
Unpublished pre-correction branch: `15138b5de4ecbb0507bfb5c1ffc69a529cfe5a1c`

The owner requested inspecting the open mobile and desktop analytics and fixing phone performance while preserving the desktop experience. This is a measured delivery/runtime correction, with no keyword selection, page-copy rewrite, Search Console inference or ranking claim.

## Evidence inspected

The open [mobile PageSpeed report](https://pagespeed.web.dev/analysis/https-youraicoach-life/mo6oo4nasq?form_factor=mobile) and [desktop report](https://pagespeed.web.dev/analysis/https-youraicoach-life/y8q4ivpnj8?form_factor=desktop) were captured October 17 at about 20:33 Pacific. Mobile scored 85 with FCP 3.0s, LCP 3.6s, TBT 0ms and CLS 0.009; desktop scored 99 with FCP/LCP 0.7s. Neither report had CrUX field data. Their production artifact predates this branch's new films, button and demo trims, so those scores are not a directly comparable pre/post experiment for the new source.

The mobile report identifies render-blocking Google font CSS plus two local stylesheets; an uncompressed document; oversized logo/posters; and an opening-film poster as LCP. Direct production GET probes confirmed 91,801-byte HTML without Content-Encoding for identity, gzip, Brotli and browser Accept-Encoding on both cache MISS and HIT. Local compression of those exact bytes demonstrated a real delivery gap. Source/runtime inspection also found an eager, high-priority screenshot below the opening viewport and a showcase loop that continued playing offscreen.

## Implementation

- The homepage now defines the same Hanken Grotesk normal variable face locally, with Latin/Latin-ext subsets, swap behavior and its OFL license. Unused remote families and external font preconnects are removed from the homepage. This follows [Chrome's render-blocking guidance](https://developer.chrome.com/docs/performance/insights/render-blocking) without changing visible typefaces.
- The public homepage function precomputes Brotli/gzip/identity buffers once, negotiates supported content coding and retains separate HTML/Markdown representations. Content length and strong ETags reflect encoded bytes; Vary retains Accept and adds Accept-Encoding. Cache policy, security headers, aliases, HEAD, conditional responses and error priorities remain intact. This addresses [Chrome's uncompressed-document insight](https://developer.chrome.com/docs/performance/insights/document-latency).
- New v3 posters retain the 800×1260 composition and use high-quality WebP. Visual comparisons at phone and desktop display sizes preserve readable app text. The navigation logo uses a 96px WebP at its existing 32–34px display size. These three image transfers total 139,466 bytes instead of 401,772 bytes, saving 262,306 bytes (65.3%). Original assets remain available; new posters have exact noindex rules, version hashes and media registration.
- The below-fold Hero still uses lazy loading and automatic priority, including its prerender fallback. The opening poster remains discoverable in initial HTML with high priority.
- App demos preload near the viewport, start when visible, pause offscreen/background and resume their current position. Source changes and pending playback promises are guarded. The requested immediate-motion trims, posters, frame composition, playback controls, store routing and desktop design remain in place.

## Matched local measurements

Lighthouse 13.5.0 used a fresh isolated Chrome for Testing 148 profile each run. Mobile used the default Moto G Power emulation: 412×823 at DPR1.75, simulated Slow 4G (150ms RTT, 1638.4Kbps throughput) and 4× CPU slowdown. Three runs per variant ran sequentially without build/test CPU contention; the table uses medians. Desktop used Lighthouse's desktop preset for one comparison per variant.

Both variants served immutable copies of the actual built HTML and assets through the same local delivery harness, with identical compressed static-asset handling. The baseline used the original raw homepage handler; the corrected build used the new compression handler. The harness does not reproduce Firebase network distance, production cold starts/cache behavior or physical phones. Original public PageSpeed scores and these local runs must not be presented as the same sample.

| Mobile metric | Pre-correction | Corrected |
| --- | ---: | ---: |
| Performance | 83 | 94 |
| FCP | 2.27s | 1.97s |
| LCP | 4.28s | 2.80s |
| TBT | 2.5ms | 17.0ms |
| CLS | 0.01542 | 0.01526 |

Desktop performance was 99 before and 100 after; LCP changed from 0.91s to 0.57s. The corrected document-latency audit confirms text compression. A local Brotli response for the 92,257-byte corrected homepage transferred 16,676 body bytes. The baseline artifact was 91,954 raw bytes. Remaining CSS requests and mobile LCP around 2.8s are still measurable; no perfect mobile score or passed real-user Core Web Vitals is asserted.

## Review pins and observation

Prior locks retain their definitions and existing revision records. Append-only records identify these exact three cumulative source transitions in every covering lock; the new performance lock observes affected source/assets until November 8, with review preferred November 15. ProductShowcase's cumulative reviewed transition includes the earlier, still-unpublished trim as well as this playback correction. The earlier trim record remains historical and does not authorize different final bytes.

| Protected source | Published base SHA-256 | Reviewed final SHA-256 |
| --- | --- | --- |
| `src/components/Hero.tsx` | `6943a5e180e635cdf5d5ca23d348645443146c68dda7641de32a1096834e7ff4` | `cfeb8db18ba2c17b7ddd5e866d3957e6a506a3b7bbc5ca44eb1ec63ff29813f7` |
| `src/components/Navigation.tsx` | `8ac9738d1054fc19e12266abd97ff399c78ac4670523a6306570e5ec6df94407` | `7a851d76ec9537e5dc378ed42fe089184a60a8db2c4531a4b0a6d7bacda36c76` |
| `src/components/ProductShowcase.tsx` | `183205e03a317f932ab4dfd571aeb0eff8d5770be82295856071ed000559809c` | `60c8691957583f2e4c723d427f25e107b906579727683e777d593497c5f4e992` |

| New asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/images/hero1-desktop-v3.webp` | 77,270 | `7c34b5f3ea28345148634b354a782fe66e248870234c7b5b3bb89fc4bc20016d` |
| `public/images/hero2-desktop-v3.webp` | 59,560 | `52491bf0671f83c988345c7a23120ccd100af4e78a0659bf3e3bda50d24292bf` |
| `public/images/izem-app-logo-96-v1.webp` | 2,636 | `9f9dfa45d4e35f0d9a8dd3a607f7b61dfc993885d7ceaeb6e00bbe552770eeb2` |
| `public/fonts/izem-body-latin-v1.woff2` | 34,704 | `e9201eddf1d41d0b62253295d869ce3cf65768f7102b797f02c7f8c876b4a9d5` |
| `public/fonts/izem-body-latin-ext-v1.woff2` | 19,588 | `768af2923e0ab1549f1dfba0a5c8ea749c4c01f01d8e77ffaf7fcd12f57a0a24` |
| `public/fonts/HankenGrotesk-OFL.txt` | 4,402 | `e02ccb89a86839b22feff7872ff5cc355cc0f58318d29eee20e2cf83a612f16d` |

## Validation and release boundary

Production build passed, including the real browser film, preview, download and 320/390/768/1440px homepage suites. New preview checks exercise preload-without-play, scroll pause/resume, native background-tab pause/resume and source changes. Component lint and 54 guard tests passed. Agent tests passed 122 with one explicit skip; security tests passed 93. Staged metadata tests passed 12/12. Isolated Hosting/Functions emulator readiness passed 66/66 checks across 48 public URLs. The committed cumulative guard must validate the exact final source transition before release.

This correction requires deploying both Hosting and the isolated agent-pages function because production HTML is deliberately served by the function. A static-only upload cannot enable document compression. Until release, public PageSpeed and real-user results remain unchanged. After deployment, verify encoded public response bodies/headers on cache MISS/HIT and run a fresh PageSpeed mobile/desktop comparison; field improvement requires new real visits.
