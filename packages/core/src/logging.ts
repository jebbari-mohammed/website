import crypto from 'node:crypto';
import type { AgentName, AuditLogEntry, MarketingAction, RiskLevel } from './types.js';
import { appendLog } from './storage.js';

export async function logAction(input: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...input,
  };
  await appendLog(entry);
  return entry;
}

export async function logStarted(agent: AgentName, action: MarketingAction, inputSummary: string, riskLevel: RiskLevel) {
  return logAction({
    agent,
    action,
    inputSummary,
    outputSummary: 'Started.',
    riskLevel,
    approvalRequired: false,
    status: 'started',
  });
}
