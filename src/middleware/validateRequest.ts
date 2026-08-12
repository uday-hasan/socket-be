import type { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";

// Define the structured schema type
interface RequestValidationConfig {
  body?: ZodType<any>;
  params?: ZodType<any>;
  query?: ZodType<any>;
}

/**
 * Validates the request against a Zod schema.
 * Supports passing a direct Zod schema (for body validation)
 * or a config object (for body, params, and query).
 */
export const validateRequest = (
  schema: RequestValidationConfig | ZodType<any>,
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Case 1: Direct Zod Schema passed -> Validate req.body
      if (schema instanceof ZodType) {
        req.body = await schema.parseAsync(req.body);
      }
      // Case 2: Config object passed -> Validate specific parts
      else {
        if (schema.body) {
          req.body = await schema.body.parseAsync(req.body);
        }
        if (schema.params) {
          const parsedParams = await schema.params.parseAsync(req.params);
          Object.assign(req.params, parsedParams as any);
        }
        if (schema.query) {
          const parsedQuery = await schema.query.parseAsync(req.query);
          Object.assign(req.query, parsedQuery as any);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
