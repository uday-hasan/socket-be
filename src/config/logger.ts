import winston from "winston";
import { env } from "./env";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";

    return `[${timestamp}] ${level}: ${stack || message}${metaStr}`;
  }),
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",

  format: devFormat,

  transports: [new winston.transports.Console()],
});
