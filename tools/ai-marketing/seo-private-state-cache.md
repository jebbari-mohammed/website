The manual SEO fallback preserves the publisher's 21-day refresh and 75-day
creation cooldown history without putting private experiment metrics or query
hashes into a public Actions cache. The cache stores one ciphertext envelope
under the runner's temporary directory. Only `publish-state-v2.json` and
`experiments-v2.json` are admitted, at most 1 MiB each. GSC reports and plans are
never included.

The helper uses the same four Search Console credential aliases and discovery
order as `gsc-fetch-private.mjs`. It normalizes the selected RSA private key to
PKCS#8 bytes, derives a separate key with HKDF-SHA256, a random 32-byte salt and a
repository/main/version context, then uses AES-256-GCM with a random 12-byte IV.
The context is authenticated. This performs no Google API call and adds no IAM
permissions, credentials or secret names. Credential values and cryptographic
errors are never printed.

The workflow authenticates the entire envelope before the publisher runs.
Malformed data, wrong keys, key rotation, tampering, unsafe paths or excess size
stop the run before publication. It creates local plaintext with directory mode
0700 and file mode 0600, seals updated state before public commit, and deletes
plaintext in an `always()` cleanup step. Cache restore and save see only the
ciphertext path.

An absent cache stops every normal publication because source markers cannot
reconstruct historical sibling-query cooldowns. It reports an actionable request
to use `dry_run=true` for validation or arrange a trusted encrypted history
migration. Dry validation with `force=false` retains the publisher's HTML marker
and existing-file checks, and never authorizes a public commit. Both state files
must exist in a valid envelope; an empty or partial history is rejected.
Legacy plaintext cache entries are not loaded by the new prefix. Their removal
and a one-time trusted history migration require a separate maintainer operation.
If the service-account key changes, an operator must migrate the
old ciphertext with the old key through a private channel; the workflow never
silently discards unreadable history. Actions cache eviction stops publication
until trusted history is restored, so durable private storage is needed if
retention beyond the cache's normal lifetime is required.

Run `node --test tools/ai-marketing/seo-private-state-cache.test.mjs` for synthetic
roundtrip, authentication, wrong-key, filesystem boundary and bootstrap checks.
These tests generate their own RSA keys and never read real credentials.
