import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response } from "express";
import { logger } from "../utils/logger";

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100");

/**
 * General rate limiter for all requests
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs,
  max: maxRequests,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.headers["user-agent"],
    });

    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
      meta: {
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil(windowMs / 1000),
      },
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: "Too many authentication attempts, please try again later",
  handler: (req: Request, res: Response) => {
    logger.warn("Auth rate limit exceeded", {
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.headers["user-agent"],
    });

    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again after 15 minutes",
      meta: {
        timestamp: new Date().toISOString(),
        retryAfter: 900, // 15 minutes in seconds
      },
    });
  },
});

/**
 * Rate limiter for API endpoints
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: "Too many API requests, please slow down",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: "Too many password reset requests, please try again later",
  handler: (req: Request, res: Response) => {
    logger.warn("Password reset rate limit exceeded", {
      ip: req.ip,
      email: req.body?.email,
    });

    res.status(429).json({
      success: false,
      message:
        "Too many password reset attempts. Please try again after 1 hour",
      meta: {
        timestamp: new Date().toISOString(),
        retryAfter: 3600,
      },
    });
  },
});

/**
 * Rate limiter for registration
 */
export const registrationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: "Too many accounts created, please try again later",
  handler: (req: Request, res: Response) => {
    logger.warn("Registration rate limit exceeded", {
      ip: req.ip,
      email: req.body?.email,
    });

    res.status(429).json({
      success: false,
      message: "Too many registration attempts. Please try again later",
      meta: {
        timestamp: new Date().toISOString(),
        retryAfter: 3600,
      },
    });
  },
});

/**
 * Rate limiter for sensitive operations
 */
export const sensitiveLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests
  message: "Too many requests for sensitive operation",
  skipSuccessfulRequests: false,
});

const rateLimiters = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  passwordResetLimiter,
  registrationLimiter,
  sensitiveLimiter,
};

export default rateLimiters;
