# Three-layer editorial publishing gate

## What this change does

All new or changed in-scope website source files must have a signed review packet before the normal build may succeed. Checks run both before and after the build. They compare against the fixed migration commit `19c1276aa7db2685515398fdf16cfdd1dfa45fa6`, not only the previous push: an unapproved article cannot slip through in a later unrelated deployment. Existing unchanged content is grandfathered, not certified. No historical articles are rewritten by installing this gate.

The supported publishing route is the repository's normal `npm/pnpm build` path, used by `.github/workflows/deploy.yml`. This is a source-content gate, not proof that every byte of the final browser render was automatically verified. Direct Firebase deployments, altered build scripts, runtime/CMS content and separate repositories require their own enforcement. In particular, this does not modify or protect the separate native-app binary release pipeline.

## Three layers

1. **Editorial quality.** Apply the local `content-release` skill and existing Humanizer-inspired policy. Preserve evidence; remove formulaic prose without inventing human experiences.
2. **Independent detector results.** Send the same frozen English copy to GPTZero, Copyleaks and Sapling. Each report is bound to a SHA-256 text hash. GPTZero must return `HUMAN_ONLY` with high confidence; Copyleaks `summary.ai` must be at most 0.10; Sapling's document `score` must be at most 0.10. These are conservative local editorial settings, not a shared probability scale or a human-authorship certificate. Do not average them. A missing, malformed, mixed, low-confidence or failed result blocks release.
3. **Evidence and human accountability.** Record material claim/source/check pairs, original useful value and its evidence, a plagiarism review, and confirmation that the review covers the actual rendered copy. Then a real human signs the exact packet after inspecting the original detector responses. AI agents must never generate the owner's approval key or sign on the owner's behalf.

A signature establishes approval by the configured key holder; it does not mathematically establish that the signer is biologically human. Keep that key exclusively with the actual human reviewer and outside all agent/automation environments. The evidence review is not replaceable by a text classifier or a CAPTCHA.

## Initial status and required setup

This change includes code, a skill and tests. It does **not** include a real article detector pass, provider credentials, a human approval or an owner approval key. No provider scans are performed by builds or tests. Tests contain explicitly synthetic fixtures only.

Configure `GPTZERO_API_KEY`, `COPYLEAKS_EMAIL`, `COPYLEAKS_API_KEY` and `SAPLING_API_KEY` in a trusted local environment for the explicit scanner command. Do not paste secrets into chat, commits, issues or PRs. API access and any charges are governed by the provider accounts; the scanner makes no purchases and never retries automatically. All credentials must be present before any provider is called.

A human reviewer must independently create an Ed25519 signing key on their own machine, outside this repository and any agent-accessible environment. Export its public key and place **only that public PEM** in `humanReviewPublicKeyPem` in `config/content-release-policy.json`. Leave the private key offline. No owner key was generated as part of this implementation.

Protect `main` and require the Content release checks. Protect changes to the baseline, public key, policy, scripts and workflows with independent human review. The branch was unprotected when this change was prepared; this patch does not claim to have enabled repository-admin protections. Someone able to change the enforcement code or trust key can bypass it without those controls.

## Publishing a page

Read `.agents/skills/content-release/SKILL.md`. For HTML:

```sh
node tools/content-release-gate.mjs prepare public/blog/example.html
```

The command writes a pending `.content-reviews/<path-hash>.json` packet. It extracts HTML prose, metadata, accessibility strings and structured-data strings without executing scripts. Preparation never claims the editorial pass is complete. For JSX, JSON or other copy-bearing sources, supply the actual rendered public copy as the third argument:

```sh
node tools/content-release-gate.mjs prepare src/Example.tsx /private/path/rendered-copy.txt
```

For these non-HTML sources, automated source-to-prose coverage is not claimed; the human must confirm that all changed public copy is included. Never submit source code itself to the detectors.

After actually completing layer 1, fill its fields and timestamp in the packet. Then:

```sh
node tools/content-detector-scan.mjs .content-reviews/<path-hash>.json --allow-external-processing
```

The flag authorizes sending only this packet's public-ready copy to the three named providers. The scanner saves original responses in a private temporary directory with restrictive permissions, prints that location, and records their hashes plus minimal native result fields in the packet. It clears any old human approval/signature when re-scanning, even if credentials are missing or a provider fails. It never treats sandbox results as real evidence.

Finish the verification section against real evidence. The human reviewer must compare the recorded response hashes and verdicts with those private original responses before approval. The build validates structure, content hashes and human signatures; it does not independently authenticate a fabricated provider response pasted into a JSON file. The trusted human is responsible for that evidence check.

The human then sets their name, approval and timestamp in the packet and signs its exact final bytes offline, for example with a separately installed OpenSSL version supporting Ed25519:

```sh
openssl pkeyutl -sign -rawin -inkey /private/offline/owner-review-key.pem \
  -in .content-reviews/<path-hash>.json \
  -out .content-reviews/<path-hash>.json.sig
npm run content:check
npm run build
```

Commit only public-ready source, public-safe packet and detached signature. Do not commit original private provider responses. The full copy in the packet must already be approved for publication. Any subsequent source, copy, report or packet edit requires an updated packet and human signature; unchanged copy may reuse genuine reports bound to the identical text hash. To prepare a replacement, deliberately archive the previous packet outside the repository first; preparation refuses accidental overwrites.

## Scope and limitations

The guard includes root `index.html`, nested public HTML/Markdown/text/JSON, and copy-bearing source files under `src`, `content`, `copy` and `locales`. It includes untracked new files. Missing baseline history fails closed; CI must fetch full Git history.

Generated blog/video discovery indexes and machine-only manifests/version metadata are excluded because the normal deployment regenerates them from source material. Robots, sitemaps, tests, internal docs, stylesheets and credentials are outside the prose gate. Preserve existing technical, media and security checks. New generators, embedded text in images/video, dynamically injected copy or routes in another source location must be explicitly brought into scope before use.

The current combination supports English only and is conservatively limited to 300 or more whitespace-delimited words and at most 80,000 characters. Short copy and other languages remain blocked rather than being assigned a fake pass. Do not pad short copy, silently translate it for a detector, or truncate long copy. Supporting those cases requires a separately reviewed policy/provider extension. A technical-only change to a copy-bearing file may also require a new signed review; the guard deliberately errs toward blocking.

A high detector score can be wrong, and a low score does not establish human authorship. This workflow is a publishing preference, not a prediction about a future search-policy change. No guarantee of rankings, future penalties or detector immunity is made.

## Primary references checked on 2026-09-26

- Wikipedia editorial reference: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- Upstream Humanizer inspiration: https://github.com/blader/humanizer
- GPTZero API and limitations: https://gptzero.me/developers
- Copyleaks endpoint: https://docs.copyleaks.com/reference/actions/writer-detector/check/
- Copyleaks authentication: https://docs.copyleaks.com/reference/actions/account/login/
- Sapling endpoint, English support and model version: https://sapling.ai/docs/api/detector/
