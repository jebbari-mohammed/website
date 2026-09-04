# SEO/Security Experiment: Remove Public Marketing Data Exposure

- **Status:** implementation
- **Launch date:** 2026-09-04
- **Action class:** security / trust / SEO observability boundary
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

The September 4 Search Console health run completed successfully for 2026-08-07 through 2026-09-03 with 90 private query + landing-page rows, 158 impressions, 1 click, 17 landing pages, and zero URL Inspection API errors. A material internal-link SEO change also landed earlier today, so this remediation is intentionally non-overlapping with ranking/content experiments.

## Confirmed defect

Repository inspection confirmed that private marketing artifacts were stored under `public/marketing-data/`. Vite copies `public/` into the production static bundle, so those files were deployable as public assets. The production React application also exposed `/marketing-dashboard`, and dashboard generation wrote through `paths.publicDataDir`, which pointed at `public/marketing-data`.

This is a confidentiality and trust defect, not a ranking experiment. Deleting the current files alone would be insufficient because the storage layer could regenerate `public/marketing-data/index.json` later.

## Competing explanations checked

- The audit also claimed a fatal `/best-ai-fitness-app` redirect loop. Fresh Google URL Inspection contradicts that as a current P0: Google reports `/best-ai-fitness-app` as `PASS / Submitted and indexed`, last crawled 2026-08-31.
- The audit's experiment-guard concern is partially plausible but the current implementation already reconstructs base lock IDs from Git; it warrants a separate hardening review rather than being mixed into this release.
- The publisher path-resolution code still deserves a dedicated security test/hardening pass, but its exploitability depends on an internal publishing input path. The public marketing-data exposure is already concrete and deployed by design, so it wins today's expected-value ranking.

## Change

1. Move dashboard output from `public/marketing-data` to private repository data under `data/marketing-employee`.
2. Remove `/marketing-dashboard` from the production React application bundle.
3. Delete the existing public marketing strategy/dashboard artifacts.
4. Add a deterministic regression test that fails if:
   - `public/marketing-data` reappears;
   - `publicDataDir` points back into `public/marketing-data`;
   - the production application reintroduces `MarketingDashboard`, `/marketing-dashboard`, or `/marketing-data/index.json`.

## Hypothesis

Removing the public static marketing-data surface at both the stored-file and regeneration layers will eliminate accidental exposure of private marketing/GSC strategy while leaving indexable search assets and production routing unaffected.

## Baseline

- Public marketing-data source directory: present.
- Public dashboard route in app bundle: present.
- Storage regeneration path into `public/marketing-data`: present.
- Search Console: 158 impressions, 1 click, 90 private rows.
- Sitemap: 262 indexable canonical URLs before release validation.

## Target metrics

1. `public/marketing-data/` absent from source and generated production bundle.
2. `/marketing-dashboard` absent from the production app route logic.
3. Dashboard index generation writes only below `data/marketing-employee`.
4. Regression test remains green in deterministic SEO validation.
5. Production build, schema, route, link, and sitemap checks remain green.
6. Indexable canonical URL count does not decline because of this remediation.
7. No private Search Console query/page rows are exposed by the change.

## Expected direction

- Confidential-data exposure risk: sharply down.
- Trust/security posture: up.
- Public SEO URL inventory: unchanged.
- Ranking experiments: unchanged.

## Review window

- **Immediate:** merge validation and exact Pages deployment.
- **Immediate live check:** `/marketing-data/index.json` and `/marketing-dashboard` should no longer expose the removed internal surface after deployment propagation.
- **Next weekly marketing workflow:** verify it does not recreate public assets.
- **Formal review:** 2026-09-11.

## Risks

The internal marketing dashboard will no longer be reachable from the public production website. That is intentional. If a dashboard is needed later, it should be served through an authenticated/private surface rather than restored to the public static site.
