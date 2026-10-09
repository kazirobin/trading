import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from '../utils/http';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const error = result.error as ZodError;
      return next(ApiError.badRequest('Validation failed', error.flatten()));
    }
    (req as unknown as Record<Source, unknown>)[source] = result.data;
    next();
  };
}
