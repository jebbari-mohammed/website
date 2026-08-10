# SEO Production Guardrails

- One scheduled publisher.
- At most one material automated SEO action per run.
- No publication without non-empty private GSC query+page evidence.
- No automatic action below medium evidence confidence.
- Existing visible pages are preferred over new URLs when intent fit is adequate.
- Query variants are clustered before URL creation.
- Generated links and arbitrary HTML attributes are disallowed.
- No unsupported medical, statistical, testimonial, ranking, price, or competitor claims.
- No destructive merge, redirect, delete, noindex, or mass translation.
- No fake freshness changes.
- No success before build, schema, route, link, deployment, and live marker checks.
- No exact GSC query in a public commit, issue, or Actions summary.
