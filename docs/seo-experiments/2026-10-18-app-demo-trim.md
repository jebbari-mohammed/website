# Owner-requested app-demo opening trim

Revision ID: `owner-app-demo-trim-2026-10-18`
Kind: `owner-directed-presentation-revision`
Owner direction and review date: `2026-10-18`
Baseline: `acd8987d70fc19d6b663c26523806a38b41bdfab`

The owner identified the app-demo recordings in the feature showcase as appearing static on arrival. Inspection found that the workout/nutrition clip held still for about 3.2 seconds and the chat clip for about 4 seconds. The owner explicitly selected removing the full still pause rather than cutting exactly one second. The supplied cinematic opening films and the download-button design remain unchanged by this follow-up.

## Final media

The workout/nutrition edit starts at source 3.200 seconds and runs 31.120 seconds (778 frames). The chat edit starts at source 4.000 seconds and runs 13.200 seconds (330 frames). Both preserve 800×1260 resolution, 25 fps, complete framing and the remaining sequence. The input clips are silent; no soundtrack was added. The web encodes use H.264 High, yuv420p and faststart. Matching first-frame lossless WebP posters use new versioned URLs and verified SHA-256 cache keys.

Both desktop Hero previews and every feature-showcase tab consume the same media manifest. The Hero's existing phone still and reduced-motion behavior remain unchanged. The showcase keeps its poster visible while loading and reveals the recording on playback. Exact noindex rules and decorative-media registration include the new assets, while original assets remain available to cached clients.

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/videos/izem-coach-chat-dark-web-v2.mp4` | 2,411,237 | `78793dc52ec38933343c817fd578f93ea1c2161c8fc1434d12ccafbbace0b3f4` |
| `public/videos/izem-workout-nutrition-dark-web-v2.mp4` | 5,083,419 | `db9861dcfbb96914eb387be65591d939774dc175386bffefc2fcdc93d5941097` |
| `public/images/hero1-desktop-v2.webp` | 187,040 | `e2b3fadcb9cb9684afba61400561a7ad49e8484501415284aee562e0dbc6bb03` |
| `public/images/hero2-desktop-v2.webp` | 177,158 | `117bed07ebf1c24f701fa719f038d8da258e000e0d07b12bf3ce8cf5301a161f` |

## Review boundary

The existing presentation experiment retains its ID, URL, protected-file list, launch date, lock deadline, review date and reason. An append-only owner revision records the complete reviewed showcase-source transition below. A separate new lock protects this trim and its media manifest/assets until November 8, with review preferred November 15. The previous opening-film/download revision remains intact. Subsequent engagement cannot be attributed solely to earlier homepage changes; no organic-performance claim is made.

| Protected source | Base SHA-256 | Reviewed head SHA-256 |
| --- | --- | --- |
| `src/components/ProductShowcase.tsx` | `183205e03a317f932ab4dfd571aeb0eff8d5770be82295856071ed000559809c` | `ddbd7e87182baeb16172c74e2c1dbef77113b64790604eabbab92781349d86b1` |

The release guard recognizes this specific code-pinned owner revision. Exact committed source bytes, documentation and covering-lock records are required; arbitrary editorial changes, opening-film changes, replayed records and weakened locks remain blocked.

## Validation

Both encodes passed full decode, frame-count, duration and faststart checks. Source/cut/encoded comparison sheets confirm visible scroll within the first 0.08 seconds. Posters match decoded first frames pixel for pixel. The production build passed, including homepage media loading, source switching, reduced-motion stills, phone/tablet/laptop layouts, opening-film playback and store-download routing. All 52 experiment-guard tests and component lint passed. Local browser verification is separate from publication and physical-device behavior.
