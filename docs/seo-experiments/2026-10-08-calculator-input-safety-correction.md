# Calculator input safety correction

- Correction ID: `macro-positive-calories-2026-10-08`
- Date: 2026-10-08
- Protected file: `public/macro-calculator/index.html`
- Experiment: `protein-calculator-reality-check-refresh-2026-09-29`
- Existing launch: 2026-09-29; lock through 2026-10-20; preferred review: 2026-10-27.

An isolated security/correctness review reproduced an impossible output from ordinary calculator inputs: baseline 500 calories and the aggressive-cut selection displayed −250 calories/day and negative protein, carbohydrate, and fat amounts. The owner explicitly approved correcting the identified code issues and deploying them on October 8.

This safety correction adds input bounds and checks that both the baseline and adjusted result are finite and positive. Invalid inputs display a fixed validation message. The existing 30/45/25 computation for valid inputs remains intact. No title, metadata, heading, editorial paragraph, link, schema, visual, or experiment date is changed. The existing protein-calculator, OG artwork, and macro-calculator protected-file entries remain in the lock.

The experiment guard permits only the reviewed complete-file transition below. It checks exact UTF-8 SHA-256 digests without trimming newlines, requires a fresh correction annotation and this review note in the same change, and rejects replay, another file, another date, or any additional content change. This does not create a general validation-edit exception.

- Reviewed base SHA-256: `910f7d1a34f87684bc903b72895d03936d815e5043a2c7d57e441374533e9655`
- Reviewed corrected SHA-256: `65e3b72cc74fe2a9047cebc26aec375d1a5c05b703c02cb0e9e8c299a89cd758`

Validation covers invalid, boundary, and valid macro inputs and the exact-digest governance checks. Related developer-server, private-worker, policy-gate, and 1RM fixes have independent regression coverage in `tools/security-boundaries.test.mjs`. Tests use temporary public fixtures and fake service/storage clients; they do not read credentials or perform network requests.

The combined regression command is `node --test tools/security-boundaries.test.mjs tools/ai-marketing/seo-active-experiment-guard.test.mjs`. It covers 13 application boundary tests and 28 experiment-guard tests. A comparison of the complete active-experiment configuration with the Git base confirmed that only this correction annotation was added; every existing field and lock remained unchanged.
