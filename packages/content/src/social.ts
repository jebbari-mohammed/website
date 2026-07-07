import crypto from 'node:crypto';
import type { BlogDraft, SocialCalendar, SocialPost } from '../../core/src/index.js';

const platformLimits: Record<SocialPost['platform'], number> = {
  facebook: 63206,
  instagram: 2200,
  tiktok: 2200,
  youtube_shorts: 5000,
  linkedin: 3000,
  x: 280,
  threads: 500,
};

function trimToPlatform(text: string, platform: SocialPost['platform']) {
  const limit = platformLimits[platform];
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1)).trim()}`;
}

function hashtags(platform: SocialPost['platform']) {
  const base = ['#AIFitness', '#PersonalTrainer', '#WorkoutAccountability'];
  if (platform === 'x') return ['#AIFitness', '#FitnessApp'];
  if (platform === 'linkedin') return ['#FitnessTech', '#AI', '#BehaviorChange'];
  if (platform === 'tiktok' || platform === 'instagram') return [...base, '#FitnessJourney', '#WorkoutPlan'];
  return base;
}

function createPost(platform: SocialPost['platform'], draft: BlogDraft): SocialPost {
  const hook = platform === 'linkedin'
    ? `Most fitness apps stop at reminders. ${draft.title} looks at what comes next.`
    : platform === 'x'
      ? 'A fitness reminder is easy to ignore.'
      : platform === 'tiktok' || platform === 'youtube_shorts'
        ? 'POV: your fitness app actually checks in.'
        : `If you searched for "${draft.targetKeyword}", this is the part most apps miss.`;

  const bodyByPlatform: Record<SocialPost['platform'], string> = {
    facebook: `${hook}\n\nThe real value is a feedback loop: plan the workout, review what happened, and adapt the next step. IZEM is built around accountability calls, day review, and weekly workout plus meal plan updates.\n\nRead the draft: /blog/${draft.slug}`,
    instagram: `${hook}\n\nStatic plans do not know when your day fell apart. A better coaching loop checks in, learns what happened, and adjusts the next move.\n\nSave this if consistency is your main fitness problem.`,
    tiktok: `${hook}\n\nScene 1: You missed yesterday's workout.\nScene 2: Instead of guilt, your AI coach asks what happened.\nScene 3: Your week adjusts around real life.\n\nCTA on screen: Stop relying on reminders.`,
    youtube_shorts: `${hook}\n\nShort script:\n1. Open with the missed-workout problem.\n2. Show how reminders fail when the plan no longer fits.\n3. Explain the IZEM loop: call, review the day, adapt the week.\n4. End with: "Fitness plans should change when life changes."`,
    linkedin: `${hook}\n\nA useful AI fitness product should do more than generate a plan. It should close the loop between intention and behavior:\n\n- What was planned?\n- What actually happened?\n- What got in the way?\n- What should change next week?\n\nThat is the product direction behind IZEM: accountability calls, day review, and adaptive workout plus meal planning.`,
    x: `${hook}\n\nBetter loop:\nplan workout -> call/check-in -> review the day -> adapt next week.\n\nThat is the difference between reminders and coaching.`,
    threads: `${hook}\n\nMost people do not need more exercises. They need a plan that notices when real life changes and adjusts without turning fitness into guilt.`,
  };

  const content = trimToPlatform(`${bodyByPlatform[platform]}\n\n${hashtags(platform).join(' ')}`, platform);

  return {
    id: `${crypto.randomUUID()}-${platform}`,
    platform,
    draftId: draft.id,
    content,
    hook,
    hashtags: hashtags(platform),
    mediaDirection:
      platform === 'tiktok' || platform === 'youtube_shorts'
        ? 'Short vertical video with call/check-in, calendar adjustment, and workout plan screen beats.'
        : 'Simple branded visual showing the loop: Call -> Review -> Adapt.',
    status: 'draft',
    characterCount: content.length,
  };
}

export function repurposeBlogDraft(draft: BlogDraft, platforms: SocialPost['platform'][]): SocialCalendar {
  return {
    id: `${new Date().toISOString().replace(/[:.]/g, '-')}-social-calendar`,
    createdAt: new Date().toISOString(),
    sourceDraftId: draft.id,
    posts: platforms.map((platform) => createPost(platform, draft)),
  };
}

export function socialCalendarToCsv(calendar: SocialCalendar): string {
  const rows = [
    ['id', 'platform', 'status', 'characterCount', 'hook', 'content', 'hashtags', 'mediaDirection'],
    ...calendar.posts.map((post) => [
      post.id,
      post.platform,
      post.status,
      String(post.characterCount),
      post.hook,
      post.content,
      post.hashtags.join(' '),
      post.mediaDirection,
    ]),
  ];

  return rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
}

export function socialCalendarToMarkdown(calendar: SocialCalendar): string {
  return `# Social Repurposing Calendar

Source draft: ${calendar.sourceDraftId}
Created: ${calendar.createdAt}

${calendar.posts
  .map(
    (post) => `## ${post.platform}

- Status: ${post.status}
- Characters: ${post.characterCount}/${platformLimits[post.platform]}
- Hook: ${post.hook}
- Hashtags: ${post.hashtags.join(' ')}
- Media direction: ${post.mediaDirection}

${post.content}`
  )
  .join('\n\n')}
`;
}
