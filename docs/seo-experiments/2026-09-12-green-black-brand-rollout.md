# Green and black sitewide branding — 2026-09-12

## Request and scope

The owner explicitly requested that every old blue page follow IZEM's current green-and-black identity, and authorized pushing the implementation. This is a presentation release, not a new keyword, title, copy, or ranking experiment. Do not deploy the abandoned launch-signup package, Jotform, a waitlist, or a fabricated download destination.

Primary: `#8DFF6A`. Secondary: `#D8FF86`. Background: `#070A0D`. Cards use dark charcoal/green-neutral surfaces. Red errors and amber warnings retain their semantic colors. Existing app-logo images, photography, videos, code examples, and JavaScript remain unchanged.

## Baseline and evidence

Production baseline commit: `dc67383d3ec25d78f98cfb9edc9dc2c0eb7a509b`.

The downloaded Pages artifact from run `34706323540` was authenticated against its SHA-256 digest. It contains 450 HTML files plus two local stylesheets. Legacy content mixes cyan `#00D4FF`, purple `#7C5CFC`, navy `#060B1D`, teal, and newer lime accents.

The implementation was applied to a local copy of the actual production artifact. It normalized 452 existing files, including HTML, CSS, and browser-manifest colors. All 450 HTML documents were compared for non-visual semantic preservation: titles, descriptions, canonical/robots metadata, headings, body content, scripts, structured data, media destinations, and navigation links remained unchanged. A shared stylesheet is added to normal page heads; verification-only files remain unchanged.

## Implementation

- A PostCSS-based, build-time visual normalizer changes declaration values rather than selectors or article text. It covers inline styles, embedded stylesheets, compiled CSS, SVG presentation attributes, and browser chrome colors.
- Opaque bright-green buttons receive dark labels; transparent cards and gradient-clipped text are preserved.
- Every production build applies the theme after existing prerender/metadata injection and then checks idempotence. A failed theme pass blocks the build instead of silently deploying mixed styling.
- The homepage Tailwind palette is updated at source, also producing a new CSS bundle fingerprint for the initial rollout.
- The shared stylesheet adds green keyboard-focus rings and fixes the old tools hub's 400px grid minimum on small screens.
- Existing dependencies and all SEO experiment locks remain unchanged. No locked editorial source file is rewritten, and no lock is shortened. This is the owner's explicit sitewide appearance update, not a way to change protected content indirectly.

## Validation and release gates

36 new deterministic tests cover colors, alpha, RGB syntax, custom properties, button contrast, CSS/HTML idempotence, script/schema/content preservation, invalid CSS, and whole-directory failure behavior. These tests join the existing SEO production test command. No new package, external LLM, credential, or service is required.

Offline Chromium visual samples cover the homepage, feature page, blog index, article, tools, calculators, glossary, comparisons, and legal content at phone/desktop sizes. This is not a claim of exhaustive accessibility certification. The existing gym-accountability article has a narrow-screen overflow that requires separate diagnosis; the color transformation does not modify its dimensions.

Before merge: inspect the final diff, pass existing deterministic production tests/build/links/schema/sitemap checks and experiment guards. After merge: inspect the Pages run for the exact merge SHA and verify the rendered production pages and shared stylesheet.

## Hypothesis, metric, and review

Hypothesis: one consistently applied green/black identity removes legacy visual fragmentation without disturbing page intent or working tools.

Primary target: all normal production HTML pages receive the shared theme; no unnormalized supported cool-color declarations remain after the build; primary button label contrast exceeds 4.5:1.

Guardrails: unchanged editorial/search content, unchanged route inventory/canonicals, working calculator/generator inputs, zero new deployment or JavaScript errors.

Earliest review: immediately after deployment. Follow-up visual/build-regression review: 2026-09-15. Ranking direction expected to be neutral; a color refresh is not claimed to generate organic traffic.

Rollback: revert this PR and redeploy the prior production build. Do not revert unrelated newer work.
