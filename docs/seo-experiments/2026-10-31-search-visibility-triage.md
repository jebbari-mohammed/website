# Search visibility investigation and publication hold

The owner authorized a temporary publication hold and focused corrections after a sharp, broad loss of Google Search visibility. The cause is unresolved. This change does not identify a Google penalty or promise recovery.

## Evidence and decision

The current Search Console Manual Actions and Security Issues reports show no issues, and the Removals report has no submitted requests. The affected best-AI-fitness-app page and workout-generator feature remain indexed. Google's recorded fetch of the former succeeded after the decline began, with the inspected URL selected as canonical.

All 302 URLs in the then-current live sitemap returned HTTP 200 with self-canonicals and no noindex directive. Browser and Googlebot user-agent responses matched on the sampled critical routes. This current snapshot cannot establish historical server availability or actual Googlebot IP access.

The newest issue #34 private handoff was authenticated against the connected private vault, including archive digest, key fingerprint, AES-GCM authentication, dimensions, row count and reporting period. Exact queries and query/page pairs remain private. Query/page row sums are not property totals because anonymized queries are omitted. The overall indexing report predates the decline and cannot establish its cause.

The four installed SEO stages informed this decision: technical/indexing diagnosis, private evidence interpretation, product and existing-intent review, and a final humanizer/factual-drift pass. No new keyword or URL was selected. Overlapping accountability pages need further intent review; they are not being merged or redirected on the strength of similar prose alone.

## Operational hold

`config/seo-publication-hold.json` blocks automated publication and content mutation at the repository entry points. Analysis and dry runs remain available. The hold requires an explicit manual review decision; its November 3 review date is not automatic permission to resume.

The three existing Codex SEO jobs were already paused and remain paused: `daily-callio-seo-posts`, `daily-callio-seo-evening-scaler`, and `daily-callio-backlink-seo-intelligence-operator`.

These GitHub workflows were active and are now manually disabled:

- Daily IZEM YouTube Video, workflow `272331695`.
- Manual SEO Production Fallback, workflow `271534935`.
- Manual Cold-Start SEO Maintenance, workflow `332190662`.

The active video run `41206715637` was cancelled. Before cancellation it had already committed a validated article/video release and dispatched deployment `41207486286` for `37a30d4b24e88f935b0f1039e39b6d0f1ec61205`. That deployment completed successfully, including Hosting, smoke tests and live agent verification. Preserve this newly live work as the correction's release baseline.

Search Console collection, compliance monitoring, read-only freshness audits, derived discovery synchronization, validation guards and deliberate production deployment remain enabled. The external source of earlier scheduled promotion/link-weaving commits is unresolved; the repository hold covers the known mutation scripts and instructs agents to stop automated changes.

## Factual and editorial corrections

The five corrected pages retain their titles, H1s, canonical URLs, descriptions, links, citations, media and publication dates:

- `public/best-ai-fitness-app.html`
- `public/blog/accountability-apps-for-working-out.html`
- `public/blog/best-accountability-app-for-gym.html`
- `public/blog/fitness-app-with-real-voice-coaching-not-chatbot.html`
- `public/blog/workout-reminder-app-that-calls-you.html`

Publisher-designed scorecards are explicitly informal, unvalidated comparison aids. Unsupported efficacy certainty and drafting residue are removed. IZEM proactive calls are described as optional, enabled and scheduled by Premium-eligible users, with matching FAQ answers where relevant. Modification dates reflect the actual correction; competitor fact-check and publication dates are preserved.

These are accuracy corrections, not a broad keyword, title, architecture or content-consolidation experiment. Existing locks on the five files had expired. A new observation lock preserves the corrected versions through November 21. All other lock definitions and unrelated recent work remain intact.

## Verification and review

Before release, review the diff and run the publication-hold tests, active-experiment guard, source schema/media/discovery checks, production build, built schema, critical-route and link checks. The normal deployment workflow also validates the agent-aware Hosting artifact and live responses. Verify corrected copy on the production URLs after the actual deployment job succeeds.

A single read-only follow-up is scheduled in the owner's current Codex chat for November 3 at 08:30 America/Los_Angeles. It will compare complete daily data with matching weekdays, inspect affected URLs and report any meaningful change or required action. It will not resume publication or change the site. Any later resume decision must explicitly clear the repository hold and re-enable only the intended workflows/jobs.
