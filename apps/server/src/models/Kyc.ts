import { Schema, model, type Document, type Types } from 'mongoose';

export type KycDocType = 'nid' | 'passport' | 'driving_license';
export type KycState = 'pending' | 'approved' | 'rejected';

export interface IKyc extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  docType: KycDocType;
  docNumber: string;
  fullName: string;
  dateOfBirth?: string | null;
  country?: string | null;
  frontImage: string;
  backImage?: string | null;
  selfie: string;
  status: KycState;
  reviewerId?: Types.ObjectId | null;
  rejectReason?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const kycSchema = new Schema<IKyc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    docType: { type: String, enum: ['nid', 'passport', 'driving_license'], required: true },
    docNumber: { type: String, required: true, trim: true, select: false },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: String, default: null },
    country: { type: String, default: null },
    frontImage: { type: String, required: true },
    backImage: { type: String, default: null },
    selfie: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rejectReason: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

kycSchema.index({ userId: 1, status: 1 });

export const Kyc = model<IKyc>('Kyc', kycSchema);
