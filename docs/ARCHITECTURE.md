# Autonomous Marketing Employee Architecture

## Goals

Build a local/self-hosted AI marketing employee for IZEM that can audit the website, find SEO opportunities, generate drafts, repurpose content, prepare social schedules, and report performance without spammy or policy-violating behavior.

## Modules

- `apps/dashboard`: React dashboard exposed at `/marketing-dashboard`.
- `apps/worker`: CLI and lightweight worker health server.
- `packages/core`: config, autonomy policy, storage, LLM abstraction, logging, retries, rate limits.
- `packages/seo`: crawler, technical audit, keyword clustering, roadmap generation.
- `packages/content`: blog drafts, content validation, social repurposing.
- `packages/social`: Postiz public API adapter.
- `packages/agents`: orchestration workflows for audit, keywords, blog, social, weekly report.

## Data Flow

1. CLI command runs an agent workflow.
2. Agent loads `config/autonomy.policy.json`.
3. Policy evaluates whether action is allowed and whether approval is required.
4. Module produces JSON and Markdown artifacts in `data/marketing-employee`.
5. Core storage refreshes `public/marketing-data/index.json`.
6. Dashboard reads the public snapshot.
7. Audit trail is appended to `data/marketing-employee/logs/audit-trail.jsonl`.

## Storage

V1 uses local JSON/Markdown artifacts for reliability and low setup friction. The package boundary intentionally keeps storage behind `packages/core/src/storage.ts`, so a Prisma SQLite/PostgreSQL implementation can replace it without changing SEO/content/social logic.

Planned Prisma models:

- `ActionLog`
- `SiteAudit`
- `SeoIssue`
- `KeywordRoadmap`
- `KeywordCluster`
- `BlogDraft`
- `SocialPost`
- `WeeklyReport`

## LLM Abstraction

`packages/core/src/llm.ts` supports:

- OpenAI via `OPENAI_API_KEY`
- Gemini via `GEMINI_API_KEY`
- Anthropic via `ANTHROPIC_API_KEY`
- deterministic fallback when no key is configured

The system does not lock to one provider.

## Publishing Boundary

The system never posts directly to social platforms in v1. It generates drafts and can optionally push draft payloads to Postiz using `POSTIZ_API_KEY` and `POSTIZ_BASE_URL`.

## Safety Boundary

All actions go through `config/autonomy.policy.json`. The default mode is `manual`, with destructive website changes and direct publishing blocked.

