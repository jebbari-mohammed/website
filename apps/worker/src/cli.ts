import {
  executeBlogDraft,
  executeKeywordRoadmap,
  executeSiteAudit,
  executeSocialRepurpose,
  executeWeeklyReport,
  executeGeoOptimization,
} from '../../../packages/agents/src/index.js';

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const item of argv) {
    if (!item.startsWith('--')) continue;
    const [key, rawValue] = item.slice(2).split('=');
    args[key] = rawValue ?? true;
  }
  return args;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  switch (command) {
    case 'audit:site': {
      const result = await executeSiteAudit({
        url: typeof args.url === 'string' ? args.url : undefined,
        maxPages: typeof args['max-pages'] === 'string' ? Number(args['max-pages']) : undefined,
      });
      console.log(`Audit complete: ${result.audit.summary.pagesCrawled} pages, score ${result.audit.summary.score}/100`);
      console.log(result.markdownPath);
      break;
    }
    case 'keywords:generate': {
      const result = await executeKeywordRoadmap({
        seed: typeof args.seed === 'string' ? args.seed : undefined,
      });
      console.log(`Roadmap complete: ${result.roadmap.clusters.length} clusters`);
      console.log(result.markdownPath);
      break;
    }
    case 'blog:create': {
      const result = await executeBlogDraft({
        keyword: typeof args.keyword === 'string' ? args.keyword : undefined,
      });
      console.log(`Draft complete: ${result.draft.title}`);
      console.log(result.markdownPath);
      break;
    }
    case 'social:repurpose': {
      const result = await executeSocialRepurpose({
        pushPostiz: args.postiz === true || args.postiz === 'true',
      });
      console.log(`Social repurposing complete: ${result.calendar.posts.length} drafts`);
      console.log(result.markdownPath);
      console.log(result.csvPath);
      console.log(result.postizSummary);
      break;
    }
    case 'report:weekly': {
      const result = await executeWeeklyReport();
      console.log(`Weekly report complete: ${result.report.id}`);
      console.log(result.markdownPath);
      break;
    }
    case 'seo:geo': {
      const result = await executeGeoOptimization({
        apply: args.apply === true || args.apply === 'true',
      });
      console.log(`GEO optimization complete: ${result.report.pages.length} pages audited, average score ${result.report.averageScore}/100`);
      console.log(`Applied optimizations: ${result.report.appliedOptimizationsCount}`);
      console.log(result.markdownPath);
      break;
    }
    default:
      console.error(`Unknown command: ${command || '(empty)'}`);
      console.error('Commands: audit:site, keywords:generate, blog:create, social:repurpose, report:weekly, seo:geo');
      process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
