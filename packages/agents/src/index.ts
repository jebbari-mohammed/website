import fs from 'node:fs/promises';
import path from 'node:path';
import {
  evaluatePolicy,
  loadLatestDraft,
  loadLatestRoadmap,
  loadPolicy,
  logAction,
  saveMarkdown,
  saveRecord,
} from '../../core/src/index.js';
import type { BlogDraft, SocialCalendar } from '../../core/src/index.js';
import { blogDraftToMarkdown, createBlogDraft, repurposeBlogDraft, socialCalendarToCsv, socialCalendarToMarkdown } from '../../content/src/index.js';
import { roadmapToMarkdown, runSiteAudit, createKeywordRoadmap, siteAuditToMarkdown } from '../../seo/src/index.js';
import { pushCalendarDraftsToPostiz } from '../../social/src/index.js';
import { generateWeeklyReport, weeklyReportToMarkdown } from './weekly.js';

function assertAllowed(decision: ReturnType<typeof evaluatePolicy>) {
  if (!decision.allowed) {
    throw new Error(decision.reason);
  }
}

export async function executeSiteAudit(input: { url?: string; maxPages?: number }) {
  const policy = await loadPolicy();
  const decision = evaluatePolicy(policy, 'crawl_site', 'low');
  assertAllowed(decision);
  const url = input.url || policy.websiteUrl;
  const audit = await runSiteAudit(url, input.maxPages);
  const jsonPath = await saveRecord('audits', audit);
  const markdownPath = await saveMarkdown('audits', audit.id, siteAuditToMarkdown(audit));
  await logAction({
    agent: 'seo_strategist',
    action: 'crawl_site',
    inputSummary: `Audited ${url}`,
    outputSummary: `${audit.summary.pagesCrawled} pages, score ${audit.summary.score}/100. JSON: ${jsonPath}`,
    riskLevel: 'low',
    approvalRequired: decision.approvalRequired,
    status: 'success',
  });
  return { audit, jsonPath, markdownPath };
}

export async function executeKeywordRoadmap(input: { seed?: string }) {
  const policy = await loadPolicy();
  const decision = evaluatePolicy(policy, 'generate_keyword_roadmap', 'low');
  assertAllowed(decision);
  const seed = input.seed || 'AI personal trainer accountability';
  const roadmap = createKeywordRoadmap(seed);
  const jsonPath = await saveRecord('roadmaps', roadmap);
  const markdownPath = await saveMarkdown('roadmaps', roadmap.id, roadmapToMarkdown(roadmap));
  await logAction({
    agent: 'seo_strategist',
    action: 'generate_keyword_roadmap',
    inputSummary: `Seed: ${seed}`,
    outputSummary: `${roadmap.clusters.length} clusters, ${roadmap.calendar.length} calendar items. JSON: ${jsonPath}`,
    riskLevel: 'low',
    approvalRequired: decision.approvalRequired,
    status: 'success',
  });
  return { roadmap, jsonPath, markdownPath };
}

export async function executeBlogDraft(input: { keyword?: string }) {
  const policy = await loadPolicy();
  const decision = evaluatePolicy(policy, 'generate_blog_draft', 'medium');
  assertAllowed(decision);
  const roadmap = await loadLatestRoadmap();
  const keyword = input.keyword || roadmap?.calendar[0]?.keyword || 'fitness app that calls you';
  const idea = roadmap?.clusters.flatMap((cluster) => cluster.keywords).find((item) => item.keyword === keyword);
  const draft = await createBlogDraft({ keyword, intent: idea?.intent }, policy);
  const jsonPath = await saveRecord('drafts', draft);
  const markdownPath = await saveMarkdown('drafts', draft.id, blogDraftToMarkdown(draft));
  await logAction({
    agent: 'content_writer',
    action: 'generate_blog_draft',
    inputSummary: `Keyword: ${keyword}`,
    outputSummary: `Draft ${draft.title}. JSON: ${jsonPath}`,
    riskLevel: draft.validation.riskLevel,
    approvalRequired: decision.approvalRequired || draft.validation.approvalRequired,
    status: 'success',
  });
  return { draft, jsonPath, markdownPath };
}

export async function executeSocialRepurpose(input: { pushPostiz?: boolean }) {
  const policy = await loadPolicy();
  const decision = evaluatePolicy(policy, 'repurpose_social_posts', 'medium');
  assertAllowed(decision);
  const draft = await loadLatestDraft();
  if (!draft) throw new Error('No blog draft found. Run pnpm blog:create first.');
  const platforms = policy.platformsEnabled as SocialCalendar['posts'][number]['platform'][];
  const calendar = repurposeBlogDraft(draft, platforms);
  const jsonPath = await saveRecord('calendars', calendar);
  const markdownPath = await saveMarkdown('calendars', calendar.id, socialCalendarToMarkdown(calendar));
  const csvPath = path.join(path.dirname(markdownPath), `${calendar.id}.csv`);
  await fs.writeFile(csvPath, socialCalendarToCsv(calendar), 'utf8');

  let postizSummary = 'Postiz push not requested.';
  if (input.pushPostiz) {
    const postizDecision = evaluatePolicy(policy, 'postiz_push_draft', 'medium');
    assertAllowed(postizDecision);
    const result = await pushCalendarDraftsToPostiz(calendar);
    postizSummary = result.reason;
  }

  await logAction({
    agent: 'social_media_manager',
    action: 'repurpose_social_posts',
    inputSummary: `Draft: ${(draft as BlogDraft).id}`,
    outputSummary: `${calendar.posts.length} platform drafts. ${postizSummary} JSON: ${jsonPath}`,
    riskLevel: 'medium',
    approvalRequired: decision.approvalRequired,
    status: 'success',
  });
  return { calendar, jsonPath, markdownPath, csvPath, postizSummary };
}

export async function executeWeeklyReport() {
  const policy = await loadPolicy();
  const decision = evaluatePolicy(policy, 'generate_weekly_report', 'low');
  assertAllowed(decision);
  const report = await generateWeeklyReport();
  const jsonPath = await saveRecord('reports', report);
  const markdownPath = await saveMarkdown('reports', report.id, weeklyReportToMarkdown(report));
  await logAction({
    agent: 'analytics_agent',
    action: 'generate_weekly_report',
    inputSummary: 'Latest local marketing data',
    outputSummary: `Weekly report generated. JSON: ${jsonPath}`,
    riskLevel: 'low',
    approvalRequired: decision.approvalRequired,
    status: 'success',
  });
  return { report, jsonPath, markdownPath };
}

export * from './weekly.js';
