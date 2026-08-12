import { type Response } from "express";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendResponse = <T>(
  res: Response,
  options: ApiResponse<T>,
): void => {
  const { statusCode, message, data, meta } = options;

  res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data: data ?? null,
    ...(meta && { meta }),
  });
};
