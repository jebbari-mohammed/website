import test from 'node:test';
import assert from 'node:assert/strict';
import type { AutonomyPolicy } from '../../core/src/index.js';
import { validateContent } from './validation.js';

const policy: AutonomyPolicy = {
  mode: 'manual',
  emergencyStop: false,
  allowedActions: [],
  blockedActions: [],
  approvalThresholds: [],
  maxPostsPerDay: 3,
  maxBlogPostsPerWeek: 2,
  platformsEnabled: [],
  brandVoice: {
    brandName: 'IZEM',
    positioning: 'AI personal trainer',
    voice: 'direct',
    bannedClaims: ['guaranteed weight loss'],
    preferredPhrases: [],
    avoidedPhrases: ['Callio'],
  },
  targetAudience: [],
  targetCountries: ['US'],
  websiteUrl: 'https://youraicoach.life',
  competitorUrls: [],
};

test('flags banned claims and avoided phrases', () => {
  const result = validateContent('Callio gives guaranteed weight loss.', policy);
  assert.equal(result.riskLevel, 'high');
  assert.ok(result.issues.length >= 2);
});

test('flags statistics for verification', () => {
  const result = validateContent('Users improve consistency by 40% after two weeks.', policy);
  assert.equal(result.riskLevel, 'medium');
  assert.equal(result.claimsToVerify.length, 1);
});

test('passes low-risk content', () => {
  const result = validateContent('IZEM helps you review your day and adapt your workout plan.', policy);
  assert.equal(result.riskLevel, 'low');
  assert.equal(result.approvalRequired, false);
});
