import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
const limiters = new Map<string, Ratelimit>();
const localBuckets = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(identifier: string, namespace: string, limit = 30, windowSeconds = 60) {
  if (redis) {
    const key = `${namespace}:${limit}:${windowSeconds}`;
    let limiter = limiters.get(key);
    if (!limiter) {
      limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`), prefix: "mada:rl", analytics: false });
      limiters.set(key, limiter);
    }
    const result = await limiter.limit(`${namespace}:${identifier}`);
    return { success: result.success, reset: result.reset };
  }

  const now = Date.now();
  const key = `${namespace}:${identifier}`;
  const current = localBuckets.get(key);
  if (!current || current.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, reset: now + windowSeconds * 1000 };
  }
  current.count += 1;
  return { success: current.count <= limit, reset: current.resetAt };
}