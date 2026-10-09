import type { NextFunction, Request, Response } from 'express';
import { User, type IUser } from '../models/User';
import { ApiError } from '../utils/http';
import { verifyToken } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies;
  if (cookie?.accessToken) return cookie.accessToken;
  return null;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized('Missing access token');
    const payload = verifyToken(token, 'access');
    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (user.status === 'banned') throw ApiError.forbidden('Account banned');
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

export function requireRole(...roles: Array<'user' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.status === 'suspended') return next(ApiError.forbidden('Account suspended'));
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient role'));
    next();
  };
}

export function requireActive(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.status !== 'active') return next(ApiError.forbidden('Account is not active'));
  next();
}

export function requireKyc(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.kycStatus !== 'approved') return next(ApiError.forbidden('KYC verification required'));
  next();
}
