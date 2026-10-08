import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function checkServiceAccountActAs({ projectId, request }) {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId || '')) {
    throw new Error('A valid Firebase project ID is required.');
  }
  const serviceAccount = `${projectId}@appspot.gserviceaccount.com`;
  const response = await request({
    url: `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${serviceAccount}:testIamPermissions`,
    method: 'POST',
    data: { permissions: ['iam.serviceAccounts.actAs'] },
  });
  return Array.isArray(response?.data?.permissions)
    && response.data.permissions.includes('iam.serviceAccounts.actAs');
}

async function main() {
  try {
    if (!process.env.FIREBASE_TOOLS_ROOT) throw new Error('Firebase CLI location is required.');
    const require = createRequire(path.join(process.env.FIREBASE_TOOLS_ROOT, 'package.json'));
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const granted = await checkServiceAccountActAs({
      projectId: process.argv[2],
      request: options => client.request(options),
    });
    if (!granted) {
      console.error('Credential lacks iam.serviceAccounts.actAs for the App Engine service account checked by Firebase CLI.');
      process.exitCode = 1;
    }
  } catch {
    // Auth-library errors may contain request headers or credentials. Never log
    // their details; an unverified credential must not be selected for release.
    console.error('Could not verify the credential\'s Firebase CLI service-account permission.');
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
