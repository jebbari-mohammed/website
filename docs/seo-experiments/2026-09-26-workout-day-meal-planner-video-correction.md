# Workout-day meal planner video correction — 2026-09-26

## Governance decision

Commit `e9ba7f5b09489d4f499e9619f574de84d2a95c9a` is an explicitly reviewed deployment/rendering correction to the newly launched `/blog/workout-day-meal-planner-app` experiment. The lock definition, target query, title, metadata, canonical, schema, evaluation dates, and editorial body remain unchanged.

The correction was required because the first deployment passed the deterministic build but the release gate skipped publication for the strict new article until it contained a validated IZEM video block. The follow-up attached the existing approved video page `MyWNM97INPk` and synchronized the video catalog so the already-approved public asset could deploy.

## Narrow scope

The protected file changed by the exception is:

- `public/blog/workout-day-meal-planner-app.html`

The change only inserted the standard `IZEM_VIDEO_START` block after the article's scope note. The same commit updated the generated video page and catalog:

- `public/youtube/MyWNM97INPk/index.html`
- `public/youtube/video-catalog.json`

No experiment lock was removed, shortened, retargeted, or weakened. The page remains in its initial 21-day discovery and early ranking window through 2026-10-17.

## Validation

The corrected source passed `npm run video:check`, the blog media policy check for the strict article, the production build, sitemap check, internal-link check, critical-route check, and full JSON-LD validation. Firebase deployment and production smoke tests passed on the corrected commit. The active-experiment guard failure on that commit is the mechanical record that a protected target changed; this document is the repository-required reviewed governance exception for the release correction.
