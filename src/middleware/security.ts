/**
 * Security Middleware
 * Request validation, rate limiting, IP filtering, request signing
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { logAudit } from "@/lib/security/audit-logger";

// ============================================================================
// Rate Limiting
// ============================================================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimiter(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60000,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();

  let rateLimit = rateLimitStore.get(key);

  if (!rateLimit || now > rateLimit.resetAt) {
    rateLimit = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  rateLimit.count++;
  rateLimitStore.set(key, rateLimit);

  const allowed = rateLimit.count <= limit;
  const remaining = Math.max(0, limit - rateLimit.count);

  if (!allowed) {
    await logAudit({
      userId: "SYSTEM",
      organizationId: "",
      action: "RATE_LIMIT_EXCEEDED",
      resource: "API",
      details: `Rate limit exceeded for IP: ${ip}`,
      ipAddress: ip,
      metadata: {
        path: request.nextUrl.pathname,
        count: rateLimit.count,
        limit,
      },
    });
  }

  return {
    allowed,
    remaining,
    resetAt: rateLimit.resetAt,
  };
}

// ============================================================================
// IP Filtering
// ============================================================================

const BLOCKED_IPS: Set<string> = new Set();
const ALLOWED_IPS: Set<string> = new Set(); // Empty = allow all

export async function ipFilter(request: NextRequest): Promise<boolean> {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  if (BLOCKED_IPS.has(ip)) {
    await logAudit({
      userId: "SYSTEM",
      organizationId: "",
      action: "IP_BLOCKED",
      resource: "Security",
      details: `Blocked IP attempted access: ${ip}`,
      ipAddress: ip,
    });
    return false;
  }

  if (ALLOWED_IPS.size > 0 && !ALLOWED_IPS.has(ip)) {
    await logAudit({
      userId: "SYSTEM",
      organizationId: "",
      action: "IP_NOT_WHITELISTED",
      resource: "Security",
      details: `Non-whitelisted IP attempted access: ${ip}`,
      ipAddress: ip,
    });
    return false;
  }

  return true;
}

// ============================================================================
// Request Signing & Validation
// ============================================================================

export function signRequest(body: any, secret: string): string {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return signature;
}

export function verifyRequestSignature(
  body: any,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = signRequest(body, secret);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch {
    return false;
  }
}

// ============================================================================
// Security Headers
// ============================================================================

export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Strict Transport Security
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
  );

  // X-Frame-Options
  response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=()",
  );

  // X-XSS-Protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Remove server header
  response.headers.delete("X-Powered-By");

  return response;
}

// ============================================================================
// Input Validation
// ============================================================================

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ============================================================================
// SQL Injection Protection
// ============================================================================

export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION\s+SELECT)/i,
    /(--|\;|\/\*|\*\/)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

// ============================================================================
// XSS Protection
// ============================================================================

export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

// ============================================================================
// CSRF Protection
// ============================================================================

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken),
    );
  } catch {
    return false;
  }
}

// ============================================================================
// Main Security Middleware
// ============================================================================

export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Check IP filtering
  const ipAllowed = await ipFilter(request);
  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 },
    );
  }

  // Apply rate limiting
  const rateLimit = await rateLimiter(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests",
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      },
      { status: 429 },
    );
  }

  // Validate request
  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      const body = await request.clone().json();

      // Check for SQL injection and XSS in all string values
      const checkValue = (value: any): boolean => {
        if (typeof value === "string") {
          return detectSQLInjection(value) || detectXSS(value);
        }
        if (typeof value === "object" && value !== null) {
          return Object.values(value).some(checkValue);
        }
        return false;
      };

      if (checkValue(body)) {
        await logAudit({
          userId: "SYSTEM",
          organizationId: "",
          action: "MALICIOUS_INPUT_DETECTED",
          resource: "Security",
          details: "Potential SQL injection or XSS detected in request",
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          success: false,
        });

        return NextResponse.json(
          { error: "Invalid request" },
          { status: 400 },
        );
      }
    } catch {
      // Invalid JSON - let the API handler deal with it
    }
  }

  // Allow request to proceed
  return null;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function blockIP(ip: string): void {
  BLOCKED_IPS.add(ip);
}

export function unblockIP(ip: string): void {
  BLOCKED_IPS.delete(ip);
}

export function addToWhitelist(ip: string): void {
  ALLOWED_IPS.add(ip);
}

export function removeFromWhitelist(ip: string): void {
  ALLOWED_IPS.delete(ip);
}

export function clearRateLimits(): void {
  rateLimitStore.clear();
}
