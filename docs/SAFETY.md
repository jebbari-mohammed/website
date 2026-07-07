# Safety Rules

## Non-Negotiables

- No fake likes, follows, comments, DMs, or engagement manipulation.
- No browser automation to bypass platform rules.
- No direct social publishing without official API/OAuth/scheduler integration.
- No unsupported medical, legal, financial, or guaranteed outcome claims.
- No destructive website changes without explicit approval and backups.
- No hidden AI-evasion tricks.

## Autonomy Modes

### manual

Everything requires review. This is the default.

### safe_autopilot

Allowed:

- crawl owned website
- generate SEO reports
- generate keyword roadmap
- generate blog drafts
- prepare social drafts
- generate weekly reports

Blocked:

- destructive code changes
- direct publishing
- controversial or regulated claims without review
- impersonation
- platform limit bypass

### full_autopilot

Reserved for explicitly configured safe actions. It still respects blocked actions, rate limits, audit logging, and emergency stop.

## Policy File

The source of truth is:

```text
config/autonomy.policy.json
```

Use `emergencyStop: true` to halt all agent actions.

## Claim Handling

The validator flags:

- banned brand claims
- legacy/avoided terms
- regulated wording
- statistics or study-like statements that need verification

Flagged drafts should remain in review until a human approves or edits them.

