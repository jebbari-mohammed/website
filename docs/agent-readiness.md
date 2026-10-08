# Public agent access

The homepage at `https://youraicoach.life/` supports HTTP content negotiation. Browsers receive the existing, fully rendered HTML. A request with `Accept: text/markdown` receives a Markdown representation generated from that same built page. Both responses include `Vary: Accept`, UTF-8 content types and separate entity tags. Unsupported representations return 406; quality values and explicit exclusions follow HTTP media-range precedence.

Missing paths retain HTTP 404. Markdown clients receive an explanation with links to the agent guide and sitemap; HTML clients receive the existing built 404 page. The handler serves only GET and HEAD. It has no app API, account actions, database client, model calls, secrets or outbound requests.

## Discovery and identity

- `/llms.txt` follows the [published llms.txt format](https://llmstxt.org/) and maps specific use cases to the appropriate public resources. The other linked pages retain ordinary HTML delivery.
- `/index.md` is generated from the homepage and served as `text/markdown; charset=utf-8`. The negotiated homepage exposes `alternate` and `describedby` links.
- Homepage Open Graph metadata uses the existing people-free 512px IZEM PNG logo, including accurate image dimensions and alt text.
- The Organization retains its support contact and identifies only the locality and country already displayed by the site: Casablanca, Morocco. No street address or telephone number is invented.

## Firebase deployment

Firebase Hosting serves matching static files before rewrites. `npm run prepare:agent-hosting` copies the validated `dist` build to `dist-agent-hosting`, preserving every static asset except the root `index.html`. It copies that exact HTML and the HTML 404 into the function's generated `bundle` and creates the Markdown representation. The ordinary `dist` build remains intact for previews and existing route checks.

The fallback rewrite uses `agentPages` in the isolated `agent-pages` codebase in `us-central1`. Existing static product pages, tools, blog pages, authentication actions and app association files retain their Hosting behavior. Function deployments must remain scoped to this codebase. The site's existing app functions are not part of this repository's deployment manifest.

`pinTag: true` ties the function revision to each Hosting release, and a Hosting rollback restores the matching function revision. First deploy with `firebase deploy --only functions:agent-pages:agentPages`, then run `firebase deploy --only hosting,functions:agent-pages:agentPages`. The workflow performs these sequential commands for both credential paths. Firebase CLI 15.29.0 expands a new pinned function to the default codebase even when a combined selector explicitly includes `agent-pages`; creating the isolated endpoint first avoids that expansion. Both commands exclude other app functions. Do not deploy a staged directory containing a root `index.html`: it would silently disable homepage negotiation. Do not publish the staged Hosting rewrite unless the function deployment succeeds.

The repository's existing article, media, weekly publishing, image policy and route checks remain enabled. The release workflow adds handler tests, built metadata checks, Firebase emulator checks and live verification. The function scales to zero and is capped at three instances; the existing short public caching policy is preserved for successful homepage responses, while errors are not cached.

Deployment needs an already enabled Firebase billing plan and credentials authorized for second-generation Functions, its build/runtime dependencies and Hosting. Credential selection checks Hosting access, resolves the project number from authenticated project metadata, and uses read-only `testIamPermissions` requests to check `iam.serviceAccounts.actAs` on both the App Engine account required by Firebase CLI and the Compute account used by this second-generation function. It also verifies Functions create/update/public-invocation permissions, build inspection, and Cloud Run permissions required for the public endpoint and Hosting pinTag. Service-account candidates and CI-token candidates must pass the same checks. The separate `GOOGLE_CLOUD_JSON` Search Console/AI credential is excluded from deployment selection. No check changes IAM or reads credential contents to identify a principal. Deployment still validates build/service-agent bindings and other prerequisites. The endpoint is configured for public invocation. Existing project/application role assignments and existing functions are unchanged; this change does not create credentials or authorize a billing upgrade. If prerequisites are unavailable, retain the previous healthy Hosting release and report the precise failed permission. Obtain owner approval for each IAM grant before applying it, scoped to the exact service-account resource rather than all service accounts in the project.

## Verification

```sh
npm ci --prefix functions/agent-pages --ignore-scripts
npm run test:agents
npm run build
npm run prepare:agent-hosting
AGENT_METADATA_ROOT=dist node --test tools/agent-metadata.test.mjs
npm install --global firebase-tools@15.29.0
FIREBASE_TOOLS_ROOT="$(npm root --global)/firebase-tools" node --test tools/agent-deploy.test.mjs
firebase emulators:exec --only hosting,functions --project demo-izem-agent-readiness 'node tools/verify-agent-readiness.mjs http://127.0.0.1:5000'
node tools/verify-agent-readiness.mjs https://youraicoach.life --all-pages
```

The live checker validates response bodies as well as status codes and headers. It alternates representations at the same URL to detect CDN cache contamination, tests quality values and unsupported media, checks actual 404s and HEAD requests, validates discovery/identity files and fetches linked resources. The all-pages mode additionally checks every URL in the primary sitemap.

Manual checks:

```sh
curl -sS -L -i -H 'Accept: text/markdown' https://youraicoach.life/
curl -sS -L -i -H 'Accept: text/html' https://youraicoach.life/
curl -sS -L -i -H 'Accept: text/markdown' https://youraicoach.life/__agent-readiness-missing
```

Protocol references: [HTTP Semantics (RFC 9110)](https://www.rfc-editor.org/rfc/rfc9110.html), [Markdown media type (RFC 7763)](https://www.rfc-editor.org/rfc/rfc7763.html), [Accept Markdown](https://acceptmarkdown.com/), [Firebase routing](https://firebase.google.com/docs/hosting/full-config), [Firebase caching](https://firebase.google.com/docs/hosting/manage-cache), [Open Graph](https://ogp.me/), and [PostalAddress](https://schema.org/PostalAddress).

This is a technical discovery and response correction requested by the owner on October 8, 2026. It changes no visible homepage copy, product features, prices, article experiment or existing evaluation window. The prior 78/100 audit is an immutable snapshot; a new score is valid only after a fresh post-deployment scan.
