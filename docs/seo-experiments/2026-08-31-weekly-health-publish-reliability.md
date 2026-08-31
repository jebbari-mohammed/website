# SEO Experiment: Weekly marketing health publish reliability

- **Status:** launched
- **Launch date:** 2026-08-31
- **Action class:** SEO observability / operational reliability
- **Target workflow:** `.github/workflows/autonomous-marketing-employee.yml`
- **Owner:** ChatGPT senior SEO lead

## First-party baseline

The fresh Search Console health run for 2026-08-03 through 2026-08-30 completed successfully with 85 private query + landing-page rows, 136 impressions, 1 click, 17 distinct landing pages, 0.74% aggregate CTR, and impression-weighted average position 55.63. Google URL Inspection returned 24/25 priority URLs indexed, 0 explicitly not indexed, 1 neutral/unknown, and 0 API errors.

A material body-progress scanning content refresh had already shipped earlier on August 31 and is protected by an active experiment lock, so another public SEO/content change was not justified.

## Confirmed technical defect

Weekly Marketing Health Report run `33400493317` successfully:

- audited 100 live pages;
- generated the weekly operational report;
- passed the guard preventing autonomous editorial content generation.

Its final publication step failed after creating the sanitized audit/report commit. The audit/report commands also appended to tracked file `data/marketing-employee/logs/audit-trail.jsonl`. That file was intentionally not staged, but the remaining worktree mutation caused `git rebase origin/main` to fail with:

`error: cannot rebase: You have unstaged changes.`

The generated audit/report commit therefore never reached `main`.

## Change

Immediately after creating the sanitized report commit, the workflow now restores only the transient tracked audit log:

`git restore --worktree -- data/marketing-employee/logs/audit-trail.jsonl`

The workflow still stages and publishes only:

- `data/marketing-employee/audits/`
- `data/marketing-employee/reports/`
- `public/marketing-data/`

The existing no-autonomous-content guard is unchanged. No public SEO page, title, canonical, schema, sitemap entry, robots directive, or internal link was changed.

## Hypothesis

Discarding the intentionally unpublished transient audit-log mutation before rebasing will allow successful weekly audit/report publication while preserving the workflow's strict sanitized-output boundary.

## Target metrics

1. Next Weekly Marketing Health Report completes successfully.
2. Sanitized audit/report artifacts reach `main` when they change.
3. No `data/marketing-employee/logs/audit-trail.jsonl` mutation is included in the weekly report commit.
4. No drafts, calendars, roadmaps, SEO-growth plans, or public blog content are created by this analytics-only workflow.
5. No rebase failure caused by unstaged generated files.

## Expected direction

- Weekly SEO observability reliability: increase.
- Lost weekly audit/report publications: decrease to zero for this failure mode.
- Public search-content churn: unchanged.
- Editorial autonomy from the analytics workflow: unchanged at zero.

## Review window

- **Earliest validation:** next manually or scheduled executed Weekly Marketing Health Report.
- **Scheduled reliability review:** 2026-09-07, after the next weekly schedule.

## Risks

The fix is intentionally narrow. If future audit tooling creates a different tracked or untracked transient file, that new file could independently block rebase and should be diagnosed rather than broadly discarding the entire worktree. This avoids hiding unexpected workflow mutations.
