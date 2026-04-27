type RateLimitConfig = {
  limit: number
  windowMs: number
}

type Bucket = {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp

  return 'unknown'
}

export function rateLimit(key: string, config: RateLimitConfig) {
  const now = Date.now()
  const current = store.get(key)

  if (!current || now >= current.resetAt) {
    const next: Bucket = { count: 1, resetAt: now + config.windowMs }
    store.set(key, next)
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
  store.set(key, current)

  return {
    allowed: true,
    remaining: config.limit - current.count,
    resetAt: current.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}
