# SEO Experiment: Blog Publication Date Integrity

- **Status:** launched
- **Launch date:** 2026-08-18
- **Action class:** technical SEO / trust / discovery integrity
- **Owner:** ChatGPT senior SEO lead
- **Affected system:** blog archive + RSS generation

## First-party evidence

The latest repository state exposed a deterministic date-integrity bug in `tools/ai-marketing/rebuild-blog-index.mjs`.

The generator used `new Date()` whenever an indexable post did not contain JSON-LD `datePublished`. That means an undated article could silently acquire the day of *any later blog rebuild* as its publication date.

A confirmed example is `/blog/science-of-deload-weeks-for-hypertrophy`:

- The article was added to the repository in commit `ba7d1fb5625c05b1690fbc608706271f0df8a9f9` on 2026-07-25.
- Its current source has no `datePublished` value.
- The 2026-08-17 blog rebuild displayed it in the archive as `2026-08-17` and emitted an RSS `pubDate` for 2026-08-17.
- Nothing in the article source supports that as its publication date.

This is a system-level risk: every indexable post missing source-backed publication metadata can be made artificially fresh whenever the archive is rebuilt.

## Decision

Do not infer a publication date from deployment or rebuild time.

The rebuild system now accepts only source-backed publication dates from:

1. JSON-LD `datePublished`.
2. Open Graph `article:published_time`.
3. `itemprop="datePublished"` metadata/time markup.

If none exists, the archive omits a date for that post and RSS omits the per-item `pubDate`. The feed-level `lastBuildDate` remains the real feed build time.

## Hypothesis

Removing synthetic per-post dates will prevent false freshness signals and keep IZEM's archive/RSS chronology aligned with evidence actually present on each page.

## Baseline

- Confirmed false-dated indexable URL: at least 1 (`/blog/science-of-deload-weeks-for-hypertrophy`).
- Generator behavior before the fix: every indexable post without `datePublished` received the current rebuild date.
- Regression coverage before the fix: none.

## Target metrics

1. Zero archive/RSS publication dates generated from the current clock for undated posts.
2. Dated posts retain their source-backed publication day.
3. Rebuilding the blog on a later day does not change an undated post's apparent publication date.
4. Production build, structured-data, sitemap, route, and link validation remain green.

## Expected direction

- False freshness: present → eliminated.
- Date stability across rebuilds: unstable → stable.
- Regression coverage: absent → deterministic tests in `test:seo-growth`.

## Review window

- **Immediate technical review:** CI/build validation on 2026-08-18.
- **Earliest operational confirmation:** the next independent blog rebuild on a later calendar day.
- No content rewrite is required for undated legacy pages solely to make the archive show a date. A publication date should be backfilled only when there is reliable source evidence and the page can present it consistently.

## Risks

- Undated legacy posts may temporarily show no date in the archive/feed. That is intentional and safer than inventing a date.
- This change does not retroactively determine the true publication date of legacy pages lacking metadata.
- Separate article-level rehabilitation may still be appropriate if an undated legacy URL later earns meaningful Search Console visibility.
