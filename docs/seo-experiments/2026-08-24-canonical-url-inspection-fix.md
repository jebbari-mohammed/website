# SEO Experiment: Canonical URL Inspection Fix

- **Status:** completed — false discovery alarm resolved
- **Launch date:** 2026-08-24
- **Completed date:** 2026-08-25
- **Action class:** technical SEO observability / index-state measurement
- **Target URL:** https://youraicoach.life/workout-consistency-calculator/
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

The verified Search Console health run for 2026-07-27 through 2026-08-23 contained 54 private query + landing-page rows, 79 impressions, and 0 clicks. URL Inspection checked 25 priority URLs with zero API errors.

Before the fix, the workout consistency calculator was reported as:

- verdict: **NEUTRAL**;
- coverage: **URL is unknown to Google**;
- last crawl: **none**;
- source modification date: **2026-08-07**.

The page therefore appeared to be discovery-pending for more than two weeks.

## Root-cause review

Before changing the page, internal links, sitemap, or content, the measurement target itself was checked.

The live and repository-backed page is:

`https://youraicoach.life/workout-consistency-calculator/`

It is indexable and declares that exact trailing-slash URL as its canonical. The site tools hub links to that URL, multiple relevant pages link to it, and the XML sitemap contains the trailing-slash canonical.

However, the fixed Search Console inspection list had been querying:

`https://youraicoach.life/workout-consistency-calculator`

without the trailing slash.

The no-slash URL is not the page's declared canonical. A URL Inspection result for that variant could not safely be treated as the index state of the canonical URL. The reported “unknown to Google” state was therefore a measurement artifact rather than evidence of a crawl/discovery failure.

## Action

The fixed URL Inspection target was changed to the exact declared canonical:

`https://youraicoach.life/workout-consistency-calculator/`

No public page, title, metadata, schema, content, canonical, sitemap URL, or internal link was changed.

A deterministic regression test verifies that the inspection configuration uses the trailing-slash canonical and does not reintroduce the no-slash variant.

## Result — 2026-08-25

The first scheduled Search Console health run after the correction completed successfully as run `32823487945` and inspected the exact canonical URL with zero API errors.

Google's result for the canonical calculator is now:

- verdict: **PASS**;
- coverage: **Submitted and indexed**;
- last crawl: **2026-08-22T00:27:44Z**;
- crawl state: **current** relative to the source date;
- canonical tested: **https://youraicoach.life/workout-consistency-calculator/**.

This closes the apparent discovery issue. The calculator did not need more internal links, a rewrite, a canonical change, or an indexing workaround. The correct intervention was to repair the measurement target first.

The same run improved overall monitored index visibility to **21 of 25 URLs indexed**, with **4 neutral/unknown and 0 URL Inspection API errors**. Two genuinely new pages remain discovery-pending with no crawl recorded: `/blog/personal-trainer-cost-calculator` and `/blog/cant-add-weight-progressive-overload`. Both are protected by active experiment locks and are too new to justify speculative rewrites.

## Hypothesis

Inspecting the exact canonical URL will produce a trustworthy Google index-state baseline for the workout consistency calculator. If the canonical is already known or indexed, the previous alert was a false signal caused by inspecting the wrong URL variant. If the canonical is still unknown with no crawl, we then have stronger evidence of a genuine discovery problem and can investigate architecture without guessing.

**Outcome:** confirmed. The canonical URL is indexed and the prior discovery alert was false.

## Baseline

- Site Search Analytics at launch: **79 impressions, 0 clicks**.
- Priority URL Inspection at launch: **19 indexed / 25 inspected, 6 unknown, 0 API errors**.
- Previous calculator inspection target: **non-canonical no-slash variant**.
- Previous calculator result: **URL unknown to Google / no crawl**.
- Canonical calculator source: **indexable, self-canonical with trailing slash, sitemap-listed and internally linked**.

## Target metrics and outcome

1. Search Console URL Inspection queries the exact trailing-slash canonical. **Met.**
2. The post-fix health run completes with zero URL Inspection API errors. **Met.**
3. The safe snapshot records the canonical calculator's real verdict, coverage state and last crawl. **Met.**
4. Future discovery decisions are based on the canonical URL rather than a URL-shape mismatch. **Met.**

## Expected direction

- Index observability accuracy: **increased**.
- False discovery alarms: **decreased**.
- Public crawl/index state: **unchanged by the measurement-only fix; confirmed indexed**.
- Cannibalization and active content experiments: **unchanged**.

## Review decision

No further SEO action is warranted for this URL now. Do not add links or rewrite the calculator merely to solve the already-resolved indexing concern. Revisit it only when Search Analytics produces meaningful query/page evidence, a real technical defect appears, or a normal content-review window justifies another experiment.

## Risks and lesson

The main lesson is to inspect the declared canonical before diagnosing a page as undiscovered. URL-shape mismatches can create false technical alarms and lead to unnecessary content or architecture changes.
