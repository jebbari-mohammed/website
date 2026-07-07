import test from 'node:test';
import assert from 'node:assert/strict';
import type { AutonomyPolicy } from './types.js';
import { evaluatePolicy } from './policy.js';

const policy: AutonomyPolicy = {
  mode: 'safe_autopilot',
  emergencyStop: false,
  allowedActions: ['crawl_site', 'generate_blog_draft'],
  blockedActions: ['publish_social_post'],
  approvalThresholds: [{ action: 'generate_blog_draft', requiresApprovalAt: 'medium' }],
  maxPostsPerDay: 3,
  maxBlogPostsPerWeek: 2,
  platformsEnabled: ['linkedin'],
  brandVoice: {
    brandName: 'IZEM',
    positioning: 'AI personal trainer',
    voice: 'clear',
    bannedClaims: [],
    preferredPhrases: [],
    avoidedPhrases: [],
  },
  targetAudience: [],
  targetCountries: ['US'],
  websiteUrl: 'https://youraicoach.life',
  competitorUrls: [],
};

test('blocks explicitly blocked actions', () => {
  const decision = evaluatePolicy(policy, 'publish_social_post', 'low');
  assert.equal(decision.allowed, false);
  assert.equal(decision.approvalRequired, true);
});

test('requires approval at configured threshold', () => {
  const decision = evaluatePolicy(policy, 'generate_blog_draft', 'medium');
  assert.equal(decision.allowed, true);
  assert.equal(decision.approvalRequired, true);
});

test('emergency stop blocks all actions', () => {
  const decision = evaluatePolicy({ ...policy, emergencyStop: true }, 'crawl_site', 'low');
  assert.equal(decision.allowed, false);
});
