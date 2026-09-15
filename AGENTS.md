# IZEM Repository Agent Policy

## SEO authority

The ChatGPT senior SEO lead is the strategy, research, implementation-review, and release decision-maker for `youraicoach.life`. GitHub is repository, CI, and deployment infrastructure only. GitHub Copilot, Gemini, and external LLM APIs are optional fallbacks and must never be required for a daily SEO decision, code review, approval, or release.

Read `config/seo-agent-policy.json` before doing SEO work.

## Private exact Search Console evidence

Before selecting a keyword or page-level SEO action, use the newest exact Search Console query + landing-page evidence when the private handoff is healthy:

1. Fetch public issue `jebbari-mohammed/website#34` and read its exact Search Console workflow-run URL, encrypted artifact name, row count, reporting period, and public-key fingerprint.
2. Fetch that run's workflow artifacts and download the named encrypted artifact. Never treat the public-safe landing-page aggregates as a substitute for exact query/page rows when the encrypted artifact is available.
3. Read the machine-readable private vault manifest from the connected private repository at `jebbari-mohammed/AI-Gym-Coach/.private-seo/gsc-evidence/vault.json`.
4. Use the private vault decryptor and private key in an authorized private working directory. Verify the key fingerprint, AES-GCM authentication, query/page dimensions, row count, and reporting period.
5. Use the decrypted query, page, clicks, impressions, CTR, and average position only for private SEO reasoning. Never paste exact rows or the private key into this public repository, public issues, public pull requests, public workflow logs, or public reports.
6. Delete local plaintext evidence after the decision cycle.
7. If the issue, artifact, private vault, or verification path fails, state the reduced confidence and fall back to public-safe aggregates or observation. Never guess exact queries or silently reuse stale exact rows as current evidence.

## Cold-start default

Until at least 30 days of useful Search Console query/page data exist, the normal daily action is to create one new, indexable search entry targeting a new, low-competition, business-relevant intent. Across a representative month, aim for roughly:

- 65–75% new articles, landing pages, calculators, templates, checklists, or other search-entry assets.
- 15–20% discovery and architecture work such as internal links, hubs, sitemap/indexing fixes, and orphan-page repair.
- 10–15% technical, trust, conversion, or existing-page optimization work.

This is a portfolio target, not permission to publish filler. A no-change decision remains valid when no safe opportunity passes the gates. Publish at most three excellent new top-level English blog posts in any rolling seven-day period. Three is a ceiling, not a quota; publish zero when no opportunity is strong enough.

## New-page gates

A new URL may be published only when all of these are true:

1. The intent is meaningfully different from every existing indexable IZEM URL.
2. Live SERP review shows attainable competition or a clear task gap.
3. The query is relevant to IZEM’s accountability, adaptive training, meal planning, coaching, or consistency value.
4. The page adds concrete information gain: a framework, decision tree, calculator, template, checklist, worked example, comparison method, original product explanation, useful table, or another real utility.
5. Claims are supportable, health language is careful, and no studies, prices, testing, testimonials, outcomes, or competitor details are fabricated.
6. The page is indexable, self-canonical, included in discovery files, linked contextually from relevant pages, and validated before release.

## Human writing and anti-template editorial pass

Every new English article and every material editorial rewrite must receive a final natural-language pass inspired by the open-source `blader/humanizer` approach (`https://github.com/blader/humanizer`). The purpose is to remove generic AI-writing tells and make the prose read like careful human editing while preserving every supported fact, citation, SEO intent, and safety constraint. This is a writing-quality rule, not a promise to defeat AI detectors.

Apply these rules after research and fact-checking, before publication:

- Preserve verified names, numbers, dates, quotations, citations, product facts, competitor facts, and medically sensitive qualifications. Never “humanize” by changing evidence.
- Never invent first-hand experience, testing, interviews, emotions, testimonials, personal stories, credentials, or user outcomes to sound human.
- Remove canned openings and closers such as “let’s dive in,” “in today’s world,” “in conclusion,” “honestly,” and similar stage-setting filler.
- Avoid formulaic contrast constructions such as repeated “not X, but Y,” “it’s not about X; it’s about Y,” and fake objections used only for rhythm.
- Avoid forced groups of three, repeated sentence openings, overly symmetrical paragraphs/cards, dramatic one-line closers, and tidy slogan-like aphorisms unless the content genuinely calls for them.
- Avoid inflated significance, vague authority (“experts say,” “research shows”) without a named source, excessive sales language, and stock AI vocabulary when a simpler word is clearer.
- Prefer concrete nouns and verbs, natural contractions where appropriate, and varied sentence and paragraph length. Let some paragraphs be short and others carry a fuller thought.
- Use headings because they help the reader, not to manufacture a rigid template. Do not force every H2 to be a question, and do not repeat the heading in the first sentence.
- Use bullets, tables, bold text, frameworks, and acronyms only when they materially improve comprehension. Do not manufacture a framework just to create “information gain.”
- Avoid em-dash-heavy prose and decorative punctuation patterns. Prefer normal punctuation unless a specific editorial reason requires otherwise.
- Remove chatbot residue, drafting commentary, knowledge-cutoff disclaimers, references to “the prompt,” and meta commentary about the writing process.
- Do not keyword-stuff. Use the target wording where it is natural, then write semantically around the topic like a knowledgeable editor.
- After the rewrite, perform a second read specifically for repeated cadence, generic filler, over-clean symmetry, unsupported certainty, and any factual drift introduced during editing.

The final test is not whether a detector labels the text “human.” The final test is whether a real reader gets a specific, useful, credible answer that does not feel mass-produced.

## Experiment discipline

- Make at most one material SEO change per day by default.
- Do not materially rewrite a newly published page for 21–30 days unless fixing an error or technical/indexing blocker.
- Allow 14–28 days for title/snippet experiments and 14–21 days for internal-link experiments.
- Never update the same page every day.
- Preserve recent experiments and unrelated newer work.
- Prefer a new non-overlapping keyword opportunity over repeatedly polishing a page that Google has not yet recrawled.

### Active experiment locks

Before editing any existing public page or homepage component, read `config/seo-active-experiments.json`.

- If the target file is listed in an active lock, do not modify it before `lockUntil`.
- A lock may be shortened or removed early only for a documented factual, legal, safety, rendering, indexing, canonical, or deployment correction. Record the reason in the same reviewed change.
- New material experiments should add or refresh their target-file lock so the repository can enforce the evaluation window mechanically.
- Do not bypass a lock merely because a new query appears or because another agent proposes a rewrite. Wait for the existing test to mature unless the documented exception is stronger than preserving attribution.
- Pull requests and pushes touching protected targets are checked by `.github/workflows/seo-active-experiment-guard.yml`.

## Exceptions to the new-post default

Technical or existing-page work may win when it has clearly higher expected value, especially when deployment, indexability, crawlability, canonicalization, rendering, schema, safety, legal accuracy, or site-wide discovery is broken; when GSC shows a strong near-ranking or CTR opportunity; when a mature experiment needs evaluation; or when no new keyword passes the publication gates.

## Release safety

Review the diff yourself. Do not wait for Copilot or Gemini review. Run the relevant build, structured-data validation, sitemap checks, critical-route checks, internal-link checks, and live verification. Use a branch/PR for substantial, architectural, destructive, or uncertain changes; small safe changes may use the established direct-publish path.
