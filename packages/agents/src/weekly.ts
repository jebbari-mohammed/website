import type { SeoIssue, WeeklyReport } from '../../core/src/index.js';
import { loadLatestAudit, loadLatestCalendar, loadLatestRoadmap } from '../../core/src/index.js';

export async function generateWeeklyReport(): Promise<WeeklyReport> {
  const [audit, roadmap, calendar] = await Promise.all([loadLatestAudit(), loadLatestRoadmap(), loadLatestCalendar()]);
  const highIssues: SeoIssue[] = audit?.issues.filter((issue) => issue.severity === 'high').slice(0, 10) || [];
  const nextKeywords = roadmap?.calendar.slice(0, 5).map((item) => item.keyword) || [];
  const nextPosts = calendar?.posts.slice(0, 7).map((post) => `${post.platform}: ${post.hook}`) || [];

  return {
    id: `${new Date().toISOString().replace(/[:.]/g, '-')}-weekly-report`,
    createdAt: new Date().toISOString(),
    publishedSummary:
      calendar?.posts.length
        ? `${calendar.posts.length} social drafts prepared from the latest blog draft. Publishing remains draft-only unless Postiz and approvals are configured.`
        : 'No social posts have been prepared yet.',
    wins: [
      audit ? `Latest crawl covered ${audit.summary.pagesCrawled} pages with a score of ${audit.summary.score}/100.` : 'No audit has run yet.',
      roadmap ? `Keyword roadmap contains ${roadmap.clusters.length} clusters.` : 'No keyword roadmap has run yet.',
    ],
    misses: [
      highIssues.length ? `${highIssues.length} high-severity SEO issues need attention.` : 'No high-severity SEO issues detected in the latest audit.',
      calendar ? 'Social content is still in draft state until a scheduler is configured.' : 'No social calendar generated yet.',
    ],
    nextKeywords,
    nextPosts,
    seoIssues: highIssues,
    growthOpportunities: [
      'Prioritize long-tail pages that match IZEM accountability and adaptation positioning.',
      'Repurpose each new blog post into platform-native social drafts instead of copy-pasting.',
      'Use Search Console data when available; keep heuristic keyword scores labeled as heuristic.',
    ],
  };
}

export function weeklyReportToMarkdown(report: WeeklyReport): string {
  return `# Weekly Marketing Report

Created: ${report.createdAt}

## Published / Prepared

${report.publishedSummary}

## What Worked

${report.wins.map((item) => `- ${item}`).join('\n')}

## What Failed Or Needs Attention

${report.misses.map((item) => `- ${item}`).join('\n')}

## Next Keywords

${report.nextKeywords.map((item) => `- ${item}`).join('\n') || '- Run keyword generation first.'}

## Next Posts

${report.nextPosts.map((item) => `- ${item}`).join('\n') || '- Run social repurposing first.'}

## Website SEO Issues

${report.seoIssues.map((issue) => `- ${issue.severity}: ${issue.title} (${issue.url})`).join('\n') || '- No high-severity issues in latest audit.'}

## Growth Opportunities

${report.growthOpportunities.map((item) => `- ${item}`).join('\n')}
`;
}
