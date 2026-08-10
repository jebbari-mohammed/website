# SEO Production Merge Decision

The hardening branch is safe to merge before the Search Console credential is added because production is fail-closed:

- all deterministic, source-schema, build, built-schema, route, and link checks pass;
- the current Gemini SDK and Gemini 3.6 model access are proven;
- the independent Google Search grounding, draft, critic, repair, sanitizer, and renderer smoke passes without public mutations;
- the daily publisher refuses to act when `GOOGLE_SERVICE_ACCOUNT_JSON` is absent or unauthorized;
- merging immediately removes the old conflicting scheduled generators and fake freshness automation from `main`.

After merge, the system remains intentionally inactive for GSC-backed publication until the repository owner adds the encrypted secret and the full private smoke passes. This is a configuration blocker, not a reason to leave known unsafe automation on `main`.
