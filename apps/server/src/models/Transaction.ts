import { Schema, model, type Document, type Types } from 'mongoose';
import { type Decimal128 } from 'mongodb';

export type TxType =
  | 'deposit'
  | 'withdraw'
  | 'fee'
  | 'refund'
  | 'adjustment'
  | 'trade'
  | 'transfer';

export type TxStatus = 'pending' | 'completed' | 'failed' | 'canceled';

export interface ITransaction extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: TxType;
  currency: string;
  amount: Decimal128;
  balanceAfter: Decimal128 | null;
  status: TxStatus;
  method?: string | null;
  reference?: string | null;
  address?: string | null;
  txHash?: string | null;
  note?: string | null;
  meta?: Record<string, unknown>;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['deposit', 'withdraw', 'fee', 'refund', 'adjustment', 'trade', 'transfer'],
      required: true,
      index: true,
    },
    currency: { type: String, required: true, uppercase: true, trim: true },
    amount: { type: Schema.Types.Decimal128, required: true },
    balanceAfter: { type: Schema.Types.Decimal128, default: null },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'canceled'],
      default: 'completed',
      index: true,
    },
    method: { type: String, default: null },
    reference: { type: String, default: null, index: true },
    address: { type: String, default: null },
    txHash: { type: String, default: null },
    note: { type: String, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
