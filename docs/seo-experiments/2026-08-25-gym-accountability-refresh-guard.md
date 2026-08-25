# SEO Experiment: Gym Accountability Guide Refresh Guard

- **Status:** launched and protected
- **Launch date:** 2026-08-25
- **Target URL:** `/blog/best-accountability-app-for-gym`
- **Action class:** experiment control / measurement integrity
- **Owner:** ChatGPT senior SEO lead

## First-party baseline

The latest verified Search Console snapshot before the August 25 material refresh covers 2026-07-28 through 2026-08-24:

- Site: 54 private query + landing-page rows, 79 impressions, 0 clicks, 14 landing pages, 68.01 impression-weighted average position.
- Target URL: 13 impressions, 0 clicks, 0.00% CTR, average position 90.00.
- Google URL Inspection before the refresh: PASS / Submitted and indexed.
- Last recorded Google crawl before the refresh: 2026-08-17T23:56:49Z.
- Source version in that Search Console snapshot: modified 2026-08-08.

The August 25 source change is therefore newer than Google's last recorded crawl and has no post-refresh Search Analytics baseline yet.

## Material change already shipped today

Commit `6bff634cef60abbfffe2e6f829d20f7b019e867e` substantially changed the existing page rather than creating a new URL. It updated the search/social title and description, H1/lead, `dateModified`, FAQ content, internal links, and added a source-checked comparison landscape covering multiple accountability mechanisms and current product positioning.

The production validation and deployment workflows passed after the change. The public search result checked later on August 25 was still showing the older pre-refresh title/content snapshot, so Google had not yet provided a fair recrawl/evaluation window for the new version.

## SERP finding

Current gym/fitness accountability results are increasingly organized around the mechanism that creates follow-through rather than a generic feature count. Visible patterns include:

- small-group or partner visibility and check-ins;
- objective workout verification through health/activity data;
- financial or commitment stakes;
- coaching/follow-up;
- explicit fit guidance based on the user's preferred accountability style;
- comparison pages that disclose their source/review date and tell readers to verify changing product details.

The August 25 IZEM refresh is directionally aligned with this landscape. Rewriting it again before Google recrawls would create more risk than information.

## Cannibalization check

The site contains adjacent accountability assets, including broader accountability-app content, non-social accountability, checklists, agreements, and calendars. The August 25 target is intended to own the **gym accountability app selection / mechanism-comparison** job. This experiment creates no additional URL and makes no consolidation or redirect decision, so it does not increase URL-level cannibalization during the evaluation window.

## Chosen action

Add the refreshed page to `config/seo-active-experiments.json` and protect the target file through the existing deterministic experiment guard.

Lock:

- `launchedAt`: 2026-08-25
- `lockUntil`: 2026-09-15
- `preferredReviewAt`: 2026-09-22

Only a documented factual, legal, rendering, indexing, canonical, deployment, or safety correction should shorten or bypass the lock.

## Hypothesis

Protecting the August 25 material refresh from overlapping title/body edits will preserve attribution long enough to determine whether the new source-checked accountability-mechanism framing improves Google discovery, impressions, average position, CTR, or clicks after recrawl.

## Target metrics

1. Zero unapproved material edits to `public/blog/best-accountability-app-for-gym.html` before 2026-09-15.
2. Google recrawls the August 25 source version without an indexing regression.
3. Target-page impressions remain stable or increase from the 13-impression pre-refresh baseline.
4. Average position improves from the 90.00 pre-refresh baseline, with CTR/clicks evaluated only once the impression sample is meaningful.
5. No new overlapping gym-accountability URL is introduced during the lock window.

## Expected direction

- Experiment attribution: improve.
- Crawl/version clarity: improve after recrawl.
- Impressions: stable to higher.
- Average position: lower/better.
- CTR/clicks: directionally higher, but current sample is too small for an early conclusion.
- Cannibalization risk: unchanged or lower because no new URL is created.

## Review window

- **Earliest technical recrawl check:** 2026-08-29.
- **Earliest useful Search Analytics review:** 2026-09-08.
- **Material rewrite lock ends:** 2026-09-15.
- **Preferred first content decision:** 2026-09-22.

Do not call the experiment a winner or loser from a handful of impressions. A factual competitor detail that becomes stale may be corrected during the lock, but the exception must be narrow and documented rather than used as a reason to re-optimize the page.

## Main risks

- The target currently has only 13 impressions, so statistical confidence will remain low for some time.
- Google may take several days to recrawl the August 25 source version.
- Competitor products, availability, and pricing can change; source-checked claims require maintenance when facts change.
- The accountability cluster contains adjacent intents, so future consolidation decisions should use exact query-to-page evidence after this refresh has matured rather than adding another overlapping page now.
