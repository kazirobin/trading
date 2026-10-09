import { Router } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order';
import { Trade } from '../models/Trade';
import { ApiError, asyncHandler } from '../utils/http';
import { validate } from '../middleware/validate';
import { authenticate, requireActive } from '../middleware/auth';
import { cancelOrder, placeOrder } from '../services/matchingEngine';

export const ordersRouter = Router();
ordersRouter.use(authenticate, requireActive);

const placeSchema = z.object({
  symbol: z.string().min(3).max(20),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit', 'stop_limit', 'stop_market']).default('limit'),
  amount: z.coerce.number().positive(),
  price: z.coerce.number().positive().optional(),
  stopPrice: z.coerce.number().positive().optional(),
});

ordersRouter.post(
  '/',
  validate(placeSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof placeSchema>;
    const order = await placeOrder({
      userId: req.user!.id,
      symbol: body.symbol,
      side: body.side,
      type: body.type,
      amount: body.amount,
      price: body.price ?? null,
      stopPrice: body.stopPrice ?? null,
    });
    res.status(201).json({ success: true, data: order });
  }),
);

ordersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const symbol = req.query.symbol as string | undefined;
    const filter: Record<string, unknown> = { userId: req.user!.id };
    if (status === 'open') filter.status = { $in: ['open', 'partial'] };
    else if (status) filter.status = status;
    if (symbol) filter.symbol = symbol.toUpperCase();
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, data: orders });
  }),
);

ordersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user!.id }).lean();
    if (!order) throw ApiError.notFound('Order not found');
    res.json({ success: true, data: order });
  }),
);

ordersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await cancelOrder(req.user!.id, req.params.id);
    res.json({ success: true, data: order });
  }),
);

/* --------------------------- user trades --------------------------- */

export const tradesRouter = Router();
tradesRouter.use(authenticate, requireActive);

tradesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const symbol = req.query.symbol as string | undefined;
    const filter: Record<string, unknown> = { $or: [{ makerUserId: req.user!.id }, { takerUserId: req.user!.id }] };
    if (symbol) filter.symbol = symbol.toUpperCase();
    const trades = await Trade.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, data: trades });
  }),
);
