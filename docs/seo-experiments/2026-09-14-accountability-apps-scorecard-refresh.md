# Accountability Apps Scorecard Refresh - 2026-09-14

## Decision

Refresh the existing `/blog/accountability-apps-for-working-out` page instead of publishing a new accountability article.

## Evidence Used

- Verified private Search Console handoff from issue #34:
  - artifact `private-gsc-evidence-v1`
  - GitHub artifact digest matched `sha256:523bcaa88a06ffae905fe2a0c8fcbeb0b0fc692ab62d23015f19e2191d59eba8`
  - decrypted 104 authenticated query/page rows
  - reporting period `2026-08-17` to `2026-09-13`
  - public-key fingerprint `56ec78e9ac6187e930cbb4f9e0cea1dad84791287120ce9360a1afcb457352de`
- Private redacted aggregation showed accountability/call intent as the largest current cluster, with the existing accountability-apps page receiving exact query/page impressions.
- Live SERP review for public accountability-app terms showed a mix of app-store pages, product comparison pages, social check-in products, and forum questions. The gap is a practical mechanism-first decision framework rather than another generic ranked list.

## Change

- Retitled the page from a broad consistency headline to a calls-vs-reminders angle.
- Added the Accountability Mechanism Scorecard:
  - timing
  - response
  - fallback
  - privacy
  - review
- Added a calls-vs-reminders comparison table for the decision moment before a skipped workout.
- Updated metadata, `dateModified`, Open Graph article modified time, FAQ schema, RSS description, and sitemap lastmod.
- Added contextual prominence from the blog index call/accountability cluster.
- Added links to daily check-in and no-social accountability support pages.

## Cannibalization Boundary

This page owns the broad "accountability apps for working out" mechanism comparison. It should not become the named-product comparison owned by `/blog/best-accountability-app-for-gym`, which is locked until `2026-09-15` after its August 25 refresh.

## Review Window

- Lock until: `2026-10-05`
- Preferred review: `2026-10-12`
- Evaluate impressions, average position, and CTR against the 2026-08-17 to 2026-09-13 baseline.
