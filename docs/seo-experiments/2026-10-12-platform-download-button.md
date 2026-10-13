# Owner-requested download button — October 12, 2026

The owner requested a download button for the just-published opening film, routing iOS and macOS to the Apple App Store and Android to Google Play. This is a continuation of the owner-directed homepage presentation work, without keyword selection or a ranking-content rewrite.

The new action mounts from the homepage entry point into the existing film control bar. Separate component and style files preserve the locked opening component, video playback logic, navigation, original hero, and FAQ. On phones the download action occupies its own row above the existing sound and scroll controls; on wider screens it sits between them. Hover motion respects reduced-motion preferences.

Android is detected before Apple compatibility wording. iPhone, iPad, iPod, and macOS use the Apple destination, including iPadOS desktop-mode user agents. Other devices and initial HTML without JavaScript use a noindex store chooser at `/download/`. Detection only chooses a link; it performs no automatic navigation, installs, or unrelated browser gesture capture.

Postbuild cleanup restores the chooser link in initial HTML so the build machine's operating system cannot select a visitor's store. The live component then selects the visitor's device destination.

Configured identifiers were verified against the owner's app configuration: Apple app ID `6760679807` and Android package `com.ai.gym.coach`. At implementation and the pre-release recheck, both public listing pages returned HTTP 404 and Apple's lookup API returned no public result. Public store availability is separate from correct button routing. No public-download-availability claim is added.

The owner explicitly requested publication after being informed that both configured store links return 404. `config/store-download-release.json` records that approval and pins the two intended URLs. The link check recognizes only the approved configured destinations as store links in the exact noindex `download/index.html` chooser. Known broken URLs elsewhere, placeholder IDs, mismatched configuration, missing approval, and indexable pages remain blocked. The chooser states that store links may be unavailable during review. The device button still routes directly to the requested store on iOS/macOS or Android.

Validation: component lint, production build and existing opening-film regression checks passed. The new store-destination browser suite passed for six simulated platforms, narrow phone/desktop/landscape layouts, actual intercepted outbound clicks, no-JavaScript fallback, and preserved playback/scroll controls. Critical routes, structured data, video discovery, and sitemap checks passed. The store-link policy has positive and negative regression tests for its narrow publication exception. Store HTTP 404 status remains an acknowledged external limitation rather than a routing failure.
