# Food scanner video deploy correction - 2026-09-26

Commit-level purpose: unblock production deployment after the September 26 food-scanner rehabilitation entered the strict object-only article pipeline without the validated IZEM video block required by the hosting gate.

## Scope

- Target URL: `https://youraicoach.life/blog/food-scanner-app-with-meal-planning-and-workout-coaching`
- Existing video guide: `https://youraicoach.life/youtube/CkdglcnxmXQ/`
- Correction type: deployment/release gate correction
- Active lock affected: `food-scanner-scan-to-plan-rehabilitation-2026-09-26`

## What changed

- Added the standard `IZEM_VIDEO_START` article video block to the food-scanner page.
- Re-ran `npm run video:sync`, which added the English food-scanner page as a source for `CkdglcnxmXQ` in `public/youtube/video-catalog.json` and the generated watch page.
- Did not change the food-scanner target query, title, canonical, schema, body strategy, Scan-to-Plan Test, sitemap lastmod, or active experiment dates.

## Why this is allowed during the lock

The active experiment policy allows narrowly documented rendering/deployment corrections during a lock. This change is necessary because the Firebase deploy workflow deferred production while the strict article lacked its validated video block. It is not a second SEO experiment or a material rewrite of the locked page.
