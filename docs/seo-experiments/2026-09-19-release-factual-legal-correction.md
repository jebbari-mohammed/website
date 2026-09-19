# Release factual and legal correction — 2026-09-19

## Governance decision

Commit `d08a071e072c205892877030f2af484354b66793` is an explicitly reviewed exception to the active `/best-ai-fitness-app` experiment lock. The lock definition, target, and evaluation dates remain unchanged.

The exception is required because the protected public pages contained release-blocking factual and legal inaccuracies. The correction changes the paid voice allowance from 350 to 300 minutes per monthly subscription usage cycle, changes the one-time onboarding call from up to five minutes to exactly three minutes, and states the current Apple Health boundary accurately: voice calls do not receive Apple Health context in this release.

## Narrow scope

The protected files changed by the exception are:

- `public/best-ai-fitness-app.html`
- `public/izem-ai-fitness-coach/index.html`

No experiment lock was removed, shortened, retargeted, or weakened. The same facts were aligned across the homepage source, `llms.txt`, and the audited legal/support pages so that the public site has one release truth.

## Validation

The exact corrected source passed the production build, owner-image policy, legacy-content audit, critical-route validation, JSON-LD validation, and the internal-link check covering 452 pages and 10,419 links. Content-integrity, SEO production-validation, and Pages deployment workflows also passed on the exact factual-correction commit. The active-experiment guard's expected failure is the mechanical record that a protected target changed; this document is the repository-required reviewed governance exception for that change.
