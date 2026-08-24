# SEO Experiment: Canonical URL Inspection Fix

- **Status:** implementation
- **Launch date:** 2026-08-24
- **Action class:** technical SEO observability / index-state measurement
- **Target URL:** https://youraicoach.life/workout-consistency-calculator/
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

The verified Search Console health run for 2026-07-27 through 2026-08-23 contains 54 private query + landing-page rows, 79 impressions, and 0 clicks. URL Inspection checked 25 priority URLs with zero API errors.

The workout consistency calculator was reported as:

- verdict: **NEUTRAL**;
- coverage: **URL is unknown to Google**;
- last crawl: **none**;
- source modification date: **2026-08-07**.

The page has therefore appeared to be discovery-pending for more than two weeks.

## Root-cause review

Before changing the page, internal links, sitemap, or content, the measurement target itself was checked.

The live and repository-backed page is:

`https://youraicoach.life/workout-consistency-calculator/`

It is indexable and declares that exact trailing-slash URL as its canonical. The site tools hub links to that URL, multiple relevant pages link to it, and the XML sitemap contains the trailing-slash canonical.

However, the fixed Search Console inspection list was querying:

`https://youraicoach.life/workout-consistency-calculator`

without the trailing slash.

The no-slash URL is not the page's declared canonical. A URL Inspection result for that variant cannot safely be treated as the index state of the canonical URL. This made the reported “unknown to Google” state potentially a measurement artifact rather than evidence of a crawl/discovery failure.

## Action

Change the fixed URL Inspection target to the exact declared canonical:

`https://youraicoach.life/workout-consistency-calculator/`

No public page, title, metadata, schema, content, canonical, sitemap URL, or internal link is changed.

A deterministic regression test now verifies that the fixed inspection configuration contains the trailing-slash canonical and does not reintroduce the no-slash variant.

## Hypothesis

Inspecting the exact canonical URL will produce a trustworthy Google index-state baseline for the workout consistency calculator. If the canonical is already known or indexed, the previous alert was a false signal caused by inspecting the wrong URL variant. If the canonical is still unknown with no crawl, we then have stronger evidence of a genuine discovery problem and can investigate architecture without guessing.

## Baseline

- Site Search Analytics: **79 impressions, 0 clicks**.
- Priority URL Inspection: **19 indexed / 25 inspected, 6 unknown, 0 API errors**.
- Previous calculator inspection target: **non-canonical no-slash variant**.
- Previous calculator result: **URL unknown to Google / no crawl**.
- Canonical calculator source: **indexable, self-canonical with trailing slash, sitemap-listed and internally linked**.

## Target metrics

1. Search Console URL Inspection queries the exact trailing-slash canonical.
2. The post-merge health run completes with zero URL Inspection API errors.
3. The safe snapshot records the canonical calculator's real verdict, coverage state, last crawl, user canonical, and Google canonical when available.
4. Future discovery decisions are based on the canonical URL rather than a URL-shape mismatch.

## Expected direction

- Index observability accuracy: increase.
- False discovery alarms: decrease.
- Public crawl/index state: unchanged by this measurement-only change.
- Cannibalization and active content experiments: unchanged.

## Review window

- **Immediate technical review:** first Search Console health run triggered after merge.
- **If canonical is PASS/indexed:** close the apparent discovery concern and preserve the page.
- **If canonical remains unknown with no crawl:** treat that result as a real technical-discovery baseline and investigate crawl architecture on the next SEO cycle.

## Risks

The trailing slash may still return an unknown result. That would not mean this change failed; it would mean the earlier uncertainty has been removed and the canonical URL itself genuinely needs further investigation.
