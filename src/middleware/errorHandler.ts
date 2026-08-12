/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
// import { Prisma } from '@prisma/client';
import { AppError } from "../utils/AppError";
import { logger } from "../config/logger";
import { isDevelopment } from "../config/env";
import { Prisma } from "../generated/prisma/client";

const formatZodErrors = (error: ZodError) => {
  return error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction, // Must keep 4th param even if unused — Express requires it
): void => {
  // Log every error for debugging
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // ---- 1. Our custom AppError ----
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(isDevelopment && { stack: err.stack }),
    });
    return;
  }

  // ---- 2. Zod validation error ----
  if (err instanceof ZodError) {
    const errorArray = formatZodErrors(err);
    const makeCapitalized = (str?: string) =>
      str ? str?.charAt(0).toUpperCase() + str?.slice(1) : "";
    res.status(422).json({
      success: false,
      message:
        makeCapitalized(errorArray[0]?.field) + " is required" ||
        "Validation error",
      errors: formatZodErrors(err),
    });
    return;
  }

  // ---- 3. Prisma errors ----
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 = Unique constraint violation (e.g. duplicate email)
    if ((err as any).code === "P2002") {
      const field =
        ((err as any).meta?.target as string[])?.join(", ") ?? "field";
      res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists`,
      });
      return;
    }

    // P2025 = Record not found
    if ((err as any).code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Record not found",
      });
      return;
    }
  }
  res.status(500).json({
    success: false,
    message: isDevelopment ? err.message : "Internal server error",
    ...(isDevelopment && { stack: err.stack }),
  });
};
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};
