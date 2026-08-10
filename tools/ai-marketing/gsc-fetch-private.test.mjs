import test from 'node:test';
import assert from 'node:assert/strict';
import {
  discoverCredentialSource,
  parseServiceAccountCredential,
} from './gsc-fetch-private.mjs';

const valid = JSON.stringify({
  type: 'service_account',
  client_email: 'seo@example-project.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\\nnot-a-real-key\\n-----END PRIVATE KEY-----\\n',
});

test('dedicated Search Console credential has priority', () => {
  assert.equal(discoverCredentialSource({
    GOOGLE_SERVICE_ACCOUNT_JSON: valid,
    GOOGLE_CLOUD_JSON: valid,
  }), 'GOOGLE_SERVICE_ACCOUNT_JSON');
});

test('existing Google Cloud credentials are reused when the dedicated name is absent', () => {
  assert.equal(discoverCredentialSource({ GOOGLE_CLOUD_JSON: valid }), 'GOOGLE_CLOUD_JSON');
  assert.equal(discoverCredentialSource({ GCP_SA_KEY: valid }), 'GCP_SA_KEY');
  assert.equal(discoverCredentialSource({ GOOGLE_APPLICATION_CREDENTIALS_JSON: valid }), 'GOOGLE_APPLICATION_CREDENTIALS_JSON');
});

test('blank credential values are ignored', () => {
  assert.equal(discoverCredentialSource({ GOOGLE_SERVICE_ACCOUNT_JSON: ' ', GOOGLE_CLOUD_JSON: '' }), '');
});

test('service-account parser validates structure and normalizes escaped newlines', () => {
  const parsed = parseServiceAccountCredential(valid, 'test credential');
  assert.equal(parsed.type, 'service_account');
  assert.match(parsed.private_key, /BEGIN PRIVATE KEY\nnot-a-real-key/);
  assert.throws(() => parseServiceAccountCredential('{bad', 'test credential'), /not valid JSON/);
  assert.throws(() => parseServiceAccountCredential('{"type":"authorized_user"}', 'test credential'), /not valid service-account JSON/);
});
