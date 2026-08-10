# One-time Google authorization required

Everything controlled by the repository is validated and the SEO production system is safely fail-closed. The existing Google service account authenticates successfully, but Google Site Verification is disabled in its Google Cloud project.

## Complete this one Google-owned step

[Open the Google Site Verification API page](https://console.cloud.google.com/apis/library/siteverification.googleapis.com)

Sign into the Google account that owns the Cloud project used by the repository's existing `GOOGLE_CLOUD_JSON` service account. Select that project if Google Cloud asks, then click **Enable**.

Do not paste any JSON key, API key, client secret, or refresh token into GitHub, chat, or an issue.

After the API is enabled, the scheduled **Search Console bootstrap** workflow automatically:

1. requests Google's official FILE verification token;
2. commits and deploys that token through GitHub Pages;
3. verifies `https://youraicoach.life/` for the existing service account;
4. adds the HTTPS URL-prefix Search Console property;
5. proves private `query,page` API access;
6. updates the public production-readiness marker;
7. activates daily GSC-backed SEO production;
8. removes this file and closes the corresponding GitHub issue.

Until then, the daily SEO workflow reports a safe no-action run and never falls back to guessed keywords.
