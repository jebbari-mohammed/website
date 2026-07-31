import type { KeywordCluster, KeywordIdea, KeywordRoadmap } from '../../core/src/index.js';

const intentPatterns: Array<[KeywordIdea['intent'], RegExp]> = [
  ['transactional', /\b(buy|pricing|price|subscribe|trial|app)\b/i],
  ['commercial', /\b(best|vs|alternative|review|compare|top)\b/i],
  ['navigational', /\b(izem|your ai coach|youraicoach)\b/i],
  ['informational', /\b(how|what|why|when|guide|tips|calculator|plan)\b/i],
];

const modifiers = [
  'how to stay consistent with workouts on a busy schedule',
  'ai workout generator for beginners at the gym',
  'workout accountability ideas for people who train alone',
  'personalized workout plan for busy professionals',
  'ai personal trainer',
  'fitness app that calls you',
  'workout accountability app',
  'adaptive workout and meal plan app',
  'ai fitness coach for busy people',
  'fitness app that reviews your day',
  'personal trainer accountability calls',
  'weekly workout plan app',
  'meal plan and workout coach app',
  'workout consistency calculator',
  'best ai fitness coach app',
  'ai fitness coach vs personal trainer',
  'how to stay consistent with workouts',
  'fitness accountability for beginners',
  'app that adapts workouts every week'
];

// These are page-level signals from IZEM's latest 28-day Search Console export,
// not claims about total market search volume. They steer the roadmap toward
// topics where this site has already demonstrated discovery and clicks.
const siteDemandSignals: Array<{ pattern: RegExp; score: number; explanation: string }> = [
  {
    pattern: /fitness app.*(reviews|review).*day|missed workout/i,
    score: 92,
    explanation: 'Search Console page signal: the daily-review topic led IZEM with 41 impressions and 8 clicks in the latest 28-day window.',
  },
  {
    pattern: /(fitness app|workout reminder|accountability app).*(call|phone)|call.*accountability/i,
    score: 88,
    explanation: 'Search Console page signal: call-accountability pages produced impressions and clicks in the latest 28-day window.',
  },
  {
    pattern: /ai workout generator|adaptive workout|workout plan.*adapt/i,
    score: 82,
    explanation: 'Search Console page signal: the AI workout generator page earned 12 impressions and 3 clicks in the latest 28-day window.',
  },
];

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function classifyIntent(keyword: string): KeywordIdea['intent'] {
  return intentPatterns.find(([, pattern]) => pattern.test(keyword))?.[0] || 'informational';
}

function difficulty(keyword: string): KeywordIdea['difficulty'] {
  const tokens = tokenize(keyword);
  const broadWords = ['fitness', 'workout', 'meal', 'app', 'best'];
  const broadCount = tokens.filter((token) => broadWords.includes(token)).length;
  const longTailDiscount = Math.min(28, Math.max(0, tokens.length - 3) * 7);
  const score = Math.max(12, Math.min(85, 44 + broadCount * 8 - longTailDiscount));
  return {
    score,
    basis: 'heuristic',
    explanation:
      'No paid keyword database is connected. This score estimates difficulty from query specificity, commercial modifiers, and breadth.',
  };
}

function demand(keyword: string): KeywordIdea['demand'] {
  const signal = siteDemandSignals.find((item) => item.pattern.test(keyword));
  if (signal) {
    return {
      score: signal.score,
      basis: 'search-console-page-signal',
      explanation: signal.explanation,
    };
  }

  const intentProxy = /\b(app|coach|trainer|plan|consistent|accountability)\b/i.test(keyword) ? 58 : 42;
  return {
    score: intentProxy,
    basis: 'intent-proxy',
    explanation: 'No verified query-volume provider is connected. This is a conservative demand proxy based on product fit and search intent, not a traffic-volume claim.',
  };
}

function opportunity(intent: KeywordIdea['intent'], diff: number, demandScore: number) {
  const intentScore = intent === 'commercial' ? 95 : intent === 'transactional' ? 90 : intent === 'informational' ? 72 : 45;
  const easeScore = 100 - diff;
  return Math.max(1, Math.min(100, Math.round(demandScore * 0.45 + easeScore * 0.35 + intentScore * 0.2)));
}

function similarity(a: string, b: string) {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  const overlap = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size || 1;
  return overlap / union;
}

function formatForKeyword(keyword: string): KeywordCluster['recommendedFormat'] {
  if (/\bcalculator|score|tool\b/i.test(keyword)) return 'tool';
  if (/\bvs|alternative|compare|best\b/i.test(keyword)) return 'comparison';
  if (/\bapp|coach|trainer\b/i.test(keyword)) return 'landing_page';
  if (/\bhow|what|why\b/i.test(keyword)) return 'blog';
  return 'faq';
}

export function generateKeywordIdeas(seed: string): KeywordIdea[] {
  const normalizedSeed = seed.trim().toLowerCase();
  const raw = [...new Set([normalizedSeed, ...modifiers, ...modifiers.map((item) => `${item} for ${normalizedSeed}`)])];

  return raw.map((keyword) => {
    const intent = classifyIntent(keyword);
    const kd = difficulty(keyword);
    const demandSignal = demand(keyword);
    return {
      keyword,
      clusterId: '',
      intent,
      opportunityScore: opportunity(intent, kd.score, demandSignal.score),
      difficulty: kd,
      demand: demandSignal,
      rationale: demandSignal.basis === 'search-console-page-signal'
        ? 'Prioritized for demonstrated IZEM discovery, long-tail attainability, and product fit.'
        : 'Prioritized for the best attainable balance of demand proxy, long-tail difficulty, and product fit; exact traffic volume is not claimed.',
    };
  });
}

export function clusterKeywords(ideas: KeywordIdea[]): KeywordCluster[] {
  const clusters: KeywordCluster[] = [];

  for (const idea of ideas.sort((a, b) => b.opportunityScore - a.opportunityScore)) {
    const match = clusters.find((cluster) => similarity(cluster.name, idea.keyword) >= 0.35);
    if (match) {
      idea.clusterId = match.id;
      match.keywords.push(idea);
      continue;
    }

    const id = `cluster-${clusters.length + 1}`;
    idea.clusterId = id;
    clusters.push({
      id,
      name: idea.keyword,
      intent: idea.intent,
      keywords: [idea],
      recommendedFormat: formatForKeyword(idea.keyword),
      priority: 'medium',
    });
  }

  return clusters.map((cluster) => {
    const avgScore = cluster.keywords.reduce((sum, item) => sum + item.opportunityScore, 0) / cluster.keywords.length;
    return {
      ...cluster,
      priority: avgScore >= 78 ? 'high' : avgScore >= 58 ? 'medium' : 'low',
      keywords: cluster.keywords.sort((a, b) => b.opportunityScore - a.opportunityScore),
    };
  });
}

export function createKeywordRoadmap(seed: string): KeywordRoadmap {
  const clusters = clusterKeywords(generateKeywordIdeas(seed));
  const calendar = clusters
    .flatMap((cluster) => cluster.keywords.slice(0, 2).map((keyword) => ({ cluster, keyword })))
    .sort((a, b) => b.keyword.opportunityScore - a.keyword.opportunityScore)
    .slice(0, 30)
    .map(({ cluster, keyword }, index) => ({
      day: index + 1,
      keyword: keyword.keyword,
      format: cluster.recommendedFormat,
      title: `${keyword.keyword.replace(/\b\w/g, (char) => char.toUpperCase())}: Practical Guide`,
    }));

  return {
    id: `${new Date().toISOString().replace(/[:.]/g, '-')}-keyword-roadmap`,
    createdAt: new Date().toISOString(),
    seed,
    clusters,
    calendar,
  };
}

export function roadmapToMarkdown(roadmap: KeywordRoadmap): string {
  return `# 30-Day Keyword Roadmap

Seed: ${roadmap.seed}
Created: ${roadmap.createdAt}

## Clusters

${roadmap.clusters
  .map(
    (cluster) => `### ${cluster.name}

- Priority: ${cluster.priority}
- Intent: ${cluster.intent}
- Format: ${cluster.recommendedFormat}
- Keywords: ${cluster.keywords.map((item) => `${item.keyword} (${item.opportunityScore}/100, demand ${item.demand.score} ${item.demand.basis}, KD ${item.difficulty.score} ${item.difficulty.basis})`).join('; ')}`
  )
  .join('\n\n')}

## 30-Day Plan

${roadmap.calendar.map((item) => `- Day ${item.day}: ${item.title} (${item.format})`).join('\n')}
`;
}
