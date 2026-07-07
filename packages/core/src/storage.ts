import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  AuditLogEntry,
  BlogDraft,
  DashboardIndex,
  KeywordRoadmap,
  SiteAudit,
  SocialCalendar,
  WeeklyReport,
} from './types.js';
import { paths } from './paths.js';

type Collection = 'audits' | 'roadmaps' | 'drafts' | 'calendars' | 'reports';

async function ensureDirs() {
  await fs.mkdir(paths.dataDir, { recursive: true });
  await fs.mkdir(paths.publicDataDir, { recursive: true });
  for (const collection of ['audits', 'roadmaps', 'drafts', 'calendars', 'reports', 'logs'] satisfies Array<Collection | 'logs'>) {
    await fs.mkdir(path.join(paths.dataDir, collection), { recursive: true });
  }
}

export async function writeJson<T>(filePath: string, value: T) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

export async function saveRecord<T extends { id: string }>(collection: Collection, record: T): Promise<string> {
  await ensureDirs();
  const filePath = path.join(paths.dataDir, collection, `${record.id}.json`);
  await writeJson(filePath, record);
  await refreshDashboardIndex();
  return filePath;
}

export async function saveMarkdown(collection: Collection, id: string, markdown: string): Promise<string> {
  await ensureDirs();
  const filePath = path.join(paths.dataDir, collection, `${id}.md`);
  await fs.writeFile(filePath, markdown, 'utf8');
  return filePath;
}

export async function appendLog(entry: AuditLogEntry) {
  await ensureDirs();
  const logPath = path.join(paths.dataDir, 'logs', 'audit-trail.jsonl');
  await fs.appendFile(logPath, `${JSON.stringify(entry)}\n`, 'utf8');
  await refreshDashboardIndex();
}

async function latestRecord<T>(collection: Collection): Promise<T | undefined> {
  await ensureDirs();
  const dir = path.join(paths.dataDir, collection);
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.json')).sort();
  const latest = files.at(-1);
  if (!latest) return undefined;
  return readJson<T>(path.join(dir, latest));
}

async function recentLogs(limit = 20): Promise<AuditLogEntry[]> {
  const logPath = path.join(paths.dataDir, 'logs', 'audit-trail.jsonl');
  try {
    const lines = (await fs.readFile(logPath, 'utf8')).trim().split('\n').filter(Boolean);
    return lines.slice(-limit).map((line) => JSON.parse(line) as AuditLogEntry).reverse();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export async function refreshDashboardIndex(): Promise<DashboardIndex> {
  await ensureDirs();
  const index: DashboardIndex = {
    updatedAt: new Date().toISOString(),
    latestAudit: await latestRecord<SiteAudit>('audits'),
    latestRoadmap: await latestRecord<KeywordRoadmap>('roadmaps'),
    latestDraft: await latestRecord<BlogDraft>('drafts'),
    latestCalendar: await latestRecord<SocialCalendar>('calendars'),
    latestReport: await latestRecord<WeeklyReport>('reports'),
    recentLogs: await recentLogs(),
  };
  await writeJson(path.join(paths.publicDataDir, 'index.json'), index);
  return index;
}

export async function loadLatestDraft(): Promise<BlogDraft | undefined> {
  return latestRecord<BlogDraft>('drafts');
}

export async function loadLatestRoadmap(): Promise<KeywordRoadmap | undefined> {
  return latestRecord<KeywordRoadmap>('roadmaps');
}

export async function loadLatestAudit(): Promise<SiteAudit | undefined> {
  return latestRecord<SiteAudit>('audits');
}

export async function loadLatestCalendar(): Promise<SocialCalendar | undefined> {
  return latestRecord<SocialCalendar>('calendars');
}
