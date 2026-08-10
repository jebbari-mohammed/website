# SEO Production Runbook

## Normal operation

1. `Daily SEO Production` runs once each morning.
2. It validates private GSC and Gemini credentials.
3. It may publish one evidence-backed change or publish nothing.
4. A successful content change is not considered complete until the exact marker is visible on the live URL.
5. `IZEM SEO Strategist` runs in the evening, reviews the morning action, and avoids duplicating it.

## Manual non-mutating verification

Dispatch `SEO production validation` or `Daily SEO Production` with `dry_run=true`. A healthy run proves:

- the service account can query `sc-domain:youraicoach.life`;
- at least one query+page row is returned;
- the current Gemini SDK and at least one configured stable model/key work;
- live search grounding returns or the publisher uses its conservative fallback;
- drafting, criticism, repair, sanitization, metadata rendering, and quality gates complete;
- no public file changes.

## Failure handling

The daily workflow creates or updates one issue titled:

```text
[SEO Automation] Production pipeline needs attention
```

Review the linked workflow run. Do not paste exact GSC queries or credentials into the issue.

Common failure classes:

- **Missing GSC secret:** add `GOOGLE_SERVICE_ACCOUNT_JSON` and grant the service-account email Search Console access.
- **GSC HTTP 403:** the credential exists but lacks property access.
- **Zero GSC rows:** check the property identifier and whether the site has query+page evidence for the selected period.
- **Gemini smoke failure:** rotate a key or update the stable model list after checking official model lifecycle documentation.
- **Quality-gate rejection:** inspect the private run log; do not weaken claim/safety gates merely to force publication.
- **Build/link/schema failure:** fix the affected public files before publication.
- **Live marker timeout:** inspect Pages deployment and caching; do not report the SEO action as complete.

## Rollback

Every automated refresh is wrapped by a unique `SEO_GROWTH_REFRESH_START/END` marker and every create has an `SEO_EXPERIMENT` marker. Revert the production commit rather than editing around a broken marker. Rebuild discovery files and redeploy, then record the experiment as rolled back.

## Measurement

Do not judge a publication the next day. Review refreshes no earlier than 21 days and new pages no earlier than 35 days unless there is an indexing or technical failure. Compare landing-page query metrics against the stored baseline and record whether the hypothesis won, lost, or remains inconclusive.
