import assert from 'node:assert/strict';
import test from 'node:test';
import { agentDeployPermissions, checkAgentDeployAccess, checkServiceAccountActAs } from './check-agent-deploy-access.mjs';

const projectId = 'ai-gym-coach-13ee1';
const projectNumber = '308524914649';
const appEngine = `${projectId}@appspot.gserviceaccount.com`;
const compute = `${projectNumber}-compute@developer.gserviceaccount.com`;
const runtime = `izem-agent-pages-runtime@${projectId}.iam.gserviceaccount.com`;

function fixture({ denied = new Map(), project = { projectId, projectNumber } } = {}) {
  const calls = [];
  return {
    calls,
    request: async options => {
      calls.push(options);
      if (options.method === 'GET') return { data: project };
      const excluded = [...denied].find(([resource]) => options.url.includes(resource))?.[1] || [];
      return { data: { permissions: options.data.permissions.filter(permission => !excluded.includes(permission)) } };
    },
  };
}

test('complete preflight uses authenticated project metadata and only read-only permission tests', async () => {
  const { request, calls } = fixture();
  assert.deepEqual(await checkAgentDeployAccess({ projectId, request }), { granted: true, missing: [] });
  assert.equal(calls[0].url, `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`);
  assert.equal(calls[0].method, 'GET');
  assert.deepEqual(calls.slice(1).map(call => call.url), [
    `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${appEngine}:testIamPermissions`,
    `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${compute}:testIamPermissions`,
    `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${runtime}:testIamPermissions`,
    `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:testIamPermissions`,
  ]);
  for (const call of calls.slice(1)) assert.equal(call.method, 'POST');
});

for (const resource of [appEngine, compute, runtime]) {
  test(`passing other accounts cannot hide denied actAs on ${resource}`, async () => {
    const { request } = fixture({ denied: new Map([[resource, ['iam.serviceAccounts.actAs']]]) });
    assert.deepEqual(await checkAgentDeployAccess({ projectId, request }), {
      granted: false, missing: [{ resource, permission: 'iam.serviceAccounts.actAs' }],
    });
  });
}

test('actAs on all three service accounts does not authorize missing Functions/Run deployment permissions', async () => {
  const permission = 'run.services.setIamPolicy';
  const { request } = fixture({ denied: new Map([[`${projectId}:testIamPermissions`, [permission]]]) });
  assert.deepEqual(await checkAgentDeployAccess({ projectId, request }), {
    granted: false, missing: [{ resource: projectId, permission }],
  });
});

test('malformed project permission responses fail closed', async () => {
  const { request: validRequest } = fixture();
  const result = await checkAgentDeployAccess({
    projectId,
    request: options => options.url.endsWith(`${projectId}:testIamPermissions`)
      ? { data: { permissions: agentDeployPermissions.join(',') } }
      : validRequest(options),
  });
  assert.equal(result.granted, false);
  assert.equal(result.missing.length, agentDeployPermissions.length);
});

for (const project of [undefined, { projectId, projectNumber: '../other-project' }, { projectId: 'other-project', projectNumber }]) {
  test(`unverified project metadata never reaches service-account checks: ${JSON.stringify(project)}`, async () => {
    let calls = 0;
    await assert.rejects(checkAgentDeployAccess({
      projectId, request: async () => { calls++; return { data: project }; },
    }), /verify the Firebase project number/);
    assert.equal(calls, 1);
  });
}

for (let failedCall = 0; failedCall < 5; failedCall++) {
  test(`transport failure at preflight stage ${failedCall + 1} cannot select a credential`, async () => {
    const { request: validRequest } = fixture();
    let call = 0;
    await assert.rejects(checkAgentDeployAccess({
      projectId,
      request: options => {
        if (call++ === failedCall) throw new Error('request failed');
        return validRequest(options);
      },
    }), /request failed/);
  });
}

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
