# IZEM SEO Production Architecture

```text
Private Search Console query+page evidence
                  |
                  v
       Existing-page inventory
                  |
                  v
  Base action classifier (refresh/create/
     merge/monitor/skip + CTR diagnostics)
                  |
                  v
 Senior decision layer (expected value,
 evidence confidence, business fit, risk,
 semantic clustering and cannibalization)
                  |
                  v
       Highest-value eligible action
                  |
        +---------+---------+
        |                   |
        v                   v
 Live Google Search      Current page
 research/intent         context
        |                   |
        +---------+---------+
                  |
                  v
        Gemini drafting pass
                  |
                  v
 Independent Gemini critic/revision pass
                  |
                  v
 Deterministic sanitizer, claim, repetition,
 metadata, word-count and HTML quality gates
                  |
                  v
        Repair loop (maximum 2 repairs)
                  |
                  v
   Additive REFRESH or dedicated CREATE
                  |
                  v
 Blog/RSS/sitemap/schema/build/link checks
                  |
                  v
   Public-files-only commit and Pages deploy
                  |
                  v
       Exact live experiment-marker check
                  |
                  v
 Private experiment ledger and review window
```

## Automation boundaries

The scheduled production publisher may only apply `REFRESH` and `CREATE`. It cannot automatically merge, redirect, delete, noindex, buy links, send outreach, translate the site, or change every page's freshness date.

The evening strategist may inspect broader technical, architecture, conversion, tool, media, and linkable-asset opportunities, but substantial or risky changes should use a dedicated pull request and must not duplicate a material action already made by the morning production run.
