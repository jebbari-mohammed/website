import crypto from 'node:crypto';
import type { AutonomyPolicy, BlogDraft, KeywordIdea } from '../../core/src/index.js';
import { createLlmClient } from '../../core/src/index.js';
import { slugify, validateContent } from './validation.js';

type SeoBriefContext = {
  action?: string;
  targetPage?: string;
  currentPages?: string[];
  whyNow?: string;
  metrics?: {
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  };
  relatedQueries?: string[];
  contentAngle?: string;
  mustDo?: string[];
  qualityGates?: string[];
};

type BlogInput = {
  keyword: string;
  intent?: KeywordIdea['intent'];
  internalLinkUrls?: string[];
  seoBrief?: SeoBriefContext;
};

function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}`;
}

function formatBriefForPrompt(brief?: SeoBriefContext): string {
  if (!brief) return 'No live Search Console brief is attached. Keep the draft conservative and do not invent demand signals.';
  const metrics = brief.metrics
    ? `${brief.metrics.clicks ?? 0} clicks, ${brief.metrics.impressions ?? 0} impressions, ${((brief.metrics.ctr ?? 0) * 100).toFixed(2)}% CTR, average position ${(brief.metrics.position ?? 0).toFixed(1)}`
    : 'not available';
  return [
    `SEO action: ${brief.action || 'unknown'}`,
    `Existing target page: ${brief.targetPage || 'none'}`,
    `Current/competing pages: ${(brief.currentPages || []).join(', ') || 'none'}`,
    `Why now: ${brief.whyNow || 'not specified'}`,
    `Current GSC metrics: ${metrics}`,
    `Same-page query cluster: ${(brief.relatedQueries || []).join('; ') || 'none'}`,
    `Content angle: ${brief.contentAngle || 'not specified'}`,
    `Must-do requirements: ${(brief.mustDo || []).join(' | ') || 'none'}`,
    `Quality gates: ${(brief.qualityGates || []).join(' | ') || 'none'}`,
  ].join('\n');
}

function deterministicDraft(input: BlogInput, policy: AutonomyPolicy): Omit<BlogDraft, 'id' | 'createdAt' | 'validation'> {
  const keywordTitle = titleCase(input.keyword);
  const slug = slugify(input.keyword);
  const intent = input.intent || 'informational';
  const title = `${keywordTitle}: What To Look For Before You Choose`;
  const internalLinks = (input.internalLinkUrls?.length ? input.internalLinkUrls : [
    '/fitness-app-that-calls-you/',
    '/workout-consistency-calculator/',
    '/blog/adaptive-workout-and-meal-plan-app',
  ]).slice(0, 5);

  return {
    targetKeyword: input.keyword,
    searchIntent: intent,
    title,
    metaTitle: truncate(`${keywordTitle} | IZEM AI Personal Trainer`, 60),
    metaDescription: truncate(`A practical guide to ${input.keyword} for people who want accountability calls, day review, and adaptive workout and meal planning.`, 158),
    slug,
    outline: [
      `What "${input.keyword}" usually means`,
      'Why accountability matters more than reminders',
      'How adaptive workout and meal planning should work',
      'What to check before choosing an app',
      'When a human coach is still the better fit',
      'FAQ',
    ],
    intro: `If you are searching for ${input.keyword}, you are probably not looking for another static workout list. You want a system that helps you follow through when the day gets busy. ${policy.brandVoice.brandName} is positioned around accountability calls, daily review, and weekly adaptation rather than generic motivation.`,
    sections: [
      {
        heading: `What "${input.keyword}" Should Solve`,
        body: 'The core problem is not access to exercises. Most people can find workouts for free. The harder problem is choosing the right session for today, staying consistent, and adjusting when sleep, soreness, schedule, or nutrition change the plan.',
      },
      {
        heading: 'Look For Real Accountability',
        body: 'A useful AI fitness product should create a feedback loop: plan the workout, check whether it happened, ask what got in the way, and adapt the next step. Calls can make that loop harder to ignore than a passive reminder.',
      },
      {
        heading: 'Expect Adaptation, Not Random Variety',
        body: 'Weekly adaptation should connect training and nutrition decisions. If the app changes workouts without considering missed sessions, meals, energy, or schedule constraints, it is probably generating variety instead of coaching.',
      },
      {
        heading: 'Use A Practical Evaluation Checklist',
        body: 'Check whether the product explains its plan, lets you review progress, avoids extreme claims, supports your schedule, and gives you a clear next action. Good fitness software should reduce decision fatigue without pretending to replace medical advice.',
      },
    ],
    faq: [
      {
        question: `Is ${input.keyword} only for beginners?`,
        answer: 'No. The best fit is anyone who needs structure and accountability, especially when consistency is the limiting factor.',
      },
      {
        question: 'Can an AI personal trainer replace a human trainer?',
        answer: 'It can help with planning, reminders, review, and adaptation. A human trainer is still important for hands-on form coaching, medical constraints, injuries, and specialized performance goals.',
      },
      {
        question: 'What makes IZEM different from a reminder app?',
        answer: 'The product framing is built around calls, day review, and weekly plan adaptation, not just notifications.',
      },
    ],
    internalLinks: internalLinks.map((url) => ({ anchor: url.replace(/\//g, ' ').trim() || 'IZEM', url })),
    externalSourceSuggestions: [
      'Google Search Central documentation on helpful content and structured data',
      'CDC physical activity guidelines for general adult activity context',
      'Platform policy pages for any social claims before promotion',
    ],
    schemaRecommendation: 'Article schema with Organization publisher. Add BreadcrumbList on the page and FAQ content only where it is genuinely visible and helpful.',
    cta: 'Try IZEM if you want an AI personal trainer that calls you, reviews your day, and adapts your workout and meal plan every week.',
    reviewStatus: 'draft',
  };
}

export async function createBlogDraft(input: BlogInput, policy: AutonomyPolicy): Promise<BlogDraft> {
  const base = deterministicDraft(input, policy);
  const llm = createLlmClient();

  if (llm.provider !== 'none') {
    const briefContext = formatBriefForPrompt(input.seoBrief);
    const actionRules = input.seoBrief?.action === 'refresh'
      ? 'This is a REFRESH task. Write improvements for the existing page. Do not propose a new near-duplicate URL. Preserve useful unique material and strengthen the direct answer, missing subtopics, title/snippet angle, examples, and internal links.'
      : input.seoBrief?.action === 'merge'
        ? 'This is a MERGE task. Write a consolidation draft for the strongest canonical page. Do not recommend deleting or redirecting URLs without a separate backlink/unique-content review.'
        : input.seoBrief?.action === 'create'
          ? 'This is a CREATE task. Cover the entire same-intent query cluster on one substantial page rather than producing one URL per keyword wording.'
          : 'This is a general draft. Avoid assuming a new URL is needed.';

    const prompt = `Create a concise, high-quality SEO content draft for IZEM.

Target keyword: ${input.keyword}
Intent: ${input.intent || 'informational'}
Brand voice: ${policy.brandVoice.voice}
Positioning: ${policy.brandVoice.positioning}
Avoid: ${policy.brandVoice.avoidedPhrases.join(', ')}
Blocked claims: ${policy.brandVoice.bannedClaims.join(', ')}

LIVE SEO BRIEF
${briefContext}

ACTION-SPECIFIC RULE
${actionRules}

Requirements:
- Front-load the useful answer instead of writing a generic SEO introduction.
- Satisfy related same-intent queries naturally in the same page.
- Include at least one useful first-party element such as a decision framework, checklist, transparent methodology, or IZEM-specific workflow when the brief requires it.
- Do not invent statistics, studies, testimonials, rankings, medical outcomes, competitor features, or competitor prices.
- If a factual claim needs evidence, flag it for verification instead of making it up.
- Do not keyword-stuff and do not repeat the same advice under multiple headings.

Return markdown sections only.`;

    const body = await llm.generate(
      [
        { role: 'system', content: 'You write careful people-first SEO content grounded in the supplied Search Console brief, with no unsupported claims and no scaled-content shortcuts.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.3, maxTokens: 3200 }
    );

    if (!body.startsWith('LLM provider is not configured')) {
      base.sections = [
        {
          heading: input.seoBrief?.action === 'refresh' ? 'GSC-Guided Refresh Draft' : 'GSC-Guided Draft Body',
          body,
        },
        ...base.sections,
      ];
    }
  }

  const validationText = [
    base.title,
    base.metaDescription,
    base.intro,
    ...base.sections.map((section) => `${section.heading}\n${section.body}`),
    ...base.faq.map((item) => `${item.question}\n${item.answer}`),
    base.cta,
  ].join('\n\n');

  const validation = validateContent(validationText, policy);

  return {
    id: `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}-blog-draft`,
    createdAt: new Date().toISOString(),
    ...base,
    reviewStatus: validation.approvalRequired ? 'needs_review' : 'draft',
    validation,
  };
}

export function blogDraftToMarkdown(draft: BlogDraft): string {
  return `# ${draft.title}

- Target keyword: ${draft.targetKeyword}
- Search intent: ${draft.searchIntent}
- Slug: ${draft.slug}
- Meta title: ${draft.metaTitle}
- Meta description: ${draft.metaDescription}
- Review status: ${draft.reviewStatus}

## Outline

${draft.outline.map((item) => `- ${item}`).join('\n')}

## Intro

${draft.intro}

${draft.sections.map((section) => `## ${section.heading}\n\n${section.body}`).join('\n\n')}

## FAQ

${draft.faq.map((item) => `### ${item.question}\n\n${item.answer}`).join('\n\n')}

## Internal Links

${draft.internalLinks.map((item) => `- [${item.anchor}](${item.url})`).join('\n')}

## External Source Suggestions

${draft.externalSourceSuggestions.map((item) => `- ${item}`).join('\n')}

## Schema Recommendation

${draft.schemaRecommendation}

## CTA

${draft.cta}

## Fact-Check Checklist

- Issues: ${draft.validation.issues.length ? draft.validation.issues.join('; ') : 'None detected'}
- Claims to verify: ${draft.validation.claimsToVerify.length ? draft.validation.claimsToVerify.join('; ') : 'None detected'}
- Approval required: ${draft.validation.approvalRequired ? 'yes' : 'no'}
`;
}
