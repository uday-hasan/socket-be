import { type Response } from "express";
import { env, isProduction, isStaging } from "../config/env";

const isSecure = isProduction || isStaging;

const getCookieDomain = () => {
  if (isProduction) return ".udayhasan.dev";
  if (isStaging) return ".udayhasan.dev";
  return undefined;
};

const BASE_COOKIE_OPTIONS = {
  httpOnly: isSecure,
  secure: isSecure,
  sameSite: isSecure ? ("none" as const) : ("lax" as const),
  path: "/",
  domain: getCookieDomain(),
};

export const setAccessTokenCookie = (res: Response, token: string): void => {
  res.cookie("accessToken", token, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: parseToMilliseconds(env.JWT_ACCESS_EXPIRES_IN),
  });
};

// export const setRefreshTokenCookie = (res: Response, token: string): void => {
//   res.cookie('refreshToken', token, {
//     ...BASE_COOKIE_OPTIONS,
//     maxAge: parseToMilliseconds(env.JWT_REFRESH_EXPIRES_IN),
//   });
// };

export const clearAuthCookies = (res: Response): void => {
  const domain = getCookieDomain();
  res.clearCookie("accessToken", { path: "/", domain });
  res.clearCookie("refreshToken", { path: "/", domain });
};

const parseToMilliseconds = (duration: string): number => {
  if (!duration) return 0;

  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);

  // 1. Check if parseInt failed (e.g., input was just "s")
  if (isNaN(value)) return 0;

  // 2. Define the object as a 'const' to preserve literal keys
  const ms = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  } as const;

  // 3. Use a type guard or a safe fallback
  // We check if 'unit' is a key of our 'ms' object
  const multiplier = unit in ms ? ms[unit as keyof typeof ms] : ms.m;

  return value * multiplier;
};
