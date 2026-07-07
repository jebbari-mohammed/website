# Operations

## Daily Loop

1. Run a site audit if the site changed.
2. Generate or refresh the keyword roadmap.
3. Create one blog draft from the highest-opportunity keyword.
4. Repurpose that draft into social content.
5. Review claims and policy warnings.
6. Push drafts to Postiz only after scheduler credentials and approvals are configured.

## Weekly Loop

```bash
pnpm report:weekly
```

Review:

- what was prepared
- what is still draft-only
- high-severity SEO issues
- next keyword targets
- next social posts

## Postiz Draft Push

Set:

```bash
POSTIZ_API_KEY=
POSTIZ_BASE_URL=https://api.postiz.com
```

Then run:

```bash
pnpm social:repurpose -- --postiz=true
```

This sends draft payloads to Postiz through the public API. It does not bypass OAuth or platform rules.

## Audit Trail

Every agent action is logged to:

```text
data/marketing-employee/logs/audit-trail.jsonl
```

Each entry includes timestamp, agent, action, summaries, risk level, approval requirement, and status.

## Failure Modes

- Missing LLM key: deterministic drafts are generated.
- Missing Postiz key: social content stays local.
- Crawl failure: failed URLs are recorded as technical SEO issues.
- Emergency stop: all policy-gated actions are blocked.

