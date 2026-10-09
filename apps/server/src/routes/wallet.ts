import { Router } from 'express';
import { z } from 'zod';
import { authenticator } from 'otplib';
import { Wallet } from '../models/Wallet';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { ApiError, asyncHandler } from '../utils/http';
import { validate } from '../middleware/validate';
import { authenticate, requireActive, requireKyc } from '../middleware/auth';
import { debitAvailable, ensureWallet } from '../services/walletService';
import { toNum } from '../utils/decimal';

export const walletRouter = Router();
walletRouter.use(authenticate, requireActive);

walletRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const wallets = await Wallet.find({ userId: req.user!.id }).lean();
    const data = wallets.map((w) => {
      const total = Number(w.totalBalance.toString());
      const locked = Number(w.lockedBalance.toString());
      return { currency: w.currency, total, locked, available: total - locked };
    });
    res.json({ success: true, data });
  }),
);

walletRouter.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const type = req.query.type as string | undefined;
    const filter: Record<string, unknown> = { userId: req.user!.id };
    if (type) filter.type = type;
    const txs = await Transaction.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, data: txs });
  }),
);

const depositSchema = z.object({
  currency: z.string().min(2).max(12).default('USDT'),
  amount: z.coerce.number().positive().max(1_000_000),
  method: z.string().max(40).optional(),
});

walletRouter.post(
  '/deposit',
  validate(depositSchema),
  asyncHandler(async (req, res) => {
    const { currency, amount, method } = req.body as z.infer<typeof depositSchema>;
    const tx = await Transaction.create({
      userId: req.user!.id,
      type: 'deposit',
      currency: currency.toUpperCase(),
      amount: amount.toFixed(8),
      status: 'pending',
      method: method ?? 'manual',
      note: 'Awaiting admin confirmation',
    });
    res.status(201).json({ success: true, data: tx });
  }),
);

const withdrawSchema = z.object({
  currency: z.string().min(2).max(12).default('USDT'),
  amount: z.coerce.number().positive(),
  address: z.string().min(6).max(200),
  totp: z.string().min(6),
});

walletRouter.post(
  '/withdraw',
  requireKyc,
  validate(withdrawSchema),
  asyncHandler(async (req, res) => {
    const { currency, amount, address, totp } = req.body as z.infer<typeof withdrawSchema>;
    const cur = currency.toUpperCase();

    const user = await User.findById(req.user!.id).select('+twoFASecret');
    if (user?.twoFAEnabled) {
      if (!user.twoFASecret || !authenticator.check(totp, user.twoFASecret)) {
        throw ApiError.unauthorized('Invalid 2FA code');
      }
    }

    await ensureWallet(req.user!.id, cur);
    // Move funds out of available balance immediately (held pending review).
    const wallet = await debitAvailable(req.user!.id, cur, amount, {
      tx: 'withdraw',
      note: 'Withdrawal request (pending review)',
      reference: address,
    });

    const tx = await Transaction.create({
      userId: req.user!.id,
      type: 'withdraw',
      currency: cur,
      amount: amount.toFixed(8),
      balanceAfter: wallet.totalBalance,
      status: 'pending',
      method: 'onchain',
      address,
      note: 'Awaiting admin approval',
    });

    res.status(201).json({ success: true, data: tx });
  }),
);

walletRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const wallets = await Wallet.find({ userId: req.user!.id }).lean();
    const summary = wallets.map((w) => ({
      currency: w.currency,
      total: toNum(w.totalBalance),
      locked: toNum(w.lockedBalance),
      available: toNum(w.totalBalance) - toNum(w.lockedBalance),
    }));
    const openTx = await Transaction.countDocuments({ userId: req.user!.id, status: 'pending' });
    res.json({ success: true, data: { wallets: summary, pendingTransactions: openTx } });
  }),
);
