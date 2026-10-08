import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function validateProjectId(projectId) {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId || '')) {
    throw new Error('A valid Firebase project ID is required.');
  }
}

// First public v2 release and Hosting pinTag permissions. Deployment still
// validates build/service agents and API prerequisites; this never changes IAM.
export const agentDeployPermissions = Object.freeze([
  'cloudfunctions.functions.create',
  'cloudfunctions.functions.get',
  'cloudfunctions.functions.list',
  'cloudfunctions.functions.update',
  'cloudfunctions.functions.setIamPolicy',
  'cloudfunctions.operations.get',
  'cloudbuild.builds.get',
  'run.services.get',
  'run.services.update',
  'run.services.getIamPolicy',
  'run.services.setIamPolicy',
]);

async function missingPermissions({ request, url, permissions }) {
  const response = await request({ url, method: 'POST', data: { permissions } });
  const granted = Array.isArray(response?.data?.permissions) ? response.data.permissions : [];
  return permissions.filter(permission => !granted.includes(permission));
}

export async function checkServiceAccountActAs({ projectId, request }) {
  validateProjectId(projectId);
  const serviceAccount = `${projectId}@appspot.gserviceaccount.com`;
  return (await missingPermissions({
    request,
    url: `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${serviceAccount}:testIamPermissions`,
    permissions: ['iam.serviceAccounts.actAs'],
  })).length === 0;
}

export async function checkAgentDeployAccess({ projectId, request }) {
  validateProjectId(projectId);
  // Resolve the project number from authenticated metadata, never a key file.
  const project = await request({
    url: `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`,
    method: 'GET',
  });
  const projectNumber = String(project?.data?.projectNumber ?? '');
  if (project?.data?.projectId !== projectId || !/^[1-9][0-9]*$/.test(projectNumber)) {
    throw new Error('Could not verify the Firebase project number.');
  }

  const missing = [];
  for (const serviceAccount of [
    `${projectId}@appspot.gserviceaccount.com`, // Firebase CLI's unconditional check.
    `${projectNumber}-compute@developer.gserviceaccount.com`, // v2 runtime/default build identity.
  ]) {
    const denied = await missingPermissions({
      request,
      url: `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${serviceAccount}:testIamPermissions`,
      permissions: ['iam.serviceAccounts.actAs'],
    });
    for (const permission of denied) missing.push({ resource: serviceAccount, permission });
  }
  const denied = await missingPermissions({
    request,
    url: `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:testIamPermissions`,
    permissions: agentDeployPermissions,
  });
  for (const permission of denied) missing.push({ resource: projectId, permission });
  return { granted: missing.length === 0, missing };
}

async function main() {
  try {
    if (!process.env.FIREBASE_TOOLS_ROOT) throw new Error('Firebase CLI location is required.');
    const require = createRequire(path.join(process.env.FIREBASE_TOOLS_ROOT, 'package.json'));
    const { GoogleAuth, OAuth2Client } = require('google-auth-library');
    const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
    let client;
    if (process.env.FIREBASE_DEPLOY_TOKEN) {
      // Exchange the existing CI token through the pinned CLI without printing
      // it or accepting Hosting-only access as a Functions deploy credential.
      const { getAccessToken } = require('./lib/auth.js');
      const token = await getAccessToken(process.env.FIREBASE_DEPLOY_TOKEN, scopes);
      if (!token.access_token) throw new Error('No authenticated access token.');
      client = new OAuth2Client();
      client.setCredentials({ access_token: token.access_token });
    } else {
      const auth = new GoogleAuth({ scopes });
      client = await auth.getClient();
    }
    const { granted, missing } = await checkAgentDeployAccess({
      projectId: process.argv[2],
      request: options => client.request(options),
    });
    if (!granted) {
      for (const { resource, permission } of missing) console.error(`Credential lacks ${permission} on ${resource}.`);
      process.exitCode = 1;
    }
  } catch {
    // Auth-library errors may contain request headers or credentials. Never log
    // their details; an unverified credential must not be selected for release.
    console.error('Could not verify the credential\'s Hosting/Functions deployment permissions.');
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
