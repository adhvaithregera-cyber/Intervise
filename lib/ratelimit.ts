/**
 * Sliding-window in-memory rate limiter.
 *
 * ⚠️  IMPORTANT — serverless note:
 * This works on warm Vercel function instances. Cold starts reset the window.
 * For true distributed rate limiting (multi-region / strict enforcement),
 * replace `checkRateLimit` with @upstash/ratelimit backed by Upstash Redis.
 */

const windows = new Map<string, number[]>()

// Prevent unbounded memory growth — prune stale keys every 60 seconds.
// Cap total keys at 50 000 to bound worst-case memory on long-running instances.
const MAX_KEYS = 50_000
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000 // 2 hours
  for (const [key, timestamps] of windows.entries()) {
    if (timestamps.every(t => t < cutoff)) windows.delete(key)
  }
  // If still over cap, evict oldest-inserted entries
  if (windows.size > MAX_KEYS) {
    let excess = windows.size - MAX_KEYS
    for (const key of windows.keys()) {
      windows.delete(key)
      if (--excess <= 0) break
    }
  }
}, 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  /** How many ms to wait before retrying (only set when allowed=false) */
  retryAfterMs?: number
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs

  const timestamps = (windows.get(key) ?? []).filter(t => t > windowStart)

  if (timestamps.length >= config.maxRequests) {
    const retryAfterMs = timestamps[0] + config.windowMs - now
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) }
  }

  timestamps.push(now)
  windows.set(key, timestamps)
  return { allowed: true }
}

/**
 * Per-endpoint rate limit configs.
 * Keys are `userId:endpoint`.
 */
export const RATE_LIMITS = {
  /** Session creation — expensive + quota-sensitive */
  sessionStart:  { maxRequests: 10, windowMs: 60 * 60 * 1000 },   // 10 / hour
  /** Audio transcription — calls AssemblyAI (costly) */
  transcribe:    { maxRequests: 25, windowMs: 60 * 60 * 1000 },   // 25 / hour
  /** Session completion */
  complete:      { maxRequests: 25, windowMs: 60 * 60 * 1000 },   // 25 / hour
  /** Session rename */
  sessionName:   { maxRequests: 40, windowMs: 10 * 60 * 1000 },  // 40 / 10 min
  /** Onboarding submit */
  onboarding:    { maxRequests: 10, windowMs: 10 * 60 * 1000 },  // 10 / 10 min
  /** Profile update */
  profile:       { maxRequests: 40, windowMs: 10 * 60 * 1000 },  // 40 / 10 min
} as const satisfies Record<string, RateLimitConfig>
