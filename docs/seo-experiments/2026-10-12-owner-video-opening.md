# Owner-requested homepage opening film — October 12, 2026

The owner supplied matching portrait and landscape films and requested an opening video experience with sound and normal scrolling into the existing website. This is a presentation and media-loading change. It does not select a keyword, create a search entry, or change ranking copy, metadata, canonicals, structured data, discovery URLs, or the locked FAQ. No Search Console performance inference was used to make this owner-directed design decision.

## Experience

- One viewport-height black film stage precedes the existing homepage. Authored video text and composition remain fully visible with `object-fit: contain`; controls sit outside the image.
- Portrait phones at widths up to 767px use the 9:16 edit. Landscape phones and wider screens use the 16:9 edit. Only the chosen video is loaded on an initial visit.
- Playback requests sound first. If the browser rejects audible autoplay, it retries muted and offers a sound button. First enabling sound restarts the opening so the visitor hears the beginning. No document-wide gesture interception or autoplay-policy bypass is used.
- Scrolling remains native and available immediately. Playback pauses when less than 55% of the opening remains visible, or when the tab is hidden. It resumes on return unless the visitor manually paused or finished the film.
- The film plays once, with pause, sound, and replay controls. Finished state, play position, and manual pause survive responsive format changes.
- Reduced-motion and Save-Data visitors get the matching still and manual playback. A slow or failed video leaves the poster, controls, and scroll path available.
- The existing product-preview video now mounts only while its section is in view. Existing headline, copy, links, and FAQ remain intact.

## Media and delivery

The source video streams have 3,308 frames at 30 fps, lasting 110.266667 seconds. Optimized MP4 containers last 110.272 seconds due to AAC framing. Both retain the full soundtrack and sequence and use H.264 High Level 4.1, yuv420p, AAC-LC stereo 48kHz, and faststart.

| Asset | Dimensions | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Desktop film | 1600 × 900 | 7,404,325 | `0d8833f41d748caf73f4f5167ff43c93c4bd274869f967537c0ac2861d71c32b` |
| Phone film | 720 × 1280 | 6,564,725 | `d55d623d4377faabe2f889764ae59a84034ebfb30af67a829967c8eead05a6f1` |
| Desktop poster | 1600 × 900 | 30,636 | `b208764b174ecbcc2d8e931dc7dfeb8dff97800ea3a07085f7a203d8144f5927` |
| Phone poster | 720 × 1280 | 23,530 | `b7e82812d0a9c20f20d5a20126f870bff34f7bfefa5fdc3a712983afa4d1748e` |

Posters are lossless WebP copies of each resized source first frame. Source/encode frames at 35, 65, and 105 seconds were visually compared. Both MP4s passed full decode checks. Versioned filenames avoid replacing an already cached asset. Exact media-level `X-Robots-Tag: noindex` rules preserve the existing dedicated watch-page indexing policy.

Prerendering waits for the local application instead of network-idle during streaming. External network availability does not gate static capture. Cleanup removes the captured desktop video and restores the responsive poster before publication, preventing a wrong-format request before React starts on phones.

## Validation and review

Production build includes the existing homepage/watch-page rendering checks and a dedicated real-browser opening-film regression check. The new check covers responsive sources, strict audible-autoplay rejection, sound activation, keyboard pause, scroll/tab pause, sticky pause, replay, completed-state rotation, reduced motion, Save-Data, and delayed/failed media. Route, schema, link, sitemap, video-discovery, and experiment-lock checks also apply.

Browser sound permission remains controlled by the visitor's browser. Physical iPhone Safari and Android device checks are separate from Chromium browser verification. There is no claim of guaranteed audible autoplay or improved rankings/conversion.

Observe initial media transfer, field LCP/INP, engagement with the sound control, and scroll continuation. Review after November 2; prefer November 9 for broader observation. Preserve the existing FAQ lock. Rendering or deployment corrections can be made through the documented exception process.
