# Verified Google Play app identity

October 22, 2026, America/Los_Angeles.

The official Android listing is now public at [Google Play](https://play.google.com/store/apps/details?id=com.ai.gym.coach). It identifies the app as **IZEM: AI Fitness Coach**, displays **AppsHF** as the developer and uses the package **com.ai.gym.coach**. The website already links to that listing visibly, but its app entities did not identify the external listing or the installation destination.

## Decision and evidence

This is the day's single material SEO action, following the separate factual availability correction in PR #135. The newest private Search Console handoff was authenticated and reviewed through the repository's private evidence workflow. Plaintext was deleted after the decision. Evidence is too sparse to predict or attribute a ranking gain from this change. No exact queries, query/page pairs or private credentials belong in this report.

The four installed SEO skills informed a proportional review: audit existing app identity and discovery, verify first-party search evidence, prefer the existing product pages over a new overlapping URL, and edit the short public proof text without adding unsupported claims. The E-E-A-T review limited the addition to confirmed identity facts. No new keyword or content asset is selected.

Both the homepage and canonical product overview retain the same app `@id`. Their app entities now use `sameAs` for the verified Play listing, `installUrl` for its installation page, and the exact public title as an alternate name. The product overview states the displayed developer name without equating that name with the website's Organization entity. Its visible update date now matches its existing October 22 structured modification date.

The listing's Website field currently points to `https://ai-gym-coach-13ee1.web.app/support.html`, which redirects to `/support` on that Firebase host. That page declares `https://youraicoach.life/support.html` as canonical. The listing also links directly to the site's privacy policy and displays its support email. This verifies a support relationship; it does not establish a ranking benefit. No Play Console fields are changed by this website release.

## Scope and limits

- Add the Play identity and installation URL to the app, not to `Organization.sameAs`.
- Keep existing app identity, content, eligibility and purchase qualifications intact.
- Keep `downloadUrl` absent: the verified link is an installation page, not an app binary URL.
- Do not add reviews, ratings, prices, professional credentials or Google endorsement claims.
- Preserve every pre-existing experiment lock, correction and homepage component.

This is an identity clarification with a testable implementation, not a forecast of higher rankings. Google describes E-E-A-T as a framework reflected by multiple signals, not a specific ranking factor. Valid app identity markup does not establish eligibility for an app rich result; missing genuine offer/review evidence must not be invented.

## Observation and validation

The two target documents are locked through November 12, with a preferred review on November 19. Check whether Google has recrawled the changed documents before evaluating branded discovery, impressions or clicks. The earlier Android availability release is a confounding change, so later movement cannot be attributed solely to these fields.

The lock validator previously supported only `src/` and `public/` targets. It now also accepts the exact root `index.html` document so the homepage identity metadata receives the same protection. Other root paths remain unsupported; tests check that the new homepage lock blocks later edits during its window.

Release validation includes source and built entity assertions, structured-data syntax, existing build and rendering checks, sitemap and critical routes, internal links, the active-experiment guard, and live verification of both documents after deployment. The tests verify that only the app receives the verified identity links and that no unsupported offer, rating, review or binary-download claim is introduced.

## Primary references

- [Schema.org: sameAs](https://schema.org/sameAs)
- [Schema.org: installUrl](https://schema.org/installUrl)
- [Schema.org: downloadUrl](https://schema.org/downloadUrl)
- [Google: helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: software application structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- [Google: structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
