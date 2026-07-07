import fs from 'node:fs/promises';
import type { AutonomyPolicy, MarketingAction, PolicyDecision, RiskLevel } from './types.js';
import { paths } from './paths.js';

const riskRank: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export async function loadPolicy(): Promise<AutonomyPolicy> {
  const raw = await fs.readFile(paths.config, 'utf8');
  return JSON.parse(raw) as AutonomyPolicy;
}

export function evaluatePolicy(
  policy: AutonomyPolicy,
  action: MarketingAction,
  riskLevel: RiskLevel
): PolicyDecision {
  if (policy.emergencyStop) {
    return { allowed: false, approvalRequired: true, reason: 'Emergency stop is enabled.' };
  }

  if (policy.blockedActions.includes(action)) {
    return { allowed: false, approvalRequired: true, reason: `${action} is blocked by policy.` };
  }

  if (!policy.allowedActions.includes(action)) {
    return { allowed: false, approvalRequired: true, reason: `${action} is not in allowedActions.` };
  }

  const threshold = policy.approvalThresholds.find((item) => item.action === action);
  const approvalRequired =
    policy.mode === 'manual' ||
    Boolean(threshold && riskRank[riskLevel] >= riskRank[threshold.requiresApprovalAt]);

  if (policy.mode === 'safe_autopilot' && ['publish_social_post', 'delete_content', 'write_website_patch'].includes(action)) {
    return {
      allowed: false,
      approvalRequired: true,
      reason: `${action} is disallowed in safe_autopilot.`,
    };
  }

  return {
    allowed: true,
    approvalRequired,
    reason: approvalRequired ? 'Approval required by autonomy policy.' : 'Allowed by autonomy policy.',
  };
}
