import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

// ================================
// RATE LIMITERS
// Prevents abuse by limiting how many requests
// a single IP can make in a given time window.
//
// We have two limiters:
//   1. General API limiter  — applied to all routes
//   2. Auth limiter         — stricter, applied only to auth routes
//      (prevents brute force login attacks)
// ================================

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS * 60 * 1000, // Convert minutes to ms
  max: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7", // Return rate limit info in RateLimit headers
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        `Too many requests. Please try again after ${env.RATE_LIMIT_WINDOW_MS} minutes.`,
        429,
      ),
    );
  },
});

// Strict limiter for auth endpoints — max 10 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        "Too many login attempts. Please try again after 15 minutes.",
        429,
      ),
    );
  },
});
