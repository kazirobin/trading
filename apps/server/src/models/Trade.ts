import { Schema, model, type Document, type Types } from 'mongoose';
import { type Decimal128 } from 'mongodb';

type OrderSide = 'buy' | 'sell';

export interface ITrade extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  symbol: string;
  price: Decimal128;
  amount: Decimal128;
  quoteAmount: Decimal128;
  takerSide: OrderSide;
  makerOrderId: Types.ObjectId;
  takerOrderId: Types.ObjectId;
  makerUserId: Types.ObjectId;
  takerUserId: Types.ObjectId;
  makerFee: Decimal128;
  takerFee: Decimal128;
  feeCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}

const tradeSchema = new Schema<ITrade>(
  {
    symbol: { type: String, required: true, uppercase: true, index: true },
    price: { type: Schema.Types.Decimal128, required: true },
    amount: { type: Schema.Types.Decimal128, required: true },
    quoteAmount: { type: Schema.Types.Decimal128, required: true },
    takerSide: { type: String, enum: ['buy', 'sell'], required: true },
    makerOrderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    takerOrderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    makerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    takerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    makerFee: { type: Schema.Types.Decimal128, default: '0' },
    takerFee: { type: Schema.Types.Decimal128, default: '0' },
    feeCurrency: { type: String, default: 'USDT' },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

tradeSchema.index({ symbol: 1, createdAt: -1 });

export const Trade = model<ITrade>('Trade', tradeSchema);
