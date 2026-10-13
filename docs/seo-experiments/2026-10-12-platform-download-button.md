# Owner-requested download button — October 12, 2026

The owner requested a download button for the just-published opening film, routing iOS and macOS to the Apple App Store and Android to Google Play. This is a continuation of the owner-directed homepage presentation work, without keyword selection or a ranking-content rewrite.

The new action mounts from the homepage entry point into the existing film control bar. Separate component and style files preserve the locked opening component, video playback logic, navigation, original hero, and FAQ. On phones the download action occupies its own row above the existing sound and scroll controls; on wider screens it sits between them. Hover motion respects reduced-motion preferences.

Android is detected before Apple compatibility wording. iPhone, iPad, iPod, and macOS use the Apple destination, including iPadOS desktop-mode user agents. Other devices and initial HTML without JavaScript use a noindex store chooser at `/download/`. Detection only chooses a link; it performs no automatic navigation, installs, or unrelated browser gesture capture.

Configured identifiers were verified against the owner's app configuration: Apple app ID `6760679807` and Android package `com.ai.gym.coach`. At implementation, both public listing pages returned HTTP 404 and Apple's lookup API returned no public result. Public store availability is separate from correct button routing and requires the owner to confirm the intended links or the stores to publish the listings. No public-download-availability claim is added.

Validation: component lint, production build and existing opening-film regression checks passed. The new store-destination browser suite passed for six simulated platforms, narrow phone/desktop/landscape layouts, actual intercepted outbound clicks, no-JavaScript fallback, and preserved playback/scroll controls. Critical routes, structured data, video discovery, and sitemap checks passed. The internal-link release guard correctly blocks the known-404 Google Play destination in the chooser. This change remains a draft pending destination confirmation; the link guard is not weakened.
