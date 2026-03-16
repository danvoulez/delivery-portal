import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'

const RESOLVE_PATH = '/api/external/delivery/session/resolve'

// Lazy singletons — not created until first request (avoids crashing in test env without Upstash creds)
let _redis: Redis | null = null
let _resolveRateLimit: Ratelimit | null = null
let _writeRateLimit: Ratelimit | null = null

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

export function getResolveRateLimit(): Ratelimit {
  if (!_resolveRateLimit) {
    _resolveRateLimit = new Ratelimit({
      redis:   getRedis(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix:  'rl:resolve',
    })
  }
  return _resolveRateLimit
}

export function getWriteRateLimit(): Ratelimit {
  if (!_writeRateLimit) {
    _writeRateLimit = new Ratelimit({
      redis:   getRedis(),
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      prefix:  'rl:write',
    })
  }
  return _writeRateLimit
}

export function buildRateLimitKey(
  pathname: string,
  ip: string,
  sessionShard: string | undefined
): string {
  if (pathname === RESOLVE_PATH) {
    return `rl:resolve:ip:${ip}`
  }
  return sessionShard
    ? `rl:write:sess:${sessionShard}`
    : `rl:write:ip:${ip}`
}

export { RESOLVE_PATH }
