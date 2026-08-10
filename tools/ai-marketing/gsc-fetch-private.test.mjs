import test from 'node:test';
import assert from 'node:assert/strict';
import {
  discoverCredentialSource,
  parseServiceAccountCredential,
} from './gsc-fetch-private.mjs';

const valid = JSON.stringify({
  type: 'service_account',
  client_email: 'seo@example-project.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nnot-a-real-key\n-----END PRIVATE KEY-----\n',
});

test('prefers the dedicated Search Console secret', () => {
  const source = discoverCredentialSource({
    GOOGLE_SERVICE_ACCOUNT_JSON: valid,
    GOOGLE_CLOUD_JSON: valid,
    GCP_SA_KEY: valid,
  });
  assert.equal(source, 'GOOGLE_SERVICE_ACCOUNT_JSON');
});

test('reuses an existing Google Cloud service-account secret when dedicated GSC secret is absent', () => {
  assert.equal(discoverCredentialSource({ GOOGLE_CLOUD_JSON: valid }), 'GOOGLE_CLOUD_JSON');
  assert.equal(discoverCredentialSource({ GCP_SA_KEY: valid }), 'GCP_SA_KEY');
  assert.equal(discoverCredentialSource({ GOOGLE_APPLICATION_CREDENTIALS_JSON: valid }), 'GOOGLE_APPLICATION_CREDENTIALS_JSON');
});

test('ignores blank credentials', () => {
  assert.equal(discoverCredentialSource({ GOOGLE_SERVICE_ACCOUNT_JSON: '  ', GOOGLE_CLOUD_JSON: '' }), '');
});

test('validates service-account JSON structure without exposing the credential', () => {
  const parsed = parseServiceAccountCredential(valid, 'test secret');
  assert.equal(parsed.type, 'service_account');
  assert.throws(() => parseServiceAccountCredential('{bad', 'test secret'), /not valid JSON/);
  assert.throws(() => parseServiceAccountCredential('{"type":"authorized_user"}', 'test secret'), /not a valid service-account/);
});
