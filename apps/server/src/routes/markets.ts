import { Router } from 'express';
import { MarketPair } from '../models/MarketPair';
import { Order } from '../models/Order';
import { Trade } from '../models/Trade';
import { ApiError, asyncHandler } from '../utils/http';

export const marketsRouter = Router();

marketsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const pairs = await MarketPair.find({ enabled: true }).sort({ sortOrder: 1, symbol: 1 }).lean();
    res.json({ success: true, data: pairs });
  }),
);

marketsRouter.get(
  '/:symbol',
  asyncHandler(async (req, res) => {
    const pair = await MarketPair.findOne({ symbol: req.params.symbol.toUpperCase() }).lean();
    if (!pair) throw ApiError.notFound('Market not found');
    res.json({ success: true, data: pair });
  }),
);

marketsRouter.get(
  '/:symbol/depth',
  asyncHandler(async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const [bids, asks] = await Promise.all([
      aggregateSide(symbol, 'buy', limit),
      aggregateSide(symbol, 'sell', limit),
    ]);

    res.json({ success: true, data: { symbol, bids, asks } });
  }),
);

async function aggregateSide(symbol: string, side: 'buy' | 'sell', limit: number) {
  const sort = side === 'buy' ? -1 : 1;
  const rows = await Order.aggregate([
    { $match: { symbol, side, status: { $in: ['open', 'partial'] } } },
    { $sort: { price: sort } },
    {
      $group: {
        _id: '$price',
        price: { $first: '$price' },
        amount: { $sum: '$remaining' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: sort } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ price: Number(r._id.toString()), amount: Number(r.amount.toString()), orders: r.orders }));
}

marketsRouter.get(
  '/:symbol/trades',
  asyncHandler(async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const trades = await Trade.find({ symbol }).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, data: trades });
  }),
);
