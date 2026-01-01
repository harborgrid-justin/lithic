/**
 * Rate Limiter
 * Token bucket and sliding window rate limiting for API requests
 */

import type { RateLimit, RateLimitStatus } from "@/types/integrations";
import { db } from "@/lib/db";

/**
 * Rate Limiter using Token Bucket Algorithm
 */
export class TokenBucketRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();

  /**
   * Check if request is allowed
   */
  async checkLimit(
    identifier: string,
    limit: RateLimit
  ): Promise<RateLimitStatus> {
    const bucket = this.getBucket(identifier, limit);
    const now = Date.now();

    // Refill tokens
    bucket.refill(now);

    // Check if tokens available
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      bucket.lastRequest = now;

      return {
        allowed: true,
        limit: bucket.capacity,
        remaining: Math.floor(bucket.tokens),
        resetAt: new Date(bucket.getResetTime()),
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      limit: bucket.capacity,
      remaining: 0,
      resetAt: new Date(bucket.getResetTime()),
      retryAfter: Math.ceil((1 - bucket.tokens) * bucket.refillInterval),
    };
  }

  /**
   * Get or create bucket
   */
  private getBucket(identifier: string, limit: RateLimit): TokenBucket {
    let bucket = this.buckets.get(identifier);

    if (!bucket) {
      bucket = new TokenBucket(limit);
      this.buckets.set(identifier, bucket);
    }

    return bucket;
  }

  /**
   * Reset bucket
   */
  reset(identifier: string): void {
    this.buckets.delete(identifier);
  }

  /**
   * Clean up old buckets
   */
  cleanup(maxAge: number = 3600000): void {
    const now = Date.now();

    for (const [identifier, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRequest > maxAge) {
        this.buckets.delete(identifier);
      }
    }
  }
}

/**
 * Token Bucket
 */
class TokenBucket {
  tokens: number;
  capacity: number;
  refillRate: number;
  refillInterval: number;
  lastRefill: number;
  lastRequest: number;

  constructor(limit: RateLimit) {
    // Calculate capacity and refill rate
    if (limit.requestsPerMinute) {
      this.capacity = limit.requestsPerMinute;
      this.refillRate = limit.requestsPerMinute / 60;
      this.refillInterval = 60000 / limit.requestsPerMinute;
    } else if (limit.requestsPerHour) {
      this.capacity = limit.requestsPerHour;
      this.refillRate = limit.requestsPerHour / 3600;
      this.refillInterval = 3600000 / limit.requestsPerHour;
    } else if (limit.requestsPerDay) {
      this.capacity = limit.requestsPerDay;
      this.refillRate = limit.requestsPerDay / 86400;
      this.refillInterval = 86400000 / limit.requestsPerDay;
    } else {
      this.capacity = 100;
      this.refillRate = 100 / 60;
      this.refillInterval = 600;
    }

    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    this.lastRequest = Date.now();
  }

  /**
   * Refill tokens
   */
  refill(now: number): void {
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get reset time
   */
  getResetTime(): number {
    const tokensNeeded = 1 - this.tokens;
    return this.lastRefill + tokensNeeded * this.refillInterval;
  }
}

/**
 * Sliding Window Rate Limiter
 */
export class SlidingWindowRateLimiter {
  private windows: Map<string, SlidingWindow> = new Map();

  /**
   * Check if request is allowed
   */
  async checkLimit(
    identifier: string,
    limit: RateLimit
  ): Promise<RateLimitStatus> {
    const window = this.getWindow(identifier, limit);
    const now = Date.now();

    // Remove old requests
    window.cleanup(now);

    // Check if under limit
    if (window.count() < window.limit) {
      window.addRequest(now);

      return {
        allowed: true,
        limit: window.limit,
        remaining: window.limit - window.count(),
        resetAt: new Date(window.getResetTime()),
      };
    }

    // Rate limit exceeded
    const oldestRequest = window.getOldestRequest();
    const retryAfter = oldestRequest + window.windowSize - now;

    return {
      allowed: false,
      limit: window.limit,
      remaining: 0,
      resetAt: new Date(window.getResetTime()),
      retryAfter: Math.ceil(retryAfter / 1000),
    };
  }

  /**
   * Get or create window
   */
  private getWindow(identifier: string, limit: RateLimit): SlidingWindow {
    let window = this.windows.get(identifier);

    if (!window) {
      window = new SlidingWindow(limit);
      this.windows.set(identifier, window);
    }

    return window;
  }

  /**
   * Reset window
   */
  reset(identifier: string): void {
    this.windows.delete(identifier);
  }
}

/**
 * Sliding Window
 */
class SlidingWindow {
  requests: number[] = [];
  limit: number;
  windowSize: number;

  constructor(limit: RateLimit) {
    if (limit.requestsPerMinute) {
      this.limit = limit.requestsPerMinute;
      this.windowSize = 60000;
    } else if (limit.requestsPerHour) {
      this.limit = limit.requestsPerHour;
      this.windowSize = 3600000;
    } else if (limit.requestsPerDay) {
      this.limit = limit.requestsPerDay;
      this.windowSize = 86400000;
    } else {
      this.limit = 100;
      this.windowSize = 60000;
    }
  }

  /**
   * Add request
   */
  addRequest(timestamp: number): void {
    this.requests.push(timestamp);
  }

  /**
   * Clean up old requests
   */
  cleanup(now: number): void {
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.windowSize
    );
  }

  /**
   * Get request count
   */
  count(): number {
    return this.requests.length;
  }

  /**
   * Get oldest request
   */
  getOldestRequest(): number {
    return this.requests[0] || Date.now();
  }

  /**
   * Get reset time
   */
  getResetTime(): number {
    const oldest = this.getOldestRequest();
    return oldest + this.windowSize;
  }
}

/**
 * Redis-backed Rate Limiter
 * For distributed rate limiting across multiple servers
 */
export class RedisRateLimiter {
  constructor(private redisClient: any) {}

  /**
   * Check if request is allowed (using Redis)
   */
  async checkLimit(
    identifier: string,
    limit: RateLimit
  ): Promise<RateLimitStatus> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();

    let windowSize: number;
    let maxRequests: number;

    if (limit.requestsPerMinute) {
      windowSize = 60;
      maxRequests = limit.requestsPerMinute;
    } else if (limit.requestsPerHour) {
      windowSize = 3600;
      maxRequests = limit.requestsPerHour;
    } else if (limit.requestsPerDay) {
      windowSize = 86400;
      maxRequests = limit.requestsPerDay;
    } else {
      windowSize = 60;
      maxRequests = 100;
    }

    // Use Redis sorted set for sliding window
    const windowStart = now - windowSize * 1000;

    // Remove old entries
    await this.redisClient.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await this.redisClient.zcard(key);

    if (count < maxRequests) {
      // Add new request
      await this.redisClient.zadd(key, now, `${now}-${Math.random()}`);
      await this.redisClient.expire(key, windowSize);

      return {
        allowed: true,
        limit: maxRequests,
        remaining: maxRequests - count - 1,
        resetAt: new Date(now + windowSize * 1000),
      };
    }

    // Rate limit exceeded
    const oldest = await this.redisClient.zrange(key, 0, 0, "WITHSCORES");
    const resetTime = oldest[1] + windowSize * 1000;

    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetAt: new Date(resetTime),
      retryAfter: Math.ceil((resetTime - now) / 1000),
    };
  }
}

/**
 * Rate Limiter Manager
 */
export class RateLimiterManager {
  private limiters: Map<string, TokenBucketRateLimiter> = new Map();

  /**
   * Get or create rate limiter
   */
  getLimiter(identifier: string): TokenBucketRateLimiter {
    let limiter = this.limiters.get(identifier);

    if (!limiter) {
      limiter = new TokenBucketRateLimiter();
      this.limiters.set(identifier, limiter);
    }

    return limiter;
  }

  /**
   * Check rate limit
   */
  async checkLimit(
    identifier: string,
    limit: RateLimit
  ): Promise<RateLimitStatus> {
    const limiter = this.getLimiter(identifier);
    const status = await limiter.checkLimit(identifier, limit);

    // Log if limit exceeded
    if (!status.allowed) {
      await this.logRateLimitExceeded(identifier, limit);
    }

    return status;
  }

  /**
   * Log rate limit exceeded
   */
  private async logRateLimitExceeded(
    identifier: string,
    limit: RateLimit
  ): Promise<void> {
    try {
      await db.rateLimitLog.create({
        data: {
          identifier,
          limit: JSON.stringify(limit),
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error logging rate limit:", error);
    }
  }

  /**
   * Cleanup old limiters
   */
  cleanup(): void {
    for (const limiter of this.limiters.values()) {
      limiter.cleanup();
    }
  }
}

// Singleton instance
export const rateLimiterManager = new RateLimiterManager();

/**
 * Rate limit middleware helper
 */
export async function checkRateLimit(
  identifier: string,
  limit: RateLimit
): Promise<RateLimitStatus> {
  return rateLimiterManager.checkLimit(identifier, limit);
}
