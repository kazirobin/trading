import { Schema, model, type Document, type Types } from 'mongoose';
import { type Decimal128 } from 'mongodb';

export type MarketStatus = 'trading' | 'halted' | 'delisted';

export interface IMarketPair extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: MarketStatus;
  enabled: boolean;
  pricePrecision: number;
  qtyPrecision: number;
  tickSize: Decimal128;
  stepSize: Decimal128;
  minNotional: Decimal128;
  makerFeePct: Decimal128;
  takerFeePct: Decimal128;
  lastPrice: Decimal128;
  change24hPct: Decimal128;
  high24h: Decimal128;
  low24h: Decimal128;
  volume24h: Decimal128;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const marketPairSchema = new Schema<IMarketPair>(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    baseAsset: { type: String, required: true, uppercase: true, trim: true },
    quoteAsset: { type: String, required: true, uppercase: true, trim: true },
    status: { type: String, enum: ['trading', 'halted', 'delisted'], default: 'trading', index: true },
    enabled: { type: Boolean, default: true, index: true },
    pricePrecision: { type: Number, default: 2, min: 0, max: 12 },
    qtyPrecision: { type: Number, default: 6, min: 0, max: 12 },
    tickSize: { type: Schema.Types.Decimal128, default: '0.01' },
    stepSize: { type: Schema.Types.Decimal128, default: '0.000001' },
    minNotional: { type: Schema.Types.Decimal128, default: '1' },
    makerFeePct: { type: Schema.Types.Decimal128, default: '0.1' },
    takerFeePct: { type: Schema.Types.Decimal128, default: '0.1' },
    lastPrice: { type: Schema.Types.Decimal128, default: '0' },
    change24hPct: { type: Schema.Types.Decimal128, default: '0' },
    high24h: { type: Schema.Types.Decimal128, default: '0' },
    low24h: { type: Schema.Types.Decimal128, default: '0' },
    volume24h: { type: Schema.Types.Decimal128, default: '0' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

export const MarketPair = model<IMarketPair>('MarketPair', marketPairSchema);
