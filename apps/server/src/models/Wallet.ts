import { Schema, model, type Document, type Types } from 'mongoose';
import { type Decimal128 } from 'mongodb';

export interface IWallet extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  currency: string;
  totalBalance: Decimal128;
  lockedBalance: Decimal128;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currency: { type: String, required: true, uppercase: true, trim: true, maxlength: 12 },
    totalBalance: { type: Schema.Types.Decimal128, default: '0', required: true },
    lockedBalance: { type: Schema.Types.Decimal128, default: '0', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

walletSchema.index({ userId: 1, currency: 1 }, { unique: true });

walletSchema.virtual('availableBalance').get(function (this: IWallet) {
  const total = Number(this.totalBalance?.toString() ?? 0);
  const locked = Number(this.lockedBalance?.toString() ?? 0);
  return (total - locked).toFixed(8);
});

export const Wallet = model<IWallet>('Wallet', walletSchema);
