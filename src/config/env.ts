import "dotenv/config";
import z from "zod";
const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  DATABASE_URL: z.string().nonempty("DATABASE_URL is required"),
  NODE_ENV: z
    .enum(["development", "production", "staging"])
    .default("development"),
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
