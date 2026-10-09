import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type TokenPayload = {
  sub: string;
  role: string;
  /**
   * Token purpose:
   * - access: normal API access
   * - refresh: exchange for a new access token
   * - 2fa: short-lived token issued after password check, pending TOTP
   */
  typ: 'access' | 'refresh' | '2fa';
};

export function signToken(payload: TokenPayload, typ: TokenPayload['typ']): string {
  const secret = typ === 'refresh' ? env.JWT_REFRESH_SECRET : env.JWT_ACCESS_SECRET;
  const ttl = typ === 'refresh' ? env.JWT_REFRESH_TTL : env.JWT_ACCESS_TTL;
  return jwt.sign({ ...payload, typ }, secret, { expiresIn: ttl } as SignOptions);
}

export function verifyToken(token: string, typ: TokenPayload['typ']): TokenPayload {
  const secret = typ === 'refresh' ? env.JWT_REFRESH_SECRET : env.JWT_ACCESS_SECRET;
  const decoded = jwt.verify(token, secret) as TokenPayload;
  if (decoded.typ !== typ) throw new Error('Invalid token type');
  return decoded;
}
