import assert from 'node:assert/strict';
import test from 'node:test';
import { checkServiceAccountActAs } from './check-agent-deploy-access.mjs';

test('tests existing IAM access without changing policy', async () => {
  let actual;
  assert.equal(await checkServiceAccountActAs({
    projectId: 'ai-gym-coach-13ee1',
    request: async options => {
      actual = options;
      return { data: { permissions: ['iam.serviceAccounts.actAs'] } };
    },
  }), true);
  assert.deepEqual(actual, {
    url: 'https://iam.googleapis.com/v1/projects/ai-gym-coach-13ee1/serviceAccounts/ai-gym-coach-13ee1@appspot.gserviceaccount.com:testIamPermissions',
    method: 'POST',
    data: { permissions: ['iam.serviceAccounts.actAs'] },
  });
});

for (const [name, response] of [
  ['denied', { data: { permissions: [] } }],
  ['unrelated permission', { data: { permissions: ['iam.serviceAccounts.get'] } }],
  ['missing response', undefined],
  ['malformed permissions', { data: { permissions: 'iam.serviceAccounts.actAs' } }],
]) {
  test(`does not authorize ${name}`, async () => {
    assert.equal(await checkServiceAccountActAs({ projectId: 'ai-gym-coach-13ee1', request: async () => response }), false);
  });
}

test('transport errors cannot grant access', async () => {
  await assert.rejects(checkServiceAccountActAs({
    projectId: 'ai-gym-coach-13ee1',
    request: async () => { throw new Error('request failed'); },
  }), /request failed/);
});

test('invalid project IDs never reach the IAM API', async () => {
  await assert.rejects(checkServiceAccountActAs({
    projectId: '../other-project',
    request: async () => assert.fail('must not request an invalid resource'),
  }), /valid Firebase project ID/);
});
