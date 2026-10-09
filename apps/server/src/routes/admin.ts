import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Trade } from '../models/Trade';
import { Transaction } from '../models/Transaction';
import { Kyc } from '../models/Kyc';
import { MarketPair } from '../models/MarketPair';
import { AuditLog } from '../models/AuditLog';
import { ApiError, asyncHandler } from '../utils/http';
import { validate } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';
import { credit } from '../services/walletService';
import { toNum } from '../utils/decimal';

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('admin'));

async function audit(actorId: string, action: string, meta: Record<string, unknown> = {}, severity: 'info' | 'warning' | 'critical' = 'info') {
  await AuditLog.create({ actorId, actorRole: 'admin', action, severity, meta });
}

adminRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const [users, activeUsers, openOrders, pendingKyc, pendingWithdrawals, feeAgg, volumeAgg] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Order.countDocuments({ status: { $in: ['open', 'partial'] } }),
      Kyc.countDocuments({ status: 'pending' }),
      Transaction.countDocuments({ type: 'withdraw', status: 'pending' }),
      Trade.aggregate([{ $group: { _id: null, maker: { $sum: { $toDouble: '$makerFee' } }, taker: { $sum: { $toDouble: '$takerFee' } } } }]),
      Trade.aggregate([{ $group: { _id: null, volume: { $sum: { $toDouble: '$quoteAmount' } }, count: { $sum: 1 } } }]),
    ]);

    const fees = feeAgg[0] ? feeAgg[0].maker + feeAgg[0].taker : 0;
    const volume = volumeAgg[0] ?? { volume: 0, count: 0 };

    res.json({
      success: true,
      data: {
        users,
        activeUsers,
        openOrders,
        pendingKyc,
        pendingWithdrawals,
        revenue: Number(fees.toFixed(2)),
        tradeVolume: Number((volume.volume ?? 0).toFixed(2)),
        tradeCount: volume.count ?? 0,
      },
    });
  }),
);

/* ------------------------------- users ------------------------------- */

adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const search = (req.query.search as string | undefined)?.trim();
    const filter: Record<string, unknown> = {};
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const [rows, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: { rows, total, page, limit } });
  }),
);

const userPatchSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  role: z.enum(['user', 'admin']).optional(),
  kycStatus: z.enum(['unverified', 'pending', 'approved', 'rejected']).optional(),
});

adminRouter.patch(
  '/users/:id',
  validate(userPatchSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) throw ApiError.notFound('User not found');
    await audit(req.user!.id, 'user.update', { targetId: user.id, changes: req.body });
    res.json({ success: true, data: user });
  }),
);

adminRouter.get(
  '/users/:id/transactions',
  asyncHandler(async (req, res) => {
    const txs = await Transaction.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, data: txs });
  }),
);

/* -------------------------------- kyc -------------------------------- */

adminRouter.get(
  '/kyc',
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const rows = await Kyc.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, data: rows });
  }),
);

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(300).optional(),
});

adminRouter.post(
  '/kyc/:id/review',
  validate(reviewSchema),
  asyncHandler(async (req, res) => {
    const { action, reason } = req.body as z.infer<typeof reviewSchema>;
    const kyc = await Kyc.findById(req.params.id);
    if (!kyc) throw ApiError.notFound('KYC submission not found');

    kyc.status = action === 'approve' ? 'approved' : 'rejected';
    kyc.reviewerId = req.user!._id;
    kyc.rejectReason = action === 'reject' ? reason ?? 'Rejected' : null;
    kyc.reviewedAt = new Date();
    await kyc.save();

    await User.findByIdAndUpdate(kyc.userId, { kycStatus: kyc.status });
    await audit(req.user!.id, `kyc.${action}`, { kycId: kyc.id, userId: String(kyc.userId), reason });
    res.json({ success: true, data: kyc });
  }),
);

/* ---------------------------- transactions --------------------------- */

adminRouter.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    const rows = await Transaction.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, data: rows });
  }),
);

adminRouter.post(
  '/transactions/:id/review',
  validate(reviewSchema),
  asyncHandler(async (req, res) => {
    const { action, reason } = req.body as z.infer<typeof reviewSchema>;
    const tx = await Transaction.findById(req.params.id);
    if (!tx) throw ApiError.notFound('Transaction not found');
    if (tx.status !== 'pending') throw ApiError.badRequest('Transaction is not pending');

    if (action === 'approve') {
      if (tx.type === 'deposit') {
        await credit(tx.userId, tx.currency, tx.amount, { reference: `deposit:${tx.id}`, note: 'Deposit approved' });
      }
      tx.status = 'completed';
    } else {
      if (tx.type === 'withdraw') {
        // Funds were moved out of available balance on request; refund on rejection.
        await credit(tx.userId, tx.currency, tx.amount, { reference: `withdraw-refund:${tx.id}`, note: 'Withdrawal rejected' });
      }
      tx.status = 'failed';
      tx.note = reason ?? tx.note;
    }
    tx.reviewedBy = req.user!._id;
    tx.reviewedAt = new Date();
    await tx.save();
    await audit(req.user!.id, `transaction.${action}`, { txId: tx.id, type: tx.type, amount: toNum(tx.amount) });
    res.json({ success: true, data: tx });
  }),
);

/* ------------------------------ markets ------------------------------ */

const marketSchema = z.object({
  symbol: z.string().min(3).max(20),
  baseAsset: z.string().min(1).max(12),
  quoteAsset: z.string().min(1).max(12),
  pricePrecision: z.number().int().min(0).max(12).default(2),
  qtyPrecision: z.number().int().min(0).max(12).default(6),
  tickSize: z.string().default('0.01'),
  stepSize: z.string().default('0.000001'),
  minNotional: z.string().default('10'),
  makerFeePct: z.string().default('0.1'),
  takerFeePct: z.string().default('0.1'),
  enabled: z.boolean().default(true),
});

adminRouter.get(
  '/markets',
  asyncHandler(async (_req, res) => {
    const rows = await MarketPair.find().sort({ sortOrder: 1 }).lean();
    res.json({ success: true, data: rows });
  }),
);

adminRouter.post(
  '/markets',
  validate(marketSchema),
  asyncHandler(async (req, res) => {
    const pair = await MarketPair.create(req.body);
    await audit(req.user!.id, 'market.create', { symbol: pair.symbol });
    res.status(201).json({ success: true, data: pair });
  }),
);

adminRouter.patch(
  '/markets/:id',
  asyncHandler(async (req, res) => {
    const pair = await MarketPair.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pair) throw ApiError.notFound('Market not found');
    await audit(req.user!.id, 'market.update', { symbol: pair.symbol, changes: Object.keys(req.body) });
    res.json({ success: true, data: pair });
  }),
);

/* -------------------------------- risk ------------------------------- */

adminRouter.get(
  '/risk',
  asyncHandler(async (_req, res) => {
    const thresholdTx = await Transaction.find({ type: { $in: ['deposit', 'withdraw'] } })
      .sort({ amount: -1 })
      .limit(20)
      .lean();
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, data: { largeTransactions: thresholdTx, auditLogs: logs } });
  }),
);

export { audit };
