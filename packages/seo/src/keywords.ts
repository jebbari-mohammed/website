import type { KeywordCluster, KeywordIdea, KeywordRoadmap } from '../../core/src/index.js';

const intentPatterns: Array<[KeywordIdea['intent'], RegExp]> = [
  ['transactional', /\b(buy|pricing|price|subscribe|trial|app)\b/i],
  ['commercial', /\b(best|vs|alternative|review|compare|top)\b/i],
  ['navigational', /\b(izem|your ai coach|youraicoach)\b/i],
  ['informational', /\b(how|what|why|when|guide|tips|calculator|plan)\b/i],
];

const modifiers = [
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

function opportunity(keyword: string, intent: KeywordIdea['intent'], diff: number) {
  const intentBoost = intent === 'commercial' ? 22 : intent === 'transactional' ? 18 : intent === 'informational' ? 12 : 8;
  const specificity = Math.min(25, tokenize(keyword).length * 4);
  return Math.max(1, Math.min(100, 100 - diff + intentBoost + specificity));
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
    return {
      keyword,
      clusterId: '',
      intent,
      opportunityScore: opportunity(keyword, intent, kd.score),
      difficulty: kd,
      rationale: 'Prioritized for long-tail specificity, IZEM product fit, and search intent clarity.',
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
- Keywords: ${cluster.keywords.map((item) => `${item.keyword} (${item.opportunityScore}/100, KD ${item.difficulty.score} ${item.difficulty.basis})`).join('; ')}`
  )
  .join('\n\n')}

## 30-Day Plan

${roadmap.calendar.map((item) => `- Day ${item.day}: ${item.title} (${item.format})`).join('\n')}
`;
}
