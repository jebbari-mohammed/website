#!/usr/bin/env bash
set -euo pipefail

REPOSITORY="${GITHUB_REPOSITORY:-jebbari-mohammed/website}"
SERVICE_ACCOUNT_NAME="${SEO_GSC_SERVICE_ACCOUNT_NAME:-izem-seo-search-console}"
PROJECT_ID="${1:-${GOOGLE_CLOUD_PROJECT:-}}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: bash tools/ai-marketing/bootstrap-gsc-secret.sh YOUR_GCP_PROJECT_ID" >&2
  exit 64
fi

for command in gcloud gh; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Required command is missing: $command" >&2
    exit 69
  fi
done

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated. Run: gh auth login" >&2
  exit 77
fi

if ! gcloud auth list --filter=status:ACTIVE --format='value(account)' | grep -q .; then
  echo "Google Cloud CLI is not authenticated. Run: gcloud auth login" >&2
  exit 77
fi

SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="$(mktemp -t izem-gsc-key.XXXXXX.json)"
cleanup() {
  if [[ -f "$KEY_FILE" ]]; then
    if command -v shred >/dev/null 2>&1; then
      shred -u "$KEY_FILE" || rm -f "$KEY_FILE"
    else
      rm -f "$KEY_FILE"
    fi
  fi
}
trap cleanup EXIT INT TERM

printf 'Configuring project %s...\n' "$PROJECT_ID"
gcloud config set project "$PROJECT_ID" >/dev/null

echo "Enabling the Search Console API..."
gcloud services enable searchconsole.googleapis.com --project "$PROJECT_ID" >/dev/null

if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Using existing service account: $SERVICE_ACCOUNT_EMAIL"
else
  echo "Creating service account: $SERVICE_ACCOUNT_EMAIL"
  gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
    --project "$PROJECT_ID" \
    --display-name "IZEM SEO Search Console (read-only workflow)" >/dev/null
fi

cat <<INSTRUCTIONS

Before continuing, give this service-account email access to Search Console:

  $SERVICE_ACCOUNT_EMAIL

Property:
  sc-domain:youraicoach.life

In Google Search Console:
  Settings -> Users and permissions -> Add user -> Full

The workflow requests only the read-only Search Console OAuth scope. Do not
paste the JSON key into chat, source control, an issue, or a workflow log.

INSTRUCTIONS

read -r -p "Press Enter only after Search Console access has been granted... "

echo "Creating a short-lived JSON key locally..."
gcloud iam service-accounts keys create "$KEY_FILE" \
  --iam-account "$SERVICE_ACCOUNT_EMAIL" \
  --project "$PROJECT_ID" >/dev/null

if ! node -e '
  const fs = require("fs");
  const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  if (value.type !== "service_account" || !value.client_email || !value.private_key) process.exit(1);
' "$KEY_FILE"; then
  echo "The generated file is not a valid service-account JSON key." >&2
  exit 65
fi

echo "Encrypting the complete JSON as the GitHub Actions secret..."
gh secret set GOOGLE_SERVICE_ACCOUNT_JSON \
  --repo "$REPOSITORY" \
  < "$KEY_FILE"

cleanup
trap - EXIT INT TERM

echo "The local JSON key file was removed."

RUN_ID="$(gh run list \
  --repo "$REPOSITORY" \
  --workflow "SEO production validation" \
  --branch "agent/seo-production-hardening" \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId // empty')"

if [[ -n "$RUN_ID" ]]; then
  echo "Rerunning the failed credentialed validation job: $RUN_ID"
  gh run rerun "$RUN_ID" --failed --repo "$REPOSITORY"
  echo "Follow it with: gh run watch $RUN_ID --repo $REPOSITORY --exit-status"
else
  echo "No previous SEO production validation run was found."
  echo "Open PR #2 checks and run the workflow manually."
fi

echo "Search Console credential bootstrap is complete."
