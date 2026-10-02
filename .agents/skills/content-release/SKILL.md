---
name: content-release
description: Apply before writing, reviewing, committing or publishing website articles, landing pages, marketing copy, translations and app-store copy. Requires the three-layer editorial release process.
---

# Three-layer content release

Read `docs/content-release.md` and `config/content-release-policy.json`. Preserve the repository's existing factual, health, privacy, visual, search-intent, release and experiment rules.

## 1. Edit the actual copy

Use the repository's Humanizer-inspired rules and Wikipedia's *Signs of AI writing* as an editorial checklist. Remove generic staging, unsupported authority, inflated claims, repetitive structure and chatbot leftovers. Write for the actual reader. Preserve verified facts, source links, numbers, product limitations and appropriate uncertainty. Re-read the edited page to catch factual drift.

Do not invent anecdotes, testing, credentials, testimonials, research, emotions or outcomes. Do not add deliberate mistakes, invisible characters, copied human prose or misleading authorship labels. Useful specifics must come from genuine evidence. Do not install or execute unreviewed remote skill code.

## 2. Obtain three real reports

Prepare a packet using the release tool. Complete the editorial record, then explicitly scan the frozen text through GPTZero, Copyleaks and Sapling. Only submit public-ready prose; never private source code, personal information, credentials or unpublished business plans. Preserve provider evidence privately. Missing credentials, provider errors, unsupported language/length, mixed results and low confidence remain blocked. Never claim scans ran when they did not. Never average unrelated vendor metrics or repeatedly rewrite only to chase scores.

## 3. Verify and obtain human approval

Check material claims against their sources. Identify the page's original practical value and actual supporting evidence. Check plagiarism and rendered-copy coverage. A real human must inspect the evidence and sign the exact review packet using a private key kept outside agents and automation. Do not sign for the owner, generate their approval key, or call an AI review a human review.

Run `npm run content:check`, the relevant build and existing release checks. Do not commit public copy or deploy it before all layers pass. Use a branch/PR for changes to this system. Never move the migration baseline, weaken thresholds, or remove a hook to make a failed release pass.

References (reviewed 2026-09-26):
- https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- https://github.com/blader/humanizer

This is a repository-specific procedure, not an official Wikipedia skill or a guarantee of human authorship, detector accuracy or search rankings.
