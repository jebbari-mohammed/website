# Active SEO experiment lock governance hardening — 2026-09-05

## Decision

Harden the active-experiment guard so a pull request cannot weaken an already-active lock by deleting it, shortening its lock window, retargeting it to another URL, or removing protected files.

## Evidence

- Fresh Search Console evidence for 2026-08-08 through 2026-09-04 is available: 92 private query+landing-page rows, 174 impressions, 1 click, 0.57% CTR, and 25/25 URL Inspection requests completed with zero API errors.
- `/features/ai-workout-generator` is the strongest near-page-one URL at 22 impressions, 1 click, 4.55% CTR, and average position 14.82, but it is protected through 2026-09-16.
- A separate homepage structured-data remediation already shipped today, so another ranking/content change would create avoidable same-day experiment churn.
- The existing guard reconstructs only the set of base lock IDs, then evaluates lock timing and protected files from the PR-head config. A PR that removes an active lock, shortens `lockUntil`, changes the URL, or drops protected files can therefore weaken the policy before the target edit is evaluated.

## Hypothesis

Comparing active lock definitions from the merge base against the PR head will preserve experiment attribution and prevent accidental or automated lock weakening without blocking unrelated site changes or newly introduced launch locks.

## Baseline

- Existing active locks: 14.
- Base lock IDs are reconstructed, but base lock definitions are not enforced against weakening mutations.
- Regression tests cover target-file edits and same-change lock introduction, but not active lock deletion/backdating/retargeting/file removal.

## Target metrics / expected direction

Primary:
- deleting an active base lock fails closed;
- shortening an active lock fails closed;
- retargeting an active lock fails closed;
- removing protected files from an active lock fails closed;
- strengthening a lock remains allowed;
- expired locks remain editable;
- newly introduced launch locks remain allowed.

Secondary:
- deterministic guard tests pass;
- production SEO build/link/schema/sitemap validation remains green;
- no public page, metadata, canonical, schema, sitemap, robots, or internal-link output changes.

Expected direction: neutral direct ranking impact; higher experiment integrity and lower destructive/cannibalization risk from overlapping automation.

## Review window

- Immediate: PR guard tests and production SEO validation.
- Earliest operational review: 2026-09-12, after one week of normal automated SEO activity.

## Risk

This intentionally makes active lock definitions immutable through their original lock window in normal PRs. A genuine emergency correction should use an explicitly reviewed governance override rather than weakening the lock definition in the same change.
