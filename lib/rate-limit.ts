import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

type RateLimitConfig = {
  limit: number
  windowMs: number
}

// Fallback store for local development if Upstash is not configured
const localStore = new Map<string, { count: number; resetAt: number }>()

const TRUSTED_PROXY = process.env.TRUSTED_PROXY

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded && TRUSTED_PROXY) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp

  return 'unknown'
}

let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "60 s"), // Default, will be overridden by config
      analytics: true,
      prefix: "@upstash/ratelimit",
    })
  } catch (e) {
    console.warn("Failed to initialize Upstash Ratelimit:", e)
  }
}

export async function rateLimit(key: string, config: RateLimitConfig) {
  if (ratelimit) {
    const { success, remaining, reset } = await ratelimit.limit(key)
    return {
      allowed: success,
      remaining,
      resetAt: reset,
      retryAfterSec: Math.ceil((reset - Date.now()) / 1000),
    }
  }

  // Fallback to in-memory store
  const now = Date.now()
  const current = localStore.get(key)

  if (!current || now >= current.resetAt) {
    const next = { count: 1, resetAt: now + config.windowMs }
    localStore.set(key, next)
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: next.resetAt,
      retryAfterSec: Math.ceil(config.windowMs / 1000),
    }
  }

  if (current.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  localStore.set(key, current)

  return {
    allowed: true,
    remaining: config.limit - current.count,
    resetAt: current.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}
