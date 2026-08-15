# SEO Experiment: Private Exact-Query Evidence Channel

- **Status:** launched
- **Launch date:** 2026-08-15
- **Action class:** SEO observability / first-party evidence architecture
- **Owner:** ChatGPT senior SEO lead

## First-party baseline

The 2026-08-15 Search Console health run returned 22 query + landing-page rows, 29 impressions, and 0 clicks for 2026-07-18 through 2026-08-14. The existing public workflow intentionally suppresses query strings, landing-page pairings, CTR, and position details from its logs. That protects business-sensitive Search Console evidence from public exposure, but it also prevents the senior SEO decision-maker from using the exact evidence.

The site already received a material new search-entry asset on 2026-08-15, so a separate technical/architectural improvement is preferred over another content change today.

## Problem

The current workflow briefly holds the full Search Console JSON on the GitHub runner and then discards it. Only aggregate row, click, impression, and URL Inspection totals remain readable afterward. This makes it impossible to reliably identify:

- queries already earning impressions;
- query/page pairs with rank leverage;
- high-impression low-CTR opportunities;
- unexpected intents Google associates with IZEM;
- query-level cannibalization between landing pages.

Publishing the plaintext report, a normal workflow artifact, or raw query logs in this public repository would expose that evidence to the public and is not acceptable.

## Change

The Search Console health workflow now encrypts the private report after retrieval using a fresh AES-256-GCM content key. The content key is wrapped with RSA-OAEP-SHA256 using a public RSA-3072 key stored in this public repository. The report is gzip-compressed before encryption.

Only the encrypted envelope is printed between stable log markers. The public log therefore contains ciphertext plus non-sensitive metadata such as report period, row count, algorithm version, and public-key fingerprint. It never prints plaintext queries or landing-page evidence.

The matching private decryption key is stored only in a connected private repository available to the SEO operator. It is not present in this public website repository, its Actions secrets output, its workflow summaries, or its logs.

## Hypothesis

A public-key-encrypted evidence channel will let the senior SEO process recover the exact Search Console query/page evidence from an authenticated private key while keeping the public website repository and public workflow logs free of plaintext business data.

## Baseline

- Search Console query/page rows available to Google workflow: **22**.
- Exact query/page rows readable by the senior SEO process after the workflow completes: **0**.
- Site impressions in the current 28-day summary: **29**.
- Site clicks in the current 28-day summary: **0**.

## Target metrics

1. A fresh Search Console workflow completes successfully with an encrypted evidence envelope.
2. The private SEO process decrypts the envelope and recovers the same row count reported by the public health summary.
3. Exact query, landing page, clicks, impressions, CTR, and average position become usable privately without appearing in public logs as plaintext.
4. Future opportunity scoring can prefer URLs/queries with real first-party rank or CTR leverage over cold-start guesses.

## Expected direction

- Private exact-query visibility: 0 rows → all available rows.
- Public plaintext query exposure: remain 0.
- Evidence confidence for future SEO decisions: increase.

## Review window

- **Immediate technical verification:** the first Search Console health run triggered after merge.
- **First strategic use:** the next SEO decision cycle after successful decryption.
- Rotate the key pair if the private key is ever exposed outside its private store.

## Risks and controls

- The encrypted envelope is visible publicly, so confidentiality depends on the private key remaining private.
- A future algorithm change must remain versioned and authenticated; AES-GCM supplies integrity protection for the encrypted report.
- GitHub Actions logs are not a long-term data warehouse. This channel is intentionally an evidence handoff, not analytics storage.
- No plaintext Search Console report is committed; `tools/ai-marketing/search-console-reports/` remains gitignored.
