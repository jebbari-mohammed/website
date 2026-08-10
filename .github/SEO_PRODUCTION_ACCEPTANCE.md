# SEO Production Acceptance Criteria

The hardened SEO production change is ready to merge only when all of the following are true:

- [ ] The branch is cleanly mergeable with current `main`.
- [ ] The lockfile contains the current `@google/genai` production dependency.
- [ ] Deterministic planner, clustering, sanitizer, metadata, and idempotency tests pass.
- [ ] The full production website builds.
- [ ] Source and built JSON-LD validate.
- [ ] Critical routes and internal links validate.
- [ ] The credentialed smoke verifies real Search Console access and non-empty query+page evidence.
- [ ] The credentialed smoke verifies at least one stable Gemini model/key through the current SDK.
- [ ] The grounded draft, critic, repair, and deterministic renderer complete without changing public files.
- [ ] No exact GSC query or secret appears in committed files or public summaries.
- [ ] Conflicting scheduled comparison, translation, and fake freshness jobs are removed or made non-mutating.
- [ ] GitHub Pages deployment uses current action runtimes and blocks invalid schema/routes/links.
- [ ] After merge, the live `seo-system-version.json` marker returns HTTP 200.
- [ ] A manual production dry run on `main` succeeds before the first scheduled publication.

Traffic growth and rankings cannot be acceptance-tested instantly; those are measured outcomes. The system acceptance test covers evidence quality, bounded automation, safety, reproducibility, deployment, observability, and non-leakage.
