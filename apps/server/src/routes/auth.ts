import { Router } from 'express';
import { z } from 'zod';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { adminEmails, isProd } from '../config/env';
import { ApiError, asyncHandler } from '../utils/http';
import { signToken, verifyToken } from '../utils/jwt';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

export const authRouter = Router();

const REFRESH_COOKIE = 'refreshToken';
const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,
  maxAge: 7 * 24 * 3600 * 1000,
};

function issueTokens(user: { id: string; role: string }) {
  return {
    accessToken: signToken({ sub: user.id, role: user.role, typ: 'access' }, 'access'),
    refreshToken: signToken({ sub: user.id, role: user.role, typ: 'refresh' }, 'refresh'),
  };
}

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

authRouter.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body as z.infer<typeof registerSchema>;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw ApiError.conflict('Email already registered');

    const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: await User.hashPassword(password),
      role,
    });

    // Create starting wallets (USD demo + common crypto assets).
    await Promise.all(
      ['USD', 'USDT', 'BTC', 'ETH'].map((currency) =>
        Wallet.updateOne(
          { userId: user._id, currency },
          { $setOnInsert: { totalBalance: '0', lockedBalance: '0' } },
          { upsert: true },
        ),
      ),
    );

    const tokens = issueTokens({ id: user.id, role: user.role });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts);
    res.status(201).json({ success: true, data: { user, ...tokens } });
  }),
);

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1), totp: z.string().optional() });

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password, totp } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +twoFASecret');
    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    if (user.status === 'banned') throw ApiError.forbidden('Account banned');

    if (user.twoFAEnabled) {
      if (!totp) {
        const tempToken = signToken({ sub: user.id, role: user.role, typ: '2fa' }, '2fa');
        return res.json({ success: true, data: { twoFactorRequired: true, tempToken } });
      }
      const ok = user.twoFASecret ? authenticator.check(totp, user.twoFASecret) : false;
      if (!ok) throw ApiError.unauthorized('Invalid 2FA code');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = issueTokens({ id: user.id, role: user.role });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts);
    res.json({ success: true, data: { user, ...tokens } });
  }),
);

const verify2faSchema = z.object({ tempToken: z.string().min(1), totp: z.string().min(6) });

authRouter.post(
  '/2fa/verify',
  validate(verify2faSchema),
  asyncHandler(async (req, res) => {
    const { tempToken, totp } = req.body as z.infer<typeof verify2faSchema>;
    let payload;
    try {
      payload = verifyToken(tempToken, '2fa');
    } catch {
      throw ApiError.unauthorized('Invalid or expired 2FA session');
    }
    const user = await User.findById(payload.sub).select('+twoFASecret');
    if (!user?.twoFASecret) throw ApiError.unauthorized('2FA not configured');
    if (!authenticator.check(totp, user.twoFASecret)) throw ApiError.unauthorized('Invalid 2FA code');
    user.lastLoginAt = new Date();
    await user.save();
    const tokens = issueTokens({ id: user.id, role: user.role });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts);
    res.json({ success: true, data: { user, ...tokens } });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? (req.body?.refreshToken as string | undefined);
    if (!token) throw ApiError.unauthorized('Missing refresh token');
    let payload;
    try {
      payload = verifyToken(token, 'refresh');
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    const user = await User.findById(payload.sub);
    if (!user || user.status === 'banned') throw ApiError.unauthorized('User unavailable');
    const tokens = issueTokens({ id: user.id, role: user.role });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts);
    res.json({ success: true, data: tokens });
  }),
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(REFRESH_COOKIE);
  res.json({ success: true, data: { message: 'Logged out' } });
});

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: req.user });
  }),
);

/* ----------------------------- 2FA ----------------------------- */

authRouter.post(
  '/2fa/setup',
  authenticate,
  asyncHandler(async (req, res) => {
    const secret = authenticator.generateSecret();
    const user = req.user!;
    const otpauth = authenticator.keyuri(user.email, 'Tradevix', secret);
    const qr = await QRCode.toDataURL(otpauth);
    user.twoFASecret = secret;
    await user.save();
    res.json({ success: true, data: { secret, otpauth, qr } });
  }),
);

const enableSchema = z.object({ totp: z.string().min(6) });
authRouter.post(
  '/2fa/enable',
  authenticate,
  validate(enableSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id).select('+twoFASecret');
    if (!user?.twoFASecret) throw ApiError.badRequest('Run 2FA setup first');
    const { totp } = req.body as z.infer<typeof enableSchema>;
    if (!authenticator.check(totp, user.twoFASecret)) throw ApiError.badRequest('Invalid 2FA code');
    user.twoFAEnabled = true;
    await user.save();
    res.json({ success: true, data: { twoFAEnabled: true } });
  }),
);

authRouter.post(
  '/2fa/disable',
  authenticate,
  validate(enableSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id).select('+twoFASecret');
    if (!user?.twoFASecret || !user.twoFAEnabled) throw ApiError.badRequest('2FA is not enabled');
    const { totp } = req.body as z.infer<typeof enableSchema>;
    if (!authenticator.check(totp, user.twoFASecret)) throw ApiError.badRequest('Invalid 2FA code');
    user.twoFAEnabled = false;
    user.twoFASecret = null;
    await user.save();
    res.json({ success: true, data: { twoFAEnabled: false } });
  }),
);
