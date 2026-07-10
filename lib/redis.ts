import { Redis } from '@upstash/redis';

let cached: Redis | null = null;

/**
 * Lazily creates the Redis client. Reads whichever env var names the
 * Vercel storage integration injected — different integrations have used
 * slightly different names over time (KV_REST_API_* vs UPSTASH_REDIS_REST_*).
 */
export function getRedis(): Redis {
  if (cached) return cached;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing Redis credentials. In your Vercel project, go to Storage → add a Redis (Upstash) integration, then redeploy.'
    );
  }

  cached = new Redis({ url, token });
  return cached;
}
