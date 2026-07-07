import type { AutonomyPolicy, ContentValidation, RiskLevel } from '../../core/src/index.js';

const regulatedTerms = /\b(diagnose|treat|cure|medical|prescription|disease|guaranteed|investment|legal advice|tax advice)\b/i;
const statisticPattern = /\b\d+(\.\d+)?%|\b\d+x\b|\b#1\b/i;

export function validateContent(text: string, policy: AutonomyPolicy): ContentValidation {
  const issues: string[] = [];
  const claimsToVerify: string[] = [];
  const lower = text.toLowerCase();

  for (const phrase of policy.brandVoice.avoidedPhrases) {
    if (lower.includes(phrase.toLowerCase())) {
      issues.push(`Avoided phrase present: "${phrase}".`);
    }
  }

  for (const claim of policy.brandVoice.bannedClaims) {
    if (lower.includes(claim.toLowerCase())) {
      issues.push(`Blocked or unsupported claim present: "${claim}".`);
    }
  }

  if (regulatedTerms.test(text)) {
    issues.push('Potential regulated medical/legal/financial wording detected.');
  }

  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    if (statisticPattern.test(sentence) || /\bproven|study|research shows|clinically\b/i.test(sentence)) {
      claimsToVerify.push(sentence.trim());
    }
  }

  const riskLevel: RiskLevel =
    issues.some((issue) => issue.includes('Blocked') || issue.includes('regulated'))
      ? 'high'
      : claimsToVerify.length > 0 || issues.length > 0
        ? 'medium'
        : 'low';

  return {
    riskLevel,
    issues,
    claimsToVerify,
    approvalRequired: riskLevel !== 'low',
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
