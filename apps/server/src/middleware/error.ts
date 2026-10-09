import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/http';
import { isProd } from '../config/env';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let status = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    details = err.details;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message]),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (typeof err === 'object' && err && (err as { code?: number }).code === 11000) {
    status = 409;
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    message = `Duplicate value for ${keyValue ? Object.keys(keyValue).join(', ') : 'field'}`;
  } else if (err instanceof Error) {
    message = isProd ? message : err.message;
  }

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({ success: false, error: { message, code: status, details } });
}
