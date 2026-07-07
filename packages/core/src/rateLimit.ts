const buckets = new Map<string, number[]>();

export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const now = Date.now();
  const entries = (buckets.get(key) || []).filter((timestamp) => now - timestamp < windowMs);

  if (entries.length >= limit) {
    const waitMs = windowMs - (now - entries[0]);
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, waitMs)));
  }

  buckets.set(key, [...entries, Date.now()]);
}
