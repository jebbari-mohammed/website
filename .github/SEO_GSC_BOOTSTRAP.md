# Connect Google Search Console to SEO Production

The SEO production pipeline is fully fail-closed until GitHub has one repository secret:

```text
GOOGLE_SERVICE_ACCOUNT_JSON
```

The service account needs read access to the Search Console property:

```text
sc-domain:youraicoach.life
```

## Fastest secure setup

### 1. Create a Google Cloud service account and JSON key

In Google Cloud Console:

1. Select the Google Cloud project you want to use for IZEM automation.
2. Open **IAM & Admin → Service Accounts**.
3. Create a service account named `izem-seo-search-console`.
4. Open that service account → **Keys → Add key → Create new key → JSON**.
5. Keep the downloaded JSON private. Do not upload it to the repository or chat.

Google documents service-account creation and JSON key generation at:

```text
https://developers.google.com/workspace/guides/create-credentials#service-account
```

### 2. Give the service-account email Search Console access

Open Search Console for `youraicoach.life`, then:

1. **Settings → Users and permissions**.
2. Choose **Add user**.
3. Paste the JSON file's `client_email` value.
4. Grant **Full** access. The workflow only requests the read-only Search Console OAuth scope.

Google recommends granting only the permission level required for the work:

```text
https://developers.google.com/search/blog/2023/02/search-console-user-permissions-update
```

If Search Console refuses the service-account email in the normal user UI, use the official delegated-owner flow documented for service accounts:

```text
https://developers.google.com/search/apis/indexing-api/v3/prereqs#grant_owner_status_to_your_service_account
```

### 3. Store the JSON as an encrypted GitHub Actions secret

Open:

```text
https://github.com/jebbari-mohammed/website/settings/secrets/actions/new
```

Set:

```text
Name: GOOGLE_SERVICE_ACCOUNT_JSON
Secret: the complete JSON file contents
```

GitHub encrypts Actions secrets before storage and only exposes them to workflows that explicitly request them.

### 4. Rerun the failed credentialed smoke

Open PR #2 checks and rerun the failed job:

```text
https://github.com/jebbari-mohammed/website/pull/2/checks
```

The smoke passes only when all of these are real and working:

- the secret exists and is valid service-account JSON;
- Google OAuth accepts its signed JWT;
- the account can read `sc-domain:youraicoach.life`;
- Search Console returns at least one `query,page` row;
- the current Gemini SDK/model/key returns structured output;
- live Google Search grounding works;
- draft, critic, repair, sanitizer, and renderer pass;
- no public file is changed during the smoke.

## Command-line helper

A helper is available at:

```bash
bash tools/ai-marketing/bootstrap-gsc-secret.sh YOUR_GCP_PROJECT_ID
```

It creates the service account/key, pauses while you grant Search Console access, encrypts the complete JSON into the GitHub secret through `gh`, removes the local key, and reruns the failed PR validation.
