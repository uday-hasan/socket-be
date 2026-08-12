import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./AppError";

// ================================
// JWT UTILITIES
// Handles creating and verifying both access and refresh tokens.
//
// Access Token:
//   - Short-lived (15 minutes by default)
//   - Sent in a HttpOnly cookie
//   - Used for authenticating API requests
//
// Refresh Token:
//   - Long-lived (7 days by default)
//   - Sent in a HttpOnly cookie
//   - Stored in the database (so we can revoke it)
//   - Used only to get a new access token
// ================================

export interface TokenPayload {
  userId: string;
  role: string;
}

// Create a short-lived access token
export const createAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

// Create a long-lived refresh token
// export const createRefreshToken = (payload: TokenPayload): string => {
//   return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
//     expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
//   });
// };

// Verify and decode an access token
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }
};

// Verify and decode a refresh token
// export const verifyRefreshToken = (token: string): TokenPayload => {
//   try {
//     return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
//   } catch {
//     throw new AppError('Invalid or expired refresh token', 401);
//   }
// };

// Calculate expiry date from duration string (e.g. "7d" → Date)
// export const getExpiryDate = (duration: string): Date => {
//   const unit = duration.slice(-1); // "d", "h", "m"
//   const value = parseInt(duration.slice(0, -1), 10);

//   const ms: Record<string, number> = {
//     d: 24 * 60 * 60 * 1000,
//     h: 60 * 60 * 1000,
//     m: 60 * 1000,
//   };

//   return new Date(Date.now() + value * (ms[unit] ?? ms['d']));
// };
