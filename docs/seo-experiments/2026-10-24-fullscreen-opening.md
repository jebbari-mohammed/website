# Owner-requested full-screen opening video

Revision ID: `owner-fullscreen-opening-2026-10-24`
Kind: `owner-directed-presentation-revision`
Owner request date: `2026-10-24`
Baseline: `ce1369392aa9c027b2f9b69175b2046b2e67a27f`

The owner requested: "please make the video take all the screen". Existing live-publication authorization applies. This presentation change fills the phone and laptop browser viewport with the opening film. It makes no search, ranking or performance-gain claim.

The video and matching poster now cover the entire opening section. Dynamic viewport height follows mobile browser chrome, with small-viewport and viewport-height fallbacks. The reserved navigation and control bands are removed; navigation fades over the film and the download, playback and scroll controls float over its bottom edge. Controls retain their touch targets, keyboard behavior and safe-area padding. Failed-media notices have an opaque background above the controls.

Cover framing intentionally crops the picture when the browser viewport differs from the selected portrait or widescreen aspect ratio. The existing v2 video files, full duration, soundtrack, responsive source selection, loading policy and player logic are unchanged. Native page scrolling and reduced-motion/Save-Data behavior remain available.

## Protected source transitions

| File | Base SHA-256 | Reviewed head SHA-256 |
| --- | --- | --- |
| `src/components/OpeningVideo.css` | `402a4fa043fb9b9f0352047f69714ed56b63f2f6ff4c60c1bbb897cdc134a796` | `154b27e0b09541fb854732284ed55a56f2a2454cc7e9e2b6f2835fa1c8565b5e` |
| `src/components/Navigation.tsx` | `7a851d76ec9537e5dc378ed42fe089184a60a8db2c4531a4b0a6d7bacda36c76` | `810646c5e04a5ba8bf62c721f56b63e0ed8fe391e5db921e241f18f6b224113d` |

Every existing lock covering these files receives an append-only revision record. Existing lock definitions, dates, reasons and earlier records stay intact. The guard pins these exact transitions and requires every overlapping lock to acknowledge them. Tests reject extra bytes, replay, missing overlapping annotations and shortened observation windows. A separate launch lock protects this presentation through November 14, with review preferred November 21. Overlapping owner interventions limit attribution to earlier experiments.

## Verification

The production build passed, including strict-autoplay opening-video checks at 390 × 844, 320 × 740, 1440 × 900 and 660 × 390. Assertions verify that the video starts at the viewport origin, fills its width and height, uses cover framing and keeps the floating controls at its bottom edge. Screenshots of phone, laptop and landscape layouts were visually reviewed.

Existing checks passed for no-JavaScript posters/scroll links, slow and failed media, sound restart, mute, pause/resume, background tabs, resize, keyboard pause, ending/replay, reduced motion and Save-Data. Download routing and reachable controls passed across iPhone, Android, desktop-mode iPad, Mac, Windows, Linux, narrow-phone and landscape profiles. Homepage presentation checks passed at 320, 390, 768 and 1440 pixels.

Security tests: 106 passed, including 67 experiment-guard tests. Agent tests: 122 passed and one explicit skip. Built-route validation covered 489 pages and 10,735 internal links; JSON-LD validation covered 497 blocks in 489 HTML files. Source links covered 480 pages and 10,584 links. The 298-URL sitemap and 64 dedicated watch pages were current. Browser/server-based checks ran outside the filesystem sandbox because it blocks Chromium startup and localhost listeners. The committed-diff guard and production deployment/live checks remain release requirements.
