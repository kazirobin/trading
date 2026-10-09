import { Schema, model, type Document, type Types } from 'mongoose';
import { type Decimal128 } from 'mongodb';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop_limit' | 'stop_market';
export type OrderStatus = 'open' | 'partial' | 'filled' | 'canceled' | 'rejected' | 'expired';

export interface IOrder extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price: Decimal128 | null;
  stopPrice: Decimal128 | null;
  amount: Decimal128;
  filled: Decimal128;
  remaining: Decimal128;
  avgFillPrice: Decimal128;
  quoteAmount: Decimal128;
  lockedCurrency: string;
  lockedAmount: Decimal128;
  feePaid: Decimal128;
  feeCurrency: string;
  triggered: boolean;
  cancelReason?: string | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    side: { type: String, enum: ['buy', 'sell'], required: true },
    type: { type: String, enum: ['market', 'limit', 'stop_limit', 'stop_market'], required: true },
    status: {
      type: String,
      enum: ['open', 'partial', 'filled', 'canceled', 'rejected', 'expired'],
      default: 'open',
      index: true,
    },
    price: { type: Schema.Types.Decimal128, default: null },
    stopPrice: { type: Schema.Types.Decimal128, default: null },
    amount: { type: Schema.Types.Decimal128, required: true },
    filled: { type: Schema.Types.Decimal128, default: '0' },
    remaining: { type: Schema.Types.Decimal128, required: true },
    avgFillPrice: { type: Schema.Types.Decimal128, default: '0' },
    quoteAmount: { type: Schema.Types.Decimal128, default: '0' },
    lockedCurrency: { type: String, required: true },
    lockedAmount: { type: Schema.Types.Decimal128, default: '0' },
    feePaid: { type: Schema.Types.Decimal128, default: '0' },
    feeCurrency: { type: String, default: '' },
    triggered: { type: Boolean, default: false },
    cancelReason: { type: String, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

// Order book lookups: best price first, FIFO for ties.
orderSchema.index({ symbol: 1, side: 1, status: 1, price: 1, createdAt: 1 });
// "My open orders" list.
orderSchema.index({ userId: 1, status: 1, createdAt: -1 });
// Stop trigger scan.
orderSchema.index({ status: 1, type: 1, triggered: 1 });

export const Order = model<IOrder>('Order', orderSchema);
