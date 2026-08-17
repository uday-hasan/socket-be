import "dotenv/config";
import z from "zod";
const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  DATABASE_URL: z.string().nonempty("DATABASE_URL is required"),
  NODE_ENV: z
    .enum(["development", "production", "staging"])
    .default("development"),
  RATE_LIMIT_MAX: z.string().default("100").transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default("15").transform(Number),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:8000"),
  COOKIE_SECRET: z
    .string()
    .min(32, "COOKIE_SECRET must be at least 32 characters"),
});

const loadEnv = () => {
  const parsedEnv = envSchema.safeParse(process.env);
  if (!parsedEnv.success) {
    throw new Error(
      parsedEnv.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", "),
    );
  }
  return parsedEnv.data;
};

export const env = loadEnv();
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isStaging = env.NODE_ENV === "staging";
