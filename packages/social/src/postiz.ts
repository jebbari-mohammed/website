import type { SocialCalendar } from '../../core/src/index.js';
import { getRuntimeConfig, withRetry } from '../../core/src/index.js';

export type PostizPushResult = {
  pushed: boolean;
  reason: string;
  response?: unknown;
};

export async function pushCalendarDraftsToPostiz(calendar: SocialCalendar): Promise<PostizPushResult> {
  const config = getRuntimeConfig();
  if (!config.postizApiKey) {
    return {
      pushed: false,
      reason: 'POSTIZ_API_KEY is not configured. Posts were kept as local drafts.',
    };
  }

  const payload = {
    type: 'draft',
    creationMethod: 'API',
    posts: calendar.posts.map((post) => ({
      integration: { id: post.platform },
      value: [{ content: post.content, image: [] }],
      settings: {},
    })),
  };

  const response = await withRetry(async () => {
    const res = await fetch(`${config.postizBaseUrl}/public/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.postizApiKey!,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Postiz returned ${res.status}: ${JSON.stringify(json)}`);
    return json;
  });

  return {
    pushed: true,
    reason: 'Drafts pushed to Postiz public API.',
    response,
  };
}
