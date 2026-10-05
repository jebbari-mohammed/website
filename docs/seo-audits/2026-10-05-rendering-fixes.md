# Mobile rendering fixes: October 5, 2026

The shared stylesheet corrects three observed rendering failures: long template blanks, comparison tables that widen the page or clip cells, and headings containing words wider than a small phone's reading column.

## Diagnosis and implementation

The initial live check found a 482px document width on a 390px phone viewport in the gym-accountability article. Its unbroken underscore blanks now wrap inside `.template` blocks.

A wider check of the current build found overflow on 95 of the 275 sitemap URLs at 375px, after the template correction. Most failures came from tables, including translated articles. Below 769px, tables now keep their width inside the reading column and scroll horizontally when their contents need more space. The selector also covers class-based styles that previously clipped cells with `overflow: hidden`.

At 320px, ten pages still overflowed because a long word in an H1 could not wrap. Small-screen headings now allow a line break when a word cannot fit. Their text and font sizes are unchanged.

The implementation is confined to `public/izem-theme.css`. Desktop tables retain their native table display above the mobile breakpoint. All cells stay in the HTML. [Google's mobile guidance](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing) recommends responsive design and equivalent primary content across screen sizes.

## Verification

| Check | Result |
| --- | --- |
| Production build | Passed, including prerendering, owner-image policy and theme normalization |
| Full mobile rendering | 275 canonical pages at 320, 375 and 390px: 825 checks, no document overflow, HTTP errors or clipped tables |
| Tablet and desktop controls | Six representative routes at 768 and 1280px: 12 checks passed |
| Table scrolling | English, German and Arabic tables reached their off-screen cells; right-to-left scrolling verified |
| Table semantics | Browser accessibility tree retained three tables, 15 rows, 41 cells and ten column headers in the accountability comparison |
| Source structured data | 461 JSON-LD blocks across 459 HTML files passed |
| Built structured data | 463 JSON-LD blocks across 460 HTML files passed |
| Critical routes | 460 pages and 10,175 internal links passed |
| Internal-link checker | 456 pages and 10,112 links passed |
| Sitemap | Current, with 275 canonical indexable URLs |
| Experiment protection | No protected source targets changed; no locks removed, shortened or retargeted |

The mobile inventory uses local copies of the production pages and blocks third-party resources for consistent measurements. Representative English and translated layouts also received visual and scrolling checks. Live checks are required after the hosting workflow completes.

## SEO decision and release scope

This is a rendering correction under the repository policy, separate from today's existing body-recomposition internal-link experiment. No article copy, search title, description, canonical, schema, internal link or experiment definition is changed. The pre-existing workout-split and rest-period drafts are excluded from the release.

The latest issue #34 still points to the September 7–October 4 private evidence period. Its artifact digest, vault fingerprint, authenticated decryption, query/page dimensions, 158 rows and dates were reverified. Temporary plaintext and the copied private key were deleted. Exact rows are excluded from this report.

The four installed SEO skills supplied the audit, evidence interpretation, intent ownership and editorial workflow recorded in the initial review. Edge's [Technical SEO Discovery](https://github.com/divyanshu-iitian/agent-website-design-skills/tree/77961873e9ee996afe7aa5cd4223b09a2360ed9c/technical-seo-discovery) added the implementation and release checklist for this correction.

The release also saves that workflow in `AGENTS.md` and `docs/seo-skills.md`, together with the public-safe audit. The established [hosting workflow](https://github.com/jebbari-mohammed/website/actions/workflows/deploy.yml) builds, validates and deploys pushes to main. This document records the validated release candidate; the workflow and subsequent live checks establish deployment completion.

## Remaining audit items

Current page indexability and contextual links are valid on the two URLs with neutral inspection results. Their recorded crawl state still needs to catch up with the current sources. Preserve the active editorial experiments while that happens. The 157 missing Open Graph images need a separate sharing-preview review. PageSpeed and paid keyword metrics remain unavailable under the current API limits, so no performance score or traffic uplift is asserted.
