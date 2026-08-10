# SEO Production Test Matrix

| Layer | Test | Mutates public site? |
|---|---|---:|
| Unit | Query normalization and Search Console row parsing | No |
| Unit | Semantic variant clustering and cannibalization preference | No |
| Unit | Expected-value/confidence/risk gate | No |
| Unit | HTML allowlist sanitizer and tag balance | No |
| Unit | Metadata/social-card de-duplication and marker idempotency | No |
| Static | Syntax checks for every production script | No |
| Static | Source JSON-LD validation | No |
| Build | TypeScript + Vite + prerender | No |
| Build | Built JSON-LD, critical routes, and links | No |
| Credentialed | Real Search Console authentication and non-empty rows | No |
| Credentialed | Current Gemini SDK/model/key structured response | No |
| Credentialed | Live Search grounding + draft + critic + repair + renderer | No |
| Deploy | Pages artifact and live core URL HTTP checks | Deployment only |
| Publication | Exact per-change experiment marker appears on live URL | Yes, after validated change |
