# Active SEO Production Blocker

The hardened SEO production system is intentionally fail-closed until the repository has an encrypted Actions secret named:

```text
GOOGLE_SERVICE_ACCOUNT_JSON
```

Current verified state:

- deterministic SEO tests: passing;
- all public JSON-LD: passing;
- production build: passing;
- built JSON-LD, critical routes, and internal links: passing;
- malformed legacy duplicate pages: consolidated and cleaned;
- Search Console credentialed smoke: blocked because the secret is absent;
- publication: prevented while the credential is absent.

Resolution:

```bash
bash tools/ai-marketing/bootstrap-gsc-secret.sh YOUR_GCP_PROJECT_ID
```

See `.github/SEO_GSC_BOOTSTRAP.md`. Do not merge PR #2 until its credentialed smoke is fully green.
