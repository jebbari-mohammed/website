# SEO Experiment: Deterministic Private GSC Artifact Handoff

- **Status:** implementation
- **Launch date:** 2026-08-21
- **Action class:** SEO observability / private first-party evidence architecture
- **Owner:** ChatGPT senior SEO lead

## First-party baseline

The latest public-safe Search Console snapshot covers 2026-07-24 through 2026-08-20 and reports:

- 43 private query + landing-page rows;
- 61 impressions;
- 0 clicks;
- 12 distinct landing pages;
- 25 priority URLs inspected;
- 18 indexed URLs;
- 0 URL Inspection API errors.

The matching encrypted envelope exists in the workflow logs and the connected private repository already contains the correct RSA-3072 private key. The key fingerprint matches the public workflow key. A manual authorized decryption recovered all 43 rows and verified the reporting period.

## Problem

The working cryptography was hidden behind a fragile retrieval path:

1. Find the current safe-snapshot issue.
2. Extract the run ID.
3. Find the correct job.
4. Download the entire job log.
5. Parse and concatenate base64 lines between log markers.
6. Discover the private key path manually.
7. Reimplement decryption for each run.

That process can fail even when the evidence itself is healthy. It also makes the daily SEO brain more likely to fall back to aggregates or stale exact rows.

## Change

The Search Console health workflow now:

1. writes the encrypted envelope to a mode-0600 JSON file;
2. validates envelope version, algorithm, row count, period, and public-key fingerprint;
3. uploads the ciphertext-only file as a named workflow artifact: `private-gsc-evidence-v1`;
4. retains the artifact for 14 days;
5. records the artifact name, file, row count, period, and fingerprint in the stable public-safe issue;
6. continues to print no plaintext query or query-to-page pair.

The connected private repository now contains a machine-readable vault manifest and a fail-closed decryptor that validates RSA fingerprint, RSA-OAEP-SHA256 unwrapping, AES-256-GCM authentication, gzip decoding, query/page dimensions, row count, and reporting period. The decryptor requires an explicit output path and never prints exact queries.

The repository agent policy now requires the daily SEO lead to use this artifact + private-vault path before selecting a keyword or page-level action when it is healthy.

## Hypothesis

A named encrypted artifact plus a private machine-readable vault will make every fresh exact Search Console row deterministically usable by the ChatGPT SEO brain without exposing plaintext business evidence publicly.

## Baseline

- Fresh exact rows available in the workflow: **43**.
- Fresh exact rows manually decryptable with the authorized key: **43**.
- Fresh exact rows available through a deterministic named artifact/decryptor path: **0**.
- Public plaintext query exposure: **0**.

## Target metrics

1. The post-merge Search Console workflow uploads exactly one artifact named `private-gsc-evidence-v1`.
2. Issue #34 points to the exact workflow run and records matching artifact metadata.
3. The private decryptor recovers the same row count and reporting period as the public-safe issue.
4. The private-key fingerprint matches the artifact envelope.
5. Exact query, page, clicks, impressions, CTR, and position are usable privately.
6. Public plaintext query exposure remains zero.
7. A corrupted artifact or wrong key fails closed.

## Expected direction

- Log-parsing dependency: required → optional fallback.
- Deterministic exact-row retrieval: unavailable → available.
- Daily keyword confidence: aggregate-only fallback → current exact query/page evidence.
- Public plaintext exposure: remain zero.

## Review window

- **Immediate technical verification:** first Search Console health run after merge.
- **Immediate private verification:** download the new artifact and decrypt it with the connected private vault.
- **Operational confirmation:** the next scheduled daily SEO cycle consumes the artifact before choosing an action.

## Risks and controls

- The artifact is attached to a public repository run, but it contains ciphertext only; confidentiality still depends on the private key remaining private.
- Artifact retention is 14 days, so the daily SEO process should always use the newest safe-snapshot run rather than treating GitHub as long-term analytics storage.
- The stable safe issue includes no ciphertext, plaintext query, or query-to-page pair—only retrieval metadata and public-safe aggregates.
- The workflow fails if artifact generation or upload fails.
- The private decryptor fails for wrong keys, fingerprint mismatch, modified ciphertext, invalid authentication tags, row-count mismatch, period mismatch, or incomplete dimensions.
